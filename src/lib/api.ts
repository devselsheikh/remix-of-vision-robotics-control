// API Service for backend communication

export interface ConnectionConfig {
  streamUrl: string;
  piIp: string;
}

export interface ConnectionResponse {
  status: 'connected' | 'error';
  message?: string;
}

export interface Detection {
  name: string;
  raw_name: string;
  conf: number;
  box: number[];
  severity: string;
  ppe_status?: string;
}

export interface DetectionsResponse {
  timestamp: number;
  count: number;
  detections: Detection[];
  connected?: boolean;
}

export interface HealthResponse {
  status: string;
  connected: boolean;
  stream_url?: string;
  pi_ip?: string;
  frame_count?: number;
  last_error?: string;
}

// Backend runs on localhost:8000
const BACKEND_URL = 'http://localhost:8000';

export const api = {
  async connect(config: ConnectionConfig): Promise<ConnectionResponse> {
    try {
      const response = await fetch(`${BACKEND_URL}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream_url: config.streamUrl,
          pi_ip: config.piIp,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { status: 'error', message: data.message || 'Connection failed' };
      }
      
      return { status: 'connected', message: data.message };
    } catch (error) {
      return { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Backend not reachable. Is the server running?'
      };
    }
  },

  async disconnect(): Promise<void> {
    try {
      await fetch(`${BACKEND_URL}/disconnect`);
    } catch {
      // Ignore disconnect errors
    }
  },

  async ping(): Promise<number> {
    const start = performance.now();
    try {
      await fetch(`${BACKEND_URL}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      return Math.round(performance.now() - start);
    } catch {
      return -1;
    }
  },

  async getHealth(): Promise<HealthResponse | null> {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      return response.json();
    } catch {
      return null;
    }
  },

  async getDetections(): Promise<DetectionsResponse> {
    const response = await fetch(`${BACKEND_URL}/detections`);
    return response.json();
  },

  async testPiConnection(): Promise<{ status: string; message?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/pi/test`);
      return response.json();
    } catch {
      return { status: 'error', message: 'Backend not reachable' };
    }
  },

  async moveMotor(direction: 'forward' | 'backward' | 'left' | 'right' | 'stop'): Promise<void> {
    await fetch(`${BACKEND_URL}/move/${direction}`, {
      method: 'POST',
    });
  },

  getVideoStreamUrl(): string {
    return `${BACKEND_URL}/video`;
  },
};

export const loadSettings = (): ConnectionConfig => {
  const saved = localStorage.getItem('dobi-settings');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    streamUrl: 'http://10.40.58.225:8080/?action=stream',
    piIp: '10.40.58.225',
  };
};

export const saveSettings = (config: ConnectionConfig): void => {
  localStorage.setItem('dobi-settings', JSON.stringify(config));
};
