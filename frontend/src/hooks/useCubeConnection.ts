import { useState, useCallback, useEffect } from 'react'
import { connectSmartCube, type SmartCubeEvent, type MacAddressProvider } from 'smartcube-web-bluetooth'
import { useCubeStore } from '../store/cubeStore'

const MAC_CACHE_PREFIX = 'sch-mac:'

function getCachedMac(device: BluetoothDevice): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    return localStorage.getItem(MAC_CACHE_PREFIX + device.id) || localStorage.getItem(MAC_CACHE_PREFIX + (device.name || ''))
  } catch {
    return null
  }
}

function setCachedMac(device: BluetoothDevice, mac: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(MAC_CACHE_PREFIX + device.id, mac)
    if (device.name) localStorage.setItem(MAC_CACHE_PREFIX + device.name, mac)
  } catch {
    /* ignore */
  }
}

function normalizeMac(mac: string): string {
  return mac
    .toUpperCase()
    .replace(/[^0-9A-F]/g, '')
    .replace(/(.{2})(?=.)/g, '$1:')
}

export function useCubeConnection() {
  const { connection, setConnection, setStatus, addEvent, reset } = useCubeStore()
  const [error, setError] = useState<string | null>(null)
  const [pendingMacDevice, setPendingMacDevice] = useState<BluetoothDevice | null>(null)

  const macProvider: MacAddressProvider = useCallback(async (device, isFallback) => {
    const cached = getCachedMac(device)
    if (cached) return cached
    if (!isFallback) return null
    setPendingMacDevice(device)
    return new Promise<string | null>((resolve) => {
      const handler = (e: Event) => {
        const detail = (e as CustomEvent<string | null>).detail
        window.removeEventListener('sch-mac-provided', handler)
        if (detail) {
          setCachedMac(device, detail)
        }
        setPendingMacDevice(null)
        resolve(detail)
      }
      window.addEventListener('sch-mac-provided', handler)
    })
  }, [])

  const connect = useCallback(async () => {
    setStatus('connecting')
    setError(null)
    try {
      const conn = await connectSmartCube({
        macAddressProvider: macProvider,
        onStatus: (msg) => setStatus(msg.toLowerCase().includes('error') ? 'error' : 'connecting'),
      })
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
  }, [setConnection, setStatus, addEvent, macProvider])

  const provideMac = useCallback((mac: string | null) => {
    if (pendingMacDevice) {
      const event = new CustomEvent<string | null>('sch-mac-provided', { detail: mac ? normalizeMac(mac) : null })
      window.dispatchEvent(event)
    }
  }, [pendingMacDevice])

  const disconnect = useCallback(() => {
    connection?.disconnect()
    reset()
  }, [connection, reset])

  useEffect(() => {
    return () => {
      connection?.disconnect()
    }
  }, [connection])

  return { status: useCubeStore((s) => s.status), connect, disconnect, error, pendingMacDevice, provideMac }
}
