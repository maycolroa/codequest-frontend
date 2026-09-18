import type { ReactNode } from 'react'
export default function Card({ children, className = '' }: { children: ReactNode; className?: string }): JSX.Element { return <section className={`rounded-xl border border-brand-purple/40 bg-brand-dark/80 p-6 ${className}`}>{children}</section> }
