'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { GroupedShoppingListCard } from './components/GroupedShoppingListCard'
import { ProductSelector } from './components/ProductSelector'
import { ProductManager } from './components/ProductManager'
import { ShareModal } from './components/ShareModal'
import { useOfflineData } from '@/hooks/useOfflineData'
import { indexedDB } from '@/lib/services/indexedDB'

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

interface Category {
  id: string
  name: string
  icon: string | null
}

export default function ListsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { isOnline, isInitialized, getOfflineLists, saveOfflineList, deleteOfflineList, enqueueOperation } = useOfflineData()

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
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  // Effects
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchShoppingLists()
      fetchCategories()
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
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch('/api/shopping-lists')

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при загрузке списков')

      setShoppingLists(data.shoppingLists)

      // Сохраняем в IndexedDB
      for (const list of data.shoppingLists) {
        await saveOfflineList(list)
      }
    } catch (err) {
      // Если ошибка сети или офлайн, пробуем загрузить из IndexedDB
      if (isInitialized) {
        const offlineLists = await getOfflineLists()
        if (offlineLists.length > 0) {
          setShoppingLists(offlineLists)
          setError('Офлайн режим. Показаны локально сохраненные данные.')
        } else {
          setError(err instanceof Error ? err.message : 'Ошибка при загрузке списков')
        }
      } else {
        setError(err instanceof Error ? err.message : 'Ошибка при загрузке списков')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch('/api/categories')

      const data = await response.json()
      if (response.ok) {
        setCategories(data.categories)
      }
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err)
    }
  }

  // Lists operations
  const createList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return

    // Генерируем временный ID для офлайн режима
    const tempId = `temp-${Date.now()}`

    if (!isOnline) {
      // Офлайн режим: создаем локально
      const tempList = {
        id: tempId,
        name: newListName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: [],
        isOwner: true
      }

      setShoppingLists([tempList, ...shoppingLists])
      await saveOfflineList(tempList)

      // Добавляем в очередь синхронизации
      await enqueueOperation('CREATE', '/api/shopping-lists', 'POST', { name: newListName })

      setNewListName('')
      setError('Список создан офлайн. Синхронизация при подключении к сети.')
      return
    }

    // Онлайн режим: отправляем на сервер
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newListName }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при создании списка')

      setShoppingLists([data.shoppingList, ...shoppingLists])
      await saveOfflineList(data.shoppingList)
      setNewListName('')
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании списка')
    }
  }

  const deleteList = async (listId: string) => {
    if (!isOnline) {
      // Офлайн режим: удаляем локально и добавляем в очередь
      setShoppingLists(shoppingLists.filter(list => list.id !== listId))
      await deleteOfflineList(listId)
      await enqueueOperation('DELETE', `/api/shopping-lists/${listId}`, 'DELETE')
      if (expandedListId === listId) setExpandedListId(null)
      setError('Список удален офлайн. Синхронизация при подключении к сети.')
      return
    }

    // Онлайн режим
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Ошибка при удалении списка')
      }

      setShoppingLists(shoppingLists.filter(list => list.id !== listId))
      await deleteOfflineList(listId)
      if (expandedListId === listId) setExpandedListId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при удалении списка')
    }
  }

  // Items operations
  const addItem = async (listId: string, itemName: string, productId?: string, categoryId?: string) => {
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

    const tempItemId = `temp-${Date.now()}`
    const trimmedName = itemName.trim()

    if (!isOnline) {
      // Офлайн режим
      const tempItem = {
        id: tempItemId,
        name: trimmedName,
        quantity: 1,
        purchased: false
      }

      setShoppingLists(lists =>
        lists.map(list =>
          list.id === listId
            ? { ...list, items: [...list.items, tempItem] }
            : list
        )
      )

      // Обновляем в IndexedDB
      const updatedList = shoppingLists.find(l => l.id === listId)
      if (updatedList) {
        await saveOfflineList({ ...updatedList, items: [...updatedList.items, tempItem] })
      }

      await enqueueOperation('CREATE', `/api/shopping-lists/${listId}/items`, 'POST', {
        name: trimmedName,
        quantity: 1,
        productId: productId || null,
        categoryId: categoryId || null
      })

      setNewItemNames({ ...newItemNames, [listId]: '' })
      setError('Товар добавлен офлайн. Синхронизация при подключении к сети.')
      return
    }

    // Онлайн режим
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          quantity: 1,
          productId: productId || null,
          categoryId: categoryId || null
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

      // Сохраняем обновленный список в IndexedDB
      const updatedList = shoppingLists.find(l => l.id === listId)
      if (updatedList) {
        await saveOfflineList({ ...updatedList, items: [...updatedList.items, data.item] })
      }

      setNewItemNames({ ...newItemNames, [listId]: '' })
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении товара')
    }
  }

  const addProductFromCatalog = (product: Product, _quantity: number) => {
    if (!expandedListId) {
      setError('Откройте список, чтобы добавлять товары')
      return
    }
    addItem(expandedListId, product.name, product.id)
  }

  const toggleItem = async (listId: string, itemId: string) => {
    // Находим товар и переключаем его статус локально
    const list = shoppingLists.find(l => l.id === listId)
    const item = list?.items.find(i => i.id === itemId)

    if (!item) return

    const updatedItem = { ...item, purchased: !item.purchased }

    // Обновляем UI сразу для отзывчивости
    setShoppingLists(lists =>
      lists.map(list =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map(item =>
                item.id === itemId ? updatedItem : item
              ),
            }
          : list
      )
    )

    if (!isOnline) {
      // Офлайн режим: сохраняем локально и добавляем в очередь
      const updatedList = shoppingLists.find(l => l.id === listId)
      if (updatedList) {
        const listWithUpdatedItem = {
          ...updatedList,
          items: updatedList.items.map(i => i.id === itemId ? updatedItem : i)
        }
        await saveOfflineList(listWithUpdatedItem)
      }

      await enqueueOperation('UPDATE', `/api/items/${itemId}/toggle`, 'PATCH')
      setError('Статус изменен офлайн. Синхронизация при подключении к сети.')
      return
    }

    // Онлайн режим
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch(`/api/items/${itemId}/toggle`, {
        method: 'PATCH',
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

      // Сохраняем в IndexedDB
      const updatedList = shoppingLists.find(l => l.id === listId)
      if (updatedList) {
        const listWithUpdatedItem = {
          ...updatedList,
          items: updatedList.items.map(i => i.id === itemId ? data.item : i)
        }
        await saveOfflineList(listWithUpdatedItem)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении товара')
    }
  }

  const deleteItem = async (listId: string, itemId: string) => {
    if (!isOnline) {
      // Офлайн режим
      setShoppingLists(lists =>
        lists.map(list =>
          list.id === listId
            ? { ...list, items: list.items.filter(item => item.id !== itemId) }
            : list
        )
      )

      const updatedList = shoppingLists.find(l => l.id === listId)
      if (updatedList) {
        await saveOfflineList({
          ...updatedList,
          items: updatedList.items.filter(i => i.id !== itemId)
        })
      }

      await enqueueOperation('DELETE', `/api/items/${itemId}`, 'DELETE')
      setError('Товар удален офлайн. Синхронизация при подключении к сети.')
      return
    }

    // Онлайн режим
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
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
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch(`/api/shopping-lists/${listId}/deselect-all`, {
        method: 'PATCH',
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
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={setSelectedCategoryId}
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
