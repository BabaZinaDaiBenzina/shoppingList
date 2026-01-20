#!/usr/bin/env node

/**
 * Скрипт для оптимизации PNG изображений
 * Использует sharp для оптимизации
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const INPUT_FILE = path.join(__dirname, '../public/icon-512.png')
const TEMP_FILE = path.join(__dirname, '../public/icon-512-temp.png')
const OUTPUT_FILE = path.join(__dirname, '../public/icon-512.png')

async function optimizeImage() {
  try {
    // Проверяем существование файла
    if (!fs.existsSync(INPUT_FILE)) {
      console.error('❌ Файл не найден:', INPUT_FILE)
      process.exit(1)
    }

    const stats = fs.statSync(INPUT_FILE)
    const originalSize = stats.size
    console.log(`📁 Текущий размер: ${(originalSize / 1024).toFixed(2)}KB`)

    // Оптимизация с помощью sharp
    // Используем палитру для уменьшения размера
    await sharp(INPUT_FILE)
      .resize(512, 512, { // Убедимся что размер ровно 512x512
        fit: 'inside',
        withoutEnlargement: true
      })
      .png({
        compressionLevel: 9,  // Максимальная компрессия (0-9)
        adaptiveFiltering: true, // Адаптивная фильтрация
        palette: true  // Использовать палитру для уменьшения размера
      })
      .toFile(TEMP_FILE)

    const newStats = fs.statSync(TEMP_FILE)
    const newSize = newStats.size
    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(2)

    console.log(`✅ Оптимизация завершена!`)
    console.log(`📊 Новый размер: ${(newSize / 1024).toFixed(2)}KB`)
    console.log(`📉 Уменьшение на: ${reduction}%`)

    if (newSize > 50000) {
      console.log(`⚠️  Размер всё ещё больше 50KB. Попробуйте pngquant для дополнительной оптимизации.`)
      // Удаляем временный файл
      fs.unlinkSync(TEMP_FILE)
      process.exit(1)
    }

    // Заменяем оригинальный файл оптимизированным
    fs.unlinkSync(INPUT_FILE)
    fs.renameSync(TEMP_FILE, OUTPUT_FILE)

    console.log(`✨ Цель достигнута: размер < 50KB!`)
  } catch (error) {
    console.error('❌ Ошибка:', error.message)
    process.exit(1)
  }
}

optimizeImage()
