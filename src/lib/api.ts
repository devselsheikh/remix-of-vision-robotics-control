// API Service for backend communication

export interface ConnectionConfig {
  streamUrl: string;
  piIp: string;
}

export interface ConnectionResponse {
  status: 'connected' | 'error';
  message?: string;
}

// Backend runs on localhost:8000
const BACKEND_URL = 'http://localhost:8000';

export const api = {
  async connect(config: ConnectionConfig): Promise<ConnectionResponse> {
    const response = await fetch(`${BACKEND_URL}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stream_url: config.streamUrl,
        pi_ip: config.piIp,
      }),
    });
    return response.json();
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
