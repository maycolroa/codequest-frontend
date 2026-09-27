import { ArrowLeft, ArrowRight, Plus, Route, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import { usePathsStore } from '@/stores/paths.store'
import { useAuthStore } from '@/stores/auth.store'
export default function RoutesPage(): JSX.Element {
  const userId = useAuthStore((state) => state.user?.id)
  const { paths, loading: isLoading, fetchPaths, deletePath } = usePathsStore()
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  useEffect(() => { if (userId) void fetchPaths(userId) }, [fetchPaths, userId])
  const confirmDelete = (pathId: string): void => { setPendingDelete(pathId) }
  const deleteConfirmed = (): void => { if (userId && pendingDelete) void deletePath(userId, pendingDelete); setPendingDelete(null) }
  return <main className="routes-screen"><Navbar /><div className="routes-content"><Link to="/dashboard" className="routes-back"><ArrowLeft size={16} /> Volver a la bitácora</Link><header className="routes-heading"><div><p className="dashboard-eyebrow"><Route size={13} /> Tu selección</p><h1>Rutas de aprendizaje</h1><p>Las rutas que elegiste en tu assessment, listas para explorar.</p></div><Link to="/assessment" state={{ addRoutes: true }} className="routes-add-button"><Plus size={16} /> Agregar rutas</Link></header>{isLoading ? <p className="routes-empty">Cargando tus rutas...</p> : paths.length === 0 ? <p className="routes-empty">Aún no tienes rutas seleccionadas. Completa el assessment para crearlas.</p> : <section className="routes-grid">{paths.map((path, index) => <article className="route-card" key={path.id}><span className="route-number">{String(index + 1).padStart(2, '0')}</span><div className="route-orb" /><h2>{path.title}</h2><p>{path.totalCourses} cursos disponibles en esta ruta.</p><button type="button" className="route-remove-button" onClick={() => confirmDelete(path.id)}><Trash2 size={13} /> Eliminar ruta</button><Link to={`/paths/${path.id}`} className="route-action">Explorar ruta <ArrowRight size={16} /></Link></article>)}</section>}</div>{pendingDelete && <div className="route-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingDelete(null) }}><section className="route-modal" role="dialog" aria-modal="true" aria-labelledby="route-modal-title"><div className="route-modal-icon">!</div><p className="route-modal-eyebrow">// CONFIRMAR OPERACIÓN</p><h2 id="route-modal-title">¿Eliminar esta ruta?</h2><p>La ruta se eliminará de tu selección y no podrás recuperar su progreso.</p><div className="route-modal-actions"><button type="button" className="route-modal-cancel" onClick={() => setPendingDelete(null)}>Cancelar</button><button type="button" className="route-modal-delete" onClick={deleteConfirmed}>Eliminar ruta</button></div></section></div>}</main>
}
