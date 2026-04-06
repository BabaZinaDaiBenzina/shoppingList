import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Мясо' },
      update: {},
      create: {
        name: 'Мясо',
        icon: '🥩',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Рыба и морепродукты' },
      update: {},
      create: {
        name: 'Рыба и морепродукты',
        icon: '🐟',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Молочные продукты' },
      update: {},
      create: {
        name: 'Молочные продукты',
        icon: '🥛',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Овощи и фрукты' },
      update: {},
      create: {
        name: 'Овощи и фрукты',
        icon: '🥬',
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Хлеб и выпечка' },
      update: {},
      create: {
        name: 'Хлеб и выпечка',
        icon: '🍞',
        sortOrder: 5,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Напитки' },
      update: {},
      create: {
        name: 'Напитки',
        icon: '🥤',
        sortOrder: 6,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Снеки и сладости' },
      update: {},
      create: {
        name: 'Снеки и сладости',
        icon: '🍫',
        sortOrder: 7,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Бакалея' },
      update: {},
      create: {
        name: 'Бакалея',
        icon: '🍝',
        sortOrder: 8,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Замороженные продукты' },
      update: {},
      create: {
        name: 'Замороженные продукты',
        icon: '❄️',
        sortOrder: 9,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Соусы и специи' },
      update: {},
      create: {
        name: 'Соусы и специи',
        icon: '🧂',
        sortOrder: 10,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Чистящие средства' },
      update: {},
      create: {
        name: 'Чистящие средства',
        icon: '🧹',
        sortOrder: 11,
      },
    }),
    prisma.category.upsert({
      where: { name: 'Прочее' },
      update: {},
      create: {
        name: 'Прочее',
        icon: '📦',
        sortOrder: 12,
      },
    }),
  ])

  console.log(`✅ Created ${categories.length} categories`)

  // Create products for each category
  const meatCategory = categories.find(c => c.name === 'Мясо')!
  const fishCategory = categories.find(c => c.name === 'Рыба и морепродукты')!
  const dairyCategory = categories.find(c => c.name === 'Молочные продукты')!
  const produceCategory = categories.find(c => c.name === 'Овощи и фрукты')!
  const bakeryCategory = categories.find(c => c.name === 'Хлеб и выпечка')!
  const drinksCategory = categories.find(c => c.name === 'Напитки')!
  const snacksCategory = categories.find(c => c.name === 'Снеки и сладости')!
  const groceryCategory = categories.find(c => c.name === 'Бакалея')!
  const frozenCategory = categories.find(c => c.name === 'Замороженные продукты')!
  const saucesCategory = categories.find(c => c.name === 'Соусы и специи')!
  const cleaningCategory = categories.find(c => c.name === 'Чистящие средства')!
  const otherCategory = categories.find(c => c.name === 'Прочее')!

  const meatProducts = [
    { name: 'Свинина', unit: 'кг' },
    { name: 'Говядина', unit: 'кг' },
    { name: 'Курица', unit: 'кг' },
    { name: 'Индейка', unit: 'кг' },
    { name: 'Котлеты', unit: 'шт' },
    { name: 'Сосиски', unit: 'упак' },
    { name: 'Колбаса', unit: 'кг' },
    { name: 'Бекон', unit: 'г' },
  ]

  const fishProducts = [
    { name: 'Рыба белая', unit: 'кг' },
    { name: 'Рыба красная', unit: 'кг' },
    { name: 'Креветки', unit: 'кг' },
    { name: 'Кальмары', unit: 'кг' },
    { name: 'Икра', unit: 'банка' },
  ]

  const dairyProducts = [
    { name: 'Молоко', unit: 'л' },
    { name: 'Сыр', unit: 'кг' },
    { name: 'Творог', unit: 'г' },
    { name: 'Сметана', unit: 'г' },
    { name: 'Йогурт', unit: 'шт' },
    { name: 'Сливки', unit: 'л' },
    { name: 'Масло сливочное', unit: 'г' },
    { name: 'Яйца', unit: 'десяток' },
  ]

  const produceProducts = [
    { name: 'Картофель', unit: 'кг' },
    { name: 'Морковь', unit: 'кг' },
    { name: 'Лук', unit: 'кг' },
    { name: 'Капуста', unit: 'кг' },
    { name: 'Помидоры', unit: 'кг' },
    { name: 'Огурцы', unit: 'кг' },
    { name: 'Яблоки', unit: 'кг' },
    { name: 'Бананы', unit: 'кг' },
    { name: 'Апельсины', unit: 'кг' },
    { name: 'Лимоны', unit: 'шт' },
    { name: 'Чеснок', unit: 'г' },
  ]

  const bakeryProducts = [
    { name: 'Хлеб белый', unit: 'батон' },
    { name: 'Хлеб черный', unit: 'батон' },
    { name: 'Булочки', unit: 'шт' },
    { name: 'Лаваш', unit: 'шт' },
    { name: 'Пита', unit: 'шт' },
  ]

  const drinksProducts = [
    { name: 'Вода', unit: 'л' },
    { name: 'Лимонад', unit: 'л' },
    { name: 'Сок', unit: 'л' },
    { name: 'Газировка', unit: 'л' },
    { name: 'Чай', unit: 'пачка' },
    { name: 'Кофе', unit: 'пачка' },
    { name: 'Какао', unit: 'пачка' },
  ]

  const snacksProducts = [
    { name: 'Шоколад', unit: 'плитка' },
    { name: 'Конфеты', unit: 'г' },
    { name: 'Печенье', unit: 'г' },
    { name: 'Чипсы', unit: 'упак' },
    { name: 'Орехи', unit: 'г' },
    { name: 'Зефир', unit: 'г' },
    { name: 'Мармелад', unit: 'г' },
  ]

  const groceryProducts = [
    { name: 'Макароны', unit: 'г' },
    { name: 'Рис', unit: 'г' },
    { name: 'Гречка', unit: 'г' },
    { name: 'Овсянка', unit: 'г' },
    { name: 'Мука', unit: 'кг' },
    { name: 'Сахар', unit: 'кг' },
    { name: 'Соль', unit: 'г' },
    { name: 'Подсолнечное масло', unit: 'л' },
    { name: 'Оливковое масло', unit: 'л' },
    { name: 'Хлопья', unit: 'г' },
  ]

  const frozenProducts = [
    { name: 'Пельмени', unit: 'кг' },
    { name: 'Вареники', unit: 'кг' },
    { name: 'Замороженные овощи', unit: 'г' },
    { name: 'Мороженое', unit: 'г' },
  ]

  const saucesProducts = [
    { name: 'Кетчуп', unit: 'упак' },
    { name: 'Майонез', unit: 'упак' },
    { name: 'Горчица', unit: 'упак' },
    { name: 'Соевый соус', unit: 'мл' },
    { name: 'Уксус', unit: 'мл' },
    { name: 'Перец черный', unit: 'г' },
    { name: 'Специи', unit: 'упак' },
  ]

  const cleaningProducts = [
    { name: 'Средство для мытья посуды', unit: 'шт' },
    { name: 'Стиральный порошок', unit: 'кг' },
    { name: 'Губки для посуды', unit: 'шт' },
    { name: 'Полотенца бумажные', unit: 'упак' },
    { name: 'Туалетная бумага', unit: 'упак' },
  ]

  // Create all products
  const allProducts = [
    ...meatProducts.map(p => ({ ...p, categoryId: meatCategory.id })),
    ...fishProducts.map(p => ({ ...p, categoryId: fishCategory.id })),
    ...dairyProducts.map(p => ({ ...p, categoryId: dairyCategory.id })),
    ...produceProducts.map(p => ({ ...p, categoryId: produceCategory.id })),
    ...bakeryProducts.map(p => ({ ...p, categoryId: bakeryCategory.id })),
    ...drinksProducts.map(p => ({ ...p, categoryId: drinksCategory.id })),
    ...snacksProducts.map(p => ({ ...p, categoryId: snacksCategory.id })),
    ...groceryProducts.map(p => ({ ...p, categoryId: groceryCategory.id })),
    ...frozenProducts.map(p => ({ ...p, categoryId: frozenCategory.id })),
    ...saucesProducts.map(p => ({ ...p, categoryId: saucesCategory.id })),
    ...cleaningProducts.map(p => ({ ...p, categoryId: cleaningCategory.id })),
  ]

  for (const product of allProducts) {
    await prisma.product.upsert({
      where: {
        categoryId_name: {
          categoryId: product.categoryId,
          name: product.name,
        },
      },
      update: { unit: product.unit },
      create: product,
    })
  }

  console.log(`✅ Created ${allProducts.length} products`)

  // Create admin user for templates (if not exists)
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@system.local',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456', // Placeholder hash
      name: 'System Admin',
      role: 'admin',
    },
  })

  // Create default templates
  const weeklyShoppingItems = [
    { name: 'Молоко', quantity: 2, unit: 'л', categoryId: dairyCategory.id },
    { name: 'Хлеб белый', quantity: 1, unit: 'батон', categoryId: bakeryCategory.id },
    { name: 'Хлеб черный', quantity: 1, unit: 'батон', categoryId: bakeryCategory.id },
    { name: 'Яйца', quantity: 1, unit: 'десяток', categoryId: dairyCategory.id },
    { name: 'Сыр', quantity: 300, unit: 'г', categoryId: dairyCategory.id },
    { name: 'Картофель', quantity: 2, unit: 'кг', categoryId: produceCategory.id },
    { name: 'Морковь', quantity: 1, unit: 'кг', categoryId: produceCategory.id },
    { name: 'Лук', quantity: 1, unit: 'кг', categoryId: produceCategory.id },
    { name: 'Капуста', quantity: 1, unit: 'кг', categoryId: produceCategory.id },
    { name: 'Помидоры', quantity: 1, unit: 'кг', categoryId: produceCategory.id },
    { name: 'Огурцы', quantity: 1, unit: 'кг', categoryId: produceCategory.id },
    { name: 'Курица', quantity: 1, unit: 'кг', categoryId: meatCategory.id },
    { name: 'Сосиски', quantity: 1, unit: 'упак', categoryId: meatCategory.id },
    { name: 'Макароны', quantity: 500, unit: 'г', categoryId: groceryCategory.id },
    { name: 'Рис', quantity: 500, unit: 'г', categoryId: groceryCategory.id },
    { name: 'Сахар', quantity: 1, unit: 'кг', categoryId: groceryCategory.id },
    { name: 'Чай', quantity: 1, unit: 'пачка', categoryId: drinksCategory.id },
    { name: 'Кофе', quantity: 1, unit: 'пачка', categoryId: drinksCategory.id },
    { name: 'Вода', quantity: 2, unit: 'л', categoryId: drinksCategory.id },
  ]

  const partyItems = [
    { name: 'Свинина', quantity: 2, unit: 'кг', categoryId: meatCategory.id },
    { name: 'Курица', quantity: 2, unit: 'кг', categoryId: meatCategory.id },
    { name: 'Сосиски', quantity: 2, unit: 'упак', categoryId: meatCategory.id },
    { name: 'Сыр', quantity: 500, unit: 'г', categoryId: dairyCategory.id },
    { name: 'Колбаса', quantity: 500, unit: 'г', categoryId: meatCategory.id },
    { name: 'Хлеб белый', quantity: 2, unit: 'батон', categoryId: bakeryCategory.id },
    { name: 'Булочки', quantity: 10, unit: 'шт', categoryId: bakeryCategory.id },
    { name: 'Помидоры', quantity: 1, unit: 'кг', categoryId: produceCategory.id },
    { name: 'Огурцы', quantity: 1, unit: 'кг', categoryId: produceCategory.id },
    { name: 'Лимоны', quantity: 3, unit: 'шт', categoryId: produceCategory.id },
    { name: 'Картофель', quantity: 2, unit: 'кг', categoryId: produceCategory.id },
    { name: 'Чипсы', quantity: 3, unit: 'упак', categoryId: snacksCategory.id },
    { name: 'Шоколад', quantity: 3, unit: 'плитка', categoryId: snacksCategory.id },
    { name: 'Конфеты', quantity: 500, unit: 'г', categoryId: snacksCategory.id },
    { name: 'Печенье', quantity: 300, unit: 'г', categoryId: snacksCategory.id },
    { name: 'Лимонад', quantity: 3, unit: 'л', categoryId: drinksCategory.id },
    { name: 'Сок', quantity: 2, unit: 'л', categoryId: drinksCategory.id },
    { name: 'Вода', quantity: 3, unit: 'л', categoryId: drinksCategory.id },
    { name: 'Кетчуп', quantity: 1, unit: 'упак', categoryId: saucesCategory.id },
    { name: 'Майонез', quantity: 1, unit: 'упак', categoryId: saucesCategory.id },
  ]

  const picnicItems = [
    { name: 'Сосиски', quantity: 10, unit: 'шт', categoryId: meatCategory.id },
    { name: 'Котлеты', quantity: 10, unit: 'шт', categoryId: meatCategory.id },
    { name: 'Хлеб белый', quantity: 1, unit: 'батон', categoryId: bakeryCategory.id },
    { name: 'Лаваш', quantity: 2, unit: 'шт', categoryId: bakeryCategory.id },
    { name: 'Помидоры', quantity: 1, unit: 'кг', categoryId: produceCategory.id },
    { name: 'Огурцы', quantity: 1, unit: 'кг', categoryId: produceCategory.id },
    { name: 'Лимоны', quantity: 2, unit: 'шт', categoryId: produceCategory.id },
    { name: 'Сыр', quantity: 300, unit: 'г', categoryId: dairyCategory.id },
    { name: 'Колбаса', quantity: 300, unit: 'г', categoryId: meatCategory.id },
    { name: 'Картофель', quantity: 2, unit: 'кг', categoryId: produceCategory.id },
    { name: 'Чипсы', quantity: 2, unit: 'упак', categoryId: snacksCategory.id },
    { name: 'Шоколад', quantity: 2, unit: 'плитка', categoryId: snacksCategory.id },
    { name: 'Орехи', quantity: 200, unit: 'г', categoryId: snacksCategory.id },
    { name: 'Лимонад', quantity: 2, unit: 'л', categoryId: drinksCategory.id },
    { name: 'Вода', quantity: 3, unit: 'л', categoryId: drinksCategory.id },
    { name: 'Сок', quantity: 1, unit: 'л', categoryId: drinksCategory.id },
    { name: 'Туалетная бумага', quantity: 1, unit: 'упак', categoryId: cleaningCategory.id },
    { name: 'Полотенца бумажные', quantity: 1, unit: 'упак', categoryId: cleaningCategory.id },
    { name: 'Губки для посуды', quantity: 5, unit: 'шт', categoryId: cleaningCategory.id },
  ]

  // Create templates
  const templates = [
    {
      name: 'Еженедельные покупки',
      description: 'Базовый набор продуктов на неделю для семьи',
      isPublic: true,
      items: weeklyShoppingItems,
    },
    {
      name: 'Праздничный стол',
      description: 'Продукты для праздничного застолья с гостями',
      isPublic: true,
      items: partyItems,
    },
    {
      name: 'Пикник на природе',
      description: 'Все необходимое для пикника на свежем воздухе',
      isPublic: true,
      items: picnicItems,
    },
  ]

  for (const template of templates) {
    await prisma.template.upsert({
      where: {
        userId_name: {
          userId: adminUser.id,
          name: template.name,
        },
      },
      update: {
        description: template.description,
        isPublic: template.isPublic,
      },
      create: {
        name: template.name,
        description: template.description,
        isPublic: template.isPublic,
        userId: adminUser.id,
        items: {
          create: template.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            categoryId: item.categoryId,
          })),
        },
      },
    })
  }

  console.log(`✅ Created ${templates.length} default templates`)
  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
