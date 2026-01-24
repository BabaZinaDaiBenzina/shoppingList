'use client'

import { useState } from 'react'
import { haptics } from '@/lib/utils/haptic'

interface SaveAsTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  listId: string
  listName: string
  itemNames: string[]
  onSave: (templateName: string, description: string) => Promise<void>
}

export function SaveAsTemplateModal({
  isOpen,
  onClose,
  listName,
  itemNames,
  onSave
}: SaveAsTemplateModalProps) {
  const [templateName, setTemplateName] = useState('')
  const [description, setDescription] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!templateName.trim()) {
      setError('Название шаблона обязательно')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await onSave(templateName.trim(), description.trim())
      haptics.success()
      onClose()
      setTemplateName('')
      setDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении шаблона')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            💾 Сохранить как шаблон
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1 text-sm">
            Сохраните товары из списка "{listName}" как шаблон для будущего использования
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Информация о товарах */}
          <div className="bg-zinc-50 dark:bg-zinc-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">📦 В списке:</span>
              <span>{itemNames.length} товаров</span>
            </div>
            {itemNames.length <= 5 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {itemNames.map((name, i) => (
                  <span key={i} className="text-xs bg-white dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-600">
                    {name}
                  </span>
                ))}
              </div>
            )}
            {itemNames.length > 5 && (
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {itemNames.slice(0, 5).join(', ')} и еще {itemNames.length - 5}...
              </div>
            )}
          </div>

          {/* Название шаблона */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Название шаблона <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => {
                haptics.tap()
                setTemplateName(e.target.value)
              }}
              placeholder="Например: Еженедельные покупки"
              className="w-full px-4 py-3 text-base border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white"
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Описание (необязательно)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Заметки о том, для чего этот шаблон..."
              rows={3}
              className="w-full px-4 py-3 text-base border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-700 dark:text-white resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 rounded-lg font-medium transition-colors active:scale-95 min-h-[48px] text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={!templateName.trim() || isSaving}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors active:scale-95 min-h-[48px] text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <span>💾 Сохранить</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
