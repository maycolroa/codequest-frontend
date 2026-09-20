import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useStarMap } from '@/hooks/useStarMap'
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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const handleCredentials = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault(); setError(''); setLoading(true)
    try { if (registerMode) await register(email, username, password); else await loginWithCredentials(email, password); navigate('/dashboard') }
    catch { setError(registerMode ? 'No se pudo crear la cuenta.' : 'Correo o contraseña incorrectos.') }
    finally { setLoading(false) }
  }
  const handleDiscord = (): void => { loginWithDiscord(); if (import.meta.env.VITE_MOCK_MODE === 'true') navigate('/dashboard') }
  return <section className="relative grid min-h-screen place-items-center overflow-hidden bg-brand-darker p-6 text-white sm:p-8"><canvas ref={canvasRef} className="starfield-canvas" aria-hidden="true" /><div className="relative z-10 w-full max-w-lg rounded-2xl border border-brand-purple/70 bg-brand-dark/95 p-7 shadow-2xl shadow-brand-purple/20 backdrop-blur-md sm:p-10"><div className="mb-8 border-b border-white/10 pb-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-lime">Acceso al universo</p><h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{registerMode ? 'Crea tu cuenta' : 'Inicia sesión'}</h1><p className="mt-2 text-sm text-slate-400">{registerMode ? 'Configura tu perfil para comenzar.' : 'Accede a tu espacio de aprendizaje.'}</p></div><form onSubmit={handleCredentials} className="space-y-4">{registerMode && <div><label htmlFor="username" className="mb-2 block text-xs font-medium text-slate-300">Nombre de usuario</label><input id="username" required minLength={3} maxLength={50} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Tu nombre" className="input w-full" /></div>}<div><label htmlFor="email" className="mb-2 block text-xs font-medium text-slate-300">Correo electrónico</label><input id="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@empresa.com" className="input w-full" /></div><div><label htmlFor="password" className="mb-2 block text-xs font-medium text-slate-300">Contraseña</label><input id="password" required minLength={registerMode ? 12 : 1} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Introduce tu contraseña" className="input w-full" /></div>{error && <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p>}<button disabled={loading} type="submit" className="w-full rounded-lg bg-brand-lime px-5 py-3.5 font-bold text-brand-darker shadow-lg shadow-brand-lime/10 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Procesando...' : registerMode ? 'Crear cuenta' : 'Entrar con correo'}</button></form><div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-slate-500"><span className="h-px flex-1 bg-white/10" /> o <span className="h-px flex-1 bg-white/10" /></div><button type="button" onClick={handleDiscord} className="w-full rounded-lg border border-brand-purple px-5 py-3.5 font-bold text-white transition hover:bg-brand-purple/20">Continuar con Discord</button><button type="button" onClick={() => { setRegisterMode(!registerMode); setError('') }} className="mt-6 block w-full text-center text-sm font-medium text-brand-lime hover:text-white">{registerMode ? 'Ya tengo una cuenta' : 'Crear cuenta con correo'}</button><Link className="mt-5 block text-center text-sm text-slate-400 transition hover:text-white" to="/">← Volver</Link></div></section>
}
