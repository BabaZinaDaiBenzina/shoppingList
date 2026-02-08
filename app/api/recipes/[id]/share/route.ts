import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// GET /api/recipes/[id]/share - Получить список пользователей, с которыми поделились
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id: recipeId } = await params

    // Проверяем, что рецепт принадлежит пользователю
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { userId: true },
    })

    if (!recipe) {
      return NextResponse.json(
        { error: 'Рецепт не найден' },
        { status: 404 }
      )
    }

    if (recipe.userId !== userId) {
      return NextResponse.json(
        { error: 'Нет прав для просмотра этого рецепта' },
        { status: 403 }
      )
    }

    const shares = await prisma.recipeShare.findMany({
      where: { recipeId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ shares })
  } catch (error) {
    console.error('Get recipe shares error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка доступа' },
      { status: 500 }
    )
  }
}

// POST /api/recipes/[id]/share - Поделиться рецептом с пользователем
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id: recipeId } = await params
    const body = await request.json()
    const { targetUserId } = body

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Не указан пользователь' },
        { status: 400 }
      )
    }

    // Проверяем, что рецепт принадлежит пользователю
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { userId: true, title: true },
    })

    if (!recipe) {
      return NextResponse.json(
        { error: 'Рецепт не найден' },
        { status: 404 }
      )
    }

    if (recipe.userId !== userId) {
      return NextResponse.json(
        { error: 'Нет прав для предоставления доступа к этому рецепту' },
        { status: 403 }
      )
    }

    // Нельзя поделиться с самим собой
    if (targetUserId === userId) {
      return NextResponse.json(
        { error: 'Нельзя поделиться рецептом с самим собой' },
        { status: 400 }
      )
    }

    // Проверяем, есть ли уже share
    const existingShare = await prisma.recipeShare.findUnique({
      where: {
        recipeId_userId: {
          recipeId,
          userId: targetUserId,
        },
      },
    })

    if (existingShare) {
      return NextResponse.json(
        { error: 'Рецепт уже доступен этому пользователю' },
        { status: 400 }
      )
    }

    // Создаём share
    const share = await prisma.recipeShare.create({
      data: {
        recipeId,
        userId: targetUserId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          }
        }
      },
    })

    return NextResponse.json({ share }, { status: 201 })
  } catch (error) {
    console.error('Share recipe error:', error)
    return NextResponse.json(
      { error: 'Ошибка при предоставлении доступа' },
      { status: 500 }
    )
  }
}

// DELETE /api/recipes/[id]/share - Удалить доступ пользователю
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { id: recipeId } = await params
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Не указан пользователь' },
        { status: 400 }
      )
    }

    // Проверяем, что рецепт принадлежит пользователю
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { userId: true },
    })

    if (!recipe) {
      return NextResponse.json(
        { error: 'Рецепт не найден' },
        { status: 404 }
      )
    }

    if (recipe.userId !== userId) {
      return NextResponse.json(
        { error: 'Нет прав для изменения доступа к этому рецепту' },
        { status: 403 }
      )
    }

    // Удаляем share
    await prisma.recipeShare.deleteMany({
      where: {
        recipeId,
        userId: targetUserId,
      },
    })

    return NextResponse.json({ message: 'Доступ удалён' })
  } catch (error) {
    console.error('Remove recipe share error:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении доступа' },
      { status: 500 }
    )
  }
}
