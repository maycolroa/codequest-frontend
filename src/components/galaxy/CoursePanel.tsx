import { ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { coursesService } from '@/services/courses.service'
import { useAuthStore } from '@/stores/auth.store'
import CourseLinks from '@/components/galaxy/CourseLinks'
import type { Galaxy, GalaxyCourse } from '@/types'
import { COURSE_LEVEL_LABELS } from '@/utils/format'

interface CoursePanelProps {
  course: GalaxyCourse
  progressPercent: number
  galaxyByKey: Map<string, Galaxy>
  courseBySlug: Map<string, GalaxyCourse>
  onClose: () => void
  onNavigate: (slug: string) => void
  fromAssessment: boolean
  completedCourseIds: Set<string>
}

export default function CoursePanel({ course, progressPercent, galaxyByKey, courseBySlug, onClose, onNavigate, fromAssessment, completedCourseIds }: CoursePanelProps): JSX.Element {
  const token = useAuthStore((state) => state.token)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isLocallyCompleted, setIsLocallyCompleted] = useState(false)
  const effectiveProgress = isLocallyCompleted ? 100 : progressPercent
  const locallyCompletedCourseIds = useMemo(() => {
    try { return new Set(JSON.parse(window.localStorage.getItem('codequest:completed-courses') || '[]') as string[]) }
    catch { return new Set<string>() }
  }, [course.id, isLocallyCompleted])
  const completedIds = useMemo(() => new Set([...completedCourseIds, ...locallyCompletedCourseIds]), [completedCourseIds, locallyCompletedCourseIds])
  const incompletePrerequisites = course.prerequisites
    .map((slug) => courseBySlug.get(slug))
    .filter((prerequisite): prerequisite is GalaxyCourse => Boolean(prerequisite) && !completedIds.has(prerequisite.id))
  const hasIncompletePrerequisites = incompletePrerequisites.length > 0
  useEffect(() => {
    try {
      const completedCourses = JSON.parse(window.localStorage.getItem('codequest:completed-courses') || '[]') as string[]
      setIsLocallyCompleted(completedCourses.includes(course.id))
    } catch {
      setIsLocallyCompleted(false)
    }
  }, [course.id])

  const recommendedCourse = course.related
    .map((slug) => courseBySlug.get(slug))
    .find((candidate) => candidate?.isActive)
    ?? Array.from(courseBySlug.values()).find((candidate) => candidate.isActive && candidate.prerequisites.includes(course.slug))

  return (
    <aside className="course-panel absolute right-0 top-0 z-30 flex h-full w-full flex-col overflow-y-auto border-l border-white/10 bg-slate-950/85 p-6 shadow-2xl backdrop-blur-2xl sm:w-[420px]">
      <div className="course-panel-heading flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold leading-snug text-white">{course.title}</h2>
        <button type="button" onClick={onClose} className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white" aria-label="Cerrar panel del curso">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="course-panel-content mt-5 space-y-5">
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

        {token && (
          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase text-slate-400">Avance del curso</span>
              <strong className="text-sm text-brand-lime">{effectiveProgress}%</strong>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label={`Avance de ${course.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={effectiveProgress}>
              <div className="h-full rounded-full bg-brand-lime transition-all" style={{ width: `${effectiveProgress}%` }} />
            </div>
          </div>
        )}

        {course.isActive && token && (
          hasIncompletePrerequisites ? (
            <div className="space-y-2">
              <button type="button" disabled className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-600/60 bg-slate-700/60 px-4 py-3 text-sm font-bold text-slate-400">Completa los prerequisitos</button>
              <p className="text-xs text-amber-300">Debes completar: {incompletePrerequisites.map((prerequisite) => prerequisite.title).join(', ')}</p>
            </div>
          ) : (
            <Link
              to={`/courses/${course.id}`} state={{ returnToGalaxy: true, resumeCourseId: course.id, resumeCourseSlug: course.slug, restoreGalaxyView: true, fromAssessment }}
              onClick={() => {
                setIsEnrolling(true)
                void coursesService.enroll(course.id)
                  .then(() => { setIsEnrolled(true); toast.success('Te inscribiste al curso') })
                  .catch(() => toast.error('No pudimos inscribirte al curso'))
                  .finally(() => setIsEnrolling(false))
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-lime/50 bg-brand-lime px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-lime-300"
            >
              {isEnrolling ? <><Loader2 className="h-4 w-4 animate-spin" /> Inscribiendo...</> : isLocallyCompleted ? <><CheckCircle2 className="h-4 w-4" /> Curso completado</> : isEnrolled ? <><CheckCircle2 className="h-4 w-4" /> Inscrito</> : effectiveProgress > 0 ? 'Continuar curso' : 'Comenzar curso'}
            </Link>
          )
        )}

        {course.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {course.tags.map((tag) => <span key={tag} className="rounded-lg border border-cyan-500/20 bg-cyan-950/40 px-2.5 py-1 font-mono text-[11px] text-cyan-300">{tag}</span>)}
          </div>
        )}

        <CourseLinks title="Prerequisitos" slugs={course.prerequisites} courseBySlug={courseBySlug} accentClassName="text-red-400" onNavigate={onNavigate} />
        <CourseLinks title="Relacionados" slugs={course.related} courseBySlug={courseBySlug} accentClassName="text-blue-400" onNavigate={onNavigate} />

        {recommendedCourse && (
          <button
            type="button"
            onClick={() => onNavigate(recommendedCourse.slug)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-brand-lime/40 bg-brand-lime/10 px-4 py-3 text-left transition-colors hover:border-brand-lime hover:bg-brand-lime/20"
          >
            <span>
              <span className="block font-mono text-[10px] uppercase tracking-wider text-brand-lime">Siguiente curso recomendado</span>
              <span className="mt-1 block text-sm font-bold text-white">{recommendedCourse.title}</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-brand-lime" />
          </button>
        )}
      </div>
    </aside>
  )
}
