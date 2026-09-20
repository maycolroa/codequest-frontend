import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

export default function AuthCallbackPage(): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setToken = useAuthStore((state) => state.setToken)
  const fetchMe = useAuthStore((state) => state.fetchMe)

  useEffect(() => {
    const token = params.get('token')
    if (!token) { navigate('/login', { replace: true }); return }
    window.history.replaceState({}, document.title, '/auth/callback')
    setToken(token)
    void fetchMe().then(() => navigate('/dashboard', { replace: true })).catch(() => navigate('/login', { replace: true }))
  }, [fetchMe, navigate, params, setToken])

  return <p className="p-10 text-white">Conectando con Code Quest...</p>
}
