import { useStarMap } from '@/hooks/useStarMap'
import StarPanel from '@/components/galaxy/StarPanel'

export default function StarMap(): JSX.Element {
  const { canvasRef, selectedStar } = useStarMap()
  return <div className="relative h-[520px] overflow-hidden rounded-xl border border-brand-purple/50 bg-[radial-gradient(ellipse_at_center,#32116f88,transparent_65%)]"><canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Mapa estelar de cursos" />{selectedStar && <div className="absolute right-4 top-4 z-10 w-56"><StarPanel title={selectedStar.title} status={selectedStar.status} /></div>}<div className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-brand-lime text-brand-lime shadow-[0_0_30px_#a3e63577]">CQ</div></div>
}
