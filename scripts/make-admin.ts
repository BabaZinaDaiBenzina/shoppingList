#!/usr/bin/env tsx
/**
 * Скрипт для назначения роли администратора пользователю
 *
 * Использование:
 *   npx tsx scripts/make-admin.ts email@example.com
 *
 * Для снятия админки:
 *   npx tsx scripts/make-admin.ts email@example.com --remove
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

// Загружаем переменные окружения из .env
config()

const prisma = new PrismaClient()

async function makeAdmin(email: string, remove: boolean = false) {
  try {
    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.error(`❌ Пользователь с email ${email} не найден`)
      process.exit(1)
    }

    // Обновляем роль
    const newRole = remove ? 'user' : 'admin'
    await prisma.user.update({
      where: { email },
      data: { role: newRole } as any,
    })

    const resultUser = await prisma.user.findUnique({
      where: { email },
    })

    if (!resultUser) {
      console.error('❌ Ошибка при получении обновленного пользователя')
      process.exit(1)
    }

    if (remove) {
      console.log(`✅ Роль администратора снята с пользователя ${resultUser.email}`)
    } else {
      console.log(`✅ Пользователь ${resultUser.email} назначен администратором`)
    }

    console.log('\n📋 Информация о пользователе:')
    console.log(`   ID: ${resultUser.id}`)
    console.log(`   Email: ${resultUser.email}`)
    console.log(`   Username: ${resultUser.username}`)
    console.log(`   Имя: ${resultUser.name || 'не указано'}`)
    console.log(`   Роль: ${(resultUser as any).role === 'admin' ? '👑 Администратор' : '👤 Пользователь'}`)

  } catch (error) {
    console.error('❌ Ошибка:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Получаем аргументы командной строки
const args = process.argv.slice(2)
const email = args[0]
const removeFlag = args.includes('--remove') || args.includes('-r')

if (!email) {
  console.log('\n📝 Использование:')
  console.log('   npx tsx scripts/make-admin.ts email@example.com')
  console.log('   npx tsx scripts/make-admin.ts email@example.com --remove')
  console.log('\n   --remove, -r  - снять роль администратора')
  console.log('')
  process.exit(0)
}

makeAdmin(email, removeFlag)
