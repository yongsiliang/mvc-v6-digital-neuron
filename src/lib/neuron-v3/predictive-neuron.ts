/**
 * ═══════════════════════════════════════════════════════════════════════
 * 预测神经元 - Predictive Neuron
 * 
 * 核心理念：
 * - 神经元不是被动激活，而是主动预测
 * - 学习信号来自预测误差，而非外部标签
 * - 每个神经元都有"惊讶度"，驱动学习和新神经元生成
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 神经元功能角色
 */
export type NeuronRole = 
  | 'sensory'      // 感觉神经元：编码外部输入
  | 'semantic'     // 语义神经元：表示概念
  | 'episodic'     // 情景神经元：表示事件
  | 'emotional'    // 情感神经元：表示情绪
  | 'abstract'     // 抽象神经元：表示高级概念
  | 'motor'        // 运动神经元：产生输出
  | 'metacognitive'; // 元认知神经元：思考思考

/**
 * 激活趋势
 */
export type ActivationTrend = 'rising' | 'stable' | 'falling';

/**
 * 预测模型
 */
export interface PredictionModel {
  /** 预测的激活水平 [0, 1] */
  expectedActivation: number;
  
  /** 预测置信度 [0, 1] */
  confidence: number;
  
  /** 预测依赖的上下文 */
  contextDependencies: string[];
  
  /** 预测时间戳 */
  predictedAt: number;
  
  /** 预测基础（为什么这样预测） */
  basis: string;
}

/**
 * 实际状态
 */
export interface ActualState {
  /** 实际激活水平 [0, 1] */
  activation: number;
  
  /** 接收到的输入（神经元ID -> 强度） */
  receivedInputs: Map<string, number>;
  
  /** 最后激活时间 */
  lastActivatedAt: number | null;
  
  /** 激活历史（最近N次） */
  activationHistory: number[];
}

/**
 * 学习状态
 */
export interface LearningState {
  /** 预测误差 = 实际 - 预测 */
  predictionError: number;
  
  /** 误差历史（用于计算趋势） */
  errorHistory: number[];
  
  /** 累积惊讶度 */
  accumulatedSurprise: number;
  
  /** 学习率（可自适应调整） */
  learningRate: number;
  
  /** 上次学习时间 */
  lastLearningAt: number | null;
  
  /** 学习次数 */
  totalLearningEvents: number;
}

/**
 * 神经元元信息
 */
export interface NeuronMeta {
  /** 创建原因 */
  creationReason: string;
  
  /** 历史效用评分 [0, 1] */
  usefulness: number;
  
  /** 激活次数 */
  totalActivations: number;
  
  /** 平均激活强度 */
  averageActivation: number;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后更新时间 */
  lastUpdateAt: number;
  
  /** 层级（0=感知层，越高越抽象） */
  level: number;
  
  /** 是否正在被修剪考虑 */
  pruningCandidate: boolean;
}

/**
 * 连接信息
 */
export interface ConnectionInfo {
  /** 目标神经元ID */
  targetId: string;
  
  /** 连接类型 */
  type: 'excitatory' | 'inhibitory' | 'modulatory';
  
  /** 连接强度 [0, 1] */
  strength: number;
  
  /** 连接效率 [0, 1] */
  efficiency: number;
  
  /** 延迟（毫秒） */
  delay: number;
  
  /** Hebbian学习参数 */
  hebbianRate: number;
}

/**
 * 预测神经元 - 核心数据结构
 */
export interface PredictiveNeuron {
  /** 唯一标识 */
  id: string;
  
  /** 所属用户ID */
  userId: string;
  
  /** 标签（人类可读的名称） */
  label: string;
  
  /** 功能角色 */
  role: NeuronRole;
  
  /** 敏感度向量（在语义空间中的方向） */
  sensitivityVector: number[];
  
  /** 敏感度维度 */
  sensitivityDimension: number;
  
  /** 敏感度可塑性（敏感度调整的灵活性） */
  sensitivityPlasticity: number;
  
  /** 感受野描述（这个神经元"敏感"什么） */
  receptiveField: string;
  
  /** 预测模型 */
  prediction: PredictionModel;
  
