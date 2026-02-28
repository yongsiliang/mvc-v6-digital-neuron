'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Send, RotateCcw, Activity, Eye, Lightbulb, Target, CheckCircle, XCircle, Loader2, Globe, Monitor, FileText, Zap, Image, Cpu, Info } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface ExecutorInfo {
  type: string;
  name: string;
  description: string;
  supportedActions: string[];
}

interface CognitiveEvent {
  type: 'perceive' | 'understand' | 'decide' | 'act' | 'observe' | 'complete' | 'error' | 'result';
  data: unknown;
  timestamp: number;
}

interface ActionData {
  action: string;
  target: string;
  value?: string;
  executor?: string;
}

interface ObservationData {
  status: string;
  content: string;
  extracted?: Record<string, unknown>;
  executor?: {
    type: string;
    name: string;
    confidence: number;
  };
}

interface AgentResult {
  success: boolean;
  output?: string;
  stats?: {
    cycles: number;
    state?: unknown;
  };
}

interface LogEntry {
  id: string;
  type: CognitiveEvent['type'];
  icon: React.ReactNode;
  title: string;
  content: string;
  timestamp: number;
  extracted?: Record<string, unknown>;
  executor?: {
    type: string;
    name: string;
    confidence: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 主页面组件
// ─────────────────────────────────────────────────────────────────────

export default function AgentDemoPage() {
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [useRealBrowser, setUseRealBrowser] = useState(true);
  const [executors, setExecutors] = useState<ExecutorInfo[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // 加载执行器信息
  useEffect(() => {
    const fetchExecutors = async () => {
      try {
        const response = await fetch('/api/agent/executors');
        if (response.ok) {
          const data = await response.json();
          setExecutors(data.executors || []);
        }
      } catch {
        // 使用默认执行器列表
        setExecutors([
          { type: 'browser', name: 'Browser Executor', description: '网页浏览执行器', supportedActions: ['navigate', 'click', 'type', 'extract', 'search'] },
          { type: 'multimodal', name: 'Multimodal Executor', description: '多模态执行器', supportedActions: ['vision-analyze', 'ocr-extract'] },
          { type: 'file', name: 'File Executor', description: '文件操作执行器', supportedActions: ['file-read', 'file-write', 'file-list'] },
          { type: 'api', name: 'API Executor', description: 'API调用执行器', supportedActions: ['api-get', 'api-post', 'api-put', 'api-delete'] }
        ]);
      }
    };
    fetchExecutors();
  }, []);
  
  // 添加日志
  const addLog = useCallback((type: CognitiveEvent['type'], title: string, content: string, extracted?: Record<string, unknown>, executor?: LogEntry['executor']) => {
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
      timestamp: Date.now(),
      extracted,
      executor
    }]);
    
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
    
    // 选择 API 端点
    const endpoint = useRealBrowser ? '/api/agent/browser' : '/api/agent';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, stream: true, useRealBrowser })
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
                  addLog('act', `执行: ${actData.action}`, `目标: ${actData.target}${actData.value ? `, 值: ${actData.value}` : ''}${actData.executor ? ` | 执行器: ${actData.executor}` : ''}`);
                  break;
                case 'observe':
                  const obsData = event.data as ObservationData;
                  addLog('observe', `观察: ${obsData.status}`, obsData.content, obsData.extracted, obsData.executor);
                  break;
                case 'complete':
                  const completeData = event.data as { success: boolean; output?: string; stats?: { cycles: number } };
                  addLog('complete', '认知循环完成', completeData.output || '任务处理完毕');
                  if (completeData.stats) {
                    setResult({
                      success: completeData.success,
                      output: completeData.output,
                      stats: completeData.stats
                    });
                  }
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
  }, [input, isRunning, useRealBrowser, addLog]);
  
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
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={useRealBrowser 
                  ? "输入任务，例如：访问 https://example.com 并提取页面内容" 
                  : "输入任务，例如：帮我搜索最新的AI论文..."}
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
            
            {/* 浏览器模式切换 */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="browser-mode"
                  checked={useRealBrowser}
                  onCheckedChange={setUseRealBrowser}
                  disabled={isRunning}
                />
                <Label htmlFor="browser-mode" className="flex items-center gap-2 cursor-pointer">
                  {useRealBrowser ? (
                    <>
                      <Globe className="w-4 h-4 text-green-500" />
                      <span>真实浏览器</span>
                    </>
                  ) : (
                    <>
                      <Monitor className="w-4 h-4 text-blue-500" />
                      <span>模拟模式</span>
                    </>
                  )}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {useRealBrowser 
                  ? "使用 fetch + cheerio 访问真实网页" 
                  : "使用模拟执行器测试认知循环"}
              </p>
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
                        {log.executor && (
                          <Badge variant="secondary" className="text-xs">
                            <Cpu className="w-3 h-3 mr-1" />
                            {log.executor.type} ({(log.executor.confidence * 100).toFixed(0)}%)
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm opacity-80 whitespace-pre-wrap">{log.content}</p>
                      
                      {/* 显示提取的数据 */}
                      {log.extracted && Object.keys(log.extracted).length > 0 && (
                        <div className="mt-2 p-2 bg-black/20 rounded text-xs font-mono">
                          <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                            {JSON.stringify(log.extracted, null, 2)}
                          </pre>
                        </div>
                      )}
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
              
              {result.stats && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{result.stats.cycles}</div>
                    <div className="text-xs text-muted-foreground">认知循环</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{result.success ? '成功' : '失败'}</div>
                    <div className="text-xs text-muted-foreground">状态</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* 可用执行器 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              可用执行器
            </CardTitle>
            <CardDescription>
              根据意图类型自动选择合适的执行器
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {executors.map((executor) => {
                const iconMap: Record<string, React.ReactNode> = {
                  browser: <Globe className="w-4 h-4" />,
                  multimodal: <Image className="w-4 h-4" />,
                  file: <FileText className="w-4 h-4" />,
                  api: <Zap className="w-4 h-4" />
                };
                const colorMap: Record<string, string> = {
                  browser: 'border-green-500/30 bg-green-500/10',
                  multimodal: 'border-purple-500/30 bg-purple-500/10',
                  file: 'border-blue-500/30 bg-blue-500/10',
                  api: 'border-yellow-500/30 bg-yellow-500/10'
                };
                
                return (
                  <div key={executor.type} className={`p-3 rounded-lg border ${colorMap[executor.type] || 'border-border'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {iconMap[executor.type] || <Info className="w-4 h-4" />}
                      <span className="font-medium text-sm">{executor.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{executor.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {executor.supportedActions.slice(0, 3).map((action) => (
                        <Badge key={action} variant="outline" className="text-xs">
                          {action}
                        </Badge>
                      ))}
                      {executor.supportedActions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{executor.supportedActions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
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
                  {useRealBrowser 
                    ? "使用 LightweightBrowserExecutor 访问真实网页。" 
                    : "使用 MockExecutor 模拟执行。"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
