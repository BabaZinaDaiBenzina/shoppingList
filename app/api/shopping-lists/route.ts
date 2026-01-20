import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// GET /api/shopping-lists - Получить все списки пользователя (включая shared)
// Optimized: загружает только метаданные списков без items
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    // Получаем собственные списки (без items для производительности)
    const ownLists = await prisma.shoppingList.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            items: true,
            shares: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Получаем списки, которыми поделились с пользователем
    const sharedLists = await prisma.shoppingList.findMany({
      where: {
        shares: {
          some: {
            userId: userId
          }
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        },
        shares: {
          where: {
            userId: userId
          },
          select: {
            id: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Подсчитываем количество купленных товаров для каждого списка (одним запросом)
    const allListIds = [...ownLists, ...sharedLists].map(list => list.id)

    const purchasedCounts = await prisma.item.groupBy({
      by: ['listId'],
      where: {
        listId: { in: allListIds },
        purchased: true
      },
      _count: {
        listId: true
      }
    })

    // Создаем мапу для быстрого доступа
    const purchasedCountMap = Object.fromEntries(
      purchasedCounts.map(item => [item.listId, item._count.listId])
    )

    // Добавляем флаг isShared и purchasedCount для удобства на фронтенде
    const ownListsWithFlag = ownLists.map(list => ({
      ...list,
      isShared: false,
      isOwner: true,
      purchasedCount: purchasedCountMap[list.id] || 0,
    }))

    const sharedListsWithFlag = sharedLists.map(list => ({
      ...list,
      isShared: true,
      isOwner: false,
      purchasedCount: purchasedCountMap[list.id] || 0,
    }))

    const shoppingLists = [...ownListsWithFlag, ...sharedListsWithFlag]

    return NextResponse.json({ shoppingLists })

  } catch (error) {
    console.error('Get shopping lists error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списков' },
      { status: 500 }
    )
  }
}

// POST /api/shopping-lists - Создать новый список
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { name } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Название списка обязательно' },
        { status: 400 }
      )
    }

    const shoppingList = await prisma.shoppingList.create({
      data: {
        name: name.trim(),
        userId,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            items: true
          }
        }
      }
    })

    return NextResponse.json({ shoppingList }, { status: 201 })

  } catch (error) {
    console.error('Create shopping list error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании списка' },
      { status: 500 }
    )
  }
}
