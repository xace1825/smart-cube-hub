/**
 * Общие типы данных Smart Cube Hub.
 * Используются на фронтенде и сервере.
 */

export type CubeBrand = 'gan' | 'giiker' | 'gocube' | 'moyu' | 'qiyi' | 'unknown';

export type FaceColor = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

export type Move = {
  face: FaceColor;
  direction: 1 | -1 | 2; // clockwise, counter-clockwise, double
  timestamp: number; // host time in ms
  cubeTimestamp?: number; // optional cube internal clock
};

export type CubeState = {
  corners: number[];
  edges: number[];
  centers: number[];
};

export type CubeEvent = {
  type: 'move' | 'orientation' | 'battery' | 'disconnect';
  data: Move | CubeOrientation | number | null;
  receivedAt: number;
};

export type CubeOrientation = {
  x: number;
  y: number;
  z: number;
};

export type CubeDevice = {
  deviceId: string;
  name: string;
  brand: CubeBrand;
  connected: boolean;
  batteryLevel?: number;
};

export type User = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
};

export type SolveSession = {
  id: string;
  userId: string;
  deviceId: string;
  startedAt: string;
  finishedAt?: string;
  scramble?: string;
  moves: Move[];
  inspectionTimeMs?: number;
  solveTimeMs?: number;
  penalty?: 'none' | '+2' | 'dnf';
};

export type SolveSummary = {
  id: string;
  startedAt: string;
  solveTimeMs?: number;
  moveCount: number;
  tps?: number;
};

export type ApiError = {
  error: string;
  detail?: string;
};
