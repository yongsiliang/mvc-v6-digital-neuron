'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'active' | 'warning' | 'success';
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  variant = 'default',
  icon,
  className,
}: StatCardProps) {
  const variantStyles = {
    default: '',
    active: 'border-neuron-active/30 shadow-[var(--glow-teal)]',
    warning: 'border-[var(--neuron-surprised)]/30',
    success: 'border-[var(--signal-reward)]/30',
  };

  const trendStyles = {
    up: 'text-[var(--signal-reward)]',
    down: 'text-[var(--signal-error)]',
    neutral: 'text-muted-foreground',
  };

  return (
    <Card className={cn('glow-card transition-all duration-300', variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold font-mono-nums">{value}</div>
          {trend && trendValue && (
            <span className={cn('text-xs', trendStyles[trend])}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface GaugeCardProps {
  title: string;
  value: number;
  max?: number;
  unit?: string;
  thresholds?: {
    warning: number;
    success: number;
  };
  className?: string;
}

export function GaugeCard({
  title,
  value,
  max = 100,
  unit = '%',
  thresholds = { warning: 50, success: 80 },
  className,
}: GaugeCardProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getColor = () => {
    if (percentage >= thresholds.success) return 'var(--signal-reward)';
    if (percentage >= thresholds.warning) return 'var(--neuron-active)';
    return 'var(--neuron-surprised)';
  };

  return (
    <Card className={cn('glow-card', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold font-mono-nums">
              {value.toFixed(1)}
              <span className="text-sm text-muted-foreground ml-1">{unit}</span>
            </span>
          </div>
          <div className="overflow-hidden h-2 text-xs flex rounded-full bg-muted">
            <div
              className="transition-all duration-500 ease-out rounded-full"
              style={{
                width: `${percentage}%`,
                backgroundColor: getColor(),
                boxShadow: `0 0 10px ${getColor()}`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SystemStatsGridProps {
  stats: {
    neuronCount: number;
    predictionAccuracy: number;
    totalSurprise: number;
    learningEvents: number;
    totalReward: number;
    totalPunishment: number;
    consciousnessLevel: number;
    selfAwarenessIndex: number;
  };
  className?: string;
}

export function SystemStatsGrid({ stats, className }: SystemStatsGridProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      <StatCard
        title="神经元数量"
        value={stats.neuronCount}
        subtitle="活跃预测单元"
        variant="active"
        icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        }
      />
      <GaugeCard
        title="预测准确率"
        value={stats.predictionAccuracy}
        thresholds={{ warning: 60, success: 85 }}
      />
      <StatCard
        title="学习事件"
        value={stats.learningEvents}
        subtitle="总学习次数"
        trend={stats.learningEvents > 0 ? 'up' : 'neutral'}
        icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        }
      />
      <GaugeCard
        title="意识水平"
        value={stats.consciousnessLevel}
        thresholds={{ warning: 30, success: 70 }}
      />
    </div>
  );
}
