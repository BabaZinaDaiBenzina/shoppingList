'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { haptics } from "@/lib/utils/haptic"

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
  const handleConfirm = () => {
    haptics.press()
    onConfirm()
  }

  const handleCancel = () => {
    haptics.tap()
    onCancel()
  }

  const typeIcons = {
    danger: '⚠️',
    warning: '⚡',
    info: 'ℹ️'
  }

  const variantStyles = {
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    warning: 'bg-orange-600 text-white hover:bg-orange-700',
    info: 'bg-primary text-primary-foreground hover:bg-primary/90'
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex flex-col items-center text-center mb-2">
            <div className="text-5xl mb-2">{typeIcons[type]}</div>
            <AlertDialogTitle className="text-xl md:text-2xl">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-center text-base">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-3">
          <AlertDialogCancel
            onClick={handleCancel}
            className="min-h-[48px] text-base"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={`min-h-[48px] text-base ${variantStyles[type]}`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
