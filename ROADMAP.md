# Карта улучшений и доработок Shopping List

## 🚨 КРИТИЧЕСКИЕ (Безопасность и стабильность)

### 1. Безопасность

**JWT секрет в продакшене**
- [x] Убрать hardcoded fallback значение JWT_SECRET ✅
- [x] Добавить валидацию при старте приложения ✅
- [x] Использовать минимум 32 символа для секретного ключа ✅
- [ ] Реализовать ротацию токенов

**Ограничение входа (Rate Limiting)**
- [x] Добавить rate limiting на все API endpoints ✅
- [x] Защита от brute force на `/api/login` ✅
- [x] Использовать `upstash/ratelimit` или `next-rate-limit` ✅ (собственная реализация)

**Хеширование паролей**
- [x] Увеличить bcrypt rounds с 10 до 12-14 ✅ (12 rounds)
- [x] Файл: `lib/auth.ts:7` ✅

**SQL Injection защита**
- [x] Санитайзить поисковые запросы ✅
- [x] Ограничить длину запросов ✅
- [x] Файл: `app/api/users/search/route.ts:31-32` ✅

**CSRF защита**
- [ ] Добавить CSRF токены для POST/PATCH/DELETE запросов (частично: SameSite=strict)

### 2. Аутентификация и сессии

**Управление токенами**
- [ ] Сократить время жизни access токенов (15 минут вместо 7 дней)
- [ ] Реализовать refresh токены
- [ ] Добавить отзыв токенов (logout всех устройств)
- [ ] Проверять expiry токенов перед API запросами

**Безопасное хранение токенов**
- [x] Перенести токены из localStorage в httpOnly cookies ✅
- [x] Добавить secure и sameSite флаги ✅
- [x] Файл: `contexts/AuthContext.tsx:39-40` ✅

### 3. База данных

**Индексы для производительности**
```prisma
model Item {
  @@index([listId])
  @@index([purchased])
}

model ShoppingList {
  @@index([updatedAt])
}

model User {
  @@index([email])
}
```
- [ ] Добавить индексы в `prisma/schema.prisma`

**Уникальные ограничения**
- [ ] Добавить `@@unique([listId, name])` для Item
- [ ] Обработать дубликаты при добавлении

**Soft Delete**
- [ ] Добавить deletedAt вместо жесткого удаления
- [ ] Восстановление удалённых данных

### 4. Обработка ошибок

**Error Boundaries**
- [ ] Создать компонент ErrorBoundary
- [ ] Добавить на уровне всех маршрутов

**Структурированные ошибки**
- [ ] Создать типы ошибок с кодами
- [ ] Вернуть информативные сообщения вместо generic errors
- [ ] Логировать ошибки без конфиденциальных данных

**Отмена запросов**
- [ ] Использовать AbortController во всех fetch
- [ ] Отменять запросы при размонтировании компонентов

### 5. Офлайн/Синхронизация

**Race Conditions**
- [ ] Добавить mutex/locking для sync операций
- [ ] Файл: `lib/services/syncService.ts:55-63`

**Разрешение конфликтов**
- [ ] Реализовать last-write-wins с timestamp
- [ ] Или operational transformation для сложных случаев

**Визуальные индикаторы синхронизации**
- [ ] Показать какие элементы ожидают синхронизации
- [ ] Точки/бейджи для unsynced items

**IndexedDB миграции**
- [ ] Добавить migration scripts в onupgradeneeded
- [ ] Тестировать обновление версии БД
- [ ] Файл: `lib/services/indexedDB.ts:4`

---

## ⚠️ ВАЖНЫЕ (Производительность и UX)

### 6. Оптимизация производительности

**N+1 Query проблемы**
- [ ] Использовать Prisma includes вместо циклов
- [ ] Проверить все API routes на N+1
- [ ] Пример: `app/api/shopping-lists/route.ts:15-30`

**Кеширование**
- [ ] Добавить HTTP cache headers для GET запросов
- [ ] Реализовать React Query или SWR для кеширования на клиенте
- [ ] Добавить Redis для частых запросов

**Оптимизация изображений**
- [ ] Использовать Next.js Image компонент
- [ ] Конвертировать PNG в WebP
- [ ] Текущий размер icon-512.png: 276KB → оптимизировать до <50KB

**Code Splitting**
- [ ] Динамический импорт модальных окон
- [ ] Разделить админку
- [ ] Ленивая загрузка редких компонентов

**Database Connection Pool**
- [ ] Настроить connection_limit в DATABASE_URL
- [ ] Файл: `lib/prisma.ts:7`

### 7. Качество кода

