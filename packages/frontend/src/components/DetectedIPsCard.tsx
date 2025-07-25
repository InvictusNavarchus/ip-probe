import { Eye, Network, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge, ConfidenceBadge } from './ui/Badge';
import { LoadingSpinner } from './LoadingSpinner';
import { useDetailedAnalysis } from '../hooks/useIPAnalysis';
import type { IPAddress } from '../types/api';

interface DetectedIPsCardProps {
  className?: string;
}

export function DetectedIPsCard({ className }: DetectedIPsCardProps) {
  const { data: analysis, isLoading, error } = useDetailedAnalysis();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Detected IP Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-slate-600 dark:text-slate-400">
              Analyzing all detected IPs...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Detected IP Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-600 dark:text-red-400" />
            <p className="font-medium text-red-600 dark:text-red-400">Analysis Failed</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {error.message || 'Unable to analyze detected IP addresses'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || !analysis.ip.allDetectedIPs.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Detected IP Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Network className="w-12 h-12 mx-auto mb-2 text-slate-400" />
            <p className="font-medium text-slate-600 dark:text-slate-400">No IPs Detected</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              No IP addresses were found in the request headers
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTypeVariant = (type: IPAddress['type']) => {
    switch (type) {
      case 'public':
        return 'success';
      case 'private':
        return 'secondary';
      case 'reserved':
        return 'warning';
      case 'loopback':
        return 'info';
      case 'multicast':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getSourceLabel = (source: IPAddress['source']) => {
    switch (source) {
      case 'x-forwarded-for':
        return 'X-Forwarded-For';
      case 'x-real-ip':
        return 'X-Real-IP';
      case 'cf-connecting-ip':
        return 'CF-Connecting-IP';
      case 'socket':
        return 'Socket';
      case 'query-parameter':
        return 'Query Parameter';
      default:
        return source;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Detected IP Addresses
          </CardTitle>
          <Badge variant="info">
            {analysis.metadata.totalIPsDetected} found
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Summary Statistics */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Detection Summary
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analysis.metadata.publicIPs}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Public IPs</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                  {analysis.metadata.privateIPs}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Private IPs</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {analysis.metadata.highestConfidence}%
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Highest Confidence</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {analysis.metadata.sources.length}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Sources</p>
              </div>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Detection Sources:</p>
              <div className="flex flex-wrap gap-2">
                {analysis.metadata.sources.map((source) => (
                  <Badge key={source} variant="secondary" size="sm">
                    {getSourceLabel(source as IPAddress['source'])}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* IP Address List */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              All Detected Addresses
            </h3>
            
            <div className="space-y-3">
              {analysis.ip.allDetectedIPs.map((ip, index) => (
                <div
                  key={`${ip.address}-${ip.source}-${index}`}
                  className={`p-4 rounded-lg border transition-colors ${
                    ip.address === analysis.ip.primaryIP?.address
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {ip.address}
                      </span>
                      {ip.address === analysis.ip.primaryIP?.address && (
                        <Badge variant="success" size="sm">Primary</Badge>
                      )}
                    </div>
                    <ConfidenceBadge confidence={ip.confidence} />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getTypeVariant(ip.type)}>
                        IPv{ip.version} {ip.type}
                      </Badge>
                      <Badge variant="info" size="sm">
                        {getSourceLabel(ip.source)}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Additional details if available */}
                  {(ip as any).details && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {(ip as any).details.subnet && (
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">Subnet: </span>
                            <span className="font-mono text-slate-900 dark:text-slate-100">
                              {(ip as any).details.subnet}
                            </span>
                          </div>
                        )}
                        
                        {(ip as any).details.cidr && (
                          <div>
                            <span className="text-slate-600 dark:text-slate-400">CIDR: </span>
                            <span className="font-mono text-slate-900 dark:text-slate-100">
                              {(ip as any).details.cidr}
                            </span>
                          </div>
                        )}
                        
                        {(ip as any).details.range && (
                          <div className="md:col-span-2">
                            <span className="text-slate-600 dark:text-slate-400">Range: </span>
                            <span className="font-mono text-slate-900 dark:text-slate-100">
                              {(ip as any).details.range.start} - {(ip as any).details.range.end}
                            </span>
                            <span className="text-slate-500 dark:text-slate-500 ml-2">
                              ({(ip as any).details.range.total.toLocaleString()} addresses)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
