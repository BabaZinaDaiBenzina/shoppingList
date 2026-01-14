import Database from 'better-sqlite3'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const sqlite = new Database('prisma/dev.db')
const prisma = new PrismaClient()

async function migrate() {
  console.log('🚀 Начинаю миграцию из SQLite в PostgreSQL...')

  try {
    // 1. Миграция пользователей
    console.log('\n📦 Мигрирую пользователей...')
    const users = sqlite.prepare('SELECT * FROM User').all()
    console.log(`  Найдено ${users.length} пользователей`)

    for (const user of (users as any[])) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          email: user.email,
          username: user.username,
          passwordHash: user.passwordHash,
          name: user.name,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      })
      console.log(`  ✓ Мигрирован пользователь: ${user.username}`)
    }

    // 2. Миграция списков покупок
    console.log('\n📝 Мигрирую списки покупок...')
    const lists = sqlite.prepare('SELECT * FROM ShoppingList').all()
    console.log(`  Найдено ${lists.length} списков`)

    for (const list of (lists as any[])) {
      await prisma.shoppingList.upsert({
        where: { id: list.id },
        update: {},
        create: {
          id: list.id,
          name: list.name,
          userId: list.userId,
          createdAt: new Date(list.createdAt),
          updatedAt: new Date(list.updatedAt),
        },
      })
      console.log(`  ✓ Мигрирован список: ${list.name}`)
    }

    // 3. Миграция товаров
    console.log('\n🛒 Мигрирую товары...')
    const items = sqlite.prepare('SELECT * FROM Item').all()
    console.log(`  Найдено ${items.length} товаров`)

    for (const item of (items as any[])) {
      await prisma.item.upsert({
        where: { id: item.id },
        update: {},
        create: {
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          purchased: item.purchased === 1,
          listId: item.listId,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        },
      })
      console.log(`  ✓ Мигрирован товар: ${item.name}`)
    }

    console.log('\n✅ Миграция успешно завершена!')
    console.log(`\nИтого:`)
    console.log(`  - Пользователей: ${users.length}`)
    console.log(`  - Списков: ${lists.length}`)
    console.log(`  - Товаров: ${items.length}`)

  } catch (error) {
    console.error('❌ Ошибка миграции:', error)
    process.exit(1)
  } finally {
    sqlite.close()
    await prisma.$disconnect()
  }
}

migrate()
