import { ArrowLeft, Check, PlayCircle, Rocket } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { coursesService } from '@/services/courses.service'
import type { Course, CourseLesson } from '@/types'
import { useAuthStore } from '@/stores/auth.store'

const courseVideos = ['42586-431756222.mp4', '164014-828879628.mp4', '220514.mp4', '222271.mp4', '236105.mp4', '236653.mp4', '347242.mp4']


export default function CourseLearningPage(): JSX.Element {
  const { id = '' } = useParams<{ id: string }>()
  const location = useLocation()
  const returnCourseSlug = location.state?.resumeCourseSlug as string | undefined
  const returnFromAssessment = location.state?.fromAssessment === true
  const [course, setCourse] = useState<Course | null>(null)
  const userId = useAuthStore((state) => state.user?.id)
  const [lessons, setLessons] = useState<CourseLesson[]>([])
  const modules = useMemo(() => {
    if (lessons.length > 0) {
      const grouped = new Map<string, CourseLesson[]>();
      lessons.forEach((lesson) => grouped.set(lesson.section || 'Contenido', [...(grouped.get(lesson.section || 'Contenido') || []), lesson]));
      return [...grouped.entries()].map(([title, items]) => ({ title, lessons: items.map((lesson) => lesson.title) }));
    }
    return [];
  }, [lessons])
  const lessonKeys = useMemo(() => modules.flatMap((module) => module.lessons), [modules])
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  const [isSavingProgress, setIsSavingProgress] = useState(false)
  const lessonByTitle = useMemo(() => new Map(lessons.map((lesson) => [lesson.title, lesson])), [lessons])
  const allSelected = lessonKeys.length > 0 && lessonKeys.every((lessonKey) => completedLessons.has(lessonKey))
  const backendCompleted = lessons.filter((lesson) => lesson.completed).length
  const toggleLesson = (lessonKey: string): void => {
    const lesson = lessonByTitle.get(lessonKey)
    const nextCompleted = !completedLessons.has(lessonKey)
    setLessons((current) => current.map((item) => item.id === lesson?.id ? { ...item, completed: nextCompleted } : item))
    setCompletedLessons((current) => {
      const next = new Set(current)
      if (nextCompleted) next.add(lessonKey); else next.delete(lessonKey)
      return next
    })
    if (lesson && userId) void coursesService.updateLessonProgress(userId, id, lesson.id, nextCompleted).catch(() => {
    setLessons((current) => current.map((item) => item.id === lesson?.id ? { ...item, completed: nextCompleted } : item))
      setCompletedLessons((current) => {
        const reverted = new Set(current)
        if (nextCompleted) reverted.delete(lessonKey); else reverted.add(lessonKey)
        return reverted
      })
    })
  }
  const toggleAll = (): void => {
    if (isSavingProgress || !userId) return
    setIsSavingProgress(true)
    const next = allSelected ? new Set<string>() : new Set(lessonKeys)
    setCompletedLessons(next)
    if (userId) void (async () => { for (const lesson of lessons) { for (let attempt = 0; attempt < 3; attempt += 1) { try { await coursesService.updateLessonProgress(userId, id, lesson.id, !allSelected); break } catch { if (attempt === 2) throw new Error(`No se pudo actualizar la lección ${lesson.id}`) } } } const refreshed = await coursesService.getLessonsWithProgress(userId, id); setLessons(refreshed); setCompletedLessons(new Set(refreshed.filter((lesson) => lesson.completed).map((lesson) => lesson.title))) })().catch(() => undefined).finally(() => setIsSavingProgress(false))
  }
  const videoFile = useMemo(() => {
    const seed = Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0)
    return courseVideos[seed % courseVideos.length]
  }, [id])
  useEffect(() => { if (!id || !userId) return; void Promise.all([coursesService.getById(id), coursesService.getLessonsWithProgress(userId, id)]).then(([courseData, lessonData]) => { setCourse(courseData); setLessons(lessonData); setCompletedLessons(new Set(lessonData.filter((lesson) => lesson.completed).map((lesson) => lesson.title))) }).catch(() => undefined) }, [id, userId])
  return <main className="course-learning-screen"><video className="course-learning-video" autoPlay loop muted playsInline aria-hidden="true"><source src={`/course-videos/${videoFile}`} type="video/mp4" /></video><div className="course-learning-video-overlay" aria-hidden="true" /><div className="course-learning-stars" aria-hidden="true" /><header className="course-learning-header"><Link onClick={(event) => { if (isSavingProgress) event.preventDefault() }} to="/starmap" state={{ resumeCourseId: id, resumeCourseSlug: returnCourseSlug, restoreGalaxyView: true, fromAssessment: returnFromAssessment }} className="course-learning-back"><ArrowLeft size={16} /> Volver a la galaxia</Link><span className="course-learning-kicker"><Rocket size={14} /> En órbita</span></header><section className="course-learning-intro"><p>Contenido programático</p><h1>{course?.title || 'Ruta de aprendizaje'}</h1><span>Aprende a tu ritmo · {modules.length} constelaciones · {lessons.filter((lesson) => lesson.completed).length}/{lessonKeys.length} lecciones completadas{backendCompleted === lessonKeys.length && lessonKeys.length > 0 ? ' · Curso completado' : ''}</span><button type="button" className="course-select-all" onClick={toggleAll}><span className={`course-check ${allSelected ? 'is-checked' : ''}`}>{allSelected && <Check size={13} />}</span>{isSavingProgress ? 'Guardando...' : allSelected ? 'Quitar selección' : 'Seleccionar todos'}</button></section><section className="course-learning-grid">{modules.map((module, index) => <article className="course-module" key={module.title}><div className="course-module-heading"><span>0{index + 1}</span><h2>{module.title}</h2></div><div className="course-lessons">{module.lessons.map((lesson, lessonIndex) => <button type="button" className={`course-lesson ${completedLessons.has(lesson) ? 'is-completed' : ''}`} key={lesson} onPointerDown={(event) => { event.preventDefault(); toggleLesson(lesson) }}><span><span className={`course-check ${completedLessons.has(lesson) ? 'is-checked' : ''}`}>{completedLessons.has(lesson) && <Check size={13} />}</span><PlayCircle size={15} /> {lesson}</span><small>{lessonIndex + 1}</small></button>)}</div></article>)}</section></main>
}
