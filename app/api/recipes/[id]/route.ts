import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// DELETE /api/recipes/[id] - Удалить рецепт
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
        { error: 'Нет прав для удаления этого рецепта' },
        { status: 403 }
      )
    }

    await prisma.recipe.delete({
      where: { id: recipeId },
    })

    return NextResponse.json({ message: 'Рецепт успешно удален' })
  } catch (error) {
    console.error('Delete recipe error:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении рецепта' },
      { status: 500 }
    )
  }
}
