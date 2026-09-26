import { ArrowLeft, Check, PlayCircle, Rocket } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { coursesService } from '@/services/courses.service'
import type { Course } from '@/types'

const courseVideos = ['42586-431756222.mp4', '164014-828879628.mp4', '220514.mp4', '222271.mp4', '236105.mp4', '236653.mp4', '347242.mp4']

const fallbackModules = [
  { title: 'Fundamentos', lessons: ['Introducción al curso', '¿Qué es NestJS?', 'CLI y estructura del proyecto', 'Módulos y controladores'] },
  { title: 'Construcción de APIs', lessons: ['Providers e inyección de dependencias', 'DTOs y validación', 'Pipes, guards e interceptores', 'Persistencia y repositorios'] },
  { title: 'Backend profesional', lessons: ['Autenticación y autorización', 'Manejo de errores', 'Testing unitario y e2e', 'Documentación con Swagger'] },
  { title: 'Producción', lessons: ['Configuración por entornos', 'Docker y despliegue', 'Buenas prácticas', 'Proyecto final'] },
]
const flutterBlocModules = [
  { title: 'Inicio y arquitectura', lessons: ['Introducción al curso', 'Instalaciones para seguir el curso', 'Descarga del proyecto inicial', 'Estructura del proyecto', 'Flutter Bloc - Instalación', 'Cubit Simple', 'BlocProvider y BlocMultiProvider'] },
  { title: 'Cubits y navegación', lessons: ['Consumir y cambiar el estado del cubit', 'BlocBuilder', 'Cubit + Go_Router - Estado Complejo del cubit', 'Counter Cubit', 'ThemeCubit - Cubit + State', 'Solución de la tarea - UsernameCubit', 'Service Locator - Get_it'] },
  { title: 'Blocs y eventos', lessons: ['GuestBloc - Estado complejo', 'Bloc Events - Relacionado al filtro', 'Emitir nuevo estado basado en eventos', 'Reaccionar visualmente al nuevo estado', 'Mostrar lista de invitados', 'Crear un nuevo invitado', 'Cambiar el estado de un invitado'] },
  { title: 'Proyecto y comunicación', lessons: ['Pokemon Screen - Preparación del ejercicio', 'PokemonBloc', 'FetchPokemon desde el Bloc', 'Inyección de dependencias', 'Comunicación entre BLoCs - Geolocation', 'Colocar simuladores en movimiento', 'Permisos y obtener la ubicación', 'Historic Location Bloc', 'Comunicación entre Blocs', 'Mostrar listado de ubicaciones', 'Código fuente de la sección', 'Más información sobre nuestros otros cursos', 'Cierre del curso'] },
]

const nestModules = [
  { title: 'Fundamentos de NestJS', lessons: ['Introducción al curso', '¿Qué es NestJS?', 'CLI y estructura del proyecto', 'Módulos y controladores'] },
  { title: 'Construcción de APIs', lessons: ['Providers e inyección de dependencias', 'DTOs y validación', 'Pipes, guards e interceptores', 'Persistencia y repositorios'] },
  { title: 'Backend profesional', lessons: ['Autenticación y autorización', 'Manejo de errores', 'Testing unitario y e2e', 'Documentación con Swagger'] },
  { title: 'Producción', lessons: ['Configuración por entornos', 'Docker y despliegue', 'Buenas prácticas', 'Proyecto final'] },
]

const springBootModules = [
  { title: 'Introducción al curso', lessons: ['Introducción a la sección', '¿Cómo funciona el curso?', '¿Cómo hacer preguntas?', 'Instalaciones necesarias', 'Únete a la comunidad de DevTalles'] },
  { title: 'El modelo MVC Backend', lessons: ['Arquitectura de software y filosofía del curso', 'MVC: Dos mundos diferentes', 'API: primer flujo completo', 'Inversión de dependencia', 'Creando un DTO de respuesta', 'Comprendiendo H2 y configurando BD', 'Las relaciones en las bases de datos (JPA)', 'Validación e integración con la lógica de negocio', 'DTO vs Entity', 'Lógica de negocio vs lógica de infraestructura'] },
  { title: 'Migrando a MongoDB', lessons: ['SQL vs NoSQL', '¿Qué es NoSQL?', '¿Qué es MongoDB?', 'MongoDB: El cluster', 'El problema: Alto acoplamiento', 'MongoDB: El modelo y ObjectId', 'MongoDB: el repository y MongoTemplate', 'Completamos la migración a MongoDB', 'La defensa de MVC', 'MVC desde la arquitectura de capas'] },
  { title: 'Arquitectura hexagonal', lessons: ['Creando el proyecto y sus capas principales', 'Arquitectura Hexagonal: El domain', 'Completando el Domain: puerto de entrada y salida', 'Manejo global de excepciones', 'El servicio: la lógica de negocio pura', 'El adaptador de salida: conectando JPA', 'El adaptador de entrada: la puerta web', 'Cableado y prueba de fuego', 'Analizando el flujo de la arquitectura hexagonal', 'Testeabilidad extrema'] },
  { title: 'Introducción a los microservicios', lessons: ['De monolito modular a sistema distribuido', 'Creando el proyecto y configurando BD', 'Model, controller, repository y service', 'Finalizando Gamification y prueba en Postman', 'El cliente Feign y la comunicación', 'Manejo de fallos y @PrePersist'] },
  { title: 'Fin de curso', lessons: ['Más información sobre nuestros otros cursos', 'Fin de curso'] },
]

