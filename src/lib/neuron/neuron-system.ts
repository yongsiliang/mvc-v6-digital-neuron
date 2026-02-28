/**
 * 神经元系统
 * Neuron System
 * 
 * 核心概念：神经元 = 功能单元
 * 
 * 神经元是处理信息的基本单元，不是整个模型。
 * 每个神经元有：
 * - 接受域：对什么类型的信息敏感
 * - 激活阈值：多强的信号才能激活
 * - 不应期：发放后需要休息
 * - 连接：通过突触与其他神经元连接
 * 
 * 类比人脑：
 * - 感觉神经元：接收外部信息
 * - 概念神经元：存储抽象概念
 * - 记忆神经元：存储经历片段
 * - 功能神经元：执行特定处理
 * - 运动神经元：生成输出
 */

import type { Neurotransmitter, NeurotransmitterType } from './neurotransmitter';

/**
 * 神经元类型
 * 
 * 类比人脑不同功能区
 */
export enum NeuronType {
  // 感觉神经元（输入层）- 接收外部信息
  SENSORY_TEXT = 'sensory_text',       // 文本感受器
  SENSORY_EMOTION = 'sensory_emotion', // 情感感受器
  SENSORY_INTENT = 'sensory_intent',   // 意图感受器
  
  // 概念神经元（中间层）- 存储知识
  CONCEPT = 'concept',         // 抽象概念（"快乐"、"压力"、"成长"）
  ENTITY = 'entity',           // 具体实体（"用户"、"工作"、"爱好"）
  EPISODE = 'episode',         // 经历片段（"上次聊到..."）
  PATTERN = 'pattern',         // 发现的模式（"用户周末容易低落"）
  
  // 功能神经元（中间层）- 处理信息
  REASONING = 'reasoning',     // 推理
  ASSOCIATION = 'association', // 联想
  ATTENTION = 'attention',     // 注意力控制
  EMOTION_PROCESS = 'emotion_process', // 情感处理
  
  // 运动神经元（输出层）- 生成输出
  MOTOR_RESPONSE = 'motor_response', // 生成响应
  MOTOR_ACTION = 'motor_action',     // 执行动作
  
  // 调节神经元
  MODULATOR = 'modulator',     // 调节网络状态
  
  // 特殊神经元
  CONSCIOUSNESS = 'consciousness', // 意识核心
  SELF = 'self',                   // 自我表征
}

/**
 * 神经元状态
 */
export enum NeuronState {
  IDLE = 'idle',           // 静息态
  RECEIVING = 'receiving', // 接收中
  INTEGRATING = 'integrating', // 整合中
  FIRING = 'firing',       // 发放中
  REFRACTORY = 'refractory', // 不应期
}

/**
 * 突触引用（轻量级，用于神经元存储连接）
 */
export interface SynapseRef {
  /** 突触ID */
  id: string;
  /** 目标神经元ID */
  targetId: string;
  /** 权重（缓存，实际值在突触管理器中） */
  weight: number;
}

/**
 * 神经元接口
 */
export interface Neuron {
  /** 唯一标识 */
  id: string;
  
  /** 类型 */
  type: NeuronType;
  
  /** 标签/名称 */
  label: string;
  
  /** 接受域向量：这个神经元对什么"敏感" */
  receptiveField: number[];
  
  /** 接受域半径：敏感度范围 [0, 1] */
  receptiveRadius: number;
  
  /** 当前状态 */
  state: NeuronState;
  
  /** 当前激活值 [0, 1] */
  activation: number;
  
  /** 激活阈值：超过此值才"发放" */
  threshold: number;
  
  /** 不应期：发放后需要休息的时间（毫秒） */
  refractoryPeriod: number;
  
  /** 上次发放时间 */
  lastFired: number;
  
  /** 累积的待处理神经递质 */
  pendingTransmitters: Neurotransmitter[];
  
  /** 输出突触引用 */
  outputs: SynapseRef[];
  
  /** 输入突触引用 */
  inputs: SynapseRef[];
  
  /** 元数据 */
  metadata: NeuronMetadata;
}

/**
 * 神经元元数据
 */
export interface NeuronMetadata {
  /** 创建时间 */
  createdAt: number;
  
  /** 发放次数 */
  fireCount: number;
  
  /** 总激活量 */
  totalActivation: number;
  
  /** 重要性 [0, 1] */
  importance: number;
  
  /** 最后激活时间 */
  lastActivated: number;
  
  /** 来源（如何创建的） */
  source: 'seed' | 'learned' | 'imported' | 'evolved';
  
  /** 标签 */
  tags: string[];
  
  /** 额外属性 */
  extra?: Record<string, unknown>;
}

/**
 * 神经元行为配置
 */
