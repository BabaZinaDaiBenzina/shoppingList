import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'
import { csrfMiddleware } from '@/lib/csrf'
import { logError } from '@/lib/logger'

// GET /api/shopping-lists/[id] - Получить конкретный список с товарами
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

    // ✅ Один запрос с проверкой доступа + получение данных
    const shoppingList = await prisma.shoppingList.findFirst({
      where: {
        id,
        OR: [
          { userId }, // Владелец
          { shares: { some: { userId } } } // Shared
        ]
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    })

    if (!shoppingList) {
      return NextResponse.json(
        { error: 'Список не найден' },
        { status: 404 }
      )
    }

    // Добавляем флаг isOwner и isShared
    const listWithFlags = {
      ...shoppingList,
      isOwner: shoppingList.userId === userId,
      isShared: shoppingList.userId !== userId
    }

    return NextResponse.json(
      { shoppingList: listWithFlags },
      {
        headers: {
          // ✅ Cache-Control: 30 сек на сервере, 2 мин stale
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120'
        }
      }
    )

  } catch (error) {
    logError('Get shopping list error', error)
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
  // 1. CSRF защита
  const csrf = csrfMiddleware(request)
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Неверный CSRF токен' },
      { status: 403 }
    )
  }

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
    logError('Update shopping list error', error)
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
  // 1. CSRF защита
  const csrf = csrfMiddleware(request)
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Неверный CSRF токен' },
      { status: 403 }
    )
  }

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
    logError('Delete shopping list error', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении списка' },
      { status: 500 }
    )
  }
}
