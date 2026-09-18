import api from './api'
import type { User } from '@/types'
export const authService = { getMe: async (): Promise<User> => (await api.get<User>('/auth/me')).data, loginWithDiscord: (): void => { window.location.href = `${import.meta.env.VITE_API_URL}/auth/discord` } }
