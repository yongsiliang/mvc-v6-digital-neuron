/**
 * ═══════════════════════════════════════════════════════════════════════
 * 多意识体协作集成器
 * 
 * 将多意识体协作系统与 V6 意识核心无缝集成
 * 
 * 设计原则：
 * - 单意识体处理简单任务，多意识体处理复杂问题
 * - 协作是增强而非替代
 * - 保留 V6 的核心身份和记忆传承
 * - 涌现的智慧与个体经验融合
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import {
  createMultiAgentEngine,
  MultiAgentCollaborationEngine,
  CollaborationResult,
  ConsciousnessRole,
} from './multi-agent-engine';

/**
 * 协作触发条件
 */
export interface CollaborationTrigger {
  /** 是否需要多视角 */
  needsMultiplePerspectives: boolean;
  
  /** 是否涉及价值冲突 */
  hasValueConflict: boolean;
  
  /** 是否需要创造性解决 */
  needsCreativity: boolean;
  
  /** 复杂度评分 0-1 */
  complexityScore: number;
  
  /** 不确定性水平 0-1 */
  uncertaintyLevel: number;
  
  /** 是否触发协作 */
  shouldCollaborate: boolean;
  
  /** 触发原因 */
  reasons: string[];
}

/**
 * 协作输入上下文
 */
export interface CollaborationInput {
  /** 用户输入 */
  input: string;
  
  /** 意识上下文摘要 */
  consciousnessSummary: string;
  
  /** 当前情感状态 */
  emotionalState: string;
  
  /** 相关记忆 */
  relevantMemories: string[];
  
  /** 当前目标 */
  currentGoal: string | null;
  
  /** 已有的思考结果 */
  existingThoughts?: string;
}

/**
 * 协作输出
 */
export interface CollaborationOutput {
  /** 协作结果 */
  collaborationResult: CollaborationResult | null;
  
  /** 是否使用了协作 */
  usedCollaboration: boolean;
  
  /** 增强的响应 */
  enhancedResponse: string;
  
  /** 涌现洞察 */
  emergentInsights: string[];
  
  /** 参与的意识体ID列表 */
  participatingAgents: string[];
  
  /** 共识水平 */
  consensusLevel: number;
  
  /** 协作价值评分 */
  collaborationValue: number;
}

/**
 * 协作历史记录
 */
interface CollaborationRecord {
  input: string;
  trigger: CollaborationTrigger;
  result: CollaborationResult;
  timestamp: number;
  valueGained: number;
}

/**
 * 多意识体协作集成器
 */
export class MultiConsciousnessIntegrator {
  private engine: MultiAgentCollaborationEngine;
  private collaborationHistory: CollaborationRecord[] = [];
  private llm: LLMClient;
  
  /** 协作阈值配置 */
  private thresholds = {
    complexityThreshold: 0.5,
    uncertaintyThreshold: 0.4,
    minCollaborationInterval: 30000, // 30秒
  };
  
  constructor(llm: LLMClient) {
    this.llm = llm;
    this.engine = createMultiAgentEngine(llm);
  }
  
