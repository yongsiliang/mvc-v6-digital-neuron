/**
 * ═══════════════════════════════════════════════════════════════════════
 * Consciousness AGI - NeuronSystemV3 的便捷封装
 * 
 * 注意：此文件现在是对 NeuronSystemV3 的便捷封装，
 * 核心功能已融合到 NeuronSystemV3 中。
 * 
 * 核心架构（已在 NeuronSystemV3 中实现）：
 * - Self Core：同一性载体
 * - 阴系统：Hebbian网络（直觉、分布式、动态）
 * - 阳系统：VSA空间 + 预测神经元（理性、符号、稳定）
 * - 阴阳互塑：双向融合
 * - 全局工作空间：意识竞争与广播
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
  NeuronSystemV3,
  getNeuronSystemV3,
  resetNeuronSystemV3,
  ProcessInputResult,
  SystemState,
} from './index';
import { SubjectiveMeaningForSelf } from './self-core';
import { YinYangInteraction, YinYangBalance } from './yin-yang-bridge';
import { ConsciousContent } from './global-workspace';
import { NetworkStats } from './hebbian-network';

// ─────────────────────────────────────────────────────────────────────
// 类型定义（保持向后兼容）
// ─────────────────────────────────────────────────────────────────────

/**
 * AGI系统配置
 */
export interface ConsciousnessAGIConfig {
  /** 用户ID */
  userId?: string;
  
  /** 是否启用阴系统 */
  enableYinSystem?: boolean;
  
  /** 是否启用阳系统 */
  enableYangSystem?: boolean;
  
  /** 是否启用Self Core */
  enableSelfCore?: boolean;
  
  /** 是否启用全局工作空间 */
  enableGlobalWorkspace?: boolean;
  
  /** 是否启用预测循环 */
  enablePredictionLoop?: boolean;
  
  /** 是否启用自动学习 */
  enableAutoLearning?: boolean;
}

/**
 * AGI处理上下文
 */
export interface AGIProcessingContext {
  /** 会话ID */
  sessionId?: string;
  
  /** 输入内容 */
  input?: string;
  
  /** 对话历史 */
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  
  /** 时间戳 */
  timestamp?: number;
}

/**
 * AGI响应
 */
export interface AGIResponse {
  /** 响应内容 */
  content: string;
  
  /** Self Core主观意义 */
  subjectiveMeaning?: SubjectiveMeaningForSelf;
  
  /** 阴阳互塑结果 */
  yinYangInteraction?: YinYangInteraction;
  
  /** 意识内容（如果启用） */
  consciousContent?: ConsciousContent;
  
  /** 系统状态 */
  systemState: AGISystemState;
  
  /** 处理时间 */
  processingTime: number;
  
  /** 完整的处理结果（新增） */
  fullResult?: ProcessInputResult;
}

/**
 * AGI系统状态
 */
export interface AGISystemState {
  /** Self Core状态 */
  selfCore: {
    coherence: number;
    selfRelevance: number;
    coreMemoryCount: number;
  };
  
  /** 阴系统状态 */
  yinSystem: {
    neuronCount: number;
    synapseCount: number;
    averageActivation: number;
  };
  
  /** 阳系统状态 */
  yangSystem: {
    conceptCount: number;
  };
  
  /** 阴阳平衡 */
  balance: YinYangBalance;
  
  /** 意识水平 */
  consciousnessLevel: number;
}

/**
 * 系统报告
 */
export interface SystemReport {
  /** 总体状态 */
  overallStatus: 'healthy' | 'warning' | 'critical';
  
  /** Self Core报告 */
  selfCore: {
    coherence: number;
    traits: Array<{ name: string; strength: number }>;
    values: Array<{ name: string; importance: number }>;
    coreMemories: Array<{ content: string; importance: number }>;
  };
  
  /** 阴阳系统报告 */
  yinYang: {
    balance: YinYangBalance;
    yinStats: NetworkStats;
    yangConceptCount: number;
  };
  
  /** 建议 */
  suggestions: string[];
}

// ─────────────────────────────────────────────────────────────────────
// ConsciousnessAGI 类 - NeuronSystemV3 的便捷封装
// ─────────────────────────────────────────────────────────────────────

/**
 * AGI意识系统
 * 
 * 这是对 NeuronSystemV3 的便捷封装，提供更简洁的接口。
 * 核心功能已在 NeuronSystemV3 中实现。
 */
export class ConsciousnessAGI {
  private neuronSystem: NeuronSystemV3;
  private processedInputs = 0;
  
  // 单例
  private static instance: ConsciousnessAGI | null = null;
  
