# 🛒 Shopping List - Быстрый старт деплоя

## Полная инструкция деплоя
👉 Смотрите [DEPLOYMENT.md](./DEPLOYMENT.md) для подробной инструкции.

## Краткая версия (5 минут)

### 1. Генерация секретов (локально)
```bash
openssl rand -base64 32  # для JWT_SECRET
openssl rand -base64 16  # для POSTGRES_PASSWORD
```

### 2. Подготовка кода (локально)
```bash
./deploy.sh
```

### 3. Копирование на сервер (локально)
```bash
rsync -av --exclude='node_modules' --exclude='.next' \
  . user@your-server-ip:~/shopping-list
```

### 4. Настройка .env (на сервере)
```bash
cd ~/shopping-list
cp .env.production.example .env
nano .env  # вставьте JWT_SECRET и POSTGRES_PASSWORD
```

### 5. Запуск (на сервере)
```bash
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

### 6. Готово!
Откройте `http://your-server-ip:3000`

---

## Структура проекта

```
shoppingList/
├── Dockerfile              # Конфигурация Docker образа
├── docker-compose.yml      # Docker Compose конфигурация
├── .env.production.example # Пример переменных окружения
├── deploy.sh              # Скрипт подготовки к деплою
├── DEPLOYMENT.md          # Полная инструкция
└── prisma/
    └── schema.prisma      # Схема базы данных
```

---

## Переменные окружения

| Переменная | Описание | Пример |
|------------|----------|--------|
| `DATABASE_URL` | Строка подключения к PostgreSQL | `postgresql://shoppinglist:pass@postgres:5432/shoppinglist` |
| `JWT_SECRET` | Секрет для JWT токенов | `openssl rand -base64 32` |
| `POSTGRES_USER` | Пользователь PostgreSQL | `shoppinglist` |
| `POSTGRES_PASSWORD` | Пароль PostgreSQL | `openssl rand -base64 16` |
| `POSTGRES_DB` | Имя базы данных | `shoppinglist` |
| `PORT` | Порт приложения | `3000` |

---

## Полезные команды

```bash
# Логи
docker compose logs -f

# Статус
docker compose ps

# Перезапуск
docker compose restart

# Остановка
docker compose down

# Бэкап БД
docker compose exec postgres pg_dump -U shoppinglist shoppinglist > backup.sql
```

---

## Безопасность ⚠️

- **Никогда не коммитите** `.env` файлы в git
- Используйте **сложные пароли** (генерируйте через `openssl`)
- Включите **HTTPS** через Let's Encrypt
- Настройте **бэкапы** базы данных
- Обновляйте систему регулярно

---

## Поддержка

При проблемах смотрите [DEPLOYMENT.md](./DEPLOYMENT.md) → раздел "Решение проблем"
