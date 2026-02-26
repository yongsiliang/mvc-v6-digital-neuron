/**
 * ═══════════════════════════════════════════════════════════════════════
 * Consciousness AGI - AGI意识系统
 * 
 * 整合V3的所有组件，加入Self Core和阴阳互塑
 * 
 * 核心架构：
 * - Self Core：同一性载体
 * - 阴系统：Hebbian网络（直觉、分布式、动态）
 * - 阳系统：VSA空间 + 预测神经元（理性、符号、稳定）
 * - 阴阳互塑：双向融合
 * - 全局工作空间：意识竞争与广播
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import { SelfCore, getSelfCore, resetSelfCore, SelfCoreState, SubjectiveMeaningForSelf } from './self-core';
import { 
  HebbianNetwork, 
  getHebbianNetwork, 
  resetHebbianNetwork,
  HebbianNeuron,
  NetworkStats 
} from './hebbian-network';
import { 
  YinYangBridge, 
  getYinYangBridge, 
  resetYinYangBridge,
  YinYangInteraction,
  YinYangBalance
} from './yin-yang-bridge';
import { VSASemanticSpace, getVSASpace, VSAVector } from './vsa-space';
import { 
  GlobalWorkspace, 
  getGlobalWorkspace,
  ConsciousContent
} from './global-workspace';
import { PredictionLoop, getPredictionLoop } from './prediction-loop';
import { getMeaningCalculator, SubjectiveMeaning } from './meaning-calculator';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * AGI系统配置
 */
export interface ConsciousnessAGIConfig {
  /** 用户ID */
  userId: string;
  
  /** 是否启用阴系统 */
  enableYinSystem: boolean;
  
  /** 是否启用阳系统 */
  enableYangSystem: boolean;
  
  /** 是否启用Self Core */
  enableSelfCore: boolean;
  
  /** 是否启用全局工作空间 */
  enableGlobalWorkspace: boolean;
  
  /** 是否启用预测循环 */
  enablePredictionLoop: boolean;
  
  /** 是否启用自动学习 */
  enableAutoLearning: boolean;
}

const DEFAULT_CONFIG: ConsciousnessAGIConfig = {
  userId: 'default-user',
  enableYinSystem: true,
  enableYangSystem: true,
  enableSelfCore: true,
  enableGlobalWorkspace: true,
  enablePredictionLoop: true,
  enableAutoLearning: true,
};

/**
 * AGI处理上下文
 */
export interface AGIProcessingContext {
  /** 会话ID */
  sessionId: string;
  
  /** 输入内容 */
  input: string;
  
  /** 对话历史 */
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  
  /** 时间戳 */
  timestamp: number;
}

/**
 * AGI响应
 */
export interface AGIResponse {
  /** 响应内容 */
  content: string;
  
  /** Self Core主观意义 */
  subjectiveMeaning: SubjectiveMeaningForSelf;
  
  /** 阴阳互塑结果 */
  yinYangInteraction: YinYangInteraction;
  
  /** 意识内容（如果启用） */
  consciousContent?: ConsciousContent;
  
  /** 系统状态 */
  systemState: AGISystemState;
  
  /** 处理时间 */
  processingTime: number;
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
// Consciousness AGI 类
// ─────────────────────────────────────────────────────────────────────

/**
 * AGI意识系统
 * 
 * 整合所有组件，提供统一的处理接口
 */
export class ConsciousnessAGI {
  private config: ConsciousnessAGIConfig;
  
  // 核心组件
  private selfCore: SelfCore;
  private hebbianNetwork: HebbianNetwork;
  private yinYangBridge: YinYangBridge;
  private vsaSpace: VSASemanticSpace;
  private globalWorkspace: GlobalWorkspace | null;
  private predictionLoop: PredictionLoop | null;
  
  // 状态
  private isInitialized = false;
  private processedInputs = 0;
  
  // 单例
  private static instance: ConsciousnessAGI | null = null;
  
