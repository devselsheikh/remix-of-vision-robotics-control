import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Wifi, WifiOff, Activity } from 'lucide-react';

interface VideoFeedProps {
  isConnected: boolean;
}

export const VideoFeed = ({ isConnected }: VideoFeedProps) => {
  const [latency, setLatency] = useState<number>(-1);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setLatency(-1);
      return;
    }

    const pingInterval = setInterval(async () => {
      const ping = await api.ping();
      setLatency(ping);
    }, 2000);

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  const getLatencyColor = () => {
    if (latency < 0) return 'text-destructive';
    if (latency < 50) return 'text-success';
    if (latency < 150) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card-header">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-success" />
            ) : (
              <WifiOff className="w-4 h-4 text-destructive" />
            )}
            <span className="font-mono text-sm">
              {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          {isConnected && (
            <div className={`flex items-center gap-1.5 ${getLatencyColor()}`}>
              <Activity className="w-3 h-3" />
              <span className="font-mono text-xs">
                {latency > 0 ? `${latency}ms` : 'N/A'}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse-glow' : 'bg-destructive'}`} />
          <span className="font-mono text-xs text-muted-foreground">LIVE</span>
        </div>
      </div>
      
      <div className="relative aspect-video bg-background flex items-center justify-center">
        {isConnected && !imageError ? (
          <img
            src={api.getVideoStreamUrl()}
            alt="DOBI Detection Stream"
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <div className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
              <WifiOff className="w-10 h-10" />
            </div>
            <div className="text-center">
              <p className="font-mono text-sm">NO VIDEO SIGNAL</p>
              <p className="text-xs mt-1">Connect to backend to view stream</p>
            </div>
          </div>
        )}
        
        {/* Scanlines overlay for industrial look */}
        <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-10" />
      </div>
    </div>
  );
};
