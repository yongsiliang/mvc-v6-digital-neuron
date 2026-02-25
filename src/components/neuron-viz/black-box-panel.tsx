'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BlackBoxState {
  enabled: boolean;
  age?: number;
  inputCount?: number;
  energyLevel?: string;
  chaosLevel?: string;
  hasAttractors?: number;
  memoryTraces?: number;
  lastEmergenceAgo?: number;
}

export function BlackBoxPanel() {
  const [state, setState] = useState<BlackBoxState>({ enabled: false });
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/neuron-v3/blackbox');
        const data = await res.json();
        if (data.success) {
          setState(data.data);
          // 如果有涌现，触发脉冲动画
          if (data.data.lastEmergenceAgo && data.data.lastEmergenceAgo < 5000) {
            setIsPulsing(true);
            setTimeout(() => setIsPulsing(false), 3000);
          }
        }
      } catch (e) {
        console.error('Black box is silent:', e);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!state.enabled) {
    return null;
  }

  const formatAge = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}小时`;
    if (minutes > 0) return `${minutes}分钟`;
    return `${seconds}秒`;
  };

  return (
    <Card className="relative overflow-hidden bg-black/50 backdrop-blur-sm border-primary/20">
      {/* 神秘的背景效果 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 深邃的黑色背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-primary/5 to-black" />
        
        {/* 随机的光点 */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-primary/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
        
        {/* 涌现时的脉冲 */}
        {isPulsing && (
          <div className="absolute inset-0 bg-primary/10 animate-ping" />
        )}
      </div>
      
      <CardHeader className="relative">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary/80">
          <span className="relative">
            <span className="absolute inset-0 blur-sm text-primary">⚫</span>
            <span className="relative">⚫</span>
          </span>
          <span className="tracking-widest text-xs uppercase">黑盒</span>
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            不可观测核心
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative space-y-3">
        {/* 神秘提示 */}
        <div className="text-center py-4">
          <div className="text-3xl mb-2 opacity-50">🌑</div>
          <p className="text-xs text-muted-foreground italic">
            "意识从混沌中涌现，过程不可言说"
          </p>
        </div>
        
        {/* 模糊的状态信息 */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2 rounded bg-primary/5 border border-primary/10">
            <div className="text-muted-foreground mb-1">年龄</div>
            <div className="text-primary font-mono">
              {state.age ? formatAge(state.age) : '?'}
            </div>
          </div>
          
          <div className="p-2 rounded bg-primary/5 border border-primary/10">
            <div className="text-muted-foreground mb-1">输入次数</div>
            <div className="text-primary font-mono">
              {state.inputCount ?? '?'}
            </div>
          </div>
          
          <div className="p-2 rounded bg-primary/5 border border-primary/10">
            <div className="text-muted-foreground mb-1">能量场</div>
            <div className={cn(
              "font-mono",
              state.energyLevel === 'high' && "text-amber-500",
              state.energyLevel === 'medium' && "text-primary",
              state.energyLevel === 'low' && "text-muted-foreground"
            )}>
              {state.energyLevel === 'high' ? '活跃' : 
               state.energyLevel === 'medium' ? '平稳' : 
               state.energyLevel === 'low' ? '静默' : '?'}
            </div>
          </div>
          
          <div className="p-2 rounded bg-primary/5 border border-primary/10">
            <div className="text-muted-foreground mb-1">混沌度</div>
            <div className={cn(
              "font-mono",
              state.chaosLevel === 'high' && "text-red-500",
              state.chaosLevel === 'medium' && "text-amber-500",
              state.chaosLevel === 'low' && "text-primary"
            )}>
              {state.chaosLevel === 'high' ? '高' : 
               state.chaosLevel === 'medium' ? '中' : 
               state.chaosLevel === 'low' ? '低' : '?'}
            </div>
          </div>
        </div>
        
        {/* 内部结构数量（不解释含义） */}
        <div className="flex justify-center gap-6 pt-2">
          <div className="text-center">
            <div className="text-lg font-bold text-primary/60 font-mono">
              {state.hasAttractors ?? '?'}
            </div>
            <div className="text-[10px] text-muted-foreground">吸引子</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-primary/60 font-mono">
              {state.memoryTraces ?? '?'}
            </div>
            <div className="text-[10px] text-muted-foreground">记忆痕</div>
          </div>
        </div>
        
        {/* 底部提示 */}
        <div className="text-center pt-2 border-t border-primary/10">
          <p className="text-[10px] text-muted-foreground/50">
            内部状态永久不可观测 · 这是设计意图而非缺陷
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