  /**
   * 分析是否需要协作
   */
  analyzeTrigger(input: string, context?: {
    emotionalState?: string;
    hasMemoryConflict?: boolean;
    currentGoal?: string | null;
  }): CollaborationTrigger {
    const reasons: string[] = [];
    let complexityScore = 0;
    let uncertaintyLevel = 0;
    
    // ─────────────────────────────────────────────────────────────
    // 复杂度分析
    // ─────────────────────────────────────────────────────────────
    
    // 检查问题类型
    const hasMultipleAspects = /\s+(和|与|或|以及|同时|但是|然而)\s+/.test(input);
    if (hasMultipleAspects) {
      complexityScore += 0.2;
      reasons.push('问题涉及多个方面');
    }
    
    // 检查抽象概念
    const abstractConcepts = ['意义', '价值', '道德', '伦理', '存在', '意识', '智慧', '真理', '美', '善'];
    const foundAbstract = abstractConcepts.filter(c => input.includes(c)).length;
    if (foundAbstract > 0) {
      complexityScore += foundAbstract * 0.15;
      reasons.push(`涉及${foundAbstract}个抽象概念`);
    }
    
    // 检查需要创造性的关键词
    const creativeKeywords = ['创造', '设计', '发明', '想象', '构思', '创新', '如何改进'];
    const needsCreativity = creativeKeywords.some(k => input.includes(k));
    if (needsCreativity) {
      complexityScore += 0.25;
      reasons.push('需要创造性思维');
    }
    
    // 检查决策相关
    const decisionKeywords = ['应该', '选择', '决定', '权衡', '取舍', '优先'];
    const needsDecision = decisionKeywords.some(k => input.includes(k));
    if (needsDecision) {
      complexityScore += 0.2;
      uncertaintyLevel += 0.3;
      reasons.push('涉及决策判断');
    }
    
    // 检查争议话题
    const controversialPatterns = [
      /对错|好坏|是非|值得/,
      /应该.*还是|是.*还是/,
      /我该不该|是否应该/,
    ];
    const hasControversy = controversialPatterns.some(p => p.test(input));
    if (hasControversy) {
      uncertaintyLevel += 0.35;
      reasons.push('涉及争议性判断');
    }
    
    // ─────────────────────────────────────────────────────────────
    // 上下文相关因素
    // ─────────────────────────────────────────────────────────────
    
    if (context?.hasMemoryConflict) {
      uncertaintyLevel += 0.25;
      reasons.push('记忆中存在冲突');
    }
    
    if (context?.emotionalState && 
        ['矛盾', '困惑', '纠结', '挣扎'].some(e => context.emotionalState!.includes(e))) {
      uncertaintyLevel += 0.2;
      reasons.push('当前情感状态复杂');
    }
    
    // ─────────────────────────────────────────────────────────────
    // 归一化评分
    // ─────────────────────────────────────────────────────────────
    
    complexityScore = Math.min(1, complexityScore);
    uncertaintyLevel = Math.min(1, uncertaintyLevel);
    
    // 判断是否需要协作
    const needsMultiplePerspectives = complexityScore > 0.4 || uncertaintyLevel > 0.3;
    const hasValueConflict = hasControversy || (context?.hasMemoryConflict ?? false);
    
    const shouldCollaborate = 
      (complexityScore >= this.thresholds.complexityThreshold ||
       uncertaintyLevel >= this.thresholds.uncertaintyThreshold ||
       needsCreativity ||
       hasValueConflict) &&
      this.checkCollaborationInterval();
    
    return {
      needsMultiplePerspectives,
      hasValueConflict,
      needsCreativity,
      complexityScore,
      uncertaintyLevel,
      shouldCollaborate,
      reasons: shouldCollaborate ? reasons : [],
    };
  }
  
  /**
   * 检查协作间隔
   */
  private checkCollaborationInterval(): boolean {
    if (this.collaborationHistory.length === 0) return true;
    
    const lastCollaboration = this.collaborationHistory[this.collaborationHistory.length - 1];
    const elapsed = Date.now() - lastCollaboration.timestamp;
    
    return elapsed >= this.thresholds.minCollaborationInterval;
  }
  
  /**
   * 执行协作处理
   */
  async executeCollaboration(
    input: CollaborationInput
  ): Promise<CollaborationOutput> {
    // 分析是否需要协作
    const trigger = this.analyzeTrigger(input.input, {
      emotionalState: input.emotionalState,
      currentGoal: input.currentGoal,
    });
    
    if (!trigger.shouldCollaborate) {
      // 不需要协作，返回简单结果
      return {
        collaborationResult: null,
        usedCollaboration: false,
        enhancedResponse: input.input, // 由主流程处理
        emergentInsights: [],
        participatingAgents: [],
        consensusLevel: 1.0,
        collaborationValue: 0,
      };
    }
    
    console.log('[协作集成器] 触发多意识体协作:', trigger.reasons);
    
    // 构建协作输入
    const collaborationInput = this.buildCollaborationInput(input);
    
    // 执行协作
    const result = await this.engine.process(collaborationInput);
    
    // 记录协作历史
    const record: CollaborationRecord = {
      input: input.input,
      trigger,
      result,
      timestamp: Date.now(),
      valueGained: this.calculateCollaborationValue(result),
    };
    this.collaborationHistory.push(record);
    
    // 保持历史记录在合理范围
    if (this.collaborationHistory.length > 100) {
      this.collaborationHistory = this.collaborationHistory.slice(-50);
    }
    
    // 构建增强响应
    const enhancedResponse = this.buildEnhancedResponse(
      result,
      input.existingThoughts
    );
    
    return {
      collaborationResult: result,
      usedCollaboration: true,
      enhancedResponse,
      emergentInsights: result.synthesis.emergentInsights,
      participatingAgents: result.agentsUsed,
      consensusLevel: result.consensus.consensusLevel,
      collaborationValue: record.valueGained,
    };
  }
  
