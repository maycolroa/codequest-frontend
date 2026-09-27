export interface IdleBudget {
  timeRemaining: () => number
  didTimeout: boolean
}

// Sin timeout, el loop de render podría no dejar nunca un periodo idle en un dispositivo lento
export const IDLE_TIMEOUT_MS = 500
export const FALLBACK_DELAY_MS = 1
export const FALLBACK_BUDGET_MS = 40

// requestIdleCallback con timeout, o setTimeout con deadline sintético. Devuelve la función de cancelación.
export function scheduleIdle(task: (budget: IdleBudget) => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(
      (deadline) => task({ timeRemaining: () => deadline.timeRemaining(), didTimeout: deadline.didTimeout }),
      { timeout: IDLE_TIMEOUT_MS },
    )
    return () => window.cancelIdleCallback(handle)
  }

  // Fallback (Safari): el deadline de 40 ms empieza a contar cuando arranca el callback
  const handle = window.setTimeout(() => {
    const end = performance.now() + FALLBACK_BUDGET_MS
    task({ timeRemaining: () => Math.max(0, end - performance.now()), didTimeout: false })
  }, FALLBACK_DELAY_MS)
  return () => window.clearTimeout(handle)
}
