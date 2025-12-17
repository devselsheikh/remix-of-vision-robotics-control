import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3, AlertTriangle } from 'lucide-react';

// Mocked data - structured as if from backend
const detectionData = [
  { time: '00:00', detections: 12, confidence: 0.87 },
  { time: '00:05', detections: 18, confidence: 0.92 },
  { time: '00:10', detections: 15, confidence: 0.89 },
  { time: '00:15', detections: 22, confidence: 0.94 },
  { time: '00:20', detections: 19, confidence: 0.91 },
  { time: '00:25', detections: 25, confidence: 0.88 },
  { time: '00:30', detections: 21, confidence: 0.93 },
];

const statsData = [
  { label: 'Objects Detected', value: '1,247', change: '+12%' },
  { label: 'Avg Confidence', value: '91.2%', change: '+2.1%' },
  { label: 'Processing FPS', value: '28.4', change: '-0.3' },
  { label: 'Motor Commands', value: '342', change: '+8%' },
];

export const AnalyticsPanel = () => {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card-header">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="font-mono text-sm font-semibold">ANALYTICS</h3>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-warning/10 border border-warning/20 rounded text-warning">
          <AlertTriangle className="w-3 h-3" />
          <span className="text-[10px] font-mono">MOCKED DATA</span>
        </div>
      </div>
      
      <div className="p-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {statsData.map((stat) => (
            <div 
              key={stat.label} 
              className="bg-muted/50 rounded-lg p-3 border border-border/50"
            >
              <p className="text-[10px] font-mono text-muted-foreground uppercase">
                {stat.label}
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-mono font-bold">{stat.value}</span>
                <span className={`text-xs font-mono ${
                  stat.change.startsWith('+') ? 'text-success' : 'text-warning'
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Detection Chart */}
        <div className="h-40">
          <p className="text-xs font-mono text-muted-foreground mb-2">
            DETECTIONS OVER TIME
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={detectionData}>
              <defs>
                <linearGradient id="detectionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="detections" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#detectionGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
