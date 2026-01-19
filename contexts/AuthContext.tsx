'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, AuthContextType, LoginCredentials, RegisterCredentials } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Загрузка данных пользователя из localStorage при монтировании
  // Токен теперь в httpOnly cookie - недоступен из JavaScript
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        // Загружаем только пользователя из localStorage для UI
        const storedUser = localStorage.getItem('user')

        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }

        // Проверяем валидность сессии через API
        const response = await fetch('/api/auth/me')

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          localStorage.setItem('user', JSON.stringify(data.user))
        } else if (storedUser) {
          // Если сессия недействительна, очищаем данные
          localStorage.removeItem('user')
          setUser(null)
        }
      } catch (error) {
        console.error('Ошибка загрузки данных авторизации:', error)
        // Очищаем поврежденные данные
        localStorage.removeItem('user')
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadAuthData()
  }, [])

  // Функция для сохранения данных пользователя в localStorage
  // Токен НЕ сохраняем - он в httpOnly cookie
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
      })
    } catch (error) {
      console.error('Ошибка при выходе:', error)
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

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user, // Достаточно проверки user (токен в httpOnly cookie)
    login,
    register,
    logout,
    refreshUser,
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
