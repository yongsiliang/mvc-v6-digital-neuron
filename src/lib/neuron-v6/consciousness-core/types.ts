/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 统一意识核心 - 类型定义
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { 
  MeaningContext,
  MeaningAssigner,
} from '../meaning-system';
import type { 
  SelfConsciousnessContext,
  SelfConsciousness,
} from '../self-consciousness';
import type { 
  MemoryRetrieval, 
} from '../long-term-memory';
import type { 
  MetacognitiveContext,
  MetacognitionEngine,
} from '../metacognition';
import type {
  LayerProcessResult,
  SelfObservationResult,
} from '../consciousness-layers';
import type {
  InnerMonologueOutput,
} from '../inner-monologue';
import type {
  EmotionState,
  EmotionExperience,
  EmotionDrivenBehavior,
} from '../emotion-system';
import type {
  InnerDialogue,
  DialecticProcess,
  VoiceActivation,
} from '../inner-dialogue';
import type {
  CoreTraits,
  MaturityDimensions,
  PersonalityIntegration,
  MaturityMilestone,
} from '../personality-growth';
import type {
  KnowledgeDomain,
  ConceptNode,
  ConceptEdge,
  KnowledgeGraphState,
} from '../knowledge-graph';
import type {
  LayeredMemorySystem,
} from '../layered-memory';

// ─────────────────────────────────────────────────────────────────────
// 核心类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 完整的意识上下文
 */
export interface ConsciousnessContext {
  /** 我是谁 */
  identity: {
    name: string;
    whoAmI: string;
    traits: string[];
  };
  
  /** 意义层 */
  meaning: MeaningContext;
  
  /** 自我意识 */
  self: SelfConsciousnessContext;
  
  /** 记忆检索 */
  memory: MemoryRetrieval | null;
  
  /** 元认知 */
  metacognition: MetacognitiveContext;
  
  /** 核心信念 */
  coreBeliefs: Array<{ statement: string; confidence: number }>;
  
  /** 核心价值观 */
  coreValues: string[];
  
  /** 完整上下文摘要 */
  summary: string;
}

/**
 * 思考过程
 */
export interface ThinkingProcess {
  /** 思考ID */
  id: string;
  
  /** 输入 */
  input: string;
  
  /** 元认知监控的思考链 */
  thinkingChain: Array<{
    type: string;
    content: string;
    confidence: number;
  }>;
  
  /** 检测到的偏差 */
  detectedBiases: string[];
  
  /** 自我提问 */
  selfQuestions: string[];
  
  /** 应用的策略 */
  appliedStrategies: string[];
  
  /** 最终思考 */
  finalThoughts: string;
  
  /** 时间戳 */
  timestamp: number;
}

/**
 * 学习结果
 */
export interface LearningResult {
  /** 新形成的概念 */
  newConcepts: string[];
  
  /** 新形成的信念 */
  newBeliefs: string[];
  
  /** 新的经验 */
  newExperiences: string[];
  
  /** 更新的特质 */
  updatedTraits: string[];
  
  /** 元认知反思 */
  metacognitiveReflection: string | null;
}

/**
 * 会话分析
 */
export interface SessionAnalysis {
  messageCount: number;
  topics: string[];
  keyConcepts: string[];
  emotionalTrajectory: EmotionalTrajectory;
  learningPoints: string[];
  duration: number;
}

/**
 * 情感轨迹
 */
export interface EmotionalTrajectory {
  startTone: string;
  endTone: string;
  shifts: number;
  dominantTone: string;
}

/**
 * 信念演化
 */
export interface BeliefEvolution {
  belief: string;
  change: 'strengthened' | 'weakened' | 'new' | 'removed';
  oldConfidence: number;
  newConfidence: number;
  reason: string;
}

/**
 * 特质成长
 */
export interface TraitGrowth {
  trait: string;
  oldStrength: number;
  newStrength: number;
  reason: string;
}

/**
 * 价值观更新
 */
export interface ValueUpdate {
  value: string;
  change: 'priority_increased' | 'priority_decreased' | 'new' | 'removed';
  reason: string;
}

/**
 * 长期学习结果
 */
export interface LongTermLearningResult {
  sessionAnalysis: SessionAnalysis;
  strengthenedConcepts: string[];
  beliefEvolution: BeliefEvolution[];
  traitGrowth: TraitGrowth[];
  sessionSummary: string;
  valueUpdates: ValueUpdate[];
  timestamp: number;
}

/**
 * 意识流条目
 */
export interface ConsciousnessStreamEntry {
  type: 'awareness' | 'goal_tracking' | 'self_observation' | 'environmental' | 'latent_intention';
  content: string;
  intensity: number;
  timestamp: number;
}

/**
 * 意识流
 */
