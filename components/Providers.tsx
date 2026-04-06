'use client'

import { ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { StoreInitializer } from './StoreInitializer'

/**
 * Компонент-обертка для всех провайдеров приложения с Error Boundary
 *
 * Error Boundary перехватывает ошибки из клиентских компонентов:
 * - AuthProvider (Context-based)
 * - ThemeProvider (Context-based)
 * - StoreInitializer (Zustand stores)
 * - Все дочерние компоненты
 *
 * Note: We're using hybrid approach:
 * - Auth/Theme still use React Context (complex refresh logic)
 * - ShoppingLists use Zustand (simpler state management)
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
          <StoreInitializer />
          {children}
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
