import { useState, useCallback, useEffect } from 'react'
import { connectSmartCube, type SmartCubeEvent } from 'smartcube-web-bluetooth'
import { useCubeStore } from '../store/cubeStore'

export function useCubeConnection() {
  const { connection, setConnection, setStatus, addEvent, reset } = useCubeStore()
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    setStatus('connecting')
    setError(null)
    try {
      const conn = await connectSmartCube()
      setConnection(conn)
      setStatus('connected')
      conn.events$.subscribe((event: SmartCubeEvent) => {
        addEvent(event)
      })
    } catch (e) {
      console.error(e)
      setStatus('error')
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [setConnection, setStatus, addEvent])

  const disconnect = useCallback(() => {
    connection?.disconnect()
    reset()
  }, [connection, reset])

  useEffect(() => {
    return () => {
      connection?.disconnect()
    }
  }, [connection])

  return { status: useCubeStore((s) => s.status), connect, disconnect, error }
}
