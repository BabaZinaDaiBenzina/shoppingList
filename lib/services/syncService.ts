// Сервис для синхронизации офлайн операций

import { indexedDB } from './indexedDB'

interface SyncOperation {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  endpoint: string
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  data?: any
  timestamp: number
  retryCount: number
}

class SyncService {
  private isSyncing: boolean = false
  private syncInProgress: Set<string> = new Set()

  // Добавить операцию в очередь
  async enqueueOperation(
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    data?: any
  ): Promise<void> {
    await indexedDB.addToQueue({ type, endpoint, method, data })
    console.log('📥 Операция добавлена в очередь:', { type, endpoint })
  }

  // Синхронизировать все операции из очереди
  async sync(): Promise<void> {
    if (this.isSyncing) {
      console.log('⏳ Синхронизация уже запущена')
      return
    }

    if (!navigator.onLine) {
      console.log('📴 Офлайн режим. Пропуск синхронизации.')
      return
    }

    this.isSyncing = true
    console.log('🔄 Начало синхронизации...')

    try {
      const operations = await indexedDB.getQueue()

      if (operations.length === 0) {
        console.log('✅ Очередь пуста')
        return
      }

      console.log(`📦 Операций в очереди: ${operations.length}`)

      for (const operation of operations) {
        // Проверяем, что операция все еще в очереди (могла быть выполнена параллельно)
        const currentQueue = await indexedDB.getQueue()
        const stillInQueue = currentQueue.find(op => op.id === operation.id)

        if (!stillInQueue) {
          console.log(`⏭️ Операция уже выполнена параллельно: ${operation.endpoint}`)
          continue
        }

        // Пропускаем если операция уже выполняется
        if (this.syncInProgress.has(operation.id)) {
          continue
        }

        this.syncInProgress.add(operation.id)

        try {
          await this.syncOperation(operation)
          await indexedDB.removeFromQueue(operation.id)
          console.log(`✅ Операция выполнена: ${operation.type} ${operation.endpoint}`)
        } catch (error) {
          console.error(`❌ Ошибка операции:`, error)

          // Увеличиваем счетчик попыток
          operation.retryCount++

          // Если слишком много попыток, удаляем операцию
          if (operation.retryCount >= 3) {
            console.warn(`⚠️ Операция удалена после 3 попыток: ${operation.endpoint}`)
            await indexedDB.removeFromQueue(operation.id)
          } else {
            // Обновляем операцию в очереди с новым retryCount
            await indexedDB.updateQueueOperation(operation)
            console.log(`🔄 Операция будет повторена (попытка ${operation.retryCount}/3): ${operation.endpoint}`)
          }
        } finally {
          this.syncInProgress.delete(operation.id)
        }
      }

      console.log('✅ Синхронизация завершена')
    } catch (error) {
      console.error('❌ Ошибка синхронизации:', error)
    } finally {
      this.isSyncing = false
    }
  }

  // Выполнить одну операцию
  private async syncOperation(operation: SyncOperation): Promise<void> {
    const token = localStorage.getItem('token')

    if (!token) {
      throw new Error('Нет токена авторизации')
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    const options: RequestInit = {
      method: operation.method,
      headers
    }

    if (operation.data && (operation.method === 'POST' || operation.method === 'PATCH')) {
      options.body = JSON.stringify(operation.data)
    }

    const response = await fetch(operation.endpoint, options)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Ошибка запроса')
    }

    // Обновляем локальные данные после успешной синхронизации
    const result = await response.json()

    // Если это операции с товарами (создание, обновление, удаление, toggle)
    if (operation.endpoint.match(/\/shopping-lists\/[^/]+\/items/) || operation.endpoint.match(/\/items\/[^/]+/)) {
      // При создании товара возвращаем обновленный список
      if (operation.endpoint.includes('/items') && result.shoppingList) {
        await indexedDB.saveShoppingList(result.shoppingList)
      } else if (result.item) {
        await indexedDB.saveItem(result.item)
      } else if (result.items) {
        // Массовое обновление (например, deselect-all)
        for (const item of result.items) {
          await indexedDB.saveItem(item)
        }
      }
    }
    // Если это создание/обновление/удаление списка
    else if (operation.endpoint.match(/\/shopping-lists\/?$/) && !operation.endpoint.includes('/items')) {
      if (operation.type === 'CREATE' || operation.type === 'UPDATE') {
        if (result.shoppingList) {
          await indexedDB.saveShoppingList(result.shoppingList)
        } else if (result.list) {
          await indexedDB.saveShoppingList(result.list)
        }
      } else if (operation.type === 'DELETE') {
        const listId = operation.endpoint.split('/').pop()
        if (listId) {
          await indexedDB.deleteShoppingList(listId)
        }
      }
    }
  }

  // Получить количество операций в очереди
  async getQueueSize(): Promise<number> {
    const operations = await indexedDB.getQueue()
    return operations.length
  }

  // Очистить очередь
  async clearQueue(): Promise<void> {
    await indexedDB.clearQueue()
  }
}

// Экспорт синглтона
export const syncService = new SyncService()

// Автоматическая синхронизация при восстановлении соединения
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Соединение восстановлено. Начинаем синхронизацию...')
    syncService.sync()
  })

  // Синхронизация каждые 30 секунд
  setInterval(() => {
    if (navigator.onLine) {
      syncService.sync()
    }
  }, 30000)
}
