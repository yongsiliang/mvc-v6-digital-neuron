/**
 * ═══════════════════════════════════════════════════════════════════════
 * 学习层 - Learning Layers
 * 
 * 实现真正的神经网络学习规则
 * 
 * 包含：
 * 1. Hebbian 学习层 - "一起激发，一起连接"
 * 2. 奖励调制学习层 - 基于奖励信号的学习
 * 3. STDP 学习层 - 脉冲时序依赖可塑性（可选）
 * 4. TD 学习层 - 时序差分学习
 * ═══════════════════════════════════════════════════════════════════════
 */

import * as tf from '@tensorflow/tfjs-node';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 学习配置
 */
export interface LearningConfig {
  /** Hebbian 学习率 */
  hebbianRate: number;
  
  /** 预测学习率 */
  predictionLearningRate: number;
  
  /** 奖励衰减因子 */
  rewardDecay: number;
  
  /** TD lambda 参数 */
  tdLambda: number;
  
  /** 权重衰减 */
  weightDecay?: number;
  
  /** 最大权重 */
  maxWeight?: number;
  
  /** 最小权重 */
  minWeight?: number;
}

/**
 * 学习事件
 */
export interface LearningEvent {
  /** 神经元 ID */
  neuronId: string;
  
  /** 输入 */
  input: number[];
  
  /** 输出 */
  output: number;
  
  /** 预测误差 */
  predictionError: number;
  
  /** 奖励信号 */
  reward: number;
  
  /** 时间戳 */
  timestamp: number;
}

/**
 * 权重更新结果
 */
export interface WeightUpdateResult {
  /** 更新前的权重 */
  oldWeights: number[];
  
  /** 更新后的权重 */
  newWeights: number[];
  
  /** 更新量 */
  delta: number[];
  
  /** 更新幅度 */
  magnitude: number;
}

// ─────────────────────────────────────────────────────────────────────
// Hebbian 学习层
// ─────────────────────────────────────────────────────────────────────

/**
 * Hebbian 学习层
 * 
 * 核心规则：Δw = η * pre * post
 * 
 * 扩展规则（Oja's Rule）：
 * Δw = η * pre * (post - w * post²)
 * 
 * 特点：
 * - 无监督学习
 * - 自组织
 * - 无需外部标签
 */
export class HebbianLayer {
  private config: LearningConfig;
  private learningHistory: Array<{
    timestamp: number;
    weightChange: number;
    inputNorm: number;
    outputNorm: number;
  }>;

  constructor(config: Partial<LearningConfig> = {}) {
    this.config = {
      hebbianRate: 0.01,
      predictionLearningRate: 0.1,
      rewardDecay: 0.99,
      tdLambda: 0.9,
      weightDecay: 0.0001,
      maxWeight: 1.0,
      minWeight: -1.0,
      ...config,
    };
    this.learningHistory = [];
  }

  /**
   * 计算权重更新量
   * 
   * Δw = η * pre * post
   */
  computeWeightDelta(
    preActivation: tf.Tensor1D,
    postActivation: tf.Tensor1D,
    learningRate?: number
  ): tf.Tensor2D {
    const eta = learningRate ?? this.config.hebbianRate;

    // 外积：pre ⊗ post
    const outer = tf.outerProduct(postActivation, preActivation);

    // 乘以学习率
    const delta = outer.mul(eta);

    outer.dispose();
    return delta as tf.Tensor2D;
  }

  /**
   * Oja's Rule 学习
   * 
   * Δw = η * pre * (post - w * post²)
   * 
   * 优点：自动归一化，防止权重爆炸
   */
  computeOjaDelta(
    preActivation: tf.Tensor1D,
    postActivation: tf.Tensor1D,
    weights: tf.Tensor2D,
    learningRate?: number
  ): tf.Tensor2D {
    const eta = learningRate ?? this.config.hebbianRate;

    // 计算 post²
    const postSquared = tf.mul(postActivation, postActivation) as tf.Tensor1D;

    // 计算 w * post²
    const postSquared2D = tf.expandDims(postSquared, 1) as tf.Tensor2D;
    const weightedPostSquared = tf.squeeze(tf.matMul(weights, postSquared2D), [1]) as tf.Tensor1D;

    // 计算 (post - w * post²)
    const correction = tf.sub(postActivation, weightedPostSquared) as tf.Tensor1D;

    // 外积
    const outer = tf.outerProduct(correction, preActivation);

    // 乘以学习率
    const delta = tf.mul(outer, eta) as tf.Tensor2D;

    // 清理
    postSquared.dispose();
    postSquared2D.dispose();
    weightedPostSquared.dispose();
    correction.dispose();
    outer.dispose();

    return delta;
  }

