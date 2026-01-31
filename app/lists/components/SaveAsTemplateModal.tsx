'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { haptics } from "@/lib/utils/haptic"

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
      haptics.error()
      setError(err instanceof Error ? err.message : 'Ошибка при сохранении шаблона')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    haptics.tap()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>💾 Сохранить как шаблон</DialogTitle>
          <DialogDescription>
            Сохраните товары из списка "{listName}" как шаблон для будущего использования
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4">
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
            <Input
              type="text"
              value={templateName}
              onChange={(e) => {
                haptics.tap()
                setTemplateName(e.target.value)
              }}
              placeholder="Например: Еженедельные покупки"
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Описание (необязательно)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Заметки о том, для чего этот шаблон..."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
            className="flex-1"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={!templateName.trim() || isSaving}
            className="flex-1"
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
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
