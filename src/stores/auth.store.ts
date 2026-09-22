import { create } from 'zustand'
import { authService } from '@/services/auth.service'
import { getToken, removeToken, setToken as persistToken } from '@/utils/token'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setToken: (token: string) => void
  fetchMe: () => Promise<void>
  logout: () => void
  loginWithDiscord: () => void
  loginWithCredentials: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
}

const initialToken = getToken()

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: initialToken,
  isAuthenticated: Boolean(initialToken),
  isLoading: false,
  setToken: (token) => { persistToken(token); set({ token, isAuthenticated: true }) },
  fetchMe: async () => {
    set({ isLoading: true })
    try {
      const user = await authService.getMe()
      set({ user, isAuthenticated: true })
    } catch (error: unknown) {
      removeToken()
      set({ user: null, token: null, isAuthenticated: false })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
  logout: () => { removeToken(); set({ user: null, token: null, isAuthenticated: false }) },
  loginWithDiscord: () => {
    if (import.meta.env.VITE_MOCK_MODE === 'true') {
      persistToken('mock-token')
      set({ token: 'mock-token', isAuthenticated: true })
    } else {
      authService.loginWithDiscord()
    }
  },
  loginWithCredentials: async (email, password) => {
    const { token } = await authService.loginWithCredentials(email, password)
    persistToken(token)
    set({ token, isAuthenticated: true })
    await authService.getMe().then((user) => set({ user }))
  },
  register: async (email, username, password) => {
    const { token } = await authService.register(email, username, password)
    persistToken(token)
    set({ token, isAuthenticated: true })
    await authService.getMe().then((user) => set({ user }))
  },
}))
