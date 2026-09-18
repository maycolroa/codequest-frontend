import type { ReactNode } from 'react'
import Navbar from './Navbar'
export default function PageLayout({ children }: { children: ReactNode }): JSX.Element { return <main className="min-h-screen bg-brand-darker p-8 text-white md:p-12"><Navbar />{children}</main> }
