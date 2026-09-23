import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { coursesService } from '@/services/courses.service'
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
const demoResult: UseCourseGalaxyResult = { galaxies: galaxyMock.galaxies, courses: galaxyMock.courses, isLoading: false, isDemo: true }
const loadingResult: UseCourseGalaxyResult = { galaxies: [], courses: [], isLoading: true, isDemo: false }

export function useCourseGalaxy(): UseCourseGalaxyResult {
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
        setResult({ token, data: galaxyMock, isDemo: true })
      })
    return () => { cancelled = true }
  }, [token])

  if (isMock || !token) return demoResult
  // Un resultado de otro token (p. ej. tras re-login) se descarta hasta que llegue el nuevo.
  if (!result || result.token !== token) return loadingResult
  return { galaxies: result.data.galaxies, courses: result.data.courses, isLoading: false, isDemo: result.isDemo }
}
