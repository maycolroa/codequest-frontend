import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { useStarMap } from '@/hooks/useStarMap'
export default function LoginPage(): JSX.Element {
  const { canvasRef } = useStarMap({ count: 700, background: true })
  const navigate = useNavigate()
  const loginWithDiscord = useAuthStore((state) => state.loginWithDiscord)
  const handleDiscord = (): void => { loginWithDiscord(); if (import.meta.env.VITE_MOCK_MODE === 'true') navigate('/dashboard') }
  return <section className="relative grid min-h-screen place-items-center overflow-hidden bg-brand-darker p-6 text-white sm:p-8"><canvas ref={canvasRef} className="starfield-canvas" aria-hidden="true" /><div className="relative z-10 w-full max-w-lg rounded-2xl border border-brand-purple/70 bg-brand-dark/95 p-7 shadow-2xl shadow-brand-purple/20 backdrop-blur-md sm:p-10"><div className="mb-8 border-b border-white/10 pb-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-lime">Acceso al universo</p><h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Inicia sesión</h1><p className="mt-2 text-sm text-slate-400">Accede a tu espacio de aprendizaje.</p></div><button type="button" onClick={handleDiscord} className="w-full rounded-lg border border-brand-purple px-5 py-3.5 font-bold text-white transition hover:bg-brand-purple/20">Continuar con Discord</button><Link className="mt-5 block text-center text-sm text-slate-400 transition hover:text-white" to="/">← Volver</Link></div></section>
}
