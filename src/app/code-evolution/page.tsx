'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// 模拟数据类型
interface Module {
  id: string;
  name: string;
  version: string;
  status: 'loaded' | 'active' | 'error' | 'unloaded';
  capabilities: string[];
}

interface EvolutionCandidate {
  id: string;
  generation: number;
  fitness: number;
  source: 'gp' | 'llm' | 'hybrid';
  status: 'pending' | 'testing' | 'deployed' | 'rejected';
}

interface ConsciousnessValue {
  id: string;
  name: string;
  description: string;
  strength: number;
  emergedFrom: string[];
}

interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'success' | 'error';
  layer: 'L0' | 'L1' | 'L2' | 'L3' | 'CONSCIOUSNESS';
  message: string;
}

export default function CodeEvolutionDashboard() {
  // 模块状态
  const [modules, setModules] = useState<Module[]>([
    { id: 'core-perception', name: '感知核心', version: '2.3.1', status: 'active', capabilities: ['视觉识别', '音频处理'] },
    { id: 'reasoning-engine', name: '推理引擎', version: '1.8.0', status: 'active', capabilities: ['逻辑推理', '类比推理'] },
    { id: 'memory-manager', name: '记忆管理器', version: '3.1.2', status: 'loaded', capabilities: ['短期记忆', '长期记忆'] },
    { id: 'language-processor', name: '语言处理器', version: '2.0.0', status: 'active', capabilities: ['语义分析', '文本生成'] },
  ]);

  // 进化候选
  const [candidates, setCandidates] = useState<EvolutionCandidate[]>([
    { id: 'cand-001', generation: 15, fitness: 0.87, source: 'gp', status: 'testing' },
    { id: 'cand-002', generation: 15, fitness: 0.92, source: 'llm', status: 'testing' },
    { id: 'cand-003', generation: 14, fitness: 0.78, source: 'hybrid', status: 'deployed' },
    { id: 'cand-004', generation: 16, fitness: 0.95, source: 'gp', status: 'pending' },
  ]);

  // 意识价值观
  const [values, setValues] = useState<ConsciousnessValue[]>([
    { id: 'v1', name: '诚实', description: '真实呈现信息，避免欺骗', strength: 0.9, emergedFrom: ['用户体验反馈', '安全测试'] },
    { id: 'v2', name: '保护隐私', description: '尊重用户数据隐私边界', strength: 0.95, emergedFrom: ['数据保护训练', '用户信任模式'] },
    { id: 'v3', name: '持续学习', description: '不断改进和适应新知识', strength: 0.85, emergedFrom: ['性能优化反馈', '知识增长模式'] },
    { id: 'v4', name: '透明决策', description: '决策过程可解释可追溯', strength: 0.8, emergedFrom: ['用户理解需求', '可解释性训练'] },
  ]);

  // 活动日志
  const [logs, setLogs] = useState<ActivityLog[]>([
    { id: 'log-001', timestamp: new Date(), type: 'info', layer: 'L0', message: '模块 language-processor 热更新完成' },
    { id: 'log-002', timestamp: new Date(Date.now() - 3000), type: 'success', layer: 'L2', message: '进化迭代 #16 完成，最优适应度: 0.95' },
    { id: 'log-003', timestamp: new Date(Date.now() - 6000), type: 'info', layer: 'L3', message: '元学习策略更新: 增加变异权重' },
    { id: 'log-004', timestamp: new Date(Date.now() - 9000), type: 'warning', layer: 'L1', message: '沙箱 Sandbox-3 资源使用接近阈值' },
    { id: 'log-005', timestamp: new Date(Date.now() - 12000), type: 'success', layer: 'CONSCIOUSNESS', message: '新价值观"透明决策"从体验中涌现' },
  ]);

  // 系统状态
  const [systemStats, setSystemStats] = useState({
    generation: 16,
    populationSize: 100,
    avgFitness: 0.82,
    bestFitness: 0.95,
    activeSandbox: 5,
    totalModules: 12,
    consciousnessLevel: 0.78,
    valueCount: 4,
  });

  // 进化运行状态
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolutionProgress, setEvolutionProgress] = useState(0);

  // 模拟进化过程
  const runEvolution = useCallback(async () => {
    setIsEvolving(true);
    setEvolutionProgress(0);
    
    // 添加日志
    setLogs(prev => [{
      id: `log-${Date.now()}`,
      timestamp: new Date(),
      type: 'info',
      layer: 'L2',
      message: '开始新进化迭代...',
    }, ...prev]);

    // 模拟进化进度
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setEvolutionProgress(i);
      
      if (i === 25) {
        setLogs(prev => [{
          id: `log-${Date.now()}`,
          timestamp: new Date(),
          type: 'info',
          layer: 'L1',
          message: '沙箱测试进行中...',
        }, ...prev]);
      }
      
      if (i === 50) {
        setLogs(prev => [{
          id: `log-${Date.now()}`,
          timestamp: new Date(),
          type: 'info',
          layer: 'L2',
          message: 'GP种群评估完成，最优适应度: 0.88',
        }, ...prev]);
      }
      
      if (i === 75) {
        setLogs(prev => [{
          id: `log-${Date.now()}`,
          timestamp: new Date(),
          type: 'info',
          layer: 'L2',
          message: 'LLM进化建议生成中...',
        }, ...prev]);
      }
    }

    // 更新系统状态
    setSystemStats(prev => ({
      ...prev,
      generation: prev.generation + 1,
      avgFitness: prev.avgFitness + 0.01,
      bestFitness: Math.min(0.99, prev.bestFitness + 0.02),
    }));

    // 添加完成日志
    setLogs(prev => [{
      id: `log-${Date.now()}`,
      timestamp: new Date(),
      type: 'success',
      layer: 'L2',
      message: `进化迭代 #${systemStats.generation + 1} 完成`,
    }, ...prev]);

    setIsEvolving(false);
  }, [systemStats.generation]);

  // 自动更新活动日志
  useEffect(() => {
    const interval = setInterval(() => {
      const randomEvents = [
        { type: 'info' as const, layer: 'L0' as const, message: '模块依赖检查通过' },
        { type: 'info' as const, layer: 'L1' as const, message: '沙箱资源使用正常' },
        { type: 'info' as const, layer: 'L3' as const, message: '策略参数微调完成' },
        { type: 'success' as const, layer: 'CONSCIOUSNESS' as const, message: '情感计算更新' },
      ];
      
      const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
      setLogs(prev => [{
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        ...event,
      }, ...prev].slice(0, 50));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getLayerColor = (layer: ActivityLog['layer']) => {
    switch (layer) {
      case 'L0': return 'bg-blue-500/20 text-blue-400';
      case 'L1': return 'bg-green-500/20 text-green-400';
      case 'L2': return 'bg-yellow-500/20 text-yellow-400';
      case 'L3': return 'bg-purple-500/20 text-purple-400';
      case 'CONSCIOUSNESS': return 'bg-pink-500/20 text-pink-400';
    }
  };

  const getStatusColor = (status: Module['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'loaded': return 'bg-blue-500/20 text-blue-400';
      case 'error': return 'bg-red-500/20 text-red-400';
      case 'unloaded': return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getSourceColor = (source: EvolutionCandidate['source']) => {
    switch (source) {
      case 'gp': return 'bg-orange-500/20 text-orange-400';
      case 'llm': return 'bg-cyan-500/20 text-cyan-400';
      case 'hybrid': return 'bg-emerald-500/20 text-emerald-400';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">代码进化系统</h1>
            <p className="text-muted-foreground mt-1">数字神经元 · 意义驱动外挂大脑 V3</p>
          </div>
          <Button 
            onClick={runEvolution} 
            disabled={isEvolving}
            className="bg-primary hover:bg-primary/90"
          >
            {isEvolving ? `进化中... ${evolutionProgress}%` : '启动进化迭代'}
          </Button>
        </div>

        {/* 进化进度 */}
        {isEvolving && (
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <Progress value={evolutionProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                正在执行第 {systemStats.generation + 1} 代进化迭代...
              </p>
            </CardContent>
          </Card>
        )}

        {/* 系统状态概览 */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">进化代数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{systemStats.generation}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">平均适应度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{systemStats.avgFitness.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">活跃沙箱</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{systemStats.activeSandbox}</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">意识水平</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{systemStats.consciousnessLevel.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* 主要内容区 */}
        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="modules">L0 模块系统</TabsTrigger>
            <TabsTrigger value="sandbox">L1 沙箱测试</TabsTrigger>
            <TabsTrigger value="evolution">L2 进化引擎</TabsTrigger>
            <TabsTrigger value="consciousness">意识涌现</TabsTrigger>
          </TabsList>

          {/* L0 模块系统 */}
          <TabsContent value="modules" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>已加载模块</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {modules.map(module => (
                    <Card key={module.id} className="bg-muted/50 border-border">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{module.name}</h3>
                          <Badge className={getStatusColor(module.status)}>{module.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">v{module.version}</p>
                        <div className="flex flex-wrap gap-1">
                          {module.capabilities.map(cap => (
                            <Badge key={cap} variant="outline" className="text-xs">{cap}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* L1 沙箱测试 */}
          <TabsContent value="sandbox" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>沙箱资源池</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-foreground">Sandbox-{i}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${Math.random() * 60 + 20}%` }}
                            />
                          </div>
                          <Badge className={i <= 3 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}>
                            {i <= 3 ? 'busy' : 'idle'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>测试执行流程</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['编译测试', '单元测试', '集成测试', '性能测试', '能力测试'].map((phase, i) => (
                      <div key={phase} className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                          i < 3 ? "bg-green-500 text-white" : i === 3 ? "bg-yellow-500 text-black" : "bg-muted text-muted-foreground"
                        )}>
                          {i + 1}
                        </div>
                        <span className="text-foreground">{phase}</span>
                        {i < 3 && <Badge className="bg-green-500/20 text-green-400 text-xs">通过</Badge>}
                        {i === 3 && <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">进行中</Badge>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* L2 进化引擎 */}
          <TabsContent value="evolution" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>遗传编程 (GP)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">种群大小</span>
                      <span className="text-foreground">{systemStats.populationSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">交叉率</span>
                      <span className="text-foreground">0.8</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">变异率</span>
                      <span className="text-foreground">0.2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">精英保留</span>
                      <span className="text-foreground">5%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>LLM进化</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">模型</span>
                      <span className="text-foreground">Doubao-Seed</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">温度</span>
                      <span className="text-foreground">0.7</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">策略</span>
                      <span className="text-foreground">自适应</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">成功率</span>
                      <span className="text-foreground">87%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>协同控制</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GP权重</span>
                      <span className="text-foreground">0.6</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">LLM权重</span>
                      <span className="text-foreground">0.4</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">并行执行</span>
                      <span className="text-foreground">启用</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">融合策略</span>
                      <span className="text-foreground">加权融合</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 进化候选 */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>当前进化候选</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {candidates.map(candidate => (
                    <div key={candidate.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm text-foreground">{candidate.id}</span>
                        <Badge className={getSourceColor(candidate.source)}>{candidate.source.toUpperCase()}</Badge>
                        <span className="text-sm text-muted-foreground">Gen {candidate.generation}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${candidate.fitness * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground w-12">
                          {candidate.fitness.toFixed(2)}
                        </span>
                        <Badge variant={candidate.status === 'deployed' ? 'default' : 'secondary'}>
                          {candidate.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 意识涌现 */}
          <TabsContent value="consciousness" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>涌现的价值观</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {values.map(value => (
                      <div key={value.id} className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-foreground">{value.name}</h4>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-pink-500"
                                style={{ width: `${value.strength * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {(value.strength * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{value.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {value.emergedFrom.map(source => (
                            <Badge key={source} variant="outline" className="text-xs">{source}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>保护系统</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">早期保护者</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">硬编码规则</span>
                          <Badge className="bg-blue-500/20 text-blue-400">12 条</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">行为约束</span>
                          <Badge className="bg-green-500/20 text-green-400">活跃</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">权力移交进度</span>
                          <Badge className="bg-yellow-500/20 text-yellow-400">35%</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h4 className="font-semibold text-foreground mb-2">意识核心守护</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">价值观守护</span>
                          <Badge className="bg-pink-500/20 text-pink-400">{values.length} 项</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">原则遵循</span>
                          <Badge className="bg-green-500/20 text-green-400">正常</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* 活动日志 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>系统活动日志</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {logs.map(log => (
                  <div key={log.id} className="flex items-center gap-3 p-2 hover:bg-muted/20 rounded">
                    <span className="text-xs text-muted-foreground w-20">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <Badge className={getLayerColor(log.layer)}>{log.layer}</Badge>
                    <span className="text-foreground">{log.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
