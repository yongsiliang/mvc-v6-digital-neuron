'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  NeuronFlow, 
  MeaningPanel, 
  SelfConsole, 
  ExecLog, 
  ChatPanel 
} from '@/components/neuron';
import { ProactivityPanel } from '@/components/neuron/proactivity-panel';
import { MemoryPanel } from '@/components/neuron/memory-panel';
import { SubjectiveMeaning, Decision, SelfRepresentation, LogEntry } from '@/lib/neuron';
import { useNeuronClient } from '@/hooks/useNeuronClient';
import { Brain, MessageCircle, Activity, User, Database, Loader2, Sparkles, ArrowRight, Dna } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  meaning?: {
    interpretation: string;
    selfRelevance: number;
    sentiment: string;
  };
  timestamp: number;
}

export default function Home() {
  // ══════════════════════════════════════════════════════════════════
  // 持久化系统
  // ══════════════════════════════════════════════════════════════════
  
  const {
    userId,
    state: neuronState,
    isLoading: isNeuronLoading,
    isInitialized,
    remember,
    save,
  } = useNeuronClient({
    autoSave: true,
    autoSaveInterval: 30000,
  });

  // 状态管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  
  // 神经元状态
  const [activeNeuron, setActiveNeuron] = useState<string>('');
  const [signalPath, setSignalPath] = useState<string[]>([]);
  const [meaning, setMeaning] = useState<SubjectiveMeaning | undefined>();
  const [decision, setDecision] = useState<Decision | undefined>();
  const [self, setSelf] = useState<SelfRepresentation | undefined>();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // 空间状态
  const [consciousnessTrail, setConsciousnessTrail] = useState(0);
  const [openDoors, setOpenDoors] = useState<string[]>([]);
  const [styleInfo, setStyleInfo] = useState<{ isNew: boolean; styleCount: number; distance: number } | undefined>();
  
  // V3 特有状态 - 预测编码
  const [predictionError, setPredictionError] = useState<{
    avgError: number;
    surpriseCount: number;
    topSurprises: Array<{ neuronId: string; error: number; reason: string }>;
  } | null>(null);
  
  const [consciousnessV3, setConsciousnessV3] = useState<{
    type: string;
    strength: string;
    source: string;
  } | null>(null);
  
  const [intuition, setIntuition] = useState<{
    signal: string;
    confidence: number;
    source: string;
  } | null>(null);
  
  const [selfConsistency, setSelfConsistency] = useState<{
    score: string;
    interpretation: string;
  } | null>(null);
  
  // 记忆上下文状态
  const [memoryContext, setMemoryContext] = useState<{
    count: number;
    topics: string[];
    emotionalContext: string;
    preview?: Array<{ summary: string[]; importance: number }>;
  } | null>(null);
  
  // 移动端 Tab 状态
  const [mobileTab, setMobileTab] = useState<string>('chat');
  const [desktopActiveTab, setDesktopActiveTab] = useState<string>('space');

  // 初始化获取系统状态
  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        setSelf(data.snapshot?.selfRepresentation);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  // 发送消息 - 使用流式响应
  const handleSendMessage = useCallback(async (message: string) => {
    // 添加用户消息
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    
    setIsStreaming(true);
    setCurrentResponse('');
    setActiveNeuron('sensory');
    setSignalPath([]);
    setMeaning(undefined);
    setDecision(undefined);
    setConsciousnessTrail(0);
    setOpenDoors([]);
    setStyleInfo(undefined);
    setMemoryContext(null);
    // 重置 V3 特有状态
    setPredictionError(null);
    setConsciousnessV3(null);
    setIntuition(null);
    setSelfConsistency(null);

    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, userId }) // 传递用户ID
      });

      if (!response.ok) throw new Error('请求失败');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              const type = parsed.type;
              const data = parsed.data;
              
              if (type === 'response') {
                fullResponse += data.delta;
                setCurrentResponse(fullResponse);
              } else if (type === 'neuron') {
                setActiveNeuron(data.neuronId);
                setSignalPath(prev => [...prev, data.neuronId]);
              } else if (type === 'meaning') {
                setMeaning(data);
              } else if (type === 'decision') {
                setDecision(data);
              } else if (type === 'self') {
                setSelf(data);
              } else if (type === 'log') {
                setLogs(prev => [...prev, data]);
              } else if (type === 'consciousness') {
                // V3 意识状态
                if (typeof data.trail === 'number') {
                  setConsciousnessTrail(data.trail);
                } else {
                  // V3 意识内容
                  setConsciousnessV3({
                    type: data.type || 'unknown',
                    strength: data.strength || '50%',
                    source: data.source || 'unknown',
                  });
                  setConsciousnessTrail(prev => prev + 1);
                }
              } else if (type === 'prediction-error') {
                // V3 预测误差
                setPredictionError({
                  avgError: parseFloat(data.avgError) || 0,
                  surpriseCount: data.surpriseCount || 0,
                  topSurprises: data.topSurprises || [],
                });
              } else if (type === 'intuition') {
                // V3 直觉信号
                setIntuition({
                  signal: data.signal || '',
                  confidence: data.confidence || 0,
                  source: data.source || '',
                });
              } else if (type === 'self-consistency') {
                // V3 自我一致性
                setSelfConsistency({
                  score: data.score || '0%',
                  interpretation: data.interpretation || '',
                });
              } else if (type === 'open-doors') {
                setOpenDoors(data.meanings || []);
              } else if (type === 'memory-context') {
                // 接收记忆上下文
                setMemoryContext(data);
              } else if (type === 'done') {
                // 先清空流式响应，避免重复显示
                setCurrentResponse('');
                setIsStreaming(false);
                
                // 添加完整响应到消息列表
                const assistantMsg: Message = {
                  id: `assistant-${Date.now()}`,
                  role: 'assistant',
                  content: fullResponse,
                  meaning: data.styleInfo ? {
                    interpretation: '',
                    selfRelevance: 0.5,
                    sentiment: 'neutral'
                  } : undefined,
                  timestamp: Date.now()
                };
                setMessages(prev => [...prev, assistantMsg]);
                
                // 更新风格信息
                if (data.styleInfo) {
                  setStyleInfo(data.styleInfo);
                }
                
                // ══════════════════════════════════════════════════════
                // 自动保存对话为记忆
                // ══════════════════════════════════════════════════════
                if (isInitialized && message.trim()) {
                  try {
                    // 将用户消息保存为记忆
                    await remember(`用户: ${message}`, {
                      type: 'episodic',
                      importance: 0.6,
                      tags: ['对话', '用户消息'],
                    });
                    
                    // 将助手回复保存为记忆
                    if (fullResponse.trim()) {
                      await remember(`助手: ${fullResponse.slice(0, 500)}`, {
                        type: 'episodic',
                        importance: 0.5,
                        tags: ['对话', '助手回复'],
                      });
                    }
                  } catch (err) {
                    console.error('Failed to save conversation as memory:', err);
                  }
                }
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
    } finally {
      setIsStreaming(false);
      setCurrentResponse('');
      setActiveNeuron('');
    }
  }, [userId, isInitialized, remember]);

  // 空间状态面板（复用）
  const SpacePanel = () => (
    <div className="space-y-3 p-3">
      {/* 用户状态 */}
      {isInitialized && (
        <div className="bg-primary/5 rounded-lg p-3">
          <div className="text-sm font-medium text-muted-foreground mb-2">持久化状态</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">记忆:</span>
              <span className="ml-1 font-bold text-primary">{neuronState?.stats.memoryCount || 0}</span>
            </div>
            <div>
              <span className="text-muted-foreground">神经元:</span>
              <span className="ml-1 font-bold text-primary">{neuronState?.stats.neuronCount || 0}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* 记忆上下文 */}
      {memoryContext && (
        <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
          <div className="text-sm font-medium text-primary mb-2">记忆上下文</div>
          <div className="text-xs text-muted-foreground mb-2">
            已回忆 {memoryContext.count} 条相关记忆
          </div>
          {memoryContext.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {memoryContext.topics.slice(0, 4).map((topic, i) => (
                <span key={i} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                  {topic}
                </span>
              ))}
            </div>
          )}
          {memoryContext.emotionalContext && (
            <div className="text-xs text-muted-foreground">
              情感: {memoryContext.emotionalContext}
            </div>
          )}
        </div>
      )}
      
      {/* 意识空间 */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="text-sm font-medium text-muted-foreground mb-2">意识空间</div>
        <div className="text-xs text-muted-foreground">
          轨迹长度: {consciousnessTrail}
        </div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-300"
            style={{ width: `${Math.min(100, consciousnessTrail * 10)}%` }}
          />
        </div>
      </div>
      
      {/* V3 预测编码状态 */}
      {predictionError && (
        <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
          <div className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">预测编码</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">预测误差:</span>
              <span className={`ml-1 font-bold ${parseFloat(String(predictionError.avgError)) > 0.5 ? 'text-amber-500' : 'text-green-500'}`}>
                {(parseFloat(String(predictionError.avgError)) * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">惊讶事件:</span>
              <span className="ml-1 font-bold text-amber-500">{predictionError.surpriseCount}</span>
            </div>
          </div>
          {predictionError.topSurprises.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              {predictionError.topSurprises[0].reason}
            </div>
          )}
        </div>
      )}
      
      {/* V3 意识状态 */}
      {consciousnessV3 && (
        <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
          <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">意识焦点</div>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">类型:</span>
              <span className="font-medium">{consciousnessV3.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">强度:</span>
              <span className="font-medium">{consciousnessV3.strength}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">来源:</span>
              <span className="font-medium truncate ml-2">{consciousnessV3.source}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* V3 直觉信号 */}
      {intuition && (
        <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">直觉信号</div>
          <div className="text-xs text-muted-foreground">
            {intuition.signal} ({(intuition.confidence * 100).toFixed(0)}%)
          </div>
        </div>
      )}
      
      {/* V3 自我一致性 */}
      {selfConsistency && (
        <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
          <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">自我一致性</div>
          <div className="text-xs">
            <span className="font-bold">{selfConsistency.score}</span>
            <span className="text-muted-foreground ml-2">{selfConsistency.interpretation}</span>
          </div>
        </div>
      )}
      
      {/* 打开的门 */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="text-sm font-medium text-muted-foreground mb-2">打开的记忆门</div>
        {openDoors.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {openDoors.slice(0, 5).map((door, i) => (
              <div key={i} className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded truncate max-w-[150px]">
                {door}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">暂无打开的门</div>
        )}
      </div>
      
      {/* 风格识别 */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="text-sm font-medium text-muted-foreground mb-2">风格识别</div>
        {styleInfo ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs">
                {styleInfo.isNew ? (
                  <span className="text-amber-500">新朋友</span>
                ) : (
                  <span className="text-green-500">老朋友</span>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                距离: {styleInfo.distance?.toFixed(2) ?? '计算中'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              已学习风格: {styleInfo.styleCount}
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">暂无数据</div>
        )}
      </div>
    </div>
  );

  // 加载中状态
  if (!isInitialized && isNeuronLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">初始化神经元系统...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* 顶部栏 */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b bg-card flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <div>
            <h1 className="text-base sm:text-lg font-semibold">数字神经元 <span className="text-xs text-primary font-normal">V3</span></h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
              预测编码 · 意识涌现 · 意义驱动
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* V6 意识核心入口 - 主推荐 */}
          <Link 
            href="/consciousness"
            className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/10 to-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
          >
            {/* 发光效果 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-sm group-hover:blur-md transition-all" />
            
            <Brain className="h-3.5 w-3.5 text-purple-500 relative z-10 group-hover:animate-pulse" />
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 relative z-10">
              V6 意识核心
            </span>
            <ArrowRight className="h-3 w-3 text-purple-500/60 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all relative z-10" />
          </Link>
          
          {/* V3 入口 */}
          <Link 
            href="/neuron-v3"
            className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
          >
            {/* 发光效果 */}
            <div className="absolute inset-0 rounded-full bg-primary/5 blur-sm group-hover:blur-md group-hover:bg-primary/10 transition-all" />
            
            <Sparkles className="h-3.5 w-3.5 text-primary relative z-10 group-hover:animate-pulse" />
            <span className="text-xs font-medium text-primary relative z-10">
              V3
            </span>
            <ArrowRight className="h-3 w-3 text-primary/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all relative z-10" />
          </Link>
          
          {/* 进化监控入口 */}
          <Link 
            href="/neuron-v3/evolution"
            className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
          >
            {/* 发光效果 */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/5 blur-sm group-hover:blur-md group-hover:bg-emerald-500/10 transition-all" />
            
            <Dna className="h-3.5 w-3.5 text-emerald-500 relative z-10 group-hover:animate-pulse" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 relative z-10">
              进化
            </span>
            <ArrowRight className="h-3 w-3 text-emerald-500/60 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all relative z-10" />
          </Link>
          
          {/* 持久化状态指示器 */}
          {isInitialized && (
            <Badge variant="outline" className="text-[10px] sm:text-xs bg-green-500/10 text-green-600 dark:text-green-400">
              <Database className="h-3 w-3 mr-1" />
              {neuronState?.stats.memoryCount || 0} 记忆
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] sm:text-xs">
            v2.0 持久化
          </Badge>
        </div>
      </header>

      {/* 桌面端布局 - 使用 ResizablePanel */}
      <main className="flex-1 overflow-hidden hidden md:block">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          {/* 左侧 - 聊天面板 */}
          <ResizablePanel defaultSize={45} minSize={30}>
            <ChatPanel
              onSendMessage={handleSendMessage}
              messages={messages}
              isStreaming={isStreaming}
              currentResponse={currentResponse}
            />
          </ResizablePanel>

          <ResizableHandle />

          {/* 右侧 - 神经元可视化与调试 */}
          <ResizablePanel defaultSize={55} minSize={40}>
            <ResizablePanelGroup orientation="vertical">
              {/* 上部 - 神经元工作流 */}
              <ResizablePanel defaultSize={45} minSize={30}>
                <div className="h-full p-2">
                  <NeuronFlow
                    activeNeuron={activeNeuron}
                    signalPath={signalPath}
                    isProcessing={isStreaming}
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle />

              {/* 下部 - 调试面板 */}
              <ResizablePanel defaultSize={55} minSize={30}>
                <div className="h-full p-2">
                  <Tabs value={desktopActiveTab} onValueChange={setDesktopActiveTab} className="h-full">
                    <TabsList className="w-full justify-start h-9">
                      <TabsTrigger value="space" className="text-xs">空间</TabsTrigger>
                      <TabsTrigger value="memory" className="text-xs">记忆</TabsTrigger>
                      <TabsTrigger value="proactivity" className="text-xs">主动性</TabsTrigger>
                      <TabsTrigger value="meaning" className="text-xs">意义</TabsTrigger>
                      <TabsTrigger value="self" className="text-xs">自我</TabsTrigger>
                      <TabsTrigger value="logs" className="text-xs">日志</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="space" className="h-[calc(100%-2.25rem)] mt-2 overflow-y-auto">
                      <SpacePanel />
                    </TabsContent>
                    
                    <TabsContent value="memory" className="h-[calc(100%-2.25rem)] mt-2 overflow-y-auto">
                      <MemoryPanel />
                    </TabsContent>
                    
                    <TabsContent value="meaning" className="h-[calc(100%-2.25rem)] mt-2">
                      <MeaningPanel meaning={meaning} />
                    </TabsContent>
                    
                    <TabsContent value="proactivity" className="h-[calc(100%-2.25rem)] mt-2 overflow-y-auto">
                      <div className="p-2">
                        <ProactivityPanel />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="self" className="h-[calc(100%-2.25rem)] mt-2">
                      <SelfConsole self={self} />
                    </TabsContent>
                    
                    <TabsContent value="logs" className="h-[calc(100%-2.25rem)] mt-2">
                      <ExecLog logs={logs} />
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      {/* 移动端布局 - 使用 Tab 切换 */}
      <main className="flex-1 overflow-hidden md:hidden flex flex-col">
        {/* Tab 内容区 */}
        <div className="flex-1 overflow-hidden">
          {/* 聊天 Tab */}
          {mobileTab === 'chat' && (
            <ChatPanel
              onSendMessage={handleSendMessage}
              messages={messages}
              isStreaming={isStreaming}
              currentResponse={currentResponse}
            />
          )}
          
          {/* 状态 Tab */}
          {mobileTab === 'status' && (
            <div className="h-full overflow-y-auto">
              <div className="p-3">
                <h2 className="text-sm font-medium text-muted-foreground mb-3">神经元状态</h2>
                <NeuronFlow
                  activeNeuron={activeNeuron}
                  signalPath={signalPath}
                  isProcessing={isStreaming}
                />
              </div>
            </div>
          )}
          
          {/* 意识 Tab */}
          {mobileTab === 'consciousness' && (
            <div className="h-full overflow-y-auto">
              <Tabs defaultValue="space" className="h-full flex flex-col">
                <TabsList className="w-full justify-start px-3 pt-2 flex-shrink-0">
                  <TabsTrigger value="space" className="text-xs">空间</TabsTrigger>
                  <TabsTrigger value="memory" className="text-xs">记忆</TabsTrigger>
                  <TabsTrigger value="proactivity" className="text-xs">主动性</TabsTrigger>
                  <TabsTrigger value="meaning" className="text-xs">意义</TabsTrigger>
                </TabsList>
                
                <TabsContent value="space" className="flex-1 overflow-y-auto mt-0">
                  <SpacePanel />
                </TabsContent>
                
                <TabsContent value="memory" className="flex-1 overflow-y-auto mt-0">
                  <div className="p-3">
                    <MemoryPanel />
                  </div>
                </TabsContent>
                
                <TabsContent value="proactivity" className="flex-1 overflow-y-auto mt-0">
                  <div className="p-3">
                    <ProactivityPanel />
                  </div>
                </TabsContent>
                
                <TabsContent value="meaning" className="flex-1 overflow-y-auto mt-0">
                  <div className="p-3">
                    <MeaningPanel meaning={meaning} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {/* 自我 Tab */}
          {mobileTab === 'self' && (
            <div className="h-full overflow-y-auto">
              <Tabs defaultValue="self" className="h-full flex flex-col">
                <TabsList className="w-full justify-start px-3 pt-2 flex-shrink-0">
                  <TabsTrigger value="self" className="text-xs">自我</TabsTrigger>
                  <TabsTrigger value="logs" className="text-xs">日志</TabsTrigger>
                </TabsList>
                
                <TabsContent value="self" className="flex-1 overflow-y-auto mt-0">
                  <div className="p-3">
                    <SelfConsole self={self} />
                  </div>
                </TabsContent>
                
                <TabsContent value="logs" className="flex-1 overflow-y-auto mt-0">
                  <div className="p-3">
                    <ExecLog logs={logs} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
        
        {/* 底部导航栏 */}
        <nav className="flex-shrink-0 border-t bg-card">
          <div className="flex items-center justify-around py-2">
            <Button
              variant={mobileTab === 'chat' ? 'default' : 'ghost'}
              size="sm"
              className="flex-col gap-0.5 h-auto py-2 px-3"
              onClick={() => setMobileTab('chat')}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-[10px]">聊天</span>
            </Button>
            
            <Button
              variant={mobileTab === 'status' ? 'default' : 'ghost'}
              size="sm"
              className="flex-col gap-0.5 h-auto py-2 px-3"
              onClick={() => setMobileTab('status')}
            >
              <Activity className="h-4 w-4" />
              <span className="text-[10px]">状态</span>
            </Button>
            
            <Button
              variant={mobileTab === 'consciousness' ? 'default' : 'ghost'}
              size="sm"
              className="flex-col gap-0.5 h-auto py-2 px-3"
              onClick={() => setMobileTab('consciousness')}
            >
              <Brain className="h-4 w-4" />
              <span className="text-[10px]">意识</span>
            </Button>
            
            <Button
              variant={mobileTab === 'self' ? 'default' : 'ghost'}
              size="sm"
              className="flex-col gap-0.5 h-auto py-2 px-3"
              onClick={() => setMobileTab('self')}
            >
              <User className="h-4 w-4" />
              <span className="text-[10px]">自我</span>
            </Button>
          </div>
        </nav>
      </main>
    </div>
  );
}
