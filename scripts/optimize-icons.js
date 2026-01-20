#!/usr/bin/env node

/**
 * Скрипт для оптимизации PNG изображений
 * Использует sharp для оптимизации
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

async function optimizeImage(inputPath, outputPath) {
  const TEMP_PATH = inputPath.replace('.png', '-temp.png')

  try {
    // Проверяем существование файла
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Файл не найден: ${inputPath}`)
      return false
    }

    const stats = fs.statSync(inputPath)
    const originalSize = stats.size
    console.log(`📁 ${path.basename(inputPath)}: ${(originalSize / 1024).toFixed(2)}KB → `, { raw: true })

    // Оптимизация с помощью sharp
    await sharp(inputPath)
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true,
        palette: true
      })
      .toFile(TEMP_PATH)

    const newStats = fs.statSync(TEMP_PATH)
    const newSize = newStats.size
    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(2)

    console.log(`${(newSize / 1024).toFixed(2)}KB (${reduction}% reduction)`)

    // Заменяем оригинальный файл
    fs.unlinkSync(inputPath)
    fs.renameSync(TEMP_PATH, outputPath)

    return true
  } catch (error) {
    console.error(`❌ Ошибка: ${error.message}`)

    // Удаляем временный файл если есть
    if (fs.existsSync(TEMP_PATH)) {
      fs.unlinkSync(TEMP_PATH)
    }

    return false
  }
}

async function main() {
  const publicDir = path.join(__dirname, '../public')
  const icons = [
    'icon-192.png',
    'icon-512.png'
  ]

  console.log('🎨 Оптимизация иконок...\n')

  for (const icon of icons) {
    const inputPath = path.join(publicDir, icon)
    await optimizeImage(inputPath, inputPath)
  }

  console.log('\n✅ Оптимизация завершена!')
}

main()
