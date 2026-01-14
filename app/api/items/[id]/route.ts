import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// PUT /api/items/[id] - Обновить товар
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id } = await params
    const body = await request.json()
    const { name, quantity } = body

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

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(quantity !== undefined && { quantity: Math.max(1, quantity) }),
      }
    })

    return NextResponse.json({ item: updatedItem })

  } catch (error) {
    console.error('Update item error:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении товара' },
      { status: 500 }
    )
  }
}

// DELETE /api/items/[id] - Удалить товар
export async function DELETE(
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

    await prisma.item.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Товар удалён' })

  } catch (error) {
    console.error('Delete item error:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении товара' },
      { status: 500 }
    )
  }
}
