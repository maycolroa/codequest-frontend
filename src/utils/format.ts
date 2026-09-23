import type { CourseLevel } from '@/types'
export const formatHours = (minutes: number): string => `${Math.round(minutes / 60)}h`
export const calcProgress = (done: number, total: number): number => total === 0 ? 0 : Math.round((done / total) * 100)
export const COURSE_LEVEL_LABELS: Record<CourseLevel, string> = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' }
