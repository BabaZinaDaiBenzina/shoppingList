'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import { haptics } from "@/lib/utils/haptic"

interface Shortcut {
  key: string
  description: string
  ctrl?: boolean
}

interface KeyboardShortcutsHelpProps {
  shortcuts: Shortcut[]
}

export function KeyboardShortcutsHelp({ shortcuts }: KeyboardShortcutsHelpProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="hidden md:flex fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full shadow-lg"
          onClick={() => haptics.tap()}
        >
          <BookOpen className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>⌨️ Горячие клавиши</DialogTitle>
          <DialogDescription>
            Быстрые клавиши для управления приложением
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-4">
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

        <div className="mt-6">
          <DialogTrigger asChild>
            <Button className="w-full" onClick={() => haptics.tap()}>
              Понятно
            </Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  )
}
