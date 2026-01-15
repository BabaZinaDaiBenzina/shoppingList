#!/bin/bash

# Обновление кода из git
echo "📥 Pulling latest changes..."
git pull origin main

# Остановка контейнеров
echo "🛑 Stopping containers..."
docker compose down

# Сборка контейнеров
echo "🚀 Building containers..."
docker compose build --no-cache

# Запуск контейнеров
echo "🚀 Starting containers..."
docker compose up -d

