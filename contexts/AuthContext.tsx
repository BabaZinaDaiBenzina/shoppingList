'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User, AuthContextType, LoginCredentials, RegisterCredentials } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Загрузка данных из localStorage при монтировании
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error('Ошибка загрузки данных авторизации:', error)
        // Очищаем поврежденные данные
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }

    loadAuthData()
  }, [])

  // Функция для сохранения данных в localStorage
  const saveAuthData = (userData: User, authToken: string) => {
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(authToken)
    setUser(userData)
  }

  // Функция для очистки данных авторизации
  const clearAuthData = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
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
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при регистрации')
      }

      saveAuthData(data.user, data.token)
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
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при входе')
      }

      saveAuthData(data.user, data.token)
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
    if (!token) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при получении данных пользователя')
      }

      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error)
      // Если токен недействителен, выходим
      clearAuthData()
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
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
