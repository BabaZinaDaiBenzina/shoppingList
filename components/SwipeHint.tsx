'use client'

import { useEffect, useState } from 'react'

interface SwipeHintProps {
  onDismiss: () => void
}

export function SwipeHint({ onDismiss }: SwipeHintProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Показываем подсказку после загрузки компонента
    const timer = setTimeout(() => setIsVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => onDismiss(), 300) // Ждём окончания анимации
  }

  return (
    <div
      className={`mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Новая функция: Свайпы!
          </h4>
          <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <p className="flex items-center gap-2">
              <span className="font-medium">→ Свайп вправо:</span>
              <span>отметить как купленное</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="font-medium">← Свайп влево:</span>
              <span>удалить товар</span>
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Скрыть подсказку"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
