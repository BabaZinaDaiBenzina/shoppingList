const Database = require('better-sqlite3');
const { Client } = require('pg');

const sqlite = new Database('prisma/dev.db');
const pg = new Client({
  connectionString: 'postgresql://shoppinglist:shoppinglist@localhost:5433/shoppinglist'
});

async function migrate() {
  try {
    await pg.connect();
    console.log('🚀 Начинаю миграцию из SQLite в PostgreSQL...\n');

    // 1. Миграция пользователей
    console.log('📦 Мигрирую пользователей...');
    const users = sqlite.prepare('SELECT * FROM User').all();
    console.log(`  Найдено ${users.length} пользователей\n`);

    for (const user of users) {
      await pg.query(
        `INSERT INTO "User" (id, email, username, "passwordHash", name, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          user.id,
          user.email,
          user.username,
          user.passwordHash,
          user.name,
          new Date(parseInt(user.createdAt)).toISOString(),
          new Date(parseInt(user.updatedAt)).toISOString()
        ]
      );
      console.log(`  ✓ Мигрирован пользователь: ${user.username}`);
    }

    // 2. Миграция списков покупок
    console.log('\n📝 Мигрирую списки покупок...');
    const lists = sqlite.prepare('SELECT * FROM ShoppingList').all();
    console.log(`  Найдено ${lists.length} списков\n`);

    for (const list of lists) {
      await pg.query(
        `INSERT INTO "ShoppingList" (id, name, "userId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [
          list.id,
          list.name,
          list.userId,
          new Date(parseInt(list.createdAt)).toISOString(),
          new Date(parseInt(list.updatedAt)).toISOString()
        ]
      );
      console.log(`  ✓ Мигрирован список: ${list.name}`);
    }

    // 3. Миграция товаров
    console.log('\n🛒 Мигрирую товары...');
    const items = sqlite.prepare('SELECT * FROM Item').all();
    console.log(`  Найдено ${items.length} товаров\n`);

    for (const item of items) {
      await pg.query(
        `INSERT INTO "Item" (id, name, quantity, purchased, "listId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          item.id,
          item.name,
          item.quantity,
          item.purchased === 1,
          item.listId,
          new Date(parseInt(item.createdAt)).toISOString(),
          new Date(parseInt(item.updatedAt)).toISOString()
        ]
      );
      console.log(`  ✓ Мигрирован товар: ${item.name}`);
    }

    console.log('\n✅ Миграция успешно завершена!');
    console.log(`\nИтого:`);
    console.log(`  - Пользователей: ${users.length}`);
    console.log(`  - Списков: ${lists.length}`);
    console.log(`  - Товаров: ${items.length}\n`);

  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    process.exit(1);
  } finally {
    sqlite.close();
    await pg.end();
  }
}

migrate();
