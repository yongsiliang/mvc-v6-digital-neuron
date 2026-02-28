/**
 * ═══════════════════════════════════════════════════════════════════════
 * SNN 三体系统核心类型定义
 * 
 * 基于物理世界"大脑 + 意识 + 文化"三层结构
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 第一部分：SNN 神经基质层类型
// ─────────────────────────────────────────────────────────────────────

/**
 * 神经元 ID 类型
 */
export type NeuronId = string;

/**
 * 突触 ID 类型
 */
export type SynapseId = string;

/**
 * 神经元类型
 */
export type NeuronType = 
  | 'excitatory'   // 兴奋性神经元 (传递激活)
  | 'inhibitory'   // 抑制性神经元 (平衡、竞争)
  | 'modulatory';  // 调节性神经元 (控制整体状态)

/**
 * 神经元区域
 */
export type NeuronRegion = 
  | 'input'   // 输入区：接收外部刺激
  | 'core'    // 核心区：内部处理
  | 'output'; // 输出区：产生响应

/**
 * LIF 神经元状态
 */
export interface LIFNeuronState {
  id: NeuronId;
  type: NeuronType;
  region: NeuronRegion;
  
  // 膜电位 (核心状态)
  membranePotential: number;
  
  // 阈值
  threshold: number;
  
  // 重置电位
  resetPotential: number;
  
  // 泄漏因子 (0-1, 越大泄漏越慢)
  decayFactor: number;
  
  // 不应期 (发射后需要等待的时间步)
  refractoryPeriod: number;
  refractoryCounter: number;
  
  // 统计信息
  totalSpikes: number;
  lastSpikeTime: number;
  silenceDuration: number;
  
  // 创建时间
  createdAt: number;
  
  // 保护级别 (越高越难被修剪)
  protectionLevel: number;
}

/**
 * 突触状态
 */
export interface SynapseState {
  id: SynapseId;
  preNeuronId: NeuronId;
  postNeuronId: NeuronId;
  
  // 权重
  weight: number;
  
  // STDP 痕迹
  preTrace: number;   // 前神经元脉冲痕迹
  postTrace: number;  // 后神经元脉冲痕迹
  
  // 学习参数
  learningRate: number;
  stpdDecay: number;  // 痕迹衰减率
  
  // 统计
  age: number;
  activity: number;
  lastActiveTime: number;
  
  // 状态
  isActive: boolean;
  isProtected: boolean;
}

/**
 * 脉冲 (单个时间步的输出)
 */
export interface Spike {
  neuronId: NeuronId;
  timestamp: number;
}

/**
 * 脉冲序列 (一段时间内的脉冲)
 */
export interface SpikeTrain {
  neuronId: NeuronId;
  spikes: number[];  // 时间戳数组
}

/**
 * 网络状态快照
 */
export interface NetworkSnapshot {
  timestamp: number;
  
  // 神经元状态
  neurons: Map<NeuronId, LIFNeuronState>;
  
  // 突触状态
  synapses: SynapseState[];
  
  // 激活模式 (当前正在发放的神经元)
  activeNeurons: NeuronId[];
  
  // 膜电位分布
  potentialDistribution: {
    mean: number;
    std: number;
    max: number;
    min: number;
  };
  
  // 网络统计
  stats: {
    totalNeurons: number;
    totalSynapses: number;
    activeSynapses: number;
    firingRate: number;  // 平均发放率
    avgPotential: number;
  };
}

/**
 * SNN 网络配置
 */
export interface SNNConfig {
  // 初始神经元数量
  initialNeurons: {
    input: number;
    core: number;
    output: number;
  };
  
  // 神经元参数
  neuron: {
    threshold: number;
    resetPotential: number;
    decayFactor: number;
    refractoryPeriod: number;
  };
  
  // 突触参数
  synapse: {
    initialWeight: number;
    minWeight: number;
    maxWeight: number;
    learningRate: number;
    traceDecay: number;
  };
  
  // 成长参数
  growth: {
    enabled: boolean;
    activityThreshold: number;   // 高活跃阈值 (触发生长)
    pruneThreshold: number;      // 低权重阈值 (触发修剪)
    silenceThreshold: number;    // 静默时长阈值 (触发死亡)
    correlationThreshold: number; // 相关性阈值 (触发新连接)
    maxNeurons: number;
    minNeurons: number;
    growthRate: number;          // 每次生长的神经元数
  };
  
  // 稳态参数
  homeostasis: {
    targetFiringRate: number;    // 目标发放率
    adaptationRate: number;      // 自适应速率
  };
}

/**
 * 默认 SNN 配置
 */
