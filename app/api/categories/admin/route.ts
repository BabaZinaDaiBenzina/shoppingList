import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// GET /api/categories/admin - Получить все категории (для админа)
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const categories = await prisma.category.findMany({
      include: {
        products: {
          select: {
            id: true,
            name: true,
            unit: true,
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({ categories })

  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении категорий' },
      { status: 500 }
    )
  }
}

// POST /api/categories/admin - Создать новую категорию
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { name, icon, sortOrder } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Название категории обязательно' },
        { status: 400 }
      )
    }

    // Проверяем, есть ли уже категория с таким именем
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Категория с таким названием уже существует' },
        { status: 400 }
      )
    }

    // Определяем sortOrder, если не указан
    let order = sortOrder
    if (order === undefined) {
      const maxOrder = await prisma.category.findFirst({
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true }
      })
      order = (maxOrder?.sortOrder ?? 0) + 1
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        icon: icon || null,
        sortOrder: order,
      },
      include: {
        products: true
      }
    })

    return NextResponse.json({ category }, { status: 201 })

  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании категории' },
      { status: 500 }
    )
  }
}
