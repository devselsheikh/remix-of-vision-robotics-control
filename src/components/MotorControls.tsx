import { useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square } from 'lucide-react';

interface MotorControlsProps {
  isConnected: boolean;
}

type Direction = 'forward' | 'backward' | 'left' | 'right' | 'stop';

export const MotorControls = ({ isConnected }: MotorControlsProps) => {
  const lastCommandRef = useRef<string>('');
  const throttleRef = useRef<boolean>(false);

  const sendCommand = useCallback(async (direction: Direction) => {
    if (!isConnected || throttleRef.current) return;
    if (lastCommandRef.current === direction && direction !== 'stop') return;
    
    throttleRef.current = true;
    lastCommandRef.current = direction;
    
    try {
      await api.moveMotor(direction);
    } catch (error) {
      console.error('Motor command failed:', error);
    }
    
    setTimeout(() => {
      throttleRef.current = false;
    }, 100); // 100ms throttle
  }, [isConnected]);

  useEffect(() => {
    const keyMap: Record<string, Direction> = {
      'w': 'forward',
      'W': 'forward',
      's': 'backward',
      'S': 'backward',
      'a': 'left',
      'A': 'left',
      'd': 'right',
      'D': 'right',
      ' ': 'stop',
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      const direction = keyMap[e.key];
      if (direction) {
        e.preventDefault();
        sendCommand(direction);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      const direction = keyMap[e.key];
      if (direction && direction !== 'stop') {
        sendCommand('stop');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [sendCommand]);

  const ControlButton = ({ 
    direction, 
    icon: Icon, 
    label,
    className = '' 
  }: { 
    direction: Direction; 
    icon: typeof ArrowUp; 
    label: string;
    className?: string;
  }) => (
    <Button
      variant={direction === 'stop' ? 'destructive' : 'control'}
      size="lg"
      className={`w-16 h-16 ${className}`}
      onMouseDown={() => sendCommand(direction)}
      onMouseUp={() => direction !== 'stop' && sendCommand('stop')}
      onMouseLeave={() => direction !== 'stop' && sendCommand('stop')}
      disabled={!isConnected}
    >
      <div className="flex flex-col items-center gap-1">
        <Icon className="w-6 h-6" />
        <span className="text-[10px] font-mono">{label}</span>
      </div>
    </Button>
  );

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-sm font-semibold">MOTOR CONTROL</h3>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="px-2 py-1 bg-muted rounded">W</span>
          <span className="px-2 py-1 bg-muted rounded">A</span>
          <span className="px-2 py-1 bg-muted rounded">S</span>
          <span className="px-2 py-1 bg-muted rounded">D</span>
          <span className="px-2 py-1 bg-muted rounded">SPACE</span>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <ControlButton direction="forward" icon={ArrowUp} label="W" />
        
        <div className="flex gap-2">
          <ControlButton direction="left" icon={ArrowLeft} label="A" />
          <ControlButton direction="stop" icon={Square} label="STOP" />
          <ControlButton direction="right" icon={ArrowRight} label="D" />
        </div>
        
        <ControlButton direction="backward" icon={ArrowDown} label="S" />
      </div>

      {!isConnected && (
        <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-md">
          <p className="text-xs font-mono text-warning text-center">
            Controls disabled — connect to backend first
          </p>
        </div>
      )}
    </div>
  );
};
