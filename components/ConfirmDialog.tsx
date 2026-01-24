'use client'

import { useEffect } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
  type = 'danger'
}: ConfirmDialogProps) {
  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  // Блокировка скролла
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const typeStyles = {
    danger: {
      confirmBg: 'bg-red-600 hover:bg-red-700',
      icon: '⚠️'
    },
    warning: {
      confirmBg: 'bg-orange-600 hover:bg-orange-700',
      icon: '⚡'
    },
    info: {
      confirmBg: 'bg-blue-600 hover:bg-blue-700',
      icon: 'ℹ️'
    }
  }

  const styles = typeStyles[type]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">{styles.icon}</div>
        </div>

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-bold text-center text-zinc-900 dark:text-zinc-50 mb-3">
          {title}
        </h2>

        {/* Message */}
        <p className="text-center text-zinc-600 dark:text-zinc-400 mb-6 text-base">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium transition-colors active:scale-95 min-h-[48px] text-base"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 ${styles.confirmBg} text-white rounded-lg font-medium transition-colors active:scale-95 min-h-[48px] text-base`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
