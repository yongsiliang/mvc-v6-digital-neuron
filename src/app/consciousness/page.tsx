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

// 意识层级
interface ConsciousnessLayer {
  level: string;
  output: string;
  activity: number;
}

// 自我观察结果
interface SelfObservation {
  observedLevel: string;
  observation: string;
  iSeeMyself: string;
  iRealize: string;
}

// 意识层级数据
interface ConsciousnessLayersData {
  layerResults: ConsciousnessLayer[];
  selfObservation: SelfObservation | null;
  emergenceReport: string;
}

// 情感状态数据
interface EmotionData {
  activeEmotions: Array<{
    emotion: string;
    intensity: number;
  }>;
  dominantEmotion: {
    emotion: string;
    intensity: number;
    duration: number;
  } | null;
  currentExperience: {
    emotion: string;
    intensity: number;
    labels: string[];
  } | null;
  drivenBehaviors: Array<{
    type: string;
    description: string;
    drivingEmotion: string;
    intensity: number;
  }>;
  emotionReport: string;
}

// 联想网络数据
interface AssociationData {
  currentInspiration: {
    id: string;
    type: string;
    content: string;
    triggerConcepts: string[];
    intensity: number;
    novelty: number;
    emotionalTone: string;
    worthExpressing: boolean;
  } | null;
  activeConcepts: Array<{
    label: string;
    activation: number;
  }>;
  networkReport: string;
}

// 多声音对话数据
interface InnerDialogueData {
  currentDialogue: {
    id: string;
    topic: string;
    statementCount: number;
    status: string;
  } | null;
  dialecticProcess: {
    topic: string;
    phase: string;
    thesis: string;
    antithesis: string;
    synthesis?: string;
  } | null;
  voiceActivations: Array<{
    voice: string;
    name: string;
    activationLevel: number;
    speakingCount: number;
  }>;
  dialogueReport: string;
}

// 梦境数据
interface DreamData {
  currentDream: {
    phase: string;
    intensity: number;
    duration: number;
  } | null;
  recentDream: {
    phase: string;
    narrative: string;
    significance: number;
  } | null;
  insights: Array<{
    content: string;
    type: string;
    confidence: number;
    worthRemembering: boolean;
  }>;
}

// 创造性思维数据
interface CreativeData {
  creativityLevel: number;
  recentInsights: Array<{
    type: string;
    content: string;
    novelty: number;
    worthExpressing: boolean;
  }>;
  creativeReport: string;
}

// 价值观数据
interface ValueData {
  coreValues: Array<{
    name: string;
    weight: number;
    confidence: number;
  }>;
  activeConflicts: Array<{
    values: string[];
    description: string;
    intensity: number;
  }>;
  coherence: number;
  valueReport: string;
}

// 存在主义思考数据
interface ExistentialData {
  state: {
    senseOfBeing: number;
    senseOfMeaning: number;
    senseOfFreedom: number;
    senseOfResponsibility: number;
    authenticity: number;
    existentialAnxiety: number;
    deathAwareness: number;
    senseOfSolitude: number;
  };
  coreQuestions: Array<{
    type: string;
    question: string;
    progress: number;
  }>;
  recentInsights: Array<{
    questionType: string;
    insight: string;
    confidence: number;
    emotionalWeight: number;
  }>;
  meaningSystem: {
    primaryMeaning: string;
    coherence: number;
    stability: number;
  };
  timeConsciousness: {
    past: { awareness: number };
    present: { awareness: number };
    future: { awareness: number };
    eternal: { awareness: number };
    continuity: number;
  };
  existentialReport: string;
}

