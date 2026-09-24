import { useCallback, useEffect, useRef, useState } from 'react'

interface WarpParticle {
  x: number
  y: number
  z: number
  blue: boolean
  size: number
}

/** Canvas implementation of the depth-projected warp streaks used by the UI mockup. */
export function useGalaxyWarp(): React.RefCallback<HTMLCanvasElement> {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [canvasMounted, setCanvasMounted] = useState(false)
  const attachCanvas = useCallback((element: HTMLCanvasElement | null): void => {
    canvasRef.current = element
    setCanvasMounted(element !== null)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const particleCount = reducedMotion ? 120 : 320
    const speedScale = reducedMotion ? 0.4 : 1
    const particles: WarpParticle[] = []
    let width = 0
    let height = 0
    let pixelRatio = 1
    let frameId = 0

    const resize = (): void => {
      const bounds = canvas.getBoundingClientRect()
      width = bounds.width
      height = bounds.height
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      particles.length = 0
      for (let index = 0; index < particleCount; index += 1) {
        const z = Math.random() * width
        particles.push({
          x: (Math.random() - 0.5) * width,
          y: (Math.random() - 0.5) * height,
          z,
          blue: Math.random() > 0.7,
          size: 0.65 + Math.random() * 0.7,
        })
      }
      context.clearRect(0, 0, width, height)
    }

    const draw = (): void => {
      const centerX = width / 2
      const centerY = height / 2
      const depth = width
      // A quick fade keeps a tiny depth trail (a few frames) without leaving permanent rays.
      context.fillStyle = 'rgba(5,8,20,.34)'
      context.fillRect(0, 0, width, height)

      particles.forEach((particle) => {
        const speed = (4 + (1 - particle.z / depth) * 14) * speedScale
        particle.z -= speed
        if (particle.z < 1) {
          particle.x = (Math.random() - 0.5) * width
          particle.y = (Math.random() - 0.5) * height
          particle.z = depth
        }

        const x = (particle.x / particle.z) * depth + centerX
        const y = (particle.y / particle.z) * depth + centerY
        const trailStartZ = Math.min(depth, particle.z + speed * 2.5)
        const previousX = (particle.x / trailStartZ) * depth + centerX
        const previousY = (particle.y / trailStartZ) * depth + centerY
        const brightness = 1 - particle.z / depth

        const opacity = Math.min(0.62, 0.12 + brightness * 0.58)
        context.strokeStyle = particle.blue
          ? `rgba(186,230,253,${opacity.toFixed(3)})`
          : `rgba(255,255,255,${opacity.toFixed(3)})`
        context.shadowColor = particle.blue ? 'rgba(125,211,252,.65)' : 'rgba(255,255,255,.5)'
        context.shadowBlur = 0.35 + brightness * 1.25
        context.lineWidth = Math.max(0.32, brightness * 0.42 * particle.size)
        context.beginPath()
        context.moveTo(previousX, previousY)
        context.lineTo(x, y)
        context.stroke()
      })

      context.shadowBlur = 0

      frameId = requestAnimationFrame(draw)
    }

    resize()
    frameId = requestAnimationFrame(draw)
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [canvasMounted])

  return attachCanvas
}
