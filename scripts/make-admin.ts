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

import { PrismaClient } from '@prisma/client'

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
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true
      }
    })

    if (remove) {
      console.log(`✅ Роль администратора снята с пользователя ${updatedUser.email}`)
    } else {
      console.log(`✅ Пользователь ${updatedUser.email} назначен администратором`)
    }

    console.log('\n📋 Информация о пользователе:')
    console.log(`   ID: ${updatedUser.id}`)
    console.log(`   Email: ${updatedUser.email}`)
    console.log(`   Username: ${updatedUser.username}`)
    console.log(`   Имя: ${updatedUser.name || 'не указано'}`)
    console.log(`   Роль: ${updatedUser.role === 'admin' ? '👑 Администратор' : '👤 Пользователь'}`)

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
