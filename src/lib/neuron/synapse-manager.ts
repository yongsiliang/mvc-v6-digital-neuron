/**
 * 突触管理器
 * Synapse Manager
 * 
 * 核心概念：突触 = 神经元之间的连接
 * 
 * 突触决定信息如何从一个神经元传递到另一个神经元。
 * 关键属性：
 * - 权重：传递效率
 * - 延迟：传递时间
 * - 可塑性：学习能力
 * 
 * 学习机制：
 * - Hebbian学习：一起激活的神经元连接增强
 * - STDP：时间依赖可塑性
 * - 突触稳态：维持网络平衡
 * - 用进废退：长期不用会衰退
 */

import type { Neurotransmitter } from './neurotransmitter';
import type { Neuron, NeuronType } from './neuron-system';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 突触状态
 */
export enum SynapseState {
  ACTIVE = 'active',       // 正常活跃
  WEAKENED = 'weakened',   // 减弱
  STRENGTHENED = 'strengthened', // 增强
  DORMANT = 'dormant',     // 休眠（长期未用）
  PRUNED = 'pruned',       // 已修剪（删除）
}

/**
 * 突触
 */
export interface Synapse {
  /** 唯一标识 */
  id: string;
  
  /** 源神经元ID */
  sourceId: string;
  
  /** 目标神经元ID */
  targetId: string;
  
  /** 权重 [0, 1] */
  weight: number;
  
  /** 基线权重（长期平均） */
  baselineWeight: number;
  
  /** 传递延迟（毫秒） */
  delay: number;
  
  /** 可塑性 [0, 1]：高的更容易改变 */
  plasticity: number;
  
  /** 状态 */
  state: SynapseState;
  
  /** 最近传递次数 */
  recentTransmissions: number;
  
  /** 总传递次数 */
  totalTransmissions: number;
  
  /** 上次传递时间 */
  lastTransmission: number;
  
  /** 成功传递次数 */
  successfulTransmissions: number;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 元数据 */
  metadata?: {
    sourceType?: NeuronType;
    targetType?: NeuronType;
    creationReason?: string;
  };
}

/**
 * 突触配置
 */
interface SynapseConfig {
  /** 默认权重 */
  defaultWeight: number;
  
  /** 默认延迟（毫秒） */
  defaultDelay: number;
  
  /** 默认可塑性 */
  defaultPlasticity: number;
  
  /** Hebbian学习率 */
  hebbianRate: number;
  
  /** STDP时间窗口（毫秒） */
  stdpWindow: number;
  
  /** 长时程增强幅度 */
  ltpAmount: number;
  
  /** 长时程抑制幅度 */
  ltdAmount: number;
  
  /** 衰退率（不用则衰退） */
  decayRate: number;
  
  /** 衰退半衰期（毫秒） */
  decayHalfLife: number;
  
  /** 休眠阈值 */
  dormantThreshold: number;
  
  /** 修剪阈值 */
  pruneThreshold: number;
}

const DEFAULT_CONFIG: SynapseConfig = {
  defaultWeight: 0.5,
  defaultDelay: 10, // 10ms
  defaultPlasticity: 0.3,
  
  // Hebbian学习
  hebbianRate: 0.1,
  
  // STDP
  stdpWindow: 100, // 100ms
  ltpAmount: 0.05,
  ltdAmount: 0.03,
  
  // 衰退
  decayRate: 0.001,
  decayHalfLife: 7 * 24 * 60 * 60 * 1000, // 7天
  
  // 阈值
  dormantThreshold: 0.1,
  pruneThreshold: 0.05,
};

/**
 * 突触管理器
 */
export class SynapseManager {
  /** 所有突触 */
  private synapses: Map<string, Synapse> = new Map();
  
  /** 按源神经元索引 */
  private outgoingSynapses: Map<string, Set<string>> = new Map();
  
  /** 按目标神经元索引 */
  private incomingSynapses: Map<string, Set<string>> = new Map();
  
  /** 配置 */
  private config: SynapseConfig;
  
  /** ID计数器 */
  private idCounter: number = 0;
  
  /** 数据库客户端 */
  private supabase = getSupabaseClient();
  
