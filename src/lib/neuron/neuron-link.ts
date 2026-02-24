/**
 * 神经元链接动力学
 * 
 * 核心思想：
 * - 神经元之间没有预设角色，是平等的
 * - 链接强度通过实际使用动态演化
 * - 遵循神经科学原理：Hebbian学习、STDP、突触可塑性
 * - 高强度的神经元更容易被激活，形成"习惯"
 * - 长期不用的会衰退，形成"遗忘"
 * 
 * 这不是简单的权重管理，是"突触的物理过程"
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 突触状态
 */
export interface SynapseState {
  neuronId: string;
  
  // 基础属性
  strength: number;           // 突触强度 [0,1]
  baselineStrength: number;   // 基线强度（长期平均）
  
  // 动态属性
  recentActivations: number;  // 最近激活次数
  lastActivated: number;      // 最后激活时间戳
  lastFailed: number;         // 最后失败时间戳
  
  // 可塑性参数
  plasticity: number;         // 可塑性 [0,1]，高的更容易改变
  fatigue: number;            // 疲劳度 [0,1]，高的需要休息
  
  // 时间依赖
  spikeTiming: number[];      // 最近激活时间点（用于STDP）
  
  // 元数据
  createdAt: number;
  totalActivations: number;
  successfulActivations: number;
}

/**
 * 突触参数
 */
interface SynapseParams {
  // Hebbian学习参数
  hebbianRate: number;        // Hebbian学习率
  hebbianDecay: number;       // Hebbian衰减
  
  // STDP参数（脉冲时间依赖可塑性）
  stdpWindow: number;         // STDP时间窗口（毫秒）
  stdpLTP: number;            // 长时程增强
  stdpLTD: number;            // 长时程抑制
  
  // 突触稳态
  homeostasisRate: number;    // 稳态调节率
  targetStrength: number;     // 目标强度
  
  // 疲劳和恢复
  fatigueRate: number;        // 疲劳累积率
  recoveryRate: number;       // 恢复率
  
  // 衰退
  decayRate: number;          // 不用则衰退
  decayHalfLife: number;      // 衰退半衰期（毫秒）
  
  // 激活阈值
  activationThreshold: number; // 激活阈值
  noiseLevel: number;          // 噪声水平
}

/**
 * 神经元链接管理器
 */
export class NeuronLinkDynamics {
  /** 突触状态 */
  private synapses: Map<string, SynapseState> = new Map();
  
  /** 可用的神经元 */
  private readonly NEURON_IDS = [
    'doubao-seed-1-8-251228',
    'deepseek-v3-2-251201',
    'doubao-seed-2-0-lite-260215',
  ];
  
  /** 参数 */
  private params: SynapseParams = {
    // Hebbian
    hebbianRate: 0.1,
    hebbianDecay: 0.01,
    
    // STDP
    stdpWindow: 1000,      // 1秒窗口
    stdpLTP: 0.05,         // 增强幅度
    stdpLTD: 0.03,         // 抑制幅度
    
    // 稳态
    homeostasisRate: 0.001,
    targetStrength: 0.5,
    
    // 疲劳
    fatigueRate: 0.1,
    recoveryRate: 0.02,
    
    // 衰退
    decayRate: 0.0001,
    decayHalfLife: 7 * 24 * 60 * 60 * 1000, // 7天
    
    // 激活
    activationThreshold: 0.3,
    noiseLevel: 0.1,
  };
  
  /** 数据库 */
  private supabase = getSupabaseClient();
  
  /** 是否已加载 */
  private loaded: boolean = false;
  
  /** 上次更新时间 */
  private lastUpdate: number = Date.now();
  
  constructor() {
    this.initialize();
  }
  
  /**
   * 选择激活的神经元
   * 
   * 基于突触强度和当前状态，选择哪些神经元被激活
   * 遵循神经科学的"软最大"原则
   */
  async selectActiveNeurons(
    inputContext?: string,
    maxNeurons: number = 2
  ): Promise<string[]> {
    if (!this.loaded) {
      await this.loadSynapses();
    }
    
    // 先进行时间演化（衰退、恢复等）
    this.evolve();
    
    const candidates: Array<{
      id: string;
      strength: number;
      probability: number;
    }> = [];
    
    for (const [id, synapse] of this.synapses) {
      // 计算有效强度（考虑疲劳）
      const effectiveStrength = synapse.strength * (1 - synapse.fatigue);
      
      // 计算激活概率（软最大）
      // 使用Boltzmann分布：P = exp(β*x) / Z
      const temperature = 0.2; // 控制随机性
      const rawProbability = Math.exp(effectiveStrength / temperature);
      
      // 加入噪声（模拟神经噪声）
      const noise = (Math.random() - 0.5) * this.params.noiseLevel;
      const probability = Math.max(0, rawProbability + noise);
      
      candidates.push({
        id,
        strength: effectiveStrength,
        probability,
      });
    }
    
    // 归一化概率
    const totalProb = candidates.reduce((sum, c) => sum + c.probability, 0);
    candidates.forEach(c => c.probability /= totalProb);
    
    // 按概率选择（轮盘赌选择）
    const selected: string[] = [];
    const remaining = [...candidates];
    
    while (selected.length < maxNeurons && remaining.length > 0) {
      const choice = this.rouletteSelect(remaining);
      if (choice && !selected.includes(choice.id)) {
        selected.push(choice.id);
        
        // 从剩余中移除
        const idx = remaining.findIndex(c => c.id === choice.id);
        if (idx >= 0) remaining.splice(idx, 1);
      }
    }
    
    return selected;
  }
  
