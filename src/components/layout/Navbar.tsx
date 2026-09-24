import { LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

export default function Navbar(): JSX.Element {
  const user = useAuthStore((state) => state.user)
  const authenticated = useAuthStore((state) => state.isAuthenticated)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const displayName = user?.username || user?.email?.split('@')[0] || 'Explorador'

  const handleLogout = (): void => {
    logout()
    navigate('/', { replace: true })
  }

  return <header className="app-navbar">
    <Link to={authenticated ? '/dashboard' : '/'} className="app-navbar-brand" aria-label="Code Quest, inicio">
      <img src="/assets/logo-devtalles.png" alt="DevTalles" />
    </Link>
    <nav className="app-navbar-links" aria-label="Navegación principal">
      <a href="#universo">Universo</a>
      <a href="#constelaciones">Constelaciones</a>
      <a href="#bitacora">Bitácora</a>
    </nav>
    {authenticated && <div className="app-navbar-user">
      <div className="app-navbar-identity"><span>{displayName}</span>{user?.email && <small>{user.email}</small>}</div>
      {user?.avatarUrl ? <img className="app-navbar-avatar" src={user.avatarUrl} alt={`Foto de ${displayName}`} /> : <span className="app-navbar-avatar app-navbar-initial" aria-label={`Avatar de ${displayName}`}>{displayName.charAt(0).toUpperCase()}</span>}
      <button type="button" className="app-navbar-logout" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={16} /><span>Salir</span></button>
    </div>}
  </header>
}
