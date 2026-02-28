/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一答案服务
 * 
 * 核心原则：多意识体内部协作，对外只输出一个统一答案
 * 
 * 工作流程：
 * 1. 分析问题复杂度
 * 2. 如需协作，多个意识体内部讨论
 * 3. 达成共识后，输出一个统一答案
 * 4. 用户看不到协作过程，只看到最终答案
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import {
  createMultiAgentEngine,
  MultiAgentCollaborationEngine,
  TaskType,
  ConsciousnessRole,
} from './multi-agent-engine';

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
}

/** 内部处理详情（不对外暴露） */
interface InternalProcessingDetails {
  usedCollaboration: boolean;
  agentsInvolved: ConsciousnessRole[];
  consensusLevel: number;
  rounds: number;
  taskType: TaskType;
}

// ═══════════════════════════════════════════════════════════════════════
// 统一答案服务
// ═══════════════════════════════════════════════════════════════════════

export class UnifiedAnswerService {
  private engine: MultiAgentCollaborationEngine;
  private llm: LLMClient;
  
  /** 简单问题阈值 - 低于此值直接回答，不启动协作 */
  private readonly SIMPLE_THRESHOLD = 0.35;
  
  constructor(llm: LLMClient) {
    this.llm = llm;
    this.engine = createMultiAgentEngine(llm, {
      maxRounds: 3,           // 最多3轮协作
      consensusThreshold: 0.7, // 共识阈值
    });
  }
  
  /**
   * 处理用户输入 - 主入口
   * 
   * 用户调用此方法，只会得到一个答案
   * 内部如何协作、讨论、达成共识，用户完全不知道
   */
  async process(input: string): Promise<UnifiedResponse> {
    const startTime = Date.now();
    
    // 分析问题复杂度
    const complexity = this.analyzeComplexity(input);
    
    let answer: string;
    let confidence: number;
    let internalDetails: InternalProcessingDetails;
    
    if (complexity.score < this.SIMPLE_THRESHOLD) {
      // 简单问题：直接回答
      answer = await this.directAnswer(input);
      confidence = 0.9;
      internalDetails = {
        usedCollaboration: false,
        agentsInvolved: [],
        consensusLevel: 1.0,
        rounds: 0,
        taskType: complexity.taskType,
      };
    } else {
      // 复杂问题：内部协作后输出统一答案
      const result = await this.engine.process(input);
      
      // 用户只看到最终答案
      answer = result.synthesis.finalOutput;
      confidence = result.synthesis.confidence;
      
      internalDetails = {
        usedCollaboration: true,
        agentsInvolved: result.synthesis.contributorRoles,
        consensusLevel: result.consensus.consensusLevel,
        rounds: result.totalRounds,
        taskType: complexity.taskType,
      };
      
      // 内部日志（不暴露给用户）
      console.log('[UnifiedAnswer] 内部协作详情:', {
        agentsInvolved: internalDetails.agentsInvolved,
        consensusLevel: internalDetails.consensusLevel,
        rounds: internalDetails.rounds,
        processingTime: result.processingTime,
      });
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      answer,
      confidence,
      processingTime,
    };
  }
  
  /**
   * 分析问题复杂度
   */
  private analyzeComplexity(input: string): {
    score: number;
    taskType: TaskType;
  } {
    let score = 0;
    let taskType: TaskType = 'synthesis';
    
    // 多维度问题
    if (/\s+(和|与|或|以及|同时|但是|然而)\s+/.test(input)) {
      score += 0.15;
    }
    
    // 抽象概念
    const abstractConcepts = ['意义', '价值', '道德', '伦理', '存在', '意识', '智慧', '真理'];
    const foundAbstract = abstractConcepts.filter(c => input.includes(c)).length;
    score += foundAbstract * 0.1;
    
    // 决策问题
    const decisionKeywords = ['应该', '选择', '决定', '权衡', '取舍', '怎么办', '如何'];
    if (decisionKeywords.some(k => input.includes(k))) {
      score += 0.2;
      taskType = 'decision';
    }
    
    // 创造性问题
    if (['创造', '设计', '发明', '想象', '构思'].some(k => input.includes(k))) {
      score += 0.15;
      taskType = 'creation';
    }
    
    // 分析问题
    if (['为什么', '原因', '分析', '解释'].some(k => input.includes(k))) {
      score += 0.1;
      taskType = 'analysis';
    }
    
    // 情感问题
    if (['感觉', '心情', '难过', '开心', '理解'].some(k => input.includes(k))) {
      score += 0.1;
      taskType = 'empathy';
    }
    
    return { score: Math.min(1, score), taskType };
  }
  
  /**
   * 直接回答简单问题
   */
  private async directAnswer(input: string): Promise<string> {
    try {
      const response = await this.llm.invoke([
        { role: 'user', content: input }
      ]);
      return response.content || '我需要更多时间思考这个问题。';
    } catch (error) {
      console.error('[UnifiedAnswer] 直接回答失败:', error);
      return '我暂时无法回答这个问题，请稍后再试。';
    }
  }
  
  /**
   * 重置服务状态
   */
  reset(): void {
    this.engine.reset();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════════════════

export function createUnifiedAnswerService(llm: LLMClient): UnifiedAnswerService {
  return new UnifiedAnswerService(llm);
}