**Дублирование типов**
- [ ] Создать `types/index.ts` для shared types
- [ ] Генерировать типы из Prisma schema
- [ ] Убрать дубликаты ShoppingList, Item interfaces

**Валидация входных данных**
- [ ] Добавить Zod схемы для всех API endpoints
- [ ] Валидировать на уровне API route handlers

**Magic Numbers**
- [ ] Вынести константы в `config/constants.ts`
- [ ] Примеры:
  - retryCount >= 3
  - setTimeout(..., 300)
  - повторяющиеся даты/время

**Рефакторинг больших компонентов**
- [ ] Разбить `app/lists/page.tsx` (694 строки)
- [ ] Извлечь хуки, подкомпоненты
- [ ] Улучшить тестируемость

**Repository Pattern**
- [ ] Создать слой repository для бизнес-логики
- [ ] Убрать Prisma calls из API routes

### 8. Пользовательский опыт

**Loading States**
- [ ] Добавить isLoading для всех мутаций
- [ ] Спиннеры для delete, share операций
- [ ] Скелетоны для списков при загрузке

**Confirmation Dialogs**
- [ ] Подтверждение для destructive actions
- [ ] Delete список, remove user, etc.

**Undo Functionality**
- [ ] Toast notifications с кнопкой "Отменить"
- [ ] Восстановление после удаления

**Мобильный опыт**
- [ ] Увеличить touch targets до 44px минимум
- [ ] Добавить haptic feedback
- [ ] Улучшить адаптивность

**Keyboard Shortcuts**
- [ ] Ctrl+N - новый список
- [ ] Ctrl+F - поиск
- [ ] Enter - добавить товар
- [ ] Escape - закрыть модалку

**Empty States**
- [ ] Онбординг для новых пользователей
- [ ] Опция создать sample data
- [ ] Полезные подсказки

**Поиск и фильтры**
- [ ] Поиск товаров по названию
- [ ] Фильтр по категории
- [ ] Фильтр по купленным/некупленным
- [ ] Сортировка (A-Z, по дате)

### 9. Accessibility (a11y)

**ARIA Labels**
- [ ] Добавить aria-label для всех icon-only кнопок
- [ ] Пример: `GroupedShoppingListCard.tsx:408`

**Focus Management**
- [ ] Focus trap в модалках
- [ ] Восстановление фокуса после закрытия

**Keyboard Navigation**
- [ ] Стрелки для навигации по спискам
- [ ] Enter для toggle purchased
- [ ] Tab порядок логичный

**Color Contrast**
- [ ] Проверить WCAG AA соответствие
- [ ] Увеличить контраст серого текста

**Screen Readers**
- [ ] aria-live регионы для изменений
- [ ] Анонсировать sync status, ошибки

**Alt Text**
- [ ] Все иконки с aria-label или role="img"

### 10. Тестирование

**Unit Tests**
- [ ] Настроить Jest + React Testing Library
- [ ] Целевое покрытие: 80%

**E2E Tests**
- [ ] Playwright для критических путей
- [ ] Сценарии: register, login, create list, add item

**Runtime Validation**
- [ ] Zod для проверки TypeScript типов на runtime

**API Tests**
- [ ] Интеграционные тесты для всех routes

### 11. Developer Experience

**Debug Tools**
- [ ] Debug mode для разработки
- [ ] Sync Queue Viewer
- [ ] IndexedDB Inspector компонент

**Environment Validation**
- [ ] Проверка .env при старте
- [ ] Ошибка если отсутствуют обязательные переменные

**Structured Logging**
- [ ] Заменить console.log на Winston/Pino
- [ ] Уровни логирования: debug, info, warn, error

**API Documentation**
- [ ] OpenAPI/Swagger спецификация
- [ ] Postman collection

**Git Hooks**
- [ ] Husky для pre-commit
- [ ] lint-staged для форматирования
- [ ] Запуск тестов перед push

**Docker Compose**
- [ ] docker-compose.override.yml.example
- [ ] Для различных конфигураций dev окружения

---

## ✅ ХОРОШИЕ (Низкий приоритет)

### 12. Новые функции

**Push Notifications**
- [ ] Реализовать по плану `todo-push-notifications.md`

**Шаблоны списков**
- [ ] Еженедельные покупки
- [ ] Праздничные товары
- [ ] Для походов/пикников

**Рекомендации товаров**
- [ ] AI на основе истории покупок
- [ ] "Чаще всего покупают вместе"

**Бюджетирование**
- [ ] Цены для товаров
- [ ] Отслеживание затрат
- [ ] Оповещения о превышении бюджета

**Аналитика**
- [ ] Самые покупаемые товары
- [ ] Тренды затрат
- [ ] Частота покупок

