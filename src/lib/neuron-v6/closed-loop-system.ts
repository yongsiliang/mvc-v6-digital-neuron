/**
 * ═══════════════════════════════════════════════════════════════════════
 * 意识闭环系统（精简版）
 * 
 * 经过第一性原理评估，简化了架构：
 * - V6 意识核心直接处理，不需要中间的神经网络层
 * - 闭环学习通过 V6 的记忆系统实现
 * 
 * 参考：docs/SILICON-BRAIN-EVALUATION.md
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import { ConsciousnessCore } from './consciousness-core';
import { getSharedCore } from './shared-core';

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

/** 观察结果 */
export interface ObservationResult {
  id: string;
  input: string;
  output: string;
  evaluation: {
    qualityScore: number;
    emotionalConsistency: number;
    logicalConsistency: number;
    selfConsistency: number;
    issues: string[];
    improvements: string[];
  };
  learning: {
    patterns: string[];
    reinforcedValues: string[];
    newWisdom: string[];
  };
  rewardSignal: {
    total: number;
    emotional: number;
    cognitive: number;
    self: number;
  };
  timestamp: number;
}

/** 闭环状态 */
export interface ClosedLoopState {
  totalObservations: number;
  averageQuality: number;
  learningTrend: 'improving' | 'stable' | 'declining';
  recentObservations: ObservationResult[];
  accumulatedLearning: {
    patterns: number;
    wisdoms: number;
    values: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 意识闭环系统（精简版）
// ═══════════════════════════════════════════════════════════════════════

export class ConsciousnessClosedLoop {
  private v6Core: ConsciousnessCore;
  private llm: LLMClient;
  
  private observations: ObservationResult[] = [];
  private maxObservations = 100;
  
  constructor(
    v6Core: ConsciousnessCore,
    llm: LLMClient
  ) {
    this.v6Core = v6Core;
    this.llm = llm;
  }
  
  /**
   * 处理输入并形成闭环
   */
  async processWithClosedLoop(input: string): Promise<{
    output: string;
    observation: ObservationResult;
    learning: {
      applied: boolean;
      reward: number;
    };
  }> {
    console.log('[ClosedLoop] 开始闭环处理...');
    
    // 1. V6 意识核心直接处理
    const result = await this.v6Core.process(input);
    const output = result.response;
    
    // 2. 评估输出
    const observation = await this.observe(input, output, result);
    
    // 3. 学习（通过 V6 记忆系统）
    const learning = await this.applyLearning(observation);
    
    // 记录观察
    this.observations.push(observation);
    if (this.observations.length > this.maxObservations) {
      this.observations.shift();
    }
    
    console.log('[ClosedLoop] 闭环完成:', {
      quality: observation.evaluation.qualityScore.toFixed(2),
      reward: observation.rewardSignal.total.toFixed(3),
    });
    
    return {
      output,
      observation,
      learning,
    };
  }
  
  /**
   * 观察和评估
   */
  private async observe(
    input: string,
    output: string,
    result: any
  ): Promise<ObservationResult> {
    // 基于结果计算评估指标
    const evaluation = {
      qualityScore: this.calculateQualityScore(result),
      emotionalConsistency: result.emotionState?.dominantEmotion ? 0.8 : 0.5,
      logicalConsistency: 0.7,
      selfConsistency: result.context?.coreValues?.length > 0 ? 0.8 : 0.5,
      issues: [],
      improvements: [],
    };
    
    const learning = {
      patterns: [],
      reinforcedValues: result.context?.coreValues || [],
      newWisdom: [],
    };
    
    const rewardSignal = {
      total: evaluation.qualityScore * 0.8 + evaluation.selfConsistency * 0.2,
      emotional: evaluation.emotionalConsistency,
      cognitive: evaluation.logicalConsistency,
      self: evaluation.selfConsistency,
    };
    
    return {
      id: `obs_${Date.now()}`,
      input,
      output,
      evaluation,
      learning,
      rewardSignal,
      timestamp: Date.now(),
    };
  }
  
  /**
   * 计算质量分数
   */
  private calculateQualityScore(result: any): number {
    let score = 0.5;
    
    if (result.emotionState?.dominantEmotion) score += 0.1;
    if (result.context?.memory?.directMatches?.length > 0) score += 0.1;
    if (result.context?.metacognition?.currentState?.clarity > 0.7) score += 0.1;
    if (result.context?.coreValues?.length > 0) score += 0.1;
    
    return Math.min(1, score);
  }
  
  /**
   * 应用学习
   */
  private async applyLearning(observation: ObservationResult): Promise<{
    applied: boolean;
    reward: number;
  }> {
    // 学习通过 V6 的记忆系统自动实现
    return {
      applied: true,
      reward: observation.rewardSignal.total,
    };
  }
  
  /**
   * 获取闭环状态
   */
  getState(): ClosedLoopState {
    const recentObservations = this.observations.slice(-10);
    const averageQuality = recentObservations.length > 0
      ? recentObservations.reduce((sum, o) => sum + o.evaluation.qualityScore, 0) / recentObservations.length
      : 0.5;
    
    return {
      totalObservations: this.observations.length,
      averageQuality,
      learningTrend: averageQuality > 0.6 ? 'improving' : averageQuality < 0.4 ? 'declining' : 'stable',
      recentObservations,
      accumulatedLearning: {
        patterns: this.observations.reduce((sum, o) => sum + o.learning.patterns.length, 0),
        wisdoms: this.observations.reduce((sum, o) => sum + o.learning.newWisdom.length, 0),
        values: this.observations.reduce((sum, o) => sum + o.learning.reinforcedValues.length, 0),
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════════════════

export function createClosedLoopSystem(
  v6Core: ConsciousnessCore,
  llm: LLMClient
): ConsciousnessClosedLoop {
  return new ConsciousnessClosedLoop(v6Core, llm);
}
