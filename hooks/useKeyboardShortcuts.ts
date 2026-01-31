// React Hook для управления горячими клавишами

import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
  disabled?: boolean
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

/**
 * Хук для управления горячими клавишами
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     {
 *       key: 'n',
 *       ctrlKey: true,
 *       action: () => console.log('New list'),
 *       description: 'Создать новый список'
 *     },
 *     {
 *       key: 'Escape',
 *       action: () => console.log('Close modal'),
 *       description: 'Закрыть модальное окно'
 *     }
 *   ]
 * })
 * ```
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Проверяем, что фокус не на input или textarea
    const target = event.target as HTMLElement
    const isInputFocused =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.getAttribute('contenteditable') === 'true'

    // Находим соответствующий шорткат
    const matchingShortcut = shortcuts.find(shortcut => {
      if (shortcut.disabled) return false

      // Проверяем модификаторы
      const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
      const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey
      const altMatch = shortcut.altKey ? event.altKey : !event.altKey
      const metaMatch = shortcut.metaKey ? event.metaKey : !event.metaKey

      // Проверяем ключ
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

      return ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch
    })

    if (matchingShortcut) {
      // Для Escape и других функциональных клавиш не нужна проверка input
      if (isInputFocused && matchingShortcut.key !== 'Escape') {
        return
      }

      event.preventDefault()
      matchingShortcut.action()
    }
  }, [shortcuts, enabled])

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])

  // Возвращаем список горячих клавиш для отображения в help
  return {
    shortcuts: shortcuts.filter(s => !s.disabled)
  }
}
