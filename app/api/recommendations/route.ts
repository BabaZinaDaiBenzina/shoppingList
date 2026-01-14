import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'
import { groceryRecommendations } from '@/lib/recommendations'

// GET /api/recommendations - Получить список рекомендаций
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    // Можно добавить логику персонализации на основе истории покупок
    // Пока возвращаем статический список рекомендаций
    return NextResponse.json({ recommendations: groceryRecommendations })

  } catch (error) {
    console.error('Get recommendations error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении рекомендаций' },
      { status: 500 }
    )
  }
}
