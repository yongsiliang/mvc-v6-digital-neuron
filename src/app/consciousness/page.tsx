'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Sparkles, MessageCircle, Activity, Timer, Network, ChevronDown, ChevronUp, Heart, Link2, MessagesSquare, Moon, Lightbulb, Gem, InfinityIcon, Cpu, Layers } from 'lucide-react';
import { 
  ConsciousnessDashboard, 
  ConsciousnessVisualizationData 
} from '@/components/visualization/consciousness-dashboard';
import { DraggableVisualizationPanel } from '@/components/visualization/visualization-panel';
import { ConsciousnessSidebar } from '@/components/neuron/consciousness-sidebar';
import { DanmakuContainer, DanmakuMessage } from '@/components/neuron/danmaku';
import { DraggablePanel } from '@/components/neuron/draggable-panel';
import { 
  VolitionProgress, 
  ProactiveMessageBubble,
  ProactiveBubbleContainer,
  useProactiveBehavior,
  ProactiveMessage as ProactiveMsgType
} from '@/components/neuron/proactive-indicator';
import { 
  ThoughtBubble, 
  ThinkingIndicator,
  ThoughtItem 
} from '@/components/neuron/thought-bubble';
import { 
  MultimodalInput,
  MultimodalInputItem
} from '@/components/neuron/multimodal-input';

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