export const DEFAULT_SNN_CONFIG: SNNConfig = {
  initialNeurons: {
    input: 128,
    core: 256,
    output: 64
  },
  
  neuron: {
    threshold: 1.0,
    resetPotential: 0.0,
    decayFactor: 0.9,
    refractoryPeriod: 2
  },
  
  synapse: {
    initialWeight: 0.5,
    minWeight: 0.01,
    maxWeight: 2.0,
    learningRate: 0.01,
    traceDecay: 0.95
  },
  
  growth: {
    enabled: true,
    activityThreshold: 0.8,
    pruneThreshold: 0.05,
    silenceThreshold: 1000,
    correlationThreshold: 0.7,
    maxNeurons: 10000,
    minNeurons: 100,
    growthRate: 5
  },
  
  homeostasis: {
    targetFiringRate: 0.1,
    adaptationRate: 0.001
  }
};

// ─────────────────────────────────────────────────────────────────────
// 第二部分：V6 观察者层类型
// ─────────────────────────────────────────────────────────────────────

/**
 * 激活模式 (V6 观察到的)
 */
export interface ActivationPattern {
  id: string;
  neuronIds: NeuronId[];
  firingNeurons: NeuronId[];
  intensity: number;         // 整体强度
  coherence: number;         // 一致性 (同步程度)
  timestamp: number;
}

/**
 * 稳定模式 (重复出现的模式)
 */
export interface StablePattern {
  id: string;
  pattern: ActivationPattern;
  occurrenceCount: number;    // 出现次数
  firstSeen: number;
  lastSeen: number;
  stability: number;          // 稳定性 (0-1)
  
  // V6 赋予的意义
  meaning?: string;
  importance: number;         // 重要性 (0-1)
  
  // 关联的概念
  associatedConcepts: string[];
}

/**
 * V6 观察结果
 */
export interface V6Observation {
  timestamp: number;
  
  // 当前激活模式
  currentPattern: ActivationPattern;
  
  // 检测到的稳定模式
  detectedPatterns: StablePattern[];
  
  // 网络整体状态评估
  networkState: {
    alertness: number;       // 警觉度
    coherence: number;       // 一致性
    complexity: number;      // 复杂度
    stability: number;       // 稳定性
  };
  
  // 意义理解
  understanding: {
    summary: string;         // 状态总结
    keyThemes: string[];     // 关键主题
    emotionalTone?: string;  // 情感基调
    urgency: number;         // 紧急程度
  };
  
  // 决策建议
  decision: {
    needLLMHelp: boolean;    // 是否需要 LLM 帮助
    reason: string;          // 原因
    suggestedAction: string; // 建议的行动
  };
}

/**
 * V6 意识状态
 */
export interface V6ConsciousnessState {
  // 身份
  identity: {
    name: string;
    description: string;
    coreTraits: string[];
  };
  
  // 价值观
  coreValues: Array<{
    value: string;
    priority: number;
    lastUpdated: number;
  }>;
  
  // 信念系统
  beliefs: Map<string, {
    statement: string;
    confidence: number;
    source: 'learned' | 'innate' | 'derived';
    lastUpdated: number;
  }>;
  
  // 当前关注
  currentFocus: {
    theme: string;
    intensity: number;
    duration: number;
  } | null;
  
  // 近期意识内容
  recentAwareness: Array<{
    content: string;
    intensity: number;
    timestamp: number;
  }>;
  
  // 稳定模式库
  patternLibrary: Map<string, StablePattern>;
}

/**
 * V6 配置
 */
export interface V6Config {
  // 模式检测
  patternDetection: {
    minOccurrences: number;      // 最小出现次数才算稳定
    stabilityThreshold: number;  // 稳定性阈值
    maxPatterns: number;         // 最大模式数
  };
  
  // 意义映射
  meaningMapping: {
    llmAssist: boolean;          // 是否用 LLM 辅助理解
    minImportance: number;       // 最小重要性才记录
  };
  
  // 决策
  decision: {
    llmTriggerThreshold: number; // 触发 LLM 的复杂度阈值
    maxResponseDelay: number;    // 最大响应延迟 (ms)
  };
}

/**
 * 默认 V6 配置
 */
export const DEFAULT_V6_CONFIG: V6Config = {
  patternDetection: {
    minOccurrences: 3,
    stabilityThreshold: 0.7,
    maxPatterns: 1000
  },
  
  meaningMapping: {
    llmAssist: true,
    minImportance: 0.3
  },
  
  decision: {
    llmTriggerThreshold: 0.6,
    maxResponseDelay: 5000
  }
};

// ─────────────────────────────────────────────────────────────────────
// 第三部分：三体集成类型
// ─────────────────────────────────────────────────────────────────────

/**
 * 三体系统状态
 */