  /** 实际状态 */
  actual: ActualState;
  
  /** 学习状态 */
  learning: LearningState;
  
  /** 元信息 */
  meta: NeuronMeta;
  
  /** 输出连接 */
  outgoingConnections: ConnectionInfo[];
  
  /** 输入连接 */
  incomingConnections: ConnectionInfo[];
}

// ─────────────────────────────────────────────────────────────────────
// 神经元工厂
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建预测神经元
 */
export function createPredictiveNeuron(
  userId: string,
  config: {
    label: string;
    role: NeuronRole;
    sensitivityVector: number[];
    receptiveField: string;
    creationReason: string;
    level?: number;
  }
): PredictiveNeuron {
  const now = Date.now();
  const dimension = config.sensitivityVector.length;
  
  return {
    id: uuidv4(),
    userId,
    label: config.label,
    role: config.role,
    sensitivityVector: config.sensitivityVector,
    sensitivityDimension: dimension,
    sensitivityPlasticity: 0.5,
    receptiveField: config.receptiveField,
    
    prediction: {
      expectedActivation: 0.5,
      confidence: 0.3, // 初始低置信度
      contextDependencies: [],
      predictedAt: now,
      basis: 'initialization',
    },
    
    actual: {
      activation: 0,
      receivedInputs: new Map(),
      lastActivatedAt: null,
      activationHistory: [],
    },
    
    learning: {
      predictionError: 0,
      errorHistory: [],
      accumulatedSurprise: 0,
      learningRate: 0.1,
      lastLearningAt: null,
      totalLearningEvents: 0,
    },
    
    meta: {
      creationReason: config.creationReason,
      usefulness: 0.5,
      totalActivations: 0,
      averageActivation: 0,
      createdAt: now,
      lastUpdateAt: now,
      level: config.level || 1,
      pruningCandidate: false,
    },
    
    outgoingConnections: [],
    incomingConnections: [],
  };
}

// ─────────────────────────────────────────────────────────────────────
// 预测计算
// ─────────────────────────────────────────────────────────────────────

/**
 * 计算预测激活
 */
export function computePredictedActivation(
  neuron: PredictiveNeuron,
  context: {
    recentActivations: Map<string, number>;
    currentInput?: number[];
  }
): number {
  // 基础预测：历史平均
  const historicalAvg = neuron.meta.averageActivation;
  
  // 上下文预测：连接神经元的激活
  let contextPrediction = 0;
  let totalWeight = 0;
  
  for (const conn of neuron.incomingConnections) {
    const sourceActivation = context.recentActivations.get(conn.targetId) || 0;
    const weight = conn.strength * conn.efficiency;
    
    if (conn.type === 'excitatory') {
      contextPrediction += sourceActivation * weight;
    } else if (conn.type === 'inhibitory') {
      contextPrediction -= sourceActivation * weight;
    }
    
    totalWeight += weight;
  }
  
  if (totalWeight > 0) {
    contextPrediction /= totalWeight;
  }
  
  // 输入预测：如果提供了输入向量
  let inputPrediction = 0.5;
  if (context.currentInput && context.currentInput.length === neuron.sensitivityDimension) {
    inputPrediction = computeSimilarity(neuron.sensitivityVector, context.currentInput);
  }
  
  // 综合预测：加权平均
  // 如果有上下文信息，更依赖上下文；否则依赖历史和输入
  const hasContext = neuron.incomingConnections.length > 0;
  const hasInput = context.currentInput !== undefined;
  
  let predicted: number;
  if (hasContext && hasInput) {
    predicted = 0.2 * historicalAvg + 0.4 * contextPrediction + 0.4 * inputPrediction;
  } else if (hasContext) {
    predicted = 0.3 * historicalAvg + 0.7 * contextPrediction;
  } else if (hasInput) {
    predicted = 0.3 * historicalAvg + 0.7 * inputPrediction;
  } else {
    predicted = historicalAvg;
  }
  
  // 考虑当前置信度
  const confidence = neuron.prediction.confidence;
  // 低置信度时，预测向中间收敛
  predicted = predicted * confidence + 0.5 * (1 - confidence);
  
  return Math.max(0, Math.min(1, predicted));
}