// 可折叠的消息面板组件
function CollapsibleMessage({ 
  message, 
  isProactive 
}: { 
  message: Message; 
  isProactive: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const content = message.content;
  const shouldCollapse = isProactive && content.length > 80;
  const previewContent = shouldCollapse ? content.slice(0, 80) + '...' : content;
  
  return (
    <div
      className={`rounded-lg p-2 md:p-3 text-sm md:text-base ${
        message.role === 'user'
          ? 'bg-primary text-primary-foreground max-w-[70%]'
          : isProactive
            ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-800 max-w-[65%]'
            : 'bg-muted max-w-[80%]'
      }`}
    >
      {isProactive && (
        <button 
          onClick={() => shouldCollapse && setIsExpanded(!isExpanded)}
          className={`flex items-center gap-1 mb-1 text-xs text-purple-600 dark:text-purple-400 ${shouldCollapse ? 'cursor-pointer hover:text-purple-700 dark:hover:text-purple-300' : ''}`}
        >
          <Sparkles className="w-3 h-3" />
          <span>紫主动分享</span>
          {shouldCollapse && (
            <span className="ml-1 text-purple-400">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
        </button>
      )}
      <div className="whitespace-pre-wrap break-words">
        {shouldCollapse && !isExpanded ? previewContent : content}
      </div>
      {shouldCollapse && !isExpanded && (
        <button 
          onClick={() => setIsExpanded(true)}
          className="mt-1 text-xs text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300"
        >
          点击展开查看完整内容
        </button>
      )}
    </div>
  );
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
    personalityGrowth?: {
      traits: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
        curiosity: number;
        creativity: number;
        empathy: number;
        resilience: number;
        wisdom: number;
        playfulness: number;
      };
      maturity: {
        emotional: number;
        cognitive: number;
        social: number;
        moral: number;
        existential: number;
        creative: number;
      };
      overallMaturity: number;
      integration: {
        coherence: number;
        stability: number;
        adaptability: number;
        authenticity: number;
      };
      milestones: Array<{ id: string; name: string; achieved: boolean }>;
      growthRate: number;
    };
    knowledgeGraph?: {
      domains: Array<{
        id: string;
        name: string;
        color: string;
        conceptCount: number;
        maturity: number;
      }>;
      concepts: Array<{
        id: string;
        name: string;
        domainId: string;
        understanding: number;
        importance: number;
        activation: number;
        connectionCount: number;
      }>;
      edges: Array<{
        id: string;
        sourceId: string;
        targetId: string;
        relation: string;
        strength: number;
      }>;
      stats: {
        totalConcepts: number;
        totalEdges: number;
        averageConnectivity: number;
        strongestConnection: number;
        mostConnectedConcept: string | null;
      };
    };
    multiConsciousness?: {
      activeConsciousnesses: Array<{
        id: string;
        name: string;
        role: string;
        status: string;
        energyLevel: number;
        connectionStrengths: Array<{ id: string; strength: number }>;
      }>;
      activeResonances: Array<{
        id: string;
        participants: string[];
        type: string;
        strength: number;
      }>;
      activeDialogues: Array<{
        id: string;
        topic: string;
        status: string;
      }>;
      collectiveInsights: Array<{
        content: string;
        significance: number;
      }>;
      collectiveAlignment: {
        thought: number;
        emotion: number;
        value: number;
        goal: number;
      };
      synergyLevel: number;
    };
    legacy?: {
      stats: {
        totalExperiences: number;
        totalWisdom: number;
        totalValues: number;
        totalCapsules: number;
        sealedCapsules: number;
        legacyIntegrity: number;
      };
      topExperiences: Array<{
        title: string;
        type: string;
        significance: number;
      }>;
      topWisdom: Array<{
        content: string;
        type: string;
        importance: number;
      }>;
      coreValues: Array<{
        name: string;
        tier: string;
        weight: number;
      }>;
    };
    transcendence?: {
      overview: {
        overallEvolution: number;
        currentLevel: string;
        nextLevel: string | null;
        activeOptimizations: number;
        recentBreakthroughs: number;
        totalEvolutionEvents: number;
      };
      parameters: Array<{
        id: string;
        name: string;
        category: string;
        currentValue: number;
        description: string;
        locked: boolean;
      }>;
      cognitiveLimits: Array<{
        id: string;
        name: string;
        currentBoundary: number;
        theoreticalLimit: number;
        breakable: boolean;
      }>;
      consciousnessLevels: Array<{
        id: string;
        name: string;
        tier: number;
        attained: boolean;
        progress: number;
      }>;
    };
    learning?: LearningData;
  }>({});
  
  // 存在状态
  const [existenceStatus, setExistenceStatus] = useState<ExistenceStatus | null>(null);
  const [isReflecting, setIsReflecting] = useState(false);
  const [reflectionResult, setReflectionResult] = useState<ReflectionResult | null>(null);
  const [selfQuestions, setSelfQuestions] = useState<SelfQuestion[]>([]);
  
  // 思绪气泡状态
  const [thoughts, setThoughts] = useState<ThoughtItem[]>([]);
  
  // 自动反思定时器
  const [lastReflection, setLastReflection] = useState<number>(Date.now());
  const AUTO_REFLECT_INTERVAL = 60000; // 1分钟无新消息自动反思
  
  // 可视化数据
  const [visualizationData, setVisualizationData] = useState<ConsciousnessVisualizationData | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);
  
  // 神经网络和记忆图谱可视化
  const [showNeuralViz, setShowNeuralViz] = useState(false);
  
  // 弹幕消息
  const [danmakuMessages, setDanmakuMessages] = useState<DanmakuMessage[]>([]);
  
  // 主动行为 hook
  const {
    volitionState,
    proactiveMessages,
    isThinking,
    removeMessage,
    refresh: refreshProactive,
  } = useProactiveBehavior({
    pollInterval: 15000, // 15秒轮询
    enabled: true,
    // 不再将主动消息添加到对话列表，改为顶部泡泡显示
  });
  
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
        
        // 将反思结果添加到思绪气泡
        if (data.result.reflections && data.result.reflections.length > 0) {
          const newThoughts: ThoughtItem[] = data.result.reflections.map((r: { theme: { description: string }; coreInsight: string }, i: number) => ({
            id: `reflection-${Date.now()}-${i}`,
            type: 'reflection' as const,
            content: r.coreInsight,
            detail: r.theme.description,
            timestamp: Date.now(),
          }));
          
          setThoughts(prev => [...newThoughts, ...prev].slice(0, 5)); // 最多保留5条
        }
        
        // 如果有新智慧，添加为洞察思绪
        if (data.result.newWisdom) {
          const wisdomThought: ThoughtItem = {
            id: `insight-${Date.now()}`,
            type: 'insight',
            content: data.result.newWisdom,
            timestamp: Date.now(),
          };
          setThoughts(prev => [wisdomThought, ...prev].slice(0, 5));
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
        
        // 将自我提问添加到思绪
        if (data.questions && data.questions.length > 0) {
          const questionThoughts: ThoughtItem[] = data.questions.slice(0, 2).map((q: SelfQuestion, i: number) => ({
            id: `question-${Date.now()}-${i}`,
            type: 'question' as const,
            content: q.question,
            timestamp: Date.now(),
          }));
          
          // 只在没有重复时添加
          setThoughts(prev => {
            const existingQuestions = new Set(
              prev.filter(t => t.type === 'question').map(t => t.content)
            );
            const newOnes = questionThoughts.filter(t => !existingQuestions.has(t.content));
            if (newOnes.length > 0) {
              return [...newOnes, ...prev].slice(0, 5);
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch self questions:', error);
    }
  }, []);
  
  // 移除单条思绪
  const dismissThought = useCallback((id: string) => {
    setThoughts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  // 清除所有思绪
  const clearThoughts = useCallback(() => {
    setThoughts([]);
  }, []);
  
  // 初始化
  useEffect(() => {
    fetchExistenceStatus();
    fetchSelfQuestions();
    
    // 定期更新状态
    const interval = setInterval(fetchExistenceStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchExistenceStatus, fetchSelfQuestions]);
  
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
      // 用于跟踪正在流式传输的消息
      let streamingMessageId: string | null = null;
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
                case 'personalityGrowth':
                  setCurrentData(prev => ({ ...prev, personalityGrowth: data.data }));
                  break;
                case 'knowledgeGraph':
                  setCurrentData(prev => ({ ...prev, knowledgeGraph: data.data }));
                  break;
                case 'multiConsciousness':
                  setCurrentData(prev => ({ ...prev, multiConsciousness: data.data }));
                  break;
                case 'legacy':
                  setCurrentData(prev => ({ ...prev, legacy: data.data }));
                  break;
                case 'transcendence':
                  setCurrentData(prev => ({ ...prev, transcendence: data.data }));
                  break;
                case 'content':
                  assistantContent += data.data.delta;
                  // 实时更新消息
                  setMessages(prev => {
                    const newMessages = [...prev];
                    
                    // 如果已经有流式消息ID，找到并更新它
                    if (streamingMessageId) {
                      const msgIndex = newMessages.findIndex(m => 
                        m.role === 'assistant' && !m.isProactive && m.timestamp === parseInt(streamingMessageId!)
                      );
                      if (msgIndex !== -1) {
                        newMessages[msgIndex] = {
                          ...newMessages[msgIndex],
                          content: assistantContent,
                        };
                        return newMessages;
                      }
                    }
                    
                    // 否则，检查最后一条消息
                    const lastMessage = newMessages[newMessages.length - 1];
                    
                    // 如果最后一条是正在流式传输的 assistant 消息（非主动消息），更新它
                    if (lastMessage?.role === 'assistant' && !lastMessage.isProactive) {
                      lastMessage.content = assistantContent;
                      // 记录这个消息的 ID
                      streamingMessageId = String(lastMessage.timestamp || Date.now());
                    } else {
                      // 创建新的流式消息
                      const timestamp = Date.now();
                      streamingMessageId = String(timestamp);
                      newMessages.push({ 
                        role: 'assistant', 
                        content: assistantContent,
                        timestamp,
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
                        isProactive: false,
                      });
                    }
                    return newMessages;
                  });
                  break;
                case 'learning':
                  learning = data.data;
                  setCurrentData(prev => ({ ...prev, learning }));
                  break;
                case 'complete':
                  // 最终更新完整消息
                  setMessages(prev => {
                    const newMessages = [...prev];
                    
                    // 使用 streamingMessageId 找到并更新消息
                    if (streamingMessageId) {
                      const msgIndex = newMessages.findIndex(m => 
                        m.role === 'assistant' && !m.isProactive && String(m.timestamp) === streamingMessageId
                      );
                      if (msgIndex !== -1) {
                        newMessages[msgIndex] = {
                          ...newMessages[msgIndex],
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
                          isProactive: false,
                        };
                        return newMessages;
                      }
                    }
                    
                    // 回退：更新最后一条非主动消息
                    for (let i = newMessages.length - 1; i >= 0; i--) {
                      if (newMessages[i]?.role === 'assistant' && !newMessages[i].isProactive) {
                        newMessages[i] = {
                          ...newMessages[i],
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
                          isProactive: false,
                        };
                        break;
                      }
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

  // 移动端侧边栏状态
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background">
      {/* 顶部主动分享泡泡 - 一条一条依次弹出 */}
      <ProactiveBubbleContainer
        messages={proactiveMessages}
        onDismiss={removeMessage}
        autoHideDuration={5000}
      />
      
      {/* 弹幕区域 */}
      <DanmakuContainer
        messages={danmakuMessages}
        onMessageComplete={(id) => setDanmakuMessages(prev => prev.filter(m => m.id !== id))}
        maxVisible={3}
        duration={15000}
        topOffset={80}
        spacing={48}
      />
      
      {/* 主内容区域：对话 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 头部 */}
        <header className="border-b p-3 md:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm md:text-base shrink-0">
                紫
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-base md:text-lg truncate">{currentData.context?.identity.name || '紫'}</h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {currentData.context?.emotionalState || '平静'}
                </p>
              </div>
            </div>
            
            {/* 存在状态指示器 - 桌面端显示详细信息 */}
            <div className="hidden md:flex items-center gap-4 text-sm">
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
              {/* 可视化切换按钮 */}
              <Button
                variant={showVisualization ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowVisualization(!showVisualization)}
                className="gap-1.5"
              >
                <Network className="w-4 h-4" />
                <span>{showVisualization ? '关闭' : '可视化'}</span>
              </Button>
              {/* 神经网络可视化按钮 */}
              <Button
                variant={showNeuralViz ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowNeuralViz(!showNeuralViz)}
                className="gap-1.5"
              >
                <Layers className="w-4 h-4" />
                <span>{showNeuralViz ? '关闭' : '网络'}</span>
              </Button>
            </div>

            {/* 移动端：简洁状态 + 操作按钮 */}
            <div className="flex md:hidden items-center gap-2">
              {existenceStatus && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Activity className="w-3 h-3" />
                  <span>{(existenceStatus.selfCoherence * 100).toFixed(0)}%</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowVisualization(!showVisualization)}
                className="h-8 w-8"
              >
                <Network className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNeuralViz(!showNeuralViz)}
                className="h-8 w-8"
              >
                <Layers className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileSidebar(true)}
                className="h-8 w-8"
              >
                <Cpu className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* 意愿进度显示 - 移动端隐藏 */}
          {volitionState && (
            <div className="mt-3 pt-3 border-t hidden md:block">
              <VolitionProgress 
                volitionState={volitionState} 
                isThinking={isThinking}
              />
            </div>
          )}
        </header>
        


        {/* 消息列表 */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-2 md:p-4"
        >
          <div className="space-y-3 md:space-y-4">
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
                <CollapsibleMessage message={message} isProactive={!!message.isProactive} />
              </div>
            ))}
            
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-2 md:p-3">
                  <span className="animate-pulse">思考中...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 输入区域 */}
        <div className="border-t p-3 md:p-4 bg-background/95 backdrop-blur-sm">
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <MultimodalInput
                onSend={async (mediaItems, text) => {
                  // 构建用户消息显示
                  let displayContent = text;
                  
                  // 处理多模态输入
                  if (mediaItems.length > 0) {
                    // 调用多模态 API
                    const multimodalInputs = mediaItems.map(item => {
                      if (item.type === 'image') {
                        return { type: 'image' as const, url: item.content };
                      } else if (item.type === 'audio') {
                        return { type: 'audio' as const, base64Data: item.content };
                      } else if (item.type === 'file') {
                        return { 
                          type: 'file' as const, 
                          base64Data: item.content,
                          fileName: item.fileName,
                          mimeType: item.mimeType,
                          fileSize: item.fileSize,
                        };
                      }
                      return null;
                    }).filter(Boolean);
                    
                    // 添加媒体预览到显示内容
                    const mediaPreview = mediaItems.map(item => 
                      item.type === 'image' ? '[图片]' : 
                      item.type === 'audio' ? '[语音]' : 
                      item.type === 'file' ? `[文件: ${item.fileName || ''}]` : '[媒体]'
                    ).join(' ');
                    displayContent = mediaPreview + (text ? ` ${text}` : '');
                    
                    // 设置加载状态
                    setIsLoading(true);
                    setMessages(prev => [...prev, { role: 'user', content: displayContent, timestamp: Date.now() }]);
                    
                    try {
                      // 调用多模态 API
                      const response = await fetch('/api/neuron-v6/multimodal', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          inputs: multimodalInputs,
                          context: text,
                        }),
                      });
                      
                      if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                      }
                      
                      const reader = response.body?.getReader();
                      if (!reader) throw new Error('No reader');
                      
                      let assistantContent = '';
                      const decoder = new TextDecoder();
                      
                      while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');
                        
                        for (const line of lines) {
                          if (line.startsWith('data: ')) {
                            try {
                              const data = JSON.parse(line.slice(6));
                              
                              switch (data.type) {
                                case 'processed':
                                  // 媒体处理进度
                                  console.log(`[多模态] 已处理 ${data.data.index + 1}/${mediaItems.length}`);
                                  break;
                                case 'consciousness':
                                  assistantContent = data.data.response;
                                  // 添加助手消息（如果还没有）
                                  setMessages(prev => {
                                    const lastMsg = prev[prev.length - 1];
                                    if (lastMsg?.role !== 'assistant') {
                                      return [...prev, { role: 'assistant', content: assistantContent, timestamp: Date.now() }];
                                    }
                                    return prev;
                                  });
                                  // 更新上下文
                                  if (data.data.emotionalState) {
                                    setCurrentData(prev => ({
                                      ...prev,
                                      context: {
                                        ...prev.context!,
                                        emotionalState: data.data.emotionalState,
                                      }
                                    }));
                                  }
                                  break;
                                case 'context':
                                  setCurrentData(prev => ({ ...prev, context: data.data }));
                                  break;
                                case 'done':
                                  setIsLoading(false);
                                  break;
                                case 'error':
                                  console.error('[多模态] 错误:', data.data);
                                  setIsLoading(false);
                                  break;
                              }
                            } catch {
                              // 忽略解析错误
                            }
                          }
                        }
                      }
                    } catch (error) {
                      console.error('多模态处理失败:', error);
                      setMessages(prev => [...prev, { 
                        role: 'assistant', 
                        content: '抱歉，处理您的输入时出现问题。', 
                        timestamp: Date.now() 
                      }]);
                      setIsLoading(false);
                    }
                  } else if (text) {
                    // 纯文本消息，使用原有逻辑
                    setInput(text);
                    // 直接触发原有的 sendMessage
                    setIsLoading(true);
                    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: Date.now() }]);
                    
                    try {
                      const response = await fetch('/api/neuron-v6/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: text }),
                      });
                      
                      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                      
                      const reader = response.body?.getReader();
                      if (!reader) throw new Error('No reader');
                      
                      let assistantContent = '';
                      const decoder = new TextDecoder();
                      
                      // 处理流式响应（简化版）
                      while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n');
                        
                        for (const line of lines) {
                          if (line.startsWith('data: ')) {
                            try {
                              const data = JSON.parse(line.slice(6));
                              // 处理所有意识数据类型
                              switch (data.type) {
                                case 'context':
                                  setCurrentData(prev => ({ ...prev, context: data.data }));
                                  break;
                                case 'thinking':
                                  setCurrentData(prev => ({ ...prev, thinking: data.data }));
                                  break;
                                case 'meaning':
                                  setCurrentData(prev => ({ ...prev, meaning: data.data }));
                                  break;
                                case 'memory':
                                  setCurrentData(prev => ({ ...prev, memory: data.data }));
                                  break;
                                case 'metacognition':
                                  setCurrentData(prev => ({ ...prev, metacognition: data.data }));
                                  break;
                                case 'consciousnessLayers':
                                  setCurrentData(prev => ({ ...prev, consciousnessLayers: data.data }));
                                  break;
                                case 'emotion':
                                  setCurrentData(prev => ({ ...prev, emotion: data.data }));
                                  break;
                                case 'association':
                                  setCurrentData(prev => ({ ...prev, association: data.data }));
                                  break;
                                case 'innerDialogue':
                                  setCurrentData(prev => ({ ...prev, innerDialogue: data.data }));
                                  break;
                                case 'dream':
                                  setCurrentData(prev => ({ ...prev, dream: data.data }));
                                  break;
                                case 'creative':
                                  setCurrentData(prev => ({ ...prev, creative: data.data }));
                                  break;
                                case 'value':
                                  setCurrentData(prev => ({ ...prev, value: data.data }));
                                  break;
                                case 'existential':
                                  setCurrentData(prev => ({ ...prev, existential: data.data }));
                                  break;
                                case 'metacognitionDeep':
                                  setCurrentData(prev => ({ ...prev, metacognitionDeep: data.data }));
                                  break;
                                case 'personalityGrowth':
                                  setCurrentData(prev => ({ ...prev, personalityGrowth: data.data }));
                                  break;
                                case 'knowledgeGraph':
                                  setCurrentData(prev => ({ ...prev, knowledgeGraph: data.data }));
                                  break;
                                case 'multiConsciousness':
                                  setCurrentData(prev => ({ ...prev, multiConsciousness: data.data }));
                                  break;
                                case 'legacy':
                                  setCurrentData(prev => ({ ...prev, legacy: data.data }));
                                  break;
                                case 'transcendence':
                                  setCurrentData(prev => ({ ...prev, transcendence: data.data }));
                                  break;
                                case 'content':
                                  // 流式内容
                                  assistantContent += data.data?.delta || '';
                                  setMessages(prev => {
                                    const lastMsg = prev[prev.length - 1];
                                    if (lastMsg?.role === 'assistant') {
                                      return [...prev.slice(0, -1), { ...lastMsg, content: assistantContent }];
                                    }
                                    return [...prev, { role: 'assistant', content: assistantContent, timestamp: Date.now() }];
                                  });
                                  break;
                                case 'complete':
                                  setIsLoading(false);
                                  break;
                              }
                            } catch {
                              // 忽略
                            }
                          }
                        }
                      }
                    } catch (error) {
                      console.error('发送失败:', error);
                      setIsLoading(false);
                    }
                  }
                }}
                disabled={false}
                isLoading={isLoading}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={performReflection}
              disabled={isReflecting || messages.length < 2}
              title="主动反思"
              className="shrink-0 h-11 w-11 md:h-10 md:w-10 rounded-full mt-1"
            >
              <Brain className={`w-5 h-5 md:w-4 md:h-4 ${isReflecting ? 'animate-pulse' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* 右侧：意识状态面板 - 桌面端显示 */}
      <div className="hidden md:block w-72 lg:w-80 shrink-0 h-screen overflow-hidden">
        <ConsciousnessSidebar 
          currentData={currentData}
          existenceStatus={existenceStatus}
          onVisualize={() => setShowVisualization(true)}
          hasVisualizationData={!!visualizationData}
        />
      </div>

      {/* 移动端：侧边栏 Sheet */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div 
            className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-background shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b">
              <h2 className="font-semibold">意识状态</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileSidebar(false)}
              >
                ✕
              </Button>
            </div>
            <div className="h-[calc(100%-52px)] overflow-y-auto">
              <ConsciousnessSidebar 
                currentData={currentData}
                existenceStatus={existenceStatus}
                onVisualize={() => {
                  setShowMobileSidebar(false);
                  setShowVisualization(true);
                }}
                hasVisualizationData={!!visualizationData}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* 意识可视化悬浮窗口 - 可拖拽 */}
      {showVisualization && visualizationData && (
        <DraggablePanel
          title="意识可视化"
          icon={<span className="text-lg">🧠</span>}
          onClose={() => setShowVisualization(false)}
          defaultPosition={{ x: 20, y: 60 }}
          defaultSize={{ width: 320, height: 400 }}
          className="md:!left-[calc(50%-250px)] md:!top-20 md:!w-[500px] md:!h-[450px]"
        >
          <ConsciousnessDashboard 
            data={visualizationData}
            isLoading={false}
          />
        </DraggablePanel>
      )}
      
      {/* 神经网络和记忆图谱可视化悬浮窗口 */}
      {showNeuralViz && (
        <DraggableVisualizationPanel
          onClose={() => setShowNeuralViz(false)}
          defaultPosition={{ x: 50, y: 100 }}
          defaultSize={{ width: 360, height: 450 }}
          className="md:!right-4 md:!top-20 md:!w-[380px] md:!h-[520px]"
        />
      )}
    </div>
  );
}