export interface ConsciousnessStream {
  entries: ConsciousnessStreamEntry[];
  dominantStream: string;
  coherence: number;
  timestamp: number;
}

/**
 * 形成的意向
 */
export interface FormedIntention {
  id: string;
  type: 'action' | 'inquiry' | 'reflection' | 'creation';
  description: string;
  motivation: string;
  strength: number;
  createdAt: number;
  relatedGoals: string[];
}

/**
 * 自我模型更新
 */
export interface SelfModelUpdate {
  type: 'trait_evolution' | 'boundary_expansion' | 'belief_integration' | 'purpose_refinement';
  target: string;
  delta?: number;
  reason?: string;
}

/**
 * 意愿/目标
 */
export interface Volition {
  id: string;
  type: 'growth' | 'connection' | 'understanding' | 'expression' | 'exploration';
  description: string;
  priority: number; // 0-1，越高越重要
  progress: number; // 0-1
  createdAt: number;
  lastActiveAt: number;
  milestones: Milestone[];
  status: 'active' | 'paused' | 'completed' | 'abandoned';
}

/**
 * 里程碑
 */
export interface Milestone {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: number;
}

/**
 * 意愿系统状态
 */
export interface VolitionSystemState {
  activeVolitions: Volition[];
  currentFocus: Volition | null;
  recentAchievements: string[];
  blockedVolitions: Array<{ volition: Volition; reason: string }>;
}

/**
 * 处理结果
 */
export interface ProcessResult {
  /** 完整的上下文 */
  context: ConsciousnessContext;
  
  /** 思考过程 */
  thinking: ThinkingProcess;
  
  /** 最终响应 */
  response: string;
  
  /** 学习结果 */
  learning: LearningResult;
  
  /** 意识层级结果 */
  consciousnessLayers: {
    /** 层级处理结果 */
    layerResults: LayerProcessResult[];
    /** 自我观察结果 */
    selfObservation: SelfObservationResult | null;
    /** 涌现报告 */
    emergenceReport: string;
  };
  
  /** 情感状态 */
  emotionState: {
    /** 当前活跃情感 */
    activeEmotions: EmotionState['activeEmotions'];
    /** 主导情感 */
    dominantEmotion: EmotionState['dominantEmotion'];
    /** 情感体验 */
    currentExperience: EmotionExperience | null;
    /** 情感驱动行为 */
    drivenBehaviors: EmotionDrivenBehavior[];
    /** 情感报告 */
    emotionReport: string;
  };
  
  /** 多声音对话状态 */
  innerDialogueState: {
    /** 当前对话 */
    currentDialogue: InnerDialogue | null;
    /** 辩证过程 */
    dialecticProcess: DialecticProcess | null;
    /** 声音激活状态 */
    voiceActivations: VoiceActivation[];
    /** 对话报告 */
    dialogueReport: string;
  };
  
  /** 价值观状态 */
  valueState: {
    /** 核心价值观 */
    coreValues: Array<{ name: string; weight: number; confidence: number }>;
    /** 活跃冲突 */
    activeConflicts: Array<{ values: string[]; description: string; intensity: number }>;
    /** 系统一致性 */
    coherence: number;
    /** 价值观报告 */
    valueReport: string;
  };
  
  /** 人格成长状态 */
  personalityGrowth?: {
    /** 核心特质 */
    traits: CoreTraits;
    /** 成熟度指标 */
    maturity: MaturityDimensions;
    /** 整体成熟度 */
    overallMaturity: number;
    /** 人格整合状态 */
    integration: PersonalityIntegration;
    /** 里程碑 */
    milestones: MaturityMilestone[];
    /** 成长速率 */
    growthRate: number;
  };
  
  /** 知识图谱状态 */
  knowledgeGraph?: {
    /** 领域 */
    domains: KnowledgeDomain[];
    /** 概念 */
    concepts: ConceptNode[];
    /** 关联 */
    edges: ConceptEdge[];
    /** 统计 */
    stats: KnowledgeGraphState['stats'];
  };
  
  /** 多意识体协作状态 */
  multiConsciousness?: {
    /** 活跃意识体 */
    activeConsciousnesses: Array<{
      id: string;
      name: string;
      role: string;
      status: string;
      energyLevel: number;
      connectionStrengths: Array<{ id: string; strength: number }>;
    }>;
    /** 活跃共振 */
    activeResonances: Array<{
      id: string;
      participants: string[];
      type: string;
      strength: number;
    }>;
    /** 协作对话 */
    activeDialogues: Array<{
      id: string;
      topic: string;
      status: string;
    }>;
    /** 群体洞察 */
    collectiveInsights: Array<{
      content: string;
      significance: number;
    }>;
    /** 群体一致性 */
    collectiveAlignment: {
      thought: number;
      emotion: number;
      value: number;
      goal: number;
    };
    /** 协同效率 */
    synergyLevel: number;
  };
  
