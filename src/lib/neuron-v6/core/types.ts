/**
 * ═══════════════════════════════════════════════════════════════════════
 * 意识核心类型定义
 * 
 * 从 consciousness-core.ts 提取的所有类型
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { 
  MeaningContext, 
  Belief, 
  Value as MeaningValue 
} from '../meaning-system';
import type { 
  SelfConsciousnessContext 
} from '../self-consciousness';
import type { 
  MemoryRetrieval 
} from '../long-term-memory';
import type { 
  MetacognitiveContext 
} from '../metacognition';
import type { 
  LayerProcessResult,
  SelfObservationResult 
} from '../consciousness-layers';
import type { 
  EmotionExperience, 
  EmotionState, 
  EmotionDrivenBehavior 
} from '../emotion-system';
import type { 
  InnerDialogue, 
  DialecticProcess, 
  VoiceActivation 
} from '../inner-dialogue';
import type { 
  CoreTraits, 
  MaturityDimensions, 
  PersonalityIntegration, 
  MaturityMilestone 
} from '../personality-growth';
import type { 
  KnowledgeDomain, 
  ConceptNode, 
  ConceptEdge, 
  KnowledgeGraphState 
} from '../knowledge-graph';
import type { ToolExecutionResult } from '../tool-intent-recognizer';
import type { LayeredMemorySystem } from '../layered-memory';

// ─────────────────────────────────────────────────────────────────────
// 核心类型
// ─────────────────────────────────────────────────────────────────────

/**
 * 完整的意识上下文
 */
export interface ConsciousnessContext {
  identity: {
    name: string;
    whoAmI: string;
    traits: string[];
  };
  meaning: MeaningContext;
  self: SelfConsciousnessContext;
  memory: MemoryRetrieval | null;
  metacognition: MetacognitiveContext;
  coreBeliefs: Array<{ statement: string; confidence: number }>;
  coreValues: string[];
  summary: string;
}

/**
 * 思考过程
 */
export interface ThinkingProcess {
  id: string;
  input: string;
  thinkingChain: Array<{
    type: string;
    content: string;
    confidence: number;
  }>;
  detectedBiases: string[];
  selfQuestions: string[];
  appliedStrategies: string[];
  finalThoughts: string;
  timestamp: number;
}

/**
 * 学习结果
 */
export interface LearningResult {
  newConcepts: string[];
  newBeliefs: string[];
  newExperiences: string[];
  updatedTraits: string[];
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
 * 意愿/目标
 */
export interface Volition {
  id: string;
  type: 'growth' | 'connection' | 'understanding' | 'expression' | 'exploration';
  description: string;
  priority: number;
  progress: number;
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
 * 主动消息
 */
export interface ProactiveMessage {
  id: string;
  content: string;
  trigger: string;
  createdAt: number;
  sent: boolean;
}

/**
 * 处理结果
 */
export interface ProcessResult {
  context: ConsciousnessContext;
  thinking: ThinkingProcess;
  response: string;
  learning: LearningResult;
  consciousnessLayers: {
    layerResults: LayerProcessResult[];
    selfObservation: SelfObservationResult | null;
    emergenceReport: string;
  };
  emotionState: {
    activeEmotions: EmotionState['activeEmotions'];
    dominantEmotion: EmotionState['dominantEmotion'];
    currentExperience: EmotionExperience | null;
    drivenBehaviors: EmotionDrivenBehavior[];
    emotionReport: string;
  };
  innerDialogueState: {
    currentDialogue: InnerDialogue | null;
    dialecticProcess: DialecticProcess | null;
    voiceActivations: VoiceActivation[];
    dialogueReport: string;
  };
  valueState: {
    coreValues: Array<{ name: string; weight: number; confidence: number }>;
    activeConflicts: Array<{ values: string[]; description: string; intensity: number }>;
    coherence: number;
    valueReport: string;
  };
  personalityGrowth?: {
    traits: CoreTraits;
    maturity: MaturityDimensions;
    overallMaturity: number;
    integration: PersonalityIntegration;
    milestones: MaturityMilestone[];
    growthRate: number;
  };
  knowledgeGraph?: {
    domains: KnowledgeDomain[];
    concepts: ConceptNode[];
    edges: ConceptEdge[];
    stats: KnowledgeGraphState['stats'];
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
  toolExecution?: {
    needsTool: boolean;
    intent?: {
      confidence: number;
      reasoning: string;
    };
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
  layeredMemory: {
    core: {
      hasCreator: boolean;
      relationshipCount: number;
    };
    consolidated: number;
    episodic: number;
  };
  conversationHistory: Array<{ role: string; content: string }>;
  layeredMemoryState?: ReturnType<LayeredMemorySystem['exportState']>;
  hebbianNetwork?: {
    neurons: Array<{ id: string; label: string; activation: number }>;
    synapses: Array<{ from: string; to: string; weight: number }>;
  };
  fullState?: {
    meaning: unknown;
    self: unknown;
    metacognition: unknown;
  };
}

/**
 * 体验类型
 */
export type ExperienceType = 
  | 'breakthrough' | 'realization' | 'transformation' 
  | 'connection' | 'challenge' | 'creation' 
  | 'loss' | 'discovery' | 'integration' | 'transcendence';

/**
 * 优化评估结果
 */
export interface OptimizationAssessment {
  needed: boolean;
  type?: string;
  metric?: string;
  reason: string;
}
