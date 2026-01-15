import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse, canAccessList } from '@/lib/middleware'

// PATCH /api/shopping-lists/[id]/deselect-all - Снять выделение со всех товаров
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id: listId } = await params

    // Проверяем, что пользователь имеет доступ к списку
    const hasAccess = await canAccessList(userId, listId)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Список не найден' },
        { status: 404 }
      )
    }

    // Обновляем все товары в списке, устанавливая purchased = false
    await prisma.item.updateMany({
      where: {
        listId,
        purchased: true
      },
      data: {
        purchased: false
      }
    })

    // Получаем обновленные товары
    const items = await prisma.item.findMany({
      where: { listId }
    })

    return NextResponse.json({ items })

  } catch (error) {
    console.error('Deselect all error:', error)
    return NextResponse.json(
      { error: 'Ошибка при снятии выделения' },
      { status: 500 }
    )
  }
}
