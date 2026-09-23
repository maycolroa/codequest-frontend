import type { GalaxyCourse } from '@/types'
import { COURSE_LEVEL_LABELS } from '@/utils/format'

interface CourseTooltipProps { course: GalaxyCourse }

export default function CourseTooltip({ course }: CourseTooltipProps): JSX.Element {
  return (
    <div className="w-max max-w-[240px] rounded-xl border border-white/20 bg-slate-900/90 p-3 shadow-2xl backdrop-blur">
      <div className="text-sm font-bold leading-snug text-white">{course.title}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">{COURSE_LEVEL_LABELS[course.level]}</div>
    </div>
  )
}
