#!/bin/bash

# Обновление кода из git
echo "📥 Pulling latest changes..."
git pull origin main

# Остановка контейнеров
echo "🛑 Stopping containers..."
docker-compose down

# Сборка и запуск контейнеров
echo "🚀 Building and starting containers..."
docker-compose up -d --build

# Показ логов
echo "📋 Showing logs (Ctrl+C to exit)..."
docker-compose logs -f --tail=50
