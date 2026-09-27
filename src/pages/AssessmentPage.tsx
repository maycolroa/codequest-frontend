import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import StepIndicator from '@/components/assessment/StepIndicator'
import InterestsStep from '@/components/assessment/InterestsStep'
import LevelStep from '@/components/assessment/LevelStep'
import GoalsStep from '@/components/assessment/GoalsStep'
import TechStep from '@/components/assessment/TechStep'
import { assessmentsService } from '@/services/assessments.service'
import type { AssessmentPayload } from '@/types'
import { useAuthStore } from '@/stores/auth.store'
import './galaxy-effect.css'

const schema = z.object({ answer: z.union([z.string().min(1), z.array(z.string()).min(1)]) })
interface FormValues { answer: string | string[] }
const steps: Array<[keyof AssessmentPayload, string, string[]]> = [
  ['interests', 'Elige tus sistemas', ['Frontend', 'Backend', 'Mobile', 'DevOps', 'Bases de datos', 'Testing', 'Cloud', 'IA aplicada', 'Arquitectura', 'Seguridad']],
  ['level', '¿Cuál es tu nivel?', ['Inicial', 'Intermedio', 'Avanzado']],
  ['goals', '¿Cuál es tu objetivo?', ['Conseguir empleo', 'Crear un producto', 'Mejorar mis habilidades']],
  ['technologies', '¿Qué tecnología te interesa?', ['JavaScript', 'Python', 'Bases de datos']],
]

export default function AssessmentPage(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const addingRoutes = location.state?.addRoutes === true
  const userId = useAuthStore((state) => state.user?.id)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<AssessmentPayload>(() => {
    if (!addingRoutes) return { interests: [], level: '', goals: [], technologies: [] }
    try { return JSON.parse(window.localStorage.getItem('codequest:assessment') || '{}') as AssessmentPayload } catch { return { interests: [], level: '', goals: [], technologies: [] } }
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), shouldUnregister: true })
  const [field, title, choices] = steps[step]
  const watchedAnswer = watch('answer')
  const orbitingInterests = field === 'interests'
    ? (Array.isArray(watchedAnswer) ? watchedAnswer : watchedAnswer ? [watchedAnswer] : [])
    : answers.interests
  const submit = async ({ answer }: FormValues): Promise<void> => {
    const values = Array.isArray(answer) ? answer : [answer]
    const next = { ...answers, [field]: field === 'interests' && addingRoutes ? [...new Set([...answers.interests, ...values])] : field === 'level' ? values[0] : values }
    setAnswers(next)
    if (step === steps.length - 1) {
      setSubmitting(true)
      setSubmitError('')
      try {
        let payload = next
        if (addingRoutes) {
          try {
            const stored = JSON.parse(window.localStorage.getItem('codequest:assessment') || '{}') as Partial<AssessmentPayload>
            payload = {
              ...next,
              interests: [...new Set([...(stored.interests || []), ...next.interests])],
            }
          } catch { /* Se mantiene la selección actual si no hay datos previos válidos. */ }
        }
        if (!userId) throw new Error('Sesión no disponible')
        await assessmentsService.submit(userId, payload)
        navigate('/starmap', { replace: true, state: { fromAssessment: true } })
      } catch {
        setSubmitError('No pudimos crear tu ruta. Revisa tu conexión e inténtalo de nuevo.')
      } finally {
        setSubmitting(false)
      }
    } else setStep((current) => current + 1)
  }
  const options = choices.map((choice) => <label className="assessment-option" key={choice}>
    <input {...register('answer')} type={field === 'interests' ? 'checkbox' : 'radio'} value={choice} />
    <span>{choice}</span>
  </label>)
  const Step = field === 'interests' ? InterestsStep : field === 'level' ? LevelStep : field === 'goals' ? GoalsStep : TechStep

  return <main className="assessment-experience">
    <div className="assessment-space-depth" aria-hidden="true">
      <span className="space-stars space-stars-far" />
      <span className="space-stars space-stars-mid" />
      <span className="space-stars space-stars-near" />
      <span className="space-nebula space-nebula-one" />
      <span className="space-nebula space-nebula-two" />
      <span className="space-planet space-planet-one"><i /></span>
      <span className="space-planet space-planet-two"><i /></span>
      <span className="space-planet space-planet-three"><i /></span>
      <span className="space-planet space-planet-four"><i /></span>
      <span className="space-planet space-planet-five"><i /></span>
    </div>
    <div className="assessment-stars" aria-hidden="true" />
    <header className="assessment-topbar">
      <Link to="/dashboard" className="assessment-mark" aria-label="Volver al universo"><img src="/assets/logo-devtalles.png" alt="DevTalles" /></Link>
      <StepIndicator current={step + 1} />
      <span className="assessment-step-count">Paso {step + 1} de {steps.length}</span>
    </header>
    <section className="assessment-stage" aria-live="polite">
      <div className="assessment-form-panel">
        <p className="assessment-eyebrow"><Sparkles size={13} /> Aterrizaje 0{step + 1} · {field === 'interests' ? 'Intereses' : field === 'level' ? 'Nivel' : field === 'goals' ? 'Objetivo' : 'Tecnología'}</p>
        <h1>{title}</h1>
        <p className="assessment-intro">{field === 'interests' ? 'Cada interés que marques entra en órbita alrededor de Devi.' : 'Una respuesta más para diseñar una ruta hecha a tu medida.'}</p>
        <form onSubmit={handleSubmit(submit)}>
          <Step><div className="assessment-options">{options}</div></Step>
          {errors.answer && <p className="assessment-error">Selecciona al menos una opción para continuar.</p>}
          {submitError && <p className="assessment-error">{submitError}</p>}
          <div className="assessment-actions">
            <button type="button" className="assessment-back" onClick={() => step === 0 ? navigate('/dashboard') : setStep((current) => current - 1)}><ArrowLeft size={15} /> Atrás</button>
            <button className="assessment-next" type="submit" disabled={submitting}>{submitting ? 'Creando ruta...' : step === steps.length - 1 ? 'Crear mi ruta' : 'Siguiente aterrizaje'} {!submitting && <ArrowRight size={16} />}</button>
          </div>
        </form>
      </div>
      <aside className="assessment-devi" aria-label="Devi, tu guía de aprendizaje">
        <span className="assessment-interest-orbit-ring" aria-hidden="true" />
        {orbitingInterests.map((interest, index) => <span className="assessment-interest assessment-interest-orbiting" style={{ '--orbit-delay': `${-(index * 18) / Math.max(orbitingInterests.length, 1)}s`, '--orbit-radius': `${210}px` } as React.CSSProperties} key={interest}>{interest}</span>)}
        <img src="/assets/devi-laptop.png" alt="" />
        <p>{field === 'interests' && answers.interests.length ? `${answers.interests.length} sistemas en órbita` : 'Tu ruta, a tu ritmo'}</p>
      </aside>
    </section>
  </main>
}
