/**
 * 赫布学习 / STDP
 * 
 * 运行时学习机制：
 * - 基于时序依赖的权重调整
 * - 节点向量的动态更新
 * - 连接的强化和抑制
 */

import type { Connection } from '../types';
import { clamp } from '../utils/math';

/**
 * 学习配置
 */
export interface LearningConfig {
  /** 学习率 */
  learningRate: number;
  /** STDP时间窗口 */
  stdpWindow: number;
  /** 权重衰减率 */
  weightDecay: number;
  /** 最小权重 */
  minWeight: number;
  /** 最大权重 */
  maxWeight: number;
}

const DEFAULT_CONFIG: LearningConfig = {
  learningRate: 0.01,
  stdpWindow: 20, // 毫秒
  weightDecay: 0.001,
  minWeight: 0.01,
  maxWeight: 1.0,
};

/**
 * 赫布学习系统
 */
export class HebbianLearning {
  private config: LearningConfig;
  
  constructor(config?: Partial<LearningConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * STDP权重更新
   * 
   * 核心公式：
   * - 若 pre 先于 post 激活：Δw = +learningRate * f(Δt)
   * - 若 post 先于 pre 激活：Δw = -learningRate * f(Δt)
   * 
   * 其中 f(Δt) = exp(-|Δt|/τ)
   */
  updateWeightSTDP(
    connection: Connection,
    preActivationTime: number,
    postActivationTime: number
  ): number {
    const dt = preActivationTime - postActivationTime;
    const absDt = Math.abs(dt);
    
    // STDP函数：时间差越小，学习效应越强
    const f = Math.exp(-absDt / this.config.stdpWindow);
    
    let deltaW: number;
    
    if (dt < 0) {
      // pre 先于 post 激活：长时程增强 (LTP)
      deltaW = this.config.learningRate * f;
    } else {
      // post 先于 pre 激活：长时程抑制 (LTD)
      deltaW = -this.config.learningRate * f;
    }
    
    // 应用权重衰减
    const decayedWeight = connection.weight * (1 - this.config.weightDecay);
    
    // 更新权重
    const newWeight = clamp(
      decayedWeight + deltaW,
      this.config.minWeight,
      this.config.maxWeight
    );
    
    connection.weight = newWeight;
    
    return newWeight;
  }
  
  /**
   * 赫布学习权重更新
   * 
   * 经典赫布规则：
   * Δw = learningRate * preActivation * postActivation
   */
  updateWeightHebbian(
    connection: Connection,
    preActivation: number,
    postActivation: number
  ): number {
    // 赫布规则：共同激活的节点连接增强
    const deltaW = this.config.learningRate * preActivation * postActivation;
    
    // 应用权重衰减
    const decayedWeight = connection.weight * (1 - this.config.weightDecay);
    
    // 更新权重
    const newWeight = clamp(
      decayedWeight + deltaW,
      this.config.minWeight,
      this.config.maxWeight
    );
    
    connection.weight = newWeight;
    
    return newWeight;
  }
  
  /**
   * 更新节点向量
   * 
   * 基于输入调整 Q/K/V 向量
   */
  updateNodeVectors(
    vectors: { query: number[]; key: number[]; value: number[] },
    inputVector: number[],
    targetVector?: number[]
  ): void {
    const lr = this.config.learningRate;
    
    // 更新 Query 向量：使其更接近输入
    for (let i = 0; i < vectors.query.length; i++) {
      vectors.query[i] += lr * (inputVector[i] - vectors.query[i]);
    }
    
    // 更新 Key 向量
    if (targetVector) {
      for (let i = 0; i < vectors.key.length; i++) {
        vectors.key[i] += lr * (targetVector[i] - vectors.key[i]);
      }
    }
    
    // Value 向量可以保持相对稳定，或根据任务调整
  }
  
  /**
   * 计算STDP学习信号
   */
  computeSTDPSignal(deltaT: number): number {
    const absDeltaT = Math.abs(deltaT);
    return Math.exp(-absDeltaT / this.config.stdpWindow);
  }
  
  /**
   * 批量更新连接权重
   */
  batchUpdateWeights(
    connections: Connection[],
    activationTimes: Map<string, number>
  ): void {
    for (const conn of connections) {
      const preTime = activationTimes.get(conn.from);
      const postTime = activationTimes.get(conn.to);
      
      if (preTime !== undefined && postTime !== undefined) {
        this.updateWeightSTDP(conn, preTime, postTime);
      }
    }
  }
}

/**
 * 创建赫布学习系统
 */
export function createHebbianLearning(config?: Partial<LearningConfig>): HebbianLearning {
  return new HebbianLearning(config);
}
