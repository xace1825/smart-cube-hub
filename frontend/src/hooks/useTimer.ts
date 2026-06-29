import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer() {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  const tick = useCallback(() => {
    if (startRef.current) {
      setElapsed(Date.now() - startRef.current)
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [])

  const start = useCallback(() => {
    startRef.current = Date.now()
    setRunning(true)
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setRunning(false)
    startRef.current = null
  }, [])

  const reset = useCallback(() => {
    stop()
    setElapsed(0)
  }, [stop])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return { elapsed, running, start, stop, reset }
}
