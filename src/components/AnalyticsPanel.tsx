import { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3, Activity, Shield, ShieldCheck, ShieldAlert, Users } from 'lucide-react';
import { api, Detection } from '@/lib/api';

interface AnalyticsPanelProps {
  isConnected: boolean;
}

interface ChartDataPoint {
  time: string;
  detections: number;
  confidence: number;
}

interface Stats {
  totalDetections: number;
  avgConfidence: number;
  ppeCompliance: number;
  personCount: number;
  safeCount: number;
  unsafeCount: number;
}

export const AnalyticsPanel = ({ isConnected }: AnalyticsPanelProps) => {
  const [stats, setStats] = useState<Stats>({
    totalDetections: 0,
    avgConfidence: 0,
    ppeCompliance: 0,
    personCount: 0,
    safeCount: 0,
    unsafeCount: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const sessionTotalRef = useRef(0);

  useEffect(() => {
    if (!isConnected) {
      setStats({
        totalDetections: 0,
        avgConfidence: 0,
        ppeCompliance: 0,
        personCount: 0,
        safeCount: 0,
        unsafeCount: 0,
      });
      setChartData([]);
      sessionTotalRef.current = 0;
      return;
    }

    const fetchStats = async () => {
      try {
        const data = await api.getDetections();
        const detections = data.detections;

        // Calculate stats
        const persons = detections.filter((d: Detection) => d.raw_name === 'person');
        const safePersons = persons.filter((d: Detection) => 
          d.ppe_status === 'SAFE' || d.ppe_status === 'FULLY_PROTECTED'
        );
        const unsafePersons = persons.filter((d: Detection) => d.ppe_status === 'UNSAFE');

        const avgConf = detections.length > 0
          ? detections.reduce((sum: number, d: Detection) => sum + d.conf, 0) / detections.length
          : 0;

        const compliance = persons.length > 0
          ? (safePersons.length / persons.length) * 100
          : 100;

        sessionTotalRef.current += detections.length;

        setStats({
          totalDetections: sessionTotalRef.current,
          avgConfidence: avgConf * 100,
          ppeCompliance: compliance,
          personCount: persons.length,
          safeCount: safePersons.length,
          unsafeCount: unsafePersons.length,
        });

        // Update chart data
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { 
          hour12: false, 
          minute: '2-digit', 
          second: '2-digit' 
        });

        setChartData(prev => {
          const newPoint = {
            time: timeStr,
            detections: detections.length,
            confidence: avgConf * 100,
          };
          const updated = [...prev, newPoint].slice(-20); // Keep last 20 points
          return updated;
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const statsDisplay = [
    { 
      label: 'Session Detections', 
      value: stats.totalDetections.toLocaleString(),
      icon: Activity,
      color: 'text-primary'
    },
    { 
      label: 'Avg Confidence', 
      value: `${stats.avgConfidence.toFixed(1)}%`,
      icon: BarChart3,
      color: stats.avgConfidence > 80 ? 'text-success' : 'text-warning'
    },
    { 
      label: 'PPE Compliance', 
      value: `${stats.ppeCompliance.toFixed(0)}%`,
      icon: stats.ppeCompliance >= 80 ? ShieldCheck : ShieldAlert,
      color: stats.ppeCompliance >= 80 ? 'text-success' : 'text-destructive'
    },
    { 
      label: 'Persons Detected', 
      value: stats.personCount.toString(),
      icon: Users,
      color: 'text-primary'
    },
  ];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card-header">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="font-mono text-sm font-semibold">ANALYTICS</h3>
        </div>
        {isConnected ? (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-success/10 border border-success/20 rounded text-success">
            <Activity className="w-3 h-3" />
            <span className="text-[10px] font-mono">LIVE DATA</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-muted border border-border rounded text-muted-foreground">
            <span className="text-[10px] font-mono">OFFLINE</span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {statsDisplay.map((stat) => (
            <div 
              key={stat.label} 
              className="bg-muted/50 rounded-lg p-3 border border-border/50"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <stat.icon className={`w-3 h-3 ${stat.color}`} />
                <p className="text-[10px] font-mono text-muted-foreground uppercase">
                  {stat.label}
                </p>
              </div>
              <span className={`text-xl font-mono font-bold ${stat.color}`}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* PPE Status Summary */}
        {isConnected && stats.personCount > 0 && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">PPE STATUS:</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span className="text-sm font-mono text-success">{stats.safeCount} Safe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-destructive" />
                <span className="text-sm font-mono text-destructive">{stats.unsafeCount} Unsafe</span>
              </div>
            </div>
          </div>
        )}

        {/* Detection Chart */}
        <div className="h-40">
          <p className="text-xs font-mono text-muted-foreground mb-2">
            DETECTIONS OVER TIME
          </p>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.length > 0 ? chartData : [{ time: '--:--', detections: 0, confidence: 0 }]}>
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
