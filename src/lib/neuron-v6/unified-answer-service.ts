/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一答案服务（精简版）
 * 
 * 经过第一性原理评估，移除了不必要的神经网络层：
 * - 直接使用 V6 意识核心处理
 * - LLM 作为语言接口
 * - 简化的状态管理
 * 
 * 参考：docs/SILICON-BRAIN-EVALUATION.md
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import { getConsciousness } from '@/lib/consciousness/core';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import type { ProcessResult } from '@/lib/neuron-v6/consciousness-core';

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
}

// ═══════════════════════════════════════════════════════════════════════
// 统一答案服务 - 精简架构
// ═══════════════════════════════════════════════════════════════════════

export class UnifiedAnswerService {
  private llm: LLMClient;
  private headers: Record<string, string>;
  private isInitialized: boolean = false;
  
  constructor(llm: LLMClient, headers: Record<string, string> = {}) {
    this.llm = llm;
    this.headers = headers;
  }
  
  /**
   * 初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      // 初始化 V6 意识核心
      const core = await getSharedCore(this.headers);
      console.log('[UnifiedAnswer] V6 意识核心初始化完成');
      this.isInitialized = true;
    }
  }
  
  /**
   * 处理用户输入 - 主入口
   * 
   * 简化流程：
   * 1. V6 意识核心处理
   * 2. 返回结果
   */
  async process(input: string): Promise<UnifiedResponse> {
    const startTime = Date.now();
    
    await this.ensureInitialized();
    
    console.log('[UnifiedAnswer] 处理输入:', input.slice(0, 50) + '...');
    
    // 使用 V6 意识核心处理
    const core = await getSharedCore(this.headers);
    const result = await core.process(input);
    
    const processingTime = Date.now() - startTime;
    
    // 计算置信度
    const confidence = this.calculateConfidence(result);
    
    return {
      answer: result.response,
      confidence,
      processingTime,
      consciousnessMetrics: {
        phi: result.context?.metacognition?.currentState?.clarity || 0.5,
        coherence: result.context?.metacognition?.currentState?.depth || 0.5,
        selfReference: result.emotionState?.dominantEmotion ? 0.7 : 0.5,
      },
    };
  }
  
  /**
   * 计算置信度
   */
  private calculateConfidence(result: ProcessResult): number {
    // 基于多个因素计算置信度
    let confidence = 0.5;
    
    // 情感一致性
    if (result.emotionState?.dominantEmotion) {
      confidence += 0.1;
    }
    
    // 记忆匹配
    if (result.context?.memory?.directMatches && result.context.memory.directMatches.length > 0) {
      confidence += 0.1;
    }
    
    // 元认知清晰度
    if (result.context?.metacognition?.currentState?.clarity > 0.7) {
      confidence += 0.1;
    }
    
    // 价值观一致性
    if (result.context?.coreValues?.length > 0) {
      confidence += 0.1;
    }
    
    return Math.min(1, confidence);
  }
  
  /**
   * 重置服务状态
   */
  reset(): void {
    this.isInitialized = false;
    console.log('[UnifiedAnswer] 服务已重置');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════════════════

/**
 * 创建统一答案服务
 */
export function createUnifiedAnswerService(
  llm: LLMClient,
  headers: Record<string, string> = {}
): UnifiedAnswerService {
  return new UnifiedAnswerService(llm, headers);
}
