'use client'

import { useState, useEffect } from 'react'
import { X, Wifi, WifiOff } from 'lucide-react'
import { haptics } from '@/lib/utils/haptic'

/**
 * Improved Offline Indicator
 *
 * Заметный индикатор режима работы (онлайн/офлайн)
 * с анимацией при смене режима.
 * Prevents hydration mismatch by deferring navigator.onLine check to client-side.
 */
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true) // Default to true for SSR
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Set mounted state on client
    setMounted(true)

    // Initialize with actual navigator state
    setIsOnline(navigator.onLine)

    // Show indicator if offline on mount
    if (!navigator.onLine) {
      setIsVisible(true)
    }

    // Обработчик онлайн
    const handleOnline = () => {
      setIsOnline(true)
      setIsVisible(true)
      setIsAnimating(true)
      haptics.success()

      // Автоматически скрываем через 3 секунды
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 3000)

      return () => clearTimeout(timer)
    }

    // Обработчик офлайн
    const handleOffline = () => {
      setIsOnline(false)
      setIsVisible(true)
      setIsAnimating(true)
      haptics.error()

      // Не скрываем автоматически в офлайн режиме
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Сброс анимации после завершения
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 500)
      return () => clearTimeout(timer)
    }
  }, [isAnimating])

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!mounted) {
    return null
  }

  // Не показываем если онлайн и индикатор скрыт
  if (isOnline && !isVisible) {
    return null
  }

  const handleClose = () => {
    haptics.tap()
    setIsVisible(false)
  }

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-500 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
        ${isAnimating ? 'animate-in slide-in-from-top-2' : ''}
      `}
    >
      <div
        className={`
          px-4 py-3 md:px-6 md:py-4
          ${isOnline
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
          }
          shadow-lg
          flex items-center justify-between gap-3
          safe-area-inset-top
        `}
      >
        {/* Иконка и сообщение */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Иконка с анимацией */}
          <div className={`flex-shrink-0 ${isAnimating ? 'animate-pulse' : ''}`}>
            {isOnline ? (
              <Wifi className="w-5 h-5 md:w-6 md:h-6" />
            ) : (
              <WifiOff className="w-5 h-5 md:w-6 md:h-6" />
            )}
          </div>

          {/* Текст сообщения */}
          <div className="flex flex-col min-w-0">
            <span className="text-sm md:text-base font-semibold leading-tight">
              {isOnline ? '🎉 Сеть восстановлена' : '⚠️ Нет подключения'}
            </span>
            <span className="text-xs md:text-sm opacity-90 truncate">
              {isOnline
                ? 'Все данные синхронизированы'
                : 'Работаем офлайн. Изменения сохранятся.'}
            </span>
          </div>
        </div>

        {/* Кнопка закрытия */}
        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 p-1 rounded-lg
            hover:bg-white/20 active:bg-white/30
            transition-colors
            min-h-[36px] min-w-[36px]
            flex items-center justify-center
            ${isOnline ? '' : 'hidden'}
          `}
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Safe area для iPhone X+ */}
      <style jsx>{`
        .safe-area-inset-top {
          padding-top: env(safe-area-inset-top, 0px);
        }
      `}</style>
    </div>
  )
}
