'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PredictionEvent {
  id: string;
  timestamp: number;
  neuronId: string;
  prediction: number;
  actual: number;
  error: number;
  surprise: number;
}

interface LearningEvent {
  id: string;
  timestamp: number;
  type: 'reward' | 'punishment';
  value: number;
  source: string;
}

interface PredictionMonitorProps {
  predictions: PredictionEvent[];
  learningEvents: LearningEvent[];
  className?: string;
}

export function PredictionMonitor({ predictions, learningEvents, className }: PredictionMonitorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 200 });

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current?.parentElement) {
        const { clientWidth } = canvasRef.current.parentElement;
        setDimensions({ width: clientWidth, height: 200 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    if (predictions.length === 0) {
      ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
      ctx.font = '14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('等待预测数据...', width / 2, height / 2);
      return;
    }

    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 绘制坐标轴
    ctx.strokeStyle = 'rgba(100, 150, 150, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // 绘制误差曲线
    const maxError = Math.max(...predictions.map(p => Math.abs(p.error)), 0.1);
    const errorScale = chartHeight / (maxError * 2);

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 130, 100, 0.8)';
    ctx.lineWidth = 2;

    predictions.forEach((pred, i) => {
      const x = padding.left + (i / (predictions.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight / 2 - pred.error * errorScale;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 绘制中心线
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(100, 200, 200, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.moveTo(padding.left, padding.top + chartHeight / 2);
    ctx.lineTo(width - padding.right, padding.top + chartHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制奖励/惩罚标记
    learningEvents.forEach(event => {
      const predIndex = predictions.findIndex(p => p.timestamp <= event.timestamp);
      if (predIndex === -1) return;

      const x = padding.left + (predIndex / (predictions.length - 1 || 1)) * chartWidth;
      
      ctx.beginPath();
      ctx.arc(x, padding.top + chartHeight / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = event.type === 'reward' 
        ? 'rgba(255, 180, 100, 0.8)' 
        : 'rgba(255, 100, 100, 0.8)';
      ctx.fill();
    });

    // 绘制Y轴标签
    ctx.fillStyle = 'rgba(200, 200, 200, 0.6)';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText(`+${maxError.toFixed(2)}`, padding.left - 5, padding.top + 10);
    ctx.fillText('0', padding.left - 5, padding.top + chartHeight / 2 + 4);
    ctx.fillText(`-${maxError.toFixed(2)}`, padding.left - 5, height - padding.bottom);

  }, [predictions, learningEvents, dimensions]);

  return (
    <Card className={cn('glow-card', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--neuron-surprised)]" />
            预测误差监控
          </span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--signal-reward)]" />
              奖励
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--signal-error)]" />
              惩罚
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <canvas ref={canvasRef} className="w-full h-[200px]" />
      </CardContent>
    </Card>
  );
}

interface ActivityTimelineProps {
  events: Array<{
    id: string;
    timestamp: number;
    type: 'activate' | 'predict' | 'learn' | 'surprise';
    neuronId: string;
    details?: string;
  }>;
  className?: string;
}

export function ActivityTimeline({ events, className }: ActivityTimelineProps) {
  const typeColors = {
    activate: 'bg-[var(--neuron-active)]',
    predict: 'bg-[var(--neuron-predicting)]',
    learn: 'bg-[var(--signal-reward)]',
    surprise: 'bg-[var(--neuron-surprised)]',
  };

  const typeLabels = {
    activate: '激活',
    predict: '预测',
    learn: '学习',
    surprise: '惊讶',
  };

  return (
    <Card className={cn('glow-card', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--neuron-active)] animate-pulse" />
          活动时间线
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              等待活动数据...
            </p>
          ) : (
            events.slice(-20).reverse().map(event => (
              <div
                key={event.id}
                className="flex items-center gap-3 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className={cn('w-2 h-2 rounded-full', typeColors[event.type])} />
                <span className="text-xs text-muted-foreground font-mono-nums">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-sm font-medium">{typeLabels[event.type]}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {event.neuronId}
                </span>
                {event.details && (
                  <span className="text-xs text-muted-foreground ml-auto truncate max-w-[150px]">
                    {event.details}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 生成示例数据
export function generateSamplePredictions(): PredictionEvent[] {
  const predictions: PredictionEvent[] = [];
  const now = Date.now();

  for (let i = 0; i < 50; i++) {
    const prediction = Math.random();
    const actual = prediction + (Math.random() - 0.5) * 0.3;
    predictions.push({
      id: `pred-${i}`,
      timestamp: now - (50 - i) * 1000,
      neuronId: `n${Math.floor(Math.random() * 8)}`,
      prediction,
      actual,
      error: actual - prediction,
      surprise: Math.abs(actual - prediction) * 2,
    });
  }

  return predictions;
}

export function generateSampleLearningEvents(): LearningEvent[] {
  const events: LearningEvent[] = [];
  const now = Date.now();

  for (let i = 0; i < 10; i++) {
    events.push({
      id: `learn-${i}`,
      timestamp: now - (10 - i) * 5000,
      type: Math.random() > 0.3 ? 'reward' : 'punishment',
      value: Math.random() * 0.5,
      source: ['explicit', 'implicit', 'self-eval'][Math.floor(Math.random() * 3)],
    });
  }

  return events;
}
