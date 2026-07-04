import { useCallback, useEffect, useRef, useState } from 'react'

export type SolvePhase = 'scramble' | 'inspection' | 'solving' | 'done'

const FACES = ['R', 'L', 'U', 'D', 'F', 'B']
const MODS = ['', "'", '2']

function generate333Scramble(length = 20): string {
  const moves: string[] = []
  for (let i = 0; i < length; i++) {
    let face = FACES[Math.floor(Math.random() * FACES.length)]
    // avoid same face consecutive (basic WCA-style)
    while (i > 0 && moves[i - 1].startsWith(face)) {
      face = FACES[Math.floor(Math.random() * FACES.length)]
    }
    moves.push(face + MODS[Math.floor(Math.random() * MODS.length)])
  }
  return moves.join(' ')
}

export interface SolveRecord {
  id: string
  scramble: string
  inspectionMs: number
  solveMs: number
  penalty: 'ok' | '+2' | 'dnf'
  createdAt: number
}

export type AutoTimerMode = 'off' | 'cube' | 'inspection-cube'

const INSPECTION_MS = 15_000
const INSPECTION_WARNING_1_MS = 8_000
const INSPECTION_WARNING_2_MS = 12_000

function formatMs(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const centis = Math.floor((ms % 1000) / 10)
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
}

