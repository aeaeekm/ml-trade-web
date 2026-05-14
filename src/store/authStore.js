import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/auth'
import { usersApi } from '../api/users'

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      permissions: [],
      isLoading: true,
      isAuthenticated: false,

      login: async (email, password) => {
        const data = await authApi.login(email, password)
        set({ token: data.access_token, isAuthenticated: true })
        // Fetch user profile
        const user = await authApi.me(data.access_token)
        set({ user })
        // Fetch permissions
        try {
          const permsData = await usersApi.myPermissions()
          set({ permissions: permsData.permissions ?? [] })
        } catch {
          set({ permissions: [] })
        }
        return user
      },

      logout: () => {
        set({ token: null, user: null, permissions: [], isAuthenticated: false })
      },

      initialize: async () => {
        const { token } = get()
        if (!token) {
          set({ isLoading: false })
          return
        }
        try {
          const user = await authApi.me(token)
          set({ user, isAuthenticated: true })
          // Fetch permissions after restoring user
          try {
            const permsData = await usersApi.myPermissions()
            set({ permissions: permsData.permissions ?? [] })
          } catch {
            set({ permissions: [] })
          }
          set({ isLoading: false })
        } catch {
          set({ token: null, user: null, permissions: [], isAuthenticated: false, isLoading: false })
        }
      },

      hasPermission: (key) => {
        const { user, permissions } = get()
        const role = user?.role_name || user?.plan
        if (role === 'admin') return true
        return permissions.includes(key)
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
