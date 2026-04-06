import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies, verifyAccessToken, REFRESH_TOKEN_COOKIE } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/middleware'
import { logError } from '@/lib/logger'

/**
 * Logout со всех устройств
 * Удаляет все refresh токены пользователя
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем ID пользователя из access токена
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Удаляем все refresh токены пользователя
    await prisma.refreshToken.deleteMany({
      where: { userId }
    })

    // Создаём ответ и удаляем cookies
    const response = NextResponse.json({
      message: 'Выполнен выход со всех устройств',
    })

    // Удаляем оба cookies
    const [clearAccess, clearRefresh] = clearAuthCookies()
    response.headers.append('Set-Cookie', clearAccess)
    response.headers.append('Set-Cookie', clearRefresh)

    return response

  } catch (error) {
    logError('Logout all error', error)
    return NextResponse.json(
      { error: 'Ошибка при выходе со всех устройств' },
      { status: 500 }
    )
  }
}
