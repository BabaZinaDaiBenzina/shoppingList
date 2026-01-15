import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// GET /api/shopping-lists - Получить все списки пользователя (включая shared)
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    // Получаем собственные списки
    const ownLists = await prisma.shoppingList.findMany({
      where: { userId },
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
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Добавляем флаг isShared для удобства на фронтенде
    const ownListsWithFlag = ownLists.map(list => ({
      ...list,
      isShared: false,
      isOwner: true,
      sharedWith: [] // Можно добавить информацию о том, с кем поделились
    }))

    const sharedListsWithFlag = sharedLists.map(list => ({
      ...list,
      isShared: true,
      isOwner: false,
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
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
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
