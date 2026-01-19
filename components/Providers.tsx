'use client'

import { ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

/**
 * Компонент-обертка для всех провайдеров приложения с Error Boundary
 *
 * Error Boundary перехватывает ошибки из клиентских компонентов:
 * - AuthProvider
 * - ThemeProvider
 * - Все дочерние компоненты
 *
 * Ошибки из Server Components обрабатываются в app/error.tsx
 */

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Error caught by Providers ErrorBoundary:', error, errorInfo)
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
