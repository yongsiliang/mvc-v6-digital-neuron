/**
 * ═══════════════════════════════════════════════════════════════════════
 * 奖励驱动学习器 - Reward-Driven Learner
 * 
 * 核心机制：
 * - 将预测误差和用户反馈融合为学习信号
 * - 时序差分学习（Temporal Difference Learning）
 * - 奖励调制的Hebbian学习
 * - 价值函数估计
 * 
 * 这是让系统"真正学习"的核心
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
  PredictiveNeuron,
  hebbianLearning,
  updateUsefulness,
} from './predictive-neuron';
import { PredictionLoop, LearningResult } from './prediction-loop';
import { FeedbackSignals, RewardSignal, getFeedbackCollector } from './feedback-collector';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 学习事件记录
 */
export interface LearningEvent {
  /** 时间戳 */
  timestamp: number;
  
  /** 会话ID */
  sessionId: string;
  
  /** 涉及的神经元 */
  neuronIds: string[];
  
  /** 奖励信号 */
  reward: number;
  
  /** 预测误差 */
  predictionErrors: Map<string, number>;
  
  /** 学习前的状态 */
  beforeState: Map<string, number>; // neuronId -> activation
  
  /** 学习后的状态 */
  afterState: Map<string, number>;
  
  /** 学习类型 */
  learningType: 'reward' | 'punishment' | 'prediction_error' | 'hebbian';
  
  /** 效果评估 */
  effectScore?: number;
}

/**
 * 价值估计
 */
export interface ValueEstimate {
  /** 神经元ID */
  neuronId: string;
  
  /** 估计价值 */
  value: number;
  
  /** 价值置信度 */
  confidence: number;
  
  /** 价值来源 */
  source: 'direct_reward' | 'td_learning' | 'hebbian_trace';
  
  /** 最后更新时间 */
  lastUpdated: number;
}

/**
 * 学习配置
 */
export interface LearningConfig {
  /** 学习率 */
  learningRate: number;
  
  /** 折扣因子（用于TD学习） */
  discountFactor: number;
  
  /** 资格迹衰减率 */
  eligibilityDecay: number;
  
  /** 价值更新阈值 */
  valueUpdateThreshold: number;
  
  /** 最小学习间隔（毫秒） */
  minLearningInterval: number;
}

const DEFAULT_CONFIG: LearningConfig = {
  learningRate: 0.1,
  discountFactor: 0.95,
  eligibilityDecay: 0.9,
  valueUpdateThreshold: 0.05,
  minLearningInterval: 1000,
};

// ─────────────────────────────────────────────────────────────────────
// 奖励驱动学习器
// ─────────────────────────────────────────────────────────────────────

export class RewardLearner {
  private config: LearningConfig;
  private predictionLoop: PredictionLoop;
  
  /** 神经元价值估计 */
  private valueEstimates: Map<string, ValueEstimate>;
  
  /** 资格迹（Eligibility Trace）- 记录哪些神经元应该被更新 */
  private eligibilityTraces: Map<string, number>;
  
  /** 学习历史 */
  private learningHistory: LearningEvent[];
  
  /** 上次学习时间 */
  private lastLearningTime: number;
  
  /** 统计信息 */
  private stats = {
    totalLearningEvents: 0,
    totalReward: 0,
    totalPunishment: 0,
    averageValue: 0,
  };

  constructor(predictionLoop: PredictionLoop, config: Partial<LearningConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.predictionLoop = predictionLoop;
    this.valueEstimates = new Map();
    this.eligibilityTraces = new Map();
    this.learningHistory = [];
    this.lastLearningTime = 0;
  }

  // ══════════════════════════════════════════════════════════════════
  // 核心学习算法
  // ══════════════════════════════════════════════════════════════════

