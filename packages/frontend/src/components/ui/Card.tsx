import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string | undefined;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className, hover = false, padding = 'md' }: CardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm',
        hover && 'hover:shadow-md transition-shadow duration-200',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string | undefined;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn('mb-4 pb-2 border-b border-slate-200 dark:border-slate-700', className)}>{children}</div>;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string | undefined;
  level?: 1 | 2 | 3;
}

export function CardTitle({ children, className, level = 2 }: CardTitleProps) {
  const sizeClasses = {
    1: 'text-2xl font-bold',
    2: 'text-xl font-semibold',
    3: 'text-lg font-medium'
  };

  const baseClasses = cn('text-slate-900 dark:text-slate-100', sizeClasses[level], className);

  if (level === 1) {
    return <h1 className={baseClasses}>{children}</h1>;
  }
  if (level === 3) {
    return <h3 className={baseClasses}>{children}</h3>;
  }
  return <h2 className={baseClasses}>{children}</h2>;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string | undefined;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('text-slate-600 dark:text-slate-400', className)}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string | undefined;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return <div className={cn('mt-4 pt-4 border-t border-slate-200 dark:border-slate-700', className)}>{children}</div>;
}
