'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { GroupedShoppingListCard } from './components/GroupedShoppingListCard'
import { ProductSelector } from './components/ProductSelector'
import { ProductManager } from './components/ProductManager'
import { ShareModal } from './components/ShareModal'

interface Product {
  id: string
  name: string
  unit: string | null
  category: {
    id: string
    name: string
    icon: string | null
  }
}

interface Item {
  id: string
  name: string
  quantity: number
  purchased: boolean
  product?: Product | null
}

interface ShoppingList {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  items: Item[]
  isShared?: boolean
  isOwner?: boolean
  user?: {
    id: string
    username: string
    name: string | null
  }
}

export default function ListsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // State
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [newListName, setNewListName] = useState('')
  const [expandedListId, setExpandedListId] = useState<string | null>(null)
  const [newItemNames, setNewItemNames] = useState<Record<string, string>>({})
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [shareModalListId, setShareModalListId] = useState<string | null>(null)
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [showProductManager, setShowProductManager] = useState(false)

  // Effects
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchShoppingLists()
    }
  }, [isAuthenticated])

  // Scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Pull-to-refresh
  useEffect(() => {
    let startY = 0
    let isPulling = false

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY
        isPulling = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || window.scrollY > 0) return

      const currentY = e.touches[0].clientY
      const diff = currentY - startY

      if (diff > 150 && !isRefreshing) {
        setIsRefreshing(true)
        fetchShoppingLists().finally(() => {
          setIsRefreshing(false)
        })
        isPulling = false
      }
    }

    const handleTouchEnd = () => {
      isPulling = false
    }

    window.addEventListener('touchstart', handleTouchStart)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isRefreshing])

  // Auto-hide error messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

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
  const addItem = async (listId: string, itemName: string, productId?: string) => {
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
        body: JSON.stringify({
          name: itemName.trim(),
          quantity: 1,
          productId: productId || null
        }),
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

  const addProductFromCatalog = (product: Product, quantity: number) => {
    if (!expandedListId) {
      setError('Откройте список, чтобы добавлять товары')
      return
    }
    addItem(expandedListId, product.name, product.id)
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

  const deselectAll = async (listId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/shopping-lists/${listId}/deselect-all`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при снятии выделения')

      setShoppingLists(lists =>
        lists.map(list =>
          list.id === listId
            ? { ...list, items: data.items }
            : list
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при снятии выделения')
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-zinc-300 border-t-blue-600"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400 text-base">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-4 md:py-8 px-3 md:px-4 relative">
      {/* Индикатор обновления */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white py-2 px-4 text-center text-sm font-medium">
          Обновление...
        </div>
      )}

      {/* Кнопка наверх */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all active:scale-95 min-w-[48px] min-h-[48px] flex items-center justify-center"
          aria-label="Наверх"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Заголовок и форма создания */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              🛒 Списки покупок
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowProductManager(true)}
                className="px-4 py-3 md:py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 active:scale-95 min-h-[48px] text-base md:text-sm"
              >
                <span>⚙️</span>
                Управление
              </button>
              <button
                onClick={() => setShowProductSelector(true)}
                className="px-4 py-3 md:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 active:scale-95 min-h-[48px] text-base md:text-sm"
              >
                <span>📦</span>
                Каталог
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={createList} className="flex gap-2 md:gap-3">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Название нового списка..."
              className="flex-1 min-w-0 px-4 py-3 text-base border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white min-h-[48px]"
            />
            <button
              type="submit"
              className="px-4 md:px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors active:scale-95 min-h-[48px] text-base whitespace-nowrap"
            >
              Создать
            </button>
          </form>
        </div>

        {/* Списки */}
        <div className="space-y-4">
          {shoppingLists.length === 0 ? (
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 md:p-12 text-center">
              <div className="text-5xl md:text-6xl mb-4">📝</div>
              <h2 className="text-xl md:text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Пока нет списков
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-base">
                Создайте свой первый список покупок!
              </p>
            </div>
          ) : (
            shoppingLists.map((list) => (
              <GroupedShoppingListCard
                key={list.id}
                list={list}
                isExpanded={expandedListId === list.id}
                onToggle={(id) => setExpandedListId(expandedListId === id ? null : id)}
                onDelete={deleteList}
                onShare={list.isOwner ? (id) => setShareModalListId(id) : undefined}
                onAddItem={addItem}
                onToggleItem={toggleItem}
                onDeleteItem={deleteItem}
                onDeselectAll={deselectAll}
                newItemName={newItemNames[list.id] || ''}
                onItemNameChange={(id, name) =>
                  setNewItemNames({ ...newItemNames, [id]: name })
                }
              />
            ))
          )}
        </div>

        {/* Модальное окно обмена списком */}
        {shareModalListId && (
          <ShareModal
            listId={shareModalListId}
            listName={shoppingLists.find(l => l.id === shareModalListId)?.name || ''}
            isOpen={!!shareModalListId}
            onClose={() => setShareModalListId(null)}
          />
        )}

        {/* Модальное окно выбора продуктов */}
        <ProductSelector
          isOpen={showProductSelector}
          onClose={() => setShowProductSelector(false)}
          onAddProduct={addProductFromCatalog}
          isItemInList={isItemInList}
          hasOpenList={!!expandedListId}
        />

        {/* Модальное окно управления каталогом */}
        <ProductManager
          isOpen={showProductManager}
          onClose={() => setShowProductManager(false)}
        />
      </div>
    </div>
  )
}
