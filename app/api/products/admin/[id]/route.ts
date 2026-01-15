import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// PUT /api/products/admin/[id] - Обновить продукт
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

    // Проверяем, существует ли продукт
    const existing = await prisma.product.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Продукт не найден' },
        { status: 404 }
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

    // Проверяем, не занято ли имя в этой категории
    const nameTaken = await prisma.product.findFirst({
      where: {
        name: name.trim(),
        categoryId,
        NOT: { id }
      }
    })

    if (nameTaken) {
      return NextResponse.json(
        { error: 'Такой продукт уже есть в этой категории' },
        { status: 400 }
      )
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name.trim(),
        categoryId,
        unit: unit || null,
      },
      include: {
        category: true
      }
    })

    return NextResponse.json({ product })

  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении продукта' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/admin/[id] - Удалить продукт
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

    // Проверяем, используется ли продукт в списках
    const itemsCount = await prisma.item.count({
      where: { productId: id }
    })

    if (itemsCount > 0) {
      return NextResponse.json(
        { error: `Продукт используется в ${itemsCount} списках. Нельзя удалить.` },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении продукта' },
      { status: 500 }
    )
  }
}
