import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'
import { rateLimitMiddleware, rateLimits } from '@/lib/rateLimit'

/**
 * Санитайзинг поискового запроса для защиты от инъекций
 */
function sanitizeSearchQuery(query: string): string {
  // Удаляем потенциально опасные символы
  return query
    .trim()
    .replace(/[<>{}\\]/g, '') // Убираем скобки и backslash
    .slice(0, 100) // Ограничиваем длину до 100 символов
}

// GET /api/users/search?q=query - Поиск пользователей по имени или username
export async function GET(request: NextRequest) {
  // Rate limiting - защита от перегрузки поиском
  const rateLimit = rateLimitMiddleware(request, rateLimits.search)

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Слишком много поисковых запросов. Попробуйте позже.' },
      {
        status: 429,
        headers: rateLimit.headers
      }
    )
  }

  try {
    const userId = await getAuthenticatedUser(request)

    if (!userId) {
      return unauthorizedResponse()
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Параметр поиска обязателен' },
        { status: 400 }
      )
    }

    // Санитайзинг запроса - защита от SQL injection
    const sanitizedQuery = sanitizeSearchQuery(query)

    if (sanitizedQuery.length === 0) {
      return NextResponse.json(
        { error: 'Некорректный поисковый запрос' },
        { status: 400 }
      )
    }

    // Ищем пользователей по имени или username, исключая текущего пользователя
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: userId } },
          {
            OR: [
              { username: { contains: sanitizedQuery, mode: 'insensitive' } },
              { name: { contains: sanitizedQuery, mode: 'insensitive' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
      },
      take: 10,
    })

    return NextResponse.json({ users })

  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json(
      { error: 'Ошибка при поиске пользователей' },
      { status: 500 }
    )
  }
}
