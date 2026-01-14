import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// GET /api/users/[id] - Получить профиль пользователя
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id: targetUserId } = await params

    // Пользователь может просматривать только свой профиль
    if (userId !== targetUserId) {
      return NextResponse.json(
        { error: 'Нет прав для просмотра этого профиля' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении пользователя' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/[id] - Обновить профиль пользователя
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id: targetUserId } = await params

    // Пользователь может обновлять только свой профиль
    if (userId !== targetUserId) {
      return NextResponse.json(
        { error: 'Нет прав для обновления этого профиля' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email } = body

    if (!name && !email) {
      return NextResponse.json(
        { error: 'Укажите имя или email для обновления' },
        { status: 400 }
      )
    }

    const updateData: { name?: string; email?: string } = {}
    if (name) updateData.name = name.trim()
    if (email) updateData.email = email.trim()

    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user, message: 'Профиль успешно обновлен' })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении профиля' },
      { status: 500 }
    )
  }
}
