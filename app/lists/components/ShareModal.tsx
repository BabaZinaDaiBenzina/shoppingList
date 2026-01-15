'use client'

import { useState, useEffect, useRef } from 'react'

interface User {
  id: string
  username: string
  name: string | null
  email: string
}

interface Share {
  id: string
  user: User
  createdAt: string
}

interface ShareModalProps {
  listId: string
  listName: string
  isOpen: boolean
  onClose: () => void
}

export function ShareModal({ listId, listName, isOpen, onClose }: ShareModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [shares, setShares] = useState<Share[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingShares, setIsLoadingShares] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Загружаем список пользователей, с которыми поделились
  useEffect(() => {
    if (isOpen) {
      fetchShares()
    }
  }, [isOpen, listId])

  // Поиск пользователей с debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(searchQuery)
      }, 300)
    } else {
      setSearchResults([])
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSearchResults([])
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchShares = async () => {
    setIsLoadingShares(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/shopping-lists/${listId}/share`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при загрузке списка')

      setShares(data.shares || [])
    } catch (err) {
      console.error('Ошибка при загрузке списка доступов:', err)
    } finally {
      setIsLoadingShares(false)
    }
  }

  const searchUsers = async (query: string) => {
    setIsSearching(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при поиске')

      // Фильтруем пользователей, с которыми уже поделились
      const sharedUserIds = shares.map(s => s.user.id)
      const filteredUsers = (data.users || []).filter((u: User) => !sharedUserIds.includes(u.id))

      setSearchResults(filteredUsers)
    } catch (err) {
      console.error('Ошибка при поиске пользователей:', err)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const shareList = async () => {
    if (!selectedUser) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/shopping-lists/${listId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: selectedUser.id }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при предоставлении доступа')

      // Добавляем нового пользователя в список
      setShares([data.share, ...shares])
      setSearchQuery('')
      setSearchResults([])
      setSelectedUser(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка при предоставлении доступа')
    }
  }

  const removeShare = async (shareId: string, userId: string) => {
    if (!confirm('Вы уверены, что хотите отменить доступ к списку?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/shopping-lists/${listId}/share?userId=${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка при удалении доступа')
      }

      setShares(shares.filter(s => s.id !== shareId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка при удалении доступа')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                Поделиться списком
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 truncate">
                "{listName}"
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Поиск пользователей */}
          <div className="space-y-3" ref={dropdownRef}>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Добавить пользователя
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Введите имя или username..."
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-zinc-300 border-t-blue-600"></div>
                </div>
              )}

              {/* Dropdown с результатами поиска */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user)
                        setSearchQuery(user.name || user.username)
                        setSearchResults([])
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors border-b border-zinc-100 dark:border-zinc-700 last:border-0"
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-50">
                        {user.name || user.username}
                      </div>
                      {user.name && user.username !== user.name && (
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          @{user.username}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Кнопка поделиться */}
            {selectedUser && (
              <button
                onClick={shareList}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Поделиться с {selectedUser.name || selectedUser.username}
              </button>
            )}
          </div>

          {/* Список пользователей, с которыми поделились */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Доступно пользователям
            </label>

            {isLoadingShares ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                Загрузка...
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                Список пока недоступен другим пользователям
              </div>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                        {share.user.name || share.user.username}
                      </div>
                      {share.user.name && share.user.username !== share.user.name && (
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          @{share.user.username}
                        </div>
                      )}
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        {new Date(share.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                    <button
                      onClick={() => removeShare(share.id, share.user.id)}
                      className="ml-3 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Удалить доступ"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
