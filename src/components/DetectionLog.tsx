import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Clock, Shield, ShieldAlert, ShieldCheck, Flame, Wind } from 'lucide-react';
import { api, Detection } from '@/lib/api';

interface DetectionLogProps {
  isConnected: boolean;
}

export const DetectionLog = ({ isConnected }: DetectionLogProps) => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isConnected) {
      setDetections([]);
      setLastUpdate(null);
      return;
    }

    const fetchDetections = async () => {
      try {
        const data = await api.getDetections();
        setDetections(data.detections);
        setLastUpdate(new Date(data.timestamp * 1000));
      } catch (error) {
        console.error('Failed to fetch detections:', error);
      }
    };

    // Initial fetch
    fetchDetections();

    // Poll every 500ms for real-time updates
    const interval = setInterval(fetchDetections, 500);

    return () => clearInterval(interval);
  }, [isConnected]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getDetectionIcon = (detection: Detection) => {
    if (detection.name === 'FIRE') return <Flame className="w-3 h-3 text-destructive" />;
    if (detection.name === 'SMOKE') return <Wind className="w-3 h-3 text-warning" />;
    if (detection.raw_name === 'person') {
      if (detection.ppe_status === 'FULLY_PROTECTED') return <ShieldCheck className="w-3 h-3 text-success" />;
      if (detection.ppe_status === 'SAFE') return <Shield className="w-3 h-3 text-success" />;
      return <ShieldAlert className="w-3 h-3 text-destructive" />;
    }
    return <Eye className="w-3 h-3 text-primary" />;
  };

  const getStatusColor = (detection: Detection) => {
    if (detection.name === 'FIRE' || detection.name === 'SMOKE') return 'text-destructive';
    if (detection.raw_name === 'person') {
      if (detection.ppe_status === 'FULLY_PROTECTED' || detection.ppe_status === 'SAFE') {
        return 'text-success';
      }
      return 'text-destructive';
    }
    return 'text-primary';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card-header">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <h3 className="font-mono text-sm font-semibold">DETECTION LOG</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">
            {detections.length} objects
          </span>
          {isConnected && (
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          )}
        </div>
      </div>
      
      <ScrollArea className="h-48">
        <div className="p-3 space-y-1">
          {!isConnected ? (
            <div className="flex items-center gap-3 text-xs font-mono py-2 px-2 text-warning">
              <Clock className="w-3 h-3" />
              <span>Waiting for backend connection…</span>
            </div>
          ) : detections.length === 0 ? (
            <div className="flex items-center gap-3 text-xs font-mono py-2 px-2 text-muted-foreground">
              <Eye className="w-3 h-3" />
              <span>No objects detected</span>
            </div>
          ) : (
            detections.map((det, index) => (
              <div 
                key={`${det.name}-${index}`} 
                className="flex items-center gap-3 text-xs font-mono py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
              >
                {getDetectionIcon(det)}
                <span className={`font-semibold ${getStatusColor(det)}`}>
                  {det.name}
                </span>
                <span className="text-muted-foreground">
                  {(det.conf * 100).toFixed(0)}%
                </span>
                {det.ppe_status && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    det.ppe_status === 'UNSAFE' 
                      ? 'bg-destructive/20 text-destructive' 
                      : 'bg-success/20 text-success'
                  }`}>
                    {det.ppe_status}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {lastUpdate && (
        <div className="px-4 py-2 border-t border-border bg-card-header">
          <span className="text-[10px] font-mono text-muted-foreground">
            Last update: {formatTime(lastUpdate)}
          </span>
        </div>
      )}
    </div>
  );
};
