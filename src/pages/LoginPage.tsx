import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import { useStarMap } from '@/hooks/useStarMap'

function getAuthErrorMessage(error: unknown, registerMode: boolean): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join('. ')
    if (typeof message === 'string' && message.length > 0) return message
  }
  return registerMode ? 'No se pudo crear la cuenta. Verifica los datos e inténtalo nuevamente.' : 'El correo o la contraseña son incorrectos.'
}

export default function LoginPage(): JSX.Element {
  const { canvasRef } = useStarMap({ count: 700, background: true })
  const navigate = useNavigate()
  const loginWithDiscord = useAuthStore((state) => state.loginWithDiscord)
  const loginWithCredentials = useAuthStore((state) => state.loginWithCredentials)
  const register = useAuthStore((state) => state.register)
  const [registerMode, setRegisterMode] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCredentials = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (registerMode) await register(email, username, password)
      else await loginWithCredentials(email, password)
      navigate('/dashboard', { replace: true })
    } catch (error: unknown) {
      setError(getAuthErrorMessage(error, registerMode))
    } finally {
      setLoading(false)
    }
  }

  const handleDiscord = (): void => {
    loginWithDiscord()
    if (import.meta.env.VITE_MOCK_MODE === 'true') navigate('/dashboard', { replace: true })
  }

  const switchMode = (): void => {
    setRegisterMode((current) => !current)
    setError('')
    setPassword('')
  }

  return <section className="relative grid min-h-screen place-items-center overflow-hidden bg-brand-darker p-6 text-white sm:p-8">
    <canvas ref={canvasRef} className="starfield-canvas" aria-hidden="true" />
    <div className="relative z-10 w-full max-w-lg rounded-2xl border border-brand-purple/70 bg-brand-dark/95 p-7 shadow-2xl shadow-brand-purple/20 backdrop-blur-md sm:p-10">
      <div className="mb-8 border-b border-white/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-lime">Acceso al universo</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{registerMode ? 'Crea tu cuenta' : 'Inicia sesión'}</h1>
        <p className="mt-2 text-sm text-slate-400">{registerMode ? 'Configura tu perfil para comenzar.' : 'Accede a tu espacio de aprendizaje.'}</p>
      </div>
      <form onSubmit={handleCredentials} className="space-y-4">
        {registerMode && <div><label htmlFor="username" className="mb-2 block text-xs font-medium text-slate-300">Nombre de usuario</label><input id="username" name="username" required minLength={3} maxLength={50} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Tu nombre de usuario" autoComplete="username" className="input w-full" /></div>}
        <div><label htmlFor="email" className="mb-2 block text-xs font-medium text-slate-300">Correo electrónico</label><input id="email" name="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@empresa.com" autoComplete="email" className="input w-full" /></div>
        <div><label htmlFor="password" className="mb-2 block text-xs font-medium text-slate-300">Contraseña</label><div className="relative"><input id="password" name="password" required minLength={registerMode ? 12 : 1} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={registerMode ? 'Mínimo 12 caracteres' : 'Introduce tu contraseña'} autoComplete={registerMode ? 'new-password' : 'current-password'} className="input w-full pr-12" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition hover:text-brand-lime focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{registerMode && <p className="mt-2 text-xs text-slate-500">Usa al menos 12 caracteres, incluyendo mayúscula, minúscula y número.</p>}</div>
        {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p>}
        <button disabled={loading} type="submit" className="w-full rounded-lg bg-brand-lime px-5 py-3.5 font-bold text-brand-darker shadow-lg shadow-brand-lime/10 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Procesando...' : registerMode ? 'Crear cuenta' : 'Entrar con correo'}</button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-slate-500"><span className="h-px flex-1 bg-white/10" /> o <span className="h-px flex-1 bg-white/10" /></div>
      <button type="button" onClick={handleDiscord} className="discord-auth-button w-full" aria-label="Continuar con Discord">
        <svg className="discord-auth-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19.54 5.04A16.9 16.9 0 0 0 15.4 3.76l-.5 1.02a15.7 15.7 0 0 0-5.8 0l-.5-1.02a16.9 16.9 0 0 0-4.14 1.28C1.84 8.98 1.13 12.82 1.48 16.6a16.7 16.7 0 0 0 5.1 2.58l1.23-1.63a10.1 10.1 0 0 1-1.94-.93l.47-.36c3.74 1.75 7.8 1.75 11.5 0l.48.36c-.62.36-1.27.67-1.95.93l1.23 1.63a16.7 16.7 0 0 0 5.1-2.58c.42-4.38-.72-8.18-3.16-11.56ZM8.5 14.6c-1.12 0-2.04-1.03-2.04-2.3S7.36 10 8.5 10s2.06 1.03 2.04 2.3c0 1.27-.91 2.3-2.04 2.3Zm7 0c-1.12 0-2.04-1.03-2.04-2.3S14.36 10 15.5 10s2.06 1.03 2.04 2.3c0 1.27-.91 2.3-2.04 2.3Z" />
        </svg>
        <span>Continuar con Discord</span>
      </button>
      <button type="button" onClick={switchMode} className="mt-6 block w-full text-center text-sm font-medium text-brand-lime hover:text-white">{registerMode ? 'Ya tengo una cuenta' : 'Crear cuenta con correo'}</button>
      <Link className="mt-5 block text-center text-sm text-slate-400 transition hover:text-white" to="/">← Volver</Link>
    </div>
  </section>
}