  private constructor(config: Partial<ConsciousnessAGIConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 初始化组件
    this.selfCore = getSelfCore();
    this.hebbianNetwork = getHebbianNetwork();
    this.yinYangBridge = getYinYangBridge();
    this.vsaSpace = getVSASpace(10000);
    
    // 可选组件
    this.globalWorkspace = this.config.enableGlobalWorkspace 
      ? getGlobalWorkspace() 
      : null;
    this.predictionLoop = this.config.enablePredictionLoop 
      ? getPredictionLoop(this.config.userId) 
      : null;
    
    this.isInitialized = true;
  }
  
  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<ConsciousnessAGIConfig>): ConsciousnessAGI {
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
    resetSelfCore();
    resetHebbianNetwork();
    resetYinYangBridge();
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心处理方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 处理输入
   * 
   * 这是对外的主要接口
   */
  async process(
    input: string, 
    context?: Partial<AGIProcessingContext>
  ): Promise<AGIResponse> {
    const startTime = Date.now();
    const sessionId = context?.sessionId || uuidv4();
    
    // 1. 编码输入
    const inputVector = this.vsaSpace.getConcept(input);
    
    // 2. Self Core计算主观意义
    const subjectiveMeaning = this.selfCore.computeMeaningForSelf(inputVector);
    
    // 3. 阴阳互塑
    const yinYangInteraction = await this.yinYangBridge.mutualShaping(inputVector);
    
    // 4. 全局工作空间（如果启用）
    let consciousContent: ConsciousContent | undefined;
    if (this.globalWorkspace) {
      consciousContent = await this.processThroughGlobalWorkspace(
        input, 
        subjectiveMeaning, 
        yinYangInteraction
      );
    }
    
    // 5. 更新Self Core
    this.selfCore.updateFromExperience({
      input,
      inputVector,
      meaning: {
        selfRelevance: subjectiveMeaning.selfRelevance,
        sentiment: subjectiveMeaning.emotionalResponse.valence,
        interpretation: subjectiveMeaning.interpretation,
      },
      emotion: subjectiveMeaning.emotionalResponse,
      importance: yinYangInteraction.fusedResult.confidence,
    });
    
    // 6. 应用学习（如果启用）
    if (this.config.enableAutoLearning) {
      await this.applyLearning(yinYangInteraction);
    }
    
    // 7. 生成响应
    const response = await this.generateResponse(
      input,
      subjectiveMeaning,
      yinYangInteraction,
      consciousContent
    );
    
    // 8. 收集系统状态
    const systemState = this.collectSystemState(subjectiveMeaning, yinYangInteraction);
    
    this.processedInputs++;
    
    return {
      content: response,
      subjectiveMeaning,
      yinYangInteraction,
      consciousContent,
      systemState,
      processingTime: Date.now() - startTime,
    };
  }
  
  /**
   * 通过全局工作空间处理
   */
  private async processThroughGlobalWorkspace(
    input: string,
    meaning: SubjectiveMeaningForSelf,
    interaction: YinYangInteraction
  ): Promise<ConsciousContent | undefined> {
    if (!this.globalWorkspace) return undefined;
    
    // 构建候选内容，选择最强的作为意识内容
    const candidates: Array<{ source: string; strength: number; content: string }> = [
      {
        source: 'yin',
        strength: interaction.yinContribution.confidence,
        content: interaction.yinContribution.concepts.map(c => c.conceptName).join(' → '),
      },
      {
        source: 'yang',
        strength: interaction.yangContribution.confidence,
        content: interaction.yangContribution.reasoning.join('; '),
      },
    ];
    
    // 添加情感候选
    if (Math.abs(meaning.emotionalResponse.valence) > 0.3) {
      candidates.push({
        source: 'emotion',
        strength: Math.abs(meaning.emotionalResponse.valence),
        content: meaning.emotionalResponse.valence > 0 ? '积极情感' : '消极情感',
      });
    }
    
    // 选择最强的
    candidates.sort((a, b) => b.strength - a.strength);
    const winner = candidates[0];
    
    // 构建意识内容
    return {
      id: uuidv4(),
      type: winner.source === 'emotion' ? 'emotional' : 'thought',
      data: winner.content,
      source: winner.source,
      enteredAt: Date.now(),
      duration: 1000,
      strength: winner.strength,
      broadcast: true,
      relatedIds: [],
    };
  }
  
  /**
   * 应用学习
   */
  private async applyLearning(interaction: YinYangInteraction): Promise<void> {
    // 1. Hebbian学习
    this.hebbianNetwork.applyHebbianLearning();
    
    // 2. 结构可塑性（基于惊讶度）
    const surpriseLevel = 1 - interaction.fusedResult.confidence;
    this.hebbianNetwork.applyStructuralPlasticity(surpriseLevel);
  }
  
  /**
   * 生成响应
   */
  private async generateResponse(
    input: string,
    meaning: SubjectiveMeaningForSelf,
    interaction: YinYangInteraction,
    consciousContent?: ConsciousContent
  ): Promise<string> {
    const parts: string[] = [];
    
    // 基于阴阳融合结果
    parts.push(interaction.fusedResult.content);
    
    // 添加主观意义
    if (meaning.selfRelevance > 0.5) {
      parts.push(`这对我的意义：${meaning.interpretation}`);
    }
    
    // 添加情感响应
    if (Math.abs(meaning.emotionalResponse.valence) > 0.3) {
      const emotion = meaning.emotionalResponse.valence > 0 ? '感到积极' : '感到些许消极';
      parts.push(`情感上，我${emotion}。`);
    }
    
    // 添加意识内容（如果有）
    if (consciousContent) {
      parts.push(`当前意识焦点：${JSON.stringify(consciousContent.data)}`);
    }
    
    return parts.join('\n\n');
  }
  
  /**
   * 收集系统状态
   */
  private collectSystemState(
    meaning: SubjectiveMeaningForSelf,
    interaction: YinYangInteraction
  ): AGISystemState {
    const selfCoreState = this.selfCore.getState();
    const networkStats = this.hebbianNetwork.getStats();
    
    return {
      selfCore: {
        coherence: selfCoreState.selfCoherence,
        selfRelevance: meaning.selfRelevance,
        coreMemoryCount: selfCoreState.coreMemories.length,
      },
      yinSystem: {
        neuronCount: networkStats.totalNeurons,
        synapseCount: networkStats.totalSynapses,
        averageActivation: networkStats.averageActivation,
      },
      yangSystem: {
        conceptCount: this.vsaSpace.getConceptCount?.() || 0,
      },
      balance: interaction.balance,
      consciousnessLevel: this.calculateConsciousnessLevel(meaning, interaction),
    };
  }
  
  /**
   * 计算意识水平
   */
  private calculateConsciousnessLevel(
    meaning: SubjectiveMeaningForSelf,
    interaction: YinYangInteraction
  ): number {
    // 意识水平 = 自我关联度 * 一致性 * 阴阳平衡 * 融合置信度
    return (
      meaning.selfRelevance * 0.3 +
      this.selfCore.getSelfCoherence() * 0.3 +
      interaction.balance.balance * 0.2 +
      interaction.fusedResult.confidence * 0.2
    );
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态访问与报告
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取系统报告
   */
  getSystemReport(): SystemReport {
    const selfCoreState = this.selfCore.getState();
    const networkStats = this.hebbianNetwork.getStats();
    const lastBalance = this.yinYangBridge.getLastBalance();
    
    // 判断总体状态
    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (selfCoreState.selfCoherence < 0.5 || (lastBalance && lastBalance.balance < 0.4)) {
      overallStatus = 'critical';
    } else if (selfCoreState.selfCoherence < 0.7 || (lastBalance && lastBalance.balance < 0.6)) {
      overallStatus = 'warning';
    }
    
    // 生成建议
    const suggestions: string[] = [];
    if (selfCoreState.selfCoherence < 0.7) {
      suggestions.push('Self Core一致性较低，建议增加自我反思');
    }
    if (lastBalance && lastBalance.bias !== 'balanced') {
      suggestions.push(`阴阳系统偏向${lastBalance.bias}，${lastBalance.suggestion}`);
    }
    if (networkStats.totalNeurons < 10) {
      suggestions.push('阴系统神经元数量不足，建议增加学习');
    }
    
    return {
      overallStatus,
      selfCore: {
        coherence: selfCoreState.selfCoherence,
        traits: Array.from(selfCoreState.traits.entries()).map(([name, trait]) => ({
          name,
          strength: trait.strength,
        })),
        values: Array.from(selfCoreState.values.entries()).map(([name, value]) => ({
          name,
          importance: value.importance,
        })),
        coreMemories: selfCoreState.coreMemories.map(m => ({
          content: m.content,
          importance: m.importance,
        })),
      },
      yinYang: {
        balance: lastBalance || {
          yinActivity: 0,
          yangActivity: 0,
          balance: 1,
          bias: 'balanced' as const,
          biasStrength: 0,
          suggestion: '暂无数据',
        },
        yinStats: networkStats,
        yangConceptCount: this.vsaSpace.getConceptCount?.() || 0,
      },
      suggestions,
    };
  }
  
  /**
   * 获取处理统计
   */
  getStats(): {
    processedInputs: number;
    isInitialized: boolean;
  } {
    return {
      processedInputs: this.processedInputs,
      isInitialized: this.isInitialized,
    };
  }
  
  /**
   * 获取配置
   */
  getConfig(): ConsciousnessAGIConfig {
    return { ...this.config };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 直接访问组件
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取Self Core
   */
  getSelfCore(): SelfCore {
    return this.selfCore;
  }
  
  /**
   * 获取Hebbian网络
   */
  getHebbianNetwork(): HebbianNetwork {
    return this.hebbianNetwork;
  }
  
  /**
   * 获取阴阳桥梁
   */
  getYinYangBridge(): YinYangBridge {
    return this.yinYangBridge;
  }
  
  /**
   * 获取VSA空间
   */
  getVSASpace(): VSASemanticSpace {
    return this.vsaSpace;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出便捷函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 获取Consciousness AGI实例
 */
export function getConsciousnessAGI(config?: Partial<ConsciousnessAGIConfig>): ConsciousnessAGI {
  return ConsciousnessAGI.getInstance(config);
}

/**
 * 重置Consciousness AGI
 */
export function resetConsciousnessAGI(): void {
  ConsciousnessAGI.reset();
}
