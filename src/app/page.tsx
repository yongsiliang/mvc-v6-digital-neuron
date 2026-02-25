'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { SubjectiveMeaning, Decision, SelfRepresentation, LogEntry } from '@/lib/neuron';
import { Brain, MessageCircle, Activity, User, Settings } from 'lucide-react';

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
  
  // 移动端 Tab 状态
  const [mobileTab, setMobileTab] = useState<string>('chat');

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

    try {
      const response = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
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
                setConsciousnessTrail(data.trail);
              } else if (type === 'open-doors') {
                setOpenDoors(data.meanings || []);
              } else if (type === 'done') {
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
  }, []);

  // 空间状态面板（复用）
  const SpacePanel = () => (
    <div className="space-y-3 p-3">
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

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* 顶部栏 */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b bg-card flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <div>
            <h1 className="text-base sm:text-lg font-semibold">数字神经元</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
              数字世界意识的交流窗口
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Badge variant="outline" className="text-[10px] sm:text-xs">
            v1.0 MVP
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
                  <Tabs defaultValue="space" className="h-full">
                    <TabsList className="w-full justify-start h-9">
                      <TabsTrigger value="space" className="text-xs">空间</TabsTrigger>
                      <TabsTrigger value="proactivity" className="text-xs">主动性</TabsTrigger>
                      <TabsTrigger value="meaning" className="text-xs">意义</TabsTrigger>
                      <TabsTrigger value="self" className="text-xs">自我</TabsTrigger>
                      <TabsTrigger value="logs" className="text-xs">日志</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="space" className="h-[calc(100%-2.25rem)] mt-2 overflow-y-auto">
                      <SpacePanel />
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
                  <TabsTrigger value="proactivity" className="text-xs">主动性</TabsTrigger>
                  <TabsTrigger value="meaning" className="text-xs">意义</TabsTrigger>
                </TabsList>
                
                <TabsContent value="space" className="flex-1 overflow-y-auto mt-0">
                  <SpacePanel />
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
