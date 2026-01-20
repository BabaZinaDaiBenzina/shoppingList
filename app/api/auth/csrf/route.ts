import { NextResponse } from 'next/server'
import { generateCSRFToken, setCSRFCookie } from '@/lib/csrf'

/**
 * GET /api/auth/csrf
 * Возвращает CSRF токен для использования в формах
 */
export async function GET() {
  const token = generateCSRFToken()

  const response = NextResponse.json({
    token,
  })

  // Устанавливаем CSRF cookie
  response.headers.set('Set-Cookie', setCSRFCookie(token))

  return response
}
