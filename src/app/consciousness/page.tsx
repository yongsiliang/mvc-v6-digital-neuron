'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Sparkles, MessageCircle, Activity, Timer, Network, ChevronDown, ChevronUp, Heart, Link2, MessagesSquare, Moon, Lightbulb, Gem, InfinityIcon, Cpu } from 'lucide-react';
import { 
  ConsciousnessDashboard, 
  ConsciousnessVisualizationData 
} from '@/components/visualization/consciousness-dashboard';
import { ConsciousnessSidebar } from '@/components/neuron/consciousness-sidebar';
import { DanmakuContainer, DanmakuMessage } from '@/components/neuron/danmaku';
import { DraggablePanel } from '@/components/neuron/draggable-panel';

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
  
  // 可视化数据
  const [visualizationData, setVisualizationData] = useState<ConsciousnessVisualizationData | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);
  
  // 弹幕消息
  const [danmakuMessages, setDanmakuMessages] = useState<DanmakuMessage[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 转换数据为可视化格式
  const convertToVisualizationData = useCallback((): ConsciousnessVisualizationData | null => {
    if (!currentData.association) return null;
    
    // 转换节点数据 - 使用正确的类型
    const nodes: Array<{
      id: string;
      label: string;
      type: 'concept' | 'emotion' | 'belief' | 'value' | 'memory';
      activation: number;
    }> = currentData.association.activeConcepts.map((c, i) => ({
      id: `node-${i}`,
      label: c.label,
      type: 'concept' as const,
      activation: c.activation,
    }));
    
    // 添加情感节点
    if (currentData.emotion?.dominantEmotion) {
      nodes.push({
        id: 'emotion-primary',
        label: currentData.emotion.dominantEmotion.emotion,
        type: 'emotion',
        activation: currentData.emotion.dominantEmotion.intensity,
      });
    }
    
    // 添加价值节点
    if (currentData.value?.coreValues) {
      currentData.value.coreValues.slice(0, 3).forEach((v, i) => {
        nodes.push({
          id: `value-${i}`,
          label: v.name,
          type: 'value',
          activation: v.weight,
        });
      });
    }
    
    // 生成连接
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.5) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            strength: Math.random() * 0.5 + 0.3,
            type: 'association' as const,
          });
        }
      }
    }
    
    // 意识流数据
    const streams = currentData.consciousnessLayers?.layerResults.map(lr => ({
      type: 'awareness' as const,
      content: lr.output,
      intensity: lr.activity,
    })) || [];
    
    // 概念数据
    const concepts = currentData.association.activeConcepts.map((c, i) => ({
      id: `concept-${i}`,
      label: c.label,
      category: '认知',
      connections: Math.floor(c.activation * 5),
    }));
    
    // 认知负荷
    const cognitiveLoad = {
      intrinsic: currentData.metacognitionDeep?.cognitiveLoad?.intrinsicLoad || 0.3,
      extraneous: currentData.metacognitionDeep?.cognitiveLoad?.extraneousLoad || 0.2,
      germane: currentData.metacognitionDeep?.cognitiveLoad?.germaneLoad || 0.3,
      threshold: 0.9,
    };
    
    return {
      network: { nodes, links },
      streams,
      concepts,
      cognitiveLoad,
      layers: currentData.consciousnessLayers?.layerResults.map(lr => ({
        level: lr.level,
        activity: lr.activity,
        description: lr.output,
      })) || [],
    };
  }, [currentData]);
  
  // 更新可视化数据
  useEffect(() => {
    const vizData = convertToVisualizationData();
    if (vizData) {
      setVisualizationData(vizData);
    }
  }, [convertToVisualizationData]);
  
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
        // 添加到弹幕，不再直接插入对话
        const danmakuMsg: DanmakuMessage = {
          id: `danmaku-${Date.now()}`,
          content: data.message.content,
          type: data.message.type || 'sharing',
          timestamp: data.message.timestamp,
        };
        setDanmakuMessages(prev => [...prev, danmakuMsg]);
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
      {/* 弹幕区域 */}
      <DanmakuContainer
        messages={danmakuMessages}
        onMessageComplete={(id) => setDanmakuMessages(prev => prev.filter(m => m.id !== id))}
        maxVisible={3}
        duration={15000}
        topOffset={80}
        spacing={48}
      />
      
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
            <div className="flex items-center gap-4 text-sm">
              {existenceStatus && (
                <>
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
                </>
              )}
              {/* 可视化切换按钮 - 始终显示 */}
              <Button
                variant={showVisualization ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowVisualization(!showVisualization)}
                className="gap-1.5"
              >
                <Network className="w-4 h-4" />
                <span>{showVisualization ? '关闭' : '可视化'}</span>
              </Button>
            </div>
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

      {/* 右侧：意识状态面板 - 使用可折叠组件 */}
      <ConsciousnessSidebar 
        currentData={currentData}
        existenceStatus={existenceStatus}
        onVisualize={() => setShowVisualization(true)}
        hasVisualizationData={!!visualizationData}
      />
      
      {/* 意识可视化悬浮窗口 - 可拖拽 */}
      {showVisualization && visualizationData && (
        <DraggablePanel
          title="意识可视化"
          icon={<span className="text-lg">🧠</span>}
          onClose={() => setShowVisualization(false)}
          defaultPosition={{ x: 100, y: 80 }}
          defaultSize={{ width: 500, height: 450 }}
        >
          <ConsciousnessDashboard 
            data={visualizationData}
            isLoading={false}
          />
        </DraggablePanel>
      )}
    </div>
  );
}