  constructor(config: Partial<SynapseConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * 创建突触
   */
  create(
    sourceId: string,
    targetId: string,
    options: {
      weight?: number;
      delay?: number;
      plasticity?: number;
      reason?: string;
    } = {}
  ): Synapse {
    // 检查是否已存在
    const existingId = this.findSynapseId(sourceId, targetId);
    if (existingId) {
      const existing = this.synapses.get(existingId)!;
      // 更新权重
      if (options.weight !== undefined) {
        existing.weight = Math.max(existing.weight, options.weight);
      }
      return existing;
    }
    
    const id = this.generateId(sourceId, targetId);
    
    const synapse: Synapse = {
      id,
      sourceId,
      targetId,
      weight: options.weight ?? this.config.defaultWeight,
      baselineWeight: options.weight ?? this.config.defaultWeight,
      delay: options.delay ?? this.config.defaultDelay,
      plasticity: options.plasticity ?? this.config.defaultPlasticity,
      state: SynapseState.ACTIVE,
      recentTransmissions: 0,
      totalTransmissions: 0,
      lastTransmission: 0,
      successfulTransmissions: 0,
      createdAt: Date.now(),
      metadata: {
        creationReason: options.reason,
      },
    };
    
    // 存储
    this.synapses.set(id, synapse);
    
    // 索引
    if (!this.outgoingSynapses.has(sourceId)) {
      this.outgoingSynapses.set(sourceId, new Set());
    }
    this.outgoingSynapses.get(sourceId)!.add(id);
    
    if (!this.incomingSynapses.has(targetId)) {
      this.incomingSynapses.set(targetId, new Set());
    }
    this.incomingSynapses.get(targetId)!.add(id);
    
    return synapse;
  }
  
  /**
   * 获取突触
   */
  get(id: string): Synapse | undefined {
    return this.synapses.get(id);
  }
  
  /**
   * 查找两个神经元之间的突触ID
   */
  findSynapseId(sourceId: string, targetId: string): string | null {
    const outgoing = this.outgoingSynapses.get(sourceId);
    if (!outgoing) return null;
    
    for (const id of outgoing) {
      const synapse = this.synapses.get(id);
      if (synapse && synapse.targetId === targetId) {
        return id;
      }
    }
    
    return null;
  }
  
  /**
   * 获取神经元的所有输出突触
   */
  getOutgoing(sourceId: string): Synapse[] {
    const ids = this.outgoingSynapses.get(sourceId);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.synapses.get(id))
      .filter((s): s is Synapse => s !== undefined);
  }
  
