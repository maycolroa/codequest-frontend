import type { LearningPath } from '@/types'
import Card from '@/components/ui/Card'
export default function PathCard({ path }: { path: LearningPath }): JSX.Element { return <Card><h3 className="font-bold">{path.title}</h3><p className="mt-2 text-sm text-slate-400">{path.description}</p></Card> }