  /**
   * 应用权重更新
   */
  async applyWeightUpdate(
    weights: tf.Tensor2D,
    delta: tf.Tensor2D
  ): Promise<WeightUpdateResult> {
    // 记录旧权重
    const oldWeights = Array.from(await weights.data());

    // 应用更新
    let newWeights = tf.add(weights, delta);

    // 权重衰减
    if (this.config.weightDecay && this.config.weightDecay > 0) {
      const decayed = tf.mul(newWeights, tf.scalar(1 - this.config.weightDecay));
      newWeights.dispose();
      newWeights = decayed;
    }

    // 裁剪权重
    if (this.config.maxWeight !== undefined && this.config.minWeight !== undefined) {
      const clipped = tf.clipByValue(
        newWeights,
        this.config.minWeight,
        this.config.maxWeight
      );
      newWeights.dispose();
      newWeights = clipped;
    }

    // 计算更新量
    const deltaArray = Array.from(await delta.data());
    const magnitude = Math.sqrt(deltaArray.reduce((sum, d) => sum + d * d, 0));

    // 记录历史
    this.learningHistory.push({
      timestamp: Date.now(),
      weightChange: magnitude,
      inputNorm: 0,
      outputNorm: 0,
    });

    return {
      oldWeights,
      newWeights: Array.from(await newWeights.data()),
      delta: deltaArray,
      magnitude,
    };
  }

  /**
   * 获取学习历史
   */
  getHistory(): typeof this.learningHistory {
    return [...this.learningHistory];
  }

  /**
   * 清除历史
   */
  clearHistory(): void {
    this.learningHistory = [];
  }
}

// ─────────────────────────────────────────────────────────────────────
// 奖励调制学习层
// ─────────────────────────────────────────────────────────────────────

/**
 * 奖励调制学习层
 * 
 * 核心思想：奖励信号调制学习率
 * 
 * Δw = η * R * pre * post
 * 
 * 其中 R 是奖励信号（正/负）
 */
export class RewardModulatedLayer {
  private config: LearningConfig;
  private rewardHistory: Array<{
    timestamp: number;
    reward: number;
    modulatedRate: number;
  }>;
  private baselineReward: number;

  constructor(config: Partial<LearningConfig> = {}) {
    this.config = {
      hebbianRate: 0.01,
      predictionLearningRate: 0.1,
      rewardDecay: 0.99,
      tdLambda: 0.9,
      ...config,
    };
    this.rewardHistory = [];
    this.baselineReward = 0;
  }

  /**
   * 调制学习率
   * 
   * modulated_rate = base_rate * (1 + α * reward)
   * 
   * 其中 α 是调制强度
   */
  modulateLearningRate(
    baseRate: number,
    reward: number,
    decay?: number
  ): number {
    const alpha = 0.5; // 调制强度
    
    // 更新基线奖励
    this.baselineReward = 
      (this.baselineReward * (decay ?? this.config.rewardDecay)) +
      (reward * (1 - (decay ?? this.config.rewardDecay)));

    // 计算相对奖励
    const relativeReward = reward - this.baselineReward;

    // 调制学习率
    let modulatedRate = baseRate * (1 + alpha * Math.tanh(relativeReward));

    // 确保学习率非负
    modulatedRate = Math.max(0, modulatedRate);

    // 记录历史
    this.rewardHistory.push({
      timestamp: Date.now(),
      reward,
      modulatedRate,
    });

    return modulatedRate;
  }

  /**
   * 计算奖励调制权重更新
   */
  computeRewardModulatedDelta(
    preActivation: tf.Tensor1D,
    postActivation: tf.Tensor1D,
    reward: number,
    baseLearningRate?: number
  ): tf.Tensor2D {
    const modulatedRate = this.modulateLearningRate(
      baseLearningRate ?? this.config.hebbianRate,
      reward
    );

    // Hebbian 更新
    const outer = tf.outerProduct(postActivation, preActivation);
    const delta = outer.mul(modulatedRate);

    outer.dispose();
    return delta as tf.Tensor2D;
  }

  /**
   * 获取奖励历史
   */
  getRewardHistory(): typeof this.rewardHistory {
    return [...this.rewardHistory];
  }