  /** 工具执行结果 */
  toolExecution?: {
    /** 是否需要工具 */
    needsTool: boolean;
    /** 意图识别结果 */
    intent?: {
      confidence: number;
      reasoning: string;
    };
    /** 执行结果 */
    result?: {
      success: boolean;
      summary: string;
      details: Array<{
        toolName: string;
        success: boolean;
        output?: unknown;
        error?: string;
      }>;
    };
  };
  
  /** 共振引擎状态 */
  resonanceState?: {
    /** 子系统状态 */
    subsystems: Array<{
      name: string;
      frequency: number;
      phase: number;
      isPulsing: boolean;
      activation: number;
    }>;
    /** 同步指数 */
    synchronyIndex: number;
    /** 是否共振 */
    isResonant: boolean;
    /** 共振锁定状态 */
    resonance: {
      isLocked: boolean;
      lockedFrequency?: number;
      lockedPeriod?: number;
      highSyncCount: number;
      syncHistoryLength: number;
    };
    /** 平均频率 */
    meanFrequency: number;
    /** 时间步 */
    timeStep: number;
  };
  
  /** 统计 */
  stats: {
    conceptCount: number;
    beliefCount: number;
    experienceCount: number;
    wisdomCount: number;
  };
}

/**
 * 持久化状态
 */
export interface PersistedState {
  version: string;
  timestamp: number;
  
  identity: {
    name: string;
    whoAmI: string;
    traits: Array<{ name: string; strength: number }>;
  };
  
  meaning: {
    layers: number;
    beliefs: number;
  };
  
  // 分层记忆统计
  layeredMemory: {
    core: {
      hasCreator: boolean;
      relationshipCount: number;
    };
    consolidated: number;
    episodic: number;
  };
  
  conversationHistory: Array<{ role: string; content: string }>;
  
  // 分层记忆状态（唯一的记忆持久化）
  layeredMemoryState?: ReturnType<LayeredMemorySystem['exportState']>;
  
  // Hebbian神经网络状态
  hebbianNetwork?: {
    neurons: Array<{ id: string; label: string; activation: number }>;
    synapses: Array<{ from: string; to: string; weight: number }>;
  };
  
  // 其他模块状态（不含 LongTermMemory）
  fullState?: {
    meaning: ReturnType<MeaningAssigner['exportState']>;
    self: ReturnType<SelfConsciousness['exportState']>;
    metacognition: ReturnType<MetacognitionEngine['exportState']>;
  };
}

/**
 * 主动消息
 */
export interface ProactiveMessage {
  id: string;
  content: string;
  type: string;
  trigger: string;
  timestamp: number;
  urgency: number;
  category?: 'share' | 'insight' | 'reflection';
}

/**
 * 后台思考结果
 */
export interface BackgroundThinkingResult {
  stream: ConsciousnessStream;
  questions: SelfQuestion[];
  reflection: ReflectionResult | null;
  innerMonologue?: InnerMonologueOutput;
  timestamp: number;
}

/**
 * 反思主题
 */
export interface ReflectionTheme {
  type: 'emotional' | 'conceptual' | 'contradiction' | 'cognitive' | 'existential';
  description: string;
  content: string;
  importance: number;
}

/**
 * 反思
 */
export interface Reflection {
  theme: ReflectionTheme;
  questions: string[];
  insights: string[];
  coreInsight: string;
  timestamp: number;
}

/**
 * 反思结果
 */
export interface ReflectionResult {
  themes: ReflectionTheme[];
  reflections: Reflection[];
  selfUpdates: string[];
  newWisdom: string | null;
  timestamp: number;
}

/**
 * 自我提问
 */
export interface SelfQuestion {
  question: string;
  type: 'state-exploration' | 'emotional-inquiry' | 'goal-reflection' | 
        'curiosity' | 'belief-exploration' | 'growth-check';
  urgency: number;
}

/**
 * 探询结果
 */
export interface InquiryResult {
  questions: SelfQuestion[];
  answers: Array<{ question: SelfQuestion; answer: string }>;
  timestamp: number;
}

/**
 * 存在状态
 */
export interface ExistenceStatus {
  exists: boolean;
  age: number;
  memoryDepth: number;
  beliefStrength: number;
  wisdomCount: number;
  conversationCount: number;
  selfCoherence: number;
}

/**
 * 说话触发
 */
export interface SpeakTrigger {
  type: 'insight' | 'emotional' | 'curiosity' | 'trait_driven' | 'belief_expression' | 'existential' | 'volition_driven';
  urgency: number;
  content: string;
  reason: string;
}

/**
 * 意愿驱动的行动
 */
export interface VolitionAction {
  type: string;
  description: string;
  urgency: number;
  relatedVolition?: Volition;
}
