import { create } from 'zustand'
import { type SmartCubeConnection, type SmartCubeEvent } from 'smartcube-web-bluetooth'

export type CubeConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error'

interface CubeStore {
  connection: SmartCubeConnection | null
  status: CubeConnectionStatus
  events: SmartCubeEvent[]
  moves: string[]
  setConnection: (conn: SmartCubeConnection | null) => void
  setStatus: (status: CubeConnectionStatus) => void
  addEvent: (event: SmartCubeEvent) => void
  reset: () => void
}

export const useCubeStore = create<CubeStore>((set, get) => ({
  connection: null,
  status: 'idle',
  events: [],
  moves: [],
  setConnection: (connection) => set({ connection }),
  setStatus: (status) => set({ status }),
  addEvent: (event) => {
    const events = [...get().events.slice(-199), event]
    const moves = [...get().moves]
    if (event.type === 'MOVE') {
      moves.push(event.move)
    }
    set({ events, moves })
  },
  reset: () => set({ connection: null, status: 'idle', events: [], moves: [] }),
}))