export function useSolveTimer() {
  const [phase, setPhase] = useState<SolvePhase>('scramble')
  const [scrambleAlg, setScrambleAlg] = useState<string>('')
  const [inspectionRemaining, setInspectionRemaining] = useState<number>(INSPECTION_MS)
  const [solveElapsed, setSolveElapsed] = useState<number>(0)
  const [history, setHistory] = useState<SolveRecord[]>([])
  const [penalty, setPenalty] = useState<'ok' | '+2' | 'dnf'>('ok')
  const [autoTimerMode, setAutoTimerMode] = useState<AutoTimerMode>('cube')

  const rafRef = useRef<number | null>(null)
  const phaseStartRef = useRef<number>(0)
  const phaseRef = useRef<SolvePhase>('scramble')
  const moveDuringInspectionRef = useRef(false)
  const inspectionExcessMsRef = useRef(0)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const cancelTick = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const generateScramble = useCallback(() => {
    setScrambleAlg(generate333Scramble())
  }, [])

  const nextScramble = useCallback(() => {
    cancelTick()
    setPhase('scramble')
    setInspectionRemaining(INSPECTION_MS)
    setSolveElapsed(0)
    setPenalty('ok')
    generateScramble()
  }, [cancelTick, generateScramble])

  const startInspection = useCallback(() => {
    if (phaseRef.current !== 'scramble' && phaseRef.current !== 'done') return
    cancelTick()
    moveDuringInspectionRef.current = false
    inspectionExcessMsRef.current = 0
    phaseStartRef.current = performance.now()
    setPhase('inspection')
    setInspectionRemaining(INSPECTION_MS)
  }, [cancelTick])

  const startSolve = useCallback((triggerAt?: number) => {
    if (phaseRef.current !== 'inspection') return
    cancelTick()
    phaseStartRef.current = triggerAt ?? performance.now()
    setPhase('solving')
    setSolveElapsed(0)
  }, [cancelTick])

  const stopSolve = useCallback(() => {
    if (phaseRef.current === 'inspection') {
      cancelTick()
      setPhase('done')
      const record: SolveRecord = {
        id: crypto.randomUUID?.() || String(Date.now()),
        scramble: scrambleAlg,
        inspectionMs: Math.round(performance.now() - phaseStartRef.current),
        solveMs: 0,
        penalty: 'dnf',
        createdAt: Date.now(),
      }
      setHistory((prev) => [record, ...prev].slice(0, 1000))
      return
    }
    if (phaseRef.current !== 'solving') return
    cancelTick()
    const finalSolveMs = Math.max(0, Math.round(performance.now() - phaseStartRef.current))
    setSolveElapsed(finalSolveMs)
    setPhase('done')

    const record: SolveRecord = {
      id: crypto.randomUUID?.() || String(Date.now()),
      scramble: scrambleAlg,
      inspectionMs: INSPECTION_MS,
      solveMs: finalSolveMs,
      penalty: 'ok',
      createdAt: Date.now(),
    }
    setHistory((prev) => [record, ...prev].slice(0, 1000))
  }, [cancelTick, scrambleAlg])

  const tick = useCallback(() => {
    const now = performance.now()
    if (phaseRef.current === 'inspection') {
      const elapsed = Math.round(now - phaseStartRef.current)
      const remaining = Math.max(0, INSPECTION_MS - elapsed)
      setInspectionRemaining(remaining)
      if (elapsed >= INSPECTION_MS) {
        // Only auto-start solve at end of inspection if no cube move started it earlier.
        // In cube mode the move handler already started solve with the actual move timestamp.
        if (!moveDuringInspectionRef.current) {
          startSolve()
        }
        return
      }
    } else if (phaseRef.current === 'solving') {
      const elapsed = Math.round(now - phaseStartRef.current)
      setSolveElapsed(elapsed)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [startSolve])

  // Cube auto-timer: first MOVE during inspection starts the solve at that timestamp.
  // FACELETS event triggers stop when cube is solved.
  const isSolvedFacelet = useCallback((facelets: string): boolean => {
    if (facelets.length !== 54) return false
    const faces = [
      facelets.slice(0, 9),
      facelets.slice(9, 18),
      facelets.slice(18, 27),
      facelets.slice(27, 36),
      facelets.slice(36, 45),
      facelets.slice(45, 54),
    ]
    return faces.every((f) => new Set(f).size === 1)
  }, [])

  const handleCubeEvent = useCallback((event: { type: string; facelets?: string; move?: string; timestamp?: number }) => {
    if (autoTimerMode === 'off') return

    if (phaseRef.current === 'inspection') {
      if (event.type === 'MOVE' && event.move) {
        moveDuringInspectionRef.current = true
        const now = performance.now()
        const inspectionElapsed = now - phaseStartRef.current
        if (inspectionElapsed > INSPECTION_MS) {
          inspectionExcessMsRef.current = inspectionElapsed - INSPECTION_MS
          // WCA: late start incurs +2 penalty
          setPenalty('+2')
        }
        startSolve(now)
      }
    }

    if (phaseRef.current === 'solving' && event.type === 'FACELETS' && event.facelets) {
      if (isSolvedFacelet(event.facelets)) {
        stopSolve()
      }
    }
  }, [autoTimerMode, startSolve, stopSolve, isSolvedFacelet])

  const stopSolveWithPenalty = useCallback((manualPenalty: 'ok' | '+2' | 'dnf') => {
    if (phaseRef.current === 'solving' || phaseRef.current === 'inspection') {
      if (phaseRef.current === 'inspection') {
        cancelTick()
        setPhase('done')
        const record: SolveRecord = {
          id: crypto.randomUUID?.() || String(Date.now()),
          scramble: scrambleAlg,
          inspectionMs: Math.round(performance.now() - phaseStartRef.current),
          solveMs: 0,
          penalty: manualPenalty,
          createdAt: Date.now(),
        }
        setHistory((prev) => [record, ...prev].slice(0, 1000))
        setPenalty(manualPenalty)
        return
      }
      cancelTick()
      const finalSolveMs = Math.max(0, Math.round(performance.now() - phaseStartRef.current))
      setSolveElapsed(finalSolveMs)
      setPhase('done')
      const record: SolveRecord = {
        id: crypto.randomUUID?.() || String(Date.now()),
        scramble: scrambleAlg,
        inspectionMs: INSPECTION_MS,
        solveMs: finalSolveMs,
        penalty: manualPenalty,
        createdAt: Date.now(),
      }
      setHistory((prev) => [record, ...prev].slice(0, 1000))
      setPenalty(manualPenalty)
    }
  }, [cancelTick, scrambleAlg])

  useEffect(() => {
    if (phase === 'inspection' || phase === 'solving') {
      phaseStartRef.current = performance.now() - (phase === 'solving' ? solveElapsed : INSPECTION_MS - inspectionRemaining)
      rafRef.current = requestAnimationFrame(tick)
    } else {
      cancelTick()
    }
    return () => cancelTick()
  }, [phase, tick, cancelTick, inspectionRemaining, solveElapsed])

  // Sounds for inspection warnings (optional, lightweight beep)
  useEffect(() => {
    if (phase !== 'inspection') return
    const timeouts: number[] = []
    const beep = () => {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (!AudioCtx) return
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start()
        osc.stop(ctx.currentTime + 0.15)
      } catch {
        // ignore audio errors
      }
    }

    const schedule = (delay: number) => {
      timeouts.push(window.setTimeout(() => {
        if (phaseRef.current === 'inspection') beep()
      }, delay))
    }

    schedule(INSPECTION_MS - INSPECTION_WARNING_1_MS)
    schedule(INSPECTION_MS - INSPECTION_WARNING_2_MS)
    schedule(INSPECTION_MS)

    return () => timeouts.forEach((id) => clearTimeout(id))
  }, [phase])

  const applyPlusTwo = useCallback(() => {
    const next = penalty === 'dnf' ? '+2' : penalty === '+2' ? 'ok' : '+2'
    setPenalty(next)
    setHistory((prev) => {
      if (prev.length === 0) return prev
      const [latest, ...rest] = prev
      return [{ ...latest, penalty: next }, ...rest]
    })
  }, [penalty])

  const applyDnf = useCallback(() => {
    const next = penalty === 'dnf' ? 'ok' : 'dnf'
    setPenalty(next)
    setHistory((prev) => {
      if (prev.length === 0) return prev
      const [latest, ...rest] = prev
      return [{ ...latest, penalty: next }, ...rest]
    })
  }, [penalty])

  const getFinalDisplayTime = useCallback((record: SolveRecord) => {
    if (record.penalty === 'dnf') return 'DNF'
    const total = record.solveMs + (record.penalty === '+2' ? 2_000 : 0)
    return formatMs(total)
  }, [])

  const formattedSolveTime = formatMs(solveElapsed + (penalty === '+2' ? 2_000 : 0)) + (penalty === 'dnf' ? ' DNF' : '')
  const formattedInspection = formatMs(inspectionRemaining)

  return {
    phase,
    scrambleAlg,
    inspectionRemaining,
    solveElapsed,
    formattedSolveTime,
    formattedInspection,
    formattedFullTime: formatMs,
    history,
    penalty,
    autoTimerMode,
    setAutoTimerMode,
    nextScramble,
    startInspection,
    startSolve,
    stopSolve,
    stopSolveWithPenalty,
    handleCubeEvent,
    applyPlusTwo,
    applyDnf,
    getFinalDisplayTime,
  }
}
