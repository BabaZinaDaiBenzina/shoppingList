import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedAdmin, unauthorizedResponse, forbiddenResponse } from '@/lib/middleware'

// GET /api/admin/users - Получить всех пользователей с их списками
export async function GET(request: NextRequest) {
  try {
    const adminId = await getAuthenticatedAdmin(request)

    if (!adminId) {
      return unauthorizedResponse()
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            shoppingLists: true,
            recipes: true
          }
        },
        shoppingLists: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                items: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ users })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении пользователей' },
      { status: 500 }
    )
  }
}
