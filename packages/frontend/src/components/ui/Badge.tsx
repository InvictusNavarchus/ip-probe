import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string | undefined;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  const variantClasses = {
    default: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    secondary: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warning' | 'error';
  children?: React.ReactNode;
  showDot?: boolean;
  className?: string | undefined;
}

export function StatusBadge({ status, children, showDot = true, className }: StatusBadgeProps) {
  const statusConfig = {
    online: {
      variant: 'success' as const,
      dotColor: 'bg-green-500',
      label: 'Online'
    },
    offline: {
      variant: 'secondary' as const,
      dotColor: 'bg-slate-500',
      label: 'Offline'
    },
    warning: {
      variant: 'warning' as const,
      dotColor: 'bg-yellow-500',
      label: 'Warning'
    },
    error: {
      variant: 'danger' as const,
      dotColor: 'bg-red-500',
      label: 'Error'
    }
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {showDot && <span className={cn('w-2 h-2 rounded-full mr-1.5', config.dotColor)} />}
      {children || config.label}
    </Badge>
  );
}

interface RiskBadgeProps {
  riskScore: number;
  className?: string | undefined;
}

export function RiskBadge({ riskScore, className }: RiskBadgeProps) {
  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'Critical', variant: 'danger' as const };
    if (score >= 60) return { level: 'High', variant: 'danger' as const };
    if (score >= 40) return { level: 'Medium', variant: 'warning' as const };
    if (score >= 20) return { level: 'Low', variant: 'info' as const };
    return { level: 'Minimal', variant: 'success' as const };
  };

  const { level, variant } = getRiskLevel(riskScore);

  return (
    <Badge variant={variant} className={className}>
      {level} ({riskScore}%)
    </Badge>
  );
}

interface ConfidenceBadgeProps {
  confidence: number;
  className?: string | undefined;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const getConfidenceLevel = (score: number) => {
    if (score >= 90) return { level: 'Very High', variant: 'success' as const };
    if (score >= 75) return { level: 'High', variant: 'success' as const };
    if (score >= 50) return { level: 'Medium', variant: 'warning' as const };
    if (score >= 25) return { level: 'Low', variant: 'danger' as const };
    return { level: 'Very Low', variant: 'danger' as const };
  };

  const { level, variant } = getConfidenceLevel(confidence);

  return (
    <Badge variant={variant} size="sm" className={className}>
      {level} ({confidence}%)
    </Badge>
  );
}
