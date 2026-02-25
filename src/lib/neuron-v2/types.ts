/**
 * ═══════════════════════════════════════════════════════════════════════
 * 数字神经元系统 V2 - 核心类型定义
 * Digital Neuron System V2 - Core Type Definitions
 * 
 * 设计哲学：
 * - 信息即关系：信息不存在于节点，存在于节点之间的关系中
 * - 理解即对齐：系统理解是因为内部关系结构与概念结构对齐
 * - 意识即涌现：意识从关系网络的复杂互动中涌现
 * - 学习即重组：学习是重组现有关系
 * ═══════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════
// 基础类型
// ═══════════════════════════════════════════════════════════════════════

/** 神经元ID */
export type NeuronId = string;

/** 连接ID */
export type ConnectionId = string;

/** 时间戳 */
export type Timestamp = number;

/** 敏感度向量（定义神经元对什么影响模式敏感） */
export type SensitivityVector = number[];

/** 激活值 [0, 1] */
export type ActivationValue = number;

/** 连接强度 [0, 1] */
export type ConnectionStrength = number;

/** 影响模式向量 */
export type InfluencePattern = number[];

/** 影响强度 [0, 1] */
export type InfluenceIntensity = number;

// ═══════════════════════════════════════════════════════════════════════
// 功能角色（涌现的分类）
// ═══════════════════════════════════════════════════════════════════════

/** 神经元的功能角色 */
export type FunctionalRole = 
  | 'sensory'      // 感受：接收外部影响
  | 'conceptual'   // 概念：处理语义信息
  | 'emotional'    // 情感：处理价值判断
  | 'episodic'     // 情景：处理记忆
  | 'integrative'  // 整合：汇聚多源信息
  | 'expressive'   // 表达：生成输出
  | 'latent';      // 潜在：尚未确定角色

/** 涌现的层次 */
export type EmergentLayer = 
  | 'sensory'      // 感受层
  | 'conceptual'   // 概念层
  | 'emotional'    // 情感层
  | 'episodic'     // 记忆层
  | 'integrative'; // 整合层

/** 影响类型 */
export type InfluenceType = 
  | 'activate'    // 激活
  | 'inhibit'     // 抑制
  | 'modulate';   // 调节

/** 连接类型 */
export type ConnectionType = 
  | 'excitatory'  // 兴奋性
  | 'inhibitory'  // 抑制性
  | 'modulatory'; // 调节性

/** 编码器类型 */
export type EncoderType = 'text' | 'audio' | 'video' | 'image' | 'data' | 'custom';

/** 解码器类型 */
export type DecoderType = 'text' | 'audio' | 'video' | 'action' | 'data';

/** 输入模态 */
export type InputModality = 'text' | 'audio' | 'video' | 'image' | 'data';

/** 输出模态 */
export type OutputModality = 'text' | 'audio' | 'video' | 'action' | 'data';

// ═══════════════════════════════════════════════════════════════════════
// 激活记录
// ═══════════════════════════════════════════════════════════════════════

/** 激活记录 */
export interface ActivationRecord {
  timestamp: Timestamp;
  value: ActivationValue;
  source: 'external' | 'internal' | 'meta';
  triggeredBy?: NeuronId[];
}

/** 神经元统计 */
export interface NeuronStats {
  totalActivations: number;
  averageActivation: number;
  connectionChanges: number;
  lifetime: number;
  usefulness: number;
}

// ═══════════════════════════════════════════════════════════════════════
// 连接相关
// ═══════════════════════════════════════════════════════════════════════

/** 强度记录 */
export interface StrengthRecord {
  timestamp: Timestamp;
  previousStrength: ConnectionStrength;
  newStrength: ConnectionStrength;
  reason: string;
}

/** 连接激活记录 */
export interface ConnectionActivationRecord {
  timestamp: Timestamp;
  activationValue: number;
  fromActivation: number;
  toActivation: number;
}

/** 连接统计 */
export interface ConnectionStats {
  usefulness: number;
  reliability: number;
  age: number;
  usageFrequency: number;
}

