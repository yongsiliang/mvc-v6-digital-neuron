/**
 * ═══════════════════════════════════════════════════════════════════════
 * Hebbian Network - Hebbian神经网络
 * 
 * 这是系统的"阴系统"
 * 
 * 核心理念：
 * - "一起激活的神经元，连接在一起"
 * - 分布式联想记忆
 * - 真正的突触可塑性
 * - 直觉式响应（激活扩散）
 * - 动态结构可塑性（新神经元生成、弱突触修剪）
 * 
 * 与阳系统（VSA+LLM）形成阴阳互塑
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * Hebbian神经元
 */
export interface HebbianNeuron {
  /** 唯一标识 */
  id: string;
  
  /** 标签（人类可读名称） */
  label: string;
  
  /** 激活值 [0, 1] */
  activation: number;
  
  /** 激活历史（最近N次） */
  activationHistory: number[];
  
  /** 偏好向量（这个神经元"敏感"什么模式） */
  preferenceVector: number[];
  
  /** 偏置（激活阈值） */
  bias: number;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后激活时间 */
  lastActivatedAt: number | null;
  
  /** 总激活次数 */
  totalActivations: number;
  
  /** 神经元类型 */
  type: 'sensory' | 'concept' | 'emotion' | 'abstract';
  
  /** 效用评分 */
  usefulness: number;
}

/**
 * Hebbian突触
 */
export interface HebbianSynapse {
  /** 唯一标识 */
  id: string;
  
  /** 源神经元ID */
  from: string;
  
  /** 目标神经元ID */
  to: string;
  
  /** 突触权重 [-1, 1]（正=兴奋，负=抑制） */
  weight: number;
  
  /** Hebbian学习率 */
  learningRate: number;
  
  /** 资格迹（Eligibility Trace，用于TD学习） */
  eligibilityTrace: number;
  
  /** 上次共同激活时间 */
  lastCoactivatedAt: number | null;
  
  /** 共同激活次数 */
  coactivationCount: number;
  
  /** 突触延迟（模拟真实神经延迟） */
  delay: number;
  
  /** 创建时间 */
  createdAt: number;
}

/**
 * 网络激活状态
 */
export interface NetworkActivationState {
  /** 神经元ID -> 激活值 */
  activations: Map<string, number>;
  
  /** 时间戳 */
  timestamp: number;
}

/**
 * 网络统计信息
 */
export interface NetworkStats {
  /** 神经元总数 */
  totalNeurons: number;
  
  /** 突触总数 */
  totalSynapses: number;
  
  /** 平均激活度 */
  averageActivation: number;
  
  /** 平均权重绝对值 */
  averageWeight: number;
  
  /** 高激活神经元数量 */
  highlyActiveNeurons: number;
  
  /** 强突触数量 */
  strongSynapses: number;
  
  /** 网络密度（突触数/最大可能突触数） */
  density: number;
}

/**
 * 网络配置
 */
export interface HebbianNetworkConfig {
  /** 神经元偏好向量维度 */
  preferenceDimension: number;
  
  /** 默认Hebbian学习率 */
  defaultLearningRate: number;
  
  /** 激活历史长度 */
  activationHistoryLength: number;
  
  /** 激活扩散步数 */
  spreadSteps: number;
  
  /** 激活扩散衰减率 */
  spreadDecay: number;
  
  /** 突触权重归一化目标 */
  weightNormTarget: number;
  
  /** 最小突触权重（低于此值被修剪） */
  minSynapseWeight: number;
  
  /** 最大突触数量 */
  maxSynapses: number;
  
  /** 神经元效用阈值（低于此值被标记修剪） */
  neuronUsefulnessThreshold: number;
}

const DEFAULT_CONFIG: HebbianNetworkConfig = {
  preferenceDimension: 128,
  defaultLearningRate: 0.01,
  activationHistoryLength: 20,
  spreadSteps: 5,           // 增加扩散步数：让激活传播更远
  spreadDecay: 0.7,         // 降低衰减率：让激活传播更强
  weightNormTarget: 1.0,
  minSynapseWeight: 0.05,
  maxSynapses: 10000,
  neuronUsefulnessThreshold: 0.1,
};

/**
 * 激活扩散结果
 */
export interface SpreadResult {
  /** 最终激活状态 */
  activations: Map<string, number>;
  
  /** 激活路径 */
  activationPaths: Array<{
    from: string;
    to: string;
    strength: number;
  }>;
  
  /** 激活传播步数 */
  steps: number;
}

