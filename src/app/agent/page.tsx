/**
 * ═══════════════════════════════════════════════════════════════════════
 * Agent 演示页面
 * Agent Demo Page
 * 
 * 核心理念：
 * - 不预设工具列表
 * - LLM动态编排能力
 * - 3个核心能力覆盖所有场景
 * ═══════════════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, Send, Loader2, Code, Globe, Monitor, 
  Lightbulb, ArrowRight, Clock, Zap, Brain,
  CheckCircle, XCircle, Sparkles
} from 'lucide-react';

// 类型定义
interface AgentStep {
  id: string;
  type: 'thought' | 'action' | 'observation';
  content: string;
  capability?: {
    type: string;
    params: Record<string, unknown>;
  };
  result?: {
    success: boolean;
    output?: unknown;
    error?: string;
  };
  timestamp: number;
}

interface AgentResult {
  success: boolean;
  response: string;
  steps: AgentStep[];
  duration: number;
}

interface Capability {
  type: string;
  description: string;
  examples: string[];
}

// 示例任务 - 展示3个核心能力
const EXAMPLE_TASKS = [
  { label: '计算斐波那契', input: '用JavaScript计算斐波那契数列前10项', capability: 'execute_code' },
  { label: '获取网页', input: '获取 https://example.com 的内容', capability: 'http_request' },
  { label: '直接回答', input: '什么是量子计算？', capability: 'none' },
];

export default function AgentPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 加载核心能力
  useEffect(() => {
    fetch('/api/agent')
      .then(res => res.json())
      .then(data => setCapabilities(data.capabilities || []))
      .catch(err => console.error('加载能力失败:', err));
  }, []);

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  // 执行任务
  const executeTask = useCallback(async (taskInput: string) => {
    if (!taskInput.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setSteps([]);
    setResult(null);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: taskInput, stream: true })
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'step') {
                setSteps(prev => [...prev, data.step]);
              } else if (data.type === 'complete') {
                setResult(data.result);
              } else if (data.type === 'error') {
                setError(data.error);
              }
            } catch (e) {
              console.error('解析数据失败:', e);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '执行失败');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // 处理提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeTask(input);
  };

  // 获取能力图标
  const getCapabilityIcon = (type: string) => {
    switch (type) {
      case 'execute_code': return <Code className="w-5 h-5 text-blue-400" />;
      case 'http_request': return <Globe className="w-5 h-5 text-green-400" />;
      case 'browser_action': return <Monitor className="w-5 h-5 text-orange-400" />;
      default: return <Sparkles className="w-5 h-5 text-purple-400" />;
    }
  };

  // 获取步骤图标
  const getStepIcon = (type: string) => {
    switch (type) {
      case 'thought': return <Brain className="w-4 h-4 text-purple-400" />;
      case 'action': return <Zap className="w-4 h-4 text-blue-400" />;
      case 'observation': return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      default: return <ArrowRight className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 头部 */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Agent 执行器</h1>
              <p className="text-sm text-muted-foreground">3个核心能力，无限可能</p>
            </div>
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            返回首页
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：核心能力说明 */}
          <Card className="lg:col-span-1 bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                核心能力
              </CardTitle>
              <CardDescription>
                无需预设工具，LLM动态编排
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {capabilities.map(cap => (
                  <div 
                    key={cap.type}
                    className="p-4 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getCapabilityIcon(cap.type)}
                      <span className="font-medium">{cap.description}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cap.examples.map((ex, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {ex}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-400">
                  <strong>设计理念：</strong><br/>
                  世界上的工具有无数个，不可能逐个实现。<br/>
                  但所有工具都可以用这3个核心能力组合实现！
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 右侧：执行区域 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 输入区域 */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle>执行任务</CardTitle>
                <CardDescription>
                  输入任何任务，Agent会自动选择合适的能力
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="输入任何任务..."
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </form>

                {/* 示例任务 */}
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">示例任务:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_TASKS.map((task, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInput(task.input);
                          executeTask(task.input);
                        }}
                        disabled={isLoading}
                        className="gap-1"
                      >
                        {task.capability !== 'none' && getCapabilityIcon(task.capability)}
                        {task.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 执行步骤 */}
            {steps.length > 0 && (
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    执行过程
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]" ref={scrollRef}>
                    <div className="space-y-3">
                      {steps.map((step, index) => (
                        <div 
                          key={step.id}
                          className="flex gap-3 items-start p-3 rounded-lg bg-muted/30"
                        >
                          <div className="mt-0.5">
                            {getStepIcon(step.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm capitalize">
                                {step.type === 'thought' ? '思考' : 
                                 step.type === 'action' ? '行动' : '观察'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                #{index + 1}
                              </span>
                            </div>
                            <pre className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words overflow-x-auto max-h-40">
                              {step.content.substring(0, 500)}
                              {step.content.length > 500 && '...'}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* 执行结果 */}
            {result && (
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    执行结果
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{result.response}</p>
                  
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {result.duration}ms
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      {result.steps.length} 步骤
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 错误提示 */}
            {error && (
              <Card className="bg-red-500/10 border-red-500/50">
                <CardContent className="py-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
