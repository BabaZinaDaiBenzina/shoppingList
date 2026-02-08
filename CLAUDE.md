# CLAUDE.md

Этот файл содержит руководство для Claude Code (claude.ai/code) при работе с кодом в этом репозитории.

## Обзор проекта

Это **Progressive Web App (PWA)** для управления списками покупок с офлайн-функциональностью. Приложение написано на Next.js 16 с использованием App Router, TypeScript, PostgreSQL и Prisma ORM.

### Ключевые особенности
- **PWA с офлайн-режимом**: Service Worker, IndexedDB, автоматическая синхронизация
- **JWT-аутентификация**: Access/refresh токены в httpOnly cookies, CSRF защита
- **Совместные списки**: Пользователи могут делиться списками покупок
- **Каталог товаров**: Категории и продукты с единицами измерения
- **Рецепты и шаблоны**: Сохранение и повторное использование списков
- **Админ-панель**: Управление пользователями, списками, каталогом

## Структура приложения

### Frontend (Next.js App Router)
```
app/
├── api/              # API routes (см. ниже)
├── lists/            # Страницы списков покупок
├── admin/            # Админ-панель
├── login/            # Страница входа
├── register/         # Страница регистрации
├── recipes/          # Управление рецептами
└── user/             # Профиль пользователя

components/
├── ui/               # Radix UI компоненты (Button, Input, Dialog и т.д.)
└── ( core components: ErrorBoundary, Providers, ThemeToggle )

contexts/
├── AuthContext.tsx   # Контекст авторизации с JWT refresh логикой
└── ThemeContext.tsx  # Контекст темы (dark/light mode)

hooks/
├── useRequireAuth.ts        # HOC для защищённых страниц
├── useOfflineData.ts        # IndexedDB + синхронизация
└── useKeyboardShortcuts.ts  # Горячие клавиши
```

### Backend API
```
app/api/
├── auth/
│   ├── login, register, logout, logout-all
│   ├── refresh           # Обновление access токена
│   ├── me                # Получение текущего пользователя
│   └── csrf              # CSRF токен для mutating операций
├── shopping-lists/
│   ├── [id]/items        # CRUD товаров в списке
│   ├── [id]/share        # Шаринг списков
│   ├── [id]/save-as-template
│   └── [id]/deselect-all
├── products/             # Каталог товаров
├── categories/           # Категории товаров
├── recipes/              # Рецепты
├── templates/            # Шаблоны списков
├── admin/                # Admin endpoints
└── recommendations/      # Рекомендации на основе истории
```

### Database (Prisma + PostgreSQL)

**Основные модели:**
- `User` - Пользователи (role: user/admin)
- `ShoppingList` - Списки покупок
- `ListShare` - Совместный доступ к спискам
- `Item` - Товары в списках (ссылка на Product опциональна)
- `Product` - Каталог товаров (привязан к Category)
- `Category` - Категории с иконками
- `Recipe` - Рецепты пользователей
- `Template` - Шаблоны списков (public/private)
- `RefreshToken` - Refresh токены для JWT

**Каскадное удаление**: Все связи используют `onDelete: Cascade` для целостности данных.

## Команды для разработки

### Базовый workflow
```bash
# Запуск с локальной PostgreSQL (требуется Docker)
npm run dev:full    # docker-compose up -d postgres && next dev

# Только dev сервер (если PostgreSQL уже запущен)
npm run dev

# Database команды
npm run db:start    # Запуск PostgreSQL в Docker
npm run db:stop     # Остановка PostgreSQL
npm run db:studio   # Prisma Studio (UI для базы данных)
npm run db:migrate  # Применение миграций
npm run db:seed     # Заполнение базы тестовыми данными
npm run db:reset    # Reset базы данных

# Production
npm run build       # Сборка (--webpack для PWA)
npm run start       # Запуск production сервера
npm run lint        # ESLint

# Утилиты
npm run make-admin  # Создание админа через скрипт
```

### Тестирование офлайн-режима
1. Запустите `npm run dev`
2. Откройте DevTools (F12) → Application → Service Workers
3. В DevTools → Network поставьте галочку "Offline"
4. Приложение продолжит работу с IndexedDB

## Архитектурные паттерны

### Аутентификация и авторизация

**JWT Flow:**
1. Логин/регистрация → access токен в httpOnly cookie (15 мин) + refresh токен в БД (7 дней)
2. Access токен истёк (401) → автоматический refresh через `/api/auth/refresh`
3. Refresh токен истёк → пользователь перенаправляется на логин

**CSRF Защита:**
- Все mutating операции (POST/PUT/PATCH/DELETE) требуют CSRF токен
- CSRF токен получається через `/api/auth/csrf` и передаётся в заголовке `x-csrf-token`
- `AuthContext.fetchWithAuth` автоматически добавляет CSRF токен