  /**
   * 奖励调制学习
   * 
   * 将奖励信号与预测误差结合，更新神经元
   */
  async learnFromReward(
    rewardSignal: RewardSignal,
    predictionErrors: Map<string, number>,
    sessionId: string
  ): Promise<LearningResult> {
    const now = Date.now();
    
    // 检查是否满足学习间隔
    if (now - this.lastLearningTime < this.config.minLearningInterval) {
      return {
        adjustedNeurons: [],
        newNeurons: [],
        prunedNeurons: [],
        connectionChanges: [],
        summary: '学习间隔过短，跳过本次学习',
      };
    }
    
    this.lastLearningTime = now;
    const reward = rewardSignal.reward;
    const adjustedNeurons: string[] = [];
    const beforeState = new Map<string, number>();
    
    // 更新统计
    this.stats.totalLearningEvents++;
    if (reward > 0) {
      this.stats.totalReward += reward;
    } else {
      this.stats.totalPunishment += Math.abs(reward);
    }
    
    // 1. 更新资格迹
    this.updateEligibilityTraces();
    
    // 2. 对每个有资格迹的神经元进行学习
    for (const [neuronId, eligibility] of this.eligibilityTraces) {
      const neuron = this.predictionLoop.getNeuron(neuronId);
      if (!neuron) continue;
      
      // 记录学习前状态
      beforeState.set(neuronId, neuron.actual.activation);
      
      // 计算TD误差
      const predictionError = predictionErrors.get(neuronId) || 0;
      const tdError = this.computeTDError(neuronId, reward, predictionError);
      
      // 奖励调制的权重更新
      const effectiveLearningRate = this.config.learningRate * 
        (1 + Math.abs(reward)) * // 奖励幅度调制
        eligibility;             // 资格迹调制
      
      // 更新神经元价值估计
      const valueUpdate = effectiveLearningRate * tdError;
      this.updateValueEstimate(neuronId, valueUpdate);
      
      // Hebbian学习（奖励调制）
      const updatedNeuron = hebbianLearning(neuron, reward * effectiveLearningRate);
      
      // 更新效用评分
      const withUsefulness = updateUsefulness(updatedNeuron, reward);
      
      // 如果有显著变化，标记为已调整
      if (Math.abs(valueUpdate) > this.config.valueUpdateThreshold) {
        adjustedNeurons.push(neuronId);
        
        // 记录学习事件
        const event: LearningEvent = {
          timestamp: now,
          sessionId,
          neuronIds: [neuronId],
          reward,
          predictionErrors: new Map([[neuronId, predictionError]]),
          beforeState,
          afterState: new Map([[neuronId, withUsefulness.actual.activation]]),
          learningType: reward > 0 ? 'reward' : 'punishment',
        };
        
        this.learningHistory.push(event);
      }
    }
    
    // 3. 基于学习结果调用预测循环的学习方法
    const baseResult = await this.predictionLoop.learnFromPredictionError(
      [], // 输入向量在预测循环中处理
      predictionErrors,
      reward
    );
    
    // 合并结果
    return {
      ...baseResult,
      adjustedNeurons: [...new Set([...adjustedNeurons, ...baseResult.adjustedNeurons])],
      summary: `奖励=${reward.toFixed(3)}，调整${adjustedNeurons.length}个神经元，${rewardSignal.reason}`,
    };
  }

  /**
   * 时序差分（TD）学习
   * 
   * TD误差 = 奖励 + γ * V(s') - V(s)
   */
  private computeTDError(
    neuronId: string,
    reward: number,
    predictionError: number
  ): number {
    const currentValue = this.valueEstimates.get(neuronId)?.value || 0.5;
    
    // 在这里，我们用预测误差作为"下一状态价值"的代理
    // 因为预测误差反映了新信息的价值
    const nextStateValue = 0.5 + predictionError * 0.5;
    
    // TD误差
    const tdError = reward + 
      this.config.discountFactor * nextStateValue - 
      currentValue;
    
    return tdError;
  }

