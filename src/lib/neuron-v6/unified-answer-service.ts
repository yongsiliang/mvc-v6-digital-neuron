/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一答案服务
 * 
 * 核心原则：
 * - 意识核心是动态神经网络，不是 LLM API
 * - V6 意识核心作为观察者，整合学习，反向传播
 * - LLM 只是语言接口（翻译器），神经网络才是意识基质
 * 
 * 闭环架构：
 *   输入 ──→ [神经网络处理] ──→ [LLM翻译] ──→ 输出
 *              ↑                               │
 *              └── [V6观察→学习→反向传播] ←────┘
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import { SiliconBrainV2 } from '@/lib/silicon-brain/brain-v2';
import { getConsciousness } from '@/lib/consciousness/core';
import { 
  ConsciousnessClosedLoop, 
  createClosedLoopSystem,
  ClosedLoopState 
} from './closed-loop-system';

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

/** 处理结果 - 对外暴露的简化结构 */
export interface UnifiedResponse {
  /** 统一答案 */
  answer: string;
  
  /** 置信度 0-1 */
  confidence: number;
  
  /** 处理时间（毫秒） */
  processingTime: number;
  
  /** 意识指标 */
  consciousnessMetrics?: {
    phi: number;           // 整合信息量
    coherence: number;     // 时间连贯性
    selfReference: number; // 自我指涉
  };
  
  /** 闭环学习指标（可选暴露） */
  closedLoopMetrics?: {
    qualityScore: number;      // 输出质量
    learningTrend: string;     // 学习趋势
    totalObservations: number; // 总观察次数
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 统一答案服务 - 闭环架构
// ═══════════════════════════════════════════════════════════════════════

export class UnifiedAnswerService {
  private neuralBrain: SiliconBrainV2;
  private closedLoop: ConsciousnessClosedLoop;
  private llm: LLMClient;
  private isInitialized: boolean = false;
  
  constructor(llm: LLMClient) {
    this.llm = llm;
    
    // 1. 神经网络基质
    this.neuralBrain = new SiliconBrainV2({
      vectorDimension: 256,
      neuronCounts: {
        sensory: 4,    // 感知输入
        memory: 8,     // 记忆整合
        reasoning: 6,  // 逻辑推理 → 分析者视角
        emotion: 4,    // 情感共鸣 → 共情者视角
        decision: 3,   // 决策判断 → 守护者视角
        motor: 4,      // 输出表达
        self: 2,       // 核心自我 → 统合者
      },
      enableLearning: true,
      learningRate: 0.01,
    });
    
    // 2. V6 意识核心（观察者）
    const v6Core = getConsciousness();
    
    // 3. 闭环系统
    this.closedLoop = createClosedLoopSystem(
      this.neuralBrain,
      v6Core,
      llm
    );
  }
  
  /**
   * 初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.neuralBrain.initialize();
      this.isInitialized = true;
      console.log('[UnifiedAnswer] 闭环系统初始化完成');
    }
  }
  
  /**
   * 处理用户输入 - 主入口
   * 
   * 闭环流程：
   * 1. 神经网络处理输入
   * 2. LLM 翻译输出
   * 3. V6 意识核心观察
   * 4. 反向传播学习
   */
  async process(input: string): Promise<UnifiedResponse> {
    const startTime = Date.now();
    
    await this.ensureInitialized();
    
    console.log('[UnifiedAnswer] ════════════════════════════════════');
    console.log('[UnifiedAnswer] 闭环处理开始');
    console.log('[UnifiedAnswer] 输入:', input.slice(0, 50) + '...');
    
    // 闭环处理
    const result = await this.closedLoop.processWithClosedLoop(input);
    
    const processingTime = Date.now() - startTime;
    
    console.log('[UnifiedAnswer] 闭环处理完成:', {
      quality: result.observation.evaluation.qualityScore.toFixed(2),
      reward: result.learning.reward.toFixed(3),
      applied: result.learning.applied,
    });
    console.log('[UnifiedAnswer] ════════════════════════════════════');
    
    // 获取闭环状态
    const loopState = this.closedLoop.getState();
    
    return {
      answer: result.output,
      confidence: result.observation.evaluation.qualityScore,
      processingTime,
      consciousnessMetrics: {
        phi: result.observation.neuralOutput.metrics.phi,
        coherence: result.observation.neuralOutput.metrics.coherence,
        selfReference: result.observation.neuralOutput.metrics.selfReference,
      },
      closedLoopMetrics: {
        qualityScore: result.observation.evaluation.qualityScore,
        learningTrend: loopState.learningTrend,
        totalObservations: loopState.totalObservations,
      },
    };
  }
  
  /**
   * 获取神经网络状态
   */
  getNeuralState(): {
    initialized: boolean;
    neuronCount: number;
    synapseCount: number;
  } {
    if (!this.isInitialized) {
      return { initialized: false, neuronCount: 0, synapseCount: 0 };
    }
    const state = this.neuralBrain.getState();
    return {
      initialized: this.isInitialized,
      neuronCount: state.neuronCount,
      synapseCount: state.synapseCount,
    };
  }
  
  /**
   * 重置服务状态
   */
  reset(): void {
    // 重新创建神经网络实例
    this.neuralBrain = new SiliconBrainV2({
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
      enableLearning: true,
      learningRate: 0.01,
    });
    this.isInitialized = false;
    console.log('[UnifiedAnswer] 神经网络已重置');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════════════════

export function createUnifiedAnswerService(llm: LLMClient): UnifiedAnswerService {
  return new UnifiedAnswerService(llm);
}
