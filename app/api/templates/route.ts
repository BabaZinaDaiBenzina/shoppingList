import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// GET /api/templates - Получить все шаблоны пользователя
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    // Получаем пользовательские шаблоны и публичные шаблоны
    const [userTemplates, publicTemplates] = await Promise.all([
      prisma.template.findMany({
        where: { userId },
        include: {
          items: {
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.template.findMany({
        where: {
          isPublic: true,
          userId: { not: userId } // Исключаем свои шаблоны
        },
        include: {
          items: {
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10 // Ограничиваем публичные шаблоны
      })
    ])

    return NextResponse.json({
      templates: [
        ...userTemplates,
        ...publicTemplates
      ]
    })
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении шаблонов' },
      { status: 500 }
    )
  }
}

// POST /api/templates - Создать новый шаблон
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { name, description, items } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Название шаблона обязательно' },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Шаблон должен содержать хотя бы один товар' },
        { status: 400 }
      )
    }

    // Создаем шаблон с товарами
    const template = await prisma.template.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: userId,
        isPublic: false, // По умолчанию шаблоны приватные
        items: {
          create: items.map(item => ({
            name: item.name.trim(),
            quantity: item.quantity || 1,
            unit: item.unit || null,
            productId: item.productId || null,
            categoryId: item.categoryId || null
          }))
        }
      },
      include: {
        items: true
      }
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании шаблона' },
      { status: 500 }
    )
  }
}
