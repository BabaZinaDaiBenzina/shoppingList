import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  // Создаём ответ и удаляем httpOnly cookie
  const response = NextResponse.json({
    message: 'Успешный выход',
  })

  // Удаляем cookie
  response.headers.set('Set-Cookie', clearAuthCookie())

  return response
}