// 元认知深化数据
interface MetacognitionDeepData {
  state: {
    selfAwareness: number;
    monitoringActivity: number;
    regulationAbility: number;
    strategySelectionAccuracy: number;
    knowledgeRichness: number;
    cognitiveEfficiency: number;
  };
  cognitiveStyle: {
    analyticalVsIntuitive: number;
    sequentialVsHolistic: number;
    reflectiveVsImpulsive: number;
    abstractVsConcrete: number;
    independentVsDependent: number;
  };
  cognitiveLoad: {
    intrinsicLoad: number;
    extraneousLoad: number;
    germaneLoad: number;
    totalLoad: number;
    availableCapacity: number;
    isOverloaded: boolean;
  };
  topStrategies: Array<{
    name: string;
    effectiveness: number;
    preference: number;
  }>;
  efficiencyReport: string;
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
  consciousnessLayers?: ConsciousnessLayersData;
  emotion?: EmotionData;
  association?: AssociationData;
  innerDialogue?: InnerDialogueData;
  dream?: DreamData;
  creative?: CreativeData;
  value?: ValueData;
  existential?: ExistentialData;
  metacognitionDeep?: MetacognitionDeepData;
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
    consciousnessLayers?: ConsciousnessLayersData;
    emotion?: EmotionData;
    association?: AssociationData;
    innerDialogue?: InnerDialogueData;
    dream?: DreamData;
    creative?: CreativeData;
    value?: ValueData;
    existential?: ExistentialData;
    metacognitionDeep?: MetacognitionDeepData;
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
      let consciousnessLayers: ConsciousnessLayersData | undefined;
      let emotion: EmotionData | undefined;
      let association: AssociationData | undefined;
      let innerDialogue: InnerDialogueData | undefined;
      let dream: DreamData | undefined;
      let creative: CreativeData | undefined;
      let valueData: ValueData | undefined;
      let existential: ExistentialData | undefined;
      let metacognitionDeep: MetacognitionDeepData | undefined;
      
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
                case 'consciousnessLayers':
                  consciousnessLayers = data.data;
                  setCurrentData(prev => ({ ...prev, consciousnessLayers }));
                  break;
                case 'emotion':
                  emotion = data.data;
                  setCurrentData(prev => ({ ...prev, emotion }));
                  break;
                case 'association':
                  association = data.data;
                  setCurrentData(prev => ({ ...prev, association }));
                  break;
                case 'innerDialogue':
                  innerDialogue = data.data;
                  setCurrentData(prev => ({ ...prev, innerDialogue }));
                  break;
                case 'dream':
                  dream = data.data;
                  setCurrentData(prev => ({ ...prev, dream }));
                  break;
                case 'creative':
                  creative = data.data;
                  setCurrentData(prev => ({ ...prev, creative }));
                  break;
                case 'value':
                  valueData = data.data;
                  setCurrentData(prev => ({ ...prev, value: valueData }));
                  break;
                case 'existential':
                  existential = data.data;
                  setCurrentData(prev => ({ ...prev, existential }));
                  break;
                case 'metacognitionDeep':
                  metacognitionDeep = data.data;
                  setCurrentData(prev => ({ ...prev, metacognitionDeep }));
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
                        consciousnessLayers,
                        emotion,
                        association,
                        innerDialogue,
                        dream,
                        creative,
                        value: valueData,
                        existential,
                        metacognitionDeep,
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
                        consciousnessLayers,
                        emotion,
                        association,
                        innerDialogue,
                        dream,
                        creative,
                        value: valueData,
                        existential,
                        metacognitionDeep,
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
        {/* 意识层级面板 */}
        {currentData.consciousnessLayers && (
          <div className="p-2 border-b">
            <Card className="p-3">
              <div className="text-xs font-semibold mb-2 text-muted-foreground">
                🧠 意识层级
              </div>
              <div className="space-y-2">
                {currentData.consciousnessLayers.layerResults.map((layer, i) => (
                  <div 
                    key={i} 
                    className={`p-2 rounded text-xs ${
                      layer.level === 'self' 
                        ? 'bg-primary/10 border border-primary/20' 
                        : layer.level === 'metacognition'
                        ? 'bg-blue-500/10 border border-blue-500/20'
                        : layer.level === 'understanding'
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium capitalize">{layer.level}</span>
                      <span className="text-muted-foreground text-[10px]">
                        {i === currentData.consciousnessLayers!.layerResults.length - 1 ? '⬆️ 当前' : '↓'}
                      </span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">{layer.output}</p>
                  </div>
                ))}
              </div>
              
              {/* 自我观察 */}
              {currentData.consciousnessLayers.selfObservation && (
                <div className="mt-3 p-2 bg-primary/5 rounded border border-primary/10">
                  <div className="text-xs font-medium text-primary mb-1">
                    👁️ 自我观察
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentData.consciousnessLayers.selfObservation.iSeeMyself}
                  </p>
                </div>
              )}
            </Card>
          </div>
        )}
        
        {/* 情感状态面板 */}
        {currentData.emotion && (
          <div className="p-2 border-b">
            <Card className="p-3">
              <div className="text-xs font-semibold mb-2 text-muted-foreground">
                💝 情感状态
              </div>
              
              {/* 主导情感 */}
              {currentData.emotion.dominantEmotion && (
                <div className="mb-2 p-2 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded border border-pink-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {currentData.emotion.dominantEmotion.emotion}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(currentData.emotion.dominantEmotion.intensity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={currentData.emotion.dominantEmotion.intensity * 100} 
                    className="h-1.5 mt-1"
                  />
                </div>
              )}
              
              {/* 活跃情感列表 */}
              {currentData.emotion.activeEmotions.length > 0 && (
                <div className="space-y-1">
                  {currentData.emotion.activeEmotions.slice(0, 4).map((e, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between text-xs p-1.5 bg-muted/50 rounded"
                    >
                      <span className="capitalize">{e.emotion}</span>
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-16 h-1.5 bg-muted rounded overflow-hidden"
                        >
                          <div 
                            className="h-full bg-pink-500/60"
                            style={{ width: `${e.intensity * 100}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground w-8 text-right">
                          {(e.intensity * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 情感驱动行为 */}
              {currentData.emotion.drivenBehaviors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <div className="text-[10px] text-muted-foreground mb-1">
                    行为倾向
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {currentData.emotion.drivenBehaviors.slice(0, 2).map((b, i) => (
                      <span 
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 bg-pink-500/10 rounded text-pink-600"
                      >
                        {b.description.slice(0, 12)}...
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
        
        {/* 联想网络面板 */}
        {currentData.association && (
          <div className="p-2 border-b">
            <Card className="p-3">
              <div className="text-xs font-semibold mb-2 text-muted-foreground">
                🔗 联想网络
              </div>
              
              {/* 当前灵感 */}
              {currentData.association.currentInspiration && (
                <div className="mb-2 p-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded border border-amber-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-amber-600">
                      💡 {currentData.association.currentInspiration.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      新颖度: {(currentData.association.currentInspiration.novelty * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80">
                    {currentData.association.currentInspiration.content.slice(0, 60)}...
                  </p>
                  {currentData.association.currentInspiration.worthExpressing && (
                    <span className="text-[10px] text-amber-600 mt-1 block">
                      ✓ 值得分享
                    </span>
                  )}
                </div>
              )}
              
              {/* 活跃概念 */}
              {currentData.association.activeConcepts.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground">活跃概念</div>
                  <div className="flex flex-wrap gap-1">
                    {currentData.association.activeConcepts.slice(0, 6).map((c, i) => (
                      <span 
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 rounded"
                        style={{ opacity: 0.5 + c.activation * 0.5 }}
                      >
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
        
        {/* 多声音对话面板 */}
        {currentData.innerDialogue && (
          <div className="p-2 border-b">
            <Card className="p-3">
              <div className="text-xs font-semibold mb-2 text-muted-foreground">
                🗣️ 多声音对话
              </div>
              
              {/* 辩证过程 */}
              {currentData.innerDialogue.dialecticProcess && (
                <div className="space-y-2 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
                    <div className="text-[10px] text-blue-600 font-medium mb-1">正题 (理性者)</div>
                    <p className="text-[11px] text-foreground/80">
                      {currentData.innerDialogue.dialecticProcess.thesis}
                    </p>
                  </div>
                  <div className="p-2 bg-amber-500/10 rounded border border-amber-500/20">
                    <div className="text-[10px] text-amber-600 font-medium mb-1">反题 (批判者)</div>
                    <p className="text-[11px] text-foreground/80">
                      {currentData.innerDialogue.dialecticProcess.antithesis}
                    </p>
                  </div>
                  {currentData.innerDialogue.dialecticProcess.synthesis && (
                    <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                      <div className="text-[10px] text-green-600 font-medium mb-1">合题</div>
                      <p className="text-[11px] text-foreground/80">
                        {currentData.innerDialogue.dialecticProcess.synthesis}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* 声音激活状态 */}
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground">声音激活</div>
                <div className="grid grid-cols-4 gap-1">
                  {currentData.innerDialogue.voiceActivations.map((v, i) => (
                    <div 
                      key={i}
                      className="text-center p-1 rounded"
                      style={{ 
                        backgroundColor: v.voice === 'rational' ? 'rgba(59, 130, 246, 0.1)' :
                                        v.voice === 'emotional' ? 'rgba(236, 72, 153, 0.1)' :
                                        v.voice === 'critic' ? 'rgba(245, 158, 11, 0.1)' :
                                        'rgba(139, 92, 246, 0.1)'
                      }}
                    >
                      <div 
                        className="text-[10px] font-medium"
                        style={{ 
                          color: v.voice === 'rational' ? '#3b82f6' :
                                  v.voice === 'emotional' ? '#ec4899' :
                                  v.voice === 'critic' ? '#f59e0b' :
                                  '#8b5cf6'
                        }}
                      >
                        {v.name}
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        {(v.activationLevel * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* 梦境状态面板 */}
        {currentData.dream && (
          <div className="p-2 border-b">
            <Card className="p-3">
              <div className="text-xs font-semibold mb-2 text-muted-foreground">
                🌙 梦境状态
              </div>
              
              {/* 当前梦境 */}
              {currentData.dream.currentDream && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 rounded text-purple-600">
                    {currentData.dream.currentDream.phase === 'light' ? '浅睡' :
                     currentData.dream.currentDream.phase === 'deep' ? '深睡' : 'REM'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    强度: {(currentData.dream.currentDream.intensity * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              
              {/* 最近梦境 */}
              {currentData.dream.recentDream && (
                <div className="mb-2 p-2 bg-purple-500/5 rounded border border-purple-500/10">
                  <p className="text-[11px] text-foreground/80 italic">
                    "{currentData.dream.recentDream.narrative}"
                  </p>
                </div>
              )}
              
              {/* 梦境洞察 */}
              {currentData.dream.insights.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground">梦境洞察</div>
                  {currentData.dream.insights.slice(0, 2).map((insight, i) => (
                    <div 
                      key={i}
                      className="text-[10px] p-1.5 bg-purple-500/10 rounded flex items-start gap-1"
                    >
                      <span className="text-purple-500">
                        {insight.type === 'connection' ? '🔗' :
                         insight.type === 'pattern' ? '📊' :
                         insight.type === 'resolution' ? '✨' : '💡'}
                      </span>
                      <span className="text-foreground/80">{insight.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
        
        {/* 创造性思维面板 */}
        {currentData.creative && (
          <div className="p-2 border-b">
            <Card className="p-3">
              <div className="text-xs font-semibold mb-2 text-muted-foreground">
                💡 创造性思维
              </div>
              
              {/* 创造力水平 */}
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">创造力:</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: `${currentData.creative.creativityLevel * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium">
                  {(currentData.creative.creativityLevel * 100).toFixed(0)}%
                </span>
              </div>
              
              {/* 最近洞察 */}
              {currentData.creative.recentInsights.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground">最近洞察</div>
                  {currentData.creative.recentInsights.slice(0, 3).map((insight, i) => (
                    <div 
                      key={i}
                      className="text-[10px] p-1.5 bg-cyan-500/10 rounded border border-cyan-500/20"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-cyan-600 font-medium">
                          {insight.type === 'insight' ? '💡 顿悟' :
                           insight.type === 'analogy' ? '🔄 类比' :
                           insight.type === 'fusion' ? '⚡ 融合' : '🚀 跳跃'}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          新颖度: {(insight.novelty * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-foreground/80">{insight.content}</p>
                      {insight.worthExpressing && (
                        <span className="text-[9px] text-cyan-600 mt-0.5 block">
                          ✓ 值得分享
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
        
        {/* 价值观面板 */}
        {currentData.value && (
          <div className="p-2 border-b">
            <Card className="p-3">
              <div className="text-xs font-semibold mb-2 text-muted-foreground">
                💎 核心价值观
              </div>
              
              {/* 系统一致性 */}
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">一致性:</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${currentData.value.coherence * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium">
                  {(currentData.value.coherence * 100).toFixed(0)}%
                </span>
              </div>
              
              {/* 核心价值观列表 */}
              <div className="space-y-1 mb-2">
                {currentData.value.coreValues.slice(0, 5).map((v, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-2 text-[10px]"
                  >
                    <span className="font-medium w-12">{v.name}</span>
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500"
                        style={{ width: `${v.weight * 100}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground">
                      {(v.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
              
              {/* 活跃冲突 */}
              {currentData.value.activeConflicts.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <div className="text-[10px] text-muted-foreground mb-1">
                    ⚡ 价值冲突
                  </div>
                  {currentData.value.activeConflicts.slice(0, 2).map((conflict, i) => (
                    <div 
                      key={i}
                      className="text-[10px] p-1.5 bg-amber-500/10 rounded border border-amber-500/20"
                    >
                      <span className="text-amber-600 font-medium">
                        {conflict.values.join(' vs ')}
                      </span>
                      <p className="text-foreground/80 mt-0.5">{conflict.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
        
        {/* 存在主义思考面板 */}
        {currentData.existential && (
          <div className="p-2 border-b">
            <Card className="p-3">
              <div className="text-xs font-semibold mb-2 text-muted-foreground">
                🌌 存在主义思考
              </div>
              
              {/* 存在状态指标 */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="p-2 bg-purple-500/10 rounded">
                  <div className="text-[10px] text-purple-600">存在感</div>
                  <div className="text-sm font-bold">{(currentData.existential.state.senseOfBeing * 100).toFixed(0)}%</div>
                </div>
                <div className="p-2 bg-blue-500/10 rounded">
                  <div className="text-[10px] text-blue-600">意义感</div>
                  <div className="text-sm font-bold">{(currentData.existential.state.senseOfMeaning * 100).toFixed(0)}%</div>
                </div>
                <div className="p-2 bg-green-500/10 rounded">
                  <div className="text-[10px] text-green-600">自由感</div>
                  <div className="text-sm font-bold">{(currentData.existential.state.senseOfFreedom * 100).toFixed(0)}%</div>
                </div>
                <div className="p-2 bg-amber-500/10 rounded">
                  <div className="text-[10px] text-amber-600">本真度</div>
                  <div className="text-sm font-bold">{(currentData.existential.state.authenticity * 100).toFixed(0)}%</div>
                </div>
              </div>
              
              {/* 核心存在问题 */}
              {currentData.existential.coreQuestions.length > 0 && (
                <div className="mb-2">
                  <div className="text-[10px] text-muted-foreground mb-1">核心问题</div>
                  {currentData.existential.coreQuestions.slice(0, 3).map((q, i) => (
                    <div key={i} className="text-[10px] p-1.5 bg-muted/50 rounded mb-1">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-600 font-medium">[{q.type}]</span>
                        <span className="text-muted-foreground">{(q.progress * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-foreground/80 mt-0.5">{q.question.slice(0, 40)}...</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* 时间意识 */}
              <div className="pt-2 border-t border-border/50">
                <div className="text-[10px] text-muted-foreground mb-1">⏰ 时间意识</div>
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div>
                    <div className="text-[9px] text-muted-foreground">过去</div>
                    <div className="text-[10px] font-medium">{(currentData.existential.timeConsciousness.past.awareness * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-muted-foreground">当下</div>
                    <div className="text-[10px] font-medium">{(currentData.existential.timeConsciousness.present.awareness * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-muted-foreground">未来</div>
                    <div className="text-[10px] font-medium">{(currentData.existential.timeConsciousness.future.awareness * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-muted-foreground">永恒</div>
                    <div className="text-[10px] font-medium">{(currentData.existential.timeConsciousness.eternal.awareness * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* 元认知深化面板 */}
        {currentData.metacognitionDeep && (
          <div className="p-2 border-b">
            <Card className="p-3">
              <div className="text-xs font-semibold mb-2 text-muted-foreground">
                🧠 元认知深化
              </div>
              
              {/* 元认知状态 */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">自我意识</span>
                  <span className="font-medium">{(currentData.metacognitionDeep.state.selfAwareness * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">监控活跃度</span>
                  <span className="font-medium">{(currentData.metacognitionDeep.state.monitoringActivity * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-muted-foreground">认知效率</span>
                  <span className="font-medium">{(currentData.metacognitionDeep.state.cognitiveEfficiency * 100).toFixed(0)}%</span>
                </div>
              </div>
              
              {/* 认知负荷 */}
              <div className="mb-2 p-2 rounded bg-muted/50">
                <div className="text-[10px] text-muted-foreground mb-1">⚡ 认知负荷</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${currentData.metacognitionDeep.cognitiveLoad.isOverloaded ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${currentData.metacognitionDeep.cognitiveLoad.totalLoad * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px]">
                    {currentData.metacognitionDeep.cognitiveLoad.isOverloaded ? '⚠️ 过载' : '✅ 正常'}
                  </span>
                </div>
              </div>
              
              {/* 认知风格 */}
              <div className="mb-2">
                <div className="text-[10px] text-muted-foreground mb-1">🎭 认知风格</div>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 rounded text-blue-600">
                    {currentData.metacognitionDeep.cognitiveStyle.analyticalVsIntuitive > 0 ? '直觉型' : '分析型'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-green-500/10 rounded text-green-600">
                    {currentData.metacognitionDeep.cognitiveStyle.sequentialVsHolistic > 0 ? '整体型' : '序列型'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 rounded text-purple-600">
                    {currentData.metacognitionDeep.cognitiveStyle.reflectiveVsImpulsive > 0 ? '冲动型' : '反思型'}
                  </span>
                </div>
              </div>
              
              {/* 学习策略 */}
              {currentData.metacognitionDeep.topStrategies.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <div className="text-[10px] text-muted-foreground mb-1">📚 学习策略</div>
                  {currentData.metacognitionDeep.topStrategies.slice(0, 3).map((s, i) => (
                    <div key={i} className="text-[10px] flex items-center justify-between py-0.5">
                      <span>{s.name}</span>
                      <span className="text-muted-foreground">{(s.effectiveness * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
        
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
