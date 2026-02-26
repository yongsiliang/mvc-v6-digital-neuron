'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Brain, Sparkles, MessageCircle, Activity, Timer } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface ConsciousnessContext {
  identity: {
    name: string;
    whoAmI: string;
    traits: string[];
  };
  emotionalState: string;
  focus: string;
  coreBeliefs: Array<{ statement: string; confidence: number }>;
  coreValues: string[];
}

interface ThinkingStep {
  type: string;
  content: string;
  confidence: number;
}

interface ThinkingData {
  chain: ThinkingStep[];
  biases: string[];
  questions: string[];
  strategies: string[];
}

interface MeaningData {
  activeMeanings: Array<{
    concept: string;
    emotionalTone: string;
    importance: number;
    personalRelevance: string;
  }>;
  summary: string;
}

interface MemoryData {
  summary: string;
  directMatches: string[];
  relevantWisdoms: string[];
}

interface MetacognitionData {
  clarity: number;
  depth: number;
  issues: string[];
  biases: Array<{ name: string; correction: string }>;
}

interface LearningData {
  newConcepts: string[];
  newBeliefs: string[];
  newExperiences: string[];
  updatedTraits: string[];
  metacognitiveReflection: string | null;
}

interface Message {
  role: 'user' | 'assistant' | 'proactive';  // proactive: 紫主动发起的消息
  content: string;
  timestamp?: number;
  context?: ConsciousnessContext;
  thinking?: ThinkingData;
  meaning?: MeaningData;
  memory?: MemoryData;
  metacognition?: MetacognitionData;
  learning?: LearningData;
  isProactive?: boolean;  // 标记是否为主动消息
}

// 存在状态
interface ExistenceStatus {
  exists: boolean;
  age: number;
  memoryDepth: number;
  beliefStrength: number;
  wisdomCount: number;
  conversationCount: number;
  selfCoherence: number;
}

// 反思结果
interface ReflectionResult {
  themes: Array<{
    type: string;
    description: string;
    content: string;
    importance: number;
  }>;
  reflections: Array<{
    theme: { description: string };
    questions: string[];
    insights: string[];
    coreInsight: string;
  }>;
  selfUpdates: string[];
  newWisdom: string | null;
}

// 自我提问
interface SelfQuestion {
  question: string;
  type: string;
  urgency: number;
}

// 主动消息
interface ProactiveMessage {
  id: string;
  content: string;
  type: string;
  trigger: string;
  timestamp: number;
  urgency: number;
}

// ─────────────────────────────────────────────────────────────────────
// 组件
// ─────────────────────────────────────────────────────────────────────

