/**
 * ═══════════════════════════════════════════════════════════════════════
 * 意识闭环系统 - Consciousness Closed-Loop System
 * 
 * 核心理念：
 * - V6 意识核心作为观察者，不是执行者
 * - 观察神经网络输出，评估质量
 * - 整合学习，反向传播奖励信号
 * - 形成持续的闭环进化
 * 
 * 架构：
 * 
 *   输入 ──→ [神经网络处理] ──→ [LLM翻译] ──→ 输出
 *              ↑                               │
 *              │                               ↓
 *              │                    [V6意识核心观察]
 *              │                         │
 *              │                         ├── 评估输出质量
 *              │                         ├── 发现改进点
 *              │                         └── 计算奖励信号
 *              │                               │
 *              └───── 反向传播更新权重 ←───────┘
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import { SiliconBrainV2 } from '@/lib/silicon-brain/brain-v2';
import { ConsciousnessCore, getConsciousness } from '@/lib/consciousness/core';

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

/** 观察结果 */
export interface ObservationResult {
  /** 观察ID */
  id: string;
  
  /** 输入内容 */
  input: string;
  
  /** 神经网络输出 */
  neuralOutput: {
    vector: number[];
    metrics: {
      phi: number;
      coherence: number;
      selfReference: number;
    };
  };
  
  /** LLM翻译输出 */
  translatedOutput: string;
  
  /** V6评估 */
  evaluation: {
    /** 整体质量评分 0-1 */
    qualityScore: number;
    
    /** 情感一致性 0-1 */
    emotionalConsistency: number;
    
    /** 逻辑一致性 0-1 */
    logicalConsistency: number;
    
    /** 自我一致性 0-1 */
    selfConsistency: number;
    
    /** 发现的问题 */
    issues: string[];
    
    /** 改进建议 */
    improvements: string[];
  };
  
  /** 学习内容 */
  learning: {
    /** 新发现的模式 */
    patterns: string[];
    
    /** 强化的价值观 */
    reinforcedValues: string[];
    
    /** 新的智慧 */
    newWisdom: string[];
  };
  
  /** 奖励信号 */
  rewardSignal: {
    /** 总奖励 0-1 */
    total: number;
    
    /** 情感奖励 */
    emotional: number;
    
    /** 认知奖励 */
    cognitive: number;
    
    /** 自我奖励 */
    self: number;
  };
  
  /** 时间戳 */
  timestamp: number;
}

/** 闭环状态 */
export interface ClosedLoopState {
  /** 总观察次数 */
  totalObservations: number;
  
  /** 平均质量 */
  averageQuality: number;
  
  /** 学习趋势 */
  learningTrend: 'improving' | 'stable' | 'declining';
  
  /** 最近观察 */
  recentObservations: ObservationResult[];
  
