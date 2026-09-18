import type { ButtonHTMLAttributes } from 'react'
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' }
export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps): JSX.Element { return <button className={`rounded-md px-5 py-3 text-xs font-bold tracking-widest transition hover:-translate-y-0.5 ${variant === 'primary' ? 'bg-brand-lime text-brand-darker shadow-[0_0_24px_rgba(163,230,53,.25)]' : 'border border-brand-purple text-brand-lime'} ${className}`} {...props} /> }
