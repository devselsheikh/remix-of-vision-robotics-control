// API Service for backend communication

export interface ConnectionConfig {
  streamUrl: string;
  piIp: string;
  backendIp: string;
}

export interface ConnectionResponse {
  status: 'connected' | 'error';
  message?: string;
}

const getBackendUrl = (backendIp: string) => `http://${backendIp}:8000`;

export const api = {
  async connect(config: ConnectionConfig): Promise<ConnectionResponse> {
    const response = await fetch(`${getBackendUrl(config.backendIp)}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stream_url: config.streamUrl,
        pi_ip: config.piIp,
      }),
    });
    return response.json();
  },

  async ping(backendIp: string): Promise<number> {
    const start = performance.now();
    try {
      await fetch(`${getBackendUrl(backendIp)}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000),
      });
      return Math.round(performance.now() - start);
    } catch {
      return -1;
    }
  },

  async moveMotor(backendIp: string, direction: 'forward' | 'backward' | 'left' | 'right' | 'stop'): Promise<void> {
    await fetch(`${getBackendUrl(backendIp)}/move/${direction}`, {
      method: 'POST',
    });
  },

  getVideoStreamUrl(backendIp: string): string {
    return `${getBackendUrl(backendIp)}/video`;
  },
};

export const loadSettings = (): ConnectionConfig => {
  const saved = localStorage.getItem('robotics-settings');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    streamUrl: 'http://192.168.1.100:8080/?action=stream',
    piIp: '10.40.0.1',
    backendIp: '192.168.1.50',
  };
};

export const saveSettings = (config: ConnectionConfig): void => {
  localStorage.setItem('robotics-settings', JSON.stringify(config));
};
