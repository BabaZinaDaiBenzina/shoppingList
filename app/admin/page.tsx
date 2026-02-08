'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import type { UserWithLists } from '@/types'

export default function AdminPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const router = useRouter()

  const [users, setUsers] = useState<UserWithLists[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'user' | 'list', id: string, name: string } | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'admin') {
      router.push('/lists')
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchUsers()
    }
  }, [isAuthenticated, user])

  const fetchUsers = async () => {
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch('/api/admin/users')

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/login')
          return
        }
        throw new Error('Ошибка при загрузке пользователей')
      }

      const data = await response.json()
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке пользователей')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка при удалении пользователя')
      }

      setDeleteConfirm(null)
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении пользователя')
    }
  }

  const deleteShoppingList = async (listId: string) => {
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch(`/api/admin/shopping-lists/${listId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка при удалении списка')
      }

      setDeleteConfirm(null)
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении списка')
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Панель администратора</h1>
              <p className="text-gray-600">Управление пользователями и списками покупок</p>
            </div>
            <button
              onClick={() => router.push('/admin/roadmap')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              📋 Roadmap
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError('')}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Закрыть
            </button>
          </div>
        )}

        {/* Users list */}
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* User header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {user.name || user.username}
                      </h3>
                      {user.role === 'admin' && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          Администратор
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-1">
                      <span className="font-medium">Email:</span> {user.email}
                    </p>
                    <p className="text-gray-600 text-sm mb-1">
                      <span className="font-medium">Username:</span> {user.username}
                    </p>
                    <p className="text-gray-600 text-sm mb-3">
                      <span className="font-medium">Зарегистрирован:</span>{' '}
                      {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-600">
                        📝 {user._count.shoppingLists} списков
                      </span>
                      <span className="text-gray-600">
                        🍳 {user._count.recipes} рецептов
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      {expandedUserId === user.id ? 'Свернуть' : 'Списки'}
                    </button>
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => setDeleteConfirm({
                          type: 'user',
                          id: user.id,
                          name: user.name || user.username
                        })}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Shopping lists */}
              {expandedUserId === user.id && user.shoppingLists.length > 0 && (
                <div className="p-6 bg-gray-50">
                  <h4 className="text-lg font-semibold text-gray-700 mb-4">Списки покупок</h4>
                  <div className="grid gap-3">
                    {user.shoppingLists.map((list) => (
                      <div
                        key={list.id}
                        className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between"
                      >
                        <div>
                          <h5 className="font-medium text-gray-800">{list.name}</h5>
                          <p className="text-sm text-gray-600">
                            {list._count.items} предметов • Обновлен{' '}
                            {new Date(list.updatedAt).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        <button
                          onClick={() => setDeleteConfirm({
                            type: 'list',
                            id: list.id,
                            name: list.name
                          })}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {expandedUserId === user.id && user.shoppingLists.length === 0 && (
                <div className="p-6 bg-gray-50 text-center text-gray-500">
                  Нет списков покупок
                </div>
              )}
            </div>
          ))}
        </div>

        {users.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            Пользователей нет
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Подтверждение удаления
            </h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить {deleteConfirm.type === 'user' ? 'пользователя' : 'список'} &quot;<strong>{deleteConfirm.name}</strong>&quot;?
              {deleteConfirm.type === 'user' && (
                <span className="block mt-2 text-red-600">
                  Все данные пользователя (списки, рецепты) будут безвозвратно удалены!
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'user') {
                    deleteUser(deleteConfirm.id)
                  } else {
                    deleteShoppingList(deleteConfirm.id)
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
