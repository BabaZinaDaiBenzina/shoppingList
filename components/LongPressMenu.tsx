'use client'

import { useEffect } from 'react'
import { haptics } from '@/lib/utils/haptic'

interface LongPressMenuProps {
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onCopy: () => void
  onDelete: () => void
  itemName: string
  isDeleting?: boolean
}

export function LongPressMenu({
  isOpen,
  onClose,
  onEdit,
  onCopy,
  onDelete,
  itemName,
  isDeleting = false,
}: LongPressMenuProps) {
  // Блокируем скролл страницы при открытом меню
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        haptics.tap()
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleAction = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          haptics.tap()
          onClose()
        }}
      />

      {/* Меню */}
      <div className="relative bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Заголовок с названием товара */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Действия с товаром
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 truncate">
            {itemName}
          </p>
        </div>

        {/* Список действий */}
        <div className="p-2">
          {/* Редактировать */}
          <button
            onClick={() => handleAction(onEdit)}
            className="w-full px-4 py-3 flex items-center gap-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors active:scale-95 min-h-[48px] text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-zinc-900 dark:text-zinc-50">
                Изменить количество
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Редактировать количество и единицу измерения
              </div>
            </div>
          </button>

          {/* Копировать */}
          <button
            onClick={() => handleAction(onCopy)}
            className="w-full px-4 py-3 flex items-center gap-3 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors active:scale-95 min-h-[48px] text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-zinc-900 dark:text-zinc-50">
                Копировать товар
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Создать копию этого товара
              </div>
            </div>
          </button>

          {/* Удалить */}
          <button
            onClick={() => {
              haptics.delete()
              handleAction(onDelete)
            }}
            disabled={isDeleting}
            className="w-full px-4 py-3 flex items-center gap-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:scale-95 min-h-[48px] text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              {isDeleting ? (
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
              ) : (
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-red-600 dark:text-red-400">
                {isDeleting ? 'Удаление...' : 'Удалить товар'}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Удалить товар из списка безвозвратно
              </div>
            </div>
          </button>
        </div>

        {/* Кнопка отмены */}
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-700/50">
          <button
            onClick={() => {
              haptics.tap()
              onClose()
            }}
            className="w-full px-4 py-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium transition-colors active:scale-95 min-h-[48px]"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}
