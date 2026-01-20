#!/bin/bash

# Обновление кода из git
echo "📥 Pulling latest changes..."
git pull origin main

# Остановка контейнеров
echo "🛑 Stopping containers..."
docker compose down

# Сборка контейнеров (с --no-cache для гарантии обновления зависимостей)
echo "🚀 Building containers..."
docker compose build --no-cache

# Удаление старых неиспользуемых образов для экономии места
echo "🧹 Cleaning up old images..."
docker image prune -f

# Запуск контейнеров
echo "🚀 Starting containers..."
docker compose up -d

echo "✅ Update complete!"

