/**
 * Mutex (mutual exclusion) для предотвращения race conditions
 *
 * Используется для гарантии, что только одна операция
 * может выполнять критическую секцию кода в данный момент времени.
 *
 * @example
 * ```ts
 * const mutex = new Mutex()
 *
 * // Параллельные запросы
 * Promise.all([
 *   mutex.runExclusive(async () => {
 *     // Этот код выполнится первым
 *     await criticalOperation()
 *   }),
 *   mutex.runExclusive(async () => {
 *     // Этот код будет ждать завершения первого
 *     await anotherCriticalOperation()
 *   }),
 * ])
 * ```
 */

export class Mutex {
  private queue: Array<() => void> = []
  private locked: boolean = false

  /**
   * Выполняет функцию эксклюзивно (только одна в данный момент)
   * Если мьютекс уже занят, ожидает его освобождения.
   */
  async runExclusive<T>(callback: () => Promise<T> | T): Promise<T> {
    // Ждем, пока получим блокировку
    await this.acquire()

    try {
      // Выполняем callback
      return await callback()
    } finally {
      // Всегда освобождаем блокировку, даже если была ошибка
      this.release()
    }
  }

  /**
   * Получает блокировку. Если уже занята, добавляется в очередь.
   */
  private acquire(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.locked) {
        // Мьютекс свободен, занимаем его
        this.locked = true
        resolve()
      } else {
        // Мьютекс занят, добавляем в очередь
        this.queue.push(resolve)
      }
    })
  }

  /**
   * Освобождает блокировку и запускает следующую операцию из очереди.
   */
  private release(): void {
    if (this.queue.length > 0) {
      // Есть ожидающие операции, запускаем следующую
      const nextResolve = this.queue.shift()!
      nextResolve()
      // Блокировка остается занятой для следующей операции
    } else {
      // Очередь пуста, освобождаем блокировку
      this.locked = false
    }
  }

  /**
   * Проверяет, занят ли мьютекс
   */
  isLocked(): boolean {
    return this.locked
  }

  /**
   * Возвращает количество ожидающих операций
   */
  getQueueLength(): number {
    return this.queue.length
  }
}

/**
 * Семафор для ограничения количества параллельных операций
 *
 * @example
 * ```ts
 * const semaphore = new Semaphore(3) // Максимум 3 параллельные операции
 *
 * await Promise.all([
 *   semaphore.run(async () => await operation1()),
 *   semaphore.run(async () => await operation2()),
 *   semaphore.run(async () => await operation3()),
 *   semaphore.run(async () => await operation4()), // Будет ждать
 * ])
 * ```
 */
export class Semaphore {
  private available: number
  private queue: Array<() => void> = []

  constructor(count: number) {
    if (count <= 0) {
      throw new Error('Semaphore count must be greater than 0')
    }
    this.available = count
  }

  /**
   * Выполняет функцию, получая слот в семафоре
   */
  async run<T>(callback: () => Promise<T> | T): Promise<T> {
    // Ждем, пока освободится слот
    await this.acquire()

    try {
      return await callback()
    } finally {
      this.release()
    }
  }

  /**
   * Получает слот в семафоре
   */
  private acquire(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.available > 0) {
        // Есть свободные слоты
        this.available--
        resolve()
      } else {
        // Все слоты заняты, добавляем в очередь
        this.queue.push(resolve)
      }
    })
  }

  /**
   * Освобождает слот
   */
  private release(): void {
    if (this.queue.length > 0) {
      // Есть ожидающие операции, передаем слот следующей
      const nextResolve = this.queue.shift()!
      nextResolve()
      // Слот остается занятым для следующей операции
    } else {
      // Очередь пуста, освобождаем слот
      this.available++
    }
  }

  /**
   * Возвращает количество доступных слотов
   */
  getAvailable(): number {
    return this.available
  }

  /**
   * Возвращает количество ожидающих операций
   */
  getQueueLength(): number {
    return this.queue.length
  }
}

/**
 * AsyncLock для блокировки по ключу
 *
 * Позволяет выполнять параллельные операции с разными ключами,
 * но блокирует операции с одинаковыми ключами.
 *
 * @example
 * ```ts
 * const lock = new AsyncLock()
 *
 * // Параллельные операции с разными ключами - выполнятся одновременно
 * // Операции с одним ключом - выполнятся последовательно
 * Promise.all([
 *   lock.run('list-1', async () => await updateList1()),
 *   lock.run('list-2', async () => await updateList2()),
 *   lock.run('list-1', async () => await updateList1Again()), // Будет ждать
 * ])
 * ```
 */
export class AsyncLock {
  private locks: Map<string, Mutex> = new Map()

  /**
   * Выполняет функцию с блокировкой по ключу
   */
  async run<T>(key: string, callback: () => Promise<T> | T): Promise<T> {
    // Получаем или создаем мьютекс для ключа
    if (!this.locks.has(key)) {
      this.locks.set(key, new Mutex())
    }

    const mutex = this.locks.get(key)!

    try {
      return await mutex.runExclusive(callback)
    } finally {
      // Очищаем мьютекс если очередь пуста, чтобы не засорять память
      if (!mutex.isLocked() && mutex.getQueueLength() === 0) {
        this.locks.delete(key)
      }
    }
  }

  /**
   * Проверяет, заблокирован ли ключ
   */
  isLocked(key: string): boolean {
    const mutex = this.locks.get(key)
    return mutex ? mutex.isLocked() : false
  }

  /**
   * Возвращает количество активных блокировок
   */
  getActiveLocksCount(): number {
    return this.locks.size
  }

  /**
   * Очищает все блокировки
   */
  clear(): void {
    this.locks.clear()
  }
}
