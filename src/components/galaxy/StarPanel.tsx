import Badge from '@/components/ui/Badge'
import type { StarStatus } from '@/hooks/useStarMap'
export default function StarPanel({ title, status = 'doing' }: { title: string; status?: StarStatus }): JSX.Element { const labels: Record<StarStatus, string> = { done: 'COMPLETADO', doing: 'EN PROGRESO', todo: 'PENDIENTE' }; return <aside className="rounded-xl border border-brand-lime/50 bg-brand-darker p-5"><Badge>{labels[status]}</Badge><h3 className="mt-4 font-bold">{title}</h3></aside> }
