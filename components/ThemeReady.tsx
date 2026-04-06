'use client'

import { useTheme } from '@/contexts/ThemeContext'

/**
 * Prevents hydration mismatch by only rendering children after theme is mounted
 * Use this wrapper for components that depend on theme during SSR
 *
 * @example
 * ```tsx
 * <ThemeReady>
 *   <ThemeDependentComponent />
 * </ThemeReady>
 * ```
 */
export function ThemeReady({ children }: { children: React.ReactNode }) {
  const { mounted } = useTheme()

  if (!mounted) {
    return null // Or return a loading placeholder with same structure
  }

  return <>{children}</>
}