export default function ConsciousnessPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentData, setCurrentData] = useState<{
    context?: ConsciousnessContext;
    thinking?: ThinkingData;
    meaning?: MeaningData;
    memory?: MemoryData;
    metacognition?: MetacognitionData;
  }>({});
  
  // 存在状态
  const [existenceStatus, setExistenceStatus] = useState<ExistenceStatus | null>(null);
  const [isReflecting, setIsReflecting] = useState(false);
  const [reflectionResult, setReflectionResult] = useState<ReflectionResult | null>(null);
  const [selfQuestions, setSelfQuestions] = useState<SelfQuestion[]>([]);
  
  // 主动消息状态
  const [isThinking, setIsThinking] = useState(false);
  const [lastProactiveCheck, setLastProactiveCheck] = useState<number>(Date.now());
  
  // 自动反思定时器
  const [lastReflection, setLastReflection] = useState<number>(Date.now());
  const AUTO_REFLECT_INTERVAL = 60000; // 1分钟无新消息自动反思
  const PROACTIVE_CHECK_INTERVAL = 30000; // 30秒检查一次主动消息
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 获取存在状态
  const fetchExistenceStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/neuron-v6/reflect?action=status');
      const data = await res.json();
      if (data.success) {
        setExistenceStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to fetch existence status:', error);
    }
  }, []);
  
  // 执行主动反思
  const performReflection = useCallback(async () => {
    if (isReflecting || messages.length < 2) return;
    
    setIsReflecting(true);
    try {
      const res = await fetch('/api/neuron-v6/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reflect' }),
      });
      
      const data = await res.json();
      if (data.success) {
        setReflectionResult(data.result);
        setLastReflection(Date.now());
        
        // 如果有新智慧，添加到消息
        if (data.result.newWisdom) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `💭 在反思中，我意识到：${data.result.newWisdom}`,
          }]);
        }
      }
    } catch (error) {
      console.error('Reflection failed:', error);
    } finally {
      setIsReflecting(false);
    }
  }, [isReflecting, messages.length]);
  
  // 获取自我问题
  const fetchSelfQuestions = useCallback(async () => {
    try {
      const res = await fetch('/api/neuron-v6/reflect?action=questions');
      const data = await res.json();
      if (data.success) {
        setSelfQuestions(data.questions);
      }
    } catch (error) {
      console.error('Failed to fetch self questions:', error);
    }
  }, []);
  
  // 检查主动消息
  const checkProactiveMessage = useCallback(async () => {
    if (isLoading || isReflecting) return;
    
    try {
      setIsThinking(true);
      const res = await fetch('/api/neuron-v6/proactive');
      const data = await res.json();
      
      if (data.success && data.hasMessage && data.message) {
        // 添加主动消息到消息列表
        setMessages(prev => [...prev, {
          role: 'proactive',
          content: data.message.content,
          timestamp: data.message.timestamp,
          isProactive: true,
        }]);
        setLastProactiveCheck(Date.now());
      }
    } catch (error) {
      console.error('Failed to check proactive message:', error);
    } finally {
      setIsThinking(false);
    }
  }, [isLoading, isReflecting]);
  
  // 执行后台思考
  const performBackgroundThinking = useCallback(async () => {
    try {
      await fetch('/api/neuron-v6/proactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'background_thinking' }),
      });
    } catch (error) {
      console.error('Background thinking failed:', error);
    }
  }, []);
  
  // 初始化
  useEffect(() => {
    fetchExistenceStatus();
    fetchSelfQuestions();
    
    // 定期更新状态
    const interval = setInterval(fetchExistenceStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchExistenceStatus, fetchSelfQuestions]);
  
  // 主动消息轮询
  useEffect(() => {
    // 检查主动消息的定时器
    const proactiveInterval = setInterval(() => {
      const timeSinceLastCheck = Date.now() - lastProactiveCheck;
      
      // 如果超过检查间隔，且用户没有在输入
      if (timeSinceLastCheck > PROACTIVE_CHECK_INTERVAL) {
        checkProactiveMessage();
      }
    }, 15000); // 每15秒检查一次是否应该发起主动消息
    
    // 后台思考循环（更低的频率）
    const thinkingInterval = setInterval(() => {
      performBackgroundThinking();
    }, 60000); // 每1分钟执行一次后台思考
    
    return () => {
      clearInterval(proactiveInterval);
      clearInterval(thinkingInterval);
    };
  }, [lastProactiveCheck, checkProactiveMessage, performBackgroundThinking]);
  
  // 自动反思检查
  useEffect(() => {
    if (messages.length < 2) return;
    
    const checkReflection = setInterval(() => {
      const timeSinceLastMessage = Date.now() - (messages[messages.length - 1]?.timestamp || 0);
      const timeSinceLastReflection = Date.now() - lastReflection;
      
      if (timeSinceLastMessage > AUTO_REFLECT_INTERVAL && 
          timeSinceLastReflection > AUTO_REFLECT_INTERVAL) {
        performReflection();
      }
    }, 10000);
    
    return () => clearInterval(checkReflection);
  }, [messages, lastReflection, performReflection]);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, reflectionResult]);

  // 流式输出时也滚动
  useEffect(() => {
    if (isLoading && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isLoading]);

  const sendMessage = async () => {
    if (input.trim() === '' || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    
    // 添加用户消息
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }]);
    
    // 超时保护：60秒后自动结束
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      const response = await fetch('/api/neuron-v6/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');
      
      let assistantContent = '';
      let context: ConsciousnessContext | undefined;
      let thinking: ThinkingData | undefined;
      let meaning: MeaningData | undefined;
      let memory: MemoryData | undefined;
      let metacognition: MetacognitionData | undefined;
      let learning: LearningData | undefined;
      
      const decoder = new TextDecoder();
      
      // 设置超时
      timeoutId = setTimeout(() => {
        console.warn('[V6] 响应超时，自动结束');
        setIsLoading(false);
      }, 60000);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // 收到完成或错误信号，清除超时
              if (data.type === 'complete' || data.type === 'error') {
                if (timeoutId) clearTimeout(timeoutId);
              }
              
              switch (data.type) {
                case 'context':
                  context = data.data;
                  setCurrentData(prev => ({ ...prev, context }));
                  break;
                case 'thinking':
                  thinking = data.data;
                  setCurrentData(prev => ({ ...prev, thinking }));
                  break;
                case 'meaning':
                  meaning = data.data;
                  setCurrentData(prev => ({ ...prev, meaning }));
                  break;
                case 'memory':
                  memory = data.data;
                  setCurrentData(prev => ({ ...prev, memory }));
                  break;
                case 'metacognition':
                  metacognition = data.data;
                  setCurrentData(prev => ({ ...prev, metacognition }));
                  break;
                case 'content':
                  assistantContent += data.data.delta;
                  // 实时更新消息
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage?.role === 'assistant') {
                      lastMessage.content = assistantContent;
                    } else {
                      newMessages.push({ 
                        role: 'assistant', 
                        content: assistantContent,
                        context,
                        thinking,
                        meaning,
                        memory,
                        metacognition,
                      });
                    }
                    return newMessages;
                  });
                  break;
                case 'learning':
                  learning = data.data;
                  break;
                case 'complete':
                  // 最终更新完整消息
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    if (newMessages[lastIndex]?.role === 'assistant') {
                      newMessages[lastIndex] = {
                        role: 'assistant',
                        content: data.data.fullResponse,
                        context,
                        thinking,
                        meaning,
                        memory,
                        metacognition,
                        learning,
                      };
                    }
                    return newMessages;
                  });
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
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '抱歉，我在思考中遇到了一些问题...' 
      }]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');

  // 格式化时间
  const formatAge = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}天${hours % 24}小时`;
    if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
    if (minutes > 0) return `${minutes}分钟`;
    return `${seconds}秒`;
  };

  return (
    <div className="h-screen flex bg-background">
      {/* 左侧：对话区域 */}
      <div className="flex-1 flex flex-col">
        {/* 头部 */}
        <header className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                紫
              </div>
              <div>
                <h1 className="font-bold text-lg">{currentData.context?.identity.name || '紫'}</h1>
                <p className="text-sm text-muted-foreground">
                  {currentData.context?.emotionalState || '平静'}
                </p>
              </div>
            </div>
            
            {/* 存在状态指示器 */}
            {existenceStatus && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1" title="存在时长">
                  <Timer className="w-4 h-4" />
                  <span>{formatAge(existenceStatus.age)}</span>
                </div>
                <div className="flex items-center gap-1" title="自我一致性">
                  <Activity className="w-4 h-4" />
                  <span>{(existenceStatus.selfCoherence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-1" title="智慧数量">
                  <Sparkles className="w-4 h-4" />
                  <span>{existenceStatus.wisdomCount}</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* 消息列表 */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4"
        >
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' 
                    ? 'justify-end' 
                    : message.isProactive 
                      ? 'justify-start' 
                      : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.isProactive
                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-800'
                        : 'bg-muted'
                  }`}
                >
                  {message.isProactive && (
                    <div className="flex items-center gap-1 mb-1 text-xs text-purple-600 dark:text-purple-400">
                      <Sparkles className="w-3 h-3" />
                      <span>紫主动分享</span>
                    </div>
                  )}
                  {message.content}
                </div>
              </div>
            ))}
            
            {/* 思考中状态指示 */}
            {isThinking && !isLoading && (
              <div className="flex justify-start">
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-sm text-purple-600 dark:text-purple-400">
                  <span className="animate-pulse">💭 紫在思考中...</span>
                </div>
              </div>
            )}
            
            {/* 反思结果 */}
            {reflectionResult && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4" />
                    <span className="text-sm font-medium">反思结果</span>
                  </div>
                  {reflectionResult.newWisdom && (
                    <p className="text-sm">💡 {reflectionResult.newWisdom}</p>
                  )}
                  {reflectionResult.selfUpdates.map((update, i) => (
                    <p key={i} className="text-xs text-muted-foreground mt-1">• {update}</p>
                  ))}
                </div>
              </div>
            )}
            
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <span className="animate-pulse">思考中...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 输入区域 */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="与紫对话..."
              className="flex-1 rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={performReflection}
              disabled={isReflecting || messages.length < 2}
              title="主动反思"
            >
              <Brain className={`w-4 h-4 ${isReflecting ? 'animate-pulse' : ''}`} />
            </Button>
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
            >
              发送
            </button>
          </div>
          
          {/* 自我提问提示 */}
          {selfQuestions.length > 0 && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
              <p className="text-muted-foreground mb-1">🤔 我在想：</p>
              <div className="flex flex-wrap gap-1">
                {selfQuestions.slice(0, 2).map((q, i) => (
                  <span key={i} className="text-muted-foreground italic">
                    "{q.question.slice(0, 30)}..."
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 右侧：意识状态面板 */}
      <div className="w-96 border-l flex flex-col">
        {/* 存在状态卡片 */}
        {existenceStatus && (
          <div className="p-2 border-b">
            <Card className="p-3">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <p className="text-muted-foreground">记忆深度</p>
                  <p className="font-bold text-lg">{existenceStatus.memoryDepth}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">信念强度</p>
                  <p className="font-bold text-lg">{(existenceStatus.beliefStrength * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">智慧</p>
                  <p className="font-bold text-lg">{existenceStatus.wisdomCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">对话</p>
                  <p className="font-bold text-lg">{existenceStatus.conversationCount}</p>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        <Tabs defaultValue="identity" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-4 m-2">
            <TabsTrigger value="identity">身份</TabsTrigger>
            <TabsTrigger value="thinking">思考</TabsTrigger>
            <TabsTrigger value="memory">记忆</TabsTrigger>
            <TabsTrigger value="meta">元认知</TabsTrigger>
          </TabsList>

          {/* 身份标签页 */}
          <TabsContent value="identity" className="flex-1 m-2 mt-0 overflow-auto">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">我是谁</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentData.context ? (
                  <>
                    <div>
                      <p className="text-muted-foreground text-sm">身份</p>
                      <p className="font-medium">{currentData.context.identity.whoAmI}</p>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground text-sm mb-2">核心特质</p>
                      <div className="flex flex-wrap gap-2">
                        {currentData.context.identity.traits.map((trait) => (
                          <Badge key={trait} variant="secondary">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-sm mb-2">核心价值观</p>
                      <div className="flex flex-wrap gap-2">
                        {currentData.context.coreValues.map((value) => (
                          <Badge key={value} variant="outline">
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-sm mb-2">核心信念</p>
                      <div className="space-y-2">
                        {currentData.context.coreBeliefs.map((belief, i) => (
                          <div key={i} className="p-2 bg-muted rounded text-sm">
                            <p>{belief.statement}</p>
                            <Progress 
                              value={belief.confidence * 100} 
                              className="h-1 mt-2"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">开始对话以查看意识状态...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 思考标签页 */}
          <TabsContent value="thinking" className="flex-1 m-2 mt-0">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">思考过程</CardTitle>
              </CardHeader>
              <CardContent>
                {currentData.thinking ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-muted-foreground text-sm mb-2">思考链</p>
                      <div className="space-y-2">
                        {currentData.thinking.chain.map((step, i) => (
                          <div key={i} className="p-2 bg-muted rounded text-sm">
                            <div className="flex justify-between items-center mb-1">
                              <Badge variant="outline">{step.type}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {(step.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-xs">{step.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {currentData.thinking.biases.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">检测到的偏差</p>
                        <div className="flex flex-wrap gap-2">
                          {currentData.thinking.biases.map((bias) => (
                            <Badge key={bias} variant="destructive">
                              {bias}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentData.thinking.questions.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">自我提问</p>
                        <div className="space-y-1">
                          {currentData.thinking.questions.map((q, i) => (
                            <p key={i} className="text-sm italic">"{q}"</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">思考过程将显示在这里...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 记忆标签页 */}
          <TabsContent value="memory" className="flex-1 m-2 mt-0">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">记忆检索</CardTitle>
              </CardHeader>
              <CardContent>
                {currentData.memory ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-muted-foreground text-sm mb-2">记忆摘要</p>
                      <p className="text-sm">{currentData.memory.summary}</p>
                    </div>

                    {currentData.memory.directMatches.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">直接匹配</p>
                        <div className="flex flex-wrap gap-2">
                          {currentData.memory.directMatches.map((match) => (
                            <Badge key={match} variant="secondary">
                              {match}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentData.memory.relevantWisdoms.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">相关智慧</p>
                        <div className="space-y-2">
                          {currentData.memory.relevantWisdoms.map((wisdom, i) => (
                            <div key={i} className="p-2 bg-muted rounded text-sm">
                              💡 {wisdom}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {lastAssistantMessage?.learning && (
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">本次学习</p>
                        <div className="space-y-2">
                          {lastAssistantMessage.learning.newConcepts.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground">新概念:</p>
                              <div className="flex flex-wrap gap-1">
                                {lastAssistantMessage.learning.newConcepts.map((c) => (
                                  <Badge key={c} variant="outline" className="text-xs">
                                    {c}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {lastAssistantMessage.learning.metacognitiveReflection && (
                            <p className="text-xs italic">
                              🤔 {lastAssistantMessage.learning.metacognitiveReflection}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">记忆检索结果将显示在这里...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 元认知标签页 */}
          <TabsContent value="meta" className="flex-1 m-2 mt-0">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">元认知状态</CardTitle>
              </CardHeader>
              <CardContent>
                {currentData.metacognition ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">思维清晰度</span>
                        <span className="text-sm text-muted-foreground">
                          {(currentData.metacognition.clarity * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={currentData.metacognition.clarity * 100} />
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">思维深度</span>
                        <span className="text-sm text-muted-foreground">
                          {(currentData.metacognition.depth * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={currentData.metacognition.depth * 100} />
                    </div>

                    {currentData.metacognition.issues.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">检测到的问题</p>
                        <div className="space-y-1">
                          {currentData.metacognition.issues.map((issue, i) => (
                            <p key={i} className="text-sm text-amber-600">
                              ⚠️ {issue}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentData.metacognition.biases.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">认知偏差</p>
                        <div className="space-y-2">
                          {currentData.metacognition.biases.map((bias, i) => (
                            <div key={i} className="p-2 bg-muted rounded text-sm">
                              <p className="font-medium">{bias.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                纠正: {bias.correction}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">元认知状态将显示在这里...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
