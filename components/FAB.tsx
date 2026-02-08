'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { haptics } from '@/lib/utils/haptic'

interface FABProps {
  onClick: () => void
  disabled?: boolean
  label?: string
}

/**
 * Floating Action Button (FAB)
 *
 * Плавающая кнопка для быстрого доступа к основным действиям.
 * Показывается только на мобильных устройствах.
 *
 * Material Design рекомендации:
 * - Размер: 56x56dp (default), 40x40dp (mini)
 * - Отступ от края: 16dp
 * - Позиция: right-bottom corner
 *
 * @see https://m3.material.io/components/floating-action-button/overview
 */
export function FAB({ onClick, disabled = false, label }: FABProps) {
  const handleClick = () => {
    haptics.press()
    onClick()
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 md:hidden">
      {/* FAB Button */}
      <Button
        onClick={handleClick}
        disabled={disabled}
        size="icon"
        className={`
          h-14 w-14 rounded-full shadow-2xl
          bg-blue-600 hover:bg-blue-700 active:bg-blue-800
          text-white
          transition-all duration-200 ease-in-out
          hover:scale-110 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
          ${label ? 'group' : ''}
        `}
        aria-label={label || 'Добавить'}
      >
        <Plus className="h-6 w-6 transition-transform group-hover:rotate-90" />

        {/* Tooltip (показывается при длинном нажатии или если есть label) */}
        {label && (
          <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            {label}
          </span>
        )}
      </Button>
    </div>
  )
}
