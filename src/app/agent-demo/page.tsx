'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Send, RotateCcw, Activity, Eye, Lightbulb, Target, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface CognitiveEvent {
  type: 'perceive' | 'understand' | 'decide' | 'act' | 'observe' | 'complete' | 'error' | 'result';
  data: unknown;
  timestamp: number;
}

interface ActionData {
  action: string;
  target: string;
  value?: string;
}

interface ObservationData {
  status: string;
  content: string;
}

interface AgentResult {
  success: boolean;
  output?: string;
  stats: {
    totalCycles: number;
    totalActions: number;
    successActions: number;
    failedActions: number;
    durationMs: number;
  };
}

interface LogEntry {
  id: string;
  type: CognitiveEvent['type'];
  icon: React.ReactNode;
  title: string;
  content: string;
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────────────
// 主页面组件
// ─────────────────────────────────────────────────────────────────────

export default function AgentDemoPage() {
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<AgentResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 添加日志
  const addLog = useCallback((type: CognitiveEvent['type'], title: string, content: string) => {
    const iconMap: Record<CognitiveEvent['type'], React.ReactNode> = {
      perceive: <Eye className="w-4 h-4" />,
      understand: <Brain className="w-4 h-4" />,
      decide: <Lightbulb className="w-4 h-4" />,
      act: <Target className="w-4 h-4" />,
      observe: <Activity className="w-4 h-4" />,
      complete: <CheckCircle className="w-4 h-4" />,
      error: <XCircle className="w-4 h-4" />,
      result: <CheckCircle className="w-4 h-4" />
    };
    
    setLogs(prev => [...prev, {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      icon: iconMap[type],
      title,
      content,
      timestamp: Date.now()
    }]);
    
    // 自动滚动到底部
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }, []);
  
  // 运行 Agent
  const runAgent = useCallback(async () => {
    if (!input.trim() || isRunning) return;
    
    setIsRunning(true);
    setLogs([]);
    setResult(null);
    
    addLog('perceive', '启动认知循环', `输入: ${input}`);
    
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, stream: true })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');
      
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: CognitiveEvent = JSON.parse(line.slice(6));
              
              switch (event.type) {
                case 'perceive':
                  addLog('perceive', '感知阶段', '收集和编码信息...');
                  break;
                case 'understand':
                  addLog('understand', '理解阶段', '解析用户意图...');
                  break;
                case 'decide':
                  const decideData = event.data as { thought?: string };
                  if (decideData.thought) {
                    addLog('decide', '决策阶段', decideData.thought);
                  }
                  break;
                case 'act':
                  const actData = event.data as ActionData;
                  addLog('act', `执行: ${actData.action}`, `目标: ${actData.target}${actData.value ? `, 值: ${actData.value}` : ''}`);
                  break;
                case 'observe':
                  const obsData = event.data as ObservationData;
                  addLog('observe', `观察: ${obsData.status}`, obsData.content);
                  break;
                case 'complete':
                  addLog('complete', '认知循环完成', '任务处理完毕');
                  break;
                case 'error':
                  addLog('error', '错误', JSON.stringify(event.data));
                  break;
                case 'result':
                  const resultData = event.data as AgentResult;
                  setResult(resultData);
                  break;
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      addLog('error', '执行失败', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  }, [input, isRunning, addLog]);
  
  // 重置
  const handleReset = useCallback(() => {
    setLogs([]);
    setResult(null);
    setInput('');
  }, []);
  
  // 获取类型颜色
  const getTypeColor = (type: CognitiveEvent['type']) => {
    const colors: Record<CognitiveEvent['type'], string> = {
      perceive: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      understand: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      decide: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      act: 'bg-green-500/20 text-green-400 border-green-500/30',
      observe: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      complete: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30',
      result: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Brain className="w-8 h-8 text-primary" />
            认知智能体
          </h1>
          <p className="text-muted-foreground">
            认知循环: Perceive → Understand → Decide → Act → Observe
          </p>
        </div>
        
        {/* 输入区域 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">输入任务</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="输入任务，例如：帮我搜索最新的AI论文..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runAgent()}
                disabled={isRunning}
                className="flex-1"
              />
              <Button onClick={runAgent} disabled={isRunning || !input.trim()}>
                {isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={isRunning}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* 认知循环日志 */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              认知循环过程
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]" ref={scrollRef}>
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    输入任务后，认知循环过程将在这里展示
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border ${getTypeColor(log.type)}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {log.icon}
                        <span className="font-medium">{log.title}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {log.type}
                        </Badge>
                      </div>
                      <p className="text-sm opacity-80">{log.content}</p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* 结果统计 */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                执行结果
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.output && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{result.output}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{result.stats.totalCycles}</div>
                  <div className="text-xs text-muted-foreground">认知循环</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{result.stats.totalActions}</div>
                  <div className="text-xs text-muted-foreground">执行行动</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{result.stats.successActions}</div>
                  <div className="text-xs text-muted-foreground">成功</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{result.stats.durationMs}ms</div>
                  <div className="text-xs text-muted-foreground">耗时</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* 架构说明 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">架构说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  信息层
                </h3>
                <p className="text-sm text-muted-foreground">
                  编码、存储、分发信息结构。将原始信息转换为不同表示形式。
                </p>
              </div>
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  智能层
                </h3>
                <p className="text-sm text-muted-foreground">
                  LLM理解、决策、记忆。执行认知循环的核心。
                </p>
              </div>
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  行动层
                </h3>
                <p className="text-sm text-muted-foreground">
                  执行操作、观察结果。将信息结构转化为可执行行动。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
