import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// PUT /api/categories/admin/[id] - Обновить категорию
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
    const { name, icon, sortOrder } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Название категории обязательно' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли категория
    const existing = await prisma.category.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      )
    }

    // Проверяем, не занято ли имя другой категорией
    const nameTaken = await prisma.category.findFirst({
      where: {
        name: name.trim(),
        NOT: { id }
      }
    })

    if (nameTaken) {
      return NextResponse.json(
        { error: 'Категория с таким названием уже существует' },
        { status: 400 }
      )
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        icon: icon || null,
        sortOrder: sortOrder !== undefined ? sortOrder : existing.sortOrder,
      },
      include: {
        products: true
      }
    })

    return NextResponse.json({ category })

  } catch (error) {
    console.error('Update category error:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении категории' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/admin/[id] - Удалить категорию
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

    // Проверяем, есть ли продукты в категории
    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    })

    if (productsCount > 0) {
      return NextResponse.json(
        { error: `Нельзя удалить категорию с ${productsCount} продуктами. Сначала удалите или переместите продукты.` },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete category error:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении категории' },
      { status: 500 }
    )
  }
}
