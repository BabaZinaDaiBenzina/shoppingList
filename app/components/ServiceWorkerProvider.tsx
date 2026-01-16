'use client'

import { useEffect } from 'react'

export function ServiceWorkerProvider() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox

      // Активация обновления SW
      wb.addEventListener('controlling', () => {
        // Перезагрузка страницы для применения нового SW
        window.location.reload()
      })

      // Сообщение о доступности обновления
      wb.addEventListener('waiting', () => {
        // Можно показать уведомление пользователю
        if (confirm('Доступно новое обновление. Применить?')) {
          wb.messageSW({ type: 'SKIP_WAITING' })
        }
      })

      wb.register()
    }
  }, [])

  return null
}

// Расширение типов для window
declare global {
  interface Window {
    workbox: any
  }
}
