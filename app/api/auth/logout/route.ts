import { NextResponse } from 'next/server'

export async function POST() {
  // Для JWT токенов нет необходимости инвалидировать их на сервере
  // Клиент должен просто удалить токен из хранилища
  return NextResponse.json({
    message: 'Успешный выход. Удалите токен на клиенте.',
  })
}