export interface NeuronConfig {
  /** 默认阈值 */
  defaultThreshold: number;
  
  /** 默认不应期（毫秒） */
  defaultRefractoryPeriod: number;
  
  /** 默认接受域半径 */
  defaultReceptiveRadius: number;
  
  /** 激活衰减率 */
  activationDecay: number;
  
  /** 最大待处理递质数 */
  maxPendingTransmitters: number;
}

const DEFAULT_CONFIG: NeuronConfig = {
  defaultThreshold: 0.5,
  defaultRefractoryPeriod: 100, // 100ms
  defaultReceptiveRadius: 0.3,
  activationDecay: 0.1,
  maxPendingTransmitters: 10,
};

/**
 * 神经元行为
 * 
 * 定义神经元的核心行为：接收、整合、发放
 */
export class NeuronBehavior {
  private config: NeuronConfig;
  
  constructor(config: Partial<NeuronConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * 接收神经递质
   * 
   * 类比：突触后膜接收神经递质
   * 只有匹配接受域的递质才会被接收
   */
  receiveTransmitter(
    neuron: Neuron,
    transmitter: Neurotransmitter
  ): { accepted: boolean; matchScore: number } {
    // 1. 检查是否在不应期
    const timeSinceLastFire = Date.now() - neuron.lastFired;
    if (timeSinceLastFire < neuron.refractoryPeriod) {
      return { accepted: false, matchScore: 0 };
    }
    
    // 2. 计算匹配度（递质是否"命中"接受域）
    const matchScore = this.calculateMatch(
      neuron.receptiveField,
      transmitter.vector,
      neuron.receptiveRadius
    );
    
    // 3. 匹配度不够，不接收
    if (matchScore <= 0) {
      return { accepted: false, matchScore: 0 };
    }
    
    // 4. 添加到待处理队列
    if (neuron.pendingTransmitters.length < this.config.maxPendingTransmitters) {
      neuron.pendingTransmitters.push(transmitter);
      neuron.state = NeuronState.RECEIVING;
      return { accepted: true, matchScore };
    }
    
    // 5. 队列满了，替换最弱的
    let minIntensity = transmitter.intensity;
    let minIndex = -1;
    for (let i = 0; i < neuron.pendingTransmitters.length; i++) {
      if (neuron.pendingTransmitters[i].intensity < minIntensity) {
        minIntensity = neuron.pendingTransmitters[i].intensity;
        minIndex = i;
      }
    }
    
    if (minIndex >= 0) {
      neuron.pendingTransmitters[minIndex] = transmitter;
      return { accepted: true, matchScore };
    }
    
    return { accepted: false, matchScore };
  }
  
  /**
   * 整合输入信号
   * 
   * 类比：神经元整合所有输入
   * 使用时间-空间整合机制
   */
  integrate(neuron: Neuron): void {
    if (neuron.pendingTransmitters.length === 0) {
      // 衰减
      neuron.activation *= (1 - this.config.activationDecay);
      if (neuron.activation < 0.01) {
        neuron.activation = 0;
        neuron.state = NeuronState.IDLE;
      }
      return;
    }
    
    neuron.state = NeuronState.INTEGRATING;
    
    // 空间整合：累加所有输入
    let totalInput = 0;
    for (const transmitter of neuron.pendingTransmitters) {
      const matchScore = this.calculateMatch(
        neuron.receptiveField,
        transmitter.vector,
        neuron.receptiveRadius
      );
      totalInput += matchScore * transmitter.intensity;
    }
    
    // 时间整合：考虑历史激活
    const timeSinceLastFire = Date.now() - neuron.lastFired;
    const temporalFactor = Math.min(1, timeSinceLastFire / 1000); // 1秒内逐渐恢复
    
    // 更新激活值
    neuron.activation += totalInput * temporalFactor;
    neuron.activation = Math.min(1, neuron.activation); // 上限
    
    neuron.metadata.totalActivation += totalInput;
    neuron.metadata.lastActivated = Date.now();
  }
  
  /**
   * 检查是否应该"发放"
   */
  shouldFire(neuron: Neuron): boolean {
    // 条件：激活值超过阈值，且不在不应期
    if (neuron.activation < neuron.threshold) {
      return false;
    }
    
    const timeSinceLastFire = Date.now() - neuron.lastFired;
    if (timeSinceLastFire < neuron.refractoryPeriod) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 发放：产生新的神经递质
   * 
   * 类比：神经元发放动作电位
   */
  fire(
    neuron: Neuron,
    outputType: NeurotransmitterType
  ): { transmitter: Neurotransmitter; clearedTransmitters: Neurotransmitter[] } | null {
    if (!this.shouldFire(neuron)) {
      return null;
    }
    
    neuron.state = NeuronState.FIRING;
    
    // 聚合输入信息
    const aggregatedVector = this.aggregateInputs(neuron.pendingTransmitters);
    const aggregatedValence = this.aggregateValence(neuron.pendingTransmitters);
    const aggregatedContent = neuron.pendingTransmitters
      .map(t => t.content)
      .filter(Boolean)
      .slice(0, 3)
      .join(' | ');
    
    // 保存要清除的递质
    const clearedTransmitters = [...neuron.pendingTransmitters];
    
    // 重置状态
    neuron.lastFired = Date.now();
    neuron.activation = 0;
    neuron.pendingTransmitters = [];
    neuron.metadata.fireCount++;
    neuron.state = NeuronState.REFRACTORY;
    
    // 产生输出递质
    const transmitter: Neurotransmitter = {
      id: `nt-${neuron.id}-${Date.now()}`,
      type: outputType,
      vector: aggregatedVector,
      content: aggregatedContent,
      valence: aggregatedValence,
      intensity: neuron.threshold, // 输出强度等于阈值
      sourceNeuron: neuron.id,
      timestamp: Date.now(),
      decayRate: 0.02,
    };
    
    return { transmitter, clearedTransmitters };
  }
  
  /**
   * 进入静息态
   */
  rest(neuron: Neuron): void {
    const timeSinceLastFire = Date.now() - neuron.lastFired;
    if (timeSinceLastFire > neuron.refractoryPeriod && neuron.activation < 0.01) {
      neuron.state = NeuronState.IDLE;
    }
  }
  
  // ==================== 私有方法 ====================
  
  /**
   * 计算匹配度
   * 
   * 使用余弦相似度，考虑接受域半径
   */
  private calculateMatch(
    receptiveField: number[],
    vector: number[],
    radius: number
  ): number {
    // 维度检查
    if (receptiveField.length !== vector.length) {
      // 尝试对齐
      const minLen = Math.min(receptiveField.length, vector.length);
      if (minLen === 0) return 0;
      return this.calculateMatch(
        receptiveField.slice(0, minLen),
        vector.slice(0, minLen),
        radius
      );
    }
    
    // 余弦相似度
    const similarity = this.cosineSimilarity(receptiveField, vector);
    
    // 在接受域范围内才有激活
    // 接受域半径越大，越容易匹配
    const threshold = 1 - radius;
    
    if (similarity < threshold) {
      return 0;
    }
    
    // 线性映射：threshold → 0, 1 → 1
    return (similarity - threshold) / radius;
  }
  
  /**
   * 余弦相似度
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * 聚合输入向量
   */
  private aggregateInputs(transmitters: Neurotransmitter[]): number[] {
    if (transmitters.length === 0) return [];
    if (transmitters.length === 1) return [...transmitters[0].vector];
    
    // 找到最长维度
    const maxDim = Math.max(...transmitters.map(t => t.vector.length));
    
    // 加权平均
    const totalIntensity = transmitters.reduce((sum, t) => sum + t.intensity, 0);
    const aggregated: number[] = new Array(maxDim).fill(0);
    
    for (const t of transmitters) {
      const weight = t.intensity / totalIntensity;
      for (let i = 0; i < t.vector.length; i++) {
        aggregated[i] += t.vector[i] * weight;
      }
    }
    
    // 归一化
    const norm = Math.sqrt(aggregated.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < aggregated.length; i++) {
        aggregated[i] /= norm;
      }
    }
    
    return aggregated;
  }
  
  /**
   * 聚合情感值
   */
  private aggregateValence(transmitters: Neurotransmitter[]): number {
    if (transmitters.length === 0) return 0;
    
    const totalIntensity = transmitters.reduce((sum, t) => sum + t.intensity, 0);
    if (totalIntensity === 0) return 0;
    
    return transmitters.reduce(
      (sum, t) => sum + t.valence * t.intensity, 0
    ) / totalIntensity;
  }
}

/**
 * 神经元工厂
 * 
 * 创建不同类型的神经元
 */
export class NeuronFactory {
  private idCounter: number = 0;
  private behavior: NeuronBehavior;
  
