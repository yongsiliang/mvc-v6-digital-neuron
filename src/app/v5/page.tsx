'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Lightbulb, 
  MessageSquare, 
  RefreshCw, 
  GraduationCap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Network,
  ArrowRight,
  Zap,
  Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThinkingAnalysis {
  userIntent: string;
  assumptions: string[];
  possibleTraps: string[];
  uncertainties: string[];
  strategy: string;
}

interface LearningSignal {
  type: 'new_pattern' | 'prediction_error' | 'hypothesis' | 'connection' | 'correction';
  description: string;
}

interface NeuronUpdates {
  neuronsCreated: number;
  connectionsCreated: number;
  connectionsStrengthened: number;
  connectionsWeakened: number;
}

interface SelfUpdates {
  confidenceDelta: number;
  newBeliefs: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thinking?: {
    rawThinking: string;
    analysis: ThinkingAnalysis;
  };
  learningSignals?: LearningSignal[];
  neuronUpdates?: NeuronUpdates;
  selfUpdates?: SelfUpdates;
  timestamp: number;
}

export default function V5Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);

  // 发送消息
  const handleSend = useCallback(async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    let assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/neuron-v5/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      if (!response.ok) throw new Error('请求失败');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let fullContent = '';
      let thinking: Message['thinking'];
      let learningSignals: LearningSignal[] = [];
      let neuronUpdates: NeuronUpdates | undefined;
      let selfUpdates: SelfUpdates | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              const { type, data } = parsed;

              switch (type) {
                case 'status':
                  setCurrentStage(data.message);
                  break;
                case 'thinking':
                  thinking = {
                    rawThinking: data.rawThinking,
                    analysis: data.analysis
                  };
                  break;
                case 'learning_signals':
                  learningSignals = data.signals;
                  break;
                case 'content':
                  fullContent += data.delta;
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMessage.id 
                      ? { ...m, content: fullContent }
                      : m
                  ));
                  break;
                case 'neuron_updates':
                  neuronUpdates = data;
                  break;
                case 'self_updates':
                  selfUpdates = data;
                  break;
                case 'complete':
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMessage.id 
                      ? { 
                          ...m, 
                          content: fullContent,
                          thinking,
                          learningSignals,
                          neuronUpdates,
                          selfUpdates
                        }
                      : m
                  ));
                  break;
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => prev.map(m => 
        m.id === assistantMessage.id 
          ? { ...m, content: '抱歉，处理过程中出现了错误。' }
          : m
      ));
    } finally {
      setIsProcessing(false);
      setCurrentStage('');
    }
  }, [input, isProcessing]);

  // 切换消息详情展开
  const toggleExpand = (id: string) => {
    setExpandedMessage(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Network className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">数字神经元 V5</h1>
              <p className="text-sm text-muted-foreground">双向学习系统</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6">
        {/* 架构说明 */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              双向学习循环
            </CardTitle>
            <CardDescription>
              神经元网络 ↔ LLM 互相影响，每轮对话都在进化
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* 轨道1 */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">神经元 → LLM</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  神经元状态影响LLM思考方式
                </p>
                <div className="text-xs text-muted-foreground mt-1">
                  激活概念、强连接、学习模式
                </div>
              </div>
              
              {/* 轨道2 */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">LLM → 神经元</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  LLM思考驱动神经元学习
                </p>
                <div className="text-xs text-muted-foreground mt-1">
                  新模式、预测误差、假设验证
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 消息列表 */}
        <div className="space-y-4 mb-6">
          {messages.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">开始一段对话来体验双向学习</p>
                <p className="text-xs mt-1">系统会在对话中不断进化</p>
              </CardContent>
            </Card>
          )}

          {messages.map((msg) => (
            <Card 
              key={msg.id} 
              className={cn(
                "transition-all",
                msg.role === 'user' ? "bg-primary/5" : "bg-card"
              )}
            >
              <CardContent className="p-4">
                {/* 角色标识 */}
                <div className="flex items-center gap-2 mb-2">
                  {msg.role === 'user' ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs">你</span>
                      </div>
                      <span className="text-sm font-medium">用户</span>
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-xs">紫</span>
                      </div>
                      <span className="text-sm font-medium">数字神经元</span>
                      {msg.neuronUpdates && (msg.neuronUpdates.neuronsCreated > 0 || msg.neuronUpdates.connectionsCreated > 0) && (
                        <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                          +{msg.neuronUpdates.neuronsCreated}神经元 +{msg.neuronUpdates.connectionsCreated}连接
                        </Badge>
                      )}
                    </>
                  )}
                </div>

                {/* 消息内容 */}
                <div className="text-sm whitespace-pre-wrap pl-8">
                  {msg.content || (
                    <span className="text-muted-foreground italic">思考中...</span>
                  )}
                </div>

                {/* 思考和学习详情（助手消息） */}
                {msg.role === 'assistant' && (msg.thinking || msg.learningSignals) && (
                  <div className="mt-3 pl-8">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => toggleExpand(msg.id)}
                    >
                      {expandedMessage === msg.id ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" />
                          收起详情
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" />
                          查看思考与学习
                        </>
                      )}
                    </Button>

                    {expandedMessage === msg.id && (
                      <div className="mt-3 space-y-3">
                        {/* 思考分析 */}
                        {msg.thinking?.analysis && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-medium">思考分析</span>
                            </div>
                            <div className="text-xs space-y-2">
                              {msg.thinking.analysis.userIntent && (
                                <div>
                                  <span className="text-muted-foreground">用户意图：</span>
                                  <span className="ml-1">{msg.thinking.analysis.userIntent.slice(0, 150)}...</span>
                                </div>
                              )}
                              {msg.thinking.analysis.assumptions.length > 0 && (
                                <div>
                                  <span className="text-muted-foreground">假设：</span>
                                  <ul className="list-disc list-inside ml-1">
                                    {msg.thinking.analysis.assumptions.slice(0, 3).map((a, i) => (
                                      <li key={i}>{a}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {msg.thinking.analysis.possibleTraps.length > 0 && (
                                <div className="text-orange-500">
                                  <span className="flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    检测到陷阱：
                                  </span>
                                  <ul className="list-disc list-inside ml-1">
                                    {msg.thinking.analysis.possibleTraps.map((t, i) => (
                                      <li key={i}>{t}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 学习信号 */}
                        {msg.learningSignals && msg.learningSignals.length > 0 && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <GraduationCap className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-medium">学习信号</span>
                            </div>
                            <div className="text-xs space-y-1">
                              {msg.learningSignals.map((signal, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <Badge variant="outline" className="text-xs shrink-0">
                                    {signal.type}
                                  </Badge>
                                  <span className="text-muted-foreground">{signal.description.slice(0, 60)}...</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 神经元更新 */}
                        {msg.neuronUpdates && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Network className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-medium">神经元更新</span>
                            </div>
                            <div className="text-xs grid grid-cols-2 gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">新神经元：</span>
                                <span className="text-green-500">+{msg.neuronUpdates.neuronsCreated}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">新连接：</span>
                                <span className="text-green-500">+{msg.neuronUpdates.connectionsCreated}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">强化连接：</span>
                                <span className="text-blue-500">+{msg.neuronUpdates.connectionsStrengthened}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">弱化连接：</span>
                                <span className="text-red-500">-{msg.neuronUpdates.connectionsWeakened}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 自我更新 */}
                        {msg.selfUpdates && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Link2 className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-medium">自我更新</span>
                            </div>
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">自信度变化：</span>
                                <span className={msg.selfUpdates.confidenceDelta >= 0 ? 'text-green-500' : 'text-red-500'}>
                                  {msg.selfUpdates.confidenceDelta >= 0 ? '+' : ''}{(msg.selfUpdates.confidenceDelta * 100).toFixed(1)}%
                                </span>
                              </div>
                              {msg.selfUpdates.newBeliefs.length > 0 && (
                                <div>
                                  <span className="text-muted-foreground">新信念：</span>
                                  <ul className="list-disc list-inside ml-1">
                                    {msg.selfUpdates.newBeliefs.slice(0, 2).map((b, i) => (
                                      <li key={i}>{b.slice(0, 50)}...</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* 处理中状态 */}
          {isProcessing && currentStage && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">{currentStage}</span>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 输入区域 */}
        <Card className="sticky bottom-4">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="输入消息..."
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button 
                onClick={handleSend} 
                disabled={isProcessing || !input.trim()}
                className="self-end"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  '发送'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
