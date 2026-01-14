import { NextRequest } from 'next/server'
import { verifyToken } from './auth'

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

export function unauthorizedResponse() {
  return Response.json(
    { error: 'Не авторизован' },
    { status: 401 }
  )
}
