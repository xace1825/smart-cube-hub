import { useEffect, useRef } from 'react'
import { TwistyPlayer } from 'cubing/twisty'
import { Alg } from 'cubing/alg'

interface CubeVisualizerProps {
  alg?: string
  className?: string
}

export function CubeVisualizer({ alg = "", className = "" }: CubeVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<TwistyPlayer | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const player = new TwistyPlayer({
      puzzle: "3x3x3",
      alg: new Alg(alg || undefined),
      controlPanel: "none",
      hintFacelets: "none",
      experimentalStickering: "full",
      background: "none",
    })
    containerRef.current.appendChild(player)
    playerRef.current = player

    return () => {
      playerRef.current?.remove()
      playerRef.current = null
    }
  }, [alg])

  useEffect(() => {
    if (!playerRef.current) return
    playerRef.current.alg = new Alg(alg)
  }, [alg])

  return <div ref={containerRef} className={className} />
}
