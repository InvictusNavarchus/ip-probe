import { ThemeToggle } from './ThemeToggle';

export function Dashboard(): React.JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-8 relative">
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2 gradient-text">IP Probe</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">Privacy-Focused Network & IP Analyzer</p>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="card p-6 animate-fade-in">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Network Analysis Dashboard</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Dashboard components will be implemented in the next phase.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="card-hover p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">IP Detection</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Multi-source IP detection and analysis</p>
            </div>

            <div className="card-hover p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Geolocation</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Privacy-first location mapping</p>
            </div>

            <div className="card-hover p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Network Security</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Comprehensive security assessment</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
