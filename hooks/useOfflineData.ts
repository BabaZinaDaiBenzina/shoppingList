// React Hook для работы с офлайн данными

import { useState, useEffect, useCallback } from 'react'
import { indexedDB } from '@/lib/services/indexedDB'
import { syncService } from '@/lib/services/syncService'
import type { ShoppingListUI, ItemUI, User } from '@/types'

export function useOfflineData() {
  const [isOnline, setIsOnline] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [pendingSync, setPendingSync] = useState(0)

  // Инициализация IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        await indexedDB.init()
        setIsInitialized(true)

        // Загружаем количество операций в очереди
        const queueSize = await syncService.getQueueSize()
        setPendingSync(queueSize)
      } catch (error) {
        console.error('Ошибка инициализации IndexedDB:', error)
      }
    }

    initDB()
  }, [])

  // Отслеживание статуса соединения
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      console.log('🌐 Онлайн')
      // Запускаем синхронизацию
      syncService.sync().then(() => {
        return syncService.getQueueSize()
      }).then(setPendingSync)
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('📴 Офлайн')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Устанавливаем начальный статус
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Получить все списки из IndexedDB
  const getOfflineLists = useCallback(async (): Promise<ShoppingListUI[]> => {
    try {
      return await indexedDB.getAllShoppingLists()
    } catch (error) {
      console.error('Ошибка чтения из IndexedDB:', error)
      return []
    }
  }, [])

  // Сохранить список в IndexedDB
  const saveOfflineList = useCallback(async (list: ShoppingListUI) => {
    try {
      await indexedDB.saveShoppingList(list)
    } catch (error) {
      console.error('Ошибка сохранения в IndexedDB:', error)
    }
  }, [])

  // Удалить список из IndexedDB
  const deleteOfflineList = useCallback(async (listId: string) => {
    try {
      await indexedDB.deleteShoppingList(listId)
    } catch (error) {
      console.error('Ошибка удаления из IndexedDB:', error)
    }
  }, [])

  // Добавить операцию в очередь синхронизации
  const enqueueOperation = useCallback(async (
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    data?: unknown
  ) => {
    try {
      await syncService.enqueueOperation(type, endpoint, method, data)
      const queueSize = await syncService.getQueueSize()
      setPendingSync(queueSize)
    } catch (error) {
      console.error('Ошибка добавления операции в очередь:', error)
    }
  }, [])

  // Принудительная синхронизация
  const forceSync = useCallback(async () => {
    if (!isOnline) {
      console.warn('Невозможно синхронизировать в офлайн режиме')
      return
    }

    await syncService.sync()
    const queueSize = await syncService.getQueueSize()
    setPendingSync(queueSize)
  }, [isOnline])

  return {
    isOnline,
    isInitialized,
    pendingSync,
    getOfflineLists,
    saveOfflineList,
    deleteOfflineList,
    enqueueOperation,
    forceSync
  }
}