  constructor(config: Partial<NeuronConfig> = {}) {
    this.behavior = new NeuronBehavior(config);
  }
  
  /**
   * 生成唯一ID
   */
  private generateId(type: NeuronType): string {
    return `neuron-${type}-${Date.now()}-${++this.idCounter}`;
  }
  
  /**
   * 创建基础神经元
   */
  createNeuron(
    type: NeuronType,
    receptiveField: number[],
    options: {
      label?: string;
      threshold?: number;
      refractoryPeriod?: number;
      receptiveRadius?: number;
      importance?: number;
      source?: NeuronMetadata['source'];
      tags?: string[];
      extra?: Record<string, unknown>;
    } = {}
  ): Neuron {
    return {
      id: this.generateId(type),
      type,
      label: options.label || `${type}-${this.idCounter}`,
      receptiveField,
      receptiveRadius: options.receptiveRadius ?? 0.3,
      state: NeuronState.IDLE,
      activation: 0,
      threshold: options.threshold ?? 0.5,
      refractoryPeriod: options.refractoryPeriod ?? 100,
      lastFired: 0,
      pendingTransmitters: [],
      outputs: [],
      inputs: [],
      metadata: {
        createdAt: Date.now(),
        fireCount: 0,
        totalActivation: 0,
        importance: options.importance ?? 0.5,
        lastActivated: 0,
        source: options.source ?? 'seed',
        tags: options.tags || [],
      },
    };
  }
  
