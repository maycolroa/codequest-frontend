import type { GalaxyCourse } from '@/types'

interface CourseLinksProps {
  title: string
  slugs: string[]
  courseBySlug: Map<string, GalaxyCourse>
  accentClassName: string
  onNavigate: (slug: string) => void
}

export default function CourseLinks({ title, slugs, courseBySlug, accentClassName, onNavigate }: CourseLinksProps): JSX.Element | null {
  if (slugs.length === 0) return null
  return (
    <section>
      <h3 className={`mb-2 font-mono text-xs uppercase tracking-wider ${accentClassName}`}>{title}</h3>
      <ul className="space-y-1.5">
        {slugs.map((slug) => {
          const target = courseBySlug.get(slug)
          return (
            <li key={slug}>
              {target
                ? <button type="button" onClick={() => onNavigate(slug)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white">{target.title}</button>
                // Slug inexistente: visible pero no clicable
                : <span className="block rounded-lg border border-white/5 px-3 py-2 font-mono text-xs text-slate-500" title="Curso no encontrado">{slug}</span>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
