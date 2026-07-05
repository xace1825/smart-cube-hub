// Minimal 3x3x3 cubie model for facelet prediction and comparison.
// Uses the same facelet/cubie conventions as cubejs and smartcube-web-bluetooth:
// Faces: U(0-8), R(9-17), F(18-26), D(27-35), L(36-44), B(45-53)
// Corners: [URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB]
// Edges:   [UR, UF, UL, UB, DR, DF, DL, DB, FR, FL, BL, BR]

const SOLVED_FACELETS = 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB'

const cornerFacelet = [
  [8, 9, 20],   // URF
  [6, 18, 38],  // UFL
  [0, 36, 47],  // ULB
  [2, 45, 11],  // UBR
  [29, 26, 15], // DFR
  [27, 44, 24], // DLF
  [33, 53, 42], // DBL
  [35, 17, 51], // DRB
]

const edgeFacelet = [
  [5, 10],  // UR
  [7, 19],  // UF
  [3, 37],  // UL
  [1, 46],  // UB
  [32, 16], // DR
  [28, 25], // DF
  [30, 43], // DL
  [34, 52], // DB
  [23, 12], // FR
  [21, 41], // FL
  [50, 39], // BL
  [48, 14], // BR
]

interface CubieState {
  cp: number[] // corner permutation (which solved corner occupies slot i)
  co: number[] // corner orientation
  ep: number[] // edge permutation
  eo: number[] // edge orientation
}

const solvedState: CubieState = {
  cp: [0, 1, 2, 3, 4, 5, 6, 7],
  co: [0, 0, 0, 0, 0, 0, 0, 0],
  ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
}

const cornerNames = ['URF', 'UFL', 'ULB', 'UBR', 'DFR', 'DLF', 'DBL', 'DRB']
const edgeNames = ['UR', 'UF', 'UL', 'UB', 'DR', 'DF', 'DL', 'DB', 'FR', 'FL', 'BL', 'BR']

const nameToCorner = Object.fromEntries(cornerNames.map((n, i) => [n, i]))
const nameToEdge = Object.fromEntries(edgeNames.map((n, i) => [n, i]))

