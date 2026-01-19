'use client'

import { useEffect } from 'react'

export function ServiceWorkerProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Регистрация Service Worker с fallback
    if ('serviceWorker' in navigator) {
      if (window.workbox !== undefined) {
        // Используем workbox если доступен (next-pwa)
        const wb = window.workbox

        wb.addEventListener('controlling', () => {
          window.location.reload()
        })

        wb.addEventListener('waiting', () => {
          if (confirm('Доступно новое обновление. Применить?')) {
            wb.messageSW({ type: 'SKIP_WAITING' })
          }
        })

        wb.register().then((registration: ServiceWorkerRegistration) => {
          console.log('✅ Service Worker зарегистрирован:', registration)
        }).catch((error: Error) => {
          console.error('❌ Ошибка регистрации Service Worker:', error)
        })
      } else {
        // Fallback: прямая регистрация без workbox
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker зарегистрирован (fallback):', registration)

            // Обновление SW при появлении новой версии
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    if (confirm('Доступно новое обновление. Применить?')) {
                      newWorker.postMessage({ type: 'SKIP_WAITING' })
                    }
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.error('❌ Ошибка регистрации Service Worker:', error)
          })
      }
    } else {
      console.warn('⚠️ Service Worker не поддерживается браузером')
    }
  }, [])

  return null
}

// Расширение типов для window
declare global {
  interface Window {
    workbox?: any
  }
}
