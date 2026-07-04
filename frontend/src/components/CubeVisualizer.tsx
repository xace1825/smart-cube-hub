import { useEffect, useRef } from 'react'
import type { TwistyPlayer } from 'cubing/twisty'
import { Alg } from 'cubing/alg'

interface CubeVisualizerProps {
  alg?: string
  className?: string
}

export function CubeVisualizer({ alg = "", className = "" }: CubeVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<TwistyPlayer | null>(null)

  useEffect(() => {
    let mounted = true
    async function init() {
      if (!containerRef.current) return
      try {
        const mod = await import('cubing/twisty')
        if (!mounted) return
        const player = new mod.TwistyPlayer({
          puzzle: "3x3x3",
          alg: new Alg(alg || undefined),
          controlPanel: "none",
          hintFacelets: "none",
          experimentalStickering: "full",
          background: "none",
        })
        containerRef.current.appendChild(player)
        playerRef.current = player
      } catch (e) {
        console.warn('Twisty visualizer not available', e)
      }
    }
    init()
    return () => {
      mounted = false
      playerRef.current?.remove()
      playerRef.current = null
    }
  }, [alg])

  useEffect(() => {
    if (!playerRef.current) return
    try {
      playerRef.current.alg = new Alg(alg)
    } catch (e) {
      console.warn('Twisty update failed', e)
    }
  }, [alg])

  return <div ref={containerRef} className={className} />
}
