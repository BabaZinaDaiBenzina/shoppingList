// IndexedDB сервис для офлайн хранения данных

import type { ShoppingListUI, ItemUI, User } from '@/types'

const DB_NAME = 'ShoppingListDB'
const DB_VERSION = 2  // Увеличена версия для миграции

// Хранилища (stores)
const STORES = {
  SHOPPING_LISTS: 'shoppingLists',
  ITEMS: 'items',
  QUEUE: 'queue', // Очередь операций для синхронизации
  USER: 'user' // Данные пользователя
}

interface QueueOperation {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  endpoint: string
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  data?: unknown
  timestamp: number
  retryCount: number
}

class IndexedDBService {
  private db: IDBDatabase | null = null

  // Инициализация базы данных
  async init(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('IndexedDB доступен только в браузере')
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Создаем хранилище для списков
        if (!db.objectStoreNames.contains(STORES.SHOPPING_LISTS)) {
          const listStore = db.createObjectStore(STORES.SHOPPING_LISTS, { keyPath: 'id' })
          listStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }

        // Создаем хранилище для товаров
        if (!db.objectStoreNames.contains(STORES.ITEMS)) {
          const itemStore = db.createObjectStore(STORES.ITEMS, { keyPath: 'id' })
          itemStore.createIndex('listId', 'listId', { unique: false })
        }

        // Создаем хранилище для очереди
        if (!db.objectStoreNames.contains(STORES.QUEUE)) {
          const queueStore = db.createObjectStore(STORES.QUEUE, { keyPath: 'id' })
          queueStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Создаем хранилище для пользователя
        if (!db.objectStoreNames.contains(STORES.USER)) {
          db.createObjectStore(STORES.USER, { keyPath: 'id' })
        }
      }
    })
  }

  // === Shopping Lists ===

  async getAllShoppingLists(): Promise<ShoppingListUI[]> {
    if (!this.db) await this.init()
    return this.getAll<ShoppingListUI>(STORES.SHOPPING_LISTS)
  }

  async getShoppingList(id: string): Promise<ShoppingListUI | undefined> {
    if (!this.db) await this.init()
    return this.get<ShoppingListUI>(STORES.SHOPPING_LISTS, id)
  }

  async saveShoppingList(list: ShoppingListUI): Promise<void> {
    if (!this.db) await this.init()
    return this.put(STORES.SHOPPING_LISTS, list)
  }

  async deleteShoppingList(id: string): Promise<void> {
    if (!this.db) await this.init()
    return this.delete(STORES.SHOPPING_LISTS, id)
  }

  // === Items ===

  async saveItem(item: ItemUI): Promise<void> {
    if (!this.db) await this.init()
    return this.put(STORES.ITEMS, item)
  }

  async deleteItem(id: string): Promise<void> {
    if (!this.db) await this.init()
    return this.delete(STORES.ITEMS, id)
  }

  // === Queue (операции для синхронизации) ===

  async addToQueue(operation: Omit<QueueOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    if (!this.db) await this.init()

    const queueOp: QueueOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0
    }

    return this.put(STORES.QUEUE, queueOp)
  }

  async getQueue(): Promise<QueueOperation[]> {
    if (!this.db) await this.init()
    const operations = await this.getAll<QueueOperation>(STORES.QUEUE)
    return operations.sort((a, b) => a.timestamp - b.timestamp)
  }

  async removeFromQueue(id: string): Promise<void> {
    if (!this.db) await this.init()
    return this.delete(STORES.QUEUE, id)
  }

  async updateQueueOperation(operation: QueueOperation): Promise<void> {
    if (!this.db) await this.init()
    return this.put(STORES.QUEUE, operation)
  }

  async clearQueue(): Promise<void> {
    if (!this.db) await this.init()
    return this.clear(STORES.QUEUE)
  }

  // === User ===

  async saveUser(user: User): Promise<void> {
    if (!this.db) await this.init()
    return this.put(STORES.USER, { ...user, id: 'current' })
  }

  async getUser(): Promise<User | undefined> {
    if (!this.db) await this.init()
    return this.get(STORES.USER, 'current')
  }

  async clearUser(): Promise<void> {
    if (!this.db) await this.init()
    return this.delete(STORES.USER, 'current')
  }

  // === Helper методы ===

  private async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async get<T>(storeName: string, key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  private async put(storeName: string, data: object): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)

      // Проверяем, что у данных есть ключевой путь
      if (!data || typeof data !== 'object') {
        reject(new Error(`Invalid data for store ${storeName}: data is not an object`))
        return
      }

      const keyPath = store.keyPath
      if (keyPath && !(keyPath as string in data)) {
        reject(new Error(`Missing key path "${keyPath}" in data for store ${storeName}`))
        return
      }

      const request = store.put(data)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async delete(storeName: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  private async clear(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Очистить всю базу данных
  async clearAll(): Promise<void> {
    if (!this.db) await this.init()

    await this.clear(STORES.SHOPPING_LISTS)
    await this.clear(STORES.ITEMS)
    await this.clear(STORES.QUEUE)
    await this.clear(STORES.USER)
  }

  // Сбросить базу данных (удалить и создать заново) - для решения проблем с миграцией
  async reset(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('IndexedDB доступен только в браузере')
    }

    // Закрываем текущее подключение
    if (this.db) {
      this.db.close()
      this.db = null
    }

    // Удаляем базу данных
    await new Promise<void>((resolve, reject) => {
      const request = window.indexedDB.deleteDatabase(DB_NAME)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    // Инициализируем заново
    await this.init()
  }
}

// Экспорт синглтона
export const indexedDB = new IndexedDBService()
