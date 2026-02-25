'use client';

import { useState, useEffect, useCallback } from 'react';
import { SystemStatsGrid, NetworkTopology, generateSampleNetwork, PredictionMonitor, ActivityTimeline, generateSamplePredictions, generateSampleLearningEvents, InteractionPanel, FeedbackHistory } from '@/components/neuron-viz';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// 类型定义
interface SystemStats {
  neuronCount: number;
  predictionAccuracy: number;
  totalSurprise: number;
  learningEvents: number;
  totalReward: number;
  totalPunishment: number;
  consciousnessLevel: number;
  selfAwarenessIndex: number;
}

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
  // 系统状态
  const [stats, setStats] = useState<SystemStats>({
    neuronCount: 8,
    predictionAccuracy: 72.5,
    totalSurprise: 12.3,
    learningEvents: 156,
    totalReward: 45.2,
    totalPunishment: 12.8,
    consciousnessLevel: 65.0,
    selfAwarenessIndex: 58.3,
  });

  // 网络数据
  const [networkData, setNetworkData] = useState(generateSampleNetwork);

  // 预测和事件
  const [predictions, setPredictions] = useState(generateSamplePredictions());
  const [learningEvents, setLearningEvents] = useState(generateSampleLearningEvents());
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);

  // 交互状态
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackItem[]>([]);

  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      // 更新网络状态
      setNetworkData(prev => ({
        neurons: prev.neurons.map(n => ({
          ...n,
          activation: Math.max(0, Math.min(1, n.activation + (Math.random() - 0.5) * 0.1)),
          state: Math.random() > 0.7 
            ? (['active', 'predicting', 'dormant', 'surprised'] as const)[Math.floor(Math.random() * 4)]
            : n.state,
        })),
        connections: prev.connections.map(c => ({
          ...c,
          active: Math.random() > 0.6,
        })),
      }));

      // 更新统计数据
      setStats(prev => ({
        ...prev,
        predictionAccuracy: Math.max(50, Math.min(95, prev.predictionAccuracy + (Math.random() - 0.5) * 2)),
        consciousnessLevel: Math.max(20, Math.min(90, prev.consciousnessLevel + (Math.random() - 0.5) * 3)),
      }));

      // 添加活动事件
      if (Math.random() > 0.7) {
        const types: ActivityEvent['type'][] = ['activate', 'predict', 'learn', 'surprise'];
        setActivityEvents(prev => [...prev, {
          id: `act-${Date.now()}`,
          timestamp: Date.now(),
          type: types[Math.floor(Math.random() * types.length)],
          neuronId: `n${Math.floor(Math.random() * 8)}`,
          details: `阈值: ${(Math.random() * 0.5).toFixed(2)}`,
        }].slice(-50));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // 处理消息发送
  const handleSendMessage = useCallback(async (message: string) => {
    setIsProcessing(true);
    
    // 模拟处理
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 添加活动事件
    setActivityEvents(prev => [...prev, {
      id: `act-${Date.now()}`,
      timestamp: Date.now(),
      type: 'activate',
      neuronId: 'n0',
      details: `处理输入: ${message.slice(0, 20)}...`,
    }, {
      id: `act-${Date.now() + 1}`,
      timestamp: Date.now() + 500,
      type: 'predict',
      neuronId: 'n1',
      details: '生成预测...',
    }]);

    // 模拟响应
    const responses = [
      '根据我的预测模型分析，这个输入与之前的模式有较高的相似度。我正在调整相关神经元的权重。',
      '这是一个有趣的新模式。我的惊讶度检测被触发，正在创建新的神经元来处理这类输入。',
      '基于历史学习，我预测您可能对此主题感兴趣。让我从记忆中检索相关信息。',
      '我的自我意识模块正在评估这个输入对系统的意义。这激活了我的元认知神经元。',
    ];
    
    setLastResponse(responses[Math.floor(Math.random() * responses.length)]);
    setStats(prev => ({
      ...prev,
      learningEvents: prev.learningEvents + 1,
    }));
    
    setIsProcessing(false);
  }, []);

  // 处理反馈
  const handleFeedback = useCallback((type: 'positive' | 'negative') => {
    setFeedbackHistory(prev => [...prev, {
      id: `fb-${Date.now()}`,
      timestamp: Date.now(),
      type,
      context: lastResponse.slice(0, 30) + '...',
    }]);

    // 更新统计
    setStats(prev => ({
      ...prev,
      totalReward: type === 'positive' ? prev.totalReward + 1 : prev.totalReward,
      totalPunishment: type === 'negative' ? prev.totalPunishment + 1 : prev.totalPunishment,
      learningEvents: prev.learningEvents + 1,
    }));

    // 添加学习事件
    setActivityEvents(prev => [...prev, {
      id: `act-${Date.now()}`,
      timestamp: Date.now(),
      type: 'learn',
      neuronId: 'n3',
      details: type === 'positive' ? '正向奖励信号' : '负向惩罚信号',
    }]);
  }, [lastResponse]);

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
                <span className="w-2 h-2 rounded-full bg-[var(--neuron-active)] animate-pulse" />
                <span className="text-sm text-muted-foreground">运行中</span>
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

        {/* 主要可视化区域 */}
        <section className="grid lg:grid-cols-3 gap-6">
          {/* 神经网络拓扑 */}
          <div className="lg:col-span-2">
            <NetworkTopology
              neurons={networkData.neurons}
              connections={networkData.connections}
            />
          </div>

          {/* 右侧面板 */}
          <div className="space-y-6">
            {/* 预测误差监控 */}
            <PredictionMonitor
              predictions={predictions}
              learningEvents={learningEvents}
            />
          </div>
        </section>

        {/* 底部区域 */}
        <section className="grid lg:grid-cols-3 gap-6">
          {/* 交互面板 */}
          <InteractionPanel
            onSendMessage={handleSendMessage}
            onFeedback={handleFeedback}
            isProcessing={isProcessing}
            lastResponse={lastResponse}
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
              <div className="grid md:grid-cols-4 gap-4 text-sm">
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
