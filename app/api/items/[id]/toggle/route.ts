import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// PATCH /api/items/[id]/toggle - Переключить статус purchased
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id } = await params

    // Находим товар и проверяем права доступа через список
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        list: true
      }
    })

    if (!item || item.list.userId !== userId) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      )
    }

    // Переключаем статус
    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        purchased: !item.purchased
      }
    })

    return NextResponse.json({ item: updatedItem })

  } catch (error) {
    console.error('Toggle item error:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении статуса товара' },
      { status: 500 }
    )
  }
}
