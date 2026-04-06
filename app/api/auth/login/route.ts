import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateAccessToken, generateRefreshToken, setAccessTokenCookie, setRefreshTokenCookie } from '@/lib/auth'
import { rateLimitMiddleware, rateLimits } from '@/lib/rateLimit'
import { csrfMiddleware } from '@/lib/csrf'
import { loginSchema } from '@/lib/validations'
import { logError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  // 1. CSRF защита
  const csrf = csrfMiddleware(request)
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Неверный CSRF токен' },
      { status: 403 }
    )
  }

  // 2. Rate limiting - защита от brute force
  const rateLimit = rateLimitMiddleware(request, rateLimits.auth)

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Слишком много попыток. Попробуйте позже.' },
      {
        status: 429,
        headers: rateLimit.headers
      }
    )
  }

  try {
    const body = await request.json()

    // 3. Валидация с помощью Zod
    const validationResult = loginSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Ошибка валидации',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data

    // Поиск пользователя
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Проверка пароля
    const isValidPassword = await verifyPassword(password, user.passwordHash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Генерация токенов
    const accessToken = generateAccessToken(user.id)
    const refreshToken = generateRefreshToken()

    // Сохраняем refresh токен в базу данных
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 90) // 90 дней (было 30)

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      }
    })

    // Возвращаем данные пользователя без пароля
    const { passwordHash, ...userWithoutPassword } = user

    // Создаем ответ
    const response = NextResponse.json({
      user: userWithoutPassword,
    })

    // Устанавливаем httpOnly cookies с токенами
    response.headers.append('Set-Cookie', setAccessTokenCookie(accessToken))
    response.headers.append('Set-Cookie', setRefreshTokenCookie(refreshToken))

    return response

  } catch (error) {
    logError('Login error', error)
    return NextResponse.json(
      { error: 'Ошибка при входе' },
      { status: 500 }
    )
  }
}
