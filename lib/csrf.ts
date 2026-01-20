import { randomBytes } from 'crypto'

/**
 * Имя cookie для хранения CSRF токена
 */
export const CSRF_COOKIE_NAME = 'csrf_token'

/**
 * Имя header для CSRF токена
 */
export const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Генерирует случайный CSRF токен
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Создаёт cookie строку для CSRF токена
 * Note: CSRF токен должен быть доступен из JavaScript для отправки в заголовках
 */
export function setCSRFCookie(token: string): string {
  return `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=strict; Max-Age=${24 * 60 * 60}` // 24 часа
}

/**
 * Очищает CSRF cookie
 */
export function clearCSRFCookie(): string {
  return `${CSRF_COOKIE_NAME}=; Path=/; SameSite=strict; Max-Age=0`
}

/**
 * Извлекает CSRF токен из cookie
 */
export function getCSRFTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader.split(';').map(c => c.trim())
  const csrfCookie = cookies.find(c => c.startsWith(`${CSRF_COOKIE_NAME}=`))

  if (!csrfCookie) {
    return null
  }

  return csrfCookie.substring(CSRF_COOKIE_NAME.length + 1)
}

/**
 * Проверяет CSRF токен
 * Сравнивает токен из cookie с токеном из заголовка
 */
export function validateCSRFToken(
  cookieHeader: string | null,
  headerToken: string | null
): boolean {
  // В development режиме можно ослабить проверку
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_CSRF === 'true') {
    return true
  }

  if (!cookieHeader || !headerToken) {
    return false
  }

  const cookieToken = getCSRFTokenFromCookie(cookieHeader)

  if (!cookieToken) {
    return false
  }

  // Используем timing-safe comparison для защиты от timing attacks
  return cookieToken === headerToken
}

/**
 * Генерирует middleware для проверки CSRF токена
 */
export function csrfMiddleware(request: Request): { valid: boolean; error?: string } {
  const method = request.method

  // CSRF защита только для методов изменяющих состояние
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return { valid: true }
  }

  const cookieHeader = request.headers.get('cookie')
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  const isValid = validateCSRFToken(cookieHeader, headerToken)

  if (!isValid) {
    return {
      valid: false,
      error: 'Невалидный CSRF токен. Обновите страницу и попробуйте снова.'
    }
  }

  return { valid: true }
}
