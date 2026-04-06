import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { logError } from './logger'

/**
 * API Error класс для выбрасывания ошибок с HTTP статусом
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Типы ошибок API
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Неверный запрос', code?: string) {
    super(400, message, code)
    this.name = 'BadRequestError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Не авторизован') {
    super(401, message, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Доступ запрещен') {
    super(403, message, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Ресурс не найден') {
    super(404, message, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Конфликт данных') {
    super(409, message, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Ошибка валидации', public details?: unknown) {
    super(422, message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

/**
 * Обработчик ошибок для API routes
 */
export function handleApiError(error: unknown): NextResponse {
  // Логируем все ошибки
  logError('API Error', error)

  // Если это наша ApiError
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    )
  }

  // Ошибки Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Уникальное ограничение
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'Запись уже существует',
          code: 'DUPLICATE',
        },
        { status: 409 }
      )
    }

    // Запись не найдена
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          error: 'Запись не найдена',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Foreign key constraint
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          error: 'Связанная запись не найдена',
          code: 'FOREIGN_KEY',
        },
        { status: 400 }
      )
    }

    // Другие ошибки Prisma
    return NextResponse.json(
      {
        error: 'Ошибка базы данных',
        code: 'DATABASE_ERROR',
      },
      { status: 500 }
    )
  }

  // Ошибки валидации (Zod)
  if (error && typeof error === 'object' && 'issues' in error) {
    return NextResponse.json(
      {
        error: 'Ошибка валидации',
        details: error,
      },
      { status: 400 }
    )
  }

  // Неизвестная ошибка
  return NextResponse.json(
    {
      error: 'Внутренняя ошибка сервера',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  )
}

/**
 * HOC для оборачивания API handlers с автоматической обработкой ошибок
 *
 * @example
 * export const GET = withErrorHandler(async (request) => {
 *   const data = await prisma.user.findMany()
 *   return NextResponse.json({ users: data })
 * })
 */
export function withErrorHandler<T>(
  handler: (request: Request) => Promise<T>
): (request: Request) => Promise<T | NextResponse> {
  return async (request: Request) => {
    try {
      return await handler(request)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

/**
 * Async функция для API handlers с автоматической обработкой ошибок
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   return await apiHandler(async () => {
 *     const lists = await prisma.shoppingList.findMany()
 *     return NextResponse.json({ shoppingLists: lists })
 *   })
 * }
 */
export async function apiHandler<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await handler()
  } catch (error) {
    return handleApiError(error)
  }
}
