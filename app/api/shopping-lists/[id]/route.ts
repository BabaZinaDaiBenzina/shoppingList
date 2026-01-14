import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// GET /api/shopping-lists/[id] - Получить конкретный список
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id } = await params

    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id,
        userId, // Проверяем, что список принадлежит пользователю
      },
      include: {
        items: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!shoppingList) {
      return NextResponse.json(
        { error: 'Список не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({ shoppingList })

  } catch (error) {
    console.error('Get shopping list error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка' },
      { status: 500 }
    )
  }
}

// PUT /api/shopping-lists/[id] - Обновить список
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
    const { name } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Название списка обязательно' },
        { status: 400 }
      )
    }

    // Проверяем, что список принадлежит пользователю
    const existingList = await prisma.shoppingList.findFirst({
      where: { id, userId }
    })

    if (!existingList) {
      return NextResponse.json(
        { error: 'Список не найден' },
        { status: 404 }
      )
    }

    const shoppingList = await prisma.shoppingList.update({
      where: { id },
      data: {
        name: name.trim(),
      },
      include: {
        items: true,
      }
    })

    return NextResponse.json({ shoppingList })

  } catch (error) {
    console.error('Update shopping list error:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении списка' },
      { status: 500 }
    )
  }
}

// DELETE /api/shopping-lists/[id] - Удалить список
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

    // Проверяем, что список принадлежит пользователю
    const existingList = await prisma.shoppingList.findFirst({
      where: { id, userId }
    })

    if (!existingList) {
      return NextResponse.json(
        { error: 'Список не найден' },
        { status:  404 }
      )
    }

    // Удаляем список (каскадно удалятся все товары)
    await prisma.shoppingList.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Список удалён' })

  } catch (error) {
    console.error('Delete shopping list error:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении списка' },
      { status: 500 }
    )
  }
}
