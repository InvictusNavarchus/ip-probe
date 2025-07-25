import { DetectedIPsCard } from './DetectedIPsCard';
import { IPAnalysisCard } from './IPAnalysisCard';
import { QuickAnalysisCard } from './QuickAnalysisCard';
import { ThemeToggle } from './ThemeToggle';

export function Dashboard(): React.JSX.Element {
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main IP Analysis - Takes up 2 columns on large screens */}
            <div className="lg:col-span-2">
              <IPAnalysisCard className="animate-fade-in" />
            </div>

            {/* Quick Analysis Sidebar */}
            <div className="space-y-6">
              <QuickAnalysisCard className="animate-fade-in" />
            </div>

            {/* Detected IPs - Full width */}
            <div className="lg:col-span-3">
              <DetectedIPsCard className="animate-fade-in" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
