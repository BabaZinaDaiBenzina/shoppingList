import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// POST /api/templates/[id]/apply - Применить шаблон к списку
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
    const { listName } = body

    // Получаем шаблон
    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      )
    }

    // Проверяем права доступа (свой или публичный)
    if (template.userId !== userId && !template.isPublic) {
      return NextResponse.json(
        { error: 'Нет доступа к шаблону' },
        { status: 403 }
      )
    }

    if (!listName || typeof listName !== 'string') {
      return NextResponse.json(
        { error: 'Название списка обязательно' },
        { status: 400 }
      )
    }

    // Создаем новый список на основе шаблона
    const shoppingList = await prisma.shoppingList.create({
      data: {
        name: listName.trim(),
        userId: userId,
        items: {
          create: template.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            productId: item.productId,
            purchased: false // Все товары начинаются как не купленные
          }))
        }
      },
      include: {
        items: true
      }
    })

    return NextResponse.json({ shoppingList }, { status: 201 })
  } catch (error) {
    console.error('Apply template error:', error)
    return NextResponse.json(
      { error: 'Ошибка при применении шаблона' },
      { status: 500 }
    )
  }
}
