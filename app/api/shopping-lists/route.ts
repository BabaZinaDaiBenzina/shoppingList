import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// GET /api/shopping-lists - Получить все списки пользователя
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const shoppingLists = await prisma.shoppingList.findMany({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

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
        items: true,
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
