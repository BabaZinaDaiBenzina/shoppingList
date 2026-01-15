import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// POST /api/products/admin - Создать новый продукт
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { name, categoryId, unit } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Название продукта обязательно' },
        { status: 400 }
      )
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Категория обязательна' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли категория
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      )
    }

    // Проверяем, есть ли уже такой продукт в этой категории
    const existing = await prisma.product.findUnique({
      where: {
        categoryId_name: {
          categoryId,
          name: name.trim()
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Такой продукт уже есть в этой категории' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        categoryId,
        unit: unit || null,
      },
      include: {
        category: true
      }
    })

    return NextResponse.json({ product }, { status: 201 })

  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании продукта' },
      { status: 500 }
    )
  }
}
