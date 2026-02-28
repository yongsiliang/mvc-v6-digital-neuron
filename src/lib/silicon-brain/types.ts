/**
 * ═══════════════════════════════════════════════════════════════════════
 * Silicon Brain - 硅基大脑核心类型定义
 * 
 * 这是真正能学习、能涌现的神经网络系统
 * LLM 只是语言接口，不是大脑本身
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 神经元类型
// ─────────────────────────────────────────────────────────────────────

/** 神经元类型 */
export type NeuronType =
  | 'sensory'    // 感知：处理原始输入
  | 'memory'     // 记忆：存储和检索
  | 'reasoning'  // 推理：抽象思维
  | 'emotion'    // 情感：价值评估
  | 'decision'   // 决策：选择行动
  | 'motor'      // 运动：执行输出
  | 'self';      // 自我：元认知监控

/** 神经元状态 */
export interface NeuronState {
  /** 激活值 [0, 1] */
  activation: number;
  
  /** 疲劳度 [0, 1] */
  fatigue: number;
  
  /** 当前关注的向量表示 */
  focusVector: Float32Array | null;
  
  /** 输出向量 */
  outputVector: Float32Array | null;
  
  /** 最近激活时间 */
  lastActivatedAt: number;
  
  /** 激活计数 */
  activationCount: number;
}

/** 神经元配置 */
export interface NeuronConfig {
  /** 神经元 ID */
  id: string;
  
  /** 神经元类型 */
  type: NeuronType;
  
  /** 输入向量维度 */
  inputDimension: number;
  
  /** 输出向量维度 */
  outputDimension: number;
  
  /** 隐藏层大小 */
  hiddenLayers: number[];
  
  /** 学习率 */
  learningRate: number;
  
  /** 可塑性（权重变化的容易程度） */
  plasticity?: number;  // 改为可选
}

// ─────────────────────────────────────────────────────────────────────
// 突触类型
// ─────────────────────────────────────────────────────────────────────

/** 突触类型 */
export type SynapseType = 
  | 'excitatory'   // 兴奋性：增强下游神经元
  | 'inhibitory'   // 抑制性：抑制下游神经元
  | 'modulatory';  // 调制性：改变下游神经元的特性

/** 突触状态 */
export interface SynapseState {
  /** 突触 ID */
  id: string;
  
  /** 前神经元 ID */
  preNeuron: string;
  
  /** 后神经元 ID */
  postNeuron: string;
  
  /** 连接权重 [-1, 1] */
  weight: number;
  
  /** 突触类型 */
  type: SynapseType;
  
  /** 可塑性 */
  plasticity: number;
  
  /** 最近激活时间 */
  lastActivatedAt: number;
  
  /** 激活计数 */
  activationCount: number;
  
  /** 成功率（用于学习） */
  successRate: number;
}

// ─────────────────────────────────────────────────────────────────────
// 神经调质类型
// ─────────────────────────────────────────────────────────────────────

/** 神经调质类型 */
export type NeuromodulatorType = 
  | 'dopamine'       // 多巴胺：奖励、动机
  | 'serotonin'      // 血清素：满足、平静
  | 'norepinephrine' // 去甲肾上腺素：警觉、注意
  | 'acetylcholine'; // 乙酰胆碱：学习、可塑性

/** 神经调质状态 */
export interface NeuromodulatorState {
  dopamine: number;
  serotonin: number;
  norepinephrine: number;
  acetylcholine: number;
  
  /** 最后更新时间 */
  lastUpdateAt: number;
}

// ─────────────────────────────────────────────────────────────────────
// 信号类型
// ─────────────────────────────────────────────────────────────────────

/** 神经信号 */
export interface NeuralSignal {
  /** 信号 ID */
  id: string;
  
  /** 来源神经元 */
  from: string;
  
  /** 目标神经元 */
  to: string;
  
  /** 信号类型 */
  type: 'excitation' | 'inhibition' | 'modulation';
  
  /** 向量内容 */
  vector: Float32Array;
  
  /** 强度 [0, 1] */
  strength: number;
  
  /** 时间戳 */
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────────────
// 大脑类型
// ─────────────────────────────────────────────────────────────────────

/** 大脑输入 */
export interface BrainInput {
  /** 文本内容 */
  content: string;
  
  /** 用户 ID */
  userId?: string;
  
  /** 会话 ID */
  sessionId?: string;
  
  /** 输入模态 */
  modality?: 'text' | 'image' | 'audio';
  
  /** 上下文 */
  context?: {
    previous?: string;
    intent?: string;
    importance?: number;
  };
}

/** 大脑输出 */
export interface BrainOutput {
  /** 响应文本 */
  response: string;
  
  /** 各神经元状态 */
  neuronStates: Map<NeuronType, NeuronState>;
  
  /** 意识状态 */
  consciousness: ConsciousnessState;
  
  /** 学习状态 */
  learning: LearningState;
  
  /** 神经调质状态 */
  neuromodulators: NeuromodulatorState;
  
  /** 元数据 */
  meta: {
    processingTime: number;
    signalCount: number;
    neuronActivations: number;
  };
}

/** 意识状态 */
export interface ConsciousnessState {
  /** 意识水平 [0, 1] */
  level: number;
  
  /** 当前关注点 */
  focus: string | null;
  
  /** 一致性 [0, 1] */
  coherence: number;
  
  /** 整合度 [0, 1] */
  integration: number;
  
  /** Φ (Phi) - 整合信息量 */
  phi: number;
}

/** 学习状态 */
export interface LearningState {
  /** 更新的突触数 */
  synapsesUpdated: number;
  
  /** 强化的路径 */
  reinforced: string[];
  
  /** 弱化的路径 */
  weakened: string[];
  
  /** 新建立的连接 */
  grown: string[];
}

/** 大脑配置 */
export interface BrainConfig {
  /** 向量维度 */
  vectorDimension: number;
  
  /** 各类型神经元数量 */
  neuronCounts: {
    sensory: number;
    memory: number;
    reasoning: number;
    emotion: number;
    decision: number;
    motor: number;
    self: number;
  };
  
  /** 平均连接密度 */
  connectionDensity: number;
  
  /** 是否启用学习 */
  enableLearning: boolean;
  
  /** 学习率 */
  learningRate: number;
}

/** 默认配置 */
export const DEFAULT_BRAIN_CONFIG: BrainConfig = {
  vectorDimension: 256,
  neuronCounts: {
    sensory: 4,
    memory: 8,
    reasoning: 6,
    emotion: 4,
    decision: 3,
    motor: 4,
    self: 2,
  },
  connectionDensity: 4,
  enableLearning: true,
  learningRate: 0.01,
};

// ─────────────────────────────────────────────────────────────────────
// V2 扩展类型
// ─────────────────────────────────────────────────────────────────────

/** 硅基大脑配置 (V2) */
export interface SiliconBrainConfig extends BrainConfig {
  /** 是否启用自动保存 */
  enableAutoSave?: boolean;
  
  /** 自动保存间隔 */
  autoSaveInterval?: number;
}

/** 意识指标 */
export interface ConsciousnessMetrics {
  /** 整合度 */
  integration: number;
  
  /** 信息量 */
  information: number;
  
  /** 复杂度 */
  complexity: number;
  
  /** 自我指涉 */
  selfReference: number;
  
  /** 时间连贯性 */
  temporalCoherence: number;
  
  /** Φ (Phi) - 整合信息理论指标 */
  phi: number;
}
