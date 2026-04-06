import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAccessToken, generateRefreshToken, setAccessTokenCookie, setRefreshTokenCookie, REFRESH_TOKEN_COOKIE } from '@/lib/auth'
import { logError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    // Извлекаем refresh токен из cookie
    const cookie = request.headers.get('cookie')

    if (!cookie) {
      return NextResponse.json(
        { error: 'Отсутствует refresh токен' },
        { status: 401 }
      )
    }

    const cookies = cookie.split(';').map(c => c.trim())
    const refreshCookie = cookies.find(c => c.startsWith(`${REFRESH_TOKEN_COOKIE}=`))

    if (!refreshCookie) {
      return NextResponse.json(
        { error: 'Отсутствует refresh токен' },
        { status: 401 }
      )
    }

    const refreshToken = refreshCookie.substring(REFRESH_TOKEN_COOKIE.length + 1)

    // Ищем refresh токен в базе данных
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    })

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Невалидный refresh токен' },
        { status: 401 }
      )
    }

    // Проверяем срок действия refresh токена
    if (tokenRecord.expiresAt < new Date()) {
      // Удаляем истекший токен
      await prisma.refreshToken.delete({
        where: { id: tokenRecord.id }
      })

      return NextResponse.json(
        { error: 'Refresh токен истек. Необходимо войти снова.' },
        { status: 401 }
      )
    }

    // Генерируем новые токены
    const newAccessToken = generateAccessToken(tokenRecord.userId)
    const newRefreshToken = generateRefreshToken()

    // Вычисляем новую дату истечения для refresh токена
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + 90) // 90 дней (было 30)

    // Обновляем refresh токен в базе данных (ротация токенов)
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        token: newRefreshToken,
        expiresAt: newExpiresAt,
      }
    })

    // Создаем ответ
    const response = NextResponse.json({
      message: 'Токены обновлены',
    })

    // Устанавливаем новые cookies
    response.headers.append('Set-Cookie', setAccessTokenCookie(newAccessToken))
    response.headers.append('Set-Cookie', setRefreshTokenCookie(newRefreshToken))

    return response

  } catch (error) {
    logError('Refresh token error', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении токена' },
      { status: 500 }
    )
  }
}