function getCourseModules(title = '') {
  const normalizedTitle = title.toLowerCase()
  if (normalizedTitle.includes('flutter') && normalizedTitle.includes('bloc')) return flutterBlocModules
  if (normalizedTitle.includes('nest')) return nestModules
  if (normalizedTitle.includes('spring boot') || normalizedTitle.includes('springboot')) return springBootModules
  return fallbackModules
}

export default function CourseLearningPage(): JSX.Element {
  const { id = '' } = useParams<{ id: string }>()
  const location = useLocation()
  const returnCourseSlug = location.state?.resumeCourseSlug as string | undefined
  const returnFromAssessment = location.state?.fromAssessment === true
  const [course, setCourse] = useState<Course | null>(null)
  const modules = useMemo(() => getCourseModules(course?.title), [course?.title])
  const lessonKeys = useMemo(() => modules.flatMap((module) => module.lessons.map((lesson) => `${module.title}:${lesson}`)), [modules])
  const storageKey = `codequest:course-lessons:${id}`
  const completedCoursesKey = 'codequest:completed-courses'
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())
  useEffect(() => {
    try { setCompletedLessons(new Set(JSON.parse(window.localStorage.getItem(storageKey) || '[]') as string[])) } catch { setCompletedLessons(new Set()) }
  }, [storageKey])
  const toggleLesson = (lessonKey: string): void => {
    setCompletedLessons((current) => {
      const next = new Set(current)
      if (next.has(lessonKey)) next.delete(lessonKey); else next.add(lessonKey)
      window.localStorage.setItem(storageKey, JSON.stringify([...next]))
      const completedCourses = new Set(JSON.parse(window.localStorage.getItem(completedCoursesKey) || '[]') as string[])
      if (lessonKeys.length > 0 && lessonKeys.every((key) => next.has(key))) completedCourses.add(id)
      else completedCourses.delete(id)
      window.localStorage.setItem(completedCoursesKey, JSON.stringify([...completedCourses]))
      return next
    })
  }
  const allSelected = lessonKeys.length > 0 && lessonKeys.every((lessonKey) => completedLessons.has(lessonKey))
  const toggleAll = (): void => {
    const next = allSelected ? new Set<string>() : new Set(lessonKeys)
    setCompletedLessons(next)
    window.localStorage.setItem(storageKey, JSON.stringify([...next]))
    const completedCourses = new Set(JSON.parse(window.localStorage.getItem(completedCoursesKey) || '[]') as string[])
    if (allSelected) completedCourses.delete(id)
    else completedCourses.add(id)
    window.localStorage.setItem(completedCoursesKey, JSON.stringify([...completedCourses]))
  }
  const videoFile = useMemo(() => {
    const seed = Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0)
    return courseVideos[seed % courseVideos.length]
  }, [id])
  useEffect(() => { if (id) void coursesService.getById(id).then(setCourse).catch(() => undefined) }, [id])
  return <main className="course-learning-screen"><video className="course-learning-video" autoPlay loop muted playsInline aria-hidden="true"><source src={`/course-videos/${videoFile}`} type="video/mp4" /></video><div className="course-learning-video-overlay" aria-hidden="true" /><div className="course-learning-stars" aria-hidden="true" /><header className="course-learning-header"><Link to="/starmap" state={{ resumeCourseId: course?.id, resumeCourseSlug: returnCourseSlug, restoreGalaxyView: true, fromAssessment: returnFromAssessment }} className="course-learning-back"><ArrowLeft size={16} /> Volver a la galaxia</Link><span className="course-learning-kicker"><Rocket size={14} /> En órbita</span></header><section className="course-learning-intro"><p>Contenido programático</p><h1>{course?.title || 'Ruta de aprendizaje'}</h1><span>Aprende a tu ritmo · {modules.length} constelaciones · {completedLessons.size}/{lessonKeys.length} lecciones completadas{allSelected ? ' · Curso completado' : ''}</span><button type="button" className="course-select-all" onClick={toggleAll}><span className={`course-check ${allSelected ? 'is-checked' : ''}`}>{allSelected && <Check size={13} />}</span>{allSelected ? 'Quitar selección' : 'Seleccionar todos'}</button></section><section className="course-learning-grid">{modules.map((module, index) => <article className="course-module" key={module.title}><div className="course-module-heading"><span>0{index + 1}</span><h2>{module.title}</h2></div><div className="course-lessons">{module.lessons.map((lesson, lessonIndex) => <button type="button" className={`course-lesson ${completedLessons.has(`${module.title}:${lesson}`) ? 'is-completed' : ''}`} key={lesson} onClick={() => toggleLesson(`${module.title}:${lesson}`)}><span><span className={`course-check ${completedLessons.has(`${module.title}:${lesson}`) ? 'is-checked' : ''}`}>{completedLessons.has(`${module.title}:${lesson}`) && <Check size={13} />}</span><PlayCircle size={15} /> {lesson}</span><small>{lessonIndex + 1}</small></button>)}</div></article>)}</section></main>
}
