/**
 * Rate Limiter - защита от brute force и滥用 API
 *
 * Использует in-memory хранилище запросов по IP.
 * Для продакшена рекомендуется использовать Redis-based solution (upstash/ratelimit).
 */

interface RateLimitStore {
  count: number
  resetTime: number
}

// In-memory хранилище (для продакшена лучше использовать Redis)
const store = new Map<string, RateLimitStore>()

// Очистка старых записей каждые 60 секунд
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of store.entries()) {
    if (now > value.resetTime) {
      store.delete(key)
    }
  }
}, 60000)

export interface RateLimitConfig {
  /** Максимум запросов в окне */
  limit: number
  /** Окно времени в миллисекундах */
  window: number
  /** Кастомный идентификатор (по умолчанию используется IP) */
  identifier?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Проверяет и применяет rate limit
 *
 * @example
 * ```ts
 * const result = await rateLimit({
 *   limit: 5,           // 5 запросов
 *   window: 60000,      // за 60 секунд
 *   identifier: userId  // на пользователя
 * })
 *
 * if (!result.success) {
 *   return new Response('Too many requests', { status: 429 })
 * }
 * ```
 */
export function rateLimit(config: RateLimitConfig): RateLimitResult {
  const { limit, window, identifier = 'default' } = config
  const now = Date.now()
  const key = identifier

  // Получаем или создаём запись
  let entry = store.get(key)

  if (!entry || now > entry.resetTime) {
    // Создаём новую запись или обновляем окно
    entry = {
      count: 1,
      resetTime: now + window
    }
    store.set(key, entry)

    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetTime: entry.resetTime
    }
  }

  // Проверяем лимит
  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }

  // Увеличиваем счётчик
  entry.count++
  store.set(key, entry)

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Получает IP адрес из запроса
 */
export function getClientIP(request: Request): string {
  // Пробуем различные заголовки в порядке приоритета
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')

  if (forwardedFor) {
    // x-forwarded-for может содержать несколько IP, берём первый
    return forwardedFor.split(',')[0].trim()
  }

  if (realIP) {
    return realIP
  }

  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Fallback на удалённый адрес
  return 'unknown'
}

/**
 * Middleware helper для Next.js API routes
 *
 * @example
 * ```ts
 * import { rateLimitMiddleware } from '@/lib/rateLimit'
 *
 * export async function POST(request: Request) {
 *   const rateLimit = rateLimitMiddleware(request, {
 *     limit: 5,
 *     window: 60000
 *   })
 *
 *   if (!rateLimit.success) {
 *     return new Response(
 *       JSON.stringify({ error: 'Too many requests' }),
 *       { status: 429, headers: rateLimit.headers }
 *     )
 *   }
 *
 *   // ... обработка запроса
 * }
 * ```
 */
export function rateLimitMiddleware(
  request: Request,
  config: Omit<RateLimitConfig, 'identifier'>
) {
  const ip = getClientIP(request)
  const result = rateLimit({ ...config, identifier: ip })

  const headers = new Headers({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
  })

  return {
    ...result,
    headers
  }
}

// Предустановленные конфигурации для разных endpoints
export const rateLimits = {
  // Строгий для авторизации
  auth: { limit: 5, window: 60000 }, // 5 запросов/мин

  // Умеренный для API mutations
  mutation: { limit: 20, window: 60000 }, // 20 запросов/мин

  // Мягкий для чтения
  read: { limit: 100, window: 60000 }, // 100 запросов/мин

  // Для поиска
  search: { limit: 30, window: 60000 }, // 30 запросов/мин
} as const
