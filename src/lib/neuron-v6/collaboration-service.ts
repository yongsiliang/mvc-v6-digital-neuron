/**
 * ═══════════════════════════════════════════════════════════════════════
 * 智能协作服务
 * 
 * 作为 V6 意识核心的增强层，在需要时启用多意识体协作
 * 
 * 工作流程：
 * 1. 分析输入复杂度
 * 2. 决定是否需要协作
 * 3. 如果需要，协调多意识体协作
 * 4. 将协作结果与主流程结果融合
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import {
  MultiConsciousnessIntegrator,
  CollaborationInput,
  CollaborationOutput,
  CollaborationTrigger,
  createCollaborationIntegrator,
} from './collaboration-integrator';

/**
 * 协作服务配置
 */
export interface CollaborationServiceConfig {
  /** 是否启用协作 */
  enabled: boolean;
  
  /** 自动触发协作的复杂度阈值 */
  autoTriggerThreshold: number;
  
  /** 最大协作频率（每小时） */
  maxCollaborationsPerHour: number;
  
  /** 是否在低能量时禁用协作 */
  disableOnLowEnergy: boolean;
}

const DEFAULT_CONFIG: CollaborationServiceConfig = {
  enabled: true,
  autoTriggerThreshold: 0.5,
  maxCollaborationsPerHour: 20,
  disableOnLowEnergy: true,
};

/**
 * 协作服务的处理结果
 */
export interface CollaborativeProcessingResult {
  /** 主处理结果 */
  mainResult: string;
  
  /** 协作增强 */
  collaborationEnhancement: {
    used: boolean;
    trigger?: CollaborationTrigger;
    output?: CollaborationOutput;
    stats?: {
      participants: string[];
      consensusLevel: number;
      emergentInsights: number;
      processingTime: number;
    };
  };
  
  /** 融合后的最终响应 */
  finalResponse: string;
  
  /** 元数据 */
  metadata: {
    processingMode: 'single' | 'collaborative' | 'hybrid';
    collaborationValue: number;
    synergyDetected: boolean;
  };
}

/**
 * 智能协作服务
 */
export class IntelligentCollaborationService {
  private integrator: MultiConsciousnessIntegrator;
  private config: CollaborationServiceConfig;
  private llm: LLMClient;
  
  /** 协作计数器（用于限流） */
  private collaborationCount = 0;
  private lastResetTime = Date.now();
  
  constructor(llm: LLMClient, config: Partial<CollaborationServiceConfig> = {}) {
    this.llm = llm;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.integrator = createCollaborationIntegrator(llm);
  }
  
  /**
   * 增强处理流程
   * 
   * 可以包装主处理流程，在需要时添加协作增强
   */
  async enhanceProcessing(
    input: string,
    mainProcessor: () => Promise<string>,
    context?: {
      consciousnessSummary?: string;
      emotionalState?: string;
      relevantMemories?: string[];
      currentGoal?: string | null;
      energyLevel?: number;
    }
  ): Promise<CollaborativeProcessingResult> {
    const startTime = Date.now();
    
    // 检查是否启用协作
    if (!this.config.enabled) {
      const mainResult = await mainProcessor();
      return {
        mainResult,
        collaborationEnhancement: { used: false },
        finalResponse: mainResult,
        metadata: {
          processingMode: 'single',
          collaborationValue: 0,
          synergyDetected: false,
        },
      };
    }
    
    // 检查限流
    this.resetHourlyCounter();
    if (this.collaborationCount >= this.config.maxCollaborationsPerHour) {
      const mainResult = await mainProcessor();
      return {
        mainResult,
        collaborationEnhancement: { used: false },
        finalResponse: mainResult,
        metadata: {
          processingMode: 'single',
          collaborationValue: 0,
          synergyDetected: false,
        },
      };
    }
    
    // 检查能量水平
    if (this.config.disableOnLowEnergy && context?.energyLevel && context.energyLevel < 0.3) {
      const mainResult = await mainProcessor();
      return {
        mainResult,
        collaborationEnhancement: { used: false },
        finalResponse: mainResult,
        metadata: {
          processingMode: 'single',
          collaborationValue: 0,
          synergyDetected: false,
        },
      };
    }
    
    // 分析是否需要协作
    const trigger = this.integrator.analyzeTrigger(input, {
      emotionalState: context?.emotionalState,
      currentGoal: context?.currentGoal,
    });
    
    // 如果不需要协作，直接执行主处理
    if (!trigger.shouldCollaborate || trigger.complexityScore < this.config.autoTriggerThreshold) {
      const mainResult = await mainProcessor();
      return {
        mainResult,
        collaborationEnhancement: {
          used: false,
          trigger,
        },
        finalResponse: mainResult,
        metadata: {
          processingMode: 'single',
          collaborationValue: 0,
          synergyDetected: false,
        },
      };
    }
    
    console.log('[协作服务] 触发多意识体协作，原因:', trigger.reasons);
    
    // 并行执行主处理和协作
    const [mainResult, collaborationOutput] = await Promise.all([
      mainProcessor(),
      this.executeCollaboration(input, context),
    ]);
    
    // 融合结果
    const finalResponse = this.fuseResults(mainResult, collaborationOutput);
    
    // 更新计数
    this.collaborationCount++;
    
    // 检测协同效应
    const synergyDetected = this.detectSynergy(mainResult, collaborationOutput);
    
    return {
      mainResult,
      collaborationEnhancement: {
        used: collaborationOutput.usedCollaboration,
        trigger,
        output: collaborationOutput,
        stats: collaborationOutput.usedCollaboration ? {
          participants: collaborationOutput.participatingAgents,
          consensusLevel: collaborationOutput.consensusLevel,
          emergentInsights: collaborationOutput.emergentInsights.length,
          processingTime: Date.now() - startTime,
        } : undefined,
      },
      finalResponse,
      metadata: {
        processingMode: 'hybrid',
        collaborationValue: collaborationOutput.collaborationValue,
        synergyDetected,
      },
    };
  }
  