  /**
   * 获取神经元的所有输入突触
   */
  getIncoming(targetId: string): Synapse[] {
    const ids = this.incomingSynapses.get(targetId);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.synapses.get(id))
      .filter((s): s is Synapse => s !== undefined);
  }
  
  /**
   * 传递神经递质
   * 
   * 返回传递后的递质（可能被加权、延迟）
   */
  transmit(
    synapse: Synapse,
    transmitter: Neurotransmitter
  ): { transmitted: boolean; delay: number; weightedIntensity: number } {
    // 检查突触状态
    if (synapse.state === SynapseState.DORMANT || synapse.state === SynapseState.PRUNED) {
      return { transmitted: false, delay: 0, weightedIntensity: 0 };
    }
    
    // 计算加权后的强度
    const weightedIntensity = transmitter.intensity * synapse.weight;
    
    // 更新统计
    synapse.recentTransmissions++;
    synapse.totalTransmissions++;
    synapse.lastTransmission = Date.now();
    
    return {
      transmitted: true,
      delay: synapse.delay,
      weightedIntensity,
    };
  }
  
  /**
   * 确认传递成功
   */
  confirmTransmission(synapseId: string): void {
    const synapse = this.synapses.get(synapseId);
    if (!synapse) return;
    
    synapse.successfulTransmissions++;
  }
  
  /**
   * Hebbian学习
   * 
   * "一起激发的神经元连接在一起"
   * 当源神经元和目标神经元在短时间内都激活时，增强连接
   */
  hebbianLearning(
    synapse: Synapse,
    sourceFired: boolean,
    targetFired: boolean,
    timeDiff: number // 源发放到目标发放的时间差（毫秒）
  ): void {
    if (!sourceFired || !targetFired) return;
    
    // 时间依赖可塑性（STDP）
    if (Math.abs(timeDiff) <= this.config.stdpWindow) {
      if (timeDiff > 0) {
        // 源先于目标：长时程增强（LTP）
        this.strengthen(synapse, this.config.ltpAmount);
      } else {
        // 目标先于源：长时程抑制（LTD）
        this.weaken(synapse, this.config.ltdAmount);
      }
    }
  }
  
  /**
   * 增强突触
   */
  strengthen(synapse: Synapse, amount: number): void {
    const delta = amount * synapse.plasticity;
    synapse.weight = Math.min(1, synapse.weight + delta);
    synapse.baselineWeight = synapse.baselineWeight * 0.9 + synapse.weight * 0.1;
    synapse.state = SynapseState.STRENGTHENED;
  }
  
  /**
   * 减弱突触
   */
  weaken(synapse: Synapse, amount: number): void {
    const delta = amount * synapse.plasticity;
    synapse.weight = Math.max(0, synapse.weight - delta);
    synapse.baselineWeight = synapse.baselineWeight * 0.9 + synapse.weight * 0.1;
    
    if (synapse.weight < this.config.dormantThreshold) {
      synapse.state = SynapseState.DORMANT;
    } else {
      synapse.state = SynapseState.WEAKENED;
    }
  }
  
  /**
   * 衰退处理
   * 
   * 长期不用的突触会衰退
   */
  decay(synapse: Synapse): void {
    const timeSinceLastUse = Date.now() - synapse.lastTransmission;
    
    // 指数衰减
    const decayFactor = Math.exp(
      -this.config.decayRate * timeSinceLastUse / this.config.decayHalfLife
    );
    
    synapse.weight = synapse.baselineWeight * decayFactor;
    
    // 状态更新
    if (synapse.weight < this.config.pruneThreshold) {
      synapse.state = SynapseState.PRUNED;
    } else if (synapse.weight < this.config.dormantThreshold) {
      synapse.state = SynapseState.DORMANT;
    }
  }
  
  /**
   * 修剪突触
   * 
   * 删除过弱的突触
   */
  prune(synapseId: string): boolean {
    const synapse = this.synapses.get(synapseId);
    if (!synapse) return false;
    
    if (synapse.state !== SynapseState.PRUNED) return false;
    
    // 从索引中移除
    const outgoing = this.outgoingSynapses.get(synapse.sourceId);
    if (outgoing) outgoing.delete(synapseId);
    
    const incoming = this.incomingSynapses.get(synapse.targetId);
    if (incoming) incoming.delete(synapseId);
    
    // 删除突触
    this.synapses.delete(synapseId);
    
    return true;
  }
  
  /**
   * 批量衰退处理
   */
  decayAll(): { decayed: number; pruned: number } {
    let decayed = 0;
    let pruned = 0;
    
    const toPrune: string[] = [];
    
    for (const synapse of this.synapses.values()) {
      this.decay(synapse);
      decayed++;
      
      if (synapse.state === SynapseState.PRUNED) {
        toPrune.push(synapse.id);
      }
    }
    
    for (const id of toPrune) {
      if (this.prune(id)) {
        pruned++;
      }
    }
    
    return { decayed, pruned };
  }
  
  /**
   * 突触稳态调节
   * 
   * 维持神经元输入输出的平衡
   */
  homeostasis(
    neuronId: string,
    targetTotalWeight: number = 5.0
  ): void {
    const incoming = this.getIncoming(neuronId);
    
    if (incoming.length === 0) return;
    
    const currentTotal = incoming.reduce((sum, s) => sum + s.weight, 0);
    
    if (Math.abs(currentTotal - targetTotalWeight) < 0.1) return;
    
    // 按比例调整
    const scale = targetTotalWeight / currentTotal;
    
    for (const synapse of incoming) {
      synapse.weight = Math.min(1, Math.max(0.1, synapse.weight * scale));
    }
  }
  
  /**
   * 重置最近传递计数
   */
  resetRecentTransmissions(): void {
    for (const synapse of this.synapses.values()) {
      synapse.recentTransmissions = 0;
    }
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    total: number;
    byState: Record<SynapseState, number>;
    avgWeight: number;
    avgPlasticity: number;
    mostActive: string | null;
    strongest: string | null;
  } {
    const synapseList = Array.from(this.synapses.values());
    
    const byState: Record<SynapseState, number> = {
      [SynapseState.ACTIVE]: 0,
      [SynapseState.WEAKENED]: 0,
      [SynapseState.STRENGTHENED]: 0,
      [SynapseState.DORMANT]: 0,
      [SynapseState.PRUNED]: 0,
    };
    
    for (const s of synapseList) {
      byState[s.state]++;
    }
    
    const avgWeight = synapseList.length > 0
      ? synapseList.reduce((sum, s) => sum + s.weight, 0) / synapseList.length
      : 0;
    
    const avgPlasticity = synapseList.length > 0
      ? synapseList.reduce((sum, s) => sum + s.plasticity, 0) / synapseList.length
      : 0;
    
    let mostActive: Synapse | null = null;
    let strongest: Synapse | null = null;
    
    for (const s of synapseList) {
      if (!mostActive || s.totalTransmissions > mostActive.totalTransmissions) {
        mostActive = s;
      }
      if (!strongest || s.weight > strongest.weight) {
        strongest = s;
      }
    }
    
    return {
      total: synapseList.length,
      byState,
      avgWeight,
      avgPlasticity,
      mostActive: mostActive?.id || null,
      strongest: strongest?.id || null,
    };
  }
  
  /**
   * 生成突触ID
   */
  private generateId(sourceId: string, targetId: string): string {
    return `syn-${sourceId.slice(-8)}-${targetId.slice(-8)}-${++this.idCounter}`;
  }
  
  /**
   * 保存到数据库
   */
  async saveToDatabase(): Promise<void> {
    const records = Array.from(this.synapses.values()).map(s => ({
      id: s.id,
      source_neuron_id: s.sourceId,
      target_neuron_id: s.targetId,
      weight: s.weight,
      baseline_weight: s.baselineWeight,
      delay: s.delay,
      plasticity: s.plasticity,
      state: s.state,
      total_transmissions: s.totalTransmissions,
      successful_transmissions: s.successfulTransmissions,
      last_transmission: s.lastTransmission,
      created_at: s.createdAt,
    }));
    
    if (records.length === 0) return;
    
    // 批量插入/更新
    const { error } = await this.supabase
      .from('neuron_synapses')
      .upsert(records, { onConflict: 'id' });
    
    if (error) {
      console.error('[SynapseManager] Save error:', error);
    }
  }
  
  /**
   * 从数据库加载
   */
  async loadFromDatabase(): Promise<void> {
    const { data, error } = await this.supabase
      .from('neuron_synapses')
      .select('*');
    
    if (error || !data) {
      console.error('[SynapseManager] Load error:', error);
      return;
    }
    
    this.synapses.clear();
    this.outgoingSynapses.clear();
    this.incomingSynapses.clear();
    
    for (const record of data) {
      const synapse: Synapse = {
        id: record.id,
        sourceId: record.source_neuron_id,
        targetId: record.target_neuron_id,
        weight: record.weight,
        baselineWeight: record.baseline_weight,
        delay: record.delay,
        plasticity: record.plasticity,
        state: record.state as SynapseState,
        recentTransmissions: 0,
        totalTransmissions: record.total_transmissions,
        successfulTransmissions: record.successful_transmissions,
        lastTransmission: record.last_transmission,
        createdAt: record.created_at,
      };
      
      this.synapses.set(synapse.id, synapse);
      
      // 索引
      if (!this.outgoingSynapses.has(synapse.sourceId)) {
        this.outgoingSynapses.set(synapse.sourceId, new Set());
      }
      this.outgoingSynapses.get(synapse.sourceId)!.add(synapse.id);
      
      if (!this.incomingSynapses.has(synapse.targetId)) {
        this.incomingSynapses.set(synapse.targetId, new Set());
      }
      this.incomingSynapses.get(synapse.targetId)!.add(synapse.id);
    }
    
    console.log(`[SynapseManager] Loaded ${this.synapses.size} synapses`);
  }
}

// ==================== 单例管理 ====================

let globalManager: SynapseManager | null = null;

/**
 * 获取全局突触管理器
 */
export function getSynapseManager(): SynapseManager {
  if (!globalManager) {
    globalManager = new SynapseManager();
  }
  return globalManager;
}
