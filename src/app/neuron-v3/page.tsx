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
  generateSamplePlanningData,
  generateSampleExecutiveData
} from '@/components/neuron-viz';
import { useNeuronV3System, defaultSystemState } from '@/hooks/use-neuron-v3';
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
    sendFeedback 
  } = useNeuronV3System();

  // 网络数据 - 从API获取或使用默认值
  const [networkData, setNetworkData] = useState(generateSampleNetwork);

  // VSA语义空间数据
  const [vsaData, setVsaData] = useState(generateSampleVSAData);

  // 意识数据
  const [consciousnessData, setConsciousnessData] = useState(generateSampleConsciousnessData);

  // 计划数据
  const [planningData, setPlanningData] = useState(generateSamplePlanningData);

  // 执行控制数据
  const [executiveData, setExecutiveData] = useState(generateSampleExecutiveData);

  // 预测和事件
  const [predictions, setPredictions] = useState(generateSamplePredictions());
  const [learningEvents, setLearningEvents] = useState(generateSampleLearningEvents());
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);

  // 交互状态
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<string>('');
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([]);

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

  // 根据系统状态更新网络可视化
  useEffect(() => {
    if (systemState) {
      // 更新网络状态显示
      setNetworkData(prev => ({
        neurons: prev.neurons.map((n, i) => ({
          ...n,
          activation: stats.neuronCount > 0 
            ? Math.random() * 0.3 + 0.2 * (i % 3) // 基于真实状态的模拟
            : 0.1,
          state: stats.consciousnessLevel > 50 
            ? (['active', 'predicting'] as const)[Math.floor(Math.random() * 2)]
            : 'dormant',
        })),
        connections: prev.connections.map(c => ({
          ...c,
          active: stats.consciousnessLevel > 30,
        })),
      }));

      // 更新意识数据
      setConsciousnessData(prev => ({
        ...prev,
        consciousnessLevel: stats.consciousnessLevel,
      }));
    }
  }, [systemState, stats.neuronCount, stats.consciousnessLevel]);

  // 处理消息发送 - 使用真实API
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

    // 调用真实API
    const result = await processInput(
      message,
      undefined,
      (stage, msg) => {
        // 处理阶段回调
        setCurrentStage(msg);
        setActivityEvents(prev => [...prev, {
          id: `act-${Date.now()}`,
          timestamp: Date.now(),
          type: stage === 'prediction' ? 'predict' : 
                stage === 'learning' ? 'learn' : 
                stage === 'comparison' ? 'surprise' : 'activate',
          neuronId: 'system',
          details: msg,
        }]);
      },
      (processResult) => {
        // 完成回调
        if (processResult) {
          // 构建响应文本
          const meaning = processResult.meaning;
          const learning = processResult.learning;
          
          let response = '';
          if (meaning) {
            response += `**意义理解**: ${meaning.interpretation}\n`;
            response += `- 自我关联度: ${(meaning.selfRelevance * 100).toFixed(0)}%\n`;
            response += `- 情感色彩: ${meaning.sentiment > 0 ? '正面' : meaning.sentiment < 0 ? '负面' : '中性'}\n\n`;
          }
          if (learning) {
            response += `**学习结果**: ${learning.summary}\n`;
            response += `- 调整神经元: ${learning.adjustedNeurons} 个\n`;
            response += `- 新增神经元: ${learning.newNeurons} 个`;
          }
          
          setLastResponse(response || '处理完成');
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
  }, [processInput]);

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
    <div className="min-h-screen bg-background grid-bg">
      {/* 顶部标题栏 */}
      <header className="border-b border-muted-foreground/10 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--neuron-active)] to-[var(--neuron-dormant)] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </div>
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[var(--neuron-active)] animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold">数字神经元系统 V3</h1>
                <p className="text-sm text-muted-foreground">预测编码 · 意义驱动 · 自主学习</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono-nums">
                神经元: {stats.neuronCount}
              </Badge>
              <Badge variant="outline" className="font-mono-nums">
                准确率: {stats.predictionAccuracy.toFixed(1)}%
              </Badge>
              <div className="flex items-center gap-1">
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  apiLoading ? "bg-yellow-500 animate-pulse" : "bg-[var(--neuron-active)]"
                )} />
                <span className="text-sm text-muted-foreground">
                  {apiLoading ? '加载中...' : '运行中'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区 */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* 系统状态概览 */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-[var(--neuron-active)]" />
            系统状态概览
          </h2>
          <SystemStatsGrid stats={stats} />
        </section>

        {/* 核心功能展示 */}
        <Tabs defaultValue="network" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
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
                <Card className="glow-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--neuron-active)]" />
                      语义操作
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted/20 border border-muted-foreground/10">
                      <h4 className="text-xs text-muted-foreground mb-2">绑定 (Binding)</h4>
                      <p className="text-sm">概念 × 属性 → 复合概念</p>
                      <code className="text-xs text-[var(--neuron-active)]">"红色" × "苹果" = "红苹果"</code>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20 border border-muted-foreground/10">
                      <h4 className="text-xs text-muted-foreground mb-2">捆绑 (Bundling)</h4>
                      <p className="text-sm">概念 + 概念 → 概念集合</p>
                      <code className="text-xs text-[var(--neuron-active)]">"猫" + "狗" = "宠物"</code>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20 border border-muted-foreground/10">
                      <h4 className="text-xs text-muted-foreground mb-2">解绑 (Unbinding)</h4>
                      <p className="text-sm">复合概念 ÷ 属性 → 原始概念</p>
                      <code className="text-xs text-[var(--neuron-active)]">"红苹果" ÷ "红色" = "苹果"</code>
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
                <Card className="glow-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--neuron-predicting)]" />
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
                      <div key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/10 text-sm">
                        <span>{module.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${module.status === 'active' ? 'bg-[var(--neuron-active)]' : 'bg-muted-foreground/30'}`}
                              style={{ width: `${module.strength * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono-nums text-muted-foreground">
                            {(module.strength * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* 目标计划标签页 */}
          <TabsContent value="planning" className="space-y-6">
            <section className="grid lg:grid-cols-2 gap-6">
              <PlanningPanel
                goals={planningData.goals}
                activeTasks={planningData.activeTasks}
                currentPlan={planningData.currentPlan}
              />
              <div className="space-y-6">
                <Card className="glow-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--signal-reward)]" />
                      目标分解示例
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-muted/20 border border-muted-foreground/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-[var(--neuron-active)]">主目标</Badge>
                          <span className="text-sm font-medium">理解用户意图</span>
                        </div>
                        <div className="pl-4 space-y-2 border-l-2 border-muted-foreground/20">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-[var(--signal-reward)] text-xs">子目标</Badge>
                            <span>语义解析</span>
                            <span className="text-xs text-[var(--signal-reward)]">✓</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-[var(--neuron-active)] text-xs">子目标</Badge>
                            <span>意图分类</span>
                            <span className="text-xs text-[var(--neuron-active)] animate-pulse">▶</span>
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
                focusItems={executiveData.focusItems}
                currentFocus={executiveData.currentFocus}
                attentionMode={executiveData.attentionMode}
              />
              <div className="space-y-6">
                <Card className="glow-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--neuron-predicting)]" />
                      注意力模式
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { mode: 'focused', label: '专注', icon: '🎯', desc: '单一任务高优先级' },
                        { mode: 'divided', label: '分配', icon: '⚡', desc: '多任务并行处理' },
                        { mode: 'exploratory', label: '探索', icon: '🔍', desc: '广泛搜索新信息' },
                      ].map((m) => (
                        <div
                          key={m.mode}
                          className={cn(
                            'p-3 rounded-lg text-center cursor-pointer transition-all',
                            executiveData.attentionMode === m.mode
                              ? 'bg-[var(--neuron-active)]/20 border border-[var(--neuron-active)]/50'
                              : 'bg-muted/20 border border-muted-foreground/10 hover:border-muted-foreground/30'
                          )}
                        >
                          <div className="text-2xl mb-1">{m.icon}</div>
                          <div className="text-sm font-medium">{m.label}</div>
                          <div className="text-xs text-muted-foreground mt-1">{m.desc}</div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20 border border-muted-foreground/10">
                      <h4 className="text-xs text-muted-foreground mb-2">任务切换历史</h4>
                      <div className="space-y-1">
                        {activityEvents.slice(-3).reverse().map((event, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">{event.type}</span>
                            <span className="text-[var(--neuron-active)]">→</span>
                            <span className="truncate">{event.details || '处理中...'}</span>
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
        <section className="grid lg:grid-cols-3 gap-6">
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
        </section>

        {/* 架构说明 */}
        <section>
          <Card className="glow-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--neuron-predicting)]" />
                系统架构
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-5 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-muted/30 border border-muted-foreground/10">
                  <h4 className="font-medium text-[var(--neuron-active)] mb-2">预测编码</h4>
                  <p className="text-muted-foreground text-xs">
                    神经元主动预测输入，通过预测误差学习。惊讶度驱动新神经元的生成。
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-muted-foreground/10">
                  <h4 className="font-medium text-[var(--signal-reward)] mb-2">奖励学习</h4>
                  <p className="text-muted-foreground text-xs">
                    整合显式/隐式/自评估反馈，通过TD学习调整权重，Hebbian规则强化连接。
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-muted-foreground/10">
                  <h4 className="font-medium text-[var(--neuron-predicting)] mb-2">VSA语义空间</h4>
                  <p className="text-muted-foreground text-xs">
                    高维向量表示概念，通过代数运算实现语义推理，赋予系统理解能力。
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-muted-foreground/10">
                  <h4 className="font-medium text-[var(--neuron-surprised)] mb-2">全局工作空间</h4>
                  <p className="text-muted-foreground text-xs">
                    认知模块竞争进入意识，广播信息到全系统。支持自我意识计算。
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-muted-foreground/10">
                  <h4 className="font-medium text-[var(--neuron-active)] mb-2">认知协调器</h4>
                  <p className="text-muted-foreground text-xs">
                    协调计划模块与执行控制，实现目标分解、任务规划与注意力控制。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* 底部信息 */}
      <footer className="border-t border-muted-foreground/10 mt-8 py-4">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          数字神经元系统 V3 · 预测编码 + 向量符号架构 · 支持自主学习与意识涌现
        </div>
      </footer>
    </div>
  );
}