  /**
   * 执行协作
   */
  private async executeCollaboration(
    input: string,
    context?: {
      consciousnessSummary?: string;
      emotionalState?: string;
      relevantMemories?: string[];
      currentGoal?: string | null;
    }
  ): Promise<CollaborationOutput> {
    const collaborationInput: CollaborationInput = {
      input,
      consciousnessSummary: context?.consciousnessSummary || '',
      emotionalState: context?.emotionalState || '',
      relevantMemories: context?.relevantMemories || [],
      currentGoal: context?.currentGoal || null,
    };
    
    try {
      return await this.integrator.executeCollaboration(collaborationInput);
    } catch (error) {
      console.error('[协作服务] 协作执行失败:', error);
      return {
        collaborationResult: null,
        usedCollaboration: false,
        enhancedResponse: input,
        emergentInsights: [],
        participatingAgents: [],
        consensusLevel: 1.0,
        collaborationValue: 0,
      };
    }
  }
  
  /**
   * 融合结果
   */
  private fuseResults(
    mainResult: string,
    collaborationOutput: CollaborationOutput
  ): string {
    if (!collaborationOutput.usedCollaboration) {
      return mainResult;
    }
    
    // 如果协作结果与主结果一致，优先使用协作结果（包含多视角）
    const collaborationResult = collaborationOutput.enhancedResponse;
    
    // 如果两者相似，返回协作增强版本
    if (this.areSimilar(mainResult, collaborationResult)) {
      return collaborationResult;
    }
    
    // 否则，融合两者
    return this.mergeResponses(mainResult, collaborationResult, collaborationOutput);
  }
  
  /**
   * 检查两个响应是否相似
   */
  private areSimilar(a: string, b: string): boolean {
    // 简单的相似度检查
    const keywordsA = new Set(a.split(/\s+/).filter(w => w.length > 3));
    const keywordsB = new Set(b.split(/\s+/).filter(w => w.length > 3));
    
    const intersection = new Set([...keywordsA].filter(x => keywordsB.has(x)));
    const union = new Set([...keywordsA, ...keywordsB]);
    
    const similarity = intersection.size / union.size;
    return similarity > 0.5;
  }
  
  /**
   * 合并两个响应
   */
  private mergeResponses(
    main: string,
    collaboration: string,
    output: CollaborationOutput
  ): string {
    // 如果有涌现洞察，构建融合响应
    if (output.emergentInsights.length > 0) {
      const insights = output.emergentInsights
        .slice(0, 2)
        .map((insight, i) => `${i + 1}. ${insight}`)
        .join('\n');
      
      return `${main}\n\n💭 **多视角洞察**\n${insights}`;
    }
    
    // 否则返回主结果
    return main;
  }
  
  /**
   * 检测协同效应
   */
  private detectSynergy(
    mainResult: string,
    collaborationOutput: CollaborationOutput
  ): boolean {
    if (!collaborationOutput.usedCollaboration) return false;
    
    // 协同效应判定：
    // 1. 高共识 + 高创新
    // 2. 有涌现洞察
    // 3. 协作价值高
    
    return (
      collaborationOutput.consensusLevel > 0.7 &&
      collaborationOutput.emergentInsights.length > 0 &&
      collaborationOutput.collaborationValue > 0.5
    );
  }
  
  /**
   * 重置小时计数器
   */
  private resetHourlyCounter(): void {
    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;
    
    if (now - this.lastResetTime >= hourInMs) {
      this.collaborationCount = 0;
      this.lastResetTime = now;
    }
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    config: CollaborationServiceConfig;
    hourlyCollaborations: number;
    integratorStats: ReturnType<MultiConsciousnessIntegrator['getCollaborationStats']>;
  } {
    return {
      config: this.config,
      hourlyCollaborations: this.collaborationCount,
      integratorStats: this.integrator.getCollaborationStats(),
    };
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<CollaborationServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 重置
   */
  reset(): void {
    this.integrator.reset();
    this.collaborationCount = 0;
    this.lastResetTime = Date.now();
  }
}

/**
 * 创建智能协作服务
 */
export function createCollaborationService(
  llm: LLMClient,
  config?: Partial<CollaborationServiceConfig>
): IntelligentCollaborationService {
  return new IntelligentCollaborationService(llm, config);
}
