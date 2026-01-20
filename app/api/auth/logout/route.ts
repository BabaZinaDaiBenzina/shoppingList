import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies, REFRESH_TOKEN_COOKIE } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Извлекаем refresh токен из cookie
    const cookie = request.headers.get('cookie')

    if (cookie) {
      const cookies = cookie.split(';').map(c => c.trim())
      const refreshCookie = cookies.find(c => c.startsWith(`${REFRESH_TOKEN_COOKIE}=`))

      if (refreshCookie) {
        const refreshToken = refreshCookie.substring(REFRESH_TOKEN_COOKIE.length + 1)

        // Удаляем refresh токен из базы данных
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken }
        }).catch(() => {
          // Игнорируем ошибки если токена нет в базе
        })
      }
    }

    // Создаём ответ и удаляем httpOnly cookies
    const response = NextResponse.json({
      message: 'Успешный выход',
    })

    // Удаляем оба cookies
    const [clearAccess, clearRefresh] = clearAuthCookies()
    response.headers.append('Set-Cookie', clearAccess)
    response.headers.append('Set-Cookie', clearRefresh)

    return response

  } catch (error) {
    console.error('Logout error:', error)

    // Даже при ошибке очищаем cookies
    const response = NextResponse.json({
      message: 'Выполнен выход',
    })

    const [clearAccess, clearRefresh] = clearAuthCookies()
    response.headers.append('Set-Cookie', clearAccess)
    response.headers.append('Set-Cookie', clearRefresh)

    return response
  }
}
