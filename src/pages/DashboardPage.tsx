import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useAuthStore } from '@/stores/auth.store'
import { usePathsStore } from '@/stores/paths.store'
import { useStarMap } from '@/hooks/useStarMap'
import EmptyState from '@/components/dashboard/EmptyState'

const streak = Array.from({ length: 28 }, (_, index) => index < 23 || index === 25)

export default function DashboardPage(): JSX.Element {
  const { canvasRef } = useStarMap({ count: 480, background: true })
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const { paths, loading, fetchPaths } = usePathsStore()
  useEffect(() => { void fetchPaths() }, [fetchPaths])
  const firstName = user?.username?.split(' ')[0] ?? 'explorador'
  const progress = 34
  return <section className="dashboard-screen"><canvas ref={canvasRef} className="starfield-canvas" aria-hidden="true" /><div className="dashboard-content"><header className="dashboard-heading"><div><p className="dashboard-eyebrow">Tu universo · sesión 128</p><h1>Hola, {firstName}</h1></div><div className="dashboard-profile"><span>Nivel · intermedio</span>{user?.email && <span className="normal-case tracking-normal text-slate-400">{user.email}</span>}{user?.avatarUrl ? <img src={user.avatarUrl} alt={`Avatar de ${firstName}`} className="dashboard-avatar object-cover" /> : <div className="dashboard-avatar">{firstName.charAt(0).toUpperCase()}</div>}<button type="button" onClick={() => { logout(); navigate('/') }} className="dashboard-logout">Cerrar sesión</button></div></header><div className="dashboard-grid"><section className="dashboard-map dashboard-panel"><p className="dashboard-label">Mapa general</p><div className="progress-ring" style={{ '--progress': `${progress * 3.6}deg` } as React.CSSProperties}><div><strong>{progress}%</strong><span>Conquistado</span></div></div><div className="dashboard-map-footer"><span>12 estrellas vivas</span><span>1 en órbita</span><span>22 sin explorar</span></div><Link to="/starmap" className="mt-4 inline-block text-sm font-semibold text-brand-lime hover:underline">Explorar galaxia →</Link></section><aside className="dashboard-side"><Metric label="Cursos cerrados" value="12" suffix="/ 20" /><Metric label="Horas en órbita" value="148" suffix="hrs" /><Metric label="Racha" value="23" suffix="días" /><section className="streak-card dashboard-panel"><p className="dashboard-label green">Racha · 23 días</p><div className="streak-grid">{streak.map((active, index) => <span className={active ? index > 20 ? 'active bright' : 'active' : ''} key={index} />)}</div><p className="streak-message">Una lección hoy mantiene la señal viva.</p></section></aside></div>{loading ? <LoadingSpinner /> : paths.length === 0 ? <div className="mt-5"><EmptyState /></div> : null}</div></section>
}

function Metric({ label, value, suffix }: { label: string; value: string; suffix: string }): JSX.Element { return <section className="metric-card dashboard-panel"><p className="dashboard-label">{label}</p><div><strong>{value}</strong><span>{suffix}</span></div></section> }