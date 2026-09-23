import { X } from 'lucide-react'
import CourseLinks from '@/components/galaxy/CourseLinks'
import type { Galaxy, GalaxyCourse } from '@/types'
import { COURSE_LEVEL_LABELS } from '@/utils/format'

interface CoursePanelProps {
  course: GalaxyCourse
  galaxyByKey: Map<string, Galaxy>
  courseBySlug: Map<string, GalaxyCourse>
  onClose: () => void
  onNavigate: (slug: string) => void
}

export default function CoursePanel({ course, galaxyByKey, courseBySlug, onClose, onNavigate }: CoursePanelProps): JSX.Element {
  return (
    <aside className="absolute right-0 top-0 z-30 flex h-full w-full flex-col overflow-y-auto border-l border-white/10 bg-slate-950/85 p-6 shadow-2xl backdrop-blur-2xl sm:w-[420px]">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold leading-snug text-white">{course.title}</h2>
        <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white" aria-label="Cerrar panel del curso">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 space-y-5">
        <div className="flex flex-wrap gap-1.5">
          {course.galaxies.map((key) => {
            const galaxy = galaxyByKey.get(key)
            if (!galaxy) return null
            return <span key={key} className="rounded-full border px-2.5 py-0.5 text-xs font-medium" style={{ borderColor: `${galaxy.color}80`, backgroundColor: `${galaxy.color}26`, color: galaxy.color }}>{galaxy.name}</span>
          })}
          {!course.isActive && <span className="rounded-full border border-slate-500/50 bg-slate-500/20 px-2.5 py-0.5 text-xs font-medium text-slate-300">No disponible</span>}
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
            <dt className="font-mono text-[10px] uppercase text-slate-400">Nivel</dt>
            <dd className="text-sm font-bold text-slate-200">{COURSE_LEVEL_LABELS[course.level]}</dd>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
            <dt className="font-mono text-[10px] uppercase text-slate-400">Categoría</dt>
            <dd className="text-sm font-bold capitalize text-slate-200">{course.category}</dd>
          </div>
        </dl>

        {course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {course.tags.map((tag) => <span key={tag} className="rounded-lg border border-cyan-500/20 bg-cyan-950/40 px-2.5 py-1 font-mono text-[11px] text-cyan-300">{tag}</span>)}
          </div>
        )}

        <CourseLinks title="Prerequisitos" slugs={course.prerequisites} courseBySlug={courseBySlug} accentClassName="text-red-400" onNavigate={onNavigate} />
        <CourseLinks title="Relacionados" slugs={course.related} courseBySlug={courseBySlug} accentClassName="text-blue-400" onNavigate={onNavigate} />
      </div>
    </aside>
  )
}
