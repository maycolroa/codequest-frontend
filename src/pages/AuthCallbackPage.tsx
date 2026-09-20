import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

export default function AuthCallbackPage(): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const setToken = useAuthStore((state) => state.setToken)
  const fetchMe = useAuthStore((state) => state.fetchMe)

  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const token = params.get('token')
    const error = params.get('error')

    // Limpia la URL DESPUÉS de leer los params
    window.history.replaceState({}, '', '/auth/callback')

    if (error) { navigate('/login', { replace: true }); return }
    if (!token) { navigate('/login', { replace: true }); return }

    setToken(token)
    void fetchMe()
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => navigate('/login', { replace: true }))
  }, [fetchMe, navigate, params, setToken])

  return <p className="p-10 text-white">Conectando con Code Quest...</p>
}
