import { useCurrentIP } from '../hooks/useIPAnalysis';
import { DetectedIPsCard } from './DetectedIPsCard';
import { IPAnalysisCard } from './IPAnalysisCard';
import { QuickAnalysisCard } from './QuickAnalysisCard';
import { ThemeToggle } from './ThemeToggle';

// Import visualization components
import { DNSAnalysisCard } from './DNSAnalysisCard';
import { GeolocationMap } from './GeolocationMap';
import { NetworkChart } from './NetworkChart';
import { SecurityChart } from './SecurityChart';

export function Dashboard(): React.JSX.Element {
  const { data: currentIPAnalysis } = useCurrentIP();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8 relative">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2 gradient-text">IP Probe</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Privacy-Focused Network & IP Analyzer</p>
        </header>

        <main className="max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Top Row - Main Analysis and Quick Tools */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main IP Analysis - Takes up 2 columns on large screens */}
              <div className="lg:col-span-2">
                <IPAnalysisCard className="animate-fade-in" />
              </div>

              {/* Quick Analysis Sidebar */}
              <div className="space-y-6">
                <QuickAnalysisCard className="animate-fade-in" />
              </div>
            </div>

            {/* Second Row - Geolocation and Network Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GeolocationMap className="animate-fade-in" />
              <NetworkChart className="animate-fade-in" />
            </div>

            {/* Third Row - Security and DNS Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SecurityChart ipAddress={currentIPAnalysis?.ip.primaryIP?.address} className="animate-fade-in" />
              <DNSAnalysisCard ipAddress={currentIPAnalysis?.ip.primaryIP?.address} className="animate-fade-in" />
            </div>

            {/* Bottom Row - Detected IPs - Full width */}
            <div>
              <DetectedIPsCard className="animate-fade-in" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