  /**
   * 记录激活结果
   * 
   * 核心学习机制：
   * 1. Hebbian学习：一起激活的神经元连接增强
   * 2. STDP：时序关系影响强度变化
   * 3. 突触稳态：保持整体平衡
   */
  async recordActivation(
    neuronId: string,
    success: boolean,
    context?: {
      responseQuality?: number;
      userFeedback?: number;
      relatedNeurons?: string[];
    }
  ): Promise<void> {
    const synapse = this.synapses.get(neuronId);
    if (!synapse) return;
    
    const now = Date.now();
    
    // 更新激活记录
    synapse.recentActivations++;
    synapse.lastActivated = now;
    synapse.totalActivations++;
    if (success) {
      synapse.successfulActivations++;
    } else {
      synapse.lastFailed = now;
    }
    
    // 记录激活时间点（用于STDP）
    synapse.spikeTiming.push(now);
    if (synapse.spikeTiming.length > 10) {
      synapse.spikeTiming.shift();
    }
    
    // 1. Hebbian学习：成功激活增强连接
    if (success) {
      const qualityBoost = (context?.responseQuality || 0.5) * 0.2;
      const feedbackBoost = (context?.userFeedback || 0.5) * 0.1;
      
      synapse.strength += this.params.hebbianRate * (1 + qualityBoost + feedbackBoost);
      synapse.strength = Math.min(1, synapse.strength);
      
      // 提升可塑性（成功的学习会促进进一步学习）
      synapse.plasticity = Math.min(1, synapse.plasticity + 0.05);
    } else {
      // 失败激活轻微减弱
      synapse.strength -= this.params.hebbianDecay;
      synapse.strength = Math.max(0.1, synapse.strength);
    }
    
    // 2. STDP：与相关神经元的时序关系
    if (context?.relatedNeurons) {
      for (const relatedId of context.relatedNeurons) {
        if (relatedId === neuronId) continue;
        
        const related = this.synapses.get(relatedId);
        if (!related) continue;
        
        // 计算时间差
        const timeDiff = synapse.lastActivated - related.lastActivated;
        
        if (Math.abs(timeDiff) < this.params.stdpWindow) {
          if (timeDiff > 0) {
            // 这个神经元后激活，正向关联
            synapse.strength += this.params.stdpLTP;
          } else {
            // 这个神经元先激活，反向关联
            synapse.strength -= this.params.stdpLTD;
          }
        }
      }
    }
    
    // 3. 疲劳累积
    synapse.fatigue += this.params.fatigueRate;
    synapse.fatigue = Math.min(1, synapse.fatigue);
    
    // 4. 更新基线强度
    synapse.baselineStrength = 
      synapse.baselineStrength * 0.99 + synapse.strength * 0.01;
    
    // 异步保存
    this.saveSynapse(synapse).catch(() => {});
  }
  
  /**
   * 时间演化
   * 
   * 模拟突触的自然变化：
   * - 衰退：不用则退
   * - 恢复：疲劳恢复
   * - 稳态：趋向目标强度
   */
  evolve(): void {
    const now = Date.now();
    const elapsed = now - this.lastUpdate;
    this.lastUpdate = now;
    
    for (const synapse of this.synapses.values()) {
      // 1. 衰退：根据时间衰退
      const timeSinceLastActive = now - synapse.lastActivated;
      const decayFactor = Math.exp(-timeSinceLastActive / this.params.decayHalfLife);
      synapse.strength *= (1 - this.params.decayRate * elapsed / 1000);
      synapse.strength = Math.max(0.1, synapse.strength);
      
      // 2. 恢复：疲劳逐渐恢复
      if (synapse.fatigue > 0) {
        const recovery = this.params.recoveryRate * elapsed / 1000;
        synapse.fatigue = Math.max(0, synapse.fatigue - recovery);
      }
      
      // 3. 稳态：趋向目标强度
      const homeostasisForce = 
        (this.params.targetStrength - synapse.strength) * this.params.homeostasisRate;
      synapse.strength += homeostasisForce;
      
      // 4. 最近激活计数衰减
      synapse.recentActivations *= 0.99;
    }
  }
  
