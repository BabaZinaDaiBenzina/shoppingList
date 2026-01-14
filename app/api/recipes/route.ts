import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'

// GET /api/recipes - Получить все рецепты пользователя
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const recipes = await prisma.recipe.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ recipes })
  } catch (error) {
    console.error('Get recipes error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении рецептов' },
      { status: 500 }
    )
  }
}

// POST /api/recipes - Создать новый рецепт
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { title, description, ingredients, instructions, cookingTime, servings } = body

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Название рецепта обязательно' },
        { status: 400 }
      )
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Добавьте хотя бы один ингредиент' },
        { status: 400 }
      )
    }

    if (!instructions || !instructions.trim()) {
      return NextResponse.json(
        { error: 'Добавьте инструкции приготовления' },
        { status: 400 }
      )
    }

    const recipe = await prisma.recipe.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim() || null,
        ingredients: JSON.stringify(ingredients),
        instructions: instructions.trim(),
        cookingTime: cookingTime || null,
        servings: servings || null,
      },
    })

    return NextResponse.json({ recipe }, { status: 201 })
  } catch (error) {
    console.error('Create recipe error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании рецепта' },
      { status: 500 }
    )
  }
}
