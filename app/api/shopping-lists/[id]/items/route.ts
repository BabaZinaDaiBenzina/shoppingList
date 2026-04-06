import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse, canAccessList } from '@/lib/middleware'
import { csrfMiddleware } from '@/lib/csrf'
import { createItemSchema } from '@/lib/validations'
import { logError } from '@/lib/logger'

// POST /api/shopping-lists/[id]/items - Добавить товар в список
export async function POST(
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

    const { id: listId } = await params
    const body = await request.json()

    // 2. Валидация с помощью Zod
    const validationResult = createItemSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Ошибка валидации',
          details: validationResult.error.flatten()
        },
        { status: 400 }
      )
    }

    const { name, quantity, unit, productId, categoryId } = validationResult.data

    // Проверяем, что пользователь имеет доступ к списку
    const hasAccess = await canAccessList(userId, listId)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Список не найден' },
        { status: 404 }
      )
    }

    let finalProductId = productId

    // Если передана категория, но не передан productId, создаём продукт или ищем существующий
    if (categoryId && !productId) {
      // Проверяем, существует ли продукт с таким именем в этой категории
      const existingProduct = await prisma.product.findUnique({
        where: {
          categoryId_name: {
            categoryId,
            name: name.trim()
          }
        }
      })

      if (existingProduct) {
        finalProductId = existingProduct.id
      } else {
        // Создаём новый продукт
        const newProduct = await prisma.product.create({
          data: {
            name: name.trim(),
            categoryId,
          }
        })
        finalProductId = newProduct.id
      }
    }

    const item = await prisma.item.create({
      data: {
        name: name.trim(),
        quantity: Math.max(1, quantity),
        unit: unit || null,
        listId,
        productId: finalProductId || null,
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    })

    // ✅ Возвращаем только созданный item, без лишнего запроса за списком
    return NextResponse.json({ item }, { status: 201 })

  } catch (error) {
    logError('Create item error', error)
    return NextResponse.json(
      { error: 'Ошибка при добавлении товара' },
      { status: 500 }
    )
  }
}
