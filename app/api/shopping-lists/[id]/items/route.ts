import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse, canAccessList } from '@/lib/middleware'

// POST /api/shopping-lists/[id]/items - Добавить товар в список
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id: listId } = await params
    const body = await request.json()
    const { name, quantity = 1, productId, categoryId } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Название товара обязательно' },
        { status: 400 }
      )
    }

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

    // Получаем обновленный список
    const shoppingList = await prisma.shoppingList.findUnique({
      where: { id: listId },
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
        user: {
          select: {
            id: true,
            username: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({ item, shoppingList }, { status: 201 })

  } catch (error) {
    console.error('Create item error:', error)
    return NextResponse.json(
      { error: 'Ошибка при добавлении товара' },
      { status: 500 }
    )
  }
}
