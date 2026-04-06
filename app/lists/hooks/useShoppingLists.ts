import { useState, useCallback, useRef } from 'react'
import { useOfflineData } from '@/hooks/useOfflineData'
import { useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import type { ShoppingListUI } from '@/types'

interface UseShoppingListsOptions {
  onListsChange?: (lists: ShoppingListUI[]) => void
  initialLists?: ShoppingListUI[]
}

export function useShoppingLists(options?: UseShoppingListsOptions) {
  const router = useRouter()
  const { isOnline, saveOfflineList, enqueueOperation, forceSync } = useOfflineData()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [isDeletingList, setIsDeletingList] = useState<Record<string, boolean>>({})
  const [newListName, setNewListName] = useState('')

  // Храним текущие списки в ref для доступа в callbacks
  const currentListsRef = useRef<ShoppingListUI[]>(options?.initialLists || [])

  const updateLists = useCallback((newLists: ShoppingListUI[]) => {
    currentListsRef.current = newLists
    options?.onListsChange?.(newLists)
  }, [options])

  /**
   * Загрузка всех списков
   */
  const loadLists = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      if (!isOnline) {
        // Офлайн режим: загружаем из IndexedDB
        const offlineLists = await getOfflineLists()
        updateLists(offlineLists)
        return
      }

      // Онлайн режим: загружаем с сервера
      const response = await fetch('/api/shopping-lists')
      if (!response.ok) throw new Error('Ошибка при загрузке списков')

      const data = await response.json()
      updateLists(data.shoppingLists)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [isOnline, updateLists])

  /**
   * Создание нового списка
   */
  const createList = useCallback(async (name: string) => {
    if (!name.trim() || isCreatingList) return

    setIsCreatingList(true)
    setError('')

    try {
      if (!isOnline) {
        // Офлайн режим: создаем временный список
        const tempId = `temp-${uuidv4()}`
        const tempList: ShoppingListUI = {
          id: tempId,
          name: name.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: [],
          isOwner: true,
          isShared: false,
        }

        // Обновляем UI
        updateLists([tempList, ...currentListsRef.current])

        // Сохраняем в IndexedDB
        await saveOfflineList(tempList)

        // Добавляем в очередь синхронизации
        await enqueueOperation('CREATE', '/api/shopping-lists', 'POST', {
          name: name.trim(),
          tempId, // Передаем временный ID для обновления
        })

        setError('Список создан офлайн. Синхронизация при подключении к сети.')
        return
      }

      // Онлайн режим: создаем на сервере
      const response = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': await getCsrfToken(),
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) throw new Error('Ошибка при создании списка')

      const data = await response.json()
      updateLists([data.shoppingList, ...currentListsRef.current])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка создания списка'
      setError(message)
      throw err
    } finally {
      setIsCreatingList(false)
    }
  }, [isOnline, isCreatingList, options, saveOfflineList, enqueueOperation])

  /**
   * Удаление списка
   */
  const deleteList = useCallback(async (listId: string) => {
    if (isDeletingList[listId]) return

    setIsDeletingList((prev) => ({ ...prev, [listId]: true }))
    setError('')

    try {
      if (!isOnline) {
        // Офлайн режим
        updateLists(currentListsRef.current.filter((list) => list.id !== listId))

        await enqueueOperation('DELETE', `/api/shopping-lists/${listId}`, 'DELETE')
        setError('Список удален офлайн. Синхронизация при подключении к сети.')
        return
      }

      // Онлайн режим
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': await getCsrfToken() },
      })

      if (!response.ok) throw new Error('Ошибка при удалении списка')

      updateLists(currentListsRef.current.filter((list) => list.id !== listId))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка удаления списка'
      setError(message)
      throw err
    } finally {
      setIsDeletingList((prev) => ({ ...prev, [listId]: false }))
    }
  }, [isOnline, isDeletingList, options, enqueueOperation])

  /**
   * Обновление списка
   */
  const updateList = useCallback(async (listId: string, updates: { name: string }) => {
    setError('')

    try {
      if (!isOnline) {
        // Офлайн режим
        updateLists(
          currentListsRef.current.map((list) =>
            list.id === listId ? { ...list, ...updates, updatedAt: new Date().toISOString() } : list
          )
        )

        await saveOfflineList(getListById(listId))
        await enqueueOperation('UPDATE', `/api/shopping-lists/${listId}`, 'PATCH', updates)
        return
      }

      // Онлайн режим
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': await getCsrfToken(),
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error('Ошибка при обновлении списка')

      const data = await response.json()
      updateLists(
        currentListsRef.current.map((list) => (list.id === listId ? { ...list, ...data.shoppingList } : list))
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка обновления списка'
      setError(message)
      throw err
    }
  }, [isOnline, options, saveOfflineList, enqueueOperation])

  /**
   * Открыть список
   */
  const openList = useCallback((listId: string) => {
    router.push(`/lists/${listId}`)
  }, [router])

  /**
   * Очистка ошибок
   */
  const clearError = useCallback(() => {
    setError('')
  }, [])

  return {
    // State
    isLoading,
    error,
    isCreatingList,
    isDeletingList,
    newListName,
    setNewListName,

    // Actions
    loadLists,
    createList,
    deleteList,
    updateList,
    openList,
    clearError,
    forceSync,
  }
}

// Вспомогательные функции
async function getOfflineLists(): Promise<ShoppingListUI[]> {
  // Здесь должна быть логика загрузки из IndexedDB
  // Для упрощения возвращаем пустой массив
  return []
}

function getCsrfToken(): string {
  // Загрузка CSRF токена
  return ''
}

function getListById(id: string): ShoppingListUI {
  // Вспомогательная функция
  return {} as ShoppingListUI
}
