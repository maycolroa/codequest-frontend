import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { usePathsStore } from '@/stores/paths.store'
import { useAuthStore } from '@/stores/auth.store'

export default function PathDetailPage(): JSX.Element {
  const { id = '' } = useParams<{ id: string }>()
  const userId = useAuthStore((state) => state.user?.id)
  const { currentPath, loading, fetchPath } = usePathsStore()
  useEffect(() => { if (id && userId) void fetchPath(userId, id) }, [id, fetchPath, userId])

  if (loading) return <PageLayout><LoadingSpinner /></PageLayout>
  if (!currentPath) return <PageLayout><p className="text-brand-lime text-xs">// RUTAS DE APRENDIZAJE</p><h1 className="mt-4 text-4xl font-bold">RUTA NO DISPONIBLE</h1><p className="mt-4 text-slate-400">No pudimos cargar esta ruta de aprendizaje.</p><Link className="mt-5 inline-block text-xs font-bold text-brand-lime" to="/routes">← VOLVER A RUTAS</Link></PageLayout>

  return <PageLayout>
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div><p className="text-xs tracking-widest text-brand-lime">// RUTA DE APRENDIZAJE</p><h1 className="mt-4 text-4xl font-bold">{currentPath.title}</h1><p className="mt-3 text-sm text-slate-400">{currentPath.description}</p></div>
      <Badge tone="success">RUTA ACTIVA</Badge>
    </div>
    <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {currentPath.courses.map((course, index) => <article className="card card-hover" key={course.id}>
        <div className="flex items-center justify-between"><span className="font-mono text-xs font-bold text-brand-lime">0{index + 1}</span><span className="text-xs text-slate-500">{course.level}</span></div>
        <h2 className="mt-5 text-lg font-bold text-white">{course.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{course.description}</p>
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-500"><span>{course.durationMinutes ? `${Math.round(course.durationMinutes / 60)} horas` : 'Curso'}</span><Link to={`/courses/${course.id}`} className="font-bold text-brand-lime hover:text-lime-300">Ver curso →</Link></div>
      </article>)}
    </section>
    <Link className="mt-8 inline-block text-xs font-bold text-brand-lime" to="/routes">← VOLVER A RUTAS</Link>
  </PageLayout>
}
