import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  mounted: boolean // Track if app is mounted on client
}

interface ThemeActions {
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  applyTheme: (theme: Theme) => void
  setMounted: () => void
}

type ThemeStore = ThemeState & ThemeActions

const applyThemeToDOM = (theme: Theme) => {
  if (typeof window === 'undefined') return
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // Initial state - starts as 'light' for SSR, not mounted
      theme: 'light',
      mounted: false,

      // Actions
      toggleTheme: () => {
        const currentTheme = get().theme
        const newTheme = currentTheme === 'light' ? 'dark' : 'light'
        applyThemeToDOM(newTheme)
        set({ theme: newTheme })
      },

      setTheme: (theme) => {
        applyThemeToDOM(theme)
        set({ theme })
      },

      applyTheme: applyThemeToDOM,

      setMounted: () => set({ mounted: true }),
    }),
    {
      name: 'theme-storage',
      // Don't persist mounted state
      partialize: (state) => ({ theme: state.theme }),
      // Custom initialization to handle system preference and SSR
      onRehydrateStorage: () => (state) => {
        if (!state) return

        // Lazy initialization with system preference fallback
        if (typeof window !== 'undefined') {
          const savedTheme = localStorage.getItem('theme') as Theme | null
          const theme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          state.theme = theme
          applyThemeToDOM(theme)
          state.mounted = true
        }
      },
    }
  )
)
