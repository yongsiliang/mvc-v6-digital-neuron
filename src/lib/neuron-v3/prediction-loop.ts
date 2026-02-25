/**
 * ═══════════════════════════════════════════════════════════════════════
 * 预测循环 - Prediction Loop
 * 
 * 核心机制：
 * 1. 预测阶段：系统预测即将发生的输入
 * 2. 处理阶段：接收实际输入，激活神经元
 * 3. 误差阶段：比较预测与实际，计算预测误差
 * 4. 学习阶段：基于误差更新神经元和连接
 * 
 * 这是预测编码（Predictive Coding）的核心实现
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
  PredictiveNeuron,
  createPredictiveNeuron,
  computePredictedActivation,
  updatePrediction,
  activateNeuron,
  computePredictionError,
  updateLearningState,
  learnFromError,
  hebbianLearning,
  computeSimilarity,
  getNeuronSummary,
  NeuronRole,
} from './predictive-neuron';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 预测结果
 */
export interface Prediction {
  /** 神经元级别的预测 */
  neuronPredictions: Map<string, NeuronPrediction>;
  
  /** 系统级别的预测 */
  systemPrediction: SystemPrediction;
  
  /** 预测时间戳 */
  timestamp: number;
}

/**
 * 单个神经元的预测
 */
export interface NeuronPrediction {
  neuronId: string;
  label: string;
  expectedActivation: number;
  confidence: number;
  role: NeuronRole;
}

/**
 * 系统级别的预测
 */
export interface SystemPrediction {
  /** 预测的主题 */
  expectedTopics: string[];
  
  /** 预测的情感 */
  expectedEmotion: {
    valence: number;  // [-1, 1] 消极到积极
    arousal: number;  // [0, 1] 平静到激动
  };
  
  /** 预测的响应类型 */
  expectedResponseType: 'factual' | 'emotional' | 'creative' | 'analytical' | 'conversational';
  
  /** 预测的活跃神经元 */
  expectedActiveNeurons: string[];
}

/**
 * 处理结果
 */
export interface ProcessingResult {
  /** 输入向量 */
  inputVector: number[];
  
  /** 神经元激活 */
  activations: Map<string, number>;
  
  /** 预测误差 */
  predictionErrors: Map<string, number>;
  
  /** 惊讶事件 */
  surprises: SurpriseEvent[];
  
  /** 处理时间 */
  processingTime: number;
}

/**
 * 惊讶事件
 */
export interface SurpriseEvent {
  neuronId: string;
  label: string;
  predictionError: number;
  surprise: number;
  description: string;
}

/**
 * 学习结果
 */
export interface LearningResult {
  /** 调整的神经元 */
  adjustedNeurons: string[];
  
  /** 新创建的神经元 */
  newNeurons: PredictiveNeuron[];
  
  /** 修剪的神经元 */
  prunedNeurons: string[];
  
  /** 连接变化 */
  connectionChanges: ConnectionChange[];
  
  /** 学习摘要 */
  summary: string;
}

/**
 * 连接变化
 */
export interface ConnectionChange {
  from: string;
  to: string;
  oldStrength: number;
  newStrength: number;
  reason: string;
}

/**
 * 预测循环上下文
 */
export interface PredictionContext {
  /** 用户ID */
  userId: string;
  
  /** 会话ID */
  sessionId: string;
  
  /** 最近的对话 */
  recentMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  
  /** 最近的神经元激活 */
  recentActivations: Map<string, number>;
  
  /** 当前目标 */
  currentGoal?: string;
}

// ─────────────────────────────────────────────────────────────────────
// 预测循环类
// ─────────────────────────────────────────────────────────────────────

export class PredictionLoop {
  private neurons: Map<string, PredictiveNeuron>;
  readonly userId: string;
  private embeddingDimension: number = 768;
  
  // 统计信息
  private stats = {
    totalPredictions: 0,
    accuratePredictions: 0,
    totalSurprise: 0,
    neuronsCreated: 0,
    neuronsPruned: 0,
  };

