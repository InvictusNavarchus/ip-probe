import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ThemeProvider } from './components/ThemeProvider';

function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<div>404 - Page Not Found</div>} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
