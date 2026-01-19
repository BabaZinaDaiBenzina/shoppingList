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
          console.log('🔄 Service Worker обновляется, перезагружаем страницу...')
          window.location.reload()
        })

        wb.addEventListener('waiting', () => {
          if (confirm('Доступно новое обновление. Применить?')) {
            wb.messageSW({ type: 'SKIP_WAITING' })
          }
        })

        wb.register().then((registration: ServiceWorkerRegistration) => {
          console.log('✅ Service Worker зарегистрирован:', registration.scope)

          // Проверяем, активировался ли SW
          if (navigator.serviceWorker.controller) {
            console.log('✅ Service Worker активен и контролирует страницу')
          } else {
            console.log('⚠️ Service Worker зарегистрирован, но ещё не контролирует страницу. Требуется перезагрузка.')
          }
        }).catch((error: Error) => {
          console.error('❌ Ошибка регистрации Service Worker:', error)
        })
      } else {
        // Fallback: прямая регистрация без workbox
        navigator.serviceWorker.register('/sw.js', { scope: '/' })
          .then((registration) => {
            console.log('✅ Service Worker зарегистрирован (fallback):', registration.scope)

            if (navigator.serviceWorker.controller) {
              console.log('✅ Service Worker активен и контролирует страницу')
            }

            // Обновление SW при появлении новой версии
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                console.log('🔄 Новая версия Service Worker найдена...')

                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('⏳ Новая версия Service Worker готова к установке')
                    if (confirm('Доступно новое обновление. Применить?')) {
                      newWorker.postMessage({ type: 'SKIP_WAITING' })
                    }
                  } else if (newWorker.state === 'activated') {
                    console.log('✅ Service Worker активирован')
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.error('❌ Ошибка регистрации Service Worker:', error)
          })
      }

      // Прослушиваем сообщения от Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Сообщение от Service Worker:', event.data)
      })

      // Проверяем статус подключения
      const updateOnlineStatus = () => {
        if (navigator.onLine) {
          console.log('🌐 Онлайн режим')
        } else {
          console.log('📴 Офлайн режим')
        }
      }

      window.addEventListener('online', updateOnlineStatus)
      window.addEventListener('offline', updateOnlineStatus)

      // Проверяем при загрузке
      updateOnlineStatus()

      return () => {
        window.removeEventListener('online', updateOnlineStatus)
        window.removeEventListener('offline', updateOnlineStatus)
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