  /**
   * 获取基线奖励
   */
  getBaselineReward(): number {
    return this.baselineReward;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 时序差分学习层
// ─────────────────────────────────────────────────────────────────────

/**
 * 时序差分学习层
 * 
 * TD(λ) 学习：
 * 
 * δ = R + γ * V(s') - V(s)  // TD 误差
 * 
 * 其中：
 * - R：即时奖励
 * - γ：折扣因子
 * - V(s)：状态价值
 * - s'：下一状态
 */
export class TDLearningLayer {
  private config: LearningConfig;
  private eligibilityTraces: Map<string, tf.Tensor1D>;
  private valueEstimates: Map<string, number>;

  constructor(config: Partial<LearningConfig> = {}) {
    this.config = {
      hebbianRate: 0.01,
      predictionLearningRate: 0.1,
      rewardDecay: 0.99,
      tdLambda: 0.9,
      ...config,
    };
    this.eligibilityTraces = new Map();
    this.valueEstimates = new Map();
  }

  /**
   * 计算 TD 误差
   * 
   * δ = R + γ * V(s') - V(s)
   */
  computeTDError(
    currentState: string,
    nextState: string,
    reward: number,
    gamma: number = 0.99
  ): number {
    const currentValue = this.valueEstimates.get(currentState) ?? 0;
    const nextValue = this.valueEstimates.get(nextState) ?? 0;

    const tdError = reward + gamma * nextValue - currentValue;

    // 更新价值估计
    this.valueEstimates.set(currentState, 
      currentValue + this.config.predictionLearningRate * tdError
    );

    return tdError;
  }

  /**
   * 更新资格迹
   * 
   * e(s) = γλ * e(s) + 1 (如果 s 是当前状态)
   */
  updateEligibilityTrace(
    stateId: string,
    featureVector: tf.Tensor1D
  ): tf.Tensor1D {
    const existing = this.eligibilityTraces.get(stateId);
    const gamma = this.config.rewardDecay;
    const lambda = this.config.tdLambda;

    if (existing) {
      // 衰减旧迹
      const decayed = existing.mul(gamma * lambda);
      
      // 加上新迹
      const updated = decayed.add(featureVector) as tf.Tensor1D;
      
      existing.dispose();
      decayed.dispose();
      
      this.eligibilityTraces.set(stateId, updated);
      return updated;
    } else {
      const newTrace = featureVector.clone();
      this.eligibilityTraces.set(stateId, newTrace);
      return newTrace;
    }
  }

  /**
   * TD 学习权重更新
   * 
   * Δw = η * δ * e
   * 
   * 其中 e 是资格迹
   */
  computeTDWeightDelta(
    tdError: number,
    eligibilityTrace: tf.Tensor1D,
    learningRate?: number
  ): tf.Tensor1D {
    const eta = learningRate ?? this.config.predictionLearningRate;
    return eligibilityTrace.mul(eta * tdError) as tf.Tensor1D;
  }

  /**
   * 获取价值估计
   */
  getValue(state: string): number {
    return this.valueEstimates.get(state) ?? 0;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    for (const [, trace] of this.eligibilityTraces) {
      trace.dispose();
    }
    this.eligibilityTraces.clear();
    this.valueEstimates.clear();
  }
}

// ─────────────────────────────────────────────────────────────────────
// STDP 学习层（脉冲时序依赖可塑性）
// ─────────────────────────────────────────────────────────────────────

/**
 * STDP 学习层
 * 
 * 脉冲时序依赖可塑性（Spike-Timing Dependent Plasticity）
 * 
 * 规则：
 * - 如果 pre 在 post 之前激发：LTP（长时程增强）
 * - 如果 post 在 pre 之前激发：LTD（长时程抑制）
 * 
 * Δw = {
 *   A+ * exp(-Δt / τ+)  如果 Δt > 0 (pre 先)
 *   -A- * exp(Δt / τ-)  如果 Δt < 0 (post 先)
 * }
 */
export class STDPLearningLayer {
  private config: {
    /** LTP 幅度 */
    aPlus: number;
    /** LTD 幅度 */
    aMinus: number;
    /** LTP 时间常数 */
    tauPlus: number;
    /** LTD 时间常数 */
    tauMinus: number;
    /** 学习率 */
    learningRate: number;
  };

  private spikeHistory: Map<string, number[]>; // 神经元ID -> 发射时间列表

  constructor(config: Partial<typeof STDPLearningLayer.prototype.config> = {}) {
    this.config = {
      aPlus: 0.1,
      aMinus: 0.12,
      tauPlus: 20,  // ms
      tauMinus: 20, // ms
      learningRate: 0.01,
      ...config,
    };
    this.spikeHistory = new Map();
  }

  /**
   * 记录脉冲
   */
  recordSpike(neuronId: string, time: number): void {
    if (!this.spikeHistory.has(neuronId)) {
      this.spikeHistory.set(neuronId, []);
    }
    const history = this.spikeHistory.get(neuronId)!;
    history.push(time);
    
    // 只保留最近的脉冲
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * 计算 STDP 权重更新
   * 
   * @param preNeuron - 前突触神经元 ID
   * @param postNeuron - 后突触神经元 ID
   * @param currentTime - 当前时间
   */
  computeSTDPDelta(
    preNeuron: string,
    postNeuron: string,
    currentTime: number
  ): number {
    const preSpikes = this.spikeHistory.get(preNeuron) ?? [];
    const postSpikes = this.spikeHistory.get(postNeuron) ?? [];

    let totalDelta = 0;

    // 计算所有 pre-post 和 post-pre 配对
    for (const preTime of preSpikes) {
      for (const postTime of postSpikes) {
        const deltaT = postTime - preTime; // 正值表示 pre 先发射

        if (deltaT > 0) {
          // LTP: pre 在 post 之前
          totalDelta += this.config.aPlus * Math.exp(-deltaT / this.config.tauPlus);
        } else {
          // LTD: post 在 pre 之前
          totalDelta -= this.config.aMinus * Math.exp(deltaT / this.config.tauMinus);
        }
      }
    }

    return totalDelta * this.config.learningRate;
  }

  /**
   * 清除历史
   */
  clearHistory(): void {
    this.spikeHistory.clear();
  }
}

// ─────────────────────────────────────────────────────────────────────
// 综合学习系统
// ─────────────────────────────────────────────────────────────────────

/**
 * 综合学习系统
 * 
 * 整合多种学习规则：
 * 1. Hebbian 学习（基础）
 * 2. 奖励调制（强化）
 * 3. TD 学习（时序）
 * 4. STDP（脉冲，可选）
 */
export class CompositeLearningSystem {
  private hebbian: HebbianLayer;
  private rewardModulated: RewardModulatedLayer;
  private tdLearning: TDLearningLayer;
  private stdp?: STDPLearningLayer;

  private config: LearningConfig;

  constructor(config: Partial<LearningConfig> = {}, enableSTDP: boolean = false) {
    this.config = {
      hebbianRate: 0.01,
      predictionLearningRate: 0.1,
      rewardDecay: 0.99,
      tdLambda: 0.9,
      ...config,
    };

    this.hebbian = new HebbianLayer(this.config);
    this.rewardModulated = new RewardModulatedLayer(this.config);
    this.tdLearning = new TDLearningLayer(this.config);

    if (enableSTDP) {
      this.stdp = new STDPLearningLayer();
    }
  }

  /**
   * 综合学习更新
   */
  async computeTotalDelta(
    preActivation: tf.Tensor1D,
    postActivation: tf.Tensor1D,
    context: {
      reward?: number;
      currentState?: string;
      nextState?: string;
      neuronId?: string;
      preNeuronId?: string;
      postNeuronId?: string;
      currentTime?: number;
    }
  ): Promise<tf.Tensor2D> {
    // 1. 基础 Hebbian 更新
    const hebbianDelta = this.hebbian.computeWeightDelta(
      preActivation,
      postActivation
    );

    // 2. 奖励调制（如果有奖励信号）
    let totalDelta = hebbianDelta;
    if (context.reward !== undefined) {
      const rewardDelta = this.rewardModulated.computeRewardModulatedDelta(
        preActivation,
        postActivation,
        context.reward
      );
      const combined = totalDelta.add(rewardDelta) as tf.Tensor2D;
      totalDelta.dispose();
      rewardDelta.dispose();
      totalDelta = combined;
    }

    // 3. TD 学习（如果有状态信息）
    if (context.currentState && context.nextState && context.reward !== undefined) {
      const tdError = this.tdLearning.computeTDError(
        context.currentState,
        context.nextState,
        context.reward
      );
      
      // TD 权重调整（基于资格迹）
      const tdDelta = totalDelta.mul(1 + 0.1 * tdError) as tf.Tensor2D;
      totalDelta.dispose();
      totalDelta = tdDelta;
    }

    // 4. STDP（如果启用且有脉冲信息）
    if (this.stdp && context.preNeuronId && context.postNeuronId && context.currentTime) {
      const stdpFactor = this.stdp.computeSTDPDelta(
        context.preNeuronId,
        context.postNeuronId,
        context.currentTime
      );
      const stdpDelta = totalDelta.mul(1 + stdpFactor) as tf.Tensor2D;
      totalDelta.dispose();
      totalDelta = stdpDelta;
    }

    return totalDelta;
  }

  /**
   * 获取各层状态
   */
  getLayersStatus(): {
    hebbian: ReturnType<HebbianLayer['getHistory']>[number] | null;
    reward: ReturnType<RewardModulatedLayer['getRewardHistory']>[number] | null;
    baselineReward: number;
  } {
    const hebbianHistory = this.hebbian.getHistory();
    const rewardHistory = this.rewardModulated.getRewardHistory();

    return {
      hebbian: hebbianHistory.length > 0 ? hebbianHistory[hebbianHistory.length - 1] : null,
      reward: rewardHistory.length > 0 ? rewardHistory[rewardHistory.length - 1] : null,
      baselineReward: this.rewardModulated.getBaselineReward(),
    };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.tdLearning.dispose();
  }
}
