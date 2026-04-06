import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories - Получить все категории
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json(
      { categories },
      {
        headers: {
          // ✅ Cache-Control: 10 мин на сервере, 30 мин stale (категории меняются редко)
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800'
        }
      }
    )

  } catch (error) {
    console.error('Get categories error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении категорий' },
      { status: 500 }
    )
  }
}
