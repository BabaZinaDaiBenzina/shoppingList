#!/bin/bash

# Скрипт для назначения роли администратора пользователю
# Использование: ./make-admin.sh email@example.com

if [ -z "$1" ]; then
  echo "❌ Ошибка: не указан email пользователя"
  echo ""
  echo "Использование:"
  echo "  ./make-admin.sh email@example.com"
  echo ""
  echo "Для снятия админки:"
  echo "  ./make-admin.sh email@example.com --remove"
  exit 1
fi

EMAIL=$1
REMOVE_FLAG=""

if [ "$2" == "--remove" ] || [ "$2" == "-r" ]; then
  REMOVE_FLAG="--remove"
fi

echo "🔑 Назначение администратора для: $EMAIL"
docker compose exec app node scripts/make-admin.js "$EMAIL" $REMOVE_FLAG