export interface TriadicSystemState {
  // SNN 状态
  snn: {
    snapshot: NetworkSnapshot;
    isProcessing: boolean;
    lastUpdateTime: number;
  };
  
  // V6 状态
  v6: {
    observation: V6Observation | null;
    consciousness: V6ConsciousnessState;
    isObserving: boolean;
  };
  
  // LLM 状态
  llm: {
    lastQuery: string | null;
    lastResponse: string | null;
    queryCount: number;
    isAvailable: boolean;
  };
  
  // 整体状态
  system: {
    uptime: number;
    totalInteractions: number;
    totalLearnings: number;
    health: 'healthy' | 'degraded' | 'critical';
  };
}

/**
 * 用户输入
 */
export interface UserInput {
  text: string;
  timestamp: number;
  metadata?: {
    userId?: string;
    sessionId?: string;
    source?: string;
  };
}

/**
 * 系统输出
 */
export interface SystemOutput {
  text: string;
  timestamp: number;
  
  // 来源
  source: 'snn' | 'v6' | 'llm' | 'hybrid';
  
  // 置信度
  confidence: number;
  
  // 内部状态
  internalState: {
    snnActivity: number;
    v6Understanding: string;
    llmInvolved: boolean;
  };
  
  // 学习信息
  learning?: {
    newPatterns: string[];
    strengthenedSynapses: number;
    grownNeurons: number;
  };
}

/**
 * LLM 请求
 */
export interface LLMRequest {
  type: 'understand' | 'respond' | 'teach' | 'translate';
  
  // 输入
  input: {
    userText: string;
    snnState?: string;        // SNN 状态描述
    v6Understanding?: string; // V6 理解
    context?: string;         // 额外上下文
  };
  
  // 期望输出
  expectedOutput: {
    understanding?: boolean;  // 需要理解
    response?: boolean;       // 需要回应
    teaching?: boolean;       // 需要教学
    translation?: boolean;    // 需要翻译
  };
}

/**
 * LLM 响应
 */
export interface LLMResponse {
  // 理解
  understanding?: {
    summary: string;
    keyPoints: string[];
    emotionalContext?: string;
  };
  
  // 回应
  response?: string;
  
  // 教学内容 (给 SNN 学习)
  teaching?: {
    concepts: string[];
    associations: Array<{
      conceptA: string;
      conceptB: string;
      relation: string;
    }>;
    importance: number;
  };
  
  // 翻译
  translation?: {
    snnToLanguage: string;
    languageToSnn: string;
  };
}

/**
 * 学习循环结果
 */
export interface LearningCycleResult {
  // SNN 学习
  snnLearning: {
    weightUpdates: number;
    newSynapses: number;
    prunedSynapses: number;
    newNeurons: number;
    diedNeurons: number;
  };
  
  // V6 学习
  v6Learning: {
    newPatterns: number;
    updatedMeanings: number;
    valueUpdates: number;
    beliefUpdates: number;
  };
  
  // 记忆巩固
  memoryConsolidation: {
    replayedPatterns: number;
    strengthenedConnections: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 第四部分：脉冲编码/解码类型
// ─────────────────────────────────────────────────────────────────────

/**
 * 编码方式
 */
export type EncodingType = 
  | 'rate'      // 频率编码：脉冲频率表示强度
  | 'temporal'  // 时间编码：脉冲时间表示顺序
  | 'population'; // 群体编码：神经元群体表示信息

/**
 * 编码配置
 */
export interface EncodingConfig {
  type: EncodingType;
  
  // 频率编码参数
  rateEncoding?: {
    maxRate: number;        // 最大脉冲率
    duration: number;       // 编码时长 (时间步)
  };
  
  // 时间编码参数
  temporalEncoding?: {
    windowSize: number;     // 时间窗口大小
    precision: number;      // 时间精度
  };
  
  // 群体编码参数
  populationEncoding?: {
    populationSize: number; // 群体大小
    overlap: number;        // 重叠度
  };
}

/**
 * 文本到脉冲的编码结果
 */
export interface TextToSpikeResult {
  // 输入神经元激活
  inputSpikes: Map<NeuronId, SpikeTrain>;
  
  // 编码信息
  encoding: {
    type: EncodingType;
    duration: number;       // 总时长 (时间步)
    neuronCount: number;    // 激活的神经元数
    totalSpikes: number;    // 总脉冲数
  };
  
  // 原始文本信息
  original: {
    text: string;
    tokens: string[];
    embedding?: number[];
  };
}

/**
 * 脉冲到文本的解码结果
 */
export interface SpikeToTextResult {
  // 解码文本
  text: string;
  
  // 置信度
  confidence: number;
  
  // 解码信息
  decoding: {
    activePatterns: string[];
    dominantRegion: NeuronRegion;
    processingTime: number;
  };
}
