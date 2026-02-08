import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// PATCH /api/recipes/[id]/favorite - Переключить избранное
export async function PATCH(
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
      select: { userId: true, isFavorite: true },
    })

    if (!recipe) {
      return NextResponse.json(
        { error: 'Рецепт не найден' },
        { status: 404 }
      )
    }

    if (recipe.userId !== userId) {
      return NextResponse.json(
        { error: 'Нет прав для изменения этого рецепта' },
        { status: 403 }
      )
    }

    // Переключаем статус избранного
    const updatedRecipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: { isFavorite: !recipe.isFavorite },
    })

    return NextResponse.json({
      recipe: updatedRecipe,
      isFavorite: updatedRecipe.isFavorite,
    })
  } catch (error) {
    console.error('Toggle favorite error:', error)
    return NextResponse.json(
      { error: 'Ошибка при изменении избранного' },
      { status: 500 }
    )
  }
}
