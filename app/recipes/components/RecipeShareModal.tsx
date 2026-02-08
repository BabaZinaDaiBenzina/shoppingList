'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { haptics } from "@/lib/utils/haptic"
import type { User } from "@/types"

interface RecipeShare {
  id: string
  user: User
  createdAt: string
}

interface RecipeShareModalProps {
  recipeId: string
  recipeTitle: string
  isOpen: boolean
  onClose: () => void
}

export function RecipeShareModal({ recipeId, recipeTitle, isOpen, onClose }: RecipeShareModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [shares, setShares] = useState<RecipeShare[]>([])
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
  }, [isOpen, recipeId])

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
      const response = await fetch(`/api/recipes/${recipeId}/share`)
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
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
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

  const shareRecipe = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/recipes/${recipeId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId: selectedUser.id }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при предоставлении доступа')

      haptics.success()
      setShares([data.share, ...shares])
      setSearchQuery('')
      setSearchResults([])
      setSelectedUser(null)
    } catch (err) {
      haptics.error()
      alert(err instanceof Error ? err.message : 'Ошибка при предоставлении доступа')
    }
  }

  const removeShare = async (shareId: string, userId: string) => {
    haptics.tap()
    if (!confirm('Вы уверены, что хотите отменить доступ к рецепту?')) return

    try {
      const response = await fetch(`/api/recipes/${recipeId}/share?userId=${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка при удалении доступа')
      }

      haptics.success()
      setShares(shares.filter(s => s.id !== shareId))
    } catch (err) {
      haptics.error()
      alert(err instanceof Error ? err.message : 'Ошибка при удалении доступа')
    }
  }

  const handleClose = () => {
    haptics.tap()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Поделиться рецептом</DialogTitle>
          <DialogDescription className="truncate">
            &quot;{recipeTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Поиск пользователей */}
          <div className="space-y-3" ref={dropdownRef}>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Добавить пользователя
            </label>
            <div className="relative">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Введите имя или username..."
                className="pr-10"
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
                        haptics.tap()
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
              <Button
                onClick={shareRecipe}
                className="w-full"
              >
                Поделиться с {selectedUser.name || selectedUser.username}
              </Button>
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
                Рецепт пока недоступен другим пользователям
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeShare(share.id, share.user.id)}
                      className="ml-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Удалить доступ"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
