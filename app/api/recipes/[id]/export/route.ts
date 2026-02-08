import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'
import { RECIPE_CATEGORIES } from '@/types'

// GET /api/recipes/[id]/export - Экспорт рецепта
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
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'text'

    // Получаем рецепт
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
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

    const ingredients = JSON.parse(recipe.ingredients || '[]')

    if (format === 'json') {
      // Экспорт в JSON
      return NextResponse.json({
        recipe: {
          title: recipe.title,
          description: recipe.description,
          category: recipe.category,
          cookingTime: recipe.cookingTime,
          servings: recipe.servings,
          ingredients,
          instructions: recipe.instructions,
          createdAt: recipe.createdAt,
          updatedAt: recipe.updatedAt,
        }
      })
    }

    // Экспорт в текст
    const categoryLabel = RECIPE_CATEGORIES[recipe.category as keyof typeof RECIPE_CATEGORIES]?.label || recipe.category

    let text = `${recipe.title}\n`
    text += `${'='.repeat(recipe.title.length)}\n\n`

    if (recipe.description) {
      text += `${recipe.description}\n\n`
    }

    text += `Категория: ${categoryLabel}\n`
    if (recipe.cookingTime) {
      text += `Время приготовления: ${recipe.cookingTime} мин\n`
    }
    if (recipe.servings) {
      text += `Порций: ${recipe.servings}\n`
    }
    text += '\n'

    text += `Ингредиенты:\n`
    text += `${'-'.repeat(15)}\n`
    ingredients.forEach((ing: any) => {
      text += `• ${ing.quantity} ${ing.unit || 'шт'}. ${ing.productName || ing.name}\n`
    })
    text += '\n'

    if (recipe.instructions) {
      text += `Инструкции:\n`
      text += `${'-'.repeat(15)}\n`
      text += `${recipe.instructions}\n\n`
    }

    text += `---\n`
    text += `Создано: ${new Date(recipe.createdAt).toLocaleDateString('ru-RU')}\n`

    return NextResponse.json({ text })
  } catch (error) {
    console.error('Export recipe error:', error)
    return NextResponse.json(
      { error: 'Ошибка при экспорте рецепта' },
      { status: 500 }
    )
  }
}
