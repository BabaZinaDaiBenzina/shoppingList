import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth'
import { rateLimitMiddleware, rateLimits } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  // Rate limiting - защита от brute force
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
    console.log('=== LOGIN ATTEMPT DEBUG ===')
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET)
    console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0)
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)

    const body = await request.json()
    const { email, password } = body
    console.log('Email provided:', email)
    console.log('Password provided:', password ? '***' : 'MISSING')

    // Валидация
    if (!email || !password) {
      console.log('Validation failed: missing email or password')
      return NextResponse.json(
        { error: 'Email и password обязательны' },
        { status: 400 }
      )
    }

    // Поиск пользователя
    const user = await prisma.user.findUnique({
      where: { email }
    })

    console.log('User found in DB:', !!user)
    if (user) {
      console.log('User ID:', user.id)
      console.log('User email:', user.email)
      console.log('Password hash exists:', !!user.passwordHash)
      console.log('Password hash length:', user.passwordHash?.length)
    }

    if (!user) {
      console.log('Authentication failed: user not found')
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Проверка пароля
    const isValidPassword = await verifyPassword(password, user.passwordHash)
    console.log('Password verification result:', isValidPassword)

    if (!isValidPassword) {
      console.log('Authentication failed: invalid password')
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Генерация токена
    console.log('Generating token for user:', user.id)
    const token = generateToken(user.id)
    console.log('Token generated successfully, length:', token.length)

    // Возвращаем данные пользователя без пароля
    const { passwordHash, ...userWithoutPassword } = user

    // Устанавливаем httpOnly cookie с токеном
    const response = NextResponse.json({
      user: userWithoutPassword,
      // Токен больше не возвращается в теле ответа для безопасности
    })

    // Устанавливаем cookie
    const cookieValue = setAuthCookie(token)
    console.log('Setting cookie:', cookieValue.substring(0, 100) + '...')
    response.headers.set('Set-Cookie', cookieValue)

    console.log('Login successful for user:', user.id)
    console.log('=== END LOGIN DEBUG ===')

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ошибка при входе' },
      { status: 500 }
    )
  }
}