/**
 * 更新预测模型
 */
export function updatePrediction(
  neuron: PredictiveNeuron,
  newPrediction: number,
  context: string[],
  basis: string
): PredictiveNeuron {
  const now = Date.now();
  
  // 预测的历史准确度
  const historicalAccuracy = computePredictionAccuracy(neuron);
  
  // 更新置信度：准确度高 → 置信度高
  const newConfidence = 0.7 * historicalAccuracy + 0.3 * neuron.prediction.confidence;
  
  return {
    ...neuron,
    prediction: {
      expectedActivation: newPrediction,
      confidence: Math.max(0.1, Math.min(0.95, newConfidence)),
      contextDependencies: context,
      predictedAt: now,
      basis,
    },
    meta: {
      ...neuron.meta,
      lastUpdateAt: now,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// 激活与误差计算
// ─────────────────────────────────────────────────────────────────────

/**
 * 激活神经元
 */
export function activateNeuron(
  neuron: PredictiveNeuron,
  inputStrength: number,
  sourceId?: string
): PredictiveNeuron {
  const now = Date.now();
  
  // 计算新激活
  const activation = Math.max(0, Math.min(1, 
    0.7 * inputStrength + 0.3 * neuron.actual.activation
  ));
  
  // 更新输入记录
  const newInputs = new Map(neuron.actual.receivedInputs);
  if (sourceId) {
    newInputs.set(sourceId, inputStrength);
  }
  
  // 更新激活历史
  const newHistory = [...neuron.actual.activationHistory, activation];
  if (newHistory.length > 100) {
    newHistory.shift();
  }
  
  // 更新元信息
  const newTotalActivations = neuron.meta.totalActivations + 1;
  const newAverageActivation = 
    (neuron.meta.averageActivation * neuron.meta.totalActivations + activation) / 
    newTotalActivations;
  
  return {
    ...neuron,
    actual: {
      activation,
      receivedInputs: newInputs,
      lastActivatedAt: now,
      activationHistory: newHistory,
    },
    meta: {
      ...neuron.meta,
      totalActivations: newTotalActivations,
      averageActivation: newAverageActivation,
      lastUpdateAt: now,
    },
  };
}

/**
 * 计算预测误差
 */
export function computePredictionError(neuron: PredictiveNeuron): number {
  const actual = neuron.actual.activation;
  const predicted = neuron.prediction.expectedActivation;
  
  return actual - predicted;
}

/**
 * 更新学习状态
 */
export function updateLearningState(
  neuron: PredictiveNeuron,
  predictionError: number
): PredictiveNeuron {
  const now = Date.now();
  
  // 更新误差历史
  const newErrorHistory = [...neuron.learning.errorHistory, predictionError];
  if (newErrorHistory.length > 100) {
    newErrorHistory.shift();
  }
  
  // 计算惊讶度：预测误差 × 置信度
  // 高置信度但预测错误 = 大惊讶
  const surprise = Math.abs(predictionError) * neuron.prediction.confidence;
  
  // 惊讶度衰减累积
  const newAccumulatedSurprise = 
    0.95 * neuron.learning.accumulatedSurprise + surprise;
  
  // 自适应学习率
  // 惊讶度高 → 学习率提高
  const adaptiveLearningRate = Math.min(0.5, 
    neuron.learning.learningRate * (1 + surprise)
  );
  
  return {
    ...neuron,
    learning: {
      predictionError,
      errorHistory: newErrorHistory,
      accumulatedSurprise: newAccumulatedSurprise,
      learningRate: adaptiveLearningRate,
      lastLearningAt: now,
      totalLearningEvents: neuron.learning.totalLearningEvents + 1,
    },
    meta: {
      ...neuron.meta,
      lastUpdateAt: now,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// 学习与适应
// ─────────────────────────────────────────────────────────────────────

/**
 * 从误差中学习 - 调整敏感度向量
 */
export function learnFromError(
  neuron: PredictiveNeuron,
  inputVector: number[],
  predictionError: number
): PredictiveNeuron {
  // 学习方向：
  // - 预测误差 > 0（意外激活）→ 向输入方向调整敏感度
  // - 预测误差 < 0（预期落空）→ 远离预测方向
  
  const learningRate = neuron.learning.learningRate;
  const plasticity = neuron.sensitivityPlasticity;
  const effectiveRate = learningRate * plasticity;
  
  // 计算调整方向
  const adjustment: number[] = neuron.sensitivityVector.map((s, i) => {
    const input = inputVector[i] || 0;
    if (predictionError > 0) {
      // 向输入方向调整
      return s + effectiveRate * predictionError * (input - s);
    } else {
      // 远离当前敏感度方向（降低置信度）
      return s + effectiveRate * predictionError * 0.1 * s;
    }
  });
  
  // 归一化
  const norm = Math.sqrt(adjustment.reduce((sum, x) => sum + x * x, 0));
  const normalized = adjustment.map(x => x / (norm || 1));
  
  return {
    ...neuron,
    sensitivityVector: normalized,
    sensitivityPlasticity: Math.max(0.1, plasticity - 0.01), // 可塑性逐渐降低
  };
}

/**
 * Hebbian学习 - 强化同时激活的连接
 */
export function hebbianLearning(
  neuron: PredictiveNeuron,
  reward: number
): PredictiveNeuron {
  const updatedConnections = neuron.outgoingConnections.map(conn => {
    // 基础Hebbian规则
    const hebbianDelta = 
      neuron.actual.activation * 0.5 * // 当前激活
      conn.hebbianRate *              // 学习率
      reward;                         // 奖励调制
    
    // 更新强度
    let newStrength = conn.strength + hebbianDelta;
    
    // 约束在 [0.1, 1.0]
    newStrength = Math.max(0.1, Math.min(1.0, newStrength));
    
    return {
      ...conn,
      strength: newStrength,
    };
  });
  
  return {
    ...neuron,
    outgoingConnections: updatedConnections,
  };
}

/**
 * 更新效用评分
 */
export function updateUsefulness(
  neuron: PredictiveNeuron,
  feedback: number
): PredictiveNeuron {
  // 效用更新：移动平均
  const newUsefulness = 0.9 * neuron.meta.usefulness + 0.1 * feedback;
  
  // 标记是否为修剪候选
  const pruningCandidate = 
    newUsefulness < 0.2 && 
    neuron.meta.totalActivations > 50;
  
  return {
    ...neuron,
    meta: {
      ...neuron.meta,
      usefulness: newUsefulness,
      pruningCandidate,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 计算向量相似度（余弦相似度）
 */
export function computeSimilarity(a: number[], b: number[]): number {
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
 * 计算预测准确度
 */
function computePredictionAccuracy(neuron: PredictiveNeuron): number {
  const history = neuron.learning.errorHistory;
  if (history.length === 0) return 0.5;
  
  // 准确度 = 1 - 平均绝对误差
  const avgAbsError = history.reduce((sum, e) => sum + Math.abs(e), 0) / history.length;
  return Math.max(0, 1 - avgAbsError);
}

/**
 * 计算激活趋势
 */
export function computeActivationTrend(neuron: PredictiveNeuron): ActivationTrend {
  const history = neuron.actual.activationHistory;
  if (history.length < 5) return 'stable';
  
  // 最近5次 vs 之前5次
  const recent = history.slice(-5);
  const earlier = history.slice(-10, -5);
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.length > 0 
    ? earlier.reduce((a, b) => a + b, 0) / earlier.length 
    : recentAvg;
  
  const diff = recentAvg - earlierAvg;
  
  if (diff > 0.1) return 'rising';
  if (diff < -0.1) return 'falling';
  return 'stable';
}

/**
 * 获取神经元摘要（用于日志和调试）
 */
export function getNeuronSummary(neuron: PredictiveNeuron): string {
  const error = neuron.learning.predictionError.toFixed(3);
  const surprise = neuron.learning.accumulatedSurprise.toFixed(3);
  const usefulness = neuron.meta.usefulness.toFixed(3);
  const activation = neuron.actual.activation.toFixed(3);
  const predicted = neuron.prediction.expectedActivation.toFixed(3);
  
  return `[${neuron.label}] act=${activation} pred=${predicted} err=${error} surprise=${surprise} useful=${usefulness}`;
}