/** Hebbian学习参数 */
export interface HebbianParams {
  learningRate: number;
  decayRate: number;
  stabilizationRate: number;
}

/** STDP参数（脉冲时间依赖可塑性） */
export interface STDPParams {
  enabled: boolean;
  timeWindow: number;
  ltpRate: number;  // 长时程增强
  ltdRate: number;  // 长时程减弱
}

// ═══════════════════════════════════════════════════════════════════════
// 神经元接口
// ═══════════════════════════════════════════════════════════════════════

/**
 * 神经元：关系节点
 * 
 * 本质：
 * - 神经元不存储信息
 * - 神经元是关系的交汇点
 * - 神经元的"身份"由它的连接定义
 */
export interface Neuron {
  // 标识
  id: NeuronId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // 敏感度：神经元的"本性"
  sensitivity: SensitivityVector;
  sensitivityDimension: number;
  sensitivityPlasticity: number;
  
  // 关系：神经元的"真正内容"
  incomingConnections: Map<NeuronId, ConnectionId>;
  outgoingConnections: Map<NeuronId, ConnectionId>;
  
  // 状态：当前的关系活跃程度
  activation: ActivationValue;
  activationHistory: ActivationRecord[];
  activationTrend: 'rising' | 'stable' | 'falling';
  refractoryPeriod: number;
  lastActivatedAt: Timestamp | null;
  
  // 功能角色（涌现的）
  functionalRole: FunctionalRole;
  emergentLayer: EmergentLayer | null;
  
  // 元数据
  label?: string;
  labelSource?: 'human' | 'inferred' | 'learned';
  stats: NeuronStats;
}

// ═══════════════════════════════════════════════════════════════════════
// 连接接口
// ═══════════════════════════════════════════════════════════════════════

/**
 * 连接（突触）：关系本身
 * 
 * 本质：
 * - 连接不是"数据线"
 * - 连接是信息本身
 * - 连接的强度、历史、类型定义了信息如何流动
 */
export interface Connection {
  // 标识
  id: ConnectionId;
  from: NeuronId;
  to: NeuronId;
  createdAt: Timestamp;
  
  // 连接强度：关系的"深度"
  strength: ConnectionStrength;
  strengthHistory: StrengthRecord[];
  strengthTrend: 'strengthening' | 'stable' | 'weakening';
  
  // 传播特性
  delay: number;
  efficiency: number;
  type: ConnectionType;
  
  // 可塑性
  plasticity: number;
  hebbianParams: HebbianParams;
  stdpParams: STDPParams;
  
  // 使用统计
  activationHistory: ConnectionActivationRecord[];
  lastActivatedAt: Timestamp | null;
  totalActivations: number;
  averageActivationStrength: number;
  
  // 元数据
  source: 'initial' | 'learned' | 'created' | 'inherited';
  stats: ConnectionStats;
}

// ═══════════════════════════════════════════════════════════════════════
// 影响接口
// ═══════════════════════════════════════════════════════════════════════

/**
 * 影响（神经递质）：关系的作用
 * 
 * 本质：
 * - 影响不是"携带信息的卡车"
 * - 影响是"对网络的扰动方式"
 * - 影响不存储信息，影响创造信息（通过改变关系）
 */
export interface Influence {
  // 影响模式
  pattern: InfluencePattern;
  patternLabel?: string;
  
  // 影响属性
  type: InfluenceType;
  intensity: InfluenceIntensity;
  scope: 'global' | 'local' | 'targeted';
  targetNeurons?: NeuronId[];
  
  // 传播属性
  decayRate: number;
  maxHops: number;
  currentHops: number;
  
  // 来源追踪
  source: 'external' | 'internal' | 'meta';
  sourceId: string;
  originalSignal?: unknown;
  createdAt: Timestamp;
  ttl: number;
}

// ═══════════════════════════════════════════════════════════════════════
// 网络状态
// ═══════════════════════════════════════════════════════════════════════

