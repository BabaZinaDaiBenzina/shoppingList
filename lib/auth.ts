import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

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
 * Генерирует JWT токен для пользователя
 * @param userId - ID пользователя
 * @returns JWT токен
 */
export function generateToken(userId: string): string {
  const secret = getJwtSecret()
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}

/**
 * Проверяет JWT токен
 * @param token - JWT токен
 * @returns данные пользователя или null если токен невалидный
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const secret = getJwtSecret()
    return jwt.verify(token, secret) as { userId: string }
  } catch {
    return null
  }
}

/**
 * Настройки httpOnly cookie для токена авторизации
 *
 * httpOnly - защита от XSS (токен недоступен из JavaScript)
 * secure - передача только по HTTPS
 * sameSite=strict - защита от CSRF
 * path=/ - доступен на всех страницах
 * maxAge=7d - время жизни токена
 */
export const AUTH_COOKIE_NAME = 'auth_token'

export function getAuthCookieOptions(): {
  name: string
  options: {
    httpOnly: boolean
    secure: boolean
    sameSite: 'strict' | 'lax' | 'none'
    path: string
    maxAge: number
  }
} {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    name: AUTH_COOKIE_NAME,
    options: {
      httpOnly: true, // Токен недоступен из JavaScript (защита от XSS)
      secure: isProduction, // HTTPS только в продакшене
      sameSite: 'strict', // Защита от CSRF
      path: '/', // Доступен на всех страницах
      maxAge: 7 * 24 * 60 * 60, // 7 дней в секундах
    }
  }
}

/**
 * Создаёт response с установленным auth cookie
 */
export function setAuthCookie(token: string): string {
  const { name, options } = getAuthCookieOptions()

  const cookieValue = `${name}=${token}; Path=${options.path}; HttpOnly; SameSite=${options.sameSite}`

  // Добавляем secure только в production (HTTPS)
  if (options.secure) {
    return `${cookieValue}; Secure; Max-Age=${options.maxAge}`
  }

  return `${cookieValue}; Max-Age=${options.maxAge}`
}

/**
 * Создаёт response для удаления auth cookie
 */
export function clearAuthCookie(): string {
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=strict; Max-Age=0`
}
