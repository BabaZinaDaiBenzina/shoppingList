/**
 * Сервис для синхронизации офлайн операций с защитой от race conditions
 *
 * Особенности:
 * - Mutex для предотвращения параллельной синхронизации
 * - AsyncLock для блокировки по ресурсам (списки, товары)
 * - Версионирование данных для разрешения конфликтов (last-write-wins)
 * - Экспоненциальная задержка для retry
 * - Использует httpOnly cookies (без токена в localStorage)
 */

import { indexedDB } from './indexedDB'
import { Mutex, AsyncLock } from '@/lib/utils/mutex'
import { logError, logInfo, logWarn } from '@/lib/logger'
import { SyncError, SyncConflictError } from '@/types/errors'

interface SyncOperation {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  endpoint: string
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  data?: unknown
  timestamp: number
  retryCount: number
  lastRetry?: number
  // Версия данных для разрешения конфликтов
  version?: number
  resourceType?: 'shoppingList' | 'item'
  resourceId?: string
}

interface SyncResult {
  success: boolean
  operation: SyncOperation
  error?: Error
  conflict?: boolean
}

class SyncService {
  // Глобальный мьютекс для предотвращения параллельной синхронизации
  private globalMutex = new Mutex()

  // Блокировки по ресурсам для предотвращения конфликтов
  private resourceLocks = new AsyncLock()

  // Флаг для отслеживания состояния
  private isInitialized: boolean = false

  // Callbacks для уведомления об изменениях
  private syncCallbacks: Set<() => void> = new Set()

  /**
   * Инициализация сервиса синхронизации
   */
  initialize() {
    if (this.isInitialized) {
      return
    }

    if (typeof window !== 'undefined') {
      // Автоматическая синхронизация при восстановлении соединения
      window.addEventListener('online', () => {
        logInfo('Соединение восстановлено. Начинаем синхронизацию...')
        this.sync().catch((error) => {
          logError('Ошибка автоматической синхронизации', error)
        })
      })

      // Периодическая синхронизация каждые 30 секунд
      setInterval(() => {
        if (navigator.onLine) {
          this.sync().catch((error) => {
            logError('Ошибка периодической синхронизации', error)
          })
        }
      }, 30000)

      this.isInitialized = true
    }
  }

  /**
   * Добавить операцию в очередь
   */
  async enqueueOperation(
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    data?: unknown
  ): Promise<void> {
    // Извлекаем информацию о ресурсе для блокировок
    const resourceInfo = this.extractResourceInfo(endpoint, type)

    const operation: SyncOperation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      type,
      endpoint,
      method,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      ...resourceInfo,
    }

