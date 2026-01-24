'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { GroupedShoppingListCard } from './components/GroupedShoppingListCard'
import { ProductSelector } from './components/ProductSelector'
import { ProductManager } from './components/ProductManager'
import { ShareModal } from './components/ShareModal'
import { SearchAndFilter } from './components/SearchAndFilter'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TemplatesModal } from './components/TemplatesModal'
import { SaveAsTemplateModal } from './components/SaveAsTemplateModal'
import { haptics } from '@/lib/utils/haptic'
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
  unit: string | null
  purchased: boolean
  createdAt: string
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
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [saveAsTemplateListId, setSaveAsTemplateListId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'purchased' | 'unpurchased'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date')

  // Loading states для мутаций
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [isDeletingList, setIsDeletingList] = useState<Record<string, boolean>>({})
  const [isAddingItem, setIsAddingItem] = useState<Record<string, boolean>>({})
  const [isDeletingItem, setIsDeletingItem] = useState<Record<string, boolean>>({})
  const [isUpdatingItem, setIsUpdatingItem] = useState<Record<string, boolean>>({})
  const [isTogglingItem, setIsTogglingItem] = useState<Record<string, boolean>>({})
  const [isDeselectAll, setIsDeselectAll] = useState<Record<string, boolean>>({})

  // Confirm dialogs
  const [deleteListConfirm, setDeleteListConfirm] = useState<string | null>(null)
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<{ listId: string; itemId: string } | null>(null)

  // Effects
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return

    const abortController = new AbortController()

    const loadData = async () => {
      try {
        await Promise.all([
          fetchShoppingLists(abortController.signal),
          fetchCategories(abortController.signal)
        ])
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error loading data:', error)
        }
      }
    }

    loadData()

    return () => {
      abortController.abort()
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
  const fetchShoppingLists = async (signal?: AbortSignal) => {
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch('/api/shopping-lists', { signal })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Ошибка при загрузке списков')

      setShoppingLists(data.shoppingLists)

      // Сохраняем в IndexedDB
      for (const list of data.shoppingLists) {
        await saveOfflineList(list)
      }
    } catch (err) {
      // Игнорируем AbortError (отмена запроса)
      if (err instanceof Error && err.name === 'AbortError') return

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

  // Fetch individual list with items (for expand)
  const fetchListItems = useCallback(async (listId: string) => {
    try {
      const response = await fetch(`/api/shopping-lists/${listId}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Ошибка при загрузке списка')

      // Update the list in state with items
      setShoppingLists(lists =>
        lists.map(list =>
          list.id === listId ? data.shoppingList : list
        )
      )

      // Save to IndexedDB
      await saveOfflineList(data.shoppingList)
    } catch (err) {
      console.error('Error fetching list items:', err)
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке товаров')
    }
  }, [saveOfflineList])

  // Fetch list items when expanded (lazy loading)
  useEffect(() => {
    if (expandedListId) {
      fetchListItems(expandedListId)
    }
  }, [expandedListId, fetchListItems])

  const fetchCategories = async (signal?: AbortSignal) => {
    try {
      // Cookie автоматически отправляется браузером (httpOnly)
      const response = await fetch('/api/categories', { signal })

      const data = await response.json()
      if (response.ok) {
        setCategories(data.categories)
      }
    } catch (err) {
      // Игнорируем AbortError
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('Ошибка загрузки категорий:', err)
    }
  }

  // Lists operations
  const createList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim() || isCreatingList) return

    setIsCreatingList(true)

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
      setIsCreatingList(false)
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
    } finally {
      setIsCreatingList(false)
    }
  }

  // Функция для подтверждения удаления списка
  const confirmDeleteList = (listId: string) => {
    setDeleteListConfirm(listId)
  }

  // Выполнение удаления списка
  const executeDeleteList = async (listId: string) => {
    setDeleteListConfirm(null)

    if (isDeletingList[listId]) return

    setIsDeletingList(prev => ({ ...prev, [listId]: true }))

    if (!isOnline) {
      // Офлайн режим: удаляем локально и добавляем в очередь
      setShoppingLists(shoppingLists.filter(list => list.id !== listId))
      await deleteOfflineList(listId)
      await enqueueOperation('DELETE', `/api/shopping-lists/${listId}`, 'DELETE')
      if (expandedListId === listId) setExpandedListId(null)
      setError('Список удален офлайн. Синхронизация при подключении к сети.')
      setIsDeletingList(prev => ({ ...prev, [listId]: false }))
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
    } finally {
      setIsDeletingList(prev => ({ ...prev, [listId]: false }))
    }
  }

  const deleteList = (listId: string) => {
    confirmDeleteList(listId)
  }

  // Items operations
  const addItem = async (listId: string, itemName: string, quantity = 1, unit?: string, productId?: string, categoryId?: string) => {
    if (!itemName?.trim() || isAddingItem[listId]) return

    setIsAddingItem(prev => ({ ...prev, [listId]: true }))

    const list = shoppingLists.find(l => l.id === listId)
    if (list && list.items) {
      const exists = list.items.some(
        item => item.name.toLowerCase() === itemName.toLowerCase().trim()
      )
      if (exists) {
        setError(`Товар "${itemName}" уже есть в списке`)
        setIsAddingItem(prev => ({ ...prev, [listId]: false }))
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
        quantity: quantity || 1,
        unit: unit || null,
        purchased: false,
        createdAt: new Date().toISOString()
      }

      setShoppingLists(lists =>
        lists.map(list =>
          list.id === listId
            ? { ...list, items: [...(list.items || []), tempItem] }
            : list
        )
      )

      // Обновляем в IndexedDB
      const updatedList = shoppingLists.find(l => l.id === listId)
      if (updatedList) {
        await saveOfflineList({ ...updatedList, items: [...(updatedList.items || []), tempItem] })
      }

      await enqueueOperation('CREATE', `/api/shopping-lists/${listId}/items`, 'POST', {
        name: trimmedName,
        quantity: quantity || 1,
        unit: unit || null,
        productId: productId || null,
        categoryId: categoryId || null
      })

      setNewItemNames({ ...newItemNames, [listId]: '' })
      setError('Товар добавлен офлайн. Синхронизация при подключении к сети.')
      setIsAddingItem(prev => ({ ...prev, [listId]: false }))
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
          quantity: quantity || 1,
          unit: unit || null,
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
    } finally {
      setIsAddingItem(prev => ({ ...prev, [listId]: false }))
    }
  }

  const addProductFromCatalog = (product: Product, _quantity: number) => {
    if (!expandedListId) {
      setError('Откройте список, чтобы добавлять товары')
      return
    }
    addItem(expandedListId, product.name, _quantity, product.unit || undefined, product.id)
  }

  const toggleItem = async (listId: string, itemId: string) => {
    const itemKey = `${listId}-${itemId}`

    if (isTogglingItem[itemKey]) return

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

    setIsTogglingItem(prev => ({ ...prev, [itemKey]: true }))

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
    } finally {
      setIsTogglingItem(prev => ({ ...prev, [itemKey]: false }))
    }
  }

  // Функция для подтверждения удаления товара
  const confirmDeleteItem = (listId: string, itemId: string) => {
    setDeleteItemConfirm({ listId, itemId })
  }

  // Выполнение удаления товара
  const executeDeleteItem = async (listId: string, itemId: string) => {
    setDeleteItemConfirm(null)

    const itemKey = `${listId}-${itemId}`

    if (isDeletingItem[itemKey]) return

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

    setIsDeletingItem(prev => ({ ...prev, [itemKey]: true }))

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
    } finally {
      setIsDeletingItem(prev => ({ ...prev, [itemKey]: false }))
    }
  }

  const deleteItem = (listId: string, itemId: string) => {
    confirmDeleteItem(listId, itemId)
  }

  const updateItem = async (listId: string, itemId: string, data: { quantity?: number; unit?: string }) => {
    const itemKey = `${listId}-${itemId}`

    if (isUpdatingItem[itemKey]) return

    setIsUpdatingItem(prev => ({ ...prev, [itemKey]: true }))

    // Онлайн режим
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()
      if (!response.ok) throw new Error(responseData.error || 'Ошибка при обновлении товара')

      setShoppingLists(lists =>
        lists.map(list =>
          list.id === listId
            ? {
                ...list,
                items: list.items.map(item =>
                  item.id === itemId ? responseData.item : item
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
          items: updatedList.items.map(i => i.id === itemId ? responseData.item : i)
        }
        await saveOfflineList(listWithUpdatedItem)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении товара')
    } finally {
      setIsUpdatingItem(prev => ({ ...prev, [itemKey]: false }))
    }
  }

  const deselectAll = async (listId: string) => {
    if (isDeselectAll[listId]) return

    setIsDeselectAll(prev => ({ ...prev, [listId]: true }))

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
    } finally {
      setIsDeselectAll(prev => ({ ...prev, [listId]: false }))
    }
  }

  // Templates operations
  const applyTemplate = async (templateId: string, listName: string) => {
    const response = await fetch(`/api/templates/${templateId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ listName }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка при применении шаблона')
    }

    // Добавляем новый список в состояние
    setShoppingLists(prev => [data.shoppingList, ...prev])
  }

  const saveAsTemplate = async (listId: string, templateName: string, description: string) => {
    const response = await fetch(`/api/shopping-lists/${listId}/save-as-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ templateName, templateDescription: description }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка при сохранении шаблона')
    }

    setError(`Шаблон "${data.template.name}" создан успешно!`)
    setTimeout(() => setError(''), 3000)
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

  // Фильтрация и сортировка товаров в списках
  const filteredShoppingLists = useMemo(() => {
    return shoppingLists.map(list => {
      let filteredItems = [...(list.items || [])]

      // Фильтр по поиску
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        filteredItems = filteredItems.filter(item =>
          item.name.toLowerCase().includes(query)
        )
      }

      // Фильтр по категории
      if (categoryFilter) {
        filteredItems = filteredItems.filter(item =>
          item.product?.category?.id === categoryFilter
        )
      }

      // Фильтр по статусу
      if (statusFilter === 'purchased') {
        filteredItems = filteredItems.filter(item => item.purchased)
      } else if (statusFilter === 'unpurchased') {
        filteredItems = filteredItems.filter(item => !item.purchased)
      }

      // Сортировка
      if (sortBy === 'name') {
        filteredItems.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
      } else {
        // По умолчанию сортировка по дате (сначала старые)
        filteredItems.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      }

      return {
        ...list,
        items: filteredItems
      }
    })
  }, [shoppingLists, searchQuery, categoryFilter, statusFilter, sortBy])

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
                onClick={() => {
                  haptics.press()
                  setShowTemplatesModal(true)
                }}
                className="px-4 py-3 md:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 active:scale-95 min-h-[48px] text-base md:text-sm"
              >
                <span>📋</span>
                <span className="hidden sm:inline">Шаблоны</span>
              </button>
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
              disabled={isCreatingList}
              className="flex-1 min-w-0 px-4 py-3 text-base border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isCreatingList}
              className="px-4 md:px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors active:scale-95 min-h-[48px] text-base whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreatingList ? (
                <>
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Создание...</span>
                </>
              ) : (
                'Создать'
              )}
            </button>
          </form>
        </div>

        {/* Поиск и фильтры - показываем только если есть списки */}
        {shoppingLists.length > 0 && expandedListId && (
          <SearchAndFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            categories={categories}
          />
        )}

        {/* Списки */}
        <div className="space-y-4">
          {filteredShoppingLists.length === 0 && shoppingLists.length > 0 ? (
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 md:p-12 text-center">
              <div className="text-5xl md:text-6xl mb-4">🔍</div>
              <h2 className="text-xl md:text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Ничего не найдено
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-base">
                Попробуйте изменить параметры поиска или фильтры
              </p>
            </div>
          ) : (
            filteredShoppingLists.map((list) => (
              <GroupedShoppingListCard
                key={list.id}
                list={list}
                isExpanded={expandedListId === list.id}
                onToggle={(id) => setExpandedListId(expandedListId === id ? null : id)}
                onDelete={deleteList}
                onShare={list.isOwner ? (id) => setShareModalListId(id) : undefined}
                onSaveAsTemplate={list.isOwner ? (id) => setSaveAsTemplateListId(id) : undefined}
                onAddItem={addItem}
                onUpdateItem={updateItem}
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
                isDeleting={isDeletingList[list.id]}
                isAddingItem={isAddingItem[list.id]}
                isUpdatingItem={isUpdatingItem}
                isTogglingItem={isTogglingItem}
                isDeletingItem={isDeletingItem}
                isDeselectAll={isDeselectAll[list.id]}
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

        {/* Confirm Dialogs */}
        {deleteListConfirm && (
          <ConfirmDialog
            isOpen={!!deleteListConfirm}
            title="Удалить список?"
            message="Вы уверены, что хотите удалить этот список? Все товары будут удалены без возможности восстановления."
            confirmText="Удалить"
            cancelText="Отмена"
            onConfirm={() => executeDeleteList(deleteListConfirm)}
            onCancel={() => setDeleteListConfirm(null)}
            type="danger"
          />
        )}

        {deleteItemConfirm && (
          <ConfirmDialog
            isOpen={!!deleteItemConfirm}
            title="Удалить товар?"
            message="Вы уверены, что хотите удалить этот товар из списка?"
            confirmText="Удалить"
            cancelText="Отмена"
            onConfirm={() => executeDeleteItem(deleteItemConfirm.listId, deleteItemConfirm.itemId)}
            onCancel={() => setDeleteItemConfirm(null)}
            type="danger"
          />
        )}

        {/* Templates Modal */}
        <TemplatesModal
          isOpen={showTemplatesModal}
          onClose={() => setShowTemplatesModal(false)}
          onApplyTemplate={applyTemplate}
        />

        {/* Save as Template Modal */}
        {saveAsTemplateListId && (
          <SaveAsTemplateModal
            isOpen={!!saveAsTemplateListId}
            onClose={() => setSaveAsTemplateListId(null)}
            listId={saveAsTemplateListId}
            listName={shoppingLists.find(l => l.id === saveAsTemplateListId)?.name || ''}
            itemNames={shoppingLists.find(l => l.id === saveAsTemplateListId)?.items.map(i => i.name) || []}
            onSave={async (templateName, description) => {
              await saveAsTemplate(saveAsTemplateListId, templateName, description)
            }}
          />
        )}
      </div>
    </div>
  )
}
