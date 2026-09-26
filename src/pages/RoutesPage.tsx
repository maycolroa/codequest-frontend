import { ArrowLeft, ArrowRight, Plus, Route, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { useCourseGalaxy } from '@/hooks/useCourseGalaxy'
import { useEffect, useState } from 'react'

export default function RoutesPage(): JSX.Element {
  const { galaxies, courses, isLoading } = useCourseGalaxy(true)
  const [removedRoutes, setRemovedRoutes] = useState<string[]>([])
  useEffect(() => {
    try { setRemovedRoutes(JSON.parse(window.localStorage.getItem('codequest:removed-routes') || '[]') as string[]) } catch { setRemovedRoutes([]) }
  }, [])
  const visibleGalaxies = galaxies.filter((galaxy) => !removedRoutes.includes(galaxy.key))
  const removeRoute = (key: string): void => {
    setRemovedRoutes((current) => { const next = [...new Set([...current, key])]; window.localStorage.setItem('codequest:removed-routes', JSON.stringify(next)); return next })
  }
  const courseCountByGalaxy = new Map(galaxies.map((galaxy) => [galaxy.key, courses.filter((course) => course.galaxies.includes(galaxy.key)).length]))

  return <main className="routes-screen">
    <Navbar />
    <div className="routes-content">
      <Link to="/dashboard" className="routes-back"><ArrowLeft size={16} /> Volver a la bitácora</Link>
      <header className="routes-heading">
        <div><p className="dashboard-eyebrow"><Route size={13} /> Tu selección</p><h1>Rutas de aprendizaje</h1><p>Las rutas que elegiste en tu assessment, listas para explorar.</p></div><Link to="/assessment" state={{ addRoutes: true }} className="routes-add-button"><Plus size={16} /> Agregar rutas</Link>
      </header>
      {isLoading ? <p className="routes-empty">Cargando tus rutas...</p> : visibleGalaxies.length === 0 ? <p className="routes-empty">Aún no tienes rutas seleccionadas. Completa el assessment para crearlas.</p> : <section className="routes-grid">{visibleGalaxies.map((galaxy, index) => <article className="route-card" key={galaxy.key} style={{ '--route-color': galaxy.color } as React.CSSProperties}><span className="route-number">0{index + 1}</span><div className="route-orb" /><h2>{galaxy.name}</h2><p>{courseCountByGalaxy.get(galaxy.key) || 0} cursos disponibles en esta ruta.</p><button type="button" className="route-remove-button" onClick={() => removeRoute(galaxy.key)}><Trash2 size={13} /> Eliminar ruta</button><Link to="/starmap" state={{ fromAssessment: true }} className="route-action">Explorar ruta <ArrowRight size={16} /></Link></article>)}</section>}
    </div>
  </main>
}
