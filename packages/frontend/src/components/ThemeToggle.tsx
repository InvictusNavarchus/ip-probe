import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/cn';
import { Monitor, Moon, Sun } from 'lucide-react';

export function ThemeToggle(): React.JSX.Element {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' }
  ];

  return (
    <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200',
            'hover:bg-white dark:hover:bg-slate-700',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
            'focus:ring-offset-slate-100 dark:focus:ring-offset-slate-800',
            theme === value && 'bg-white dark:bg-slate-700 shadow-sm'
          )}
          title={`Switch to ${label.toLowerCase()} theme`}
          aria-label={`Switch to ${label.toLowerCase()} theme`}
        >
          <Icon
            size={16}
            className={cn(
              'transition-colors duration-200',
              theme === value ? 'text-brand-600 dark:text-brand-400' : 'text-slate-600 dark:text-slate-400'
            )}
          />
        </button>
      ))}
    </div>
  );
}
