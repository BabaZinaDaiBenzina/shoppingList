'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ShoppingListCard } from './components/ShoppingListCard'
import { RecommendationsPanel } from './components/RecommendationsPanel'

interface Item {
  id: string
  name: string
  quantity: number
  purchased: boolean
}

interface ShoppingList {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  items: Item[]
}

interface GroceryCategory {
  id: string
  name: string
  icon: string
  items: string[]
}

export default function ListsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // State
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [recommendations, setRecommendations] = useState<GroceryCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [newListName, setNewListName] = useState('')
  const [expandedListId, setExpandedListId] = useState<string | null>(null)
  const [newItemNames, setNewItemNames] = useState<Record<string, string>>({})
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Effects
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchShoppingLists()
      fetchRecommendations()
    }
  }, [isAuthenticated])

  // API calls
  const fetchShoppingLists = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/shopping-lists', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при загрузке списков')

      setShoppingLists(data.shoppingLists)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке списков')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/recommendations', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при загрузке рекомендаций')

      setRecommendations(data.recommendations)
    } catch (err) {
      console.error('Ошибка загрузки рекомендаций:', err)
    }
  }

  // Lists operations
  const createList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newListName }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при создании списка')

      setShoppingLists([data.shoppingList, ...shoppingLists])
      setNewListName('')
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании списка')
    }
  }

  const deleteList = async (listId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка при удалении списка')
      }

      setShoppingLists(shoppingLists.filter(list => list.id !== listId))
      if (expandedListId === listId) setExpandedListId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении списка')
    }
  }

  // Items operations
  const addItem = async (listId: string, itemName: string) => {
    if (!itemName?.trim()) return

    const list = shoppingLists.find(l => l.id === listId)
    if (list) {
      const exists = list.items.some(
        item => item.name.toLowerCase() === itemName.toLowerCase().trim()
      )
      if (exists) {
        setError(`Товар "${itemName}" уже есть в списке`)
        return
      }
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: itemName.trim(), quantity: 1 }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при добавлении товара')

      setShoppingLists(lists =>
        lists.map(list =>
          list.id === listId
            ? { ...list, items: [...list.items, data.item] }
            : list
        )
      )

      setNewItemNames({ ...newItemNames, [listId]: '' })
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении товара')
    }
  }

  const toggleItem = async (listId: string, itemId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/items/${itemId}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при обновлении товара')

      setShoppingLists(lists =>
        lists.map(list =>
          list.id === listId
            ? {
                ...list,
                items: list.items.map(item =>
                  item.id === itemId ? data.item : item
                ),
              }
            : list
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении товара')
    }
  }

  const deleteItem = async (listId: string, itemId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка при удалении товара')
      }

      setShoppingLists(lists =>
        lists.map(list =>
          list.id === listId
            ? { ...list, items: list.items.filter(item => item.id !== itemId) }
            : list
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении товара')
    }
  }

  // Recommendations operations
  const addItemFromRecommendations = async (itemName: string) => {
    if (!expandedListId) {
      setError('Откройте список, чтобы добавлять товары')
      return
    }

    const listId = expandedListId
    const list = shoppingLists.find(l => l.id === listId)

    if (list) {
      const exists = list.items.some(
        item => item.name.toLowerCase() === itemName.toLowerCase()
      )
      if (exists) return // Пропускаем, если уже есть
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: itemName, quantity: 1 }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при добавлении товара')

      setShoppingLists(lists =>
        lists.map(list =>
          list.id === listId
            ? { ...list, items: [...list.items, data.item] }
            : list
        )
      )

      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении товара')
    }
  }

  const addCategoryToList = async (categoryItems: string[]) => {
    if (!expandedListId) {
      setError('Откройте список, чтобы добавлять товары')
      return
    }

    const listId = expandedListId
    const list = shoppingLists.find(l => l.id === listId)
    if (!list) return

    const itemsToAdd = categoryItems.filter(itemName => {
      return !list.items.some(
        item => item.name.toLowerCase() === itemName.toLowerCase()
      )
    })

    if (itemsToAdd.length === 0) {
      setError('Все товары из этой категории уже в списке')
      return
    }

    const token = localStorage.getItem('token')
    const promises = itemsToAdd.map(itemName =>
      fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: itemName, quantity: 1 }),
      })
    )

    try {
      const responses = await Promise.all(promises)
      const newItems = await Promise.all(
        responses.map(async res => {
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          return data.item
        })
      )

      setShoppingLists(lists =>
        lists.map(list =>
          list.id === listId
            ? { ...list, items: [...list.items, ...newItems] }
            : list
        )
      )

      setError(`Добавлено ${newItems.length} товаров`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении товаров')
    }
  }

  // Helper functions
  const isItemInList = (itemName: string) => {
    if (!expandedListId) return false
    const list = shoppingLists.find(l => l.id === expandedListId)
    if (!list) return false
    return list.items.some(
      item => item.name.toLowerCase() === itemName.toLowerCase()
    )
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-zinc-300 border-t-blue-600"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок и форма создания */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              🛒 Списки покупок
            </h1>
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span>💡</span>
              Рекомендации
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {showRecommendations && (
            <RecommendationsPanel
              recommendations={recommendations}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              onAddItem={addItemFromRecommendations}
              onAddCategory={addCategoryToList}
              isItemInList={isItemInList}
              hasOpenList={!!expandedListId}
            />
          )}

          <form onSubmit={createList} className="flex gap-3">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Название нового списка..."
              className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Создать
            </button>
          </form>
        </div>

        {/* Списки */}
        <div className="space-y-4">
          {shoppingLists.length === 0 ? (
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Пока нет списков
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Создайте свой первый список покупок!
              </p>
            </div>
          ) : (
            shoppingLists.map((list) => (
              <ShoppingListCard
                key={list.id}
                list={list}
                isExpanded={expandedListId === list.id}
                onToggle={(id) => setExpandedListId(expandedListId === id ? null : id)}
                onDelete={deleteList}
                onAddItem={addItem}
                onToggleItem={toggleItem}
                onDeleteItem={deleteItem}
                newItemName={newItemNames[list.id] || ''}
                onItemNameChange={(id, name) =>
                  setNewItemNames({ ...newItemNames, [id]: name })
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
