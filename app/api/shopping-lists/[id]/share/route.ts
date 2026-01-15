import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse, forbiddenResponse } from '@/lib/middleware'

// GET /api/shopping-lists/[id]/share - Получить список пользователей, с которыми поделились
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id: listId } = await params

    // Проверяем, что пользователь является владельцем списка
    const list = await prisma.shoppingList.findUnique({
      where: { id: listId },
      select: { userId: true },
    })

    if (!list) {
      return NextResponse.json(
        { error: 'Список не найден' },
        { status: 404 }
      )
    }

    if (list.userId !== userId) {
      return forbiddenResponse()
    }

    // Получаем всех пользователей, с которыми поделились списком
    const shares = await prisma.listShare.findMany({
      where: { listId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ shares })

  } catch (error) {
    console.error('Get list shares error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка доступов' },
      { status: 500 }
    )
  }
}

// POST /api/shopping-lists/[id]/share - Поделиться списком с пользователем
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
    const { targetUserId } = body

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'ID пользователя обязателен' },
        { status: 400 }
      )
    }

    // Проверяем, что пользователь является владельцем списка
    const list = await prisma.shoppingList.findUnique({
      where: { id: listId },
      select: { userId: true },
    })

    if (!list) {
      return NextResponse.json(
        { error: 'Список не найден' },
        { status: 404 }
      )
    }

    if (list.userId !== userId) {
      return forbiddenResponse()
    }

    // Проверяем, что целевой пользователь существует
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Проверяем, что еще не поделились с этим пользователем
    const existingShare = await prisma.listShare.findUnique({
      where: {
        listId_userId: {
          listId,
          userId: targetUserId,
        },
      },
    })

    if (existingShare) {
      return NextResponse.json(
        { error: 'Список уже доступен этому пользователю' },
        { status: 400 }
      )
    }

    // Создаем запись о sharing
    const share = await prisma.listShare.create({
      data: {
        listId,
        userId: targetUserId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ share }, { status: 201 })

  } catch (error) {
    console.error('Share list error:', error)
    return NextResponse.json(
      { error: 'Ошибка при предоставлении доступа' },
      { status: 500 }
    )
  }
}

// DELETE /api/shopping-lists/[id]/share - Удалить доступ пользователя к списку
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id: listId } = await params
    const searchParams = request.nextUrl.searchParams
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'ID пользователя обязателен' },
        { status: 400 }
      )
    }

    // Проверяем, что пользователь является владельцем списка
    const list = await prisma.shoppingList.findUnique({
      where: { id: listId },
      select: { userId: true },
    })

    if (!list) {
      return NextResponse.json(
        { error: 'Список не найден' },
        { status: 404 }
      )
    }

    if (list.userId !== userId) {
      return forbiddenResponse()
    }

    // Удаляем запись о sharing
    await prisma.listShare.delete({
      where: {
        listId_userId: {
          listId,
          userId: targetUserId,
        },
      },
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Remove list share error:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении доступа' },
      { status: 500 }
    )
  }
}
