import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateAccessToken, generateRefreshToken, setAccessTokenCookie, setRefreshTokenCookie } from '@/lib/auth'
import { rateLimitMiddleware, rateLimits } from '@/lib/rateLimit'
import { csrfMiddleware } from '@/lib/csrf'
import { registerSchema } from '@/lib/validations'
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

  // 2. Rate limiting - защита от спама регистраций
  const rateLimit = rateLimitMiddleware(request, rateLimits.auth)

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Слишком много попыток регистрации. Попробуйте позже.' },
      {
        status: 429,
        headers: rateLimit.headers
      }
    )
  }

  try {
    const body = await request.json()

    // 3. Валидация с помощью Zod
    const validationResult = registerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Ошибка валидации',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      )
    }

    const { email, username, password, name } = validationResult.data

    // Проверка существующего пользователя
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    })

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'Пользователь с таким email уже существует' },
          { status: 409 }
        )
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: 'Пользователь с таким username уже существует' },
          { status: 409 }
        )
      }
    }

    // Хеширование пароля
    const passwordHash = await hashPassword(password)

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        name: name || username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      }
    })

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

    // Создаем ответ
    const response = NextResponse.json({
      user,
    }, { status: 201 })

    // Устанавливаем httpOnly cookies с токенами
    response.headers.append('Set-Cookie', setAccessTokenCookie(accessToken))
    response.headers.append('Set-Cookie', setRefreshTokenCookie(refreshToken))

    return response

  } catch (error) {
    logError('Registration error', error)
    return NextResponse.json(
      { error: 'Ошибка при регистрации' },
      { status: 500 }
    )
  }
}
