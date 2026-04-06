import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomBytes } from 'crypto'

/**
 * Получает JWT_SECRET с валидацией в runtime
 *
 * Валидация происходит при первом вызове функции, а не при импорте модуля.
 * Это позволяет корректно работать в средах где переменные окружения
 * недоступны во время сборки (например, Docker build).
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error(
      'FATAL ERROR: JWT_SECRET is not defined in environment variables. ' +
      'Please set JWT_SECRET in your .env file with a secure random string (min 32 characters).'
    )
  }

  if (secret.length < 32) {
    throw new Error(
      'FATAL ERROR: JWT_SECRET must be at least 32 characters long for security. ' +
      'Current length: ' + secret.length + ' characters.'
    )
  }

  return secret
}

/**
 * Хеширует пароль с использованием bcrypt
 * @param password - пароль в открытом виде
 * @returns захешированный пароль
 */
export async function hashPassword(password: string): Promise<string> {
  // Увеличили с 10 до 12 для лучшей безопасности
  return bcrypt.hash(password, 12)
}

/**
 * Проверяет пароль против захешированной версии
 * @param password - пароль в открытом виде
 * @param hashedPassword - захешированный пароль
 * @returns true если пароли совпадают
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Константы для токенов
 */
export const TOKEN_EXPIRY = {
  ACCESS: '1h' as const, // 1 час для access токена (было 15 минут)
  REFRESH: 90 * 24 * 60 * 60, // 90 дней для refresh токена в секундах (было 30)
}

/**
 * Генерирует JWT access токен для пользователя
 * @param userId - ID пользователя
 * @returns JWT access токен
 */
export function generateAccessToken(userId: string): string {
  const secret = getJwtSecret()
  return jwt.sign({ userId, type: 'access' }, secret, { expiresIn: TOKEN_EXPIRY.ACCESS })
}

/**
 * Генерирует refresh токен
 * @returns безопасная случайная строка для refresh токена
 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Проверяет JWT access токен
 * @param token - JWT токен
 * @returns данные пользователя или null если токен невалидный
 */
export function verifyAccessToken(token: string): { userId: string } | null {
  try {
    const secret = getJwtSecret()
    const decoded = jwt.verify(token, secret) as { userId: string; type?: string }

    // Проверяем, что это access токен
    if (decoded.type !== 'access') {
      return null
    }

    return { userId: decoded.userId }
  } catch {
    return null
  }
}

/**
 * Извлекает userId из токена (без проверки типа)
 * Используется для совместимости с middleware
 * @param token - JWT токен
 * @returns данные пользователя или null если токен невалидный
 */
export function verifyToken(token: string): { userId: string } | null {
  return verifyAccessToken(token)
}

/**
 * Проверяет срок действия access токена
 * @param token - JWT токен
 * @returns true если токен истек или скоро истечет (в течение 1 минуты)
 */
export function isTokenExpiringSoon(token: string): boolean {
  try {
    const secret = getJwtSecret()
    const decoded = jwt.verify(token, secret) as { userId: string; exp: number }

    if (!decoded.exp) {
      return true
    }

    // Проверяем, истекает ли токен в течение 1 минуты
    const expiryTime = decoded.exp * 1000 // Конвертируем в миллисекунды
    const oneMinuteFromNow = Date.now() + 60 * 1000

    return expiryTime <= oneMinuteFromNow
  } catch {
    return true // Если не можем декодировать, считаем что токен истек
  }
}

/**
 * Настройки httpOnly cookie
 */
export const ACCESS_TOKEN_COOKIE = 'access_token'
export const REFRESH_TOKEN_COOKIE = 'refresh_token'

export function getAccessTokenCookieOptions(): {
  name: string
  options: {
    httpOnly: boolean
    secure: boolean
    sameSite: 'strict' | 'lax' | 'none'
    path: string
    maxAge: number
  }
} {
  return {
    name: ACCESS_TOKEN_COOKIE,
    options: {
      httpOnly: true, // Токен недоступен из JavaScript (защита от XSS)
      secure: process.env.NODE_ENV === 'production', // Включено в production для HTTPS
      sameSite: 'strict', // Защита от CSRF
      path: '/', // Доступен на всех страницах
      maxAge: 15 * 60, // 15 минут в секундах
    }
  }
}

export function getRefreshTokenCookieOptions(): {
  name: string
  options: {
    httpOnly: boolean
    secure: boolean
    sameSite: 'strict' | 'lax' | 'none'
    path: string
    maxAge: number
  }
} {
  return {
    name: REFRESH_TOKEN_COOKIE,
    options: {
      httpOnly: true, // Токен недоступен из JavaScript (защита от XSS)
      secure: process.env.NODE_ENV === 'production', // Включено в production для HTTPS
      sameSite: 'strict', // Защита от CSRF
      path: '/', // Доступен на всех страницах
      maxAge: TOKEN_EXPIRY.REFRESH, // 90 дней
    }
  }
}

/**
 * Создаёт cookie строку для access токена
 */
export function setAccessTokenCookie(token: string): string {
  const { name, options } = getAccessTokenCookieOptions()
  const cookieValue = `${name}=${token}; Path=${options.path}; HttpOnly; SameSite=${options.sameSite}`

  if (options.secure) {
    return `${cookieValue}; Secure; Max-Age=${options.maxAge}`
  }

  return `${cookieValue}; Max-Age=${options.maxAge}`
}

/**
 * Создаёт cookie строку для refresh токена
 */
export function setRefreshTokenCookie(token: string): string {
  const { name, options } = getRefreshTokenCookieOptions()
  const cookieValue = `${name}=${token}; Path=${options.path}; HttpOnly; SameSite=${options.sameSite}`

  if (options.secure) {
    return `${cookieValue}; Secure; Max-Age=${options.maxAge}`
  }

  return `${cookieValue}; Max-Age=${options.maxAge}`
}

/**
 * Очищает оба cookie
 */
export function clearAuthCookies(): string[] {
  const accessClear = `${ACCESS_TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=strict; Max-Age=0`
  const refreshClear = `${REFRESH_TOKEN_COOKIE}=; Path=/; HttpOnly; SameSite=strict; Max-Age=0`
  return [accessClear, refreshClear]
}

/**
 * Создаёт response с установленным auth cookie
 * @deprecated Используйте setAccessTokenCookie и setRefreshTokenCookie отдельно
 */
export function setAuthCookie(token: string): string {
  return setAccessTokenCookie(token)
}

/**
 * Создаёт response для удаления auth cookie
 * @deprecated Используйте clearAuthCookies
 */
export function clearAuthCookie(): string {
  return clearAuthCookies().join(', ')
}