  /**
   * 更新价值估计
   */
  private updateValueEstimate(neuronId: string, update: number): void {
    const current = this.valueEstimates.get(neuronId);
    
    if (current) {
      // 更新现有估计
      const newValue = Math.max(0, Math.min(1, current.value + update));
      
      // 更新置信度：更新次数越多，置信度越高
      const newConfidence = Math.min(0.95, current.confidence + 0.01);
      
      this.valueEstimates.set(neuronId, {
        ...current,
        value: newValue,
        confidence: newConfidence,
        lastUpdated: Date.now(),
      });
    } else {
      // 创建新估计
      this.valueEstimates.set(neuronId, {
        neuronId,
        value: 0.5 + update / 2,
        confidence: 0.3,
        source: 'direct_reward',
        lastUpdated: Date.now(),
      });
    }
  }

  /**
   * 更新资格迹
   * 
   * 资格迹记录了哪些神经元"应该"被学习
   * 最近活跃的神经元有更高的资格
   */
  private updateEligibilityTraces(): void {
    const decay = this.config.eligibilityDecay;
    
    // 衰减现有资格迹
    for (const [neuronId, eligibility] of this.eligibilityTraces) {
      const newEligibility = eligibility * decay;
      
      if (newEligibility < 0.01) {
        this.eligibilityTraces.delete(neuronId);
      } else {
        this.eligibilityTraces.set(neuronId, newEligibility);
      }
    }
    
    // 添加当前活跃神经元的资格
    const activeNeurons = this.predictionLoop.getActiveNeurons(0.3);
    
    for (const neuron of activeNeurons) {
      const currentEligibility = this.eligibilityTraces.get(neuron.id) || 0;
      const newEligibility = Math.max(
        currentEligibility,
        neuron.actual.activation  // 激活度作为初始资格
      );
      
      this.eligibilityTraces.set(neuron.id, newEligibility);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 反馈处理
  // ══════════════════════════════════════════════════════════════════

  /**
   * 处理完整反馈
   */
  async processFeedback(
    feedback: FeedbackSignals,
    predictionErrors: Map<string, number>,
    sessionId: string
  ): Promise<LearningResult> {
    // 计算奖励信号
    const collector = getFeedbackCollector();
    const rewardSignal = collector.computeRewardSignal(feedback);
    
    // 执行学习
    return this.learnFromReward(rewardSignal, predictionErrors, sessionId);
  }

  /**
   * 处理简单反馈（快速路径）
   */
  async processSimpleFeedback(
    type: 'positive' | 'negative' | 'neutral',
    sessionId: string
  ): Promise<void> {
    const rewardMap = {
      positive: 0.5,
      neutral: 0,
      negative: -0.5,
    };
    
    const reward = rewardMap[type];
    
    // 获取当前激活的神经元
    const activeNeurons = this.predictionLoop.getActiveNeurons(0.5);
    
    // 更新资格迹
    for (const neuron of activeNeurons) {
      this.eligibilityTraces.set(neuron.id, neuron.actual.activation);
    }
    
    // 更新价值估计
    for (const neuron of activeNeurons) {
      this.updateValueEstimate(neuron.id, reward * 0.1);
      
      const current = this.predictionLoop.getNeuron(neuron.id);
      if (current) {
        const updated = updateUsefulness(current, reward);
        // 这里需要直接更新预测循环中的神经元
        // 由于我们使用的是get方法，需要通过预测循环来更新
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 价值估计查询
  // ══════════════════════════════════════════════════════════════════

  /**
   * 获取神经元价值估计
   */
  getValueEstimate(neuronId: string): number {
    return this.valueEstimates.get(neuronId)?.value || 0.5;
  }

  /**
   * 获取高价值神经元
   */
  getHighValueNeurons(threshold: number = 0.7): ValueEstimate[] {
    return Array.from(this.valueEstimates.values())
      .filter(v => v.value > threshold)
      .sort((a, b) => b.value - a.value);
  }

  /**
   * 获取低价值神经元（可能是修剪候选）
   */
  getLowValueNeurons(threshold: number = 0.3): ValueEstimate[] {
    return Array.from(this.valueEstimates.values())
      .filter(v => v.value < threshold && v.confidence > 0.5)
      .sort((a, b) => a.value - b.value);
  }

  // ══════════════════════════════════════════════════════════════════
  // 学习监控
  // ══════════════════════════════════════════════════════════════════

  /**
   * 获取学习曲线
   */
  getLearningCurve(windowSize: number = 50): {
    rewards: number[];
    accuracies: number[];
  } {
    const events = this.learningHistory.slice(-windowSize);
    
    const rewards = events.map(e => e.reward);
    
    // 准确度：预测误差的负值
    const accuracies = events.map(e => {
      const errors = Array.from(e.predictionErrors.values());
      if (errors.length === 0) return 0.5;
      const avgError = errors.reduce((a, b) => a + Math.abs(b), 0) / errors.length;
      return 1 - avgError;
    });
    
    return { rewards, accuracies };
  }

  /**
   * 获取学习统计
   */
  getStats() {
    const valueArray = Array.from(this.valueEstimates.values());
    const avgValue = valueArray.length > 0
      ? valueArray.reduce((sum, v) => sum + v.value, 0) / valueArray.length
      : 0;
    
    return {
      ...this.stats,
      averageValue: avgValue,
      valueEstimateCount: this.valueEstimates.size,
      eligibilityTraceCount: this.eligibilityTraces.size,
      learningHistoryLength: this.learningHistory.length,
    };
  }

  /**
   * 检测学习停滞
   */
  detectLearningStagnation(windowSize: number = 100): boolean {
    if (this.learningHistory.length < windowSize) return false;
    
    const recentEvents = this.learningHistory.slice(-windowSize);
    
    // 检查最近的学习效果
    let totalEffect = 0;
    for (const event of recentEvents) {
      const beforeAvg = Array.from(event.beforeState.values())
        .reduce((a, b) => a + b, 0) / event.beforeState.size || 0;
      const afterAvg = Array.from(event.afterState.values())
        .reduce((a, b) => a + b, 0) / event.afterState.size || 0;
      
      totalEffect += Math.abs(afterAvg - beforeAvg);
    }
    
    const avgEffect = totalEffect / windowSize;
    
    // 如果平均效果非常小，说明学习停滞
    return avgEffect < 0.01;
  }

  // ══════════════════════════════════════════════════════════════════
  // 持久化
  // ══════════════════════════════════════════════════════════════════

  /**
   * 导出状态
   */
  exportState(): {
    valueEstimates: [string, ValueEstimate][];
    stats: {
      totalLearningEvents: number;
      totalReward: number;
      totalPunishment: number;
      averageValue: number;
    };
  } {
    return {
      valueEstimates: Array.from(this.valueEstimates.entries()),
      stats: this.stats,
    };
  }

  /**
   * 导入状态
   */
  importState(state: {
    valueEstimates: [string, ValueEstimate][];
    stats?: {
      totalLearningEvents: number;
      totalReward: number;
      totalPunishment: number;
      averageValue: number;
    };
  }): void {
    this.valueEstimates = new Map(state.valueEstimates);
    if (state.stats) {
      this.stats = state.stats;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

const rewardLearners = new Map<string, RewardLearner>();

/**
 * 获取用户的奖励学习器
 */
export function getRewardLearner(userIdOrLoop: string | PredictionLoop, config?: Partial<LearningConfig>): RewardLearner {
  // 支持两种调用方式：userId 或 PredictionLoop
  let userId: string;
  let predictionLoop: PredictionLoop;
  
  if (typeof userIdOrLoop === 'string') {
    userId = userIdOrLoop;
    const { getPredictionLoop } = require('./prediction-loop');
    predictionLoop = getPredictionLoop(userId);
  } else {
    predictionLoop = userIdOrLoop;
    userId = predictionLoop.userId;
  }
  
  if (!rewardLearners.has(userId)) {
    rewardLearners.set(userId, new RewardLearner(predictionLoop, config || {}));
  }
  return rewardLearners.get(userId)!;
}

/**
 * 清理用户的奖励学习器
 */
export function clearRewardLearner(userId: string): void {
  rewardLearners.delete(userId);
}

/**
 * 重置所有奖励学习器实例
 */
export function resetRewardLearner(): void {
  rewardLearners.clear();
}
