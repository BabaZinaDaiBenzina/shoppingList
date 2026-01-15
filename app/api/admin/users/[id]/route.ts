import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedAdmin, unauthorizedResponse, forbiddenResponse } from '@/lib/middleware'

// DELETE /api/admin/users/[id] - Удалить пользователя
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminId = await getAuthenticatedAdmin(request)

    if (!adminId) {
      return unauthorizedResponse()
    }

    const userId = params.id

    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Не даем админу удалить себя
    if (userId === adminId) {
      return NextResponse.json(
        { error: 'Нельзя удалить自己的 аккаунт' },
        { status: 400 }
      )
    }

    // Удаляем пользователя (каскадно удалятся все связанные данные)
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ message: 'Пользователь удален' })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении пользователя' },
      { status: 500 }
    )
  }
}
