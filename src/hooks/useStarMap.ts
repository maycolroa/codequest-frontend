import { useEffect, useRef, useState } from 'react'

export type StarStatus = 'done' | 'doing' | 'todo'
export interface MapStar { id: number; x: number; y: number; radius: number; status: StarStatus; title: string }
export interface StarMapController { canvasRef: React.RefObject<HTMLCanvasElement>; selectedStar: MapStar | null; hoverStar: MapStar | null }
interface StarMapOptions { count?: number; background?: boolean }

const COLORS: Record<StarStatus, string> = { done: '#facc15', doing: '#a855f7', todo: '#60a5fa' }

export function useStarMap(options: StarMapOptions = {}): StarMapController {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedStar, setSelectedStar] = useState<MapStar | null>(null)
  const [hoverStar, setHoverStar] = useState<MapStar | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const background = options.background === true
    const count = options.count ?? (background ? 1000 : 900)
    const stars: MapStar[] = Array.from({ length: count }, (_, id) => {
      const arm = id % 2 === 0 ? 1 : -1
      const distance = Math.sqrt(id / count) * 0.48
      const angle = distance * 15 * arm + Math.random() * 0.6
      return { id, x: background ? Math.random() : Math.cos(angle) * distance, y: background ? Math.random() : Math.sin(angle) * distance, radius: Math.random() * 1.35 + 0.3, status: id % 5 === 0 ? 'done' : id % 3 === 0 ? 'doing' : 'todo', title: `Curso ${id + 1}` }
    })
    const warp = Array.from({ length: 280 }, () => ({ angle: Math.random() * Math.PI * 2, distance: Math.random(), speed: 0.001 + Math.random() * 0.004 }))
    let animation = 0
    let camera = 1
    let targetCamera = 1
    const resize = (): void => { const ratio = window.devicePixelRatio || 1; canvas.width = canvas.clientWidth * ratio; canvas.height = canvas.clientHeight * ratio; context.setTransform(ratio, 0, 0, ratio, 0, 0) }
    const draw = (time: number): void => {
      resize(); const width = canvas.clientWidth; const height = canvas.clientHeight; const centerX = width / 2; const centerY = height / 2
      context.clearRect(0, 0, width, height); camera += (targetCamera - camera) * 0.06
      if (background) {
        stars.forEach((star, index) => { const x = star.x * width; const y = star.y * height; const alpha = 0.25 + Math.abs(Math.sin(time * 0.0012 + index)) * 0.55; context.globalAlpha = alpha; context.fillStyle = index < 12 ? '#fff4be' : '#e8e6ff'; context.beginPath(); context.arc(x, y, star.radius, 0, Math.PI * 2); context.fill(); if (index < 12) { context.globalAlpha = alpha * 0.45; context.fillRect(x - 18, y - 0.5, 36, 1); context.fillRect(x - 0.5, y - 18, 1, 36) } })
      } else {
        context.globalAlpha = 0.28; context.strokeStyle = '#7c3aed'; context.lineWidth = 1
        for (let arm = 0; arm < 2; arm += 1) { context.beginPath(); for (let point = 0; point < 80; point += 1) { const radius = point / 160; const angle = radius * 15 * (arm === 0 ? 1 : -1); const x = centerX + Math.cos(angle) * radius * width * 0.8 * camera; const y = centerY + Math.sin(angle) * radius * height * 0.8 * camera; if (point === 0) context.moveTo(x, y); else context.lineTo(x, y) } context.stroke() }
        context.globalAlpha = 0.4; context.strokeStyle = '#9da8ff'; warp.forEach((item) => { item.distance = (item.distance + item.speed) % 1; const length = item.distance * Math.min(width, height) * 0.5; const x = centerX + Math.cos(item.angle) * length; const y = centerY + Math.sin(item.angle) * length; context.beginPath(); context.moveTo(centerX + Math.cos(item.angle) * length * 0.85, centerY + Math.sin(item.angle) * length * 0.85); context.lineTo(x, y); context.stroke() })
        context.globalAlpha = 0.28; context.strokeStyle = '#a3e635'; for (let index = 0; index < 16; index += 1) { const first = stars[index * 11]; const second = stars[index * 11 + 7]; if (!first || !second) continue; const firstX = centerX + first.x * width * camera; const firstY = centerY + first.y * height * camera; const secondX = centerX + second.x * width * camera; const secondY = centerY + second.y * height * camera; context.beginPath(); context.moveTo(firstX, firstY); context.lineTo(secondX, secondY); context.stroke(); const progress = (time * 0.0003 + index * 0.07) % 1; context.fillStyle = '#fff4be'; context.globalAlpha = 0.9; context.beginPath(); context.arc(firstX + (secondX - firstX) * progress, firstY + (secondY - firstY) * progress, 2, 0, Math.PI * 2); context.fill() }
        stars.forEach((star) => { const x = centerX + star.x * width * camera; const y = centerY + star.y * height * camera; const pulse = star.status === 'doing' ? 1 + Math.sin(time * 0.004 + star.id) * 0.35 : 1; context.fillStyle = COLORS[star.status]; context.globalAlpha = star.status === 'todo' ? 0.45 + Math.abs(Math.sin(time * 0.002 + star.id)) * 0.45 : 0.9; context.beginPath(); context.arc(x, y, star.radius * pulse, 0, Math.PI * 2); context.fill(); if (star.id === hoverStar?.id) { context.globalAlpha = 0.75; context.strokeStyle = '#fff4be'; context.beginPath(); context.moveTo(x - 12, y); context.lineTo(x + 12, y); context.moveTo(x, y - 12); context.lineTo(x, y + 12); context.stroke() } })
      }
      context.globalAlpha = 1; animation = requestAnimationFrame(draw)
    }
    const hitTest = (event: MouseEvent): MapStar | null => { if (background) return null; const rect = canvas.getBoundingClientRect(); const x = (event.clientX - rect.left - rect.width / 2) / rect.width / camera; const y = (event.clientY - rect.top - rect.height / 2) / rect.height / camera; return stars.find((star) => Math.hypot(star.x - x, star.y - y) < 0.025) ?? null }
    const move = (event: MouseEvent): void => setHoverStar(hitTest(event)); const click = (event: MouseEvent): void => { const star = hitTest(event); setSelectedStar(star); if (star) targetCamera = 1.35 }; const leave = (): void => setHoverStar(null)
    canvas.addEventListener('mousemove', move); canvas.addEventListener('click', click); canvas.addEventListener('mouseleave', leave); animation = requestAnimationFrame(draw)
    const observer = new ResizeObserver(resize); observer.observe(canvas)
    return () => { cancelAnimationFrame(animation); observer.disconnect(); canvas.removeEventListener('mousemove', move); canvas.removeEventListener('click', click); canvas.removeEventListener('mouseleave', leave) }
  }, [hoverStar, options.background, options.count])
  return { canvasRef, selectedStar, hoverStar }
}
