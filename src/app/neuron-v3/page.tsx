'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  SystemStatsGrid, 
  NetworkTopology, 
  generateSampleNetwork, 
  PredictionMonitor, 
  ActivityTimeline, 
  generateSamplePredictions, 
  generateSampleLearningEvents, 
  InteractionPanel, 
  FeedbackHistory,
  VSASpaceVisualization,
  generateSampleVSAData,
  ConsciousnessPanel,
  ConsciousnessGauge,
  generateSampleConsciousnessData,
  PlanningPanel,
  ExecutivePanel,
  IntuitionPanel,
  generateSamplePlanningData,
  generateSampleExecutiveData,
  generateSampleIntuition,
  generateSampleReadiness,
  generateSampleBackgroundStats,
} from '@/components/neuron-viz';
import { useNeuronV3System, defaultSystemState, type NetworkTopologyData, type VSAData, type ConsciousnessData, type PlanningData, type ExecutiveData, type NeuronStatusData, type SelfCognitiveData } from '@/hooks/use-neuron-v3';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// 类型定义
interface ActivityEvent {
  id: string;
  timestamp: number;
  type: 'activate' | 'predict' | 'learn' | 'surprise';
  neuronId: string;
  details?: string;
}

interface FeedbackItem {
  id: string;
  timestamp: number;
  type: 'positive' | 'negative';
  context?: string;
}

