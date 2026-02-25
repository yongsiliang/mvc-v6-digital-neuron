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
    active: 'border-primary/30 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10',
    warning: 'border-amber-500/30 hover:border-amber-500/50',
    success: 'border-emerald-500/30 hover:border-emerald-500/50',
  };

  const trendStyles = {
    up: 'text-emerald-500',
    down: 'text-red-500',
    neutral: 'text-muted-foreground',
  };

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-300 bg-card/50 backdrop-blur-sm border-primary/10',
      'hover:bg-card/70',
      variantStyles[variant], 
      className
    )}>
      {/* 顶部渐变线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        {icon && <div className="text-primary/60">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold font-mono-nums text-foreground">{value}</div>
          {trend && trendValue && (
            <span className={cn('text-xs font-medium', trendStyles[trend])}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>
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
    if (percentage >= thresholds.success) return 'hsl(var(--primary))';
    if (percentage >= thresholds.warning) return 'hsl(var(--primary) / 0.7)';
    return 'hsl(var(--primary) / 0.4)';
  };

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-300 bg-card/50 backdrop-blur-sm border-primary/10',
      'hover:bg-card/70 hover:border-primary/30',
      className
    )}>
      {/* 顶部渐变线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pt-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl font-bold font-mono-nums text-foreground">
              {value.toFixed(1)}
              <span className="text-sm text-muted-foreground ml-1">{unit}</span>
            </span>
          </div>
          <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-primary/10">
            <div
              className="transition-all duration-700 ease-out rounded-full relative"
              style={{
                width: `${percentage}%`,
                backgroundColor: getColor(),
                boxShadow: `0 0 12px ${getColor()}`,
              }}
            >
              {/* 动态发光点 */}
              <div 
                className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/80"
                style={{ boxShadow: `0 0 6px hsl(var(--primary))` }}
              />
            </div>
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
        title="Neurons"
        value={stats.neuronCount}
        subtitle="Active predictive units"
        variant="active"
        icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        }
      />
      <GaugeCard
        title="Accuracy"
        value={stats.predictionAccuracy}
        thresholds={{ warning: 60, success: 85 }}
      />
      <StatCard
        title="Learning Events"
        value={stats.learningEvents}
        subtitle="Total learning cycles"
        trend={stats.learningEvents > 0 ? 'up' : 'neutral'}
        icon={
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        }
      />
      <GaugeCard
        title="Consciousness"
        value={stats.consciousnessLevel}
        thresholds={{ warning: 30, success: 70 }}
      />
    </div>
  );
}
