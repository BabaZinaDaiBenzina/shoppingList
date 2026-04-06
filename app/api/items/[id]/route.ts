import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse, canAccessList } from '@/lib/middleware'
import { csrfMiddleware } from '@/lib/csrf'
import { updateItemSchema } from '@/lib/validations'
import { logError } from '@/lib/logger'

// PUT /api/items/[id] - Обновить товар
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

    // 2. Валидация с помощью Zod
    const validationResult = updateItemSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Ошибка валидации',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      )
    }

    const { name, quantity, unit } = validationResult.data

    // Находим товар
    const item = await prisma.item.findUnique({
      where: { id },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      )
    }

    // Проверяем права доступа к списку
    const hasAccess = await canAccessList(userId, item.listId)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      )
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(quantity !== undefined && { quantity }),
        ...(unit !== undefined && { unit }),
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    })

    return NextResponse.json({ item: updatedItem })

  } catch (error) {
    logError('Update item error', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении товара' },
      { status: 500 }
    )
  }
}

// DELETE /api/items/[id] - Удалить товар
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

    // Находим товар
    const item = await prisma.item.findUnique({
      where: { id },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      )
    }

    // Проверяем права доступа к списку
    const hasAccess = await canAccessList(userId, item.listId)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      )
    }

    await prisma.item.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Товар удалён' })

  } catch (error) {
    logError('Delete item error', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении товара' },
      { status: 500 }
    )
  }
}
