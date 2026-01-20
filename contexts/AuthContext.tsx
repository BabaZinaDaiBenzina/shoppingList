'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { User, AuthContextType, LoginCredentials, RegisterCredentials } from '@/types/auth'

const CSRF_HEADER_NAME = 'x-csrf-token'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const refreshPromise = useRef<Promise<boolean> | null>(null)
  const hasTriedRefresh = useRef(false) // Защита от бесконечного цикла
  const refreshFailureTimer = useRef<NodeJS.Timeout | null>(null) // Таймер сброса флага

  // Загрузка CSRF токена
  const loadCSRFToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/csrf')
      if (response.ok) {
        const data = await response.json()
        setCsrfToken(data.token)
        return data.token
      }
    } catch (error) {
      console.error('Ошибка загрузки CSRF токена:', error)
    }
    return null
  }, [])

  // Функция для обновления токенов
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    // Предотвращаем параллельные refresh запросы
    if (isRefreshing) {
      console.log('[Auth] Refresh уже выполняется, возвращаем существующий promise')
      return refreshPromise.current || false
    }

    console.log('[Auth] Начинаем обновление токенов...')
    setIsRefreshing(true)

    const promise = (async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
        })

        console.log('[Auth] Refresh response status:', response.status)

        if (response.ok) {
          // Токены обновлены, получаем новые данные пользователя
          const meResponse = await fetch('/api/auth/me')

          console.log('[Auth] /api/auth/me response status:', meResponse.status)

          if (meResponse.ok) {
            const data = await meResponse.json()
            setUser(data.user)
            localStorage.setItem('user', JSON.stringify(data.user))
            console.log('[Auth] ✅ Токены успешно обновлены')

            // Сбрасываем флаг неудачной попытки
            hasTriedRefresh.current = false

            // Очищаем таймер сброса если есть
            if (refreshFailureTimer.current) {
              clearTimeout(refreshFailureTimer.current)
              refreshFailureTimer.current = null
            }

            return true
          } else {
            const error = await meResponse.json()
            console.error('[Auth] ❌ Ошибка /api/auth/me после refresh:', error)
          }
        } else {
          const error = await response.json()
          console.error('[Auth] ❌ Ошибка refresh токена:', error)
        }

        // Если refresh не удался, сбрасываем hasTriedRefresh через 5 минут
        // Это позволит попробовать снова через некоторое время
        if (refreshFailureTimer.current) {
          clearTimeout(refreshFailureTimer.current)
        }

        refreshFailureTimer.current = setTimeout(() => {
          console.log('[Auth] Сбрасываем hasTriedRefresh - можно пробовать снова')
          hasTriedRefresh.current = false
          refreshFailureTimer.current = null
        }, 5 * 60 * 1000) // 5 минут

        return false
      } catch (error) {
        console.error('[Auth] ❌ Исключение при обновлении токена:', error)

        // При ошибке сети тоже сбрасываем флаг через 5 минут
        if (refreshFailureTimer.current) {
          clearTimeout(refreshFailureTimer.current)
        }

        refreshFailureTimer.current = setTimeout(() => {
          console.log('[Auth] Сбрасываем hasTriedRefresh после ошибки сети')
          hasTriedRefresh.current = false
          refreshFailureTimer.current = null
        }, 5 * 60 * 1000)

        return false
      } finally {
        setIsRefreshing(false)
        refreshPromise.current = null
      }
    })()

    refreshPromise.current = promise
    return promise
  }, [isRefreshing])

  // Загрузка данных пользователя из localStorage при монтировании
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        console.log('[Auth] Загрузка данных авторизации...')

        // Загружаем CSRF токен
        await loadCSRFToken()

        // Загружаем только пользователя из localStorage для UI
        const storedUser = localStorage.getItem('user')

        if (storedUser) {
          const user = JSON.parse(storedUser)
          console.log('[Auth] Найден пользователь в localStorage:', user.username || user.email)
          setUser(user)
        }

        // Проверяем валидность сессии через API
        let response = await fetch('/api/auth/me')
        console.log('[Auth] Первая проверка /api/auth/me:', response.status)

        // Если access токен истек, пробуем обновить через refresh токен
        // Но только один раз, чтобы избежать бесконечного цикла
        if (!response.ok && response.status === 401 && !hasTriedRefresh.current) {
          console.log('[Auth] Access токен истек, пробуем refresh...')
          hasTriedRefresh.current = true
          const refreshed = await refreshTokens()

          if (refreshed) {
            console.log('[Auth] Refresh успешен, повторяем /api/auth/me')
            response = await fetch('/api/auth/me')
          } else {
            console.error('[Auth] ❌ Refresh не удался, пользователь будет выкинут')
          }
        }

        if (response.ok) {
          const data = await response.json()
          console.log('[Auth] ✅ Сессия валидна, пользователь:', data.user.username || data.user.email)
          setUser(data.user)
          localStorage.setItem('user', JSON.stringify(data.user))
        } else if (storedUser) {
          // Если сессия недействительна, очищаем данные
          console.warn('[Auth] ⚠️ Сессия недействительна, очищаем данные')
          localStorage.removeItem('user')
          setUser(null)
        } else {
          console.warn('[Auth] ⚠️ Пользователь не авторизован')
        }
      } catch (error) {
        console.error('[Auth] ❌ Ошибка загрузки данных авторизации:', error)
        // Очищаем поврежденные данные
        localStorage.removeItem('user')
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadAuthData()
  }, [loadCSRFToken, refreshTokens])

  // Функция для сохранения данных пользователя в localStorage
  const saveAuthData = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  // Функция для очистки данных авторизации
  const clearAuthData = () => {
    localStorage.removeItem('user')
    setUser(null)
  }

  // Регистрация
  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [CSRF_HEADER_NAME]: csrfToken || '',
        },
        body: JSON.stringify(credentials),
        // Cookie автоматически отправляется браузером
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при регистрации')
      }

      // Токен установлен в httpOnly cookie, сохраняем только пользователя
      saveAuthData(data.user)

      // Сбрасываем флаг попытки refresh после успешной авторизации
      hasTriedRefresh.current = false

      // Перезагружаем CSRF токен после регистрации
      await loadCSRFToken()
    } finally {
      setIsLoading(false)
    }
  }

  // Вход
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [CSRF_HEADER_NAME]: csrfToken || '',
        },
        body: JSON.stringify(credentials),
        // Cookie автоматически отправляется браузером
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при входе')
      }

      // Токен установлен в httpOnly cookie, сохраняем только пользователя
      saveAuthData(data.user)

      // Сбрасываем флаг попытки refresh после успешной авторизации
      hasTriedRefresh.current = false

      // Перезагружаем CSRF токен после входа
      await loadCSRFToken()
    } finally {
      setIsLoading(false)
    }
  }

  // Выход
  const logout = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          [CSRF_HEADER_NAME]: csrfToken || '',
        },
      })
    } catch (error) {
      console.error('Ошибка при выходе:', error)
    } finally {
      clearAuthData()
      setIsLoading(false)
    }
  }

  // Выход со всех устройств
  const logoutAll = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: {
          [CSRF_HEADER_NAME]: csrfToken || '',
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка при выходе со всех устройств')
      }
    } catch (error) {
      console.error('Ошибка при выходе со всех устройств:', error)
      throw error
    } finally {
      clearAuthData()
      setIsLoading(false)
    }
  }

  // Обновление данных пользователя
  const refreshUser = async () => {
    setIsLoading(true)
    try {
      // Cookie автоматически отправляется браузером
      const response = await fetch('/api/auth/me')

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при получении данных пользователя')
      }

      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error)
      // Если сессия недействительна, выходим
      clearAuthData()
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch wrapper с автоматическим обновлением токена и CSRF защитой
  const fetchWithAuth = useCallback(async (url: string, options?: RequestInit): Promise<Response> => {
    const method = options?.method?.toUpperCase()

    // Добавляем CSRF токен для mutating операций
    const headers: Record<string, string> = {
      ...(options?.headers as Record<string, string> || {}),
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '')) {
      headers[CSRF_HEADER_NAME] = csrfToken || ''
    }

    let response = await fetch(url, {
      ...options,
      headers,
    })

    // Если access токен истек (401), пробуем обновить
    // Но только один раз за сессию, чтобы избежать бесконечного цикла
    if (!response.ok && response.status === 401 && !isRefreshing && !hasTriedRefresh.current) {
      hasTriedRefresh.current = true
      const refreshed = await refreshTokens()

      // Если обновление успешно, повторяем запрос
      if (refreshed) {
        // Обновляем CSRF токен после refresh
        await loadCSRFToken()

        response = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            [CSRF_HEADER_NAME]: csrfToken || '',
          },
        })
      }
    }

    return response
  }, [csrfToken, isRefreshing, refreshTokens, loadCSRFToken])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isRefreshing,
    isAuthenticated: !!user, // Достаточно проверки user (токен в httpOnly cookie)
    login,
    register,
    logout,
    logoutAll,
    refreshUser,
    refreshTokens,
    fetchWithAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Хук для использования контекста авторизации
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth должен использоваться внутри AuthProvider')
  }
  return context
}