  constructor(userId: string, existingNeurons?: PredictiveNeuron[]) {
    this.userId = userId;
    this.neurons = new Map();
    
    if (existingNeurons) {
      for (const neuron of existingNeurons) {
        this.neurons.set(neuron.id, neuron);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 阶段1：预测
  // ══════════════════════════════════════════════════════════════════

  /**
   * 生成预测
   * 在用户输入之前，系统预测"可能会发生什么"
   */
  async generatePrediction(context: PredictionContext): Promise<Prediction> {
    const neuronPredictions = new Map<string, NeuronPrediction>();
    const expectedActiveNeurons: string[] = [];
    
    // 对每个神经元生成预测
    for (const [id, neuron] of this.neurons) {
      const expected = computePredictedActivation(neuron, {
        recentActivations: context.recentActivations,
      });
      
      // 更新神经元的预测模型
      const updated = updatePrediction(
        neuron,
        expected,
        context.recentMessages.slice(-3).map(m => m.content),
        'context_based'
      );
      this.neurons.set(id, updated);
      
      // 记录预测
      neuronPredictions.set(id, {
        neuronId: id,
        label: neuron.label,
        expectedActivation: expected,
        confidence: updated.prediction.confidence,
        role: neuron.role,
      });
      
      // 高预测激活的神经元记为"预期活跃"
      if (expected > 0.5) {
        expectedActiveNeurons.push(id);
      }
    }
    
    // 系统级预测
    const systemPrediction = await this.generateSystemPrediction(
      neuronPredictions,
      context
    );
    
    this.stats.totalPredictions++;
    
    return {
      neuronPredictions,
      systemPrediction,
      timestamp: Date.now(),
    };
  }

  /**
   * 生成系统级别的预测
   */
  private async generateSystemPrediction(
    neuronPredictions: Map<string, NeuronPrediction>,
    context: PredictionContext
  ): Promise<SystemPrediction> {
    // 基于神经元预测推断主题
    const predictedNeurons = Array.from(neuronPredictions.values())
      .filter(p => p.expectedActivation > 0.5)
      .sort((a, b) => b.expectedActivation - a.expectedActivation);
    
    const expectedTopics = predictedNeurons
      .slice(0, 5)
      .map(p => p.label);
    
    // 预测情感（基于情感神经元）
    const emotionalNeurons = predictedNeurons
      .filter(p => p.role === 'emotional');
    
    let valence = 0;
    let arousal = 0;
    
    for (const n of emotionalNeurons) {
      const label = n.label.toLowerCase();
      if (label.includes('positive') || label.includes('joy') || label.includes('happy')) {
        valence += n.expectedActivation;
      } else if (label.includes('negative') || label.includes('sad') || label.includes('anger')) {
        valence -= n.expectedActivation;
      }
      arousal += n.expectedActivation * 0.5;
    }
    
    // 预测响应类型（基于语义神经元）
    const semanticNeurons = predictedNeurons
      .filter(p => p.role === 'semantic' || p.role === 'abstract');
    
    let expectedResponseType: SystemPrediction['expectedResponseType'] = 'conversational';
    
    if (semanticNeurons.some(n => n.label.toLowerCase().includes('fact'))) {
      expectedResponseType = 'factual';
    } else if (semanticNeurons.some(n => n.label.toLowerCase().includes('emotion'))) {
      expectedResponseType = 'emotional';
    } else if (semanticNeurons.some(n => n.label.toLowerCase().includes('creative'))) {
      expectedResponseType = 'creative';
    } else if (semanticNeurons.some(n => n.label.toLowerCase().includes('analy'))) {
      expectedResponseType = 'analytical';
    }
    
    return {
      expectedTopics,
      expectedEmotion: {
        valence: Math.max(-1, Math.min(1, valence)),
        arousal: Math.max(0, Math.min(1, arousal)),
      },
      expectedResponseType,
      expectedActiveNeurons: predictedNeurons.slice(0, 10).map(n => n.neuronId),
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 阶段2：处理
  // ══════════════════════════════════════════════════════════════════

  /**
   * 处理输入（带预测误差计算）
   */
  async processWithPredictionError(
    input: string,
    inputVector: number[],
    prediction: Prediction,
    context: PredictionContext
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const activations = new Map<string, number>();
    const predictionErrors = new Map<string, number>();
    const surprises: SurpriseEvent[] = [];
    
    // 确保输入向量维度正确
    const vector = this.ensureDimension(inputVector, this.embeddingDimension);
    
    // 激活神经元
    for (const [id, neuron] of this.neurons) {
      // 计算输入与神经元敏感度的匹配度
      const similarity = computeSimilarity(neuron.sensitivityVector, vector);
      
      // 激活神经元
      const activated = activateNeuron(neuron, similarity, 'external_input');
      this.neurons.set(id, activated);
      
      activations.set(id, activated.actual.activation);
      
      // 计算预测误差
      const error = computePredictionError(activated);
      predictionErrors.set(id, error);
      
      // 更新学习状态
      const withLearning = updateLearningState(activated, error);
      this.neurons.set(id, withLearning);
      
      // 记录惊讶事件
      const surprise = Math.abs(error) * activated.prediction.confidence;
      if (surprise > 0.3) {
        surprises.push({
          neuronId: id,
          label: neuron.label,
          predictionError: error,
          surprise,
          description: this.describeSurprise(neuron, error, surprise),
        });
        
        this.stats.totalSurprise += surprise;
      }
    }
    
    // 更新预测准确度统计
    this.updatePredictionStats(predictionErrors, prediction);
    
    return {
      inputVector: vector,
      activations,
      predictionErrors,
      surprises,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * 描述惊讶事件
   */
  private describeSurprise(
    neuron: PredictiveNeuron,
    error: number,
    surprise: number
  ): string {
    if (error > 0) {
      return `${neuron.label} 意外激活（预测${(neuron.prediction.expectedActivation * 100).toFixed(0)}%，实际${(neuron.actual.activation * 100).toFixed(0)}%）`;
    } else {
      return `${neuron.label} 预期落空（预测${(neuron.prediction.expectedActivation * 100).toFixed(0)}%，实际${(neuron.actual.activation * 100).toFixed(0)}%）`;
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 阶段3：学习
  // ══════════════════════════════════════════════════════════════════

  /**
   * 从预测误差中学习
   */
  async learnFromPredictionError(
    inputVector: number[],
    predictionErrors: Map<string, number>,
    reward: number = 0
  ): Promise<LearningResult> {
    const adjustedNeurons: string[] = [];
    const connectionChanges: ConnectionChange[] = [];
    const newNeurons: PredictiveNeuron[] = [];
    
    // 确保输入向量维度正确
    const vector = this.ensureDimension(inputVector, this.embeddingDimension);
    
    // 1. 学习：调整每个有显著误差的神经元
    for (const [id, error] of predictionErrors) {
      if (Math.abs(error) < 0.1) continue;
      
      const neuron = this.neurons.get(id);
      if (!neuron) continue;
      
      // 敏感度调整
      const adjusted = learnFromError(neuron, vector, error);
      
      // Hebbian学习（如果有奖励）
      const withHebbian = reward !== 0 
        ? hebbianLearning(adjusted, reward)
        : adjusted;
      
      this.neurons.set(id, withHebbian);
      adjustedNeurons.push(id);
    }
    
    // 2. 惊讶驱动的新神经元生成
    const highSurpriseNeurons = Array.from(this.neurons.values())
      .filter(n => n.learning.accumulatedSurprise > 2.0)
      .slice(0, 3);
    
    for (const neuron of highSurpriseNeurons) {
      // 检查是否需要创建专门的神经元
      const newNeuron = await this.maybeCreateSpecializedNeuron(neuron, vector);
      if (newNeuron) {
        this.neurons.set(newNeuron.id, newNeuron);
        newNeurons.push(newNeuron);
        this.stats.neuronsCreated++;
      }
    }
    
    // 3. 修剪无效神经元
    const prunedNeurons = await this.pruneWeakNeurons();
    this.stats.neuronsPruned += prunedNeurons.length;
    
    // 生成摘要
    const summary = this.generateLearningSummary(
      adjustedNeurons.length,
      newNeurons.length,
      prunedNeurons.length,
      reward
    );
    
    return {
      adjustedNeurons,
      newNeurons,
      prunedNeurons,
      connectionChanges,
      summary,
    };
  }

  /**
   * 可能创建专门神经元
   */
  private async maybeCreateSpecializedNeuron(
    parent: PredictiveNeuron,
    inputVector: number[]
  ): Promise<PredictiveNeuron | null> {
    // 只有当父神经元惊讶度持续高时才创建
    if (parent.learning.accumulatedSurprise < 3.0) return null;
    
    // 创建一个更专门化的神经元
    // 敏感度向量 = 父神经元敏感度 + 输入方向的混合
    const newSensitivity = parent.sensitivityVector.map((s, i) => {
      return 0.6 * s + 0.4 * (inputVector[i] || 0);
    });
    
    // 归一化
    const norm = Math.sqrt(newSensitivity.reduce((sum, x) => sum + x * x, 0));
    const normalized = newSensitivity.map(x => x / (norm || 1));
    
    const newNeuron = createPredictiveNeuron(this.userId, {
      label: `${parent.label}_specialized`,
      role: parent.role,
      sensitivityVector: normalized,
      receptiveField: `专门化：${parent.receptiveField}`,
      creationReason: `从 ${parent.id} 分化，惊讶度=${parent.learning.accumulatedSurprise.toFixed(2)}`,
      level: parent.meta.level,
    });
    
    // 建立与父神经元的连接
    newNeuron.incomingConnections.push({
      targetId: parent.id,
      type: 'excitatory',
      strength: 0.5,
      efficiency: 1.0,
      delay: 0,
      hebbianRate: 0.1,
    });
    
    return newNeuron;
  }

  /**
   * 修剪弱神经元
   */
  private async pruneWeakNeurons(): Promise<string[]> {
    const pruned: string[] = [];
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    for (const [id, neuron] of this.neurons) {
      // 修剪条件
      const lowUsefulness = neuron.meta.usefulness < 0.15;
      const lowActivation = neuron.actual.activation < 0.1;
      const oldEnough = now - neuron.meta.createdAt > oneWeek;
      const highError = neuron.learning.errorHistory.length > 20 &&
        neuron.learning.errorHistory.slice(-20).every(e => Math.abs(e) > 0.3);
      
      if ((lowUsefulness && lowActivation && oldEnough) || highError) {
        this.neurons.delete(id);
        pruned.push(id);
      }
    }
    
    return pruned;
  }

  // ══════════════════════════════════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════════════════════════════════

  /**
   * 确保向量维度正确
   */
  private ensureDimension(vector: number[], targetDim: number): number[] {
    if (vector.length === targetDim) return vector;
    
    if (vector.length < targetDim) {
      // 填充零
      return [...vector, ...new Array(targetDim - vector.length).fill(0)];
    } else {
      // 截断
      return vector.slice(0, targetDim);
    }
  }

  /**
   * 更新预测统计
   */
  private updatePredictionStats(
    errors: Map<string, number>,
    prediction: Prediction
  ): void {
    let accurateCount = 0;
    
    for (const [id, error] of errors) {
      // 误差在 ±0.2 范围内视为准确
      if (Math.abs(error) <= 0.2) {
        accurateCount++;
      }
    }
    
    if (errors.size > 0) {
      const accuracy = accurateCount / errors.size;
      if (accuracy > 0.7) {
        this.stats.accuratePredictions++;
      }
    }
  }

  /**
   * 生成学习摘要
   */
  private generateLearningSummary(
    adjusted: number,
    created: number,
    pruned: number,
    reward: number
  ): string {
    const parts: string[] = [];
    
    if (adjusted > 0) {
      parts.push(`调整 ${adjusted} 个神经元`);
    }
    if (created > 0) {
      parts.push(`创建 ${created} 个新神经元`);
    }
    if (pruned > 0) {
      parts.push(`修剪 ${pruned} 个弱神经元`);
    }
    if (reward !== 0) {
      parts.push(`奖励信号: ${reward.toFixed(2)}`);
    }
    
    return parts.length > 0 ? parts.join('，') : '无需学习调整';
  }

  /**
   * 获取神经元
   */
  getNeuron(id: string): PredictiveNeuron | undefined {
    return this.neurons.get(id);
  }

  /**
   * 获取所有神经元
   */
  getAllNeurons(): PredictiveNeuron[] {
    return Array.from(this.neurons.values());
  }

  /**
   * 获取活跃神经元
   */
  getActiveNeurons(threshold: number = 0.5): PredictiveNeuron[] {
    return Array.from(this.neurons.values())
      .filter(n => n.actual.activation > threshold)
      .sort((a, b) => b.actual.activation - a.actual.activation);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      neuronCount: this.neurons.size,
      predictionAccuracy: this.stats.totalPredictions > 0
        ? this.stats.accuratePredictions / this.stats.totalPredictions
        : 0,
    };
  }

  /**
   * 导出状态（用于持久化）
   */
  exportState(): {
    neurons: PredictiveNeuron[];
    stats: {
      totalPredictions: number;
      accuratePredictions: number;
      totalSurprise: number;
      neuronsCreated: number;
      neuronsPruned: number;
    };
  } {
    return {
      neurons: Array.from(this.neurons.values()),
      stats: this.stats,
    };
  }

  /**
   * 导入状态
   */
  importState(state: {
    neurons: PredictiveNeuron[];
    stats?: {
      totalPredictions: number;
      accuratePredictions: number;
      totalSurprise: number;
      neuronsCreated: number;
      neuronsPruned: number;
    };
  }): void {
    this.neurons.clear();
    for (const neuron of state.neurons) {
      this.neurons.set(neuron.id, neuron);
    }
    if (state.stats) {
      this.stats = state.stats;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例管理
// ─────────────────────────────────────────────────────────────────────

const predictionLoops = new Map<string, PredictionLoop>();

/**
 * 获取用户的预测循环实例
 */
export function getPredictionLoop(userId: string): PredictionLoop {
  if (!predictionLoops.has(userId)) {
    predictionLoops.set(userId, new PredictionLoop(userId));
  }
  return predictionLoops.get(userId)!;
}

/**
 * 清理用户的预测循环
 */
export function clearPredictionLoop(userId: string): void {
  predictionLoops.delete(userId);
}

/**
 * 重置所有预测循环实例
 */
export function resetPredictionLoop(): void {
  predictionLoops.clear();
}
