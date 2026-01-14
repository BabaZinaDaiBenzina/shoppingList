#!/bin/bash
# Скрипт для создания временных иконок
# Требует ImageMagick: brew install imagemagick (Mac) или apt install imagemagick (Linux)

echo "Создание временных иконок..."

# Создаем простую иконку с корзиной
convert -size 512x512 xc:#2563eb \
  -font Helvetica-Bold \
  -pointsize 300 \
  -fill white \
  -gravity center \
  -annotate 0 '🛒' \
  public/icon-512.png

# Создаем уменьшенную версию
convert public/icon-512.png -resize 192x192 public/icon-192.png

# Apple touch icon
convert public/icon-512.png -resize 180x180 public/apple-touch-icon.png

echo "Готово! Иконки созданы:"
echo "  - public/icon-512.png"
echo "  - public/icon-192.png"
echo "  - public/apple-touch-icon.png"
echo ""
echo "Теперь закоммить их и запушь на сервер!"
