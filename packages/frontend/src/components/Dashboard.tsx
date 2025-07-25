export function Dashboard(): JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          IP Probe
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Privacy-Focused Network & IP Analyzer
        </p>
      </header>
      
      <main className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Network Analysis Dashboard
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Dashboard components will be implemented in the next phase.
          </p>
        </div>
      </main>
    </div>
  );
}
