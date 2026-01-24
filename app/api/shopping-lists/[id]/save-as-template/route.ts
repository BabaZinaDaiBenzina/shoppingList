import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// POST /api/shopping-lists/[id]/save-as-template - Сохранить список как шаблон
export async function POST(
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
    const { templateName, templateDescription } = body

    // Получаем список с товарами
    const shoppingList = await prisma.shoppingList.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!shoppingList) {
      return NextResponse.json(
        { error: 'Список не найден' },
        { status: 404 }
      )
    }

    if (!templateName || typeof templateName !== 'string') {
      return NextResponse.json(
        { error: 'Название шаблона обязательно' },
        { status: 400 }
      )
    }

    if (shoppingList.items.length === 0) {
      return NextResponse.json(
        { error: 'Нельзя создать шаблон из пустого списка' },
        { status: 400 }
      )
    }

    // Создаем шаблон на основе списка
    const template = await prisma.template.create({
      data: {
        name: templateName.trim(),
        description: templateDescription?.trim() || null,
        userId: userId,
        isPublic: false,
        items: {
          create: shoppingList.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            productId: item.productId,
            categoryId: item.product?.categoryId || null
          }))
        }
      },
      include: {
        items: true
      }
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Save list as template error:', error)
    return NextResponse.json(
      { error: 'Ошибка при сохранении шаблона' },
      { status: 500 }
    )
  }
}
