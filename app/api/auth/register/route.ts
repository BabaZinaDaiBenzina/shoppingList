import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, username, password, name } = body

    // Валидация
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Email, username и password обязательны' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      )
    }

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
        createdAt: true,
      }
    })

    // Генерация токена
    const token = generateToken(user.id)

    return NextResponse.json({
      user,
      token,
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Ошибка при регистрации' },
      { status: 500 }
    )
  }
}
