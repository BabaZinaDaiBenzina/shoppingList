'use client'

import { useOfflineData } from '@/hooks/useOfflineData'
import { useEffect } from 'react'

export function OfflineIndicator() {
  const { isOnline, pendingSync, forceSync } = useOfflineData()

  // Автоматическая синхронизация при появлении соединения
  useEffect(() => {
    if (isOnline && pendingSync > 0) {
      // Небольшая задержка перед синхронизацией
      const timer = setTimeout(() => {
        forceSync()
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [isOnline, pendingSync, forceSync])

  if (isOnline && pendingSync === 0) {
    return null // Не показываем ничего если онлайн и нет ожидающих операций
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium ${
      isOnline
        ? 'bg-blue-600 text-white'
        : 'bg-orange-600 text-white'
    }`}>
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Синхронизация {pendingSync} {pendingSync === 1 ? 'изменения' : 'изменений'}...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
            </svg>
            <span>Офлайн режим. Изменения сохранятся локально.</span>
          </>
        )}
      </div>
    </div>
  )
}