**Проверка прав:**
```typescript
// В API routes
import { getAuthenticatedUser, canAccessList, isListOwner } from '@/lib/middleware'

const userId = await getAuthenticatedUser(request)
if (!userId) return unauthorizedResponse()

// Проверка доступа к списку (владелец или share)
const hasAccess = await canAccessList(userId, listId)
if (!hasAccess) return forbiddenResponse()

// Проверка владения списком
const isOwner = await isListOwner(userId, listId)
```

### Офлайн-режим и синхронизация

**IndexedDB (client-side storage):**
- `lib/services/indexedDB.ts` - Сохранение списков локально
- Хранит ShoppingLists с items для офлайн-доступа

**Синхронизация:**
- `lib/services/syncService.ts` - Очередь операций (CREATE/UPDATE/DELETE)
- При потере соединения операции добавляются в очередь
- При восстановлении соединения автоматически синхронизируется

**Использование:**
```typescript
import { useOfflineData } from '@/hooks/useOfflineData'

const { isOnline, saveOfflineList, enqueueOperation, forceSync } = useOfflineData()

// Сохранить локально
await saveOfflineList(list)

// Добавить в очередь синхронизации
await enqueueOperation('UPDATE', '/api/shopping-lists/123', 'PATCH', data)
```

### PWA Configuration

**next.config.ts:**
- `output: 'standalone'` - Оптимизация для Docker
- `next-pwa` - Service Worker с кешированием
- Кеш стратегии:
  - NetworkFirst для API (timeout 10 сек, fallback на кеш)
  - CacheFirst для статических файлов (_next/static, images)

### State Management

**Контексты:**
- `AuthContext` - Авторизация, refresh токены, CSRF
- `ThemeContext` - Dark/light mode

**Без Redux/Zustand** - используется React Context + localStorage для простоты.

### API Routes Patterns

**Типичная структура API route:**
```typescript
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUser(request)
  if (!userId) return unauthorizedResponse()

  const data = await prisma.shoppingList.findMany({
    where: { userId },
    include: { items: true }
  })

  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUser(request)
  if (!userId) return unauthorizedResponse()

  const body = await request.json()

  const created = await prisma.shoppingList.create({
    data: { ...body, userId }
  })

  return Response.json(created, { status: 201 })
}
```

### Database Access

**Prisma Client:**
```typescript
import { prisma } from '@/lib/prisma'

// Singleton паттерн для предотвращения множественных инстансов
// В dev режиме кешируется в globalThis
```

### TypeScript Configuration

**Path aliases:**
```json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

Используйте `@/components/...`, `@/lib/...`, `@/app/...` вместо относительных путей.

## Важные детали

### Обратная совместимость
- Поддержка старых `auth_token` cookie наряду с новыми `access_token`
- Поддержка `Authorization: Bearer` header для обратной совместимости

### Безопасность
- Пароли хешируются через bcrypt
- Access токены живут 15 минут, refresh токены - 7 дней
- Все mutating операции защищены CSRF
- Админ-панель доступна только для `role: 'admin'`

### PWA особенности
- Service Worker отключён в development (`disable: process.env.NODE_ENV === 'development'`)
- Для тестирования PWA в dev используйте `npm run build && npm run start`

### Docker деплоймент
- `output: 'standalone'` в next.config.ts для оптимизации Docker image
- Dockerfile использует multi-stage build
- PostgreSQL запускается через docker-compose

## Типичные задачи

### Добавление нового API endpoint
1. Создайте файл в `app/api/[resource]/route.ts`
2. Используйте `getAuthenticatedUser` для проверки авторизации
3. Используйте Prisma для работы с БД
4. Для mutating операций добавьте CSRF токен через `fetchWithAuth` на клиенте

### Добавление новой страницы
1. Создайте директорию в `app/` или `app/[feature]/`
2. Используйте Server Components по умолчанию
3. Добавьте `'use client'` только при необходимости интерактивности
4. Используйте компоненты из `components/ui/` (Radix UI)

### Модификация базы данных
1. Измените `prisma/schema.prisma`
2. Запустите `npm run db:migrate`
3. При необходимости обновите `prisma/seed.ts`

### Работа с офлайн-данными
- Используйте `useOfflineData` hook для доступа к IndexedDB
- Добавляйте операции в очередь синхронизации через `enqueueOperation`
- Синхронизация происходит автоматически при появлении сети

## Логирование

Все ключевые операции логируются с префиксами:
- `[Auth]` - операции авторизации
- `🌐 Онлайн` / `📴 Офлайн` - изменения статуса сети
- Service Worker события логируются в браузерной консоли

## Документация

- `USAGE.md` - Краткая инструкция по офлайн-режиму
- `PWA_README.md` - PWA setup guide
- `OFFLINE_GUIDE.md` - Детальное руководство по офлайн-функциональности
- `DEPLOYMENT.md` - Инструкции по деплою
- `ROADMAP.md` - Планы развития продукта
