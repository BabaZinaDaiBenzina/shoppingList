import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedAdmin, unauthorizedResponse } from '@/lib/middleware'

// DELETE /api/admin/shopping-lists/[id] - Удалить любой список покупок
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await getAuthenticatedAdmin(request)

    if (!adminId) {
      return unauthorizedResponse()
    }

    const { id: listId } = await params

    // Проверяем, существует ли список
    const list = await prisma.shoppingList.findUnique({
      where: { id: listId }
    })

    if (!list) {
      return NextResponse.json(
        { error: 'Список не найден' },
        { status: 404 }
      )
    }

    // Удаляем список (каскадно удалятся все элементы)
    await prisma.shoppingList.delete({
      where: { id: listId }
    })

    return NextResponse.json({ message: 'Список удален' })

  } catch (error) {
    console.error('Delete shopping list error:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении списка' },
      { status: 500 }
    )
  }
}
