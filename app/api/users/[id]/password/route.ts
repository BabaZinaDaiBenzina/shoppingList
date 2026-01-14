import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'
import { verifyPassword, hashPassword } from '@/lib/auth'

// PATCH /api/users/[id]/password - Изменить пароль пользователя
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

    // Пользователь может изменять только свой пароль
    if (userId !== targetUserId) {
      return NextResponse.json(
        { error: 'Нет прав для изменения пароля' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Укажите текущий и новый пароль' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Новый пароль должен быть не менее 6 символов' },
        { status: 400 }
      )
    }

    // Получаем текущий хеш пароля
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { passwordHash: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Проверяем текущий пароль
    const isValidPassword = await verifyPassword(currentPassword, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Неверный текущий пароль' },
        { status: 401 }
      )
    }

    // Хешируем новый пароль
    const hashedPassword = await hashPassword(newPassword)

    // Обновляем пароль
    await prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash: hashedPassword },
    })

    return NextResponse.json({ message: 'Пароль успешно изменен' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Ошибка при изменении пароля' },
      { status: 500 }
    )
  }
}
