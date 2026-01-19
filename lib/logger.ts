/**
 * Система логирования приложения
 *
 * Особенности:
 * - Уровни логирования: debug, info, warn, error
 * - Санитайзинг конфиденциальных данных
 * - Структурированные логи
 * - В будущем можно заменить на Winston/Pino
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// Конфиденциальные поля, которые нужно скрыть в логах
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'jwt',
  'secret',
  'apiKey',
  'authorization',
  'cookie',
  'session',
  'creditCard',
  'ssn',
]

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: {
    name: string
    code: string
    message: string
    statusCode?: number
  }
}

/**
 * Рекурсивно удаляет конфиденциальные данные из объекта
 */
function sanitize(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitize)
  }

  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase()

    // Проверяем, является ли поле конфиденциальным
    const isSensitive = SENSITIVE_FIELDS.some((field) =>
      lowerKey.includes(field.toLowerCase())
    )

    if (isSensitive) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Форматирует log entry для вывода в консоль
 */
function formatLogEntry(entry: LogEntry): string {
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
    entry.message,
  ]

  if (entry.context) {
    parts.push(JSON.stringify(entry.context, null, 2))
  }

  if (entry.error) {
    parts.push(`Error: ${entry.error.name} (${entry.error.code})`)
    parts.push(`Message: ${entry.error.message}`)
  }

  return parts.join(' ')
}

/**
 * Логер приложения
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true // В деве логируем всё
    }

    // В проде логируем только warn и error
    return level === 'warn' || level === 'error'
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: unknown) {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ? sanitize(context) as Record<string, unknown> : undefined,
      error: error ? {
        name: (error as { name?: string })?.name || 'Error',
        code: (error as { code?: string })?.code || 'UNKNOWN',
        message: (error as { message?: string })?.message || String(error),
        statusCode: (error as { statusCode?: number })?.statusCode,
      } : undefined,
    }

    const formatted = formatLogEntry(entry)

    switch (level) {
      case 'debug':
      case 'info':
        console.log(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'error':
        console.error(formatted)
        break
    }

    // В будущем здесь можно добавить отправку в сервис мониторинга
    // if (level === 'error') {
    //   sendToMonitoring(entry)
    // }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context)
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    this.log('error', message, context, error)
  }

  /**
   * Логирует ошибку приложения (ApplicationError)
   */
  logAppError(error: unknown, context?: Record<string, unknown>) {
    const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка'
    const errorCode = (error as { code?: string })?.code

    this.error(
      errorMessage,
      error,
      errorCode ? { ...context, errorCode } : context
    )
  }
}

// Экспортируем singleton-инстанс
export const logger = new Logger()

/**
 * Удобная функция для логирования ошибок в catch блоках
 *
 * @example
 * ```ts
 * try {
 *   await someOperation()
 * } catch (error) {
 *   logError(error, { operation: 'someOperation', userId: '123' })
 * }
 * ```
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  logger.logAppError(error, context)
}

/**
 * Логирует информационное сообщение
 */
export function logInfo(message: string, context?: Record<string, unknown>) {
  logger.info(message, context)
}

/**
 * Логирует предупреждение
 */
export function logWarn(message: string, context?: Record<string, unknown>) {
  logger.warn(message, context)
}

/**
 * Логирует debug сообщение (только в development)
 */
export function logDebug(message: string, context?: Record<string, unknown>) {
  logger.debug(message, context)
}
