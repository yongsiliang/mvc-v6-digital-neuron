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
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Understanding {
  rawInput: string;
  correctedInput?: string;
  intent: {
    type: string;
    description: string;
    target?: string;
    confidence: number;
  };
  confidence: number;
  reasoning: string;
  wasCorrected?: boolean;
}

interface Reflection {
  scores: {
    coherence: number;
    relevance: number;
    logicalCorrectness: number;
    personality: number;
    naturalness: number;
    overall: number;
  };
  issues: string[];
  learningPoints: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  understanding?: Understanding;
  reflection?: Reflection;
  learning?: string;
  iterations?: number;
  timestamp: number;
}

export default function V4Page() {
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
      const response = await fetch('/api/neuron-v4/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) throw new Error('请求失败');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let fullContent = '';
      let understanding: Understanding | undefined;
      let reflection: Reflection | undefined;
      let learning: string | undefined;
      let iterations: number | undefined;

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
                case 'understanding':
                  understanding = data;
                  break;
                case 'content':
                  fullContent += data.delta;
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMessage.id 
                      ? { ...m, content: fullContent }
                      : m
                  ));
                  break;
                case 'reflection':
                  reflection = data;
                  break;
                case 'learning':
                  learning = data.summary;
                  iterations = data.iterations;
                  break;
                case 'complete':
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMessage.id 
                      ? { 
                          ...m, 
                          content: fullContent,
                          understanding,
                          reflection,
                          learning,
                          iterations
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
  }, [input, isProcessing, messages]);

  // 切换消息详情展开
  const toggleExpand = (id: string) => {
    setExpandedMessage(prev => prev === id ? null : id);
  };

  // 分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">数字神经元 V4</h1>
              <p className="text-sm text-muted-foreground">认知闭环架构</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6">
        {/* 认知闭环说明 */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              认知闭环
            </CardTitle>
            <CardDescription>
              理解 → 决策 → 生成 → 反思 → 学习
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span>理解</span>
              </div>
              <div className="h-px flex-1 bg-border mx-2" />
              <div className="flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-blue-500" />
                <span>决策</span>
              </div>
              <div className="h-px flex-1 bg-border mx-2" />
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-green-500" />
                <span>生成</span>
              </div>
              <div className="h-px flex-1 bg-border mx-2" />
              <div className="flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-purple-500" />
                <span>反思</span>
              </div>
              <div className="h-px flex-1 bg-border mx-2" />
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-orange-500" />
                <span>学习</span>
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
                <p className="text-sm">开始一段对话来体验认知闭环</p>
                <p className="text-xs mt-1">试试问："洗车店离我家50米，走路还是开车去？"</p>
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
                      {msg.iterations && msg.iterations > 1 && (
                        <Badge variant="outline" className="text-xs">
                          {msg.iterations}次迭代
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

                {/* 理解和反思详情（助手消息） */}
                {msg.role === 'assistant' && (msg.understanding || msg.reflection) && (
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
                          查看认知过程
                        </>
                      )}
                    </Button>

                    {expandedMessage === msg.id && (
                      <div className="mt-3 space-y-3">
                        {/* 理解结果 */}
                        {msg.understanding && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-medium">理解阶段</span>
                            </div>
                            <div className="text-xs space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">意图：</span>
                                <span>{msg.understanding.intent.description}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">置信度：</span>
                                <span className={cn(
                                  "font-medium",
                                  msg.understanding.confidence > 0.8 ? "text-green-500" : 
                                  msg.understanding.confidence > 0.6 ? "text-yellow-500" : "text-red-500"
                                )}>
                                  {(msg.understanding.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                              {msg.understanding.wasCorrected && (
                                <div className="flex items-start gap-2 text-orange-500">
                                  <AlertTriangle className="w-3 h-3 mt-0.5" />
                                  <span>
                                    输入已修正："{msg.understanding.rawInput}" → "{msg.understanding.correctedInput}"
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 反思结果 */}
                        {msg.reflection && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <RefreshCw className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-medium">反思阶段</span>
                            </div>
                            <div className="text-xs space-y-2">
                              {/* 分数 */}
                              <div className="grid grid-cols-3 gap-2">
                                {Object.entries(msg.reflection.scores).map(([key, value]) => (
                                  <div key={key} className="flex items-center justify-between">
                                    <span className="text-muted-foreground capitalize">{key}</span>
                                    <span className={cn("font-medium", getScoreColor(value))}>
                                      {(value * 100).toFixed(0)}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* 问题 */}
                              {msg.reflection.issues.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-muted-foreground">发现问题：</span>
                                  <ul className="list-disc list-inside text-red-400">
                                    {msg.reflection.issues.map((issue, i) => (
                                      <li key={i}>{issue}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* 学习点 */}
                              {msg.reflection.learningPoints.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-muted-foreground">学习要点：</span>
                                  <ul className="list-disc list-inside text-green-400">
                                    {msg.reflection.learningPoints.map((point, i) => (
                                      <li key={i}>{point}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 学习摘要 */}
                        {msg.learning && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <GraduationCap className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-medium">学习摘要</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{msg.learning}</p>
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