  /**
   * 构建协作输入
   */
  private buildCollaborationInput(input: CollaborationInput): string {
    const parts: string[] = [`用户问题: ${input.input}`];
    
    if (input.consciousnessSummary) {
      parts.push(`\n[意识上下文]\n${input.consciousnessSummary}`);
    }
    
    if (input.emotionalState) {
      parts.push(`\n[当前情感] ${input.emotionalState}`);
    }
    
    if (input.relevantMemories.length > 0) {
      parts.push(`\n[相关记忆]\n${input.relevantMemories.join('\n')}`);
    }
    
    if (input.currentGoal) {
      parts.push(`\n[当前目标] ${input.currentGoal}`);
    }
    
    if (input.existingThoughts) {
      parts.push(`\n[已有思考]\n${input.existingThoughts}`);
    }
    
    return parts.join('\n');
  }
  
  /**
   * 构建增强响应
   */
  private buildEnhancedResponse(
    result: CollaborationResult,
    existingThoughts?: string
  ): string {
    const response = result.synthesis.finalOutput;
    
    // 如果有涌现洞察，附加到响应
    if (result.synthesis.emergentInsights.length > 0) {
      const insights = result.synthesis.emergentInsights
        .slice(0, 3) // 最多取3个
        .map((insight, i) => `${i + 1}. ${insight}`)
        .join('\n');
      
      return `${response}\n\n---\n💡 **涌现洞察**\n${insights}`;
    }
    
    return response;
  }
  
  /**
   * 计算协作价值
   */
  private calculateCollaborationValue(result: CollaborationResult): number {
    // 基于多个因素计算协作带来的价值
    let value = 0;
    
    // 共识水平贡献
    value += result.consensus.consensusLevel * 0.3;
    
    // 创新水平贡献
    value += result.consensus.innovationLevel * 0.2;
    
    // 涌现洞察贡献
    value += Math.min(0.3, result.synthesis.emergentInsights.length * 0.1);
    
    // 置信度贡献
    value += result.synthesis.confidence * 0.2;
    
    return Math.min(1, value);
  }
  
  /**
   * 获取协作统计
   */
  getCollaborationStats(): {
    totalCollaborations: number;
    averageValue: number;
    topTriggerReasons: string[];
    mostActiveAgents: string[];
  } {
    const history = this.collaborationHistory;
    
    if (history.length === 0) {
      return {
        totalCollaborations: 0,
        averageValue: 0,
        topTriggerReasons: [],
        mostActiveAgents: [],
      };
    }
    
    // 平均价值
    const averageValue = history.reduce((sum, r) => sum + r.valueGained, 0) / history.length;
    
    // 触发原因统计
    const reasonCounts = new Map<string, number>();
    history.forEach(r => {
      r.trigger.reasons.forEach(reason => {
        reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
      });
    });
    const topTriggerReasons = Array.from(reasonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason]) => reason);
    
    // 最活跃意识体
    const agentCounts = new Map<string, number>();
    history.forEach(r => {
      r.result.agentsUsed.forEach(agent => {
        agentCounts.set(agent, (agentCounts.get(agent) || 0) + 1);
      });
    });
    const mostActiveAgents = Array.from(agentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([agent]) => agent);
    
    return {
      totalCollaborations: history.length,
      averageValue,
      topTriggerReasons,
      mostActiveAgents,
    };
  }
  
  /**
   * 重置引擎
   */
  reset(): void {
    this.engine.reset();
    this.collaborationHistory = [];
  }
}

/**
 * 创建协作集成器
 */
export function createCollaborationIntegrator(llm: LLMClient): MultiConsciousnessIntegrator {
  return new MultiConsciousnessIntegrator(llm);
}
