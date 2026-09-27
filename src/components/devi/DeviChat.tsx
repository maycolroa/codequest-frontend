import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Bot, LoaderCircle, RotateCcw, Send, X } from 'lucide-react'
import './devi-chat.css'
import api from '@/services/api'

interface Message { role: 'user' | 'devi'; text: string }
function renderDeviMessage(text: string): JSX.Element {
  const normalizedText = text.split("\n").map((line) => line.trim()).join("\n")
  return <>{normalizedText.split(/\n+/).map((line, index) => {
    const course = line.match(/^\d+\.\s+\[([^\]]+)\]\(([^)]+)\)\s*[—-]\s*(.+)$/)
    if (course) return <div className="devi-course-result" key={index}><strong>{course[1]}</strong><span>{course[3]}</span><small>{course[2].replace(/-/g, " ")}</small></div>
    if (!line.trim()) return <div className="devi-message-gap" key={index} />
    return <p key={index}>{line.replace(/\*\*/g, "")}</p>
  })}</>
}


export default function DeviChat(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [welcomeText, setWelcomeText] = useState('')
  const [welcomeCycle, setWelcomeCycle] = useState(0)
  const welcome = 'Hola, soy Devi y estoy aquí para responder dudas sobre cualquier curso de CodeQuest.'
  useEffect(() => {
    if (!open || messages.length > 0) return
    setWelcomeText('')
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setWelcomeText(welcome.slice(0, index))
      if (index >= welcome.length) window.clearInterval(timer)
    }, 28)
    return () => window.clearInterval(timer)
  }, [open, messages.length, welcomeCycle])
  const askDevi = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const question = message.trim()
    if (!question || loading) return
    setMessage('')
    setMessages((current) => [...current, { role: 'user', text: question }])
    setLoading(true)
    try {
      const response = await api.post<{ answer: string }>('/devi/ask', { message: question })
      setMessages((current) => [...current, { role: 'devi', text: response.data.answer }])
    } catch { setMessages((current) => [...current, { role: 'devi', text: 'No pude responder en este momento. Intenta nuevamente.' }]) }
    finally { setLoading(false) }
  }
  return <div className={`devi-chat ${open ? 'is-open' : ''}`}>
    {open && <section className="devi-chat-window" role="dialog" aria-label="Chat con Devi">
      <header className="devi-chat-header"><div className="devi-chat-title"><img src="/assets/devi-hello.png" alt="" /><div><strong>Devi</strong><small>Tu guía de cursos</small></div></div><button type="button" className="devi-chat-reset" onClick={() => { setMessages([]); setMessage(''); setWelcomeText(''); setWelcomeCycle((current) => current + 1) }} aria-label="Restaurar chat" title="Nuevo chat"><RotateCcw size={15} /></button><button type="button" className="devi-chat-close" onClick={() => setOpen(false)} aria-label="Cerrar chat"><X size={17} /></button></header>
      <div className="devi-chat-messages" aria-live="polite">
        {messages.length === 0 && <div className="devi-chat-welcome"><Bot size={20} /><p>{welcomeText}<span className="devi-chat-cursor" aria-hidden="true">▋</span></p></div>}
        {messages.map((item, index) => <div className={`devi-chat-message ${item.role}`} key={`${item.role}-${index}`}>{item.role === "devi" ? renderDeviMessage(item.text) : item.text}</div>)}
        {loading && <div className="devi-chat-message devi"><LoaderCircle size={15} className="devi-chat-spinner" /> Estoy revisando el catálogo...</div>}
      </div>
      <form className="devi-chat-form" onSubmit={askDevi}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Pregunta sobre un curso..." aria-label="Pregunta para Devi" maxLength={4000} /><button type="submit" disabled={!message.trim() || loading} aria-label="Enviar pregunta"><Send size={16} /></button></form>
    </section>}
    <button type="button" className="devi-chat-fab" onClick={() => setOpen((current) => !current)} aria-label={open ? 'Cerrar chat de Devi' : 'Abrir chat de Devi'} title="Hablar con Devi"><img src="/assets/devi-hello.png" alt="Devi" /></button>
  </div>
}
