export default function StepIndicator({ current, total = 4 }: { current: number; total?: number }): JSX.Element {
  return <div className="assessment-progress" role="progressbar" aria-label="Progreso del diagnóstico" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current} aria-valuetext={`Paso ${current} de ${total}`}>
    {Array.from({ length: total }, (_, index) => <span className={index < current ? 'assessment-diamond is-active' : 'assessment-diamond'} key={index} />)}
  </div>
}