// Move tables from cubejs (U, R, F, D, L, B clockwise)
const moveTables: Record<string, CubieState> = {
  U: {
    cp: [nameToCorner.UBR, nameToCorner.URF, nameToCorner.UFL, nameToCorner.ULB, nameToCorner.DFR, nameToCorner.DLF, nameToCorner.DBL, nameToCorner.DRB],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [nameToEdge.UB, nameToEdge.UR, nameToEdge.UF, nameToEdge.UL, nameToEdge.DR, nameToEdge.DF, nameToEdge.DL, nameToEdge.DB, nameToEdge.FR, nameToEdge.FL, nameToEdge.BL, nameToEdge.BR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  R: {
    cp: [nameToCorner.DFR, nameToCorner.UFL, nameToCorner.ULB, nameToCorner.URF, nameToCorner.DRB, nameToCorner.DLF, nameToCorner.DBL, nameToCorner.UBR],
    co: [2, 0, 0, 1, 1, 0, 0, 2],
    ep: [nameToEdge.FR, nameToEdge.UF, nameToEdge.UL, nameToEdge.UB, nameToEdge.BR, nameToEdge.DF, nameToEdge.DL, nameToEdge.DB, nameToEdge.DR, nameToEdge.FL, nameToEdge.BL, nameToEdge.UR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  F: {
    cp: [nameToCorner.UFL, nameToCorner.DLF, nameToCorner.ULB, nameToCorner.UBR, nameToCorner.URF, nameToCorner.DFR, nameToCorner.DBL, nameToCorner.DRB],
    co: [1, 2, 0, 0, 2, 1, 0, 0],
    ep: [nameToEdge.UR, nameToEdge.FL, nameToEdge.UL, nameToEdge.UB, nameToEdge.DR, nameToEdge.FR, nameToEdge.DL, nameToEdge.DB, nameToEdge.UF, nameToEdge.DF, nameToEdge.BL, nameToEdge.BR],
    eo: [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0],
  },
  D: {
    cp: [nameToCorner.URF, nameToCorner.UFL, nameToCorner.ULB, nameToCorner.UBR, nameToCorner.DLF, nameToCorner.DBL, nameToCorner.DRB, nameToCorner.DFR],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [nameToEdge.UR, nameToEdge.UF, nameToEdge.UL, nameToEdge.UB, nameToEdge.DF, nameToEdge.DL, nameToEdge.DB, nameToEdge.DR, nameToEdge.FR, nameToEdge.FL, nameToEdge.BL, nameToEdge.BR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  L: {
    cp: [nameToCorner.URF, nameToCorner.ULB, nameToCorner.DBL, nameToCorner.UBR, nameToCorner.DFR, nameToCorner.UFL, nameToCorner.DLF, nameToCorner.DRB],
    co: [0, 1, 2, 0, 0, 2, 1, 0],
    ep: [nameToEdge.UR, nameToEdge.UF, nameToEdge.BL, nameToEdge.UB, nameToEdge.DR, nameToEdge.DF, nameToEdge.FL, nameToEdge.DB, nameToEdge.FR, nameToEdge.UL, nameToEdge.DL, nameToEdge.BR],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  B: {
    cp: [nameToCorner.URF, nameToCorner.UFL, nameToCorner.UBR, nameToCorner.DRB, nameToCorner.DFR, nameToCorner.DLF, nameToCorner.ULB, nameToCorner.DBL],
    co: [0, 0, 1, 2, 0, 0, 2, 1],
    ep: [nameToEdge.UR, nameToEdge.UF, nameToEdge.UL, nameToEdge.BR, nameToEdge.DR, nameToEdge.DF, nameToEdge.DL, nameToEdge.BL, nameToEdge.FR, nameToEdge.FL, nameToEdge.UB, nameToEdge.DB],
    eo: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1],
  },
}

function cloneState(state: CubieState): CubieState {
  return {
    cp: state.cp.slice(),
    co: state.co.slice(),
    ep: state.ep.slice(),
    eo: state.eo.slice(),
  }
}

function compose(a: CubieState, b: CubieState): CubieState {
  // Apply b then a? In cubejs this.cornerMultiply(other): newCp[to] = this.cp[other.cp[to]], newCo[to]=(this.co[other.cp[to]] + other.co[to]) % 3
  // Here we want result = a * b, meaning applying b then a to solved cube.
  const cp = new Array(8)
  const co = new Array(8)
  const ep = new Array(12)
  const eo = new Array(12)
  for (let i = 0; i < 8; i++) {
    cp[i] = a.cp[b.cp[i]]
    co[i] = (a.co[b.cp[i]] + b.co[i]) % 3
  }
  for (let i = 0; i < 12; i++) {
    ep[i] = a.ep[b.ep[i]]
    eo[i] = a.eo[b.ep[i]] ^ b.eo[i]
  }
  return { cp, co, ep, eo }
}

export function applyMove(state: CubieState, move: string): CubieState {
  const face = move.charAt(0) as keyof typeof moveTables
  const mod = move.slice(1)
  let table = moveTables[face]
  if (!table) return cloneState(state)
  if (mod === "'") {
    // Inverse: apply move three times (or derive inverse table)
    let result = state
    result = compose(state, table)
    result = compose(result, table)
    result = compose(result, table)
    return result
  }
  if (mod === '2') {
    const once = compose(state, table)
    return compose(once, table)
  }
  return compose(state, table)
}

export function applyAlgorithm(state: CubieState, alg: string): CubieState {
  const moves = alg.trim().split(/\s+/).filter(Boolean)
  return moves.reduce((s, m) => applyMove(s, m), state)
}

export function getSolvedState(): CubieState {
  return cloneState(solvedState)
}

export function toFaceletString(state: CubieState): string {
  const facelets = SOLVED_FACELETS.split('')
  // Place corner stickers
  for (let slot = 0; slot < 8; slot++) {
    const cubie = state.cp[slot]
    const ori = state.co[slot]
    const solvedSlots = cornerFacelet[cubie]
    const targetSlots = cornerFacelet[slot]
    for (let n = 0; n < 3; n++) {
      const from = solvedSlots[n]
      const to = targetSlots[(n + ori) % 3]
      facelets[to] = SOLVED_FACELETS[from]
    }
  }
  // Place edge stickers
  for (let slot = 0; slot < 12; slot++) {
    const cubie = state.ep[slot]
    const ori = state.eo[slot]
    const solvedSlots = edgeFacelet[cubie]
    const targetSlots = edgeFacelet[slot]
    for (let n = 0; n < 2; n++) {
      const from = solvedSlots[n]
      const to = targetSlots[(n + ori) % 2]
      facelets[to] = SOLVED_FACELETS[from]
    }
  }
  return facelets.join('')
}

export function faceletsFromScramble(alg: string): string {
  const state = applyAlgorithm(solvedState, alg)
  return toFaceletString(state)
}

export function isFaceletMatch(a: string, b: string): boolean {
  return a.length === 54 && b.length === 54 && a === b
}
