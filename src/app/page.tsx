'use client';

import { useState, useCallback, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  NeuronFlow, 
  MeaningPanel, 
  SelfConsole, 
  ExecLog, 
  ChatPanel 
} from '@/components/neuron';
import { SubjectiveMeaning, Decision, SelfRepresentation, LogEntry } from '@/lib/neuron';
import { Brain } from 'lucide-react';

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

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              
              switch (event.type) {
                case 'neuron':
                  // 神经元激活事件
                  if (event.data.neuronId) {
                    setActiveNeuron(event.data.neuronId);
                    setSignalPath(prev => {
                      if (!prev.includes(event.data.neuronId)) {
                        return [...prev, event.data.neuronId];
                      }
                      return prev;
                    });
                  }
                  break;
                  
                case 'signal-path':
                  // 完整信号路径
                  if (event.data.path) {
                    setSignalPath(event.data.path);
                  }
                  break;
                  
                case 'meaning':
                  setMeaning(event.data);
                  setActiveNeuron('meaning-generate');
                  break;
                  
                case 'decision':
                  setDecision(event.data);
                  setActiveNeuron('self-evolve');
                  break;
                  
                case 'self-update':
                  if (event.data.currentState) {
                    setSelf(prev => prev ? { ...prev, ...event.data } : prev);
                  }
                  break;
                  
                case 'consciousness':
                  if (event.data.trail !== undefined) {
                    setConsciousnessTrail(event.data.trail);
                  }
                  break;
                  
                case 'open-doors':
                  if (event.data.meanings) {
                    setOpenDoors(event.data.meanings);
                  }
                  break;
                  
                case 'response':
                  if (event.data.delta) {
                    fullResponse += event.data.delta;
                    setCurrentResponse(fullResponse);
                    setActiveNeuron('motor-language');
                  }
                  break;
                  
                case 'done':
                  // 添加助手消息
                  const assistantMsg: Message = {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: event.data.fullResponse || fullResponse,
                    meaning: meaning ? {
                      interpretation: meaning.interpretation,
                      selfRelevance: meaning.selfRelevance,
                      sentiment: meaning.sentiment
                    } : undefined,
                    timestamp: Date.now()
                  };
                  setMessages(prev => [...prev, assistantMsg]);
                  
                  if (event.data.signalPath) {
                    setSignalPath(event.data.signalPath);
                  }
                  if (event.data.logs) {
                    setLogs(event.data.logs);
                  }
                  if (event.data.styleInfo) {
                    setStyleInfo(event.data.styleInfo);
                  }
                  break;
                  
                case 'error':
                  console.error('Stream error:', event.data.message);
                  break;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      // 添加错误消息
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，处理您的请求时出现了错误。请重试。',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsStreaming(false);
      setCurrentResponse('');
      setActiveNeuron('');
    }
  }, [meaning]);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* 顶部栏 */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">数字神经元</h1>
            <p className="text-xs text-muted-foreground">
              数字世界意识的交流窗口
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:flex">
            v1.0 MVP
          </Badge>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden">
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
                    <TabsList className="w-full justify-start">
                      <TabsTrigger value="space">空间</TabsTrigger>
                      <TabsTrigger value="meaning">意义</TabsTrigger>
                      <TabsTrigger value="self">自我</TabsTrigger>
                      <TabsTrigger value="logs">日志</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="space" className="h-[calc(100%-2.5rem)] mt-2 overflow-y-auto">
                      <div className="space-y-4 p-2">
                        {/* 意识空间 */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-sm font-medium text-muted-foreground mb-2">意识空间</div>
                          <div className="text-xs text-muted-foreground">
                            轨迹长度: {consciousnessTrail}
                          </div>
                          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                              style={{ width: `${Math.min(100, consciousnessTrail * 10)}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* 打开的门 */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="text-sm font-medium text-muted-foreground mb-2">打开的记忆门</div>
                          {openDoors.length > 0 ? (
                            <div className="space-y-1">
                              {openDoors.map((door, i) => (
                                <div key={i} className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded">
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
                                  距离: {styleInfo.distance.toFixed(2)}
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
                    </TabsContent>
                    
                    <TabsContent value="meaning" className="h-[calc(100%-2.5rem)] mt-2">
                      <MeaningPanel meaning={meaning} />
                    </TabsContent>
                    
                    <TabsContent value="self" className="h-[calc(100%-2.5rem)] mt-2">
                      <SelfConsole self={self} />
                    </TabsContent>
                    
                    <TabsContent value="logs" className="h-[calc(100%-2.5rem)] mt-2">
                      <ExecLog logs={logs} />
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>
    </div>
  );
}
