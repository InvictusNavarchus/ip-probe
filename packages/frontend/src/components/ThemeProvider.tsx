import { ThemeContext, useThemeState } from '@/hooks/useTheme';
import { ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const themeState = useThemeState();

  return <ThemeContext value={themeState}>{children}</ThemeContext>;
}
