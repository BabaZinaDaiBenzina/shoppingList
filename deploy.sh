#!/bin/bash

# Скрипт для подготовки деплоя на сервер
# Меняет SQLite на PostgreSQL в Prisma схеме

set -e

echo "🔧 Подготовка к деплою..."

# Замена provider на postgresql
sed -i.bak 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

echo "✅ Prisma схема обновлена для PostgreSQL"
echo "⚠️  Файл prisma/schema.prisma.bak создан как резервная копия"
echo ""
echo "Теперь запустите на сервере:"
echo "  1. scp -r . user@server:/path/to/app"
echo "  2. ssh user@server"
echo "  3. cd /path/to/app"
echo "  4. cp .env.production.example .env"
echo "  5. Отредактируйте .env (JWT_SECRET и пароли!)"
echo "  6. docker compose up -d --build"
