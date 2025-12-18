import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Monitor, Cpu, Gamepad2 } from 'lucide-react';

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HelpModal = ({ open, onOpenChange }: HelpModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="font-mono">DOBI - Help & Installation</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="install" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="install" className="gap-2 text-xs">
              <Terminal className="w-3 h-3" />
              Installation
            </TabsTrigger>
            <TabsTrigger value="usage" className="gap-2 text-xs">
              <Monitor className="w-3 h-3" />
              Usage
            </TabsTrigger>
            <TabsTrigger value="controls" className="gap-2 text-xs">
              <Gamepad2 className="w-3 h-3" />
              Controls
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="install" className="space-y-4 pr-4">
              <section className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <h3 className="font-mono font-semibold text-sm mb-2 text-destructive">
                  ⚠️ Important: Local Backend Required
                </h3>
                <p className="text-xs text-muted-foreground">
                  This UI connects to a <strong>Python backend running on your computer</strong> (localhost:8000). 
                  The backend processes video with YOLO and streams it to this interface.
                </p>
              </section>

              <section>
                <h3 className="font-mono font-semibold text-sm mb-2 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-primary" />
                  Requirements
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Python 3.10+</li>
                  <li>CUDA (optional, for GPU acceleration)</li>
                  <li>Raspberry Pi with camera module</li>
                  <li>MJPG-Streamer on Pi</li>
                </ul>
              </section>
              
              <section>
                <h3 className="font-mono font-semibold text-sm mb-2">1. Raspberry Pi - Start Camera Stream</h3>
                <div className="bg-muted rounded-lg p-3 font-mono text-xs space-y-1">
                  <p className="text-muted-foreground"># Navigate to mjpg-streamer folder</p>
                  <p>cd mjpg-streamer/mjpg-streamer-experimental</p>
                  <p className="text-muted-foreground mt-2"># Start the stream (USB camera)</p>
                  <p>./mjpg_streamer -i "./input_uvc.so -d /dev/video0 -r 640x480 -f 15" -o "./output_http.so -w ./www"</p>
                  <p className="text-muted-foreground mt-2"># Stream URL will be:</p>
                  <p className="text-primary">http://&lt;PI_IP&gt;:8080/?action=stream</p>
                </div>
              </section>
              
              <section>
                <h3 className="font-mono font-semibold text-sm mb-2">2. Your Computer - Start Backend</h3>
                <div className="bg-muted rounded-lg p-3 font-mono text-xs space-y-1">
                  <p className="text-muted-foreground"># Navigate to backend folder</p>
                  <p>cd backend</p>
                  <p className="text-muted-foreground mt-2"># Install dependencies</p>
                  <p>pip install -r requirements.txt</p>
                  <p className="text-muted-foreground mt-2"># Place your YOLOv8 model</p>
                  <p>cp your_model.pt best.pt</p>
                  <p className="text-muted-foreground mt-2"># Start the server</p>
                  <p>python main.py</p>
                  <p className="text-muted-foreground mt-2"># Server runs on:</p>
                  <p className="text-primary">http://localhost:8000</p>
                </div>
              </section>
              
              <section>
                <h3 className="font-mono font-semibold text-sm mb-2">3. Connect via Settings</h3>
                <div className="bg-muted rounded-lg p-3 text-xs space-y-1">
                  <p>1. Click <strong>Settings</strong> in the header</p>
                  <p>2. Enter your Pi's stream URL (e.g., http://10.40.58.225:8080/?action=stream)</p>
                  <p>3. Enter your Pi's IP address (e.g., 10.40.58.225)</p>
                  <p>4. Click <strong>Connect</strong></p>
                </div>
              </section>
            </TabsContent>
            
            <TabsContent value="usage" className="space-y-4 pr-4">
              <section>
                <h3 className="font-mono font-semibold text-sm mb-2">Getting Started</h3>
                <ol className="text-sm text-muted-foreground space-y-2 ml-6 list-decimal">
                  <li>Ensure the backend server is running on port 8000</li>
                  <li>Open the frontend in your browser</li>
                  <li>Click <strong>Settings</strong> and configure the stream URL</li>
                  <li>Click <strong>Connect</strong> to start the video feed</li>
                </ol>
              </section>
              
              <section>
                <h3 className="font-mono font-semibold text-sm mb-2">Detection Classes</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted rounded p-2">
                    <p className="font-semibold text-xs mb-1">PPE Detection</p>
                    <p className="text-muted-foreground text-xs">Person, Hardhat, Safety Vest, Safety Boots, Safety Gloves, Safety Mask</p>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <p className="font-semibold text-xs mb-1">Hazard Detection</p>
                    <p className="text-muted-foreground text-xs">Fire, Smoke, Gas, Leak, Crack, Damage</p>
                  </div>
                </div>
              </section>
              
              <section>
                <h3 className="font-mono font-semibold text-sm mb-2">API Endpoints</h3>
                <div className="bg-muted rounded-lg p-3 font-mono text-xs space-y-1">
                  <p><span className="text-primary">GET</span> /health - Health check</p>
                  <p><span className="text-primary">POST</span> /connect - Connect to camera</p>
                  <p><span className="text-primary">GET</span> /disconnect - Disconnect</p>
                  <p><span className="text-primary">GET</span> /video - MJPEG stream</p>
                  <p><span className="text-primary">GET</span> /detections - Detection JSON</p>
                  <p><span className="text-primary">POST</span> /move/&#123;dir&#125; - Motor control</p>
                </div>
              </section>
            </TabsContent>
            
            <TabsContent value="controls" className="space-y-4 pr-4">
              <section>
                <h3 className="font-mono font-semibold text-sm mb-2">Motor Controls</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Use the directional buttons or keyboard to control the robot:
                </p>
                <div className="grid grid-cols-3 gap-2 w-32 mx-auto text-center">
                  <div />
                  <div className="bg-muted rounded p-2 text-xs font-mono">W / ↑</div>
                  <div />
                  <div className="bg-muted rounded p-2 text-xs font-mono">A / ←</div>
                  <div className="bg-muted rounded p-2 text-xs font-mono">S / ↓</div>
                  <div className="bg-muted rounded p-2 text-xs font-mono">D / →</div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Press <kbd className="bg-muted px-1 rounded">Space</kbd> to stop
                </p>
              </section>
              
              <section>
                <h3 className="font-mono font-semibold text-sm mb-2">Detection Log</h3>
                <p className="text-sm text-muted-foreground">
                  The detection log shows real-time YOLO detections with:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc mt-2">
                  <li><strong>Object name</strong> - Detected class</li>
                  <li><strong>Confidence</strong> - Detection certainty (0-100%)</li>
                  <li><strong>PPE Status</strong> - SAFE, UNSAFE, or FULLY_PROTECTED</li>
                </ul>
              </section>
              
              <section>
                <h3 className="font-mono font-semibold text-sm mb-2">Analytics Panel</h3>
                <p className="text-sm text-muted-foreground">
                  View real-time statistics including:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc mt-2">
                  <li>Total detection count</li>
                  <li>Average confidence score</li>
                  <li>PPE compliance rate</li>
                  <li>Safe vs unsafe person breakdown</li>
                </ul>
              </section>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