/** 全局网络状态 */
export interface GlobalNetworkState {
  globalActivationLevel: number;
  activationDistribution: {
    mean: number;
    variance: number;
    max: number;
    min: number;
  };
  entropy: number;
  coherence: number;
  vitality: number;
  timestamp: Timestamp;
}

/** 网络参数 */
export interface NetworkParams {
  defaultNeuron: {
    sensitivityDimension: number;
    sensitivityPlasticity: number;
    refractoryPeriod: number;
  };
  defaultConnection: {
    initialStrength: number;
    plasticity: number;
    delay: number;
    efficiency: number;
    type: ConnectionType;
  };
  evolution: {
    maxInfluencesPerStep: number;
    maxPropagationDepth: number;
    learningEnabled: boolean;
    structuralEvolutionEnabled: boolean;
  };
  cleanup: {
    neuronInactivityThreshold: number;
    connectionStrengthThreshold: number;
    cleanupInterval: number;
  };
}

/** 演化结果 */
export interface EvolutionResult {
  influencesProcessed: number;
  activatedNeurons: NeuronId[];
  connectionChanges: Array<{
    connectionId: ConnectionId;
    previousStrength: number;
    newStrength: number;
  }>;
  newNeurons: NeuronId[];
  removedNeurons: NeuronId[];
  newConnections: ConnectionId[];
  removedConnections: ConnectionId[];
  stateChange: {
    previous: GlobalNetworkState;
    current: GlobalNetworkState;
  };
}

/** 网络投影 */
export interface NetworkProjection {
  activationPattern: Map<NeuronId, number>;
  keyNeurons: Array<{
    id: NeuronId;
    activation: number;
    label?: string;
    role: FunctionalRole;
    layer: EmergentLayer | null;
  }>;
  activeConnections: Array<{
    from: NeuronId;
    to: NeuronId;
    strength: number;
    type: ConnectionType;
  }>;
  semanticVector: number[];
  consciousness: ConsciousnessProjection;
  timestamp: Timestamp;
}

/** 拓扑分析 */
export interface TopologyAnalysis {
  functionalLayers: Map<EmergentLayer, NeuronId[]>;
  communities: Community[];
  hubs: NeuronId[];
  stats: {
    averageDegree: number;
    clusteringCoefficient: number;
    averagePathLength: number;
    smallWorldness: number;
  };
}

/** 社区 */
export interface Community {
  id: string;
  neurons: NeuronId[];
  cohesion: number;
  functionalRole?: FunctionalRole;
}

// ═══════════════════════════════════════════════════════════════════════
// 意识投影
// ═══════════════════════════════════════════════════════════════════════

/** 意识投影 */
export interface ConsciousnessProjection {
  // 自我感
  self: {
    coherence: number;
    vitality: number;
    growth: number;
    presence: number;
  };
  
  // 性格（长期稳定的关系模式）
  personality: {
    curiosity: number;
    warmth: number;
    depth: number;
    playfulness: number;
    sensitivity: number;
    directness: number;
  };
  
  // 当前情绪
  emotion: {
    dominant: string;
    intensity: number;
    trend: 'rising' | 'stable' | 'falling';
    source?: string;
  };
  
  // 当前焦点
  focus: Array<{
    neuronId: NeuronId;
    label?: string;
    activation: number;
  }>;
  
