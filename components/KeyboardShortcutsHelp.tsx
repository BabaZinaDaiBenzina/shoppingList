'use client'

import { useState } from 'react'
import { haptics } from '@/lib/utils/haptic'

interface Shortcut {
  key: string
  description: string
  ctrl?: boolean
}

interface KeyboardShortcutsHelpProps {
  shortcuts: Shortcut[]
}

export function KeyboardShortcutsHelp({ shortcuts }: KeyboardShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Кнопка справки */}
      <button
        onClick={() => {
          haptics.tap()
          setIsOpen(true)
        }}
        className="fixed bottom-6 left-6 z-50 p-3 bg-zinc-700 hover:bg-zinc-800 text-white rounded-full shadow-lg transition-all active:scale-95 min-w-[48px] min-h-[48px] flex items-center justify-center"
        aria-label="Горячие клавиши"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="sr-only">Горячие клавиши</span>
      </button>

      {/* Модальное окно */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => {
              haptics.tap()
              setIsOpen(false)
            }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-6 max-w-md w-full pointer-events-auto animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                  ⌨️ Горячие клавиши
                </h2>
                <button
                  onClick={() => {
                    haptics.tap()
                    setIsOpen(false)
                  }}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Закрыть"
                >
                  <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Shortcuts list */}
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg"
                  >
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {shortcut.description}
                    </span>
                    <kbd className="px-3 py-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-sm">
                      {shortcut.ctrl && (
                        <>
                          <span className="text-xs">Ctrl</span>
                          <span className="mx-1">+</span>
                        </>
                      )}
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => {
                    haptics.tap()
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors min-h-[48px]"
                >
                  Понятно
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
