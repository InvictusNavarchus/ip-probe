import { Globe, Shield, Network, MapPin, Server, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Badge, StatusBadge, RiskBadge, ConfidenceBadge } from './ui/Badge';
import { LoadingSpinner } from './LoadingSpinner';
import { useCurrentIP } from '../hooks/useIPAnalysis';
import { formatDistanceToNow } from 'date-fns';
import type { IPAnalysis } from '../types/api';

interface IPAnalysisCardProps {
  className?: string;
}

export function IPAnalysisCard({ className }: IPAnalysisCardProps) {
  const { data: analysis, isLoading, error, refetch } = useCurrentIP();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Current IP Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-slate-600 dark:text-slate-400">
              Analyzing your connection...
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
          <CardTitle>Current IP Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-600 dark:text-red-400 mb-4">
              <Shield className="w-12 h-12 mx-auto mb-2" />
              <p className="font-medium">Analysis Failed</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {error.message || 'Unable to analyze your IP address'}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Current IP Analysis
          </CardTitle>
          <StatusBadge status="online" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Primary IP Information */}
          {analysis.ip.primaryIP && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Primary IP Address
                </h3>
                <ConfidenceBadge confidence={analysis.ip.primaryIP.confidence} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Address</p>
                  <p className="font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {analysis.ip.primaryIP.address}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Type</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant={analysis.ip.primaryIP.type === 'public' ? 'success' : 'secondary'}>
                      IPv{analysis.ip.primaryIP.version} {analysis.ip.primaryIP.type}
                    </Badge>
                    <Badge variant="info" size="sm">
                      {analysis.ip.primaryIP.source}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Geolocation Information */}
          {analysis.ip.geolocation && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Location Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysis.ip.geolocation.country && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Country</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {analysis.ip.geolocation.country}
                      {analysis.ip.geolocation.countryCode && (
                        <span className="ml-2 text-sm text-slate-500">
                          ({analysis.ip.geolocation.countryCode})
                        </span>
                      )}
                    </p>
                  </div>
                )}
                
                {analysis.ip.geolocation.region && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Region</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {analysis.ip.geolocation.region}
                    </p>
                  </div>
                )}
                
                {analysis.ip.geolocation.city && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">City</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {analysis.ip.geolocation.city}
                    </p>
                  </div>
                )}
              </div>
              
              {(analysis.ip.geolocation.latitude && analysis.ip.geolocation.longitude) && (
                <div className="mt-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Coordinates</p>
                  <p className="font-mono text-sm text-slate-900 dark:text-slate-100">
                    {analysis.ip.geolocation.latitude.toFixed(4)}, {analysis.ip.geolocation.longitude.toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Network Information */}
          {analysis.ip.network && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
                <Network className="w-4 h-4 mr-2" />
                Network Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.ip.network.isp && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">ISP</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {analysis.ip.network.isp}
                    </p>
                  </div>
                )}
                
                {analysis.ip.network.organization && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Organization</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {analysis.ip.network.organization}
                    </p>
                  </div>
                )}
                
                {analysis.ip.network.connectionType && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Connection Type</p>
                    <Badge variant="info">
                      {analysis.ip.network.connectionType}
                    </Badge>
                  </div>
                )}
                
                {analysis.ip.network.asn && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">ASN</p>
                    <p className="font-mono text-sm text-slate-900 dark:text-slate-100">
                      AS{analysis.ip.network.asn}
                      {analysis.ip.network.asnOrganization && (
                        <span className="ml-2 font-sans">
                          ({analysis.ip.network.asnOrganization})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Information */}
          {analysis.ip.security && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Security Assessment
              </h3>
              
              <div className="space-y-3">
                {typeof analysis.ip.security.riskScore === 'number' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Risk Score</span>
                    <RiskBadge riskScore={analysis.ip.security.riskScore} />
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {analysis.ip.security.isVPN !== undefined && (
                    <StatusBadge 
                      status={analysis.ip.security.isVPN ? 'warning' : 'online'}
                      showDot={false}
                    >
                      VPN: {analysis.ip.security.isVPN ? 'Yes' : 'No'}
                    </StatusBadge>
                  )}
                  
                  {analysis.ip.security.isProxy !== undefined && (
                    <StatusBadge 
                      status={analysis.ip.security.isProxy ? 'warning' : 'online'}
                      showDot={false}
                    >
                      Proxy: {analysis.ip.security.isProxy ? 'Yes' : 'No'}
                    </StatusBadge>
                  )}
                  
                  {analysis.ip.security.isTor !== undefined && (
                    <StatusBadge 
                      status={analysis.ip.security.isTor ? 'error' : 'online'}
                      showDot={false}
                    >
                      Tor: {analysis.ip.security.isTor ? 'Yes' : 'No'}
                    </StatusBadge>
                  )}
                  
                  {analysis.ip.security.isHosting !== undefined && (
                    <StatusBadge 
                      status={analysis.ip.security.isHosting ? 'warning' : 'online'}
                      showDot={false}
                    >
                      Hosting: {analysis.ip.security.isHosting ? 'Yes' : 'No'}
                    </StatusBadge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Connection Information */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
              <Server className="w-4 h-4 mr-2" />
              Connection Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Protocol</p>
                <Badge variant={analysis.connection.secure ? 'success' : 'warning'}>
                  {analysis.connection.protocol}
                  {analysis.connection.port && `:${analysis.connection.port}`}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Security</p>
                <StatusBadge status={analysis.connection.secure ? 'online' : 'warning'}>
                  {analysis.connection.secure ? 'Secure' : 'Insecure'}
                </StatusBadge>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Last updated: {formatDistanceToNow(new Date(analysis.timestamp), { addSuffix: true })}
            </div>
            <button
              onClick={() => refetch()}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
