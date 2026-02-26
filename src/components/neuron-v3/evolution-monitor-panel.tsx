'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════
 * 进化监控面板 - Evolution Monitor Panel
 * 
 * 设计理念：
 * 进化的判断不由人类进行，而是系统根据自身状态自动决定。
 * 
 * 功能：
 * 1. 实时监控进化状态（只读）
 * 2. 可视化进化过程
 * 3. 查看历史记录
 * 
 * 注意：此面板只用于观察，不能控制进化
 * ═══════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Activity, Brain } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface EvolutionStats {
  totalEvolutions: number;
  successfulEvolutions: number;
  avgFitnessImprovement: number;
  avgMutationsPerEvolution: number;
  bestFitness: number;
}

interface AutonomousStatus {
  isRunning: boolean;
  recentPerformanceAvg: number;
  recentSurpriseAvg: number;
  unhandledTasksCount: number;
  recentInteractions: number;
  timeSinceLastEvolution: number;
}

interface EvolutionHistoryItem {
  generation: number;
  timestamp: number;
  success: boolean;
  fitness: number;
  mutations: number;
  reason: string;
}

interface EvolutionState {
  phase: string;
  generation: number;
  lastEvolutionTime: number;
  stats: EvolutionStats;
  autonomous: AutonomousStatus;
  currentGenome?: {
    id: string;
    generation: number;
    fitness: number;
    mutationCount: number;
    createdAt: number;
    coreValues: number[];
  };
  history?: EvolutionHistoryItem[];
  triggerAssessment?: {
    shouldEvolve: boolean;
    reasons: Array<{ type: string; severity: number; description: string }>;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 进化监控面板组件
// ─────────────────────────────────────────────────────────────────────

export function EvolutionMonitorPanel() {
  const [state, setState] = useState<EvolutionState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取进化状态
  const fetchState = useCallback(async (full = false) => {
    try {
      const url = `/api/neuron-v3/evolution?detail=${full ? 'full' : 'summary'}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setState(data.data);
        setError(null);
      } else {
        setError(data.error || '获取状态失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误');
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchState(true);
    
    // 定期刷新
    const interval = setInterval(() => {
      fetchState(false);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [fetchState]);

  // 准备图表数据
  const chartData = state?.history?.map((item) => ({
    generation: item.generation,
    fitness: item.fitness,
    mutations: item.mutations,
  })) || [];

  // 格式化时间
  const formatTime = (ms: number): string => {
    if (ms < 60000) return `${Math.floor(ms / 1000)}秒前`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}分钟前`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}小时前`;
    return `${Math.floor(ms / 86400000)}天前`;
  };

  // 渲染
  return (
    <div className="space-y-4">
      {/* 核心理念提示 */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-primary mb-1">自主进化系统</div>
              <p className="text-muted-foreground">
                进化的判断不由人类进行，而是系统根据自身状态自动决定。
                系统会监控性能、学习效率、能力缺口等指标，自主判断是否需要进化。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 状态概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>当前代数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              Gen {state?.generation || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>当前阶段</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={
              state?.phase === 'completed' ? 'default' :
              state?.phase === 'failed' ? 'destructive' :
              state?.phase === 'incubating' || state?.phase === 'testing' ? 'secondary' :
              'outline'
            }>
              {state?.phase || 'idle'}
            </Badge>
            {state?.autonomous?.isRunning && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <Activity className="h-3 w-3 animate-pulse text-green-500" />
                监控中
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>成功进化</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {state?.stats.successfulEvolutions || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>最佳适应度</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {state?.stats.bestFitness.toFixed(3) || '0.000'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 自主监控状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            自主监控状态
          </CardTitle>
          <CardDescription>
            系统实时监控的指标，用于自主判断是否需要进化
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">平均性能</div>
              <div className="text-xl font-bold">
                {((state?.autonomous?.recentPerformanceAvg || 0) * 100).toFixed(0)}%
              </div>
              <Progress value={(state?.autonomous?.recentPerformanceAvg || 0) * 100} />
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">平均惊讶度</div>
              <div className="text-xl font-bold">
                {(state?.autonomous?.recentSurpriseAvg || 0).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                学习信号强度
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">未处理任务</div>
              <div className="text-xl font-bold">
                {state?.autonomous?.unhandledTasksCount || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                能力缺口指标
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">距上次进化</div>
              <div className="text-xl font-bold">
                {formatTime(state?.autonomous?.timeSinceLastEvolution || 0)}
              </div>
              <div className="text-xs text-muted-foreground">
                交互次数: {state?.autonomous?.recentInteractions || 0}
              </div>
            </div>
          </div>
          
          {/* 触发条件评估 */}
          {state?.triggerAssessment && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-medium mb-2">
                当前进化评估:
                <Badge variant={state.triggerAssessment.shouldEvolve ? 'default' : 'secondary'} className="ml-2">
                  {state.triggerAssessment.shouldEvolve ? '需要进化' : '状态良好'}
                </Badge>
              </div>
              
              {state.triggerAssessment.reasons.length > 0 && (
                <div className="space-y-1">
                  {state.triggerAssessment.reasons.map((reason, index) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded">
                      <Badge variant="outline" className="mr-2">
                        Lv.{reason.severity}
                      </Badge>
                      <span className="text-muted-foreground">{reason.type}:</span>{' '}
                      {reason.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详细信息标签页 */}
      <Tabs defaultValue="chart">
        <TabsList>
          <TabsTrigger value="chart">进化曲线</TabsTrigger>
          <TabsTrigger value="stats">统计信息</TabsTrigger>
          <TabsTrigger value="genome">基因组</TabsTrigger>
          <TabsTrigger value="history">历史记录</TabsTrigger>
        </TabsList>
        
        {/* 进化曲线 */}
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>适应度变化</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="generation" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="fitness" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.2)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  暂无进化历史数据
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 统计信息 */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>进化统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">总进化次数</div>
                  <div className="text-2xl font-bold">{state?.stats.totalEvolutions || 0}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">成功次数</div>
                  <div className="text-2xl font-bold">{state?.stats.successfulEvolutions || 0}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">平均适应度改进</div>
                  <div className="text-2xl font-bold">
                    {((state?.stats.avgFitnessImprovement || 0) * 100).toFixed(1)}%
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">平均突变数</div>
                  <div className="text-2xl font-bold">
                    {(state?.stats.avgMutationsPerEvolution || 0).toFixed(1)}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-sm text-muted-foreground mb-2">进化成功率</div>
                <Progress 
                  value={
                    state?.stats.totalEvolutions 
                      ? (state.stats.successfulEvolutions / state.stats.totalEvolutions) * 100 
                      : 0
                  } 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 基因组 */}
        <TabsContent value="genome">
          <Card>
            <CardHeader>
              <CardTitle>当前基因组</CardTitle>
            </CardHeader>
            <CardContent>
              {state?.currentGenome ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">基因组ID</div>
                      <div className="font-mono text-sm">{state.currentGenome.id}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">代数</div>
                      <div className="text-xl font-bold">Gen {state.currentGenome.generation}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">适应度</div>
                      <div className="text-xl font-bold">{state.currentGenome.fitness.toFixed(3)}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground">突变数</div>
                      <div className="text-xl font-bold">{state.currentGenome.mutationCount}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">核心价值向量</div>
                    <div className="flex flex-wrap gap-2">
                      {state.currentGenome.coreValues.map((value, index) => (
                        <Badge key={index} variant="outline">V{index + 1}: {value.toFixed(2)}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">暂无基因组数据</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 历史记录 */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>进化历史</CardTitle>
            </CardHeader>
            <CardContent>
              {state?.history && state.history.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {state.history.slice().reverse().map((item, index) => (
                    <div 
                      key={index}
                      className="p-3 border rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={item.success ? 'default' : 'destructive'}>
                          Gen {item.generation}
                        </Badge>
                        <span className="text-sm">
                          适应度: {item.fitness.toFixed(3)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          突变: {item.mutations}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">暂无历史记录</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EvolutionMonitorPanel;