**Сканер штрихкодов**
- [ ] Добавление товаров по штрихкоду
- [ ] Автозаполнение информации

**Повторяющиеся списки**
- [ ] Автосоздание еженедельных списков
- [ ] Повторяющиеся покупки

**Совместная работа в реальном времени**
- [ ] WebSocket для live updates
- [ ] Лента активности
- [ ] Комментарии к товарам

**Экспорт/Импорт**
- [ ] PDF, CSV экспорт списков
- [ ] Импорт из других приложений
- [ ] Deep links для sharing

**Dark Mode**
- [ ] Автоматический режим (system preference)
- [ ] Лучшие color tokens

### 13. Масштабируемость

**Database Optimization**
- [ ] Read replica для запросов
- [ ] PgBouncer для connection pooling
- [ ] Redis cache

**CDN**
- [ ] Статические файлы на CDN
- [ ] Next.js Image с custom loader

**API Pagination**
- [ ] Cursor-based pagination
- [ ] Вместо загрузки всех списков сразу

**Background Jobs**
- [ ] BullMQ для тяжёлых задач
- [ ] Планировщик для recurring задач

**File Upload Limits**
- [ ] Валидация размера файлов
- [ ] Проверка типа MIME

### 14. Документация

**README**
- [ ] Описать custom features
- [ ] Инструкция по настройке
- [ ] Архитектура приложения

**API Docs**
- [ ] OpenAPI spec
- [ ] Postman collection
- [ ] Примеры запросов

**Storybook**
- [ ] Showcase UI компонентов
- [ ] Документация props

**Runbook**
- [ ] Incident response guide
- [ ] Troubleshooting процедуры

### 15. Мониторинг

**Error Tracking**
- [ ] Sentry integration

**Analytics**
- [ ] Privacy-friendly (Plausible/Utmatt)

**Performance**
- [ ] Web Vitals tracking
- [ ] RUM (Real User Monitoring)

**Health Checks**
- [ ] /health endpoint
- [ ] DB, cache status

**Uptime**
- [ ] Uptime robot
- [ ] Status page

---

## 🗺️ ДОРОЖНАЯ КАРТА РЕАЛИЗАЦИИ

### Фаза 1: Безопасность и стабильность (Неделя 1-2)
1. ✅ ~~🔒 Исправить JWT секрет валидацию~~ ВЫПОЛНЕНО
2. ✅ ~~🛡️ Добавить rate limiting~~ ВЫПОЛНЕНО
3. ~~🔐 CSRF защита~~ (частично: SameSite=strict)
4. ~~🚨 Error boundaries~~ (будет реализовано позже)
5. ~~🔄 Fix race conditions в sync~~ (будет реализовано позже)
6. ~~✔️ Zod валидация~~ (будет реализовано позже)
7. ✅ ~~🔑 Увеличить bcrypt до 12 rounds~~ ВЫПОЛНЕНО
8. ✅ ~~🍪 Secure cookie-based auth~~ ВЫПОЛНЕНО

### Фаза 2: Производительность и UX (Неделя 3-4)
1. 📊 Индексы в базе данных
2. 🐘 Fix N+1 queries
3. 💬 Информативные ошибки
4. ⏳ Loading states везде
5. ❓ Confirmation dialogs
6. ↩️ Undo функциональность
7. 🖼️ Оптимизация изображений
8. ✂️ Code splitting

### Фаза 3: Тестирование и DX (Неделя 5-6)
1. 🧪 Jest + React Testing Library
2. ✍️ Тесты для критических путей
3. 🎭 E2E тесты (Playwright)
4. 🪝 Husky pre-commit hooks
5. 📝 Structured logging
6. 📚 API документация
7. ✅ Environment validation

### Фаза 4: Новые функции (Неделя 7-8)
1. 🔔 Push notifications
2. 📋 Шаблоны списков
3. 🔍 Поиск/фильтры товаров
4. ⌨️ Keyboard shortcuts
5. 📱 Улучшенный mobile UX
6. ♿ Accessibility улучшения

### Фаза 5: Масштабируемость (Неделя 9-10)
1. 🔴 Redis caching
2. 📄 API pagination
3. 📊 Monitoring (Sentry, analytics)
4. 📦 Bundle size optimization
5. 🌐 CDN для статических файлов
6. ⏰ Background jobs

---

## 🎯 QUICK WINS (Менее 4 часов каждое)

