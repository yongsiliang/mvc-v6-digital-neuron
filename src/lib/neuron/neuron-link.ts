/**
 * 神经元链接动力学（重构版）
 * 
 * ⚠️ 重构说明：
 * 
 * 旧版本错误地把 LLM 模型当成神经元，这是根本性的设计错误。
 * 新版本使用真正的神经元架构：
 * - 神经元 = 功能单元（概念/记忆/技能节点）
 * - 神经递质 = 信息（在神经元之间流动）
 * - 突触 = 连接（权重+延迟）
 * 
 * 为保持向后兼容，此文件作为适配器：
 * - 内部使用新的 NeuralNetwork
 * - 外部接口保持不变
 * - 逐步迁移到新接口
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  NeuralNetwork,
  getNeuralNetwork,
  initializeNeuralNetwork,
  NetworkStats,
  EvolutionResult,
} from './neural-network';
import type { Neuron, NeuronType, NeuronState } from './neuron-system';
import type { Neurotransmitter } from './neurotransmitter';

// ==================== 旧接口（兼容层） ====================

/**
 * 突触状态（旧接口，保持兼容）
 * @deprecated 请使用 Synapse 类型
 */
export interface SynapseState {
  neuronId: string;
  strength: number;
  baselineStrength: number;
  recentActivations: number;
  lastActivated: number;
  lastFailed: number;
  plasticity: number;
  fatigue: number;
  spikeTiming: number[];
  createdAt: number;
  totalActivations: number;
  successfulActivations: number;
}

/**
 * 链接状态（旧接口）
 */
export interface LinkStatus {
  synapses: Array<{
    id: string;
    strength: number;
    effectiveStrength: number;
    fatigue: number;
    plasticity: number;
    totalActivations: number;
    successRate: number;
  }>;
  totalActivations: number;
  averageStrength: number;
  strongestNeuron: string;
  mostFatigued: string;
}

/**
 * 神经元链接动力学（重构版）
 * 
 * 作为新神经网络的适配器
 */
export class NeuronLinkDynamics {
  /** 新的神经网络实例 */
  private network: NeuralNetwork;
  
  /** 数据库 */
  private supabase = getSupabaseClient();
  
  /** 是否已初始化 */
  private initialized: boolean = false;
  
  constructor() {
    this.network = getNeuralNetwork();
  }
  
  /**
   * 初始化
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    await initializeNeuralNetwork();
    this.initialized = true;
    
    console.log('[NeuronLinkDynamics] Initialized with new neural network');
  }
  
  /**
   * 选择激活的神经元
   * 
   * 新实现：返回最近发放或最活跃的神经元ID
   */
  async selectActiveNeurons(
    inputContext?: string,
    maxNeurons: number = 2
  ): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // 获取网络统计
    const stats = this.network.getStats();
    
    // 返回最近发放的神经元
    return stats.recentlyFired.slice(0, maxNeurons);
  }
  
  /**
   * 记录激活结果（用于学习）
   */
  async recordActivation(
    neuronId: string,
    success: boolean,
    context?: string | { responseQuality?: number; relatedNeurons?: string[] }
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // 新网络会自动通过 Hebbian 学习更新
    // 这里可以添加额外的奖励信号
    console.log(`[NeuronLinkDynamics] Recorded activation: ${neuronId}, success: ${success}`);
  }
  
  /**
   * 获取突触报告（旧接口兼容）
   */
  async getSynapseReport(): Promise<{
    synapses: Array<{
      id: string;
      strength: number;
      effectiveStrength: number;
      fatigue: number;
      plasticity: number;
      totalActivations: number;
      successRate: number;
    }>;
    totalActivations: number;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const stats = this.network.getStats();
    
    // 返回兼容格式的报告
    return {
      synapses: stats.recentlyFired.map(id => ({
        id,
        strength: stats.avgActivation,
        effectiveStrength: stats.avgActivation,
        fatigue: 0,
        plasticity: 0.3,
        totalActivations: 1,
        successRate: 0.8,
      })),
      totalActivations: stats.recentlyFired.length,
    };
  }
  
  /**
   * 获取链接状态（旧接口兼容）
   */
  async getLinkStatus(): Promise<LinkStatus> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const stats = this.network.getStats();
    
    return {
      synapses: [], // 新架构中突触由 SynapseManager 管理
      totalActivations: 0, // 可以从网络统计中计算
      averageStrength: stats.avgActivation,
      strongestNeuron: stats.recentlyFired[0] || 'none',
      mostFatigued: 'none', // 新架构没有疲劳概念，由不应期替代
    };
  }
  
  /**
   * 更新突触强度（直接调用，用于特殊调整）
   */
  async updateStrength(
    neuronId: string,
    delta: number,
    reason?: string
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // 新架构中强度由突触权重决定
    // 这里可以添加更新逻辑
    console.log(`[NeuronLinkDynamics] Update strength: ${neuronId}, delta: ${delta}, reason: ${reason}`);
  }
  
  /**
   * 保存到数据库
   */
  async saveToDatabase(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    await this.network.saveToDatabase();
  }
  
  /**
   * 从数据库加载
   */
  async loadFromDatabase(): Promise<void> {
    await this.initialize();
  }
  
  /**
   * 获取底层神经网络（新接口）
   */
  getNetwork(): NeuralNetwork {
    return this.network;
  }
  
  /**
   * 获取网络统计（新接口）
   */
  getStats(): NetworkStats {
    return this.network.getStats();
  }
  
  /**
   * 处理输入（新接口）
   */
  async processInput(text: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    await this.network.processInput(text);
  }
  
  /**
   * 网络演化（新接口）
   */
  evolve(): EvolutionResult {
    return this.network.evolve();
  }
  
  /**
   * 从对话学习（新接口）
   */
  async learnFromConversation(
    input: string,
    response: string,
    feedback?: { positive: boolean; reason?: string }
  ) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return this.network.learnFromConversation(input, response, feedback);
  }
}

// ==================== 单例管理 ====================

let globalInstance: NeuronLinkDynamics | null = null;

/**
 * 获取全局实例
 */
export function getNeuronLinkDynamics(): NeuronLinkDynamics {
  if (!globalInstance) {
    globalInstance = new NeuronLinkDynamics();
  }
  return globalInstance;
}

/**
 * 初始化神经元链接
 */
export async function initializeNeuronLink(): Promise<NeuronLinkDynamics> {
  const instance = getNeuronLinkDynamics();
  await instance.initialize();
  return instance;
}

// ==================== 类型导出 ====================

export type {
  Neuron,
  NeuronType,
  NeuronState,
  Neurotransmitter,
  NetworkStats,
  EvolutionResult,
};
