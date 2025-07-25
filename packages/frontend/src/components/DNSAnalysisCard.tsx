import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle, Clock, Globe, Shield, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useDNSAnalysis } from '../hooks/useIPAnalysis';
import type { DNSRecord } from '../types/api';
import { LoadingSpinner } from './LoadingSpinner';
import { Badge, RiskBadge, StatusBadge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface DNSAnalysisCardProps {
  ipAddress?: string | undefined;
  className?: string | undefined;
}

export function DNSAnalysisCard({ ipAddress, className }: DNSAnalysisCardProps) {
  const [selectedIP] = useState(ipAddress || '');
  const { data: dnsAnalysis, isLoading, error, refetch } = useDNSAnalysis(selectedIP, !!selectedIP);

  const handleAnalyze = () => {
    if (selectedIP) {
      refetch();
    }
  };

  if (!selectedIP) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            DNS Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Globe className="w-12 h-12 mx-auto mb-2 text-slate-400" />
            <p className="font-medium text-slate-600 dark:text-slate-400">No IP Selected</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              Select an IP address to perform DNS analysis
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            DNS Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-slate-600 dark:text-slate-400">Analyzing DNS records...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            DNS Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-600 dark:text-red-400" />
            <p className="font-medium text-red-600 dark:text-red-400">DNS Analysis Failed</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {error.message || 'Unable to perform DNS analysis'}
            </p>
            <Button onClick={handleAnalyze} className="mt-4" variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dnsAnalysis) {
    return null;
  }

  const getRecordTypeColor = (type: DNSRecord['type']) => {
    switch (type) {
      case 'A':
        return 'success';
      case 'AAAA':
        return 'info';
      case 'CNAME':
        return 'warning';
      case 'MX':
        return 'secondary';
      case 'TXT':
        return 'default';
      case 'NS':
        return 'info';
      case 'PTR':
        return 'warning';
      case 'SOA':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            DNS Analysis
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="info" size="sm">
              {dnsAnalysis.responseTime}ms
            </Badge>
            <Button onClick={handleAnalyze} size="sm" variant="outline">
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Target IP */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Target IP Address</p>
                <p className="font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {dnsAnalysis.ipAddress}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Response Time</p>
                <Badge
                  variant={
                    dnsAnalysis.responseTime < 100 ? 'success' : dnsAnalysis.responseTime < 500 ? 'warning' : 'danger'
                  }
                >
                  {dnsAnalysis.responseTime}ms
                </Badge>
              </div>
            </div>
          </div>

          {/* Reverse DNS */}
          {dnsAnalysis.reverseDNS && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Reverse DNS Lookup
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Hostname</span>
                  <span className="font-mono text-sm text-slate-900 dark:text-slate-100">
                    {dnsAnalysis.reverseDNS.hostname || 'Not found'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Verified</span>
                  <StatusBadge status={dnsAnalysis.reverseDNS.verified ? 'online' : 'error'} showDot={false}>
                    {dnsAnalysis.reverseDNS.verified ? 'Yes' : 'No'}
                  </StatusBadge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Forward Match</span>
                  <StatusBadge status={dnsAnalysis.reverseDNS.forwardMatch ? 'online' : 'warning'} showDot={false}>
                    {dnsAnalysis.reverseDNS.forwardMatch ? 'Yes' : 'No'}
                  </StatusBadge>
                </div>
              </div>
            </div>
          )}

          {/* DNS Records */}
          {dnsAnalysis.dnsRecords.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                DNS Records ({dnsAnalysis.dnsRecords.length})
              </h3>

              <div className="space-y-2">
                {dnsAnalysis.dnsRecords.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant={getRecordTypeColor(record.type)} size="sm">
                        {record.type}
                      </Badge>
                      <span className="font-mono text-sm text-slate-900 dark:text-slate-100">{record.value}</span>
                    </div>

                    {record.ttl && (
                      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3 mr-1" />
                        TTL: {record.ttl}s
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DNS Servers */}
          {dnsAnalysis.dnsServers && dnsAnalysis.dnsServers.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">DNS Servers</h3>

              <div className="flex flex-wrap gap-2">
                {dnsAnalysis.dnsServers.map((server, index) => (
                  <Badge key={index} variant="secondary">
                    {server}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* DNS Leaks */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              DNS Leak Detection
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Leaks Detected</span>
                <StatusBadge status={dnsAnalysis.dnsLeaks.detected ? 'error' : 'online'} showDot={false}>
                  {dnsAnalysis.dnsLeaks.detected ? 'Yes' : 'No'}
                </StatusBadge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Risk Level</span>
                <Badge
                  variant={
                    dnsAnalysis.dnsLeaks.riskLevel === 'high'
                      ? 'danger'
                      : dnsAnalysis.dnsLeaks.riskLevel === 'medium'
                        ? 'warning'
                        : 'success'
                  }
                >
                  {dnsAnalysis.dnsLeaks.riskLevel}
                </Badge>
              </div>

              {dnsAnalysis.dnsLeaks.leakedServers.length > 0 && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Leaked Servers:</p>
                  <div className="flex flex-wrap gap-2">
                    {dnsAnalysis.dnsLeaks.leakedServers.map((server, index) => (
                      <Badge key={index} variant="danger" size="sm">
                        {server}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reputation Analysis */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Reputation Analysis
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Risk Score</span>
                <RiskBadge riskScore={dnsAnalysis.reputation.riskScore} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Malicious</span>
                  {dnsAnalysis.reputation.isMalicious ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Phishing</span>
                  {dnsAnalysis.reputation.isPhishing ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Malware</span>
                  {dnsAnalysis.reputation.isMalware ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Spam</span>
                  {dnsAnalysis.reputation.isSpam ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center pt-4 border-t border-slate-200 dark:border-slate-700">
            Analysis completed: {formatDistanceToNow(new Date(dnsAnalysis.analysisTimestamp), { addSuffix: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