1. ~~Zod валидация для API routes~~ (будет реализовано позже)
2. ~~Error boundaries для routes~~ (будет реализовано позже)
3. ~~Индексы в базе данных~~ (будет реализовано позже)
4. ✅ **Bcrypt rounds 10→12** - ВЫПОЛНЕНО
5. ~~Loading states для мутаций~~ (уже есть частично)
6. ~~Confirmation dialogs~~ (частично реализовано)
7. ✅ **Secure cookie-based auth** - ВЫПОЛНЕНО
8. ✅ **Rate limiting для login** - ВЫПОЛНЕНО
9. ~~Fix race condition в sync service~~ (будет реализовано позже)
10. ✅ **Environment variable validation** - ВЫПОЛНЕНО (JWT_SECRET)

---

## 📈 ТЕХНИЧЕСКИЙ ДОЛГ

**Высокий уровень техдолга:**
1. ✅ ~~🔴 Система аутентификации (небезопасные localStorage токены)~~ ✅ ИСПРАВЛЕНО
2. 🔴 Sync service (race conditions, нет resolution конфликтов)
3. 🔴 Error handling (нестабильный, generic)
4. 🔴 Type definitions (дублированные, не из Prisma)
5. 🔴 Database schema (нет индексов, constraints)
6. 🔴 Тестирование (0% покрытие)

**Оценка усилий:**
- Критичные фиксы: ~~40-60 часов~~ 30-40 часов (многие выполнены ✅)
- Важные улучшения: 80-120 часов
- Новые функции: 200+ часов

**Уровень риска: СРЕДНИЙ** ✅ УЛУЧШЕН
- ~~Уязвимости безопасности в продакшене~~ ✅ Множество критических уязвимостей исправлено
- Потеря данных возможна при sync issues
- Нет страховки от регрессий (тесты)

---

## 📊 СТАТИСТИКА ПРОЕКТА

- **Строк кода**: ~6,669 (app/)
- **Тестовое покрытие**: 0%
- **Безопасность**: ~~Средний риск~~ ✅ **Улучшен (критичные уязвимости исправлены)**
- **Производительность**: Требует оптимизации
- **Accessibility**: Базовый уровень
- **Документация**: Требует обновления

---

## 🎉 ВЫПОЛНЕННЫЕ УЛУЧШЕНИЯ (Дата: 2026-01-19)

### ✅ Безопасность (6 критических улучшений)

1. **JWT Secret** - `lib/auth.ts`
   - ✅ Убран hardcoded fallback
   - ✅ Добавлена валидация при старте (минимум 32 символа)
   - ✅ Приложение не запустится без валидного JWT_SECRET

2. **Bcrypt Rounds** - `lib/auth.ts`
   - ✅ Увеличено с 10 до 12 rounds

3. **Rate Limiting** - `lib/rateLimit.ts` (новый файл)
   - ✅ In-memory реализация
   - ✅ Защита login (5/мин), register (5/мин), search (30/мин)
   - ✅ Применено к критическим endpoints

4. **SQL Injection** - `app/api/users/search/route.ts`
   - ✅ Санитайзинг запросов
   - ✅ Ограничение длины (100 символов)
   - ✅ Защита от инъекций

5. **httpOnly Cookies** - серверная часть
   - ✅ Функции для работы с secure cookies
   - ✅ Login/Register устанавливают cookies
   - ✅ Logout очищает cookies
   - ✅ Middleware читает из cookies

6. **httpOnly Cookies** - клиентская часть
   - ✅ AuthContext не сохраняет токены в localStorage
   - ✅ Все fetch calls обновлены (28 мест в 6 файлах)
   - ✅ Cookie автоматически отправляется браузером

### 📁 Изменённые файлы

```
✅ lib/auth.ts
✅ lib/middleware.ts
✅ lib/rateLimit.ts (новый)
✅ lib/api.ts (новый)
✅ .env.example
✅ app/api/auth/login/route.ts
✅ app/api/auth/register/route.ts
✅ app/api/auth/logout/route.ts
✅ app/api/users/search/route.ts
✅ contexts/AuthContext.tsx
✅ app/lists/page.tsx
✅ app/lists/components/ShareModal.tsx
✅ app/lists/components/ProductSelector.tsx
✅ app/lists/components/ProductManager.tsx
✅ app/admin/page.tsx
✅ app/recipes/page.tsx
```

### 🔒 Результат

| Метрика | До | После |
|---------|-----|-------|
| XSS защита | ❌ Токены в localStorage | ✅ httpOnly cookies |
| Brute force | ❌ Нет защиты | ✅ Rate limiting |
| Password hashing | ⚠️ 10 rounds | ✅ 12 rounds |
| SQL injection | ❌ Нет санитайзинга | ✅ Защищено |
| JWT secret | ⚠️ Hardcoded fallback | ✅ Валидация |
| Уровень риска | 🔴 ВЫСОКИЙ | 🟡 СРЕДНИЙ |