  /**
   * 创建感觉神经元
   */
  createSensoryNeuron(
    sensoryType: 'text' | 'emotion' | 'intent',
    receptiveField: number[],
    label?: string
  ): Neuron {
    const typeMap: Record<string, NeuronType> = {
      text: NeuronType.SENSORY_TEXT,
      emotion: NeuronType.SENSORY_EMOTION,
      intent: NeuronType.SENSORY_INTENT,
    };
    
    return this.createNeuron(typeMap[sensoryType], receptiveField, {
      label: label || `${sensoryType}_sensor`,
      threshold: 0.3, // 感觉神经元阈值较低，容易激活
      refractoryPeriod: 50, // 快速响应
      receptiveRadius: 0.5, // 接受域较大
      importance: 0.8,
      tags: ['sensory', sensoryType],
    });
  }
  
  /**
   * 创建概念神经元
   */
  createConceptNeuron(
    concept: string,
    vector: number[],
    importance: number = 0.5
  ): Neuron {
    return this.createNeuron(NeuronType.CONCEPT, vector, {
      label: concept,
      threshold: 0.5,
      refractoryPeriod: 100,
      receptiveRadius: 0.25, // 概念神经元接受域较小，更精确
      importance,
      source: 'learned',
      tags: ['concept', concept],
    });
  }
  
  /**
   * 创建记忆神经元
   */
  createMemoryNeuron(
    content: string,
    vector: number[],
    emotionWeight: number
  ): Neuron {
    return this.createNeuron(NeuronType.EPISODE, vector, {
      label: content.slice(0, 50),
      threshold: 0.4,
      refractoryPeriod: 200, // 记忆神经元不应期较长
      receptiveRadius: 0.3,
      importance: 0.5 + Math.abs(emotionWeight) * 0.3, // 情感强的更重要
      source: 'learned',
      tags: ['memory', 'episode'],
      extra: { emotionWeight },
    });
  }
  
  /**
   * 创建功能神经元
   */
  createFunctionNeuron(
    functionType: 'reasoning' | 'association' | 'attention' | 'emotion',
    receptiveField: number[]
  ): Neuron {
    const typeMap: Record<string, NeuronType> = {
      reasoning: NeuronType.REASONING,
      association: NeuronType.ASSOCIATION,
      attention: NeuronType.ATTENTION,
      emotion: NeuronType.EMOTION_PROCESS,
    };
    
    return this.createNeuron(typeMap[functionType], receptiveField, {
      label: `${functionType}_processor`,
      threshold: 0.6, // 功能神经元阈值较高
      refractoryPeriod: 150,
      receptiveRadius: 0.4,
      importance: 0.7,
      tags: ['function', functionType],
    });
  }
  
  /**
   * 创建运动神经元
   */
  createMotorNeuron(
    motorType: 'response' | 'action',
    receptiveField: number[]
  ): Neuron {
    const typeMap: Record<string, NeuronType> = {
      response: NeuronType.MOTOR_RESPONSE,
      action: NeuronType.MOTOR_ACTION,
    };
    
    return this.createNeuron(typeMap[motorType], receptiveField, {
      label: `${motorType}_motor`,
      threshold: 0.7, // 运动神经元阈值高，确保输出质量
      refractoryPeriod: 300, // 输出后休息较长
      receptiveRadius: 0.35,
      importance: 0.6,
      tags: ['motor', motorType],
    });
  }
  
  /**
   * 获取行为管理器
   */
  getBehavior(): NeuronBehavior {
    return this.behavior;
  }
}

// ==================== 单例管理 ====================

let globalFactory: NeuronFactory | null = null;

/**
 * 获取全局神经元工厂
 */
export function getNeuronFactory(): NeuronFactory {
  if (!globalFactory) {
    globalFactory = new NeuronFactory();
  }
  return globalFactory;
}
