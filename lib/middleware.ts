import { NextRequest } from 'next/server'
import { verifyToken, ACCESS_TOKEN_COOKIE } from './auth'
import { prisma } from './prisma'

/**
 * Извлекает токен из httpOnly cookie
 */
function getTokenFromCookie(request: NextRequest): string | null {
  // Читаем токен из cookie
  const cookie = request.headers.get('cookie')

  if (!cookie) {
    return null
  }

  // Парсим cookie
  const cookies = cookie.split(';').map(c => c.trim())
  const accessCookie = cookies.find(c => c.startsWith(`${ACCESS_TOKEN_COOKIE}=`))

  if (!accessCookie) {
    return null
  }

  return accessCookie.substring(ACCESS_TOKEN_COOKIE.length + 1) // +1 для '='
}

/**
 * Получает ID авторизованного пользователя из httpOnly cookie
 *
 * Резервная поддержка Authorization header для обратной совместимости
 */
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Сначала пробуем cookie (новый способ)
    const tokenFromCookie = getTokenFromCookie(request)

    if (tokenFromCookie) {
      const decoded = verifyToken(tokenFromCookie)
      if (decoded) {
        return decoded.userId
      }
    }

    // Fallback на Authorization header для обратной совместимости
    const authHeader = request.headers.get('authorization')

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7) // Убираем 'Bearer '
      const decoded = verifyToken(token)

      if (decoded) {
        return decoded.userId
      }
    }

    return null
  } catch {
    return null
  }
}

export async function getAuthenticatedAdmin(request: NextRequest) {
  try {
    // Сначала пробуем cookie
    const tokenFromCookie = getTokenFromCookie(request)

    let decoded = null

    if (tokenFromCookie) {
      decoded = verifyToken(tokenFromCookie)
    }

    // Fallback на Authorization header
    if (!decoded) {
      const authHeader = request.headers.get('authorization')

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        decoded = verifyToken(token)
      }
    }

    if (!decoded) {
      return null
    }

    // Проверяем, является ли пользователь администратором
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true }
    })

    if (!user || user.role !== 'admin') {
      return null
    }

    return decoded.userId
  } catch {
    return null
  }
}

export function unauthorizedResponse() {
  return Response.json(
    { error: 'Не авторизован' },
    { status: 401 }
  )
}

export function forbiddenResponse() {
  return Response.json(
    { error: 'Доступ запрещен' },
    { status: 403 }
  )
}

// Проверка прав доступа к списку (владелец или с кем поделились)
export async function canAccessList(userId: string, listId: string): Promise<boolean> {
  const list = await prisma.shoppingList.findFirst({
    where: {
      id: listId,
      OR: [
        { userId: userId }, // Владелец
        { shares: { some: { userId: userId } } }, // С кем поделились
      ],
    },
  })

  return !!list
}

// Проверка прав владельца списка
export async function isListOwner(userId: string, listId: string): Promise<boolean> {
  const list = await prisma.shoppingList.findFirst({
    where: {
      id: listId,
      userId: userId,
    },
  })

  return !!list
}
