import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Compass, Layers, RotateCcw, Search } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import CoursePanel from '@/components/galaxy/CoursePanel'
import CourseTooltip from '@/components/galaxy/CourseTooltip'
import { useCourseGalaxy } from '@/hooks/useCourseGalaxy'
import { Link, useLocation } from 'react-router-dom'
import { useGalaxyScene } from '@/hooks/useGalaxyScene'
import type { CourseLevel } from '@/types'
import { COURSE_LEVEL_LABELS } from '@/utils/format'
import { coursesService } from '@/services/courses.service'
import { useAuthStore } from '@/stores/auth.store'
import Navbar from '@/components/layout/Navbar'

type LevelFilter = CourseLevel | 'all'

const LEVEL_FILTERS: LevelFilter[] = ['all', 'beginner', 'intermediate', 'advanced']

// Minúsculas y sin acentos para comparar búsquedas
const normalize = (value: string): string => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export default function StarMap3D(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [panelDismissed, setPanelDismissed] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all')
  const [focusedGalaxyKey, setFocusedGalaxyKey] = useState<string | null>(null)
  const token = useAuthStore((state) => state.token)
  const [progressByCourseId, setProgressByCourseId] = useState<Map<string, number>>(new Map())
  const location = useLocation()
  const personalized = location.state?.fromAssessment === true
  const resumeCourseId = location.state?.resumeCourseId as string | undefined
  const resumeCourseSlug = location.state?.resumeCourseSlug as string | undefined
  const restoreGalaxyView = location.state?.restoreGalaxyView === true
    const { galaxies, courses, isLoading } = useCourseGalaxy(personalized)

  useEffect(() => {
    if (!token) { setProgressByCourseId(new Map()); return }
    void coursesService.getMyProgress().then((progress) => {
      setProgressByCourseId(new Map(progress.map((item) => [item.courseId, item.progressPercent])))
    }).catch(() => setProgressByCourseId(new Map()))
  }, [token])

  // Índices sobre todos los cursos recibidos, no solo los filtrados
  const courseBySlug = useMemo(() => new Map(courses.map((course) => [course.slug, course])), [courses])
  const galaxyByKey = useMemo(() => new Map(galaxies.map((galaxy) => [galaxy.key, galaxy])), [galaxies])

  // La galaxia enfocada puede desaparecer al cambiar los datos (p. ej. de demo a real): se trata como sin foco
  const activeFocusKey = focusedGalaxyKey && galaxyByKey.has(focusedGalaxyKey) ? focusedGalaxyKey : null

  const filteredCourses = useMemo(() => {
    const query = normalize(searchTerm.trim())
    return courses.filter((course) => {
      if (levelFilter !== 'all' && course.level !== levelFilter) return false
      if (!query) return true
      const galaxyNames = course.galaxies.map((key) => galaxyByKey.get(key)?.name ?? '')
      return [course.title, ...course.tags, ...galaxyNames].some((text) => normalize(text).includes(query))
    })
  }, [courses, galaxyByKey, levelFilter, searchTerm])

  const { isSupported, resetCamera, focusCourse } = useGalaxyScene({ containerRef, canvasRef, tooltipRef, galaxies, courses: filteredCourses, selectedId: selectedSlug, onHover: setHoveredSlug, onSelect: setSelectedSlug, focusedGalaxyKey: activeFocusKey, onFocusGalaxy: setFocusedGalaxyKey })

  useEffect(() => {
    if ((!personalized && !resumeCourseId && !resumeCourseSlug) || selectedSlug || panelDismissed || filteredCourses.length === 0) return
    const course = resumeCourseSlug
      ? filteredCourses.find((item) => item.slug === resumeCourseSlug) ?? filteredCourses[0]
      : resumeCourseId
        ? filteredCourses.find((item) => item.id === resumeCourseId) ?? filteredCourses[0]
        : filteredCourses[0]
    setFocusedGalaxyKey(course.galaxies[0] ?? null)
    setSelectedSlug(course.slug)
    if (!restoreGalaxyView) focusCourse(course.slug)
  }, [filteredCourses, focusCourse, panelDismissed, personalized, restoreGalaxyView, resumeCourseId, resumeCourseSlug, selectedSlug])

  useEffect(() => {
    if (!personalized || selectedSlug || focusedGalaxyKey || panelDismissed) return
    const firstCourse = filteredCourses[0]
    const firstGalaxy = firstCourse?.galaxies[0]
    if (firstGalaxy) setFocusedGalaxyKey(firstGalaxy)
    if (firstCourse) {
      setSelectedSlug(firstCourse.slug)
      focusCourse(firstCourse.slug)
    }
  }, [filteredCourses, focusCourse, focusedGalaxyKey, panelDismissed, personalized, selectedSlug])

  useEffect(() => {
    if (!personalized || !selectedSlug || !activeFocusKey) return
    focusCourse(selectedSlug)
  }, [activeFocusKey, focusCourse, personalized, selectedSlug])

  const hoveredCourse = hoveredSlug ? courseBySlug.get(hoveredSlug) ?? null : null
  const selectedCourse = selectedSlug ? courseBySlug.get(selectedSlug) ?? null : null
  const completedCourseIds = useMemo(() => new Set([...progressByCourseId.entries()].filter(([, progress]) => progress >= 100).map(([courseId]) => courseId)), [progressByCourseId])

  // Se limpian búsqueda, filtro y foco para que el curso destino esté siempre en la escena y sin atenuar
  const handleNavigate = useCallback((slug: string) => {
    setSearchTerm('')
    setLevelFilter('all')
    setPanelDismissed(false)
    setFocusedGalaxyKey(null)
    setSelectedSlug(slug)
    focusCourse(slug)
  }, [focusCourse])

  const handleResetCamera = useCallback(() => {
    setSelectedSlug(null)
    setFocusedGalaxyKey(null)
    resetCamera()
  }, [resetCamera])

  // La leyenda funciona como toggle del foco
  const handleToggleGalaxy = useCallback((key: string) => {
    setFocusedGalaxyKey(activeFocusKey === key ? null : key)
  }, [activeFocusKey])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      setFocusedGalaxyKey(null)
      setSelectedSlug(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div ref={containerRef} className="relative h-screen w-full select-none overflow-hidden bg-[#000005] font-sans text-slate-100">
      {isSupported
        ? <canvas ref={canvasRef} className="absolute inset-0 z-0 block h-full w-full cursor-grab active:cursor-grabbing" />
        : <p className="absolute inset-0 z-0 flex items-center justify-center p-6 text-center text-sm text-slate-300">Tu navegador no soporta gráficos 3D</p>}

      {/* Viñeta cinemática */}
      <div className="pointer-events-none absolute inset-0 z-[5]" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, transparent 45%, rgba(3,7,18,0.7) 100%)' }} />

      {/* useGalaxyScene posiciona este nodo en cada frame */}
      <div ref={tooltipRef} className="pointer-events-none invisible absolute left-0 top-0 z-10">
        {hoveredCourse && <CourseTooltip course={hoveredCourse} />}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-3 p-4 sm:p-6">
        <div className="pointer-events-auto"><Navbar /></div>
        <header className="flex items-center justify-between gap-3">
          <div className="course-galaxy-header pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2.5 shadow-2xl backdrop-blur-xl">
            <div className="rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-2 text-white shadow-lg shadow-cyan-500/20">
              <Compass className="h-5 w-5" />
            </div>
            <h1 className="text-sm font-bold tracking-wide text-white sm:text-base">Code Quest · Galaxia de cursos</h1>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <button type="button" onClick={handleResetCamera} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/70 px-3.5 py-2.5 font-mono text-xs text-cyan-300 backdrop-blur-md transition-colors hover:bg-slate-800 hover:text-cyan-200" title="Restablecer vista general">
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Vista general</span>
            </button>
            {personalized && <Link to="/dashboard" className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900/70 px-3.5 py-2.5 font-mono text-xs text-lime-300 backdrop-blur-md transition-colors hover:bg-slate-800 hover:text-lime-200" title="Volver a estación espacial">
              <span aria-hidden="true">↩</span>
              <span className="hidden sm:inline">Volver a estación espacial</span>
            </Link>}
          </div>
        </header>

        <div className="course-galaxy-filters pointer-events-auto flex flex-wrap items-center gap-2 self-start">
          <label className="flex items-center rounded-xl border border-white/10 bg-slate-900/80 px-3 py-1.5 shadow-lg backdrop-blur-md">
            <Search className="mr-2 h-3.5 w-3.5 text-slate-400" />
            <input type="text" placeholder="Buscar curso, tag o galaxia..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-40 bg-transparent font-mono text-xs text-slate-200 placeholder-slate-500 focus:outline-none sm:w-56" aria-label="Buscar cursos" />
            {searchTerm && <button type="button" onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-white" aria-label="Limpiar búsqueda">×</button>}
          </label>
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-slate-900/80 p-1 font-mono text-xs shadow-lg backdrop-blur-md">
            {LEVEL_FILTERS.map((level) => (
              <button key={level} type="button" onClick={() => setLevelFilter(level)} className={`rounded-lg px-2.5 py-1 transition-all ${levelFilter === level ? 'border border-cyan-500/30 bg-cyan-500/20 font-semibold text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                {level === 'all' ? 'Todos' : COURSE_LEVEL_LABELS[level]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      {galaxies.length > 0 && (
        <div className="pointer-events-auto absolute bottom-6 left-6 z-20 hidden max-w-xs rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl backdrop-blur-xl md:block">
          <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>Galaxias</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-300">
            {galaxies.map((galaxy) => {
              const isFocused = activeFocusKey === galaxy.key
              return (
                <li key={galaxy.key}>
                  <button type="button" onClick={() => handleToggleGalaxy(galaxy.key)} aria-pressed={isFocused} className={`flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left transition-opacity hover:bg-white/5 hover:text-white ${activeFocusKey && !isFocused ? 'opacity-50' : ''} ${isFocused ? 'font-semibold text-white' : ''}`}>
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: galaxy.color, boxShadow: `0 0 8px ${galaxy.color}` }} />
                    <span>{galaxy.name}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-3 space-y-1.5 border-t border-white/10 pt-2.5 text-[11px] text-slate-400">
            <div className="flex items-center gap-2"><span className="h-0.5 w-5 bg-red-500" /><span>Prerequisitos</span></div>
            <div className="flex items-center gap-2"><span className="h-0.5 w-5 bg-blue-500" /><span>Cursos relacionados</span></div>
          </div>
        </div>
      )}

      {selectedCourse && <CoursePanel course={selectedCourse} progressPercent={progressByCourseId.get(selectedCourse.id) ?? 0} galaxyByKey={galaxyByKey} courseBySlug={courseBySlug} onClose={() => { setSelectedSlug(null); setPanelDismissed(true) }} onNavigate={handleNavigate} fromAssessment={personalized} completedCourseIds={completedCourseIds} />}

      {isLoading && <div className="absolute inset-0 z-20 flex items-center justify-center"><LoadingSpinner /></div>}
    </div>
  )
}