  /**
   * 获取突触状态报告
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
    averageStrength: number;
    strongestNeuron: string;
    mostFatigued: string;
  }> {
    if (!this.loaded) {
      await this.loadSynapses();
    }
    
    const synapseList = Array.from(this.synapses.values());
    
    const synapses = synapseList.map(s => ({
      id: s.neuronId,
      strength: s.strength,
      effectiveStrength: s.strength * (1 - s.fatigue),
      fatigue: s.fatigue,
      plasticity: s.plasticity,
      totalActivations: s.totalActivations,
      successRate: s.totalActivations > 0 
        ? s.successfulActivations / s.totalActivations 
        : 0,
    }));
    
    const totalActivations = synapseList.reduce((sum, s) => sum + s.totalActivations, 0);
    const averageStrength = synapseList.reduce((sum, s) => sum + s.strength, 0) / synapseList.length;
    
    const strongest = synapses.reduce((best, s) => 
      s.effectiveStrength > best.effectiveStrength ? s : best
    );
    const mostFatigued = synapses.reduce((worst, s) => 
      s.fatigue > worst.fatigue ? s : worst
    );
    
    return {
      synapses,
      totalActivations,
      averageStrength,
      strongestNeuron: strongest.id,
      mostFatigued: mostFatigued.id,
    };
  }
  
  /**
   * 获取链接状态（兼容旧接口）
   */
  async getLinkStates(): Promise<Array<{
    neuronId: string;
    strength: number;
    activations: number;
    lastActivated: Date;
    decayFactor: number;
  }>> {
    if (!this.loaded) {
      await this.loadSynapses();
    }
    
    return Array.from(this.synapses.values()).map(s => ({
      neuronId: s.neuronId,
      strength: s.strength * (1 - s.fatigue),
      activations: s.totalActivations,
      lastActivated: new Date(s.lastActivated),
      decayFactor: 1 - s.fatigue,
    }));
  }
  
  /**
   * 手动调整参数
   */
  setParams(params: Partial<SynapseParams>): void {
    this.params = { ...this.params, ...params };
  }
  
  // ==================== 私有方法 ====================
  
  private async initialize(): Promise<void> {
    await this.loadSynapses();
    
    // 确保所有神经元都有对应突触
    for (const id of this.NEURON_IDS) {
      if (!this.synapses.has(id)) {
        this.synapses.set(id, this.createDefaultSynapse(id));
      }
    }
  }
  
  private createDefaultSynapse(id: string): SynapseState {
    return {
      neuronId: id,
      strength: 0.5,
      baselineStrength: 0.5,
      recentActivations: 0,
      lastActivated: Date.now(),
      lastFailed: 0,
      plasticity: 0.5,
      fatigue: 0,
      spikeTiming: [],
      createdAt: Date.now(),
      totalActivations: 0,
      successfulActivations: 0,
    };
  }
  
  private rouletteSelect(candidates: Array<{ id: string; probability: number }>): { id: string; probability: number } | null {
    const random = Math.random();
    let cumulative = 0;
    
    for (const candidate of candidates) {
      cumulative += candidate.probability;
      if (random < cumulative) {
        return candidate;
      }
    }
    
    return candidates.length > 0 ? candidates[0] : null;
  }
  
  private async loadSynapses(): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('neuron_synapses')
        .select('*');
      
      if (data && data.length > 0) {
        for (const row of data as any[]) {
          this.synapses.set(row.neuron_id, {
            neuronId: row.neuron_id,
            strength: row.strength || 0.5,
            baselineStrength: row.baseline_strength || 0.5,
            recentActivations: row.recent_activations || 0,
            lastActivated: new Date(row.last_activated || Date.now()).getTime(),
            lastFailed: new Date(row.last_failed || 0).getTime(),
            plasticity: row.plasticity || 0.5,
            fatigue: row.fatigue || 0,
            spikeTiming: row.spike_timing || [],
            createdAt: new Date(row.created_at || Date.now()).getTime(),
            totalActivations: row.total_activations || 0,
            successfulActivations: row.successful_activations || 0,
          });
        }
      }
    } catch {
      // 表不存在，使用默认值
    }
    
    this.loaded = true;
  }
  
  private async saveSynapse(synapse: SynapseState): Promise<void> {
    try {
      await this.supabase
        .from('neuron_synapses')
        .upsert({
          neuron_id: synapse.neuronId,
          strength: synapse.strength,
          baseline_strength: synapse.baselineStrength,
          recent_activations: synapse.recentActivations,
          last_activated: new Date(synapse.lastActivated).toISOString(),
          last_failed: new Date(synapse.lastFailed).toISOString(),
          plasticity: synapse.plasticity,
          fatigue: synapse.fatigue,
          spike_timing: synapse.spikeTiming,
          total_activations: synapse.totalActivations,
          successful_activations: synapse.successfulActivations,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'neuron_id' });
    } catch {
      // 忽略
    }
  }
}

// 单例
let dynamicsInstance: NeuronLinkDynamics | null = null;

export function getNeuronLinkDynamics(): NeuronLinkDynamics {
  if (!dynamicsInstance) {
    dynamicsInstance = new NeuronLinkDynamics();
  }
  return dynamicsInstance;
}

// 兼容旧接口
export const getNeuronLinkManager = getNeuronLinkDynamics;

export function resetNeuronLinkDynamics(): void {
  dynamicsInstance = null;
}
