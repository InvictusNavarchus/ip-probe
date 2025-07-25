import { formatDistanceToNow } from 'date-fns';
import { Activity, Network, Wifi } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDetailedAnalysis } from '../hooks/useIPAnalysis';
import { LoadingSpinner } from './LoadingSpinner';
import { Badge } from './ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface NetworkChartProps {
  className?: string | undefined;
}

export function NetworkChart({ className }: NetworkChartProps) {
  const { data: analysis, isLoading, error } = useDetailedAnalysis();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Network Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-slate-600 dark:text-slate-400">Analyzing network data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Network Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Network className="w-12 h-12 mx-auto mb-2 text-slate-400" />
            <p className="font-medium text-slate-600 dark:text-slate-400">No Network Data</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Network analysis data is not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate mock network performance data for visualization
  const generateNetworkData = () => {
    const now = new Date();
    const data = [];

    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        latency: Math.floor(Math.random() * 50) + 20, // 20-70ms
        throughput: Math.floor(Math.random() * 100) + 50, // 50-150 Mbps
        packetLoss: Math.random() * 2, // 0-2%
        connections: Math.floor(Math.random() * 20) + 5 // 5-25 connections
      });
    }

    return data;
  };

  const networkData = generateNetworkData();

  // Prepare confidence distribution data
  const confidenceData = analysis.ip.allDetectedIPs.map((ip, index) => ({
    name: `IP ${index + 1}`,
    confidence: ip.confidence,
    type: ip.type,
    source: ip.source
  }));

  // Calculate network statistics
  const stats = {
    totalIPs: analysis.metadata.totalIPsDetected,
    publicIPs: analysis.metadata.publicIPs,
    privateIPs: analysis.metadata.privateIPs,
    avgConfidence: Math.round(
      analysis.ip.allDetectedIPs.reduce((sum, ip) => sum + ip.confidence, 0) / analysis.ip.allDetectedIPs.length
    ),
    sources: analysis.metadata.sources.length
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Network Analysis
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Network Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalIPs}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total IPs</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.publicIPs}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Public</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">{stats.privateIPs}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Private</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.avgConfidence}%</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Avg Confidence</div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.sources}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Sources</div>
            </div>
          </div>

          {/* IP Confidence Chart */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
              <Wifi className="w-4 h-4 mr-2" />
              IP Detection Confidence
            </h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={confidenceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-slate-600 dark:text-slate-400" />
                  <YAxis tick={{ fontSize: 12 }} className="text-slate-600 dark:text-slate-400" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(30 41 59)',
                      border: '1px solid rgb(71 85 105)',
                      borderRadius: '6px',
                      color: 'rgb(226 232 240)'
                    }}
                    formatter={(value: any) => [`${value}%`, 'Confidence']}
                    labelFormatter={(label: string) => `Detection: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="confidence"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mock Network Performance Chart */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Network Performance (24h)</h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={networkData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} className="text-slate-600 dark:text-slate-400" />
                  <YAxis tick={{ fontSize: 12 }} className="text-slate-600 dark:text-slate-400" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(30 41 59)',
                      border: '1px solid rgb(71 85 105)',
                      borderRadius: '6px',
                      color: 'rgb(226 232 240)'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                    name="Latency (ms)"
                  />
                  <Line
                    type="monotone"
                    dataKey="throughput"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    name="Throughput (Mbps)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center space-x-6 mt-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Latency (ms)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-slate-600 dark:text-slate-400">Throughput (Mbps)</span>
              </div>
            </div>
          </div>

          {/* Detection Sources */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Detection Sources</h3>

            <div className="flex flex-wrap gap-2">
              {analysis.metadata.sources.map(source => (
                <Badge key={source} variant="secondary">
                  {source.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center pt-4 border-t border-slate-200 dark:border-slate-700">
            Last updated: {formatDistanceToNow(new Date(analysis.timestamp), { addSuffix: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
