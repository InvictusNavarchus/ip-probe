import { useState } from 'react';
import { Search, Zap, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { LoadingSpinner } from './LoadingSpinner';
import { useAnalyzeIP } from '../hooks/useIPAnalysis';

interface QuickAnalysisCardProps {
  className?: string;
}

export function QuickAnalysisCard({ className }: QuickAnalysisCardProps) {
  const [ipAddress, setIpAddress] = useState('');
  const [lastAnalyzedIP, setLastAnalyzedIP] = useState<string | null>(null);
  
  const analyzeIPMutation = useAnalyzeIP();

  const handleAnalyze = async () => {
    if (!ipAddress.trim()) return;
    
    try {
      await analyzeIPMutation.mutateAsync(ipAddress.trim());
      setLastAnalyzedIP(ipAddress.trim());
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  const isValidIP = (ip: string) => {
    // Basic IP validation regex
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  };

  const inputValid = ipAddress.trim() === '' || isValidIP(ipAddress.trim());

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Quick IP Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Input Section */}
          <div>
            <label htmlFor="ip-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Enter IP Address
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  id="ip-input"
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., 8.8.8.8 or 2001:4860:4860::8888"
                  className={`w-full px-3 py-2 border rounded-md font-mono text-sm transition-colors
                    ${inputValid 
                      ? 'border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500' 
                      : 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                    }
                    bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
                    focus:outline-none focus:ring-2 focus:ring-opacity-50`}
                />
                {!inputValid && (
                  <div className="flex items-center mt-1 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Please enter a valid IP address
                  </div>
                )}
              </div>
              
              <Button
                onClick={handleAnalyze}
                disabled={!ipAddress.trim() || !inputValid || analyzeIPMutation.isPending}
                loading={analyzeIPMutation.isPending}
                icon={<Search className="w-4 h-4" />}
              >
                Analyze
              </Button>
            </div>
          </div>

          {/* Quick Examples */}
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-2">
              {['8.8.8.8', '1.1.1.1', '208.67.222.222'].map((exampleIP) => (
                <button
                  key={exampleIP}
                  onClick={() => setIpAddress(exampleIP)}
                  className="px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {exampleIP}
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Results */}
          {analyzeIPMutation.isPending && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <LoadingSpinner size="sm" className="mr-3" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Analyzing {ipAddress}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Please wait while we gather information...
                  </p>
                </div>
              </div>
            </div>
          )}

          {analyzeIPMutation.isError && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-100">
                    Analysis Failed
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {analyzeIPMutation.error?.message || 'Unable to analyze the IP address'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {analyzeIPMutation.isSuccess && analyzeIPMutation.data && lastAnalyzedIP && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Analysis Complete
                  </p>
                  <Badge variant="success">Success</Badge>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-green-700 dark:text-green-300">IP Address: </span>
                    <span className="font-mono font-semibold text-green-900 dark:text-green-100">
                      {lastAnalyzedIP}
                    </span>
                  </div>
                  
                  {analyzeIPMutation.data.ip.primaryIP && (
                    <>
                      <div>
                        <span className="text-sm text-green-700 dark:text-green-300">Type: </span>
                        <Badge variant="info" size="sm">
                          IPv{analyzeIPMutation.data.ip.primaryIP.version} {analyzeIPMutation.data.ip.primaryIP.type}
                        </Badge>
                      </div>
                      
                      {analyzeIPMutation.data.ip.technical?.subnet && (
                        <div>
                          <span className="text-sm text-green-700 dark:text-green-300">Subnet: </span>
                          <span className="font-mono text-sm text-green-900 dark:text-green-100">
                            {analyzeIPMutation.data.ip.technical.subnet}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <p className="text-xs text-green-600 dark:text-green-400">
                  💡 Check the main dashboard for detailed analysis results
                </p>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>• Enter any IPv4 or IPv6 address for instant analysis</p>
            <p>• Results include geolocation, network info, and security assessment</p>
            <p>• All analysis is performed locally without external API calls</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
