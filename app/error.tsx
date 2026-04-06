'use client'

import { useEffect } from 'react'
import { logError } from '@/lib/logger'
import { getUserMessage } from '@/types/errors'

/**
 * Глобальный обработчик ошибок для Next.js App Router
 *
 * Этот компонент отображается когда в приложении происходит ошибка.
 * Он автоматически перехватывает ошибки из:
 * - Server Components
 * - Server Actions
 * - Client Components (если не перехвачено ErrorBoundary)
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Логируем ошибку при монтировании
    logError('Global error', error, {
      digest: error.digest,
      location: 'global-error',
    })
  }, [error])

  const errorMessage = getUserMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
        {/* Иконка ошибки */}
        <div className="mx-auto w-16 h-16 mb-4 text-destructive">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            className="w-full h-full"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Заголовок */}
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Что-то пошло не так
        </h2>

        {/* Сообщение об ошибке */}
        <p className="text-muted-foreground mb-6">
          {errorMessage}
        </p>

        {/* Кнопки действий */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Попробовать снова
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            На главную
          </button>
        </div>

        {/* Техническая информация (в дев режиме) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Технические детали
            </summary>
            <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto max-h-48">
              {error.toString()}
              {'\n\n'}
              {error.stack}
              {'\n\n'}
              Digest: {error.digest}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
