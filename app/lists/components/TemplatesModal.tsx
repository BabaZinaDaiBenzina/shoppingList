'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { haptics } from "@/lib/utils/haptic"

interface TemplateItem {
  id: string
  name: string
  quantity: number
  unit: string | null
}

interface Template {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  items: TemplateItem[]
  createdAt: string
}

interface TemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyTemplate: (templateId: string, listName: string) => Promise<void>
}

export function TemplatesModal({ isOpen, onClose, onApplyTemplate }: TemplatesModalProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [listName, setListName] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen])

  const fetchTemplates = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/templates')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при загрузке шаблонов')
      }

      setTemplates(data.templates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке шаблонов')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !listName.trim()) return

    setIsApplying(true)
    setError('')

    try {
      await onApplyTemplate(selectedTemplate.id, listName.trim())
      haptics.success()
      onClose()
      setListName('')
      setSelectedTemplate(null)
    } catch (err) {
      haptics.error()
      setError(err instanceof Error ? err.message : 'Ошибка при применении шаблона')
    } finally {
      setIsApplying(false)
    }
  }

  const handleClose = () => {
    haptics.tap()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>📋 Шаблоны списков</DialogTitle>
          <DialogDescription>
            Выберите шаблон для быстрого создания списка
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-zinc-300 border-t-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-400 text-center">{error}</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                Пока нет шаблонов
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Создайте свой первый шаблон из списка покупок
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    haptics.selection()
                    setSelectedTemplate(template)
                    setListName(template.name)
                  }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                          {template.name}
                        </h3>
                        {template.isPublic && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full flex-shrink-0">
                            Публичный
                          </span>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                        <span>📦 {template.items.length} товаров</span>
                      </div>
                    </div>
                    <div className="text-2xl flex-shrink-0">
                      {selectedTemplate?.id === template.id ? '✓' : '→'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedTemplate && (
          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Название списка
              </label>
              <Input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Введите название списка..."
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isApplying}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={handleApplyTemplate}
                disabled={!listName.trim() || isApplying}
                className="flex-1"
              >
                {isApplying ? (
                  <>
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Применение...</span>
                  </>
                ) : (
                  <>
                    <span>✓ Применить</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
