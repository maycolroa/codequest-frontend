import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { coursesService } from '@/services/courses.service'
import { ASSESSMENT_STORAGE_KEY } from '@/services/assessments.service'
import type { AssessmentPayload } from '@/types'
import { galaxyMock } from '@/services/galaxy.mock'
import { useAuthStore } from '@/stores/auth.store'
import type { CourseGalaxyResponse, Galaxy, GalaxyCourse } from '@/types'

export interface UseCourseGalaxyResult {
  galaxies: Galaxy[]
  courses: GalaxyCourse[]
  isLoading: boolean
  isDemo: boolean
}

interface FetchResult { token: string; data: CourseGalaxyResponse; isDemo: boolean }

const isMock = import.meta.env.VITE_MOCK_MODE === 'true'
const normalize = (value: string): string => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

const getPersonalizedDemo = (): UseCourseGalaxyResult => {
  const raw = window.localStorage.getItem(ASSESSMENT_STORAGE_KEY)
  if (!raw) return { galaxies: galaxyMock.galaxies, courses: galaxyMock.courses, isLoading: false, isDemo: true }
  try {
    const assessment = JSON.parse(raw) as AssessmentPayload
    const interests = assessment.interests.map(normalize)
    const technologies = assessment.technologies.map(normalize)
    const aliases = interests.flatMap((term) => term.includes('base') || term.includes('dato') ? ['databases', 'database', 'sql'] : term.includes('cloud') ? ['devops', 'cloud'] : [term])
    const matches = (terms: string[]): typeof galaxyMock.courses => galaxyMock.courses.filter((course) => {
      const searchable = [course.category, course.title, ...course.tags].map(normalize)
      return terms.some((term) => searchable.some((value) => value.includes(term) || term.includes(value)))
    })
    const interestCourses = matches(aliases)
    const courses = interestCourses.length > 0 ? interestCourses : matches(technologies)
    const removedRoutes = new Set(JSON.parse(window.localStorage.getItem('codequest:removed-routes') || '[]') as string[])
    const filteredCourses = courses.filter((course) => !course.galaxies.every((key) => removedRoutes.has(key)))
    const keys = new Set(filteredCourses.flatMap((course) => course.galaxies))
    const galaxies = galaxyMock.galaxies.filter((galaxy) => keys.has(galaxy.key) && !removedRoutes.has(galaxy.key))
    return { galaxies, courses: filteredCourses, isLoading: false, isDemo: true }
  } catch {
    return { galaxies: galaxyMock.galaxies, courses: galaxyMock.courses, isLoading: false, isDemo: true }
  }
}

const fullDemoResult: UseCourseGalaxyResult = { galaxies: galaxyMock.galaxies, courses: galaxyMock.courses, isLoading: false, isDemo: false }
const loadingResult: UseCourseGalaxyResult = { galaxies: [], courses: [], isLoading: true, isDemo: false }

export function useCourseGalaxy(personalized = false): UseCourseGalaxyResult {
  const token = useAuthStore((s) => s.token)
  const [result, setResult] = useState<FetchResult | null>(null)

  useEffect(() => {
    // Sin token no se llama al endpoint: el interceptor 401 de api.ts redirigiría al visitante anónimo.
    if (isMock || !token) return
    let cancelled = false
    coursesService.getCourseGalaxy()
      .then((data) => { if (!cancelled) setResult({ token, data, isDemo: false }) })
      .catch(() => {
        if (cancelled) return
        toast.error('No pudimos cargar la galaxia de cursos. Mostrando la galaxia demo.')
        setResult({ token, data: personalized ? getPersonalizedDemo() : galaxyMock, isDemo: true })
      })
    return () => { cancelled = true }
  }, [personalized, token])

  if (isMock || !token) return personalized ? getPersonalizedDemo() : fullDemoResult
  // Un resultado de otro token (p. ej. tras re-login) se descarta hasta que llegue el nuevo.
  if (!result || result.token !== token) return loadingResult
  return { galaxies: result.data.galaxies, courses: result.data.courses, isLoading: false, isDemo: result.isDemo }
}
