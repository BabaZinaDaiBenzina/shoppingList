import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types/auth'

const CSRF_HEADER_NAME = 'x-csrf-token'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isRefreshing: boolean
  csrfToken: string | null
  isAuthenticated: boolean
}

interface AuthActions {
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setRefreshing: (refreshing: boolean) => void
  setCsrfToken: (token: string | null) => void
  saveAuthData: (userData: User) => void
  clearAuthData: () => void
  loadCSRFToken: () => Promise<string | null>
  refreshTokens: () => Promise<boolean>
  login: (credentials: { email: string; password: string }) => Promise<void>
  register: (credentials: { email: string; username: string; password: string; name?: string }) => Promise<void>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  refreshUser: () => Promise<void>
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>
  initializeAuth: () => Promise<void>
}

interface AuthStore extends AuthState, AuthActions {
  // Private refs (not persisted)
  _hasTriedRefresh: boolean
  _refreshFailureTimer: NodeJS.Timeout | null
  _refreshPromise: Promise<boolean> | null
}

// Create store with persistence for user data
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoading: true,
      isRefreshing: false,
      csrfToken: null,
      isAuthenticated: false,

      // Private refs (not persisted)
      _hasTriedRefresh: false,
      _refreshFailureTimer: null,
      _refreshPromise: null,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      setRefreshing: (isRefreshing) => set({ isRefreshing }),
      setCsrfToken: (csrfToken) => set({ csrfToken }),

      saveAuthData: (userData) => {
        localStorage.setItem('user', JSON.stringify(userData))
        set({ user: userData, isAuthenticated: true })
      },

      clearAuthData: () => {
        localStorage.removeItem('user')
        set({ user: null, isAuthenticated: false })
      },

      loadCSRFToken: async () => {
        try {
          const response = await fetch('/api/auth/csrf')
          if (response.ok) {
            const data = await response.json()
            set({ csrfToken: data.token })
            return data.token
          }
        } catch (error) {
          console.error('Ошибка загрузки CSRF токена:', error)
        }
        return null
      },

      refreshTokens: async () => {
        const state = get()

        // Предотвращаем параллельные refresh запросы
        if (state.isRefreshing) {
          console.log('[Auth] Refresh уже выполняется, возвращаем существующий promise')
          return state._refreshPromise ?? Promise.resolve(false)
        }

        console.log('[Auth] Начинаем обновление токенов...')
        set({ isRefreshing: true })

        const promise = (async () => {
          try {
            const response = await fetch('/api/auth/refresh', { method: 'POST' })

            console.log('[Auth] Refresh response status:', response.status)

            if (response.ok) {
              const meResponse = await fetch('/api/auth/me')

              console.log('[Auth] /api/auth/me response status:', meResponse.status)

              if (meResponse.ok) {
                const data = await meResponse.json()
                set({ user: data.user, isAuthenticated: true })
                localStorage.setItem('user', JSON.stringify(data.user))
                console.log('[Auth] ✅ Токены успешно обновлены')

                // Сбрасываем флаг неудачной попытки
                set({ _hasTriedRefresh: false })

                // Очищаем таймер сброса если есть
                const timer = get()._refreshFailureTimer
                if (timer) {
                  clearTimeout(timer)
                  set({ _refreshFailureTimer: null })
                }

                return true
              }
            }

            // Если дошли сюда, значит refresh не удался
            return false
          } catch (error) {
            console.error('[Auth] ❌ Исключение при обновлении токена:', error)

            // При ошибке сети тоже сбрасываем флаг через 5 минут
            const timer = get()._refreshFailureTimer
            if (timer) {
              clearTimeout(timer)
            }

            const newTimer = setTimeout(() => {
              console.log('[Auth] Сбрасываем hasTriedRefresh после ошибки сети')
              set({ _hasTriedRefresh: false, _refreshFailureTimer: null })
            }, 5 * 60 * 1000)

            set({ _refreshFailureTimer: newTimer })

            return false
          } finally {
            set({ isRefreshing: false, _refreshPromise: null })
          }
        })()

        set({ _refreshPromise: promise })
        return promise
      },

      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const state = get()
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              [CSRF_HEADER_NAME]: state.csrfToken || '',
            },
            body: JSON.stringify(credentials),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Ошибка при входе')
          }

          get().saveAuthData(data.user)
          set({ _hasTriedRefresh: false })
          await get().loadCSRFToken()
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (credentials) => {
        set({ isLoading: true })
        try {
          const state = get()
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              [CSRF_HEADER_NAME]: state.csrfToken || '',
            },
            body: JSON.stringify(credentials),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Ошибка при регистрации')
          }

          get().saveAuthData(data.user)
          set({ _hasTriedRefresh: false })
          await get().loadCSRFToken()
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          const state = get()
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              [CSRF_HEADER_NAME]: state.csrfToken || '',
            },
          })
        } catch (error) {
          console.error('Ошибка при выходе:', error)
        } finally {
          get().clearAuthData()
          set({ isLoading: false })
        }
      },

      logoutAll: async () => {
        set({ isLoading: true })
        try {
          const state = get()
          const response = await fetch('/api/auth/logout-all', {
            method: 'POST',
            headers: {
              [CSRF_HEADER_NAME]: state.csrfToken || '',
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
          get().clearAuthData()
          set({ isLoading: false })
        }
      },

      refreshUser: async () => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/me')
          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Ошибка при получении данных пользователя')
          }

          set({ user: data.user, isAuthenticated: true })
          localStorage.setItem('user', JSON.stringify(data.user))
        } catch (error) {
          console.error('Ошибка обновления пользователя:', error)
          get().clearAuthData()
        } finally {
          set({ isLoading: false })
        }
      },

      fetchWithAuth: async (url, options) => {
        const state = get()
        const method = options?.method?.toUpperCase()

        const headers: Record<string, string> = {
          ...(options?.headers as Record<string, string> || {}),
        }

        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '')) {
          headers[CSRF_HEADER_NAME] = state.csrfToken || ''
        }

        let response = await fetch(url, {
          ...options,
          headers,
        })

        // Если access токен истек (401), пробуем обновить
        if (!response.ok && response.status === 401 && !state.isRefreshing && !state._hasTriedRefresh) {
          set({ _hasTriedRefresh: true })
          const refreshed = await get().refreshTokens()

          if (refreshed) {
            await get().loadCSRFToken()

            response = await fetch(url, {
              ...options,
              headers: {
                ...headers,
                [CSRF_HEADER_NAME]: get().csrfToken || '',
              },
            })
          }
        }

        return response
      },

      initializeAuth: async () => {
        try {
          console.log('[Auth] Загрузка данных авторизации...')

          await get().loadCSRFToken()

          const storedUser = localStorage.getItem('user')

          if (storedUser) {
            const user = JSON.parse(storedUser)
            console.log('[Auth] Найден пользователь в localStorage:', user.username || user.email)
            set({ user, isAuthenticated: true })
          }

          let response = await fetch('/api/auth/me')
          console.log('[Auth] Первая проверка /api/auth/me:', response.status)

          const state = get()
          if (!response.ok && response.status === 401 && !state._hasTriedRefresh) {
            console.log('[Auth] Access токен истек, пробуем refresh...')
            set({ _hasTriedRefresh: true })
            const refreshed = await get().refreshTokens()

            if (refreshed) {
              console.log('[Auth] Refresh успешен, повторяем /api/auth/me')
              response = await fetch('/api/auth/me')
            }
          }

          if (response.ok) {
            const data = await response.json()
            console.log('[Auth] ✅ Сессия валидна, пользователь:', data.user.username || data.user.email)
            set({ user: data.user, isAuthenticated: true })
            localStorage.setItem('user', JSON.stringify(data.user))
          } else if (storedUser) {
            console.warn('[Auth] ⚠️ Сессия недействительна, очищаем данные')
            localStorage.removeItem('user')
            set({ user: null, isAuthenticated: false })
          } else {
            console.warn('[Auth] ⚠️ Пользователь не авторизован')
          }
        } catch (error) {
          console.error('[Auth] ❌ Ошибка загрузки данных авторизации:', error)
          localStorage.removeItem('user')
          set({ user: null, isAuthenticated: false })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Persist only user data, not loading states
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
