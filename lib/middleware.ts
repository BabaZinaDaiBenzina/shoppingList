import { NextRequest } from 'next/server'
import { verifyToken } from './auth'
import { prisma } from './prisma'

export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7) // Убираем 'Bearer '
    const decoded = verifyToken(token)

    if (!decoded) {
      return null
    }

    return decoded.userId
  } catch {
    return null
  }
}

export async function getAuthenticatedAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

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