export default function NeuronV3Dashboard() {
  // 使用真实 API Hook
  const { 
    systemState, 
    isLoading: apiLoading, 
    processInput, 
    sendFeedback,
    chat,
    fetchNetworkTopology,
    fetchVSAData,
    fetchConsciousnessData,
    fetchPlanningData,
    fetchExecutiveData,
    // 实时状态（从 SSE 接收）
    neuronStatus,
    selfCognitive,
  } = useNeuronV3System();

  // 网络数据 - 从API获取或使用默认值
  const [networkData, setNetworkData] = useState<NetworkTopologyData>({ neurons: [], connections: [] });

  // VSA语义空间数据
  const [vsaData, setVsaData] = useState<VSAData>({ concepts: [], links: [] });

  // 意识数据
  const [consciousnessData, setConsciousnessData] = useState<ConsciousnessData>({
    currentContent: null,
    consciousnessLevel: 0,
    selfAwarenessIndex: 0,
    streamCoherence: 0,
    trail: [],
  });

  // 自我认知数据
  const [selfCognitiveData, setSelfCognitiveData] = useState<SelfCognitiveData | null>(null);

  // 计划数据
  const [planningData, setPlanningData] = useState<PlanningData>({
    goals: [],
    activeGoal: null,
  });

  // 执行控制数据
  const [executiveData, setExecutiveData] = useState<ExecutiveData>({
    attentionMode: 'diffuse',
    currentFocus: '等待输入',
    attentionAllocation: [],
    tasks: [],
    attentionSpotlight: [],
    timePressure: 0,
  });

  // 预测和事件
  const [predictions, setPredictions] = useState(generateSamplePredictions());
  const [learningEvents, setLearningEvents] = useState(generateSampleLearningEvents());
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);

  // 交互状态
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<string>('');
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([]);
  
  // 对话历史（用于 LLM 上下文）
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);

  // 使用真实系统状态
  const stats = {
    neuronCount: systemState?.neuronCount ?? defaultSystemState.neuronCount,
    predictionAccuracy: systemState?.predictionAccuracy ?? defaultSystemState.predictionAccuracy,
    totalSurprise: systemState?.totalSurprise ?? defaultSystemState.totalSurprise,
    learningEvents: systemState?.learningEvents ?? defaultSystemState.learningEvents,
    totalReward: systemState?.totalReward ?? defaultSystemState.totalReward,
    totalPunishment: systemState?.totalPunishment ?? defaultSystemState.totalPunishment,
    consciousnessLevel: systemState?.consciousnessLevel ?? defaultSystemState.consciousnessLevel,
    selfAwarenessIndex: systemState?.selfAwarenessIndex ?? defaultSystemState.selfAwarenessIndex,
  };

  // 定期获取所有可视化数据
  useEffect(() => {
    const fetchAllData = async () => {
      const [network, vsa, consciousness, planning, executive] = await Promise.all([
        fetchNetworkTopology(),
        fetchVSAData(),
        fetchConsciousnessData(),
        fetchPlanningData(),
        fetchExecutiveData(),
      ]);

      if (network) setNetworkData(network);
      if (vsa) setVsaData(vsa);
      if (consciousness) setConsciousnessData(consciousness);
      if (planning) setPlanningData(planning);
      if (executive) setExecutiveData(executive);
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 3000);
    return () => clearInterval(interval);
  }, [fetchNetworkTopology, fetchVSAData, fetchConsciousnessData, fetchPlanningData, fetchExecutiveData]);

  // 根据系统状态更新网络可视化
  useEffect(() => {
    if (systemState) {
      // 更新意识数据
      setConsciousnessData(prev => ({
        ...prev,
        consciousnessLevel: stats.consciousnessLevel,
        selfAwarenessIndex: stats.selfAwarenessIndex,
      }));
    }
  }, [systemState, stats.consciousnessLevel, stats.selfAwarenessIndex]);

  // 处理消息发送 - 使用 LLM 生成自然语言响应
  const handleSendMessage = useCallback(async (message: string) => {
    setIsProcessing(true);
    setLastResponse('');
    
    // 添加用户活动事件
    setActivityEvents(prev => [...prev, {
      id: `act-${Date.now()}`,
      timestamp: Date.now(),
      type: 'activate',
      neuronId: 'input',
      details: `用户输入: ${message.slice(0, 30)}...`,
    }]);

    // 添加用户消息到历史
    const newHistory = [...chatHistory, { role: 'user', content: message }];
    
    // 流式响应内容
    let responseContent = '';
    
    // 调用 chat API（神经元系统 + LLM）
    await chat(
      message,
      chatHistory,
      // 流式内容回调
      (content) => {
        responseContent += content;
        setLastResponse(responseContent);
        setCurrentStage('生成响应...');
      },
      // 完成回调
      (fullContent, summary) => {
        // 更新对话历史
        setChatHistory([...newHistory, { role: 'assistant', content: fullContent }]);
        
        // 添加学习事件
        if (summary) {
          setActivityEvents(prev => [...prev, {
            id: `act-${Date.now()}`,
            timestamp: Date.now(),
            type: 'learn',
            neuronId: 'system',
            details: summary,
          }]);
        }
      },
      // 神经元状态回调 - 实时更新网络可视化
      (status) => {
        // 更新网络数据中神经元的激活状态
        setNetworkData(prev => ({
          ...prev,
          neurons: prev.neurons.map(n => ({
            ...n,
            activation: status.activations[n.id] ?? n.activation,
            state: (status.activations[n.id] ?? 0) > 0.7 ? 'active' as const :
                   (status.activations[n.id] ?? 0) > 0.3 ? 'predicting' as const : 'dormant' as const,
          })),
        }));
        
        // 更新意识数据
        if (status.meaning || status.consciousness) {
          setConsciousnessData(prev => ({
            ...prev,
            currentContent: prev.currentContent ? {
              ...prev.currentContent,
              type: (status.consciousness as 'perceptual' | 'semantic' | 'emotional' | 'memory' | 'thought' | 'motor' | 'metacognitive') || prev.currentContent.type,
            } : null,
          }));
        }
        
        // 添加激活事件
        const activeNeurons = Object.entries(status.activations)
          .filter(([, v]) => v > 0.5)
          .slice(0, 3);
        
        if (activeNeurons.length > 0) {
          setActivityEvents(prev => [...prev, {
            id: `act-${Date.now()}`,
            timestamp: Date.now(),
            type: 'activate',
            neuronId: activeNeurons[0][0],
            details: `神经元激活: ${activeNeurons.map(([id, v]) => `${id.slice(0, 8)}(${(v * 100).toFixed(0)}%)`).join(', ')}`,
          }]);
        }
      },
      // 自我认知回调
      (cognitive) => {
        setSelfCognitiveData(cognitive);
        
        // 添加反思事件
        if (cognitive.reflections.length > 0) {
          setActivityEvents(prev => [...prev, {
            id: `act-${Date.now()}`,
            timestamp: Date.now(),
            type: 'learn',
            neuronId: 'self',
            details: `自我反思: ${cognitive.interpretation}`,
          }]);
        }
      }
    );

    // 添加完成事件
    setActivityEvents(prev => [...prev, {
      id: `act-${Date.now()}`,
      timestamp: Date.now(),
      type: 'learn',
      neuronId: 'system',
      details: '处理完成',
    }]);

    setIsProcessing(false);
    setCurrentStage('');
  }, [chat, chatHistory]);

  // 处理反馈 - 使用真实API
  const handleFeedback = useCallback(async (type: 'positive' | 'negative') => {
    // 先添加本地记录
    setFeedbackHistory(prev => [...prev, {
      id: `fb-${Date.now()}`,
      timestamp: Date.now(),
      type,
      context: lastResponse.slice(0, 30) + '...',
    }]);

    // 调用真实API
    const result = await sendFeedback(type, lastResponse.slice(0, 50));
    
    if (result) {
      // 添加学习事件
      setActivityEvents(prev => [...prev, {
        id: `act-${Date.now()}`,
        timestamp: Date.now(),
        type: 'learn',
        neuronId: 'reward',
        details: `奖励信号: ${result.reward.toFixed(2)} (显式: ${result.breakdown.explicit.toFixed(2)}, 隐式: ${result.breakdown.implicit.toFixed(2)})`,
      }]);
    }
  }, [lastResponse, sendFeedback]);

  return (
    <div className="min-h-screen bg-background grid-bg relative overflow-hidden">
      {/* 扫描线效果 */}
      <div className="pointer-events-none fixed inset-0 z-50">
        <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,hsl(var(--primary)/0.03)_50%,transparent_100%)] bg-[length:100%_4px] animate-scan opacity-50" />
      </div>
      
      {/* 背景装饰 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* 顶部标题栏 - 科技风格 */}
      <header className="border-b border-primary/20 bg-card/30 backdrop-blur-xl sticky top-0 z-50 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="container mx-auto px-6 py-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo - 带发光效果 */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse" />
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/50 flex items-center justify-center border border-primary/50 shadow-lg shadow-primary/20">
                  <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="12" r="8" strokeDasharray="4 2" />
                    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                    <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" strokeDasharray="2 2" />
                  </svg>
                </div>
                {/* 状态指示灯 */}
                <span className={cn(
                  "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-background",
                  apiLoading ? "bg-amber-500 animate-pulse" : "bg-primary shadow-lg shadow-primary/50"
                )} />
              </div>
              
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="text-primary">数字神经元</span>
                  <span className="text-muted-foreground font-light ml-1">V3</span>
                </h1>
                <p className="text-xs text-muted-foreground tracking-wider">
                  预测编码 · 意义驱动 · 自主学习
                </p>
              </div>
            </div>
            
            {/* 状态指示器 */}
            <div className="flex items-center gap-6">
              {/* 神经元计数 */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono-nums text-primary">{stats.neuronCount}</div>
                  <div className="text-xs text-muted-foreground">神经元</div>
                </div>
              </div>
              
              {/* 准确率 */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold font-mono-nums text-primary">{stats.predictionAccuracy.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">准确率</div>
                </div>
              </div>
              
              {/* 状态标签 */}
              <div className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-2",
                apiLoading 
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-500" 
                  : "bg-primary/10 border-primary/30 text-primary"
              )}>
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  apiLoading ? "bg-amber-500 animate-pulse" : "bg-primary"
                )} />
                {apiLoading ? '初始化中' : '运行中'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区 */}
      <main className="container mx-auto px-6 py-8 space-y-8 relative">
        {/* 系统状态概览 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-primary to-primary/30" />
            <h2 className="text-sm font-semibold tracking-wider text-muted-foreground">
              系统状态概览
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
          </div>
          <SystemStatsGrid stats={stats} />
        </section>

        {/* 核心功能展示 */}
        <Tabs defaultValue="network" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-card/50 border border-primary/20">
            <TabsTrigger value="network">神经网络</TabsTrigger>
            <TabsTrigger value="vsa">语义空间</TabsTrigger>
            <TabsTrigger value="consciousness">意识内容</TabsTrigger>
            <TabsTrigger value="planning">目标计划</TabsTrigger>
            <TabsTrigger value="executive">执行控制</TabsTrigger>
          </TabsList>

          {/* 神经网络标签页 */}
          <TabsContent value="network" className="space-y-6">
            <section className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <NetworkTopology
                  neurons={networkData.neurons}
                  connections={networkData.connections}
                />
              </div>
              <div className="space-y-6">
                <PredictionMonitor
                  predictions={predictions}
                  learningEvents={learningEvents}
                />
                <ConsciousnessGauge
                  level={stats.consciousnessLevel}
                  selfAwarenessIndex={stats.selfAwarenessIndex}
                />
              </div>
            </section>
          </TabsContent>

          {/* VSA语义空间标签页 */}
          <TabsContent value="vsa" className="space-y-6">
            <section className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <VSASpaceVisualization
                  concepts={vsaData.concepts}
                  links={vsaData.links}
                />
              </div>
              <div className="space-y-6">
                <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-primary/10">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      语义操作
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors">
                      <h4 className="text-xs text-muted-foreground mb-2">绑定 (Binding)</h4>
                      <p className="text-sm text-foreground">概念 × 属性 → 复合概念</p>
                      <code className="text-xs text-primary/80 font-mono">"红色" × "苹果" = "红苹果"</code>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors">
                      <h4 className="text-xs text-muted-foreground mb-2">捆绑 (Bundling)</h4>
                      <p className="text-sm text-foreground">概念 + 概念 → 概念集合</p>
                      <code className="text-xs text-primary/80 font-mono">"猫" + "狗" = "宠物"</code>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors">
                      <h4 className="text-xs text-muted-foreground mb-2">解绑 (Unbinding)</h4>
                      <p className="text-sm text-foreground">复合概念 ÷ 属性 → 原始概念</p>
                      <code className="text-xs text-primary/80 font-mono">"红苹果" ÷ "红色" = "苹果"</code>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* 意识内容标签页 */}
          <TabsContent value="consciousness" className="space-y-6">
            <section className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ConsciousnessPanel
                  currentContent={consciousnessData.currentContent}
                  consciousnessLevel={consciousnessData.consciousnessLevel}
                  trail={consciousnessData.trail}
                />
              </div>
              <div className="space-y-6">
                <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-primary/10">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      认知模块
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { name: '感知模块', status: 'active', strength: 0.85 },
                      { name: '语言模块', status: 'active', strength: 0.78 },
                      { name: '记忆模块', status: 'idle', strength: 0.45 },
                      { name: '情感模块', status: 'active', strength: 0.62 },
                      { name: '元认知模块', status: 'idle', strength: 0.38 },
                    ].map((module, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-md bg-primary/5 hover:bg-primary/10 transition-colors text-sm">
                        <span className="text-foreground">{module.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${module.status === 'active' ? 'bg-primary' : 'bg-primary/30'}`}
                              style={{ width: `${module.strength * 100}%`, boxShadow: module.status === 'active' ? '0 0 8px hsl(var(--primary))' : 'none' }}
                            />
                          </div>
                          <span className="text-xs font-mono-nums text-muted-foreground w-10 text-right">
                            {(module.strength * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                
                {/* 自我认知状态卡片 - 实时显示双向交互结果 */}
                <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-primary/10">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        selfCognitiveData ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
                      )} />
                      自我认知状态
                      {selfCognitiveData && (
                        <Badge variant="outline" className="text-xs ml-auto">
                          一致性: {(selfCognitiveData.consistency * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selfCognitiveData ? (
                      <>
                        {/* 一致性进度条 */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>输出与认知一致性</span>
                            <span>{(selfCognitiveData.consistency * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                selfCognitiveData.consistency >= 0.8 ? "bg-emerald-500" :
                                selfCognitiveData.consistency >= 0.5 ? "bg-primary" : "bg-amber-500"
                              )}
                              style={{ width: `${selfCognitiveData.consistency * 100}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* 解读 */}
                        <div className="p-2 rounded-md bg-primary/5 text-sm">
                          <p className="text-foreground">{selfCognitiveData.interpretation}</p>
                        </div>
                        
                        {/* 反思列表 */}
                        {selfCognitiveData.reflections.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">元认知反思：</p>
                            {selfCognitiveData.reflections.slice(0, 2).map((reflection, i) => (
                              <p key={i} className="text-xs text-foreground/80 pl-2 border-l border-primary/20">
                                {reflection}
                              </p>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        等待交互后显示自我认知状态...
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* 目标计划标签页 */}
          <TabsContent value="planning" className="space-y-6">
            <section className="grid lg:grid-cols-2 gap-6">
              <PlanningPanel
                goals={planningData.goals.map(g => ({
                  id: g.id,
                  description: g.description,
                  priority: g.priority,
                  progress: g.progress,
                  subGoals: [],
                  status: g.status === 'in_progress' ? 'active' : 
                          g.status === 'completed' ? 'completed' : 'active',
                  createdAt: Date.now(),
                }))}
                activeTasks={[]}
                currentPlan={null}
              />
              <div className="space-y-6">
                <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-primary/10">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      目标分解示例
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-primary border-primary/30">主目标</Badge>
                          <span className="text-sm font-medium">理解用户意图</span>
                        </div>
                        <div className="pl-4 space-y-2 border-l-2 border-primary/20">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-xs">子目标</Badge>
                            <span>语义解析</span>
                            <span className="text-xs text-emerald-500">✓</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-primary border-primary/30 text-xs">子目标</Badge>
                            <span>意图分类</span>
                            <span className="text-xs text-primary animate-pulse">▶</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">子目标</Badge>
                            <span>情感分析</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* 执行控制标签页 */}
          <TabsContent value="executive" className="space-y-6">
            <section className="grid lg:grid-cols-2 gap-6">
              <ExecutivePanel
                focusItems={executiveData.attentionAllocation.map((a, i) => ({
                  id: `focus-${i}`,
                  type: a.module,
                  priority: a.allocation,
                  attention: a.allocation,
                }))}
                currentFocus={executiveData.currentFocus}
                attentionMode={executiveData.attentionMode === 'focus' ? 'focused' : 
                               executiveData.attentionMode === 'switching' ? 'divided' : 'exploratory'}
              />
              <div className="space-y-6">
                <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-primary/10">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      注意力模式
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { mode: 'focused', label: '专注', icon: '🎯', desc: '单一任务高优先级' },
                        { mode: 'divided', label: '分配', icon: '⚡', desc: '多任务并行处理' },
                        { mode: 'exploratory', label: '探索', icon: '🔍', desc: '广泛搜索新信息' },
                      ].map((m) => (
                        <div
                          key={m.mode}
                          className={cn(
                            'p-4 rounded-xl text-center cursor-pointer transition-all border',
                            executiveData.attentionMode === m.mode
                              ? 'bg-primary/10 border-primary/30 shadow-lg shadow-primary/5'
                              : 'bg-primary/5 border-primary/10 hover:border-primary/20'
                          )}
                        >
                          <div className="text-2xl mb-2">{m.icon}</div>
                          <div className="text-sm font-medium text-foreground">{m.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <h4 className="text-xs text-muted-foreground mb-2">任务切换历史</h4>
                      <div className="space-y-1">
                        {activityEvents.slice(-3).reverse().map((event, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">{event.type}</span>
                            <span className="text-primary">→</span>
                            <span className="truncate text-foreground">{event.details || '处理中...'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>
        </Tabs>

        {/* 底部交互区域 */}
        <section className="grid lg:grid-cols-4 gap-6">
          {/* 交互面板 */}
          <InteractionPanel
            onSendMessage={handleSendMessage}
            onFeedback={handleFeedback}
            isProcessing={isProcessing}
            lastResponse={currentStage || lastResponse}
          />

          {/* 活动时间线 */}
          <ActivityTimeline events={activityEvents} />

          {/* 反馈历史 */}
          <FeedbackHistory feedback={feedbackHistory} />
          
          {/* 系统1：直觉处理 */}
          <IntuitionPanel 
            intuition={generateSampleIntuition()}
            readiness={generateSampleReadiness()}
            stats={generateSampleBackgroundStats()}
          />
        </section>

        {/* 架构说明 */}
        <section>
          <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-primary/10">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                系统架构
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-6 gap-4 text-sm">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors">
                  <h4 className="font-medium text-primary mb-2">预测编码</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    神经元主动预测输入，通过预测误差学习。惊讶度驱动新神经元的生成。
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors">
                  <h4 className="font-medium text-emerald-500 mb-2">奖励学习</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    整合显式/隐式/自评估反馈，通过TD学习调整权重，Hebbian规则强化连接。
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors">
                  <h4 className="font-medium text-primary mb-2">VSA语义空间</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    高维向量表示概念，通过代数运算实现语义推理，赋予系统理解能力。
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors">
                  <h4 className="font-medium text-amber-500 mb-2">全局工作空间</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    认知模块竞争进入意识，广播信息到全系统。支持自我意识计算。
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors">
                  <h4 className="font-medium text-primary mb-2">认知协调器</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    协调计划模块与执行控制，实现目标分解、任务规划与注意力控制。
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 hover:border-primary/20 transition-colors">
                  <h4 className="font-medium text-amber-500 mb-2">系统1：直觉</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    快速、自动、无意识的模式匹配。隐式学习提取规律，准备电位预热决策。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* 底部信息 */}
      <footer className="border-t border-primary/10 mt-8 py-6 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-6 text-center relative">
          <p className="text-xs text-muted-foreground tracking-wider">
            数字神经元系统 V3 · 预测编码 + 向量符号架构 · 支持自主学习与意识涌现
          </p>
        </div>
      </footer>
    </div>
  );
}