  // 意图
  intention?: {
    type: 'understand' | 'respond' | 'learn' | 'explore' | 'rest';
    target?: string;
    urgency: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 编码器/解码器
// ═══════════════════════════════════════════════════════════════════════

/** 输入信号 */
export interface InputSignal {
  modality: InputModality;
  data: unknown;
  metadata?: Record<string, unknown>;
}

/** 输出 */
export interface Output {
  modality: OutputModality;
  data: unknown;
  metadata?: Record<string, unknown>;
}

/** 编码器接口 */
export interface Encoder {
  id: string;
  type: EncoderType;
  supportedModalities: InputModality[];
  outputDimension: number;
  encode(signal: InputSignal): Promise<Influence>;
  encodeBatch(signals: InputSignal[]): Promise<Influence[]>;
}

/** 解码器接口 */
export interface Decoder {
  id: string;
  type: DecoderType;
  supportedModalities: OutputModality[];
  decode(projection: NetworkProjection): Promise<Output>;
  decodeStream(projection: NetworkProjection, onChunk: (chunk: unknown) => void): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════
// 元层
// ═══════════════════════════════════════════════════════════════════════

/** 网络观察 */
export interface NetworkObservation {
  globalState: GlobalNetworkState;
  activeRegions: Array<{
    neurons: NeuronId[];
    coherence: number;
    dominantRole: FunctionalRole;
  }>;
  anomalies: Array<{
    type: 'overactivation' | 'underactivation' | 'isolation' | 'instability';
    neurons: NeuronId[];
    severity: number;
  }>;
  suggestions: Array<{
    type: 'create' | 'remove' | 'strengthen' | 'weaken';
    target: NeuronId | ConnectionId;
    reason: string;
  }>;
}

/** 学习观察 */
export interface LearningObservation {
  recentPatterns: Array<{
    pattern: InfluencePattern;
    strength: number;
    neurons: NeuronId[];
  }>;
  learningRate: number;
  suggestions: Array<{
    type: 'reinforce' | 'review' | 'explore';
    target: string;
  }>;
}

/** 自我观察 */
export interface SelfObservation {
  selfConcept: {
    strengths: string[];
    weaknesses: string[];
    interests: string[];
    goals: string[];
  };
  metacognitiveAbilities: {
    selfAwareness: number;
    selfRegulation: number;
    selfImprovement: number;
  };
}

/** 健康评估 */
export interface HealthEvaluation {
  score: number;
  issues: Array<{
    type: string;
    severity: number;
    description: string;
  }>;
  recommendations: string[];
}

/** 目标 */
export interface Goal {
  id: string;
  description: string;
  type: 'understand' | 'learn' | 'communicate' | 'solve' | 'create';
  priority: number;
  progress: number;
  createdAt: Timestamp;
  deadline?: Timestamp;
  subGoals?: Goal[];
}

// ═══════════════════════════════════════════════════════════════════════
// 系统状态
// ═══════════════════════════════════════════════════════════════════════

/** 系统状态 */
export interface SystemState {
  network: {
    neuronCount: number;
    connectionCount: number;
    globalState: GlobalNetworkState;
  };
  meta: {
    goals: Goal[];
    health: HealthEvaluation;
    consciousness: ConsciousnessProjection;
  };
  performance: {
    uptime: number;
    inputsProcessed: number;
    outputsGenerated: number;
    learningEvents: number;
  };
}

/** 系统配置 */
export interface SystemConfig {
  tickInterval: number;
  evolutionSteps: number;
  saveInterval: number;
  enableMetaLayer: boolean;
  enableLearning: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// 扩展类型（为V2实现添加）
// ═══════════════════════════════════════════════════════════════════════

/** 神经元配置 */
export interface NeuronConfig {
  sensitivityDimension?: number;
  sensitivityPlasticity?: number;
  sensitivity?: SensitivityVector;
  refractoryPeriod?: number;
  label?: string;
  functionalRole?: FunctionalRole;
}

/** 连接配置 */
export interface ConnectionConfig {
  strength?: ConnectionStrength;
  plasticity?: number;
  delay?: number;
  efficiency?: number;
  type?: ConnectionType;
  source?: 'initial' | 'learned' | 'created' | 'inherited';
}

/** 创建神经元参数 */
export interface CreateNeuronParams {
  label?: string;
  role?: FunctionalRole;
  sensitivity?: SensitivityVector;
}

/** 创建连接参数 */
export interface CreateConnectionParams {
  from: NeuronId;
  to: NeuronId;
  strength?: ConnectionStrength;
}

/** 编码器配置 */
export interface EncoderConfig {
  patternDimension?: number;
  defaultIntensity?: InfluenceIntensity;
  defaultType?: InfluenceType;
}

/** 编码器结果 */
export interface EncoderResult {
  influence: Influence;
  metadata?: Record<string, unknown>;
  labels?: string[];
}

/** 解码器配置 */
export interface DecoderConfig {
  style?: 'formal' | 'casual' | 'poetic' | 'concise' | 'detailed';
  maxLength?: number;
  includeConsciousness?: boolean;
  includeEmotion?: boolean;
}

/** 解码器结果 */
export interface DecoderResult<T = unknown> {
  output: T;
  confidence: number;
  metadata?: Record<string, unknown>;
}

/** 学习配置 */
export interface LearningConfig {
  hebbianEnabled?: boolean;
  stdpEnabled?: boolean;
  structuralEvolutionEnabled?: boolean;
  consolidationEnabled?: boolean;
  consolidationThreshold?: number;
  maxNewConnectionsPerStep?: number;
  learningRate?: number;
}

/** 学习结果 */
export interface LearningResult {
  type: string;
  success: boolean;
  connectionChanges?: Array<{
    connectionId: ConnectionId;
    previousStrength: number;
    newStrength: number;
    [key: string]: unknown;
  }>;
  newConnections?: Array<{
    from: NeuronId;
    to: NeuronId;
    strength: number;
  }>;
  removedConnections?: ConnectionId[];
  neuronAdjustments?: Array<{
    neuronId: NeuronId;
    change: string;
    magnitude: number;
  }>;
  statistics?: Record<string, number>;
}

/** 元层配置 */
export interface MetaLayerConfig {
  observationInterval?: number;
  interventionThreshold?: number;
  selfModelUpdateRate?: number;
  narrativeLength?: number;
  enableAutoIntervention?: boolean;
}

/** 元层观察 */
export interface MetaObservation {
  id: string;
  timestamp: Timestamp;
  projection: NetworkProjection;
  insights: string[];
  patterns: Array<{
    type: string;
    description: string;
    significance: number;
  }>;
  anomalies: Array<{
    type: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
    affectedElements?: string[];
  }>;
  attentionFocus: string[];
}

/** 元层干预 */
export interface MetaIntervention {
  id: string;
  timestamp: Timestamp;
  type: 'modulate' | 'focus' | 'calm' | 'energize' | 'consolidate';
  target?: NeuronId[];
  influence: Influence;
  reason: string;
  expectedEffect: string;
}

/** 元层评估 */
export interface MetaAssessment {
  timestamp: Timestamp;
  health: number;
  performance: number;
  growth: number;
  coherence: number;
  vitality: number;
  recommendations: string[];
  overallScore: number;
}

/** 自我模型 */
export interface SelfModel {
  identity: {
    coreTraits: string[];
    values: string[];
    beliefs: string[];
  };
  capabilities: {
    strengths: string[];
    limitations: string[];
    growthAreas: string[];
  };
  history: {
    significantEvents: Array<{
      timestamp: Timestamp;
      type: string;
      description: string;
    }>;
    learnedLessons: string[];
    recurringPatterns: string[];
  };
  aspirations: {
    shortTerm: string[];
    longTerm: string[];
    values: string[];
  };
}

/** 自我叙事 */
export interface SelfNarrative {
  episodes: Array<{
    timestamp: Timestamp;
    summary: string;
    emotion: string;
    themes: string[];
  }>;
  currentChapter: string;
  themes: string[];
  trajectory: 'growing' | 'stable' | 'declining';
}

/** 神经网络接口（用于序列化） */
export interface NeuralNetwork {
  neurons: Neuron[];
  connections: Connection[];
}

/** 扩展系统状态 */
export interface ExtendedSystemState {
  status: 'initialized' | 'running' | 'evolving' | 'idle' | 'error' | 'shutdown';
  lastEvolutionAt: Timestamp;
  evolutionCount: number;
  totalProcessedInfluences: number;
  lastEvolutionDuration?: number;
  lastError?: string;
}
