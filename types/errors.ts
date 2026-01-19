/**
 * Типы ошибок приложения с кодами для структурированной обработки
 */

// Базовый класс для всех ошибок приложения
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace?.(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    }
  }
}

// Ошибки сети
export class NetworkError extends ApplicationError {
  constructor(message: string = 'Ошибка сети', details?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 503, details)
  }
}

// Ошибки авторизации
export class AuthError extends ApplicationError {
  constructor(message: string = 'Ошибка авторизации', details?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', 401, details)
  }
}

// Ошибки аутентификации (неверные креды)
export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Неверный email или пароль') {
    super(message, 'AUTHENTICATION_FAILED', 401)
  }
}

// Ошибки сессии (истекшая, недействительная)
export class SessionExpiredError extends ApplicationError {
  constructor(message: string = 'Сессия истекла. Войдите снова') {
    super(message, 'SESSION_EXPIRED', 401)
  }
}

// Ошибки доступа (прав)
export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Недостаточно прав', details?: Record<string, unknown>) {
    super(message, 'FORBIDDEN', 403, details)
  }
}

// Ошибки валидации
export class ValidationError extends ApplicationError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', 400, { fields })
  }
}

// Ошибки ресурсов (не найден)
export class NotFoundError extends ApplicationError {
  constructor(resource: string = 'Ресурс') {
    super(`${resource} не найден`, 'NOT_FOUND', 404)
  }
}

// Ошибки конфликтов (например, дубликат)
export class ConflictError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, details)
  }
}

// Ошибки синхронизации
export class SyncError extends ApplicationError {
  constructor(message: string = 'Ошибка синхронизации', details?: Record<string, unknown>) {
    super(message, 'SYNC_ERROR', 500, details)
  }
}

// Race condition при синхронизации
export class SyncConflictError extends SyncError {
  constructor(details?: Record<string, unknown>) {
    super('Конфликт синхронизации. Попробуйте снова', details)
    this.code = 'SYNC_CONFLICT'
  }
}

// Ошибки базы данных
export class DatabaseError extends ApplicationError {
  constructor(message: string = 'Ошибка базы данных', details?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', 500, details)
  }
}

// Rate limit exceeded
export class RateLimitError extends ApplicationError {
  constructor(retryAfter?: number) {
    super(
      'Слишком много запросов. Попробуйте позже',
      'RATE_LIMIT_EXCEEDED',
      429,
      { retryAfter }
    )
  }
}

// Таймаут запроса
export class TimeoutError extends NetworkError {
  constructor(message: string = 'Превышено время ожидания') {
    super(message)
    this.code = 'TIMEOUT'
  }
}

// Тип для всех возможных ошибок приложения
export type AppError =
  | ApplicationError
  | NetworkError
  | AuthError
  | AuthenticationError
  | SessionExpiredError
  | ForbiddenError
  | ValidationError
  | NotFoundError
  | ConflictError
  | SyncError
  | SyncConflictError
  | DatabaseError
  | RateLimitError
  | TimeoutError
  | Error

// Тип guard для проверки на ApplicationError
export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError
}

// Интерфейс для безопасного представления ошибки (без stack)
interface SafeError {
  name: string
  code: string
  message: string
  statusCode: number
  details?: Record<string, unknown>
}

// Функция для получения безопасного для логирования объекта
export function toSafeError(error: unknown): SafeError {
  if (isApplicationError(error)) {
    return {
      name: error.name,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
    }
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      code: 'UNKNOWN_ERROR',
      message: error.message,
      statusCode: 500,
    }
  }

  return {
    name: 'UnknownError',
    code: 'UNKNOWN_ERROR',
    message: String(error),
    statusCode: 500,
  }
}

// Mapping error codes to user-friendly messages
export const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Ошибка подключения к серверу. Проверьте интернет.',
  AUTH_ERROR: 'Ошибка авторизации',
  AUTHENTICATION_FAILED: 'Неверный email или пароль',
  SESSION_EXPIRED: 'Сессия истекла. Войдите снова',
  FORBIDDEN: 'Недостаточно прав для выполнения действия',
  VALIDATION_ERROR: 'Некорректные данные',
  NOT_FOUND: 'Ресурс не найден',
  CONFLICT: 'Конфликт данных. Обновите страницу',
  SYNC_ERROR: 'Ошибка синхронизации',
  SYNC_CONFLICT: 'Конфликт синхронизации. Попробуйте снова',
  DATABASE_ERROR: 'Ошибка при сохранении данных',
  RATE_LIMIT_EXCEEDED: 'Слишком много запросов. Подождите немного',
  TIMEOUT: 'Превышено время ожидания',
  UNKNOWN_ERROR: 'Произошла ошибка. Попробуйте позже',
}

// Функция для получения пользовательского сообщения об ошибке
export function getUserMessage(error: unknown): string {
  if (isApplicationError(error)) {
    return ERROR_MESSAGES[error.code] || error.message
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR
}
