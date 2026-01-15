import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse, canAccessList } from '@/lib/middleware'

// POST /api/shopping-lists/[id]/items - Добавить товар в список
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id: listId } = await params
    const body = await request.json()
    const { name, quantity = 1 } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Название товара обязательно' },
        { status: 400 }
      )
    }

    // Проверяем, что пользователь имеет доступ к списку
    const hasAccess = await canAccessList(userId, listId)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Список не найден' },
        { status: 404 }
      )
    }

    const item = await prisma.item.create({
      data: {
        name: name.trim(),
        quantity: Math.max(1, quantity),
        listId,
      }
    })

    return NextResponse.json({ item }, { status: 201 })

  } catch (error) {
    console.error('Create item error:', error)
    return NextResponse.json(
      { error: 'Ошибка при добавлении товара' },
      { status: 500 }
    )
  }
}
