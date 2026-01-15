#!/bin/bash

# Обновление кода из git
echo "📥 Pulling latest changes..."
git pull origin main

# Остановка контейнеров
echo "🛑 Stopping containers..."
docker compose down

# Сборка и запуск контейнеров
echo "🚀 Building and starting containers..."
docker compose up -d --build

# Ожидание запуска контейнера
echo "⏳ Waiting for containers to start..."
sleep 10

# Установка зависимостей
echo "📦 Installing dependencies..."
docker compose exec -e NEXT_PUBLIC_API_URL=http://localhost:3000 app npm install

# Сборка проекта
echo "🔨 Building Next.js..."
docker compose exec -e NEXT_PUBLIC_API_URL=http://localhost:3000 app npm run build

# Перезапуск с использованием готовой сборки
echo "🔄 Restarting with production build..."
docker compose restart app

# Показ логов
echo "📋 Showing logs (Ctrl+C to exit)..."
docker compose logs -f --tail=50
