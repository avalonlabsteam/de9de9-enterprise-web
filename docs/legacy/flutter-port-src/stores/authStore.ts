import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppRole } from '@/types/catalogue'

interface AuthUser {
  email: string
  company: string
  role: AppRole
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  /** Mock login — role is not derived from credentials (matches Flutter: login → cliente). */
  login: (email: string) => void
  /** Mock signup — role is chosen on the signup screen. */
  signup: (user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email) =>
        set({
          isAuthenticated: true,
          user: { email, company: 'Mon Entreprise', role: 'cliente' },
        }),
      signup: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null }),
    }),
    { name: 'de9de9_auth' },
  ),
)
