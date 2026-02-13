'use client'

import { useEffect, useState } from 'react'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    // Проверка на SSR
    if (typeof window === 'undefined') return

    const checkConnection = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', checkConnection)

    checkConnection()

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', checkConnection)
        window.removeEventListener('offline', checkConnection)
      }
    }
  }, [])

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Animated Icon */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl mx-auto">
              <svg
                className="w-16 h-16 text-white animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Нет соединения
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">
              Офлайн режим
            </p>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <p className="text-zinc-700 dark:text-zinc-300 text-center leading-relaxed">
              Вы работаете без интернет-соединения. Не волнуйтесь — все изменения будут синхронизированы автоматически при восстановлении подключения.
            </p>

            {/* Features List */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm">Продолжайте работать офлайн</span>
              </div>

              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm">Автосинхронизация при подключении</span>
              </div>

              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm">Все данные сохранены локально</span>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl ${
            isOnline
              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
            }`} />
            <span className="text-sm font-medium">
              {isOnline ? 'Соединение восстановлено!' : 'Ожидание подключения...'}
            </span>
          </div>

          {/* Retry Button */}
          <button
            onClick={handleRetry}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Обновить страницу
          </button>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
          Проверьте подключение к интернету и нажмите кнопку выше
        </p>
      </div>
    </div>
  )
}
