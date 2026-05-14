import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const applyTheme = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const useThemeStore = create(
  persist(
    (set, get) => ({
      isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,

      toggle: () => {
        const next = !get().isDark
        applyTheme(next)
        set({ isDark: next })
      },

      setDark: (isDark) => {
        applyTheme(isDark)
        set({ isDark })
      },

      init: () => {
        applyTheme(get().isDark)
      },
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.isDark)
      },
    }
  )
)

export default useThemeStore
