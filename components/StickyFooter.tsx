'use client'

import { CheckCircle2 } from 'lucide-react'

interface StickyFooterProps {
  listId: string
  purchasedCount: number
  totalCount: number
}

/**
 * Sticky Footer со статистикой списка
 *
 * Фиксированная панель внизу экрана с информацией о списке.
 * Показывается только на мобильных.
 *
 * Виден только когда список раскрыт.
 */
export function StickyFooter({
  listId,
  purchasedCount,
  totalCount,
}: StickyFooterProps) {
  const percentage = totalCount > 0 ? Math.round((purchasedCount / totalCount) * 100) : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white dark:bg-zinc-800 border-t-2 border-zinc-200 dark:border-zinc-700 shadow-2xl safe-area-inset-bottom">
      <div className="px-4 py-3">
        {/* Статистика и прогресс */}
        <div className="flex items-center justify-center gap-3">
          {/* Иконка прогресса */}
          <div className="relative w-10 h-10">
            <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
              {/* Фон круга */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-zinc-200 dark:text-zinc-700"
              />
              {/* Прогресс */}
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${percentage}, 100`}
                className="text-green-500 transition-all duration-500 ease-out"
                strokeLinecap="round"
              />
            </svg>
            {/* Иконка в центре */}
            <div className="absolute inset-0 flex items-center justify-center">
              {percentage === 100 ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  {percentage}%
                </span>
              )}
            </div>
          </div>

          {/* Текст статистики */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {purchasedCount} из {totalCount}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {percentage === 100
                ? '🎉 Все куплено!'
                : percentage >= 50
                  ? '⭐ Почти готово'
                  : '🛒 В процессе'}
            </span>
          </div>
        </div>
      </div>

      {/* Safe area для iPhone X+ */}
      <style jsx>{`
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </div>
  )
}
