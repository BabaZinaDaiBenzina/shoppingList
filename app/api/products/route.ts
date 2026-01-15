import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/products - Получить продукты (с возможностью фильтрации по категории)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')

    const where: { categoryId?: string; name?: { contains: string; mode: 'insensitive' } } = {}

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ products })

  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении продуктов' },
      { status: 500 }
    )
  }
}