    await indexedDB.addToQueue(operation)
    logInfo('Операция добавлена в очередь', { type, endpoint, operationId: operation.id })
  }

  /**
   * Извлекает информацию о ресурсе из endpoint для блокировок
   */
  private extractResourceInfo(
    endpoint: string,
    type: 'CREATE' | 'UPDATE' | 'DELETE'
  ): Partial<SyncOperation> {
    // Определяем тип ресурса и ID
    const itemMatch = endpoint.match(/\/items\/([^/]+)/)
    const listMatch = endpoint.match(/\/shopping-lists\/([^/]+)/)

    if (itemMatch) {
      return {
        resourceType: 'item',
        resourceId: itemMatch[1],
      }
    }

    if (listMatch && !endpoint.includes('/items')) {
      return {
        resourceType: 'shoppingList',
        resourceId: listMatch[1],
      }
    }

    // Для операций создания (CREATE) может не быть ID в URL
    if (type === 'CREATE') {
      if (endpoint.includes('/items')) {
        return { resourceType: 'item' }
      }
      if (endpoint.includes('/shopping-lists')) {
        return { resourceType: 'shoppingList' }
      }
    }

    return {}
  }

  /**
   * Синхронизировать все операции из очереди с защитой от race conditions
   */
  async sync(): Promise<SyncResult[]> {
    // Используем глобальный мьютекс для предотвращения параллельной синхронизации
    return this.globalMutex.runExclusive(async () => {
      if (!navigator.onLine) {
        logInfo('Офлайн режим. Пропуск синхронизации.')
        return []
      }

      logInfo('Начало синхронизации...')

      try {
        const operations = await indexedDB.getQueue()

        if (operations.length === 0) {
          logInfo('Очередь пуста')
          return []
        }

        logInfo('Операций в очереди', { count: operations.length })

        // Сортируем операции по timestamp (старые первыми для last-write-wins)
        const sortedOperations = operations.sort((a, b) => a.timestamp - b.timestamp)

        const results: SyncResult[] = []

        // Группируем операции по ресурсам для последовательной обработки
        const operationsByResource = this.groupByResource(sortedOperations)

        // Обрабатываем каждую группу операций
        for (const [resourceKey, resourceOperations] of Object.entries(operationsByResource)) {
          const resourceResults = await this.syncResourceOperations(
            resourceKey,
            resourceOperations
          )
          results.push(...resourceResults)
        }

        const successCount = results.filter((r) => r.success).length
        const failCount = results.filter((r) => !r.success).length
        const conflictCount = results.filter((r) => r.conflict).length

        logInfo('Синхронизация завершена', {
          total: results.length,
          success: successCount,
          failed: failCount,
          conflicts: conflictCount,
        })

        // Уведомляем подписчиков об изменениях
        this.notifySyncListeners()

        // Dispatch custom event для глобальной подписки
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shopping-lists-synced'))
        }

        return results
      } catch (error) {
        logError(error, { message: 'Критическая ошибка синхронизации' })
        throw new SyncError('Ошибка синхронизации')
      }
    })
  }

  /**
   * Группирует операции по ресурсам для последовательной обработки
   */
  private groupByResource(operations: SyncOperation[]): Record<string, SyncOperation[]> {
    const groups: Record<string, SyncOperation[]> = {}

    for (const operation of operations) {
      // Ключ группировки: тип ресурса + ID (если есть)
      const key = operation.resourceType
        ? `${operation.resourceType}-${operation.resourceId || 'new'}`
        : `other-${operation.id}` // Операции без ресурса обрабатываем индивидуально

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(operation)
    }

    return groups
  }

  /**
   * Синхронизирует операции для одного ресурса с блокировкой
   */
  private async syncResourceOperations(
    resourceKey: string,
    operations: SyncOperation[]
  ): Promise<SyncResult[]> {
    // Используем AsyncLock для блокировки ресурса
    return this.resourceLocks.run(resourceKey, async () => {
      const results: SyncResult[] = []

      // Обрабатываем операции последовательно (последний побеждает)
      for (const operation of operations) {
        // Проверяем, что операция все еще в очереди (могла быть выполнена в другой сессии)
        const currentQueue = await indexedDB.getQueue()
        const stillInQueue = currentQueue.find((op) => op.id === operation.id)

        if (!stillInQueue) {
          logInfo('Операция уже выполнена в другой сессии', { operationId: operation.id })
          continue
        }

        // Проверяем, не устарела ли операция (last-write-wins)
        const latestOperation = operations[operations.length - 1]
        if (operation.id !== latestOperation.id && operation.type === 'UPDATE') {
          // Это не последняя операция UPDATE для данного ресурса
          // Пропускаем её в пользу более новой
          logInfo('Пропуск устаревшей операции (last-write-wins)', {
            operationId: operation.id,
            latestId: latestOperation.id,
          })
          await indexedDB.removeFromQueue(operation.id)
          continue
        }

        const result = await this.syncWithRetry(operation)
        results.push(result)
      }

      return results
    })
  }

  /**
   * Выполняет операцию с exponential backoff retry
   */
  private async syncWithRetry(operation: SyncOperation): Promise<SyncResult> {
    const maxRetries = 3
    const baseDelay = 1000 // 1 секунда
    const maxDelay = 10000 // 10 секунд

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.syncOperation(operation)
        await indexedDB.removeFromQueue(operation.id)

        logInfo('Операция выполнена успешно', {
          type: operation.type,
          endpoint: operation.endpoint,
          attempt,
        })

        return {
          success: true,
          operation,
        }
      } catch (error) {
        const isLastAttempt = attempt === maxRetries

        if (isLastAttempt) {
          logError(error, {
            message: 'Операция отклонена после всех попыток',
            operationId: operation.id,
            endpoint: operation.endpoint,
            attempts: attempt + 1,
          })

          // Удаляем операцию из очереди после всех попыток
          await indexedDB.removeFromQueue(operation.id)

          return {
            success: false,
            operation,
            error: error as Error,
          }
        }

        // Экспоненциальная задержка с jitter
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
        const jitter = Math.random() * 1000 // случайная задержка до 1 сек
        const totalDelay = delay + jitter

        logWarn('Ошибка операции, повторная попытка', {
          operationId: operation.id,
          endpoint: operation.endpoint,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          delayMs: Math.round(totalDelay),
        } as Record<string, unknown>)

        await this.sleep(totalDelay)
      }
    }

    // Этот код не должен достигаться, но TypeScript требует return
    return {
      success: false,
      operation,
      error: new Error('Неизвестная ошибка retry'),
    }
  }

  /**
   * Выполнить одну операцию
   */
  private async syncOperation(operation: SyncOperation): Promise<void> {
    // НЕ используем токен из localStorage - теперь httpOnly cookies
    // const token = localStorage.getItem('token')

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    const options: RequestInit = {
      method: operation.method,
      headers,
    }

    if (operation.data && (operation.method === 'POST' || operation.method === 'PATCH')) {
      options.body = JSON.stringify(operation.data)
    }

    // Используем AbortController для отмены запроса
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 сек таймаут
    options.signal = controller.signal

    try {
      const response = await fetch(operation.endpoint, options)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Ошибка запроса' }))

        // Проверяем на конфликт (409)
        if (response.status === 409) {
          throw new SyncConflictError({ statusCode: 409 })
        }

        throw new Error(error.error || 'Ошибка запроса')
      }

      // Обновляем локальные данные после успешной синхронизации
      const result = await response.json()
      await this.updateLocalData(operation, result)
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Обновляет локальные данные в IndexedDB после успешной синхронизации
   */
  private async updateLocalData(operation: SyncOperation, result: {
    shoppingList?: import('@/types').ShoppingListUI
    list?: import('@/types').ShoppingListUI
    item?: import('@/types').ItemUI
    items?: import('@/types').ItemUI[]
  }): Promise<void> {
    // Если это операции с товарами
    if (operation.endpoint.match(/\/shopping-lists\/[^/]+\/items/) ||
        operation.endpoint.match(/\/items\/[^/]+/)) {
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

  /**
   * Вспомогательная функция для задержки
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Получить количество операций в очереди
   */
  async getQueueSize(): Promise<number> {
    const operations = await indexedDB.getQueue()
    return operations.length
  }

  /**
   * Получить статистику синхронизации
   */
  getStats() {
    return {
      isSyncing: this.globalMutex.isLocked(),
      activeLocks: this.resourceLocks.getActiveLocksCount(),
      queueLength: this.globalMutex.getQueueLength(),
    }
  }

  /**
   * Очистить очередь
   */
  async clearQueue(): Promise<void> {
    await indexedDB.clearQueue()
    logInfo('Очередь синхронизации очищена')
  }

  /**
   * Подписаться на события синхронизации
   * @returns Функция для отписки
   */
  onSync(callback: () => void): () => void {
    this.syncCallbacks.add(callback)

    // Возвращаем функцию для отписки
    return () => {
      this.syncCallbacks.delete(callback)
    }
  }

  /**
   * Уведомить всех подписчиков о синхронизации
   */
  private notifySyncListeners(): void {
    for (const callback of this.syncCallbacks) {
      try {
        callback()
      } catch (error) {
        logError(error, { message: 'Ошибка в callback синхронизации' })
      }
    }
  }
}

// Экспорт синглтона
export const syncService = new SyncService()

// Автоматическая инициализация
if (typeof window !== 'undefined') {
  syncService.initialize()
}
