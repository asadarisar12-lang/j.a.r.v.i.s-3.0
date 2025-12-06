export interface AudioConfig {
  sampleRate: number;
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface VisualizerData {
  inputVolume: number;
  outputVolume: number;
}

export interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning';
}