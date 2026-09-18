import { Link, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import StarMap from '@/components/galaxy/StarMap'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { usePathsStore } from '@/stores/paths.store'
export default function PathDetailPage(): JSX.Element { const { id = '' } = useParams<{ id: string }>(); const { activePath, isLoading, setActivePath } = usePathsStore(); useEffect(() => { if (id) void setActivePath(id) }, [id, setActivePath]); const course = activePath?.courses[0]; return <PageLayout>{isLoading || !activePath ? <LoadingSpinner /> : <><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs tracking-widest text-brand-lime">CONSTELACIÓN · {activePath.title.toUpperCase()}</p><h1 className="mt-4 text-4xl font-bold">MAPA DE <span className="text-brand-lime">APRENDIZAJE</span></h1><p className="mt-3 text-xs text-slate-400">{activePath.totalCourses} ESTRELLAS · HOVER PARA VER PREREQUISITOS</p></div><Badge tone="success">RUTA ACTIVA</Badge></div><div className="mt-8"><StarMap /></div><aside className="mt-5 max-w-md rounded-xl border border-brand-lime/50 bg-brand-darker/90 p-6"><Badge>EN PROGRESO</Badge><h2 className="mt-5 text-xl font-bold">{course?.title}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{course?.description}</p><Link className="mt-5 inline-block text-xs font-bold text-brand-lime" to="/dashboard">← VOLVER A RUTAS</Link></aside></>}</PageLayout> }
