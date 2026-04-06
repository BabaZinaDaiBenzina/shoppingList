'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useThemeStore } from '@/stores/useThemeStore'

/**
 * Initialize stores on app mount
 * - Loads auth data and CSRF tokens
 * - Applies theme to DOM (client-side only to prevent hydration mismatch)
 */
export function StoreInitializer() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const applyTheme = useThemeStore((state) => state.applyTheme)
  const theme = useThemeStore((state) => state.theme)
  const setMounted = useThemeStore((state) => state.setMounted)

  useEffect(() => {
    // Mark as mounted (client-side only)
    setMounted()

    // Initialize auth on mount
    initializeAuth()

    // Apply theme to DOM (only after mount to prevent SSR mismatch)
    applyTheme(theme)
  }, [initializeAuth, applyTheme, theme, setMounted])

  return null
}
