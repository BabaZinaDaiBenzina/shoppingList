'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Smartphone } from 'lucide-react'
import { haptics } from '@/lib/utils/haptic'

declare global {
  interface Navigator {
    readonly standalone?: boolean
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Компонент для напоминания установки PWA приложения
 *
 * Показывается через 30 секунд использования если:
 * - Приложение не установлено (не в standalone режиме)
 * - Пользователь не отклонял prompt ранее
 * - Браузер поддерживает установку PWA
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Проверяем, установлен ли PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')

      setIsStandalone(isStandaloneMode)

      // Если в standalone режиме, не показываем prompt
      if (isStandaloneMode) {
        return
      }

      // Проверяем, отклонял ли пользователь prompt ранее
      const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen')
      const hasDismissed = localStorage.getItem('pwa-install-prompt-dismissed')

      if (hasDismissed) {
        return
      }

      // Показываем prompt через 30 секунд если пользователь не видел его
      if (!hasSeenPrompt) {
        const timer = setTimeout(() => {
          // Проверяем снова на момент показа
          const stillNotStandalone =
            !window.matchMedia('(display-mode: standalone)').matches &&
            window.navigator.standalone !== true

          if (stillNotStandalone && deferredPrompt) {
            setShowPrompt(true)
            localStorage.setItem('pwa-install-prompt-seen', 'true')
            haptics.tap()
          }
        }, 30000) // 30 секунд

        return () => clearTimeout(timer)
      }
    }

    // Обработчик события beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Предотвращаем стандартный баннер браузера
      e.preventDefault()
      // Сохраняем событие для последующего использования
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // Слушаем событие beforeinstallprompt
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Проверяем standalone режим
    checkStandalone()

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [deferredPrompt])

  // Обработчик установки
  const handleInstall = async () => {
    if (!deferredPrompt) {
      return
    }

    haptics.press()

    // Показываем нативный prompt браузера
    deferredPrompt.prompt()

    // Ждем выбора пользователя
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      haptics.success()
      // Пользователь принял установку
      setShowPrompt(false)
    } else {
      haptics.warning()
      // Пользователь отклонил - больше не показываем
      localStorage.setItem('pwa-install-prompt-dismissed', 'true')
      setShowPrompt(false)
    }

    // Очищаем сохраненный prompt
    setDeferredPrompt(null)
  }

  // Обработчик закрытия (без установки)
  const handleDismiss = () => {
    haptics.tap()
    localStorage.setItem('pwa-install-prompt-dismissed', 'true')
    setShowPrompt(false)
  }

  // Не показываем если:
  // - PWA уже установлен (standalone режим)
  // - Нет deferredPrompt (браузер не поддерживает установку)
  // - Пользователь не хочет видеть prompt
  if (isStandalone || !deferredPrompt || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-background border-2 border-primary/20 rounded-2xl shadow-2xl p-4 space-y-3">
        {/* Заголовок с иконкой */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight">
              Установите приложение
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Добавьте на главный экран для быстрого доступа и работы офлайн
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Преимущества */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <div className="text-lg font-bold text-primary">⚡</div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              Быстрый запуск
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-primary">📴</div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              Работает офлайн
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-primary">🎨</div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              Полный экран
            </div>
          </div>
        </div>

        {/* Кнопка установки */}
        <Button
          onClick={handleInstall}
          className="w-full min-h-[44px]"
          size="lg"
        >
          <Download className="w-5 h-5 mr-2" />
          Установить приложение
        </Button>
      </div>
    </div>
  )
}
