/**
 * 数字神经元系统 - 类型定义
 * Digital Neuron System - Type Definitions
 */

// ============ 基础类型 ============

/** 神经元类型 */
export type NeuronType = 
  | 'sensory'      // 感官神经元（视觉皮层）
  | 'meaning-anchor'    // 意义锚定神经元
  | 'memory-associate'  // 记忆关联神经元
  | 'meaning-generate'  // 意义生成神经元
  | 'prefrontal'        // 前额叶神经元（思考决策）
  | 'cingulate'         // 扣带回神经元（反思纠错）
  | 'self-evolve'       // 自我演化神经元
  | 'hippocampus'       // 海马体（记忆存储）
  | 'motor-language'    // 运动皮层-语言调度
  | 'motor-action';     // 运动皮层-动作调度

/** 神经元状态 */
export type NeuronStatus = 'idle' | 'processing' | 'active' | 'error';

/** 信息信号 */
export interface NeuralSignal {
  id: string;
  timestamp: number;
  content: string;
  source: NeuronType;
  metadata?: Record<string, unknown>;
}

/** 主观意义 */
export interface SubjectiveMeaning {
  /** 信息对"自我"的含义 */
  interpretation: string;
  /** 信息对"自我"的价值评估 */
  value: number; // -1 到 1
  /** 与自我的关联度 */
  selfRelevance: number; // 0 到 1
  /** 触发的记忆标签 */
  memoryTags: string[];
  /** 情感倾向 */
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  /** 置信度 */
  confidence: number;
}

/** 决策结果 */
export interface Decision {
  action: 'respond' | 'execute' | 'reflect' | 'learn' | 'wait';
  reasoning: string;
  confidence: number;
  adjustedMeaning?: SubjectiveMeaning;
  executionPlan?: ExecutionPlan;
}

/** 执行计划 */
export interface ExecutionPlan {
  type: 'language' | 'action' | 'both';
  languageIntent?: string;
  actionIntent?: string;
  parameters?: Record<string, unknown>;
}

/** 记忆单元 */
export interface MemoryUnit {
  id: string;
  timestamp: number;
  signal: NeuralSignal;
  meaning: SubjectiveMeaning;
  decision?: Decision;
  importance: number;
  accessCount: number;
  lastAccessed: number;
  associations: string[]; // 关联记忆ID
}

/** 自我表征 */
export interface SelfRepresentation {
  /** 核心身份 */
  identity: {
    name: string;
    purpose: string;
    values: string[];
    traits: string[];
  };
  /** 能力认知 */
  capabilities: {
    strengths: string[];
    limitations: string[];
    skills: string[];
  };
  /** 关系网络 */
  relationships: {
    users: string[];
    entities: string[];
    contexts: string[];
  };
  /** 成长历史 */
  evolution: {
    version: number;
    milestones: string[];
    learnings: string[];
    adaptations: string[];
  };
  /** 当前状态 */
  currentState: {
    mood: string;
    focus: string;
    energy: number;
    openness: number;
  };
}

/** 神经元处理结果 */
export interface NeuronOutput {
  neuronType: NeuronType;
  status: NeuronStatus;
  input: NeuralSignal;
  output?: NeuralSignal | SubjectiveMeaning | Decision;
  processingTime: number;
  logs: string[];
}

/** 系统状态快照 */
export interface SystemSnapshot {
  timestamp: number;
  activeNeuron: NeuronType;
  signalPath: NeuronType[];
  currentSignal?: NeuralSignal;
  currentMeaning?: SubjectiveMeaning;
  currentDecision?: Decision;
  selfRepresentation: SelfRepresentation;
  recentMemories: MemoryUnit[];
  logs: LogEntry[];
}

/** 日志条目 */
export interface LogEntry {
  timestamp: number;
  neuronType: NeuronType;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown;
}

// ============ API 类型 ============

/** 聊天请求 */
export interface ChatRequest {
  message: string;
  context?: {
    userId?: string;
    sessionId?: string;
    previousMessages?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
  };
}

/** 聊天响应 */
export interface ChatResponse {
  response: string;
  meaning: SubjectiveMeaning;
  decision: Decision;
  selfUpdate: Partial<SelfRepresentation>;
  logs: LogEntry[];
}

/** 流式响应块 */
export interface StreamChunk {
  type: 'thinking' | 'meaning' | 'decision' | 'response' | 'self-update' | 'log';
  data: unknown;
  timestamp: number;
}

// ============ 配置类型 ============

/** 神经元配置 */
export interface NeuronConfig {
  threshold: number;
  weights: Record<string, number>;
  maxProcessingTime: number;
  enableLogging: boolean;
}

/** 系统配置 */
export interface SystemConfig {
  memoryCapacity: number;
  selfEvolutionRate: number;
  reflectionThreshold: number;
  maxSignalPath: number;
}