/**
 * 学习结果
 */
export interface HebbianLearningResult {
  /** 更新的突触数量 */
  updatedSynapses: number;
  
  /** 创建的突触数量 */
  createdSynapses: number;
  
  /** 修剪的突触数量 */
  prunedSynapses: number;
  
  /** 权重变化统计 */
  weightChanges: {
    increased: number;
    decreased: number;
    averageChange: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// Hebbian Network 类
// ─────────────────────────────────────────────────────────────────────

/**
 * Hebbian神经网络
 * 
 * 实现"一起激活的神经元，连接在一起"的学习规则
 */
export class HebbianNetwork {
  private neurons: Map<string, HebbianNeuron>;
  private synapses: Map<string, HebbianSynapse>;
  private config: HebbianNetworkConfig;
  
  // 快速查找：神经元ID -> 出站突触ID列表
  private outgoingSynapses: Map<string, Set<string>>;
  // 快速查找：神经元ID -> 入站突触ID列表
  private incomingSynapses: Map<string, Set<string>>;
  
  // 统计
  private stats: NetworkStats = {
    totalNeurons: 0,
    totalSynapses: 0,
    averageActivation: 0,
    averageWeight: 0,
    highlyActiveNeurons: 0,
    strongSynapses: 0,
    density: 0,
  };
  
  // 单例
  private static instance: HebbianNetwork | null = null;
  
  private constructor(config: Partial<HebbianNetworkConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.neurons = new Map();
    this.synapses = new Map();
    this.outgoingSynapses = new Map();
    this.incomingSynapses = new Map();
    this.updateStats();
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<HebbianNetworkConfig>): HebbianNetwork {
    if (!HebbianNetwork.instance) {
      HebbianNetwork.instance = new HebbianNetwork(config);
    }
    return HebbianNetwork.instance;
  }
  
  /**
   * 重置网络
   */
  static reset(): void {
    HebbianNetwork.instance = null;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 神经元管理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 创建神经元
   */
  createNeuron(options: {
    id?: string;
    label?: string;
    preferenceVector?: number[];
    type?: HebbianNeuron['type'];
    bias?: number;
  }): HebbianNeuron {
    const id = options.id || uuidv4();
    
    // 如果已存在，返回现有的
    if (this.neurons.has(id)) {
      return this.neurons.get(id)!;
    }
    
    const neuron: HebbianNeuron = {
      id,
      label: options.label || `neuron-${id.slice(0, 8)}`,
      activation: 0,
      activationHistory: [],
      preferenceVector: options.preferenceVector || 
        this.generateRandomPreferenceVector(),
      bias: options.bias || 0.1,
      createdAt: Date.now(),
      lastActivatedAt: null,
      totalActivations: 0,
      type: options.type || 'concept',
      usefulness: 0.5,
    };
    
    this.neurons.set(id, neuron);
    this.outgoingSynapses.set(id, new Set());
    this.incomingSynapses.set(id, new Set());
    this.updateStats();
    
    return neuron;
  }
  
  /**
   * 获取神经元
   */
  getNeuron(id: string): HebbianNeuron | undefined {
    return this.neurons.get(id);
  }
  
  /**
   * 检查神经元是否存在
   */
  hasNeuron(id: string): boolean {
    return this.neurons.has(id);
  }
  
  /**
   * 获取所有神经元
   */
  getAllNeurons(): HebbianNeuron[] {
    return Array.from(this.neurons.values());
  }
  
  /**
   * 更新神经元偏好向量
   */
  updateNeuronPreference(
    neuronId: string, 
    newPreference: number[], 
    rate: number = 0.1
  ): void {
    const neuron = this.neurons.get(neuronId);
    if (!neuron) return;
    
    // preference = (1 - rate) * preference + rate * newPreference
    for (let i = 0; i < neuron.preferenceVector.length; i++) {
      neuron.preferenceVector[i] = 
        (1 - rate) * neuron.preferenceVector[i] + 
        rate * (newPreference[i] || 0);
    }
    
    // 归一化
    neuron.preferenceVector = this.normalizeVector(neuron.preferenceVector);
  }
  
  /**
   * 生成随机偏好向量
   */
  private generateRandomPreferenceVector(): number[] {
    const vector: number[] = [];
    for (let i = 0; i < this.config.preferenceDimension; i++) {
      vector.push((Math.random() - 0.5) * 2);  // [-1, 1]
    }
    return this.normalizeVector(vector);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 突触管理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 创建突触
   */
  createSynapse(options: {
    from: string;
    to: string;
    weight?: number;
    learningRate?: number;
  }): HebbianSynapse | null {
    // 检查神经元是否存在
    if (!this.neurons.has(options.from) || !this.neurons.has(options.to)) {
      return null;
    }
    
    // 检查是否已存在
    const existingId = this.getSynapseId(options.from, options.to);
    if (this.synapses.has(existingId)) {
      return this.synapses.get(existingId)!;
    }
    
    const synapse: HebbianSynapse = {
      id: existingId,
      from: options.from,
      to: options.to,
      weight: options.weight || 0.1,
      learningRate: options.learningRate || this.config.defaultLearningRate,
      eligibilityTrace: 0,
      lastCoactivatedAt: null,
      coactivationCount: 0,
      delay: 1,  // 默认1个时间步
      createdAt: Date.now(),
    };
    
    this.synapses.set(existingId, synapse);
    this.outgoingSynapses.get(options.from)!.add(existingId);
    this.incomingSynapses.get(options.to)!.add(existingId);
    this.updateStats();
    
    return synapse;
  }
  
  /**
   * 获取突触ID
   */
  private getSynapseId(from: string, to: string): string {
    return `${from}->${to}`;
  }
  
  /**
   * 获取突触
   */
  getSynapse(from: string, to: string): HebbianSynapse | undefined {
    return this.synapses.get(this.getSynapseId(from, to));
  }
  
  /**
   * 获取或创建突触
   */
  getOrCreateSynapse(from: string, to: string): HebbianSynapse {
    const existing = this.getSynapse(from, to);
    if (existing) return existing;
    
    return this.createSynapse({ from, to })!;
  }
  
  /**
   * 移除突触
   */
  removeSynapse(from: string, to: string): boolean {
    const id = this.getSynapseId(from, to);
    const synapse = this.synapses.get(id);
    if (!synapse) return false;
    
    this.synapses.delete(id);
    this.outgoingSynapses.get(from)?.delete(id);
    this.incomingSynapses.get(to)?.delete(id);
    this.updateStats();
    
    return true;
  }
  
  /**
   * 获取神经元的出站突触
   */
  getOutgoingSynapses(neuronId: string): HebbianSynapse[] {
    const ids = this.outgoingSynapses.get(neuronId);
    if (!ids) return [];
    return Array.from(ids).map(id => this.synapses.get(id)!).filter(Boolean);
  }
  
  /**
   * 获取神经元的入站突触
   */
  getIncomingSynapses(neuronId: string): HebbianSynapse[] {
    const ids = this.incomingSynapses.get(neuronId);
    if (!ids) return [];
    return Array.from(ids).map(id => this.synapses.get(id)!).filter(Boolean);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心方法：激活计算
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 设置神经元激活
   */
  setActivation(neuronId: string, activation: number): void {
    const neuron = this.neurons.get(neuronId);
    if (!neuron) return;
    
    // 限制在 [0, 1]
    neuron.activation = Math.max(0, Math.min(1, activation));
    
    // 更新历史
    neuron.activationHistory.push(neuron.activation);
    if (neuron.activationHistory.length > this.config.activationHistoryLength) {
      neuron.activationHistory.shift();
    }
    
    // 更新统计
    if (neuron.activation > 0.5) {
      neuron.totalActivations++;
      neuron.lastActivatedAt = Date.now();
      neuron.usefulness = Math.min(1, neuron.usefulness + 0.01);
    }
  }
  
  /**
   * 根据输入向量激活神经元
   * 
   * 计算输入向量与每个神经元偏好向量的相似度
   */
  activateByInput(inputVector: number[]): Map<string, number> {
    const activations = new Map<string, number>();
    
    // 先计算所有相似度，找到最大值用于归一化
    let maxSimilarity = 0;
    const similarities = new Map<string, number>();
    
    for (const [id, neuron] of this.neurons) {
      const similarity = this.cosineSimilarity(inputVector, neuron.preferenceVector);
      similarities.set(id, similarity);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }
    }
    
    // 使用相对激活：激活值 = (similarity / maxSimilarity) - bias
    // 这确保至少有一些神经元会被激活
    for (const [id, neuron] of this.neurons) {
      const similarity = similarities.get(id) || 0;
      // 相对激活 + 绝对激活的混合
      const relativeActivation = maxSimilarity > 0 ? similarity / maxSimilarity : 0;
      const absoluteActivation = (similarity + 1) / 2;  // 将 [-1,1] 映射到 [0,1]
      
      // 混合使用相对和绝对激活
      const activation = Math.max(0, 
        relativeActivation * 0.7 + absoluteActivation * 0.3 - neuron.bias * 0.5
      );
      
      this.setActivation(id, activation);
      activations.set(id, activation);
    }
    
    return activations;
  }
  
  /**
   * 激活扩散
   * 
   * 从当前激活的神经元向连接的神经元传播激活
   * 这是"直觉联想"的实现
   */
  spreadActivation(inputVector?: number[], steps?: number): SpreadResult {
    // 如果有输入向量，先激活
    if (inputVector) {
      this.activateByInput(inputVector);
    }
    
    const actualSteps = steps ?? this.config.spreadSteps;
    const activationPaths: SpreadResult['activationPaths'] = [];
    
    // 保存初始激活状态
    const initialActivations = new Map<string, number>();
    for (const [id, neuron] of this.neurons) {
      initialActivations.set(id, neuron.activation);
    }
    
    // 扩散激活
    for (let step = 0; step < actualSteps; step++) {
      const newActivations = new Map<string, number>();
      
      for (const [fromId, neuron] of this.neurons) {
        if (neuron.activation < 0.1) continue;  // 只有足够激活的神经元才传播
        
        // 获取出站突触
        const outgoing = this.getOutgoingSynapses(fromId);
        
        for (const synapse of outgoing) {
          const toNeuron = this.neurons.get(synapse.to);
          if (!toNeuron) continue;
          
          // 计算传播的激活强度
          const spreadActivation = neuron.activation * synapse.weight * this.config.spreadDecay;
          
          // 累加激活
          const currentActivation = newActivations.get(synapse.to) || 
                                    this.neurons.get(synapse.to)!.activation;
          const newActivation = Math.max(0, Math.min(1, currentActivation + spreadActivation));
          
          newActivations.set(synapse.to, newActivation);
          
          // 记录路径
          if (Math.abs(spreadActivation) > 0.01) {
            activationPaths.push({
              from: fromId,
              to: synapse.to,
              strength: spreadActivation,
            });
          }
        }
      }
      
      // 应用新激活
      for (const [id, activation] of newActivations) {
        this.setActivation(id, activation);
      }
    }
    
    // 收集最终激活状态
    const finalActivations = new Map<string, number>();
    for (const [id, neuron] of this.neurons) {
      finalActivations.set(id, neuron.activation);
    }
    
    return {
      activations: finalActivations,
      activationPaths,
      steps: actualSteps,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心方法：Hebbian学习
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 应用Hebbian学习
   * 
   * "一起激活的神经元，连接在一起"
   * Δw = η * pre * post
   */
  applyHebbianLearning(): HebbianLearningResult {
    const result: HebbianLearningResult = {
      updatedSynapses: 0,
      createdSynapses: 0,
      prunedSynapses: 0,
      weightChanges: {
        increased: 0,
        decreased: 0,
        averageChange: 0,
      },
    };
    
    const totalChanges: number[] = [];
    
    // 找出当前共同激活的神经元对
    const coactivatedPairs: Array<[string, string, number, number]> = [];
    
    for (const [id1, n1] of this.neurons) {
      if (n1.activation < 0.3) continue;  // 只考虑足够激活的神经元
      
      for (const [id2, n2] of this.neurons) {
        if (id1 === id2) continue;
        if (n2.activation < 0.3) continue;
        
        coactivatedPairs.push([id1, id2, n1.activation, n2.activation]);
      }
    }
    
    // 对每对应用Hebbian规则
    for (const [fromId, toId, preActivation, postActivation] of coactivatedPairs) {
      const synapse = this.getOrCreateSynapse(fromId, toId);
      
      // Hebbian学习规则：Δw = η * pre * post
      const deltaW = synapse.learningRate * preActivation * postActivation;
      const oldWeight = synapse.weight;
      synapse.weight += deltaW;
      
      // 归一化到 [-1, 1]
      synapse.weight = Math.max(-1, Math.min(1, synapse.weight));
      
      // 更新资格迹
      synapse.eligibilityTrace = preActivation * postActivation;
      synapse.lastCoactivatedAt = Date.now();
      synapse.coactivationCount++;
      
      result.updatedSynapses++;
      totalChanges.push(Math.abs(synapse.weight - oldWeight));
      
      if (synapse.weight > oldWeight) {
        result.weightChanges.increased++;
      } else {
        result.weightChanges.decreased++;
      }
    }
    
    // 应用反Hebbian（未共同激活的连接减弱）
    for (const [id, synapse] of this.synapses) {
      const fromNeuron = this.neurons.get(synapse.from);
      const toNeuron = this.neurons.get(synapse.to);
      
      if (!fromNeuron || !toNeuron) continue;
      
      // 如果两个神经元都低激活，突触权重衰减
      if (fromNeuron.activation < 0.2 && toNeuron.activation < 0.2) {
        const decay = 0.001;  // 小的衰减
        const oldWeight = synapse.weight;
        
        if (synapse.weight > 0) {
          synapse.weight -= decay;
        } else {
          synapse.weight += decay;  // 保持符号
        }
        
        totalChanges.push(Math.abs(synapse.weight - oldWeight));
      }
    }
    
    // 修剪弱突触
    const toPrune: string[] = [];
    for (const [id, synapse] of this.synapses) {
      if (Math.abs(synapse.weight) < this.config.minSynapseWeight) {
        toPrune.push(id);
      }
    }
    
    for (const id of toPrune) {
      const parts = id.split('->');
      this.removeSynapse(parts[0], parts[1]);
      result.prunedSynapses++;
    }
    
    // 计算平均变化
    result.weightChanges.averageChange = totalChanges.length > 0
      ? totalChanges.reduce((a, b) => a + b, 0) / totalChanges.length
      : 0;
    
    this.updateStats();
    return result;
  }
  
  /**
   * 应用Oja规则（带权重归一化的Hebbian学习）
   * 
   * Δw = η * pre * (post - w * pre)
   * 防止权重爆炸
   */
  applyOjaLearning(): HebbianLearningResult {
    const result: HebbianLearningResult = {
      updatedSynapses: 0,
      createdSynapses: 0,
      prunedSynapses: 0,
      weightChanges: {
        increased: 0,
        decreased: 0,
        averageChange: 0,
      },
    };
    
    const totalChanges: number[] = [];
    
    for (const [fromId, fromNeuron] of this.neurons) {
      if (fromNeuron.activation < 0.3) continue;
      
      const outgoing = this.getOutgoingSynapses(fromId);
      
      for (const synapse of outgoing) {
        const toNeuron = this.neurons.get(synapse.to);
        if (!toNeuron) continue;
        
        const pre = fromNeuron.activation;
        const post = toNeuron.activation;
        
        // Oja规则：Δw = η * pre * (post - w * pre)
        const deltaW = synapse.learningRate * pre * (post - synapse.weight * pre);
        const oldWeight = synapse.weight;
        synapse.weight += deltaW;
        
        // 限制范围
        synapse.weight = Math.max(-1, Math.min(1, synapse.weight));
        
        result.updatedSynapses++;
        totalChanges.push(Math.abs(synapse.weight - oldWeight));
        
        if (synapse.weight > oldWeight) {
          result.weightChanges.increased++;
        } else {
          result.weightChanges.decreased++;
        }
      }
    }
    
    result.weightChanges.averageChange = totalChanges.length > 0
      ? totalChanges.reduce((a, b) => a + b, 0) / totalChanges.length
      : 0;
    
    this.updateStats();
    return result;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心方法：结构可塑性
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 应用结构可塑性
   * 
   * - 高惊讶度时生成新神经元
   * - 弱连接被修剪
   * - 低效用神经元被标记
   */
  applyStructuralPlasticity(surpriseLevel: number): {
    newNeurons: HebbianNeuron[];
    prunedSynapses: number;
    markedNeurons: string[];
  } {
    const result = {
      newNeurons: [] as HebbianNeuron[],
      prunedSynapses: 0,
      markedNeurons: [] as string[],
    };
    
    // 1. 高惊讶度时生成新神经元
    if (surpriseLevel > 0.7 && this.neurons.size < 1000) {
      // 找到高激活的神经元，创建一个新神经元表示它们的组合
      const highlyActive = Array.from(this.neurons.values())
        .filter(n => n.activation > 0.5)
        .slice(0, 3);
      
      if (highlyActive.length >= 2) {
        // 新神经元的偏好向量是高激活神经元的加权平均
        const newPreference: number[] = new Array(this.config.preferenceDimension).fill(0);
        let totalActivation = 0;
        
        for (const neuron of highlyActive) {
          const weight = neuron.activation;
          for (let i = 0; i < neuron.preferenceVector.length; i++) {
            newPreference[i] += weight * neuron.preferenceVector[i];
          }
          totalActivation += weight;
        }
        
        // 归一化
        for (let i = 0; i < newPreference.length; i++) {
          newPreference[i] /= totalActivation;
        }
        
        const newNeuron = this.createNeuron({
          label: `composite-${Date.now()}`,
          preferenceVector: this.normalizeVector(newPreference),
          type: 'abstract',
        });
        
        // 创建从高激活神经元到新神经元的连接
        for (const neuron of highlyActive) {
          this.createSynapse({
            from: neuron.id,
            to: newNeuron.id,
            weight: 0.3,
          });
        }
        
        result.newNeurons.push(newNeuron);
      }
    }
    
    // 2. 修剪弱突触
    for (const [id, synapse] of this.synapses) {
      if (Math.abs(synapse.weight) < this.config.minSynapseWeight) {
        const parts = id.split('->');
        this.removeSynapse(parts[0], parts[1]);
        result.prunedSynapses++;
      }
    }
    
    // 3. 标记低效用神经元
    for (const [id, neuron] of this.neurons) {
      // 效用随时间衰减
      neuron.usefulness *= 0.999;
      
      if (neuron.usefulness < this.config.neuronUsefulnessThreshold) {
        result.markedNeurons.push(id);
      }
    }
    
    this.updateStats();
    return result;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 辅助方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 更新统计信息
   */
  private updateStats(): void {
    let totalActivation = 0;
    let highActivationCount = 0;
    
    for (const neuron of this.neurons.values()) {
      totalActivation += neuron.activation;
      if (neuron.activation > 0.5) highActivationCount++;
    }
    
    let totalWeight = 0;
    let strongSynapseCount = 0;
    
    for (const synapse of this.synapses.values()) {
      totalWeight += Math.abs(synapse.weight);
      if (Math.abs(synapse.weight) > 0.5) strongSynapseCount++;
    }
    
    const maxPossibleSynapses = this.neurons.size * (this.neurons.size - 1);
    
    this.stats = {
      totalNeurons: this.neurons.size,
      totalSynapses: this.synapses.size,
      averageActivation: this.neurons.size > 0 ? totalActivation / this.neurons.size : 0,
      averageWeight: this.synapses.size > 0 ? totalWeight / this.synapses.size : 0,
      highlyActiveNeurons: highActivationCount,
      strongSynapses: strongSynapseCount,
      density: maxPossibleSynapses > 0 ? this.synapses.size / maxPossibleSynapses : 0,
    };
  }
  
  /**
   * 计算余弦相似度
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * 归一化向量
   */
  private normalizeVector(v: number[]): number[] {
    const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    if (norm === 0) return v;
    return v.map(x => x / norm);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态访问
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取统计信息
   */
  getStats(): NetworkStats {
    return { ...this.stats };
  }
  
  /**
   * 获取平均激活度
   */
  getAverageActivation(): number {
    return this.stats.averageActivation;
  }
  
  /**
   * 获取高激活神经元
   */
  getHighlyActiveNeurons(threshold: number = 0.5): HebbianNeuron[] {
    return Array.from(this.neurons.values()).filter(n => n.activation > threshold);
  }
  
  /**
   * 获取网络状态快照
   */
  getNetworkState(): {
    neurons: Array<{ id: string; activation: number; label: string }>;
    synapses: Array<{ from: string; to: string; weight: number }>;
    stats: NetworkStats;
  } {
    return {
      neurons: Array.from(this.neurons.values()).map(n => ({
        id: n.id,
        activation: n.activation,
        label: n.label,
      })),
      synapses: Array.from(this.synapses.values()).map(s => ({
        from: s.from,
        to: s.to,
        weight: s.weight,
      })),
      stats: this.getStats(),
    };
  }
  
  /**
   * 重置激活状态
   */
  resetActivations(): void {
    for (const neuron of this.neurons.values()) {
      neuron.activation = 0;
      neuron.activationHistory = [];
    }
  }
  
  /**
   * 清空网络
   */
  clear(): void {
    this.neurons.clear();
    this.synapses.clear();
    this.outgoingSynapses.clear();
    this.incomingSynapses.clear();
    this.updateStats();
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出便捷函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 获取Hebbian网络实例
 */
export function getHebbianNetwork(config?: Partial<HebbianNetworkConfig>): HebbianNetwork {
  return HebbianNetwork.getInstance(config);
}

/**
 * 重置Hebbian网络
 */
export function resetHebbianNetwork(): void {
  HebbianNetwork.reset();
}
