import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/auth'

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: true,
      isAuthenticated: false,

      login: async (email, password) => {
        const data = await authApi.login(email, password)
        set({ token: data.access_token, isAuthenticated: true })
        // Fetch user profile
        const user = await authApi.me(data.access_token)
        set({ user })
        return user
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
      },

      initialize: async () => {
        const { token } = get()
        if (!token) {
          set({ isLoading: false })
          return
        }
        try {
          const user = await authApi.me(token)
          set({ user, isAuthenticated: true, isLoading: false })
        } catch {
          set({ token: null, user: null, isAuthenticated: false, isLoading: false })
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
)

export default useAuthStore
