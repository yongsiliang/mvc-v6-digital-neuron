/**
 * ═══════════════════════════════════════════════════════════════════════
 * Agent 演示页面
 * Agent Demo Page
 * 
 * 展示Agent执行能力的交互界面
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
  Bot, Send, Loader2, Wrench, CheckCircle, XCircle, 
  Lightbulb, ArrowRight, Clock, Zap, Brain
} from 'lucide-react';

// 类型定义
interface AgentStep {
  id: string;
  type: 'think' | 'tool_call' | 'observation' | 'conclusion';
  content: string;
  toolCall?: {
    toolName: string;
    arguments: Record<string, unknown>;
  };
  toolResult?: {
    success: boolean;
    output?: unknown;
    error?: string;
  };
  timestamp: number;
}

interface AgentResult {
  success: boolean;
  answer: string;
  steps: AgentStep[];
  toolsUsed: string[];
  duration: number;
  confidence: number;
}

interface ToolDefinition {
  name: string;
  description: string;
  category?: string;
  dangerous?: boolean;
}

// 示例任务
const EXAMPLE_TASKS = [
  '帮我搜索一下今天的天气',
  '读取项目中的README文件',
  '执行一段JavaScript代码计算斐波那契数列',
  '获取当前系统信息'
];

export default function AgentPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 加载可用工具
  useEffect(() => {
    fetch('/api/agent')
      .then(res => res.json())
      .then(data => setTools(data.tools || []))
      .catch(err => console.error('加载工具失败:', err));
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

  // 获取步骤图标
  const getStepIcon = (type: string) => {
    switch (type) {
      case 'think': return <Brain className="w-4 h-4 text-purple-400" />;
      case 'tool_call': return <Wrench className="w-4 h-4 text-blue-400" />;
      case 'observation': return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      case 'conclusion': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <ArrowRight className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 头部 */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Agent 执行器</h1>
              <p className="text-sm text-muted-foreground">会思考的AI助手</p>
            </div>
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            返回首页
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：工具列表 */}
          <Card className="lg:col-span-1 bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                可用工具
              </CardTitle>
              <CardDescription>
                Agent 可以调用的工具 ({tools.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {tools.map(tool => (
                    <div 
                      key={tool.name}
                      className="p-3 rounded-lg bg-muted/50 border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{tool.name}</span>
                        {tool.dangerous && (
                          <Badge variant="destructive" className="text-xs">危险</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                      {tool.category && (
                        <Badge variant="outline" className="text-xs mt-2">{tool.category}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 右侧：执行区域 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 输入区域 */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle>执行任务</CardTitle>
                <CardDescription>
                  输入任务，Agent将自动分解并执行
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="输入任务，例如：帮我搜索今天的新闻..."
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
                          setInput(task);
                          executeTask(task);
                        }}
                        disabled={isLoading}
                      >
                        {task}
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
                                {step.type.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                #{index + 1}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {step.content}
                            </p>
                            {step.toolCall && (
                              <div className="mt-2 p-2 rounded bg-blue-500/10 text-xs">
                                <span className="text-blue-400">{step.toolCall.toolName}</span>
                                <pre className="mt-1 text-muted-foreground overflow-x-auto">
                                  {JSON.stringify(step.toolCall.arguments, null, 2)}
                                </pre>
                              </div>
                            )}
                            {step.toolResult && (
                              <div className={`mt-2 p-2 rounded text-xs ${
                                step.toolResult.success ? 'bg-green-500/10' : 'bg-red-500/10'
                              }`}>
                                {step.toolResult.success ? (
                                  <CheckCircle className="w-3 h-3 text-green-400 inline mr-1" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-red-400 inline mr-1" />
                                )}
                                {step.toolResult.success ? '成功' : step.toolResult.error}
                              </div>
                            )}
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
                  <p className="text-foreground">{result.answer}</p>
                  
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {result.duration}ms
                    </div>
                    <div className="flex items-center gap-1">
                      <Wrench className="w-4 h-4" />
                      {result.toolsUsed.length} 工具
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      置信度: {(result.confidence * 100).toFixed(0)}%
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
