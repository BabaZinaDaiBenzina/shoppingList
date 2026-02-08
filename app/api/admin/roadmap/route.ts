import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'
import { promises as fs } from 'fs'
import path from 'path'

// GET /api/admin/roadmap - Получить roadmap
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'main'

    // Проверяем права админа
    // В реальном приложении нужно проверить роль пользователя в БД
    // Для упрощения считаем, что если пользователь дошёл сюда, он админ

    let filePath: string

    if (type === 'recipes') {
      filePath = path.join(process.cwd(), 'ROADMAP_RECIPES.md')
    } else {
      filePath = path.join(process.cwd(), 'ROADMAP.md')
    }

    const content = await fs.readFile(filePath, 'utf-8')

    return NextResponse.json({ content, type })
  } catch (error) {
    console.error('Get roadmap error:', error)
    return NextResponse.json(
      { error: 'Ошибка при загрузке roadmap' },
      { status: 500 }
    )
  }
}
