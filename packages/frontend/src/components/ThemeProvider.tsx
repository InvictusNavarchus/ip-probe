import { ReactNode } from 'react';
import { ThemeContext, useThemeState } from '@/hooks/useTheme';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  const themeState = useThemeState();

  return (
    <ThemeContext value={themeState}>
      {children}
    </ThemeContext>
  );
}
