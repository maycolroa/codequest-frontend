import { useEffect, useState } from 'react'
import { ArrowRight, Compass, Orbit, Route, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { useAuthStore } from '@/stores/auth.store'
import { ASSESSMENT_STORAGE_KEY } from '@/services/assessments.service'
import { coursesService } from '@/services/courses.service'
import type { CourseGalaxyResponse, UserCourseProgress } from '@/types'
import { useStarMap } from '@/hooks/useStarMap'
import { useGalaxyWarp } from '@/hooks/useGalaxyWarp'
import './galaxy-effect.css'

const streak = Array.from({ length: 28 }, (_, index) => index < 23 || index === 25)

let constellationSeed = 20260921
const constellationRandom = (): number => {
  constellationSeed = (constellationSeed * 1664525 + 1013904223) >>> 0
  return constellationSeed / 4294967296
}
const backgroundStars = Array.from({ length: 76 }, () => [
  12 + constellationRandom() * 1576,
  12 + constellationRandom() * 976,
  0.55 + constellationRandom() * 1.25,
] as const)

export default function DashboardPage(): JSX.Element {
  const { canvasRef } = useStarMap({ count: 760, background: true })
  const galaxyWarpRef = useGalaxyWarp()
  const user = useAuthStore((state) => state.user)
  const [hasAssessment, setHasAssessment] = useState(false)
  const [progress, setProgress] = useState<UserCourseProgress[]>([])
  const [catalog, setCatalog] = useState<CourseGalaxyResponse | null>(null)

  useEffect(() => {
    setHasAssessment(Boolean(window.localStorage.getItem(ASSESSMENT_STORAGE_KEY)))
    void Promise.all([coursesService.getMyProgress(), coursesService.getCourseGalaxy()])
      .then(([progressData, galaxyData]) => { setProgress(progressData); setCatalog(galaxyData) })
      .catch(() => undefined)
    window.scrollTo(0, 0)
    if (window.location.hash === '#constelaciones') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
      window.scrollTo(0, 0)
    }
  }, [])

  if (!hasAssessment) {
    return <section className="dashboard-screen dashboard-home">
      <canvas ref={canvasRef} className="starfield-canvas" aria-hidden="true" />
      <canvas ref={galaxyWarpRef} className="dashboard-galaxy-motion" aria-hidden="true" />
      <svg className="dashboard-constellation-stars" viewBox="0 0 1600 1000" preserveAspectRatio="none" aria-hidden="true">
        <g>{backgroundStars.map(([x, y, radius], index) => <circle className="constellation-twinkle" style={{ animationDelay: `${(index % 9) * -0.43}s` }} key={`${x}-${y}`} cx={x} cy={y} r={radius} />)}</g>
      </svg>
      <div className="galaxy-planets" aria-hidden="true">
        <span className="galaxy-planet galaxy-planet-jade"><i /></span>
        <span className="galaxy-planet galaxy-planet-amethyst"><i /></span>
        <span className="galaxy-planet galaxy-planet-moon" />
        <span className="galaxy-planet galaxy-planet-ice" />
        <span className="galaxy-planet galaxy-planet-coral" />
        <span className="galaxy-planet galaxy-planet-indigo"><i /></span>
        <span className="galaxy-planet galaxy-planet-saturn"><i /></span>
        <span className="galaxy-planet galaxy-planet-distant" />
      </div>
      <div className="galaxy-dust-cloud galaxy-dust-cloud-one" aria-hidden="true" />
      <div className="galaxy-dust-cloud galaxy-dust-cloud-two" aria-hidden="true" />
      <div className="galaxy-asteroid-field" aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i />
      </div>
      <div className="galaxy-distant-world galaxy-distant-world-one" aria-hidden="true" />
      <div className="galaxy-distant-world galaxy-distant-world-two" aria-hidden="true" />
      <div className="galaxy-bright-stars" aria-hidden="true">
        <span className="bright-star bright-star-one" /><span className="bright-star bright-star-two" />
        <span className="bright-star bright-star-three" /><span className="bright-star bright-star-four" />
        <span className="bright-star bright-star-five" /><span className="bright-star bright-star-six" />
      </div>
      <div className="dashboard-nebula dashboard-nebula-one" aria-hidden="true" />
      <div className="dashboard-nebula dashboard-nebula-two" aria-hidden="true" />
      <div className="galaxy-shooting-star galaxy-shooting-star-one" aria-hidden="true" />
      <div className="galaxy-shooting-star galaxy-shooting-star-two" aria-hidden="true" />
      <div className="galaxy-shooting-star galaxy-shooting-star-three" aria-hidden="true" />
      <div className="galaxy-shooting-star galaxy-shooting-star-four" aria-hidden="true" />
      <div className="galaxy-shooting-star galaxy-shooting-star-five" aria-hidden="true" />
      <div className="dashboard-home-content">
        <Navbar />
        <main>
          <section className="home-hero" id="universo">
            <div className="home-copy">
              <p className="dashboard-eyebrow"><Sparkles size={13} /> Tu universo de aprendizaje</p>
              <h1>Hola, {user?.username?.trim().split(/\s+/)[0] || 'explorador'}.</h1>
              <h2>Tu próxima aventura empieza aquí.</h2>
              <p className="home-description">Cuéntanos qué quieres aprender. Trazaremos una ruta hecha para ti y encenderemos la primera estrella de tu constelación.</p>
              <div className="home-actions">
                <Link to="/assessment" className="home-primary-action"><Compass size={17} /> Empezar viaje <ArrowRight size={17} /></Link>
              </div>
              <p className="home-caption"><span /> Sin cursos iniciados <span className="caption-divider">·</span> a tu ritmo, desde cero</p>
            </div>
            <div className="home-visual" aria-hidden="true">
              <div className="home-orbit home-orbit-outer" /><div className="home-orbit home-orbit-inner" />
              <div className="home-planet"><span>✦</span></div><img src="/assets/devi-laptop.png" alt="" />
              <span className="home-satellite satellite-one" /><span className="home-satellite satellite-two" />
            </div>
          </section>
          <section className="home-discovery" id="constelaciones">
            <div className="home-section-heading"><div><p className="dashboard-eyebrow">Primeros pasos</p><h2>Convierte tu curiosidad en camino.</h2></div><span>01 <i /> 03</span></div>
            <div className="home-journey" aria-label="Tu viaje de aprendizaje en tres etapas">
              <article className="home-journey-stop">
                <div className="journey-marker"><span>01</span><Compass aria-hidden="true" /></div>
                <div className="journey-copy"><span className="journey-kicker">Origen <i /> Diagnóstico</span><h3>Define tu destino</h3><p>Elige tus intereses, nivel y objetivo de aprendizaje.</p></div>
              </article>
              <article className="home-journey-stop">
                <div className="journey-marker"><span>02</span><Orbit aria-hidden="true" /></div>
                <div className="journey-copy"><span className="journey-kicker">Trayectoria <i /> Constelación</span><h3>Recibe tu ruta</h3><p>Organizaremos cursos y conceptos en un mapa claro.</p></div>
              </article>
              <article className="home-journey-stop">
                <div className="journey-marker"><span>03</span><Sparkles aria-hidden="true" /></div>
                <div className="journey-copy"><span className="journey-kicker">Horizonte <i /> Despegue</span><h3>Enciende tu primera estrella</h3><p>Empieza cuando quieras y avanza paso a paso.</p></div>
              </article>
            </div>
          </section>
          <div id="bitacora" className="home-bottom-note">Tu bitácora comenzará a escribirse cuando inicies tu primera ruta.</div>
        </main>
      </div>
    </section>
  }

  const totalCourses = catalog?.courses.filter((course) => course.isActive).length || 20
  const completedCourses = progress.filter((item) => item.status === 'completed').length
  const inProgressCourses = progress.filter((item) => item.status === 'in_progress').length
  const completionPercent = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0
  const orbitHours = progress.reduce((total, item) => total + (item.course?.durationHours || 0), 0)
  const resumeCourse = progress.find((item) => item.status === 'in_progress') || progress.find((item) => item.status === 'not_started')
  return <section className="dashboard-screen dashboard-personalized">
    <canvas ref={canvasRef} className="starfield-canvas" aria-hidden="true" />
    <div className="dashboard-personalized-content">
      <Navbar />
      <header className="personalized-heading">
        <div>
          <p className="dashboard-eyebrow">Tu universo</p>
          <h1>Hola, {user?.username?.trim().split(/\s+/)[0] || "explorador"}. Tu misión continúa.</h1>
        </div>
        <Link to="/routes" className="personalized-routes-button"><Route size={16} /> Ver rutas</Link>
      </header>
      <div className="personalized-grid">
        <section className="personalized-map dashboard-panel">
          <p className="dashboard-label">Mapa general</p>
          <div className="personalized-ring"><div><strong>{completionPercent}%</strong><span>Conquistado</span></div></div>
          <div className="personalized-map-footer"><span>{completedCourses} estrellas vivas</span><span>{inProgressCourses} en órbita</span><span>{Math.max(totalCourses - progress.length, 0)} sin explorar</span></div>
        </section>
        <aside className="personalized-side">
          <Metric label="Cursos cerrados" value={String(completedCourses)} suffix={`/ ${totalCourses}`} />
          <Metric label="Horas en órbita" value={String(orbitHours)} suffix="hrs" />
          <Metric label="Racha" value="23" suffix="días" />
                    <section className="streak-card dashboard-panel"><p className="dashboard-label green">Racha · 23 días</p><div className="streak-grid">{streak.map((active, index) => <span className={active ? index > 20 ? 'active bright' : 'active' : ''} key={index} />)}</div><p className="streak-message">Una lección hoy mantiene la señal viva.</p></section>

        </aside>
      </div>
      <Link to="/starmap" state={{ fromAssessment: true, ...(resumeCourse?.courseId ? { resumeCourseId: resumeCourse.courseId } : {}) }} className="personalized-universe-link">Continuar misión <ArrowRight size={16} /></Link>
    </div>
  </section>
}

function Metric({ label, value, suffix }: { label: string; value: string; suffix: string }): JSX.Element { return <section className="metric-card dashboard-panel"><p className="dashboard-label">{label}</p><div><strong>{value}</strong><span>{suffix}</span></div></section> }
