
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface TerminalLine {
  type: 'info' | 'error' | 'output' | 'system';
  content: string;
  timestamp: number;
}

export enum CodeStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED'
}

export type Language = 'javascript' | 'python';
