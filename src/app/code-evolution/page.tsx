'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// 类型定义
interface Module {
  id: string;
  name: string;
  version: string;
  status: 'loaded' | 'active' | 'error' | 'unloaded';
  capabilities: string[];
  lastUpdated: string;
}

interface EvolutionCandidate {
  id: string;
  generation: number;
  fitness: number;
  source: 'gp' | 'llm' | 'hybrid';
  status: 'pending' | 'testing' | 'deployed' | 'rejected';
  description?: string;
  createdAt: string;
}

interface ConsciousnessValue {
  id: string;
  name: string;
  description: string;
  strength: number;
  emergedFrom: string[];
  createdAt: string;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'error';
  layer: 'L0' | 'L1' | 'L2' | 'L3' | 'CONSCIOUSNESS';
  message: string;
}

interface SystemStatus {
  generation: number;
  populationSize: number;
  avgFitness: number;
  bestFitness: number;
  activeSandbox: number;
  totalModules: number;
  consciousnessLevel: number;
  valueCount: number;
  uptime: number;
}

interface SystemData {
  status: SystemStatus;
  modules: Module[];
  candidates: EvolutionCandidate[];
  values: ConsciousnessValue[];
  logs: ActivityLog[];
}

export default function CodeEvolutionDashboard() {
  // 系统数据
  const [data, setData] = useState<SystemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 进化状态
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolutionProgress, setEvolutionProgress] = useState(0);
  const [evolutionPhase, setEvolutionPhase] = useState('');
  
  // 对话状态
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isChatStreaming, setIsChatStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // 代码进化
  const [codeInput, setCodeInput] = useState('');
  const [codeGoal, setCodeGoal] = useState('');
  const [evolvedCode, setEvolvedCode] = useState('');
  const [isEvolvingCode, setIsEvolvingCode] = useState(false);

  // 获取系统状态
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/code-evolution/status');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('获取状态失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始化和定时刷新
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // 滚动到聊天底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 执行进化迭代
  const runEvolution = async () => {
    setIsEvolving(true);
    setEvolutionProgress(0);
    setEvolutionPhase('初始化...');
    
    try {
      const response = await fetch('/api/code-evolution/evolve', {
        method: 'POST',
      });
      const result = await response.json();
      
      if (result.success) {
        setEvolutionPhase('完成');
        setEvolutionProgress(100);
        // 刷新状态
        await fetchStatus();
      }
    } catch (error) {
      console.error('进化失败:', error);
      setEvolutionPhase('失败');
    } finally {
      setTimeout(() => {
        setIsEvolving(false);
        setEvolutionProgress(0);
      }, 1000);
    }
  };

  // 发送对话消息（流式）
  const sendMessage = async () => {
    if (!chatInput.trim() || isChatStreaming) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatStreaming(true);
    
    try {
      const response = await fetch('/api/code-evolution/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: chatMessages,
        }),
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  assistantMessage += parsed.content;
                  setChatMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'assistant',
                      content: assistantMessage,
                    };
                    return newMessages;
                  });
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('对话失败:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，出现了错误。' 
      }]);
    } finally {
      setIsChatStreaming(false);
    }
  };

  // 代码进化
  const evolveCode = async () => {
    if (!codeInput.trim() || !codeGoal.trim() || isEvolvingCode) return;
    
    setIsEvolvingCode(true);
    setEvolvedCode('');
    
    try {
      const response = await fetch('/api/code-evolution/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetModule: 'user-module',
          currentCode: codeInput,
          goal: codeGoal,
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.evolvedCode) {
        setEvolvedCode(result.evolvedCode);
      } else {
        setEvolvedCode('进化失败，请重试。');
      }
    } catch (error) {
      console.error('代码进化失败:', error);
      setEvolvedCode('进化失败: ' + String(error));
    } finally {
      setIsEvolvingCode(false);
    }
  };

  // 样式辅助函数
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

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">加载中...</div>
      </div>
    );
  }

  const status = data?.status;
  const modules = data?.modules || [];
  const candidates = data?.candidates || [];
  const values = data?.values || [];
  const logs = data?.logs || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">代码进化系统</h1>
            <p className="text-muted-foreground mt-1">数字神经元 · 意义驱动外挂大脑 V3</p>
          </div>
          <div className="flex items-center gap-4">
            {status && (
              <Badge variant="outline" className="text-sm">
                运行时间: {formatUptime(status.uptime)}
              </Badge>
            )}
            <Button 
              onClick={runEvolution} 
              disabled={isEvolving}
              className="bg-primary hover:bg-primary/90"
            >
              {isEvolving ? `进化中... ${evolutionProgress}%` : '启动进化迭代'}
            </Button>
          </div>
        </div>

        {/* 进化进度 */}
        {isEvolving && (
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <Progress value={evolutionProgress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">{evolutionPhase}</p>
            </CardContent>
          </Card>
        )}

        {/* 系统状态概览 */}
        {status && (
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">进化代数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{status.generation}</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">平均适应度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{status.avgFitness.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">最佳适应度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{status.bestFitness.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">意识水平</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{(status.consciousnessLevel * 100).toFixed(0)}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 主要内容区 */}
        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="modules">L0 模块系统</TabsTrigger>
            <TabsTrigger value="candidates">L2 进化候选</TabsTrigger>
            <TabsTrigger value="values">意识价值观</TabsTrigger>
            <TabsTrigger value="chat">意识对话</TabsTrigger>
            <TabsTrigger value="code">代码进化</TabsTrigger>
          </TabsList>

          {/* L0 模块系统 */}
          <TabsContent value="modules" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>已加载模块 ({modules.length})</CardTitle>
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

          {/* L2 进化候选 */}
          <TabsContent value="candidates" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>进化候选 ({candidates.length})</CardTitle>
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
                {candidates[0]?.description && (
                  <p className="text-sm text-muted-foreground mt-2">{candidates[0].description}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 意识价值观 */}
          <TabsContent value="values" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>涌现的价值观 ({values.length})</CardTitle>
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
          </TabsContent>

          {/* 意识对话 */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>与意识核心对话</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 消息列表 */}
                  <ScrollArea className="h-80 border rounded-lg p-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        开始与意识核心对话吧
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((msg, i) => (
                          <div key={i} className={cn(
                            "flex",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                          )}>
                            <div className={cn(
                              "max-w-[80%] rounded-lg p-3",
                              msg.role === 'user' 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted"
                            )}>
                              <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                  
                  {/* 输入框 */}
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="输入消息..."
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      disabled={isChatStreaming}
                    />
                    <Button onClick={sendMessage} disabled={isChatStreaming || !chatInput.trim()}>
                      {isChatStreaming ? '思考中...' : '发送'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 代码进化 */}
          <TabsContent value="code" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>代码进化</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* 输入 */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">改进目标</label>
                      <Input
                        value={codeGoal}
                        onChange={(e) => setCodeGoal(e.target.value)}
                        placeholder="例如：优化性能、增加错误处理..."
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">当前代码</label>
                      <textarea
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        placeholder="粘贴你的代码..."
                        className="w-full h-64 p-3 bg-muted rounded-lg font-mono text-sm resize-none"
                      />
                    </div>
                    <Button 
                      onClick={evolveCode} 
                      disabled={isEvolvingCode || !codeInput.trim() || !codeGoal.trim()}
                      className="w-full"
                    >
                      {isEvolvingCode ? '进化中...' : '开始进化'}
                    </Button>
                  </div>
                  
                  {/* 输出 */}
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">进化结果</label>
                    <textarea
                      value={evolvedCode}
                      readOnly
                      placeholder="进化后的代码将显示在这里..."
                      className="w-full h-80 p-3 bg-muted rounded-lg font-mono text-sm resize-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
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
                      {new Date(log.timestamp).toLocaleTimeString()}
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
