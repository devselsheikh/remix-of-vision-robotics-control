import { useState } from 'react';
import { VideoFeed } from '@/components/VideoFeed';
import { SettingsModal } from '@/components/SettingsModal';
import { HelpModal } from '@/components/HelpModal';
import { MotorControls } from '@/components/MotorControls';
import { DetectionLog } from '@/components/DetectionLog';
import { AnalyticsPanel } from '@/components/AnalyticsPanel';
import { Button } from '@/components/ui/button';
import { loadSettings, ConnectionConfig } from '@/lib/api';
import { Settings, Bot, Wifi, WifiOff, HelpCircle } from 'lucide-react';

const Index = () => {
  const [config, setConfig] = useState<ConnectionConfig>(loadSettings);
  const [isConnected, setIsConnected] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleConnect = () => {
    setIsConnected(true);
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-mono tracking-tight">DOBI</h1>
              <p className="text-xs text-muted-foreground font-mono">Detection & Control Dashboard v1.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
              isConnected 
                ? 'bg-success/10 border-success/30 text-success' 
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}>
              {isConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="text-xs font-mono font-semibold">
                {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setHelpOpen(true)}
              className="gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Help
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSettingsOpen(true)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video Feed */}
          <div className="lg:col-span-2 space-y-6">
            <VideoFeed isConnected={isConnected} />
            <AnalyticsPanel isConnected={isConnected} />
          </div>
          
          {/* Right Column - Controls */}
          <div className="space-y-6">
            <MotorControls isConnected={isConnected} />
            <DetectionLog isConnected={isConnected} />
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={config}
        onConfigChange={setConfig}
        onConnect={handleConnect}
        isConnected={isConnected}
      />
      
      {/* Help Modal */}
      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
};

export default Index;
