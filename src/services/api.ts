import axios from 'axios'
import { getToken, removeToken } from '@/utils/token'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL, timeout: 30000 })
api.interceptors.request.use((config) => { const token = getToken(); if (token) config.headers.Authorization = `Bearer ${token}`; return config })
api.interceptors.response.use((response) => response, (error: unknown) => { if (axios.isAxiosError(error) && error.response?.status === 401) { const requestUrl = error.config?.url ?? ''; const isCredentialAuth = requestUrl.endsWith('/auth/login') || requestUrl.endsWith('/auth/register'); if (!isCredentialAuth) { removeToken(); window.dispatchEvent(new Event('codequest:unauthorized')); window.location.href = '/' } } return Promise.reject(error) })
export default api
