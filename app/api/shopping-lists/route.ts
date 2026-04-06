import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'
import { csrfMiddleware } from '@/lib/csrf'
import { createShoppingListSchema } from '@/lib/validations'
import { logError } from '@/lib/logger'

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

    return NextResponse.json(
      { shoppingLists },
      {
        headers: {
          // ✅ Cache-Control: 60 сек на сервере, 5 мин stale
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        }
      }
    )

  } catch (error) {
    logError('Get shopping lists error', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списков' },
      { status: 500 }
    )
  }
}

// POST /api/shopping-lists - Создать новый список
export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // 2. Валидация с помощью Zod
    const validationResult = createShoppingListSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Ошибка валидации',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      )
    }

    const { name } = validationResult.data

    const shoppingList = await prisma.shoppingList.create({
      data: {
        name,
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
    logError('Create shopping list error', error)
    return NextResponse.json(
      { error: 'Ошибка при создании списка' },
      { status: 500 }
    )
  }
}
