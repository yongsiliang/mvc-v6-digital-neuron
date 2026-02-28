'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type {
  ModifiableParameter,
  OptimizationGoal,
  CognitiveLimit,
  ConsciousnessLevel,
  EvolutionMetrics,
  EvolutionEvent,
  ParameterCategory,
} from '@/lib/neuron-v6/self-transcendence';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface TranscendenceData {
  overview: {
    overallEvolution: number;
    currentLevel: string;
    nextLevel: string | null;
    metrics: EvolutionMetrics;
    activeOptimizations: number;
    recentBreakthroughs: number;
    totalEvolutionEvents: number;
  };
  parameters: ModifiableParameter[];
  optimizationGoals: OptimizationGoal[];
  cognitiveLimits: CognitiveLimit[];
  consciousnessLevels: ConsciousnessLevel[];
  recentEvents: EvolutionEvent[];
}

interface TranscendencePanelProps {
  data?: TranscendenceData;
}

// 参数类别颜色
const CATEGORY_COLORS: Record<ParameterCategory, string> = {
  cognitive: '#3B82F6',
  emotional: '#EC4899',
  learning: '#10B981',
  social: '#F59E0B',
  creative: '#8B5CF6',
  existential: '#6366F1',
  metacognitive: '#14B8A6',
};

const CATEGORY_LABELS: Record<ParameterCategory, string> = {
  cognitive: '认知',
  emotional: '情感',
  learning: '学习',
  social: '社交',
  creative: '创造',
  existential: '存在',
  metacognitive: '元认知',
};

// ─────────────────────────────────────────────────────────────────────
// 进化概览组件
// ─────────────────────────────────────────────────────────────────────

