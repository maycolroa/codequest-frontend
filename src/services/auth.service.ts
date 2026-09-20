import api from './api'
import type { User } from '@/types'
interface AuthResponse { profile: User; token: string }
export const authService = {
  getMe: async (): Promise<User> => (await api.get<User>('/auth/me')).data,
  loginWithDiscord: (): void => { window.location.href = `${import.meta.env.VITE_API_URL}/auth/discord` },
  loginWithCredentials: async (email: string, password: string): Promise<AuthResponse> => (await api.post<AuthResponse>('/auth/login', { email, password })).data,
}
