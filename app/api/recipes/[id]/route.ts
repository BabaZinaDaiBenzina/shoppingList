import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// PATCH /api/recipes/[id] - Редактировать рецепт
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
    const body = await request.json()
    const { title, description, ingredients, instructions, cookingTime, servings, category } = body

    // Проверяем, что рецепт принадлежит пользователю
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { userId: true },
    })

    if (!existingRecipe) {
      return NextResponse.json(
        { error: 'Рецепт не найден' },
        { status: 404 }
      )
    }

    if (existingRecipe.userId !== userId) {
      return NextResponse.json(
        { error: 'Нет прав для редактирования этого рецепта' },
        { status: 403 }
      )
    }

    if (title && !title.trim()) {
      return NextResponse.json(
        { error: 'Название рецепта обязательно' },
        { status: 400 }
      )
    }

    if (ingredients) {
      if (!Array.isArray(ingredients) || ingredients.length === 0) {
        return NextResponse.json(
          { error: 'Добавьте хотя бы один ингредиент' },
          { status: 400 }
        )
      }

      // Валидация формата ингредиентов
      for (const ingredient of ingredients) {
        if (!ingredient.productId && !ingredient.name) {
          return NextResponse.json(
            { error: 'Каждый ингредиент должен иметь productId или name' },
            { status: 400 }
          )
        }
        if (typeof ingredient.quantity !== 'number' || ingredient.quantity < 0) {
          return NextResponse.json(
            { error: 'Количество должно быть числом >= 0' },
            { status: 400 }
          )
        }
      }
    }

    const recipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(ingredients !== undefined && { ingredients: JSON.stringify(ingredients) }),
        ...(instructions !== undefined && { instructions: instructions?.trim() || null }),
        ...(cookingTime !== undefined && { cookingTime: cookingTime || null }),
        ...(servings !== undefined && { servings: servings || null }),
        ...(category !== undefined && { category: category || 'OTHER' }),
      },
    })

    return NextResponse.json({ recipe })
  } catch (error) {
    console.error('Update recipe error:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении рецепта' },
      { status: 500 }
    )
  }
}

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
