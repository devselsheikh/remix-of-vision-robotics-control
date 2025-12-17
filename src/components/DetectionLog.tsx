import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Clock } from 'lucide-react';

interface LogEntry {
  id: number;
  timestamp: Date;
  message: string;
  type: 'info' | 'detection' | 'warning';
}

interface DetectionLogProps {
  isConnected: boolean;
}

export const DetectionLog = ({ isConnected }: DetectionLogProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (isConnected) {
      // Add initial connection message
      setLogs([{
        id: Date.now(),
        timestamp: new Date(),
        message: 'Receiving detections from backend…',
        type: 'info',
      }]);

      // Simulate periodic status updates
      const interval = setInterval(() => {
        setLogs(prev => {
          const newLog: LogEntry = {
            id: Date.now(),
            timestamp: new Date(),
            message: `Detection stream active • Frame received`,
            type: 'detection',
          };
          return [...prev.slice(-49), newLog];
        });
      }, 3000);

      return () => clearInterval(interval);
    } else {
      setLogs([{
        id: Date.now(),
        timestamp: new Date(),
        message: 'Waiting for backend connection…',
        type: 'warning',
      }]);
    }
  }, [isConnected]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const getTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'detection': return 'text-primary';
      case 'warning': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card-header">
        <Eye className="w-4 h-4 text-primary" />
        <h3 className="font-mono text-sm font-semibold">DETECTION LOG</h3>
      </div>
      
      <ScrollArea className="h-48">
        <div className="p-3 space-y-1">
          {logs.map((log) => (
            <div 
              key={log.id} 
              className="flex items-start gap-3 text-xs font-mono py-1.5 px-2 rounded hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                <Clock className="w-3 h-3" />
                <span>{formatTime(log.timestamp)}</span>
              </div>
              <span className={getTypeColor(log.type)}>{log.message}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