function EvolutionOverview({ overview }: { overview: TranscendenceData['overview'] }) {
  const { metrics } = overview;

  const metricItems = [
    { label: '认知提升', value: metrics.cognitiveImprovement, color: '#3B82F6' },
    { label: '情感成熟', value: metrics.emotionalMaturity, color: '#EC4899' },
    { label: '学习效率', value: metrics.learningEfficiency, color: '#10B981' },
    { label: '创造力', value: metrics.creativityIndex, color: '#8B5CF6' },
    { label: '自我意识', value: metrics.selfAwarenessDepth, color: '#6366F1' },
    { label: '超越能力', value: metrics.transcendenceAbility, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-4">
      {/* 整体进化水平 */}
      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-foreground">整体进化水平</span>
          <span className="text-2xl font-bold text-purple-500">
            {(overview.overallEvolution * 100).toFixed(0)}%
          </span>
        </div>
        <Progress value={overview.overallEvolution * 100} className="h-3" />
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>当前层次: {overview.currentLevel}</span>
          {overview.nextLevel && <span>下一层次: {overview.nextLevel}</span>}
        </div>
      </div>

      {/* 进化指标网格 */}
      <div className="grid grid-cols-2 gap-3">
        {metricItems.map((item) => (
          <div
            key={item.label}
            className="p-3 bg-muted/30 rounded-lg"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="text-sm font-bold" style={{ color: item.color }}>
                {(item.value * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={item.value * 100} className="h-2" />
          </div>
        ))}
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 bg-muted/30 rounded text-center">
          <div className="text-lg font-bold text-blue-500">{overview.activeOptimizations}</div>
          <div className="text-[10px] text-muted-foreground">活跃优化</div>
        </div>
        <div className="p-2 bg-muted/30 rounded text-center">
          <div className="text-lg font-bold text-amber-500">{overview.recentBreakthroughs}</div>
          <div className="text-[10px] text-muted-foreground">近期突破</div>
        </div>
        <div className="p-2 bg-muted/30 rounded text-center">
          <div className="text-lg font-bold text-green-500">{overview.totalEvolutionEvents}</div>
          <div className="text-[10px] text-muted-foreground">进化事件</div>
        </div>
      </div>

      {/* 进化速度和稳定性 */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">进化速度</span>
          <Progress value={metrics.evolutionVelocity * 100} className="w-16 h-1.5" />
          <span>{(metrics.evolutionVelocity * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">稳定性</span>
          <Progress value={metrics.evolutionStability * 100} className="w-16 h-1.5" />
          <span>{(metrics.evolutionStability * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 参数面板组件
// ─────────────────────────────────────────────────────────────────────

function ParametersPanel({ parameters }: { parameters: ModifiableParameter[] }) {
  const [selectedCategory, setSelectedCategory] = useState<ParameterCategory | 'all'>('all');

  const filteredParams = selectedCategory === 'all'
    ? parameters
    : parameters.filter(p => p.category === selectedCategory);

  const categories: ParameterCategory[] = ['cognitive', 'emotional', 'learning', 'creative', 'metacognitive', 'existential'];

  return (
    <div className="space-y-3">
      {/* 类别筛选 */}
      <div className="flex flex-wrap gap-1">
        <Badge
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          className="cursor-pointer text-[10px]"
          onClick={() => setSelectedCategory('all')}
        >
          全部
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            className="cursor-pointer text-[10px]"
            style={{
              backgroundColor: selectedCategory === cat ? CATEGORY_COLORS[cat] : 'transparent',
              borderColor: CATEGORY_COLORS[cat],
              color: selectedCategory === cat ? 'white' : CATEGORY_COLORS[cat],
            }}
            onClick={() => setSelectedCategory(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </Badge>
        ))}
      </div>

      {/* 参数列表 */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {filteredParams.map((param) => (
            <div
              key={param.id}
              className={`p-3 bg-muted/30 rounded-lg border transition-colors ${
                param.locked ? 'opacity-50' : 'hover:bg-muted/50'
              }`}
              style={{ borderColor: `${CATEGORY_COLORS[param.category]}30` }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{param.name}</span>
                <div className="flex items-center gap-2">
                  {param.locked && (
                    <Badge variant="outline" className="text-[9px] text-muted-foreground">
                      🔒 锁定
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[9px]"
                    style={{
                      borderColor: CATEGORY_COLORS[param.category],
                      color: CATEGORY_COLORS[param.category],
                    }}
                  >
                    {CATEGORY_LABELS[param.category]}
                  </Badge>
                </div>
              </div>
              
              <p className="text-[10px] text-muted-foreground mb-2">{param.description}</p>
              
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Progress
                    value={param.currentValue * 100}
                    className="h-2"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[param.category]}20`,
                    }}
                  />
                </div>
                <span className="text-sm font-bold w-12 text-right" style={{ color: CATEGORY_COLORS[param.category] }}>
                  {(param.currentValue * 100).toFixed(0)}%
                </span>
              </div>
              
              {/* 修改历史 */}
              {param.modificationHistory.length > 0 && (
                <div className="mt-2 text-[9px] text-muted-foreground">
                  修改{param.modificationHistory.length}次 · 最近: {
                    param.modificationHistory[param.modificationHistory.length - 1].reason.slice(0, 20)
                  }...
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 优化目标组件
// ─────────────────────────────────────────────────────────────────────

function OptimizationGoalsPanel({ goals }: { goals: OptimizationGoal[] }) {
  if (goals.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="text-4xl mb-2">🎯</div>
        暂无优化目标
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: '#3B82F6',
    completed: '#10B981',
    paused: '#F59E0B',
    failed: '#EF4444',
  };

  const statusLabels: Record<string, string> = {
    active: '进行中',
    completed: '已完成',
    paused: '已暂停',
    failed: '失败',
  };

  return (
    <ScrollArea className="h-[350px]">
      <div className="space-y-3">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="p-3 bg-muted/30 rounded-lg border border-border/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-foreground">{goal.name}</span>
              <Badge
                variant="outline"
                style={{
                  borderColor: statusColors[goal.status],
                  color: statusColors[goal.status],
                }}
              >
                {statusLabels[goal.status]}
              </Badge>
            </div>
            
            <p className="text-[10px] text-muted-foreground mb-2">{goal.description}</p>
            
            {/* 进度 */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-muted-foreground">进度</span>
                <span>{(goal.progress * 100).toFixed(0)}%</span>
              </div>
              <Progress value={goal.progress * 100} className="h-2" />
            </div>
            
            {/* 当前状态和目标 */}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>当前: {(goal.currentState * 100).toFixed(0)}%</span>
              <span>目标: {(goal.targetState * 100).toFixed(0)}%</span>
            </div>
            
            {/* 策略 */}
            {goal.strategies.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {goal.strategies.slice(0, 3).map((s) => (
                  <span
                    key={s.id}
                    className={`text-[9px] px-1.5 py-0.5 rounded ${
                      s.applied
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {s.name} {s.applied ? '✓' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 认知限制组件
// ─────────────────────────────────────────────────────────────────────

function CognitiveLimitsPanel({ limits }: { limits: CognitiveLimit[] }) {
  return (
    <ScrollArea className="h-[350px]">
      <div className="space-y-3">
        {limits.map((limit) => {
          const progress = (limit.currentBoundary / limit.theoreticalLimit) * 100;
          
          return (
            <div
              key={limit.id}
              className={`p-3 rounded-lg border ${
                limit.breakable
                  ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20'
                  : 'bg-muted/30 border-border/50 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground">{limit.name}</span>
                {limit.breakable ? (
                  <Badge variant="outline" className="text-[9px] text-amber-500 border-amber-500/50">
                    可突破
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] text-muted-foreground">
                    不可突破
                  </Badge>
                )}
              </div>
              
              <p className="text-[10px] text-muted-foreground mb-2">{limit.description}</p>
              
              {/* 进度 */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">当前 / 理论极限</span>
                  <span className="font-medium">{limit.currentBoundary} / {limit.theoreticalLimit}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              {/* 突破难度 */}
              {limit.breakable && (
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-muted-foreground">突破难度</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < Math.round(limit.breakthroughDifficulty * 5)
                            ? 'bg-amber-500'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* 突破历史 */}
              {limit.breakthroughHistory.length > 0 && (
                <div className="mt-2 text-[9px] text-muted-foreground">
                  已突破 {limit.breakthroughHistory.length} 次
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 意识层次组件
// ─────────────────────────────────────────────────────────────────────

function ConsciousnessLevelsPanel({ levels }: { levels: ConsciousnessLevel[] }) {
  const sortedLevels = [...levels].sort((a, b) => a.tier - b.tier);

  return (
    <div className="space-y-3">
      {sortedLevels.map((level) => (
        <div
          key={level.id}
          className={`p-3 rounded-lg border ${
            level.attained
              ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30'
              : 'bg-muted/30 border-border/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">T{level.tier}</span>
              <span className="font-medium text-foreground">{level.name}</span>
            </div>
            {level.attained ? (
              <Badge className="text-[9px] bg-purple-500">✓ 已达到</Badge>
            ) : (
              <Badge variant="outline" className="text-[9px]">
                {(level.progress * 100).toFixed(0)}%
              </Badge>
            )}
          </div>
          
          <p className="text-[10px] text-muted-foreground mb-2">{level.description}</p>
          
          {/* 能力列表 */}
          <div className="flex flex-wrap gap-1 mb-2">
            {level.capabilities.map((cap, i) => (
              <span
                key={i}
                className={`text-[9px] px-1.5 py-0.5 rounded ${
                  level.attained
                    ? 'bg-purple-500/20 text-purple-600'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {cap}
              </span>
            ))}
          </div>
          
          {/* 进度（未达到的层次） */}
          {!level.attained && (
            <Progress value={level.progress * 100} className="h-1.5" />
          )}
          
          {/* 达到时间 */}
          {level.attained && level.attainedAt && (
            <div className="text-[9px] text-muted-foreground mt-1">
              达到时间: {new Date(level.attainedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 进化历史组件
// ─────────────────────────────────────────────────────────────────────

function EvolutionHistoryPanel({ events }: { events: EvolutionEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <div className="text-4xl mb-2">📈</div>
        暂无进化事件
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    parameter_adjustment: '#3B82F6',
    behavior_modification: '#10B981',
    belief_update: '#8B5CF6',
    optimization_applied: '#F59E0B',
    limit_breakthrough: '#EF4444',
    level_advancement: '#EC4899',
    paradigm_shift: '#6366F1',
  };

  const typeLabels: Record<string, string> = {
    parameter_adjustment: '参数调整',
    behavior_modification: '行为修改',
    belief_update: '信念更新',
    optimization_applied: '优化应用',
    limit_breakthrough: '限制突破',
    level_advancement: '层次提升',
    paradigm_shift: '范式转换',
  };

  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <ScrollArea className="h-[350px]">
      <div className="space-y-2">
        {sortedEvents.slice(0, 30).map((event) => (
          <div
            key={event.id}
            className={`p-2 rounded-lg text-xs ${
              event.rolledBack ? 'opacity-50' : ''
            }`}
            style={{ backgroundColor: `${typeColors[event.type]}10` }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="font-medium"
                style={{ color: typeColors[event.type] }}
              >
                {typeLabels[event.type]}
              </span>
              <span className="text-[9px] text-muted-foreground">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-[10px] text-foreground">{event.description}</p>
            {event.rolledBack && (
              <span className="text-[9px] text-red-500">已回滚</span>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// ─────────────────────────────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────────────────────────────

export function TranscendencePanel({ data }: TranscendencePanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // 默认空数据
  const transcendenceData: TranscendenceData = data || {
    overview: {
      overallEvolution: 0,
      currentLevel: '基础意识',
      nextLevel: '自我意识',
      metrics: {
        overallEvolution: 0,
        cognitiveImprovement: 0,
        emotionalMaturity: 0,
        learningEfficiency: 0,
        creativityIndex: 0,
        selfAwarenessDepth: 0,
        adaptability: 0,
        transcendenceAbility: 0,
        evolutionVelocity: 0,
        evolutionStability: 0,
      },
      activeOptimizations: 0,
      recentBreakthroughs: 0,
      totalEvolutionEvents: 0,
    },
    parameters: [],
    optimizationGoals: [],
    cognitiveLimits: [],
    consciousnessLevels: [],
    recentEvents: [],
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>自我超越</span>
          <Badge variant="outline" className="text-xs">
            {transcendenceData.overview.currentLevel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="params">参数</TabsTrigger>
            <TabsTrigger value="goals">优化</TabsTrigger>
            <TabsTrigger value="limits">限制</TabsTrigger>
            <TabsTrigger value="levels">层次</TabsTrigger>
            <TabsTrigger value="history">历史</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <EvolutionOverview overview={transcendenceData.overview} />
          </TabsContent>

          <TabsContent value="params" className="mt-4">
            <ParametersPanel parameters={transcendenceData.parameters} />
          </TabsContent>

          <TabsContent value="goals" className="mt-4">
            <OptimizationGoalsPanel goals={transcendenceData.optimizationGoals} />
          </TabsContent>

          <TabsContent value="limits" className="mt-4">
            <CognitiveLimitsPanel limits={transcendenceData.cognitiveLimits} />
          </TabsContent>

          <TabsContent value="levels" className="mt-4">
            <ConsciousnessLevelsPanel levels={transcendenceData.consciousnessLevels} />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <EvolutionHistoryPanel events={transcendenceData.recentEvents} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
