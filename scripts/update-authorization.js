#!/usr/bin/env node

/**
 * Скрипт для удаления Authorization header из fetch вызовов
 * После миграции на httpOnly cookies, Authorization header больше не нужен
 */

const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'app/lists/components/ProductSelector.tsx',
  'app/lists/components/ProductManager.tsx',
  'app/admin/page.tsx',
  'app/recipes/page.tsx',
  'app/user/[id]/page.tsx'
];

function updateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Файл не найден: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf-8');
  let hasChanges = false;

  // Паттерн 1: const token = localStorage.getItem('token') + Authorization header в простых GET
  const pattern1 = /const token = localStorage\.getItem\('token'\)\s*\n\s*const response = await fetch\(([^)]+)\,\s*\{\s*headers:\s*\{\s*'Authorization':\s*`Bearer\s*\$\{token\}`\s*\}\s*\}\s*\)/g;

  if (pattern1.test(content)) {
    content = content.replace(pattern1, (match, url) => {
      return `const response = await fetch(${url})`;
    });
    hasChanges = true;
  }

  // Паттерн 2: const token = localStorage.getItem('token') + Authorization header в POST/PATCH/DELETE
  const pattern2 = /const token = localStorage\.getItem\('token'\)\s*\n\s*const response = await fetch\(([^)]+),\s*\{\s*method:\s*'[^']+',\s*headers:\s*\{\s*'Content-Type':\s*'application\/json',\s*'Authorization':\s*`Bearer\s*\$\{token\}`,\s*\},\s*body:\s*JSON\.stringify\([^)]+\)\s*\}\s*\)/g;

  if (pattern2.test(content)) {
    content = content.replace(pattern2, (match, url, method) => {
      // Извлекаем method и body
      const methodMatch = match.match(/method:\s*'([^']+)'/);
      const bodyMatch = match.match(/body:\s*JSON\.stringify\(([^)]+)\)/);
      const method = methodMatch ? methodMatch[1] : 'POST';
      const body = bodyMatch ? bodyMatch[1] : '{}';

      return `const response = await fetch(${url}, {
        method: '${method}',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(${body})
      })`;
    });
    hasChanges = true;
  }

  // Паттерн 3: Authorization header в строке (для PATCH/DELETE)
  const pattern3 = /const token = localStorage\.getItem\('token'\)\s*\n\s*const response = await fetch\(([^)]+),\s*\{\s*method:\s*'([^']+)',\s*headers:\s*\{\s*'Authorization':\s*`Bearer\s*\$\{token\}`\s*\}\s*\}\s*\)/g;

  if (pattern3.test(content)) {
    content = content.replace(pattern3, (match, url, method) => {
      return `const response = await fetch(${url}, {
        method: '${method}'
      })`;
    });
    hasChanges = true;
  }

  if (hasChanges) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`✅ Обновлён: ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  Пропущен (нет изменений): ${filePath}`);
    return false;
  }
}

console.log('🔧 Обновление Authorization header...\n');

let updated = 0;
for (const file of filesToUpdate) {
  if (updateFile(file)) {
    updated++;
  }
}

console.log(`\n✨ Завершено! Обновлено файлов: ${updated}/${filesToUpdate.length}`);