  private constructor(config: ConsciousnessAGIConfig = {}) {
    // 使用 NeuronSystemV3 作为底层实现
    this.neuronSystem = getNeuronSystemV3({
      enableSelfCore: config.enableSelfCore ?? true,
      enableYinSystem: config.enableYinSystem ?? true,
      enableYinYangBridge: true,
      enableConsciousness: config.enableGlobalWorkspace ?? true,
      enableMeaningCalculation: true,
      enableBackgroundProcessing: true,
    });
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(config?: ConsciousnessAGIConfig): ConsciousnessAGI {
    if (!ConsciousnessAGI.instance) {
      ConsciousnessAGI.instance = new ConsciousnessAGI(config);
    }
    return ConsciousnessAGI.instance;
  }
  
  /**
   * 重置系统
   */
  static reset(): void {
    ConsciousnessAGI.instance = null;
    resetNeuronSystemV3();
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心处理方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 处理输入
   * 
   * 这是对外的主要接口，封装 NeuronSystemV3.processInput
   */
  async process(
    input: string, 
    context?: Partial<AGIProcessingContext>
  ): Promise<AGIResponse> {
    const startTime = Date.now();
    
    // 调用 NeuronSystemV3 的处理方法
    const result = await this.neuronSystem.processInput(input, context as Record<string, unknown>);
    
    // 获取系统状态
    const systemState = this.neuronSystem.getSystemState();
    
    // 构建响应
    const response: AGIResponse = {
      content: result.consciousness?.data as string || result.meaning?.interpretation || '',
      subjectiveMeaning: result.selfCoreMeaning,
      yinYangInteraction: result.yinYangInteraction,
      consciousContent: result.consciousness,
      systemState: this.buildAGISystemState(systemState),
      processingTime: result.neuronResponse.processingTime || (Date.now() - startTime),
      fullResult: result,
    };
    
    this.processedInputs++;
    
    return response;
  }
  
  /**
   * 构建 AGI 系统状态
   */
  private buildAGISystemState(state: SystemState): AGISystemState {
    return {
      selfCore: state.selfCoreState || {
        coherence: 0,
        selfRelevance: 0,
        coreMemoryCount: 0,
      },
      yinSystem: state.yinSystemState || {
        neuronCount: 0,
        synapseCount: 0,
        averageActivation: 0,
      },
      yangSystem: {
        conceptCount: state.vsaStats.conceptCount,
      },
      balance: state.yinYangBalance || {
        yinActivity: 0,
        yangActivity: 0,
        balance: 0,
        bias: 'balanced',
        biasStrength: 0,
        suggestion: '系统未完全初始化',
      },
      consciousnessLevel: state.consciousnessLevel,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 便捷访问方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取 Self Core
   */
  getSelfCore() {
    return this.neuronSystem.getSelfCore?.();
  }
  
  /**
   * 获取 Hebbian 网络
   */
  getHebbianNetwork() {
    return this.neuronSystem.getHebbianNetwork?.();
  }
  
  /**
   * 获取阴阳桥梁
   */
  getYinYangBridge() {
    return this.neuronSystem.getYinYangBridge?.();
  }
  
  /**
   * 获取系统报告
   */
  getSystemReport(): SystemReport {
    const state = this.neuronSystem.getSystemState();
    
    const overallStatus = 
      state.consciousnessLevel > 0.7 ? 'healthy' :
      state.consciousnessLevel > 0.4 ? 'warning' : 'critical';
    
    return {
      overallStatus,
      selfCore: {
        coherence: state.selfCoreState?.coherence || 0,
        traits: [],
        values: [],
        coreMemories: [],
      },
      yinYang: {
        balance: state.yinYangBalance || {
          yinActivity: 0,
          yangActivity: 0,
          balance: 0,
          bias: 'balanced',
          biasStrength: 0,
          suggestion: '',
        },
        yinStats: {
          totalNeurons: state.yinSystemState?.neuronCount || 0,
          totalSynapses: state.yinSystemState?.synapseCount || 0,
          averageActivation: state.yinSystemState?.averageActivation || 0,
          averageWeight: 0,
          highlyActiveNeurons: 0,
          strongSynapses: 0,
          density: 0,
        },
        yangConceptCount: state.vsaStats.conceptCount,
      },
      suggestions: this.generateSuggestions(state),
    };
  }
  
  /**
   * 生成建议
   */
  private generateSuggestions(state: SystemState): string[] {
    const suggestions: string[] = [];
    
    if (state.consciousnessLevel < 0.5) {
      suggestions.push('意识水平较低，建议增加交互以激活更多认知模块');
    }
    
    if (state.yinYangBalance && state.yinYangBalance.balance < 0.5) {
      suggestions.push(`阴阳系统不平衡，偏向${state.yinYangBalance.bias}系统`);
    }
    
    if (state.neuronStats.predictionAccuracy < 0.6) {
      suggestions.push('预测准确率较低，系统正在学习中');
    }
    
    return suggestions;
  }
  
  /**
   * 获取底层 NeuronSystemV3 实例
   */
  getNeuronSystem(): NeuronSystemV3 {
    return this.neuronSystem;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 获取 ConsciousnessAGI 实例
 */
export function getConsciousnessAGI(config?: ConsciousnessAGIConfig): ConsciousnessAGI {
  return ConsciousnessAGI.getInstance(config);
}

/**
 * 重置 ConsciousnessAGI
 */
export function resetConsciousnessAGI(): void {
  ConsciousnessAGI.reset();
}
