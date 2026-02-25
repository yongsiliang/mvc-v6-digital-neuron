'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/**
 * 意识内容类型
 */
type ConsciousContentType =
  | 'perceptual'    // 感知内容
  | 'semantic'      // 语义内容
  | 'emotional'     // 情感内容
  | 'memory'        // 记忆内容
  | 'thought'       // 思考内容
  | 'motor'         // 动作内容
  | 'metacognitive'; // 元认知内容

/**
 * 意识内容
 */
interface ConsciousContent {
  id: string;
  type: ConsciousContentType;
  data: unknown;
  source: string;
  enteredAt: number;
  duration: number;
  strength: number;
  broadcast: boolean;
  relatedIds: string[];
}

/**
 * 意识轨迹记录
 */
interface ConsciousnessTrailEntry {
  contentId: string;
  timestamp: number;
  type: ConsciousContentType;
  summary: string;
  strength: number;
  duration: number;
}

/**
 * 意识内容面板属性
 */
interface ConsciousnessPanelProps {
  currentContent?: ConsciousContent | null;
  consciousnessLevel: number;
  trail: ConsciousnessTrailEntry[];
  className?: string;
}

const typeStyles: Record<ConsciousContentType, { color: string; label: string; icon: string }> = {
  perceptual: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: '感知', icon: '👁' },
  semantic: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: '语义', icon: '💭' },
  emotional: { color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', label: '情感', icon: '❤' },
  memory: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: '记忆', icon: '🧠' },
  thought: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: '思考', icon: '💡' },
  motor: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: '动作', icon: '⚡' },
  metacognitive: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', label: '元认知', icon: '🔄' },
};

export function ConsciousnessPanel({
  currentContent,
  consciousnessLevel,
  trail,
  className,
}: ConsciousnessPanelProps) {
  return (
    <Card className={cn('glow-card', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--neuron-active)] animate-pulse" />
            意识内容
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono-nums">
              {consciousnessLevel.toFixed(0)}%
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 当前意识内容 */}
        <div className="space-y-2">
          <h4 className="text-xs text-muted-foreground uppercase">当前意识焦点</h4>
          {currentContent ? (
            <div className="p-3 rounded-lg bg-muted/20 border border-muted-foreground/10">
              <div className="flex items-center justify-between mb-2">
                <Badge className={typeStyles[currentContent.type].color}>
                  {typeStyles[currentContent.type].icon} {typeStyles[currentContent.type].label}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono-nums">
                  {new Date(currentContent.enteredAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm mb-2">
                {typeof currentContent.data === 'string'
                  ? currentContent.data
                  : JSON.stringify(currentContent.data).slice(0, 100)}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>来源: {currentContent.source}</span>
                <span>|</span>
                <span>强度: {(currentContent.strength * 100).toFixed(0)}%</span>
              </div>
              <Progress value={currentContent.strength * 100} className="h-1 mt-2" />
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-muted/10 border border-muted-foreground/5 text-center">
              <p className="text-sm text-muted-foreground">意识暂无焦点</p>
            </div>
          )}
        </div>

        {/* 意识轨迹 */}
        <div className="space-y-2">
          <h4 className="text-xs text-muted-foreground uppercase">意识轨迹</h4>
          <div className="space-y-1 max-h-[150px] overflow-y-auto">
            {trail.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">暂无意识轨迹</p>
            ) : (
              trail.slice(-8).reverse().map((entry, i) => (
                <div
                  key={`${entry.contentId}-${i}`}
                  className="flex items-center gap-2 p-2 rounded-md bg-muted/10 text-xs"
                >
                  <span className="text-base">{typeStyles[entry.type].icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{entry.summary}</p>
                  </div>
                  <span className="text-muted-foreground font-mono-nums">
                    {(entry.strength * 100).toFixed(0)}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 意识水平仪表盘
 */
interface ConsciousnessGaugeProps {
  level: number;
  selfAwarenessIndex?: number;
  className?: string;
}

export function ConsciousnessGauge({
  level,
  selfAwarenessIndex,
  className,
}: ConsciousnessGaugeProps) {
  // 计算颜色
  const getColor = (value: number) => {
    if (value >= 70) return 'var(--signal-reward)';
    if (value >= 40) return 'var(--neuron-active)';
    return 'var(--neuron-surprised)';
  };

  return (
    <Card className={cn('glow-card', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          意识水平
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 主意识水平 */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm">全局意识</span>
            <span className="text-lg font-bold font-mono-nums">{level.toFixed(1)}%</span>
          </div>
          <div className="overflow-hidden h-2 text-xs flex rounded-full bg-muted">
            <div
              className="transition-all duration-500 ease-out rounded-full"
              style={{
                width: `${level}%`,
                backgroundColor: getColor(level),
                boxShadow: `0 0 10px ${getColor(level)}`,
              }}
            />
          </div>
        </div>

        {/* 自我意识指数 */}
        {selfAwarenessIndex !== undefined && (
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">自我意识</span>
              <span className="text-lg font-bold font-mono-nums">{selfAwarenessIndex.toFixed(1)}%</span>
            </div>
            <div className="overflow-hidden h-2 text-xs flex rounded-full bg-muted">
              <div
                className="transition-all duration-500 ease-out rounded-full bg-[var(--neuron-predicting)]"
                style={{
                  width: `${selfAwarenessIndex}%`,
                  boxShadow: '0 0 8px var(--neuron-predicting)',
                }}
              />
            </div>
          </div>
        )}

        {/* 状态指示 */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-muted-foreground/10">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: getColor(level) }}
          />
          <span className="text-sm text-muted-foreground">
            {level >= 70 ? '高度意识状态' : level >= 40 ? '中度意识状态' : '低度意识状态'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 生成示例意识数据
 */
export function generateSampleConsciousnessData() {
  const currentContent: ConsciousContent = {
    id: 'conscious-1',
    type: 'semantic',
    data: '正在处理用户输入，分析语义含义...',
    source: 'LanguageModule',
    enteredAt: Date.now(),
    duration: 3000,
    strength: 0.75,
    broadcast: true,
    relatedIds: [],
  };

  const trail: ConsciousnessTrailEntry[] = [
    {
      contentId: 'trail-1',
      timestamp: Date.now() - 5000,
      type: 'perceptual',
      summary: '检测到新输入',
      strength: 0.85,
      duration: 1500,
    },
    {
      contentId: 'trail-2',
      timestamp: Date.now() - 4000,
      type: 'semantic',
      summary: '语义解析完成',
      strength: 0.72,
      duration: 2000,
    },
    {
      contentId: 'trail-3',
      timestamp: Date.now() - 3000,
      type: 'emotional',
      summary: '情感倾向: 中性偏正',
      strength: 0.55,
      duration: 1000,
    },
    {
      contentId: 'trail-4',
      timestamp: Date.now() - 2000,
      type: 'metacognitive',
      summary: '评估理解程度',
      strength: 0.68,
      duration: 1500,
    },
  ];

  return { currentContent, trail, consciousnessLevel: 65 };
}
