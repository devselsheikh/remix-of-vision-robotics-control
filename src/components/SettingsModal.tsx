import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { api, ConnectionConfig, saveSettings, setBackendUrl } from '@/lib/api';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ConnectionConfig;
  onConfigChange: (config: ConnectionConfig) => void;
  onConnect: () => void;
  isConnected: boolean;
}

export const SettingsModal = ({
  open,
  onOpenChange,
  config,
  onConfigChange,
  onConnect,
  isConnected,
}: SettingsModalProps) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionStatus('idle');
    setErrorMessage('');
    
    // Update backend URL before connecting
    setBackendUrl(localConfig.backendUrl);
    
    try {
      const response = await api.connect(localConfig);
      if (response.status === 'connected') {
        setConnectionStatus('success');
        onConfigChange(localConfig);
        saveSettings(localConfig);
        onConnect();
        setTimeout(() => onOpenChange(false), 1000);
      } else {
        setConnectionStatus('error');
        setErrorMessage(response.message || 'Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSave = () => {
    setBackendUrl(localConfig.backendUrl);
    saveSettings(localConfig);
    onConfigChange(localConfig);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono">
            <Settings className="w-5 h-5 text-primary" />
            CONNECTION SETTINGS
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="backendUrl" className="font-mono text-xs">
              BACKEND URL (your computer)
            </Label>
            <Input
              id="backendUrl"
              value={localConfig.backendUrl}
              onChange={(e) => setLocalConfig({ ...localConfig, backendUrl: e.target.value })}
              placeholder="http://localhost:8000"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              The Python backend running YOLO detection
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="streamUrl" className="font-mono text-xs">
              VIDEO STREAM URL (Pi camera)
            </Label>
            <Input
              id="streamUrl"
              value={localConfig.streamUrl}
              onChange={(e) => setLocalConfig({ ...localConfig, streamUrl: e.target.value })}
              placeholder="http://10.40.58.225:8080/?action=stream"
              className="font-mono text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="piIp" className="font-mono text-xs">
              RASPBERRY PI IP ADDRESS
            </Label>
            <Input
              id="piIp"
              value={localConfig.piIp}
              onChange={(e) => setLocalConfig({ ...localConfig, piIp: e.target.value })}
              placeholder="10.40.58.225"
              className="font-mono"
            />
          </div>

          {connectionStatus !== 'idle' && (
            <div className={`flex flex-col gap-1 p-3 rounded-md ${
              connectionStatus === 'success' 
                ? 'bg-success/10 text-success border border-success/20' 
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
              <div className="flex items-center gap-2">
                {connectionStatus === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span className="font-mono text-sm">
                  {connectionStatus === 'success' ? 'Connected successfully!' : 'Connection failed'}
                </span>
              </div>
              {errorMessage && (
                <p className="font-mono text-xs ml-6 opacity-80">{errorMessage}</p>
              )}
              {connectionStatus === 'error' && errorMessage?.includes('Backend not reachable') && (
                <p className="font-mono text-xs ml-6 mt-1 text-muted-foreground">
                  Make sure the Python backend is running: <code className="bg-muted px-1 rounded">python backend/main.py</code>
                </p>
              )}
            </div>
          )}

          {isConnected && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-success/10 border border-success/20">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="font-mono text-sm text-success">Currently connected</span>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleSave}>
            Save Settings
          </Button>
          <Button onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