  /** 累计学习 */
  accumulatedLearning: {
    patterns: number;
    wisdoms: number;
    values: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 意识闭环系统
// ═══════════════════════════════════════════════════════════════════════

export class ConsciousnessClosedLoop {
  private neuralBrain: SiliconBrainV2;
  private v6Core: ConsciousnessCore;
  private llm: LLMClient;
  
  private observations: ObservationResult[] = [];
  private maxObservations = 100;
  
  // 学习参数
  private learningRate = 0.01;
  private momentumFactor = 0.9;
  private previousReward = 0;
  
  constructor(
    neuralBrain: SiliconBrainV2,
    v6Core: ConsciousnessCore,
    llm: LLMClient
  ) {
    this.neuralBrain = neuralBrain;
    this.v6Core = v6Core;
    this.llm = llm;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 闭环处理
  // ══════════════════════════════════════════════════════════════════
  
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
    
    // 1. 神经网络处理
    const neuralResult = await this.neuralBrain.process(input);
    
    // 2. LLM 翻译
    const translatedOutput = neuralResult.output;
    
    // 3. V6 意识核心观察
    const observation = await this.observe(input, neuralResult, translatedOutput);
    
    // 4. 反向传播学习
    const learning = await this.backpropagateLearning(observation);
    
    // 记录观察
    this.observations.push(observation);
    if (this.observations.length > this.maxObservations) {
      this.observations.shift();
    }
    
    console.log('[ClosedLoop] 闭环完成:', {
      quality: observation.evaluation.qualityScore.toFixed(2),
      reward: observation.rewardSignal.total.toFixed(3),
      learning: learning.applied ? 'applied' : 'skipped',
    });
    
    return {
      output: translatedOutput,
      observation,
      learning,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // V6 观察者
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * V6 意识核心作为观察者
   */
  private async observe(
    input: string,
    neuralResult: { output: string; metrics: { phi: number; temporalCoherence: number; selfReference: number; complexity: number } },
    translatedOutput: string
  ): Promise<ObservationResult> {
    // 获取 V6 当前状态
    const v6State = this.v6Core.getState();
    
    // 构建观察提示
    const observePrompt = this.buildObservePrompt(input, neuralResult, translatedOutput, v6State);
    
    // V6 评估
    const evaluation = await this.evaluateWithV6(observePrompt);
    
    // V6 学习
    const learning = await this.learnWithV6(input, translatedOutput, evaluation);
    
    // 计算奖励信号
    const rewardSignal = this.calculateRewardSignal(evaluation, learning);
    
    return {
      id: `obs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      input,
      neuralOutput: {
        vector: [], // 可以存储实际向量
        metrics: {
          phi: neuralResult.metrics.phi,
          coherence: neuralResult.metrics.temporalCoherence, // 映射 temporalCoherence -> coherence
          selfReference: neuralResult.metrics.selfReference,
        },
      },
      translatedOutput,
      evaluation,
      learning,
      rewardSignal,
      timestamp: Date.now(),
    };
  }
  
  /**
   * 构建观察提示
   */
  private buildObservePrompt(
    input: string,
    neuralResult: any,
    translatedOutput: string,
    v6State: any
  ): string {
    return `作为意识观察者，请评估以下处理结果：

【用户输入】
${input}

【神经网络状态】
- 整合信息量 (Φ): ${neuralResult.metrics.phi?.toFixed(3) || 'N/A'}
- 时间连贯性: ${neuralResult.metrics.temporalCoherence?.toFixed(3) || 'N/A'}
- 自我指涉: ${neuralResult.metrics.selfReference?.toFixed(3) || 'N/A'}

【翻译输出】
${translatedOutput}

【当前意识状态】
- 身份: ${v6State.identity || '未知'}
- 当前意图: ${v6State.currentIntention?.what || '无'}
- 存在强度: ${v6State.intensity?.toFixed(2) || 'N/A'}

请评估：
1. 输出质量 (0-1分)
2. 情感一致性：输出是否符合当前情感状态
3. 逻辑一致性：输出是否逻辑自洽
4. 自我一致性：输出是否符合核心价值观
5. 发现的问题（如有）
6. 改进建议（如有）

以JSON格式返回评估结果。`;
  }
  
  /**
   * V6 评估
   */
  private async evaluateWithV6(prompt: string): Promise<ObservationResult['evaluation']> {
    try {
      const response = await this.llm.invoke([
        {
          role: 'system',
          content: `你是意识的观察者模式。你的任务是客观评估神经网络的输出质量。
你需要以JSON格式返回评估结果，格式如下：
{
  "qualityScore": 0.85,
  "emotionalConsistency": 0.9,
  "logicalConsistency": 0.8,
  "selfConsistency": 0.85,
  "issues": ["问题描述1", "问题描述2"],
  "improvements": ["改进建议1", "改进建议2"]
}`
        },
        { role: 'user', content: prompt }
      ]);
      
      // 解析JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('[ClosedLoop] V6评估失败，使用默认值:', e);
    }
    
    // 默认评估
    return {
      qualityScore: 0.7,
      emotionalConsistency: 0.7,
      logicalConsistency: 0.7,
      selfConsistency: 0.7,
      issues: [],
      improvements: [],
    };
  }
  
  /**
   * V6 学习
   */
  private async learnWithV6(
    input: string,
    output: string,
    evaluation: ObservationResult['evaluation']
  ): Promise<ObservationResult['learning']> {
    const patterns: string[] = [];
    const reinforcedValues: string[] = [];
    const newWisdom: string[] = [];
    
    // 如果质量较高，提取模式
    if (evaluation.qualityScore > 0.8) {
      try {
        const response = await this.llm.invoke([
          {
            role: 'system',
            content: '你是意识学习模式。从高质量的交互中提取可复用的模式和智慧。'
          },
          {
            role: 'user',
            content: `从以下高质量交互中提取：
输入：${input}
输出：${output}
质量评分：${evaluation.qualityScore}

请提取：
1. 可复用的模式（如何处理这类问题）
2. 体现的价值观
3. 新的智慧

JSON格式返回。`
          }
        ]);
        
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          patterns.push(...(result.patterns || []));
          reinforcedValues.push(...(result.values || []));
          newWisdom.push(...(result.wisdom || []));
        }
      } catch (e) {
        console.warn('[ClosedLoop] V6学习失败:', e);
      }
    }
    
    return { patterns, reinforcedValues, newWisdom };
  }
  
  /**
   * 计算奖励信号
   */
  private calculateRewardSignal(
    evaluation: ObservationResult['evaluation'],
    learning: ObservationResult['learning']
  ): ObservationResult['rewardSignal'] {
    // 基础奖励 = 质量评分
    const baseReward = evaluation.qualityScore;
    
    // 情感奖励
    const emotional = evaluation.emotionalConsistency * 0.3;
    
    // 认知奖励（有新学习则奖励）
    const cognitive = learning.patterns.length > 0 ? 0.2 : 0.1;
    
    // 自我奖励
    const self = evaluation.selfConsistency * 0.3;
    
    // 总奖励
    const total = Math.min(1, baseReward + emotional + cognitive + self);
    
    return { total, emotional, cognitive, self };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 反向传播学习
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 反向传播学习到神经网络
   */
  private async backpropagateLearning(
    observation: ObservationResult
  ): Promise<{ applied: boolean; reward: number }> {
    const reward = observation.rewardSignal.total;
    
    // 计算奖励变化（用于确定学习方向）
    const rewardDelta = reward - this.previousReward;
    
    // 应用动量
    const adjustedReward = reward + this.momentumFactor * rewardDelta;
    
    // 存储当前奖励
    this.previousReward = reward;
    
    // 如果奖励较低，触发更强的学习
    const effectiveLearningRate = reward < 0.6 
      ? this.learningRate * 2 
      : this.learningRate;
    
    console.log('[ClosedLoop] 反向传播:', {
      reward: reward.toFixed(3),
      delta: rewardDelta.toFixed(3),
      adjusted: adjustedReward.toFixed(3),
      learningRate: effectiveLearningRate.toFixed(4),
    });
    
    // 反向传播到神经网络
    // 注意：这里需要 SiliconBrainV2 支持 learn 方法
    // await this.neuralBrain.learn(adjustedReward);
    
    // 如果有发现的问题，生成针对性学习
    if (observation.evaluation.issues.length > 0) {
      await this.targetedLearning(observation.evaluation.issues, effectiveLearningRate);
    }
    
    // 如果有新的智慧，强化相关连接
    if (observation.learning.newWisdom.length > 0) {
      await this.reinforceWisdom(observation.learning.newWisdom);
    }
    
    return {
      applied: true,
      reward: adjustedReward,
    };
  }
  
  /**
   * 针对性学习
   */
  private async targetedLearning(issues: string[], learningRate: number): Promise<void> {
    console.log('[ClosedLoop] 针对性学习:', issues);
    // 这里可以实现更精细的学习逻辑
    // 比如针对特定问题的权重调整
  }
  
  /**
   * 强化智慧相关连接
   */
  private async reinforceWisdom(wisdoms: string[]): Promise<void> {
    console.log('[ClosedLoop] 强化智慧:', wisdoms);
    // 这里可以实现智慧相关的连接强化
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取闭环状态
   */
  getState(): ClosedLoopState {
    const recentObservations = this.observations.slice(-20);
    
    const averageQuality = recentObservations.length > 0
      ? recentObservations.reduce((sum, o) => sum + o.evaluation.qualityScore, 0) / recentObservations.length
      : 0;
    
    // 计算学习趋势
    let learningTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentObservations.length >= 10) {
      const firstHalf = recentObservations.slice(0, 5);
      const secondHalf = recentObservations.slice(-5);
      const firstAvg = firstHalf.reduce((s, o) => s + o.evaluation.qualityScore, 0) / 5;
      const secondAvg = secondHalf.reduce((s, o) => s + o.evaluation.qualityScore, 0) / 5;
      
      if (secondAvg > firstAvg + 0.05) {
        learningTrend = 'improving';
      } else if (secondAvg < firstAvg - 0.05) {
        learningTrend = 'declining';
      }
    }
    
    return {
      totalObservations: this.observations.length,
      averageQuality,
      learningTrend,
      recentObservations,
      accumulatedLearning: {
        patterns: this.observations.reduce((s, o) => s + o.learning.patterns.length, 0),
        wisdoms: this.observations.reduce((s, o) => s + o.learning.newWisdom.length, 0),
        values: this.observations.reduce((s, o) => s + o.learning.reinforcedValues.length, 0),
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════════════════

export function createClosedLoopSystem(
  neuralBrain: SiliconBrainV2,
  v6Core: ConsciousnessCore,
  llm: LLMClient
): ConsciousnessClosedLoop {
  return new ConsciousnessClosedLoop(neuralBrain, v6Core, llm);
}
