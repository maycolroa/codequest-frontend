import Badge from '@/components/ui/Badge'
export default function StarPanel({ title }: { title: string }): JSX.Element { return <aside className="rounded-xl border border-brand-lime/50 bg-brand-darker p-5"><Badge>EN PROGRESO</Badge><h3 className="mt-4 font-bold">{title}</h3></aside> }
