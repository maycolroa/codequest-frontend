import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import { assessmentsService } from '@/services/assessments.service'
import type { AssessmentPayload } from '@/types'

const schema = z.object({ answer: z.string().min(1, 'Selecciona una opción') })
interface FormValues { answer: string }
const steps: Array<[keyof AssessmentPayload, string, string[]]> = [['interests', '¿QUÉ QUIERES CONSTRUIR?', ['Productos digitales', 'Datos e IA', 'Crecer como dev']], ['level', '¿CUÁL ES TU NIVEL?', ['Inicial', 'Intermedio', 'Avanzado']], ['goals', '¿CUÁL ES TU OBJETIVO?', ['Conseguir empleo', 'Crear un producto', 'Mejorar mis habilidades']], ['technologies', '¿QUÉ TECNOLOGÍA TE INTERESA?', ['JavaScript', 'Python', 'Bases de datos']]]

export default function AssessmentPage(): JSX.Element { const { id = '' } = useParams<{ id: string }>(); const navigate = useNavigate(); const [step, setStep] = useState(0); const [answers, setAnswers] = useState<AssessmentPayload>({ interests: [], level: '', goals: [], technologies: [] }); const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) }); const submit = async ({ answer }: FormValues): Promise<void> => { const [field] = steps[step]; const next = { ...answers, [field]: field === 'level' ? answer : [answer] }; setAnswers(next); if (step === steps.length - 1) { await assessmentsService.submit(id, next); navigate('/dashboard') } else setStep((current) => current + 1) }; const [, title, choices] = steps[step]; return <PageLayout><p className="text-xs tracking-widest text-brand-lime">0{step + 1} / 04 · CONFIGURA TU MISIÓN</p><h1 className="mt-5 text-4xl font-bold">{title}</h1><p className="mt-3 text-sm text-slate-400">Elige una opción para trazar tu primera constelación.</p><form className="mt-10 max-w-xl space-y-3" onSubmit={handleSubmit(submit)}>{choices.map((choice) => <label className="flex cursor-pointer items-center gap-4 rounded-lg border border-white/10 p-5" key={choice}><input {...register('answer')} type="radio" value={choice} />{choice}</label>)}{errors.answer && <p className="text-xs text-red-300">{errors.answer.message}</p>}<Button type="submit">{step === steps.length - 1 ? 'CREAR MI RUTA →' : 'CONTINUAR →'}</Button></form></PageLayout> }
