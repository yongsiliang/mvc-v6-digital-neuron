/**
 * 神经元链接强度系统
 * 
 * 核心理念：
 * - 没有预设角色，每个神经元是平等的
 * - 链接强度通过实际使用动态演化
 * - 高链接强度的神经元更容易被激活
 * - 类似真实神经网络的Hebbian学习：一起激活，连接增强
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 神经元链接状态
 */
export interface NeuronLinkState {
  neuronId: string;
  strength: number;         // 0-1，链接强度
  activations: number;      // 累计激活次数
  lastActivated: Date;      // 最后激活时间
  decayFactor: number;      // 衰减因子，长期不用的神经元会衰减
}

/**
 * 神经元链接强度管理器
 * 
 * 职责：
 * 1. 追踪每个神经元的链接强度
 * 2. 根据输入选择激活哪些神经元
 * 3. 根据结果反馈更新链接强度
 */
export class NeuronLinkManager {
  private supabase = getSupabaseClient();
  
  // 神经元ID列表（没有预设角色）
  private readonly NEURON_IDS = [
    'doubao-seed-1-8-251228',
    'deepseek-v3-2-251201', 
    'doubao-seed-2-0-lite-260215',
  ];
  
  // 链接强度阈值
  private readonly ACTIVATION_THRESHOLD = 0.2;  // 低于此值不太可能被激活
  private readonly MAX_ACTIVE_NEURONS = 3;       // 每次最多激活的神经元数
  private readonly STRENGTH_BOOST = 0.05;        // 每次成功激活的强度增量
  private readonly STRENGTH_DECAY = 0.02;        // 每次不激活的强度衰减
  private readonly MIN_STRENGTH = 0.1;           // 最小强度
  private readonly MAX_STRENGTH = 1.0;           // 最大强度
  
  // 内存缓存
  private linkCache: Map<string, NeuronLinkState> = new Map();
  private lastRefresh: number = 0;
  private CACHE_TTL = 60000; // 缓存1分钟
  
  /**
   * 获取所有神经元的链接状态
   */
  async getLinkStates(): Promise<NeuronLinkState[]> {
    const now = Date.now();
    
    // 使用缓存
    if (this.linkCache.size > 0 && now - this.lastRefresh < this.CACHE_TTL) {
      return Array.from(this.linkCache.values());
    }
    
    // 从数据库加载
    const states = await this.loadLinkStates();
    
    // 更新缓存
    this.linkCache.clear();
    states.forEach(s => this.linkCache.set(s.neuronId, s));
    this.lastRefresh = now;
    
    return states;
  }
  
  /**
   * 从数据库加载链接状态
   */
  private async loadLinkStates(): Promise<NeuronLinkState[]> {
    try {
      const { data, error } = await this.supabase
        .from('neuron_links')
        .select('*');
      
      if (error) {
        // 表可能不存在，返回默认值
        return this.getDefaultStates();
      }
      
      // 如果没有数据，初始化默认值
      if (!data || data.length === 0) {
        return this.getDefaultStates();
      }
      
      // 合并数据库数据和默认神经元
      const states: NeuronLinkState[] = [];
      const existingIds = new Set(data.map((d: any) => d.neuron_id));
      
      // 添加已存在的
      for (const row of data as any[]) {
        if (this.NEURON_IDS.includes(row.neuron_id)) {
          states.push({
            neuronId: row.neuron_id,
            strength: row.strength || 0.5,
            activations: row.activations || 0,
            lastActivated: new Date(row.last_activated || Date.now()),
            decayFactor: row.decay_factor || 1.0,
          });
        }
      }
      
      // 添加新神经元
      for (const id of this.NEURON_IDS) {
        if (!existingIds.has(id)) {
          const defaultState = {
            neuronId: id,
            strength: 0.5,
            activations: 0,
            lastActivated: new Date(),
            decayFactor: 1.0,
          };
          states.push(defaultState);
          // 异步保存
          this.saveLinkState(defaultState).catch(() => {});
        }
      }
      
      return states;
    } catch {
      return this.getDefaultStates();
    }
  }
  
  /**
   * 获取默认状态
   */
  private getDefaultStates(): NeuronLinkState[] {
    return this.NEURON_IDS.map(id => ({
      neuronId: id,
      strength: 0.5,  // 初始中等强度
      activations: 0,
      lastActivated: new Date(),
      decayFactor: 1.0,
    }));
  }
  
  /**
   * 保存链接状态
   */
  private async saveLinkState(state: NeuronLinkState): Promise<void> {
    try {
      await this.supabase
        .from('neuron_links')
        .upsert({
          neuron_id: state.neuronId,
          strength: state.strength,
          activations: state.activations,
          last_activated: state.lastActivated.toISOString(),
          decay_factor: state.decayFactor,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'neuron_id' });
    } catch {
      // 忽略错误，降级处理
    }
  }
  
  /**
   * 选择激活的神经元
   * 
   * 基于链接强度和随机性：
   * - 高强度神经元更容易被选中
   * - 但所有神经元都有机会（探索机制）
   */
  async selectActiveNeurons(): Promise<string[]> {
    const states = await this.getLinkStates();
    
    // 计算每个神经元的激活概率
    const probabilities = states.map(s => ({
      id: s.neuronId,
      probability: this.calculateActivationProbability(s),
    }));
    
    // 加权随机选择
    const selected: string[] = [];
    const candidates = [...probabilities];
    
    while (selected.length < this.MAX_ACTIVE_NEURONS && candidates.length > 0) {
      const chosen = this.weightedRandomSelect(candidates);
      if (chosen && !selected.includes(chosen)) {
        selected.push(chosen);
      }
      // 移除已选中的
      const idx = candidates.findIndex(c => c.id === chosen);
      if (idx >= 0) candidates.splice(idx, 1);
    }
    
    return selected;
  }
  
  /**
   * 计算激活概率
   */
  private calculateActivationProbability(state: NeuronLinkState): number {
    // 基础概率 = 链接强度
    let prob = state.strength;
    
    // 时间衰减：长期不用的神经元概率降低
    const daysSinceLastActive = (Date.now() - state.lastActivated.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastActive > 7) {
      prob *= Math.max(0.3, 1 - daysSinceLastActive / 30);  // 最多衰减到30%
    }
    
    // 探索奖励：激活次数少的神经元有探索加成
    if (state.activations < 10) {
      prob *= 1 + (10 - state.activations) * 0.02;  // 最多+20%
    }
    
    return Math.min(1, prob);
  }
  
  /**
   * 加权随机选择
   */
  private weightedRandomSelect(items: Array<{ id: string; probability: number }>): string | null {
    if (items.length === 0) return null;
    
    const totalWeight = items.reduce((sum, item) => sum + item.probability, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of items) {
      random -= item.probability;
      if (random <= 0) {
        return item.id;
      }
    }
    
    return items[items.length - 1].id;
  }
  
  /**
   * 记录激活并更新链接强度
   * 
   * @param neuronId 被激活的神经元
   * @param success 是否成功（输出被采纳）
   */
  async recordActivation(neuronId: string, success: boolean = true): Promise<void> {
    const states = await this.getLinkStates();
    const state = states.find(s => s.neuronId === neuronId);
    
    if (!state) return;
    
    // 更新状态
    state.activations += 1;
    state.lastActivated = new Date();
    
    if (success) {
      // 成功激活，增强链接
      state.strength = Math.min(this.MAX_STRENGTH, state.strength + this.STRENGTH_BOOST);
    } else {
      // 失败，轻微衰减
      state.strength = Math.max(this.MIN_STRENGTH, state.strength - this.STRENGTH_DECAY);
    }
    
    // 更新缓存和数据库
    this.linkCache.set(neuronId, state);
    await this.saveLinkState(state);
  }
  
  /**
   * 应用时间衰减
   * 对所有神经元应用衰减
   */
  async applyTimeDecay(): Promise<void> {
    const states = await this.getLinkStates();
    
    for (const state of states) {
      const daysSinceLastActive = (Date.now() - state.lastActivated.getTime()) / (1000 * 60 * 60 * 24);
      
      // 超过3天未激活，开始衰减
      if (daysSinceLastActive > 3) {
        const decayAmount = (daysSinceLastActive - 3) * 0.01;  // 每天衰减1%
        state.strength = Math.max(this.MIN_STRENGTH, state.strength - decayAmount);
        state.decayFactor = Math.max(0.5, 1 - daysSinceLastActive / 60);
        
        this.linkCache.set(state.neuronId, state);
        await this.saveLinkState(state);
      }
    }
  }
  
  /**
   * 获取链接强度报告
   */
  async getStrengthReport(): Promise<{
    neurons: Array<{
      id: string;
      strength: number;
      activations: number;
      daysSinceActive: number;
    }>;
    totalActivations: number;
  }> {
    const states = await this.getLinkStates();
    
    const neurons = states.map(s => ({
      id: s.neuronId.split('/').pop() || s.neuronId,  // 简化ID显示
      strength: Math.round(s.strength * 100) / 100,
      activations: s.activations,
      daysSinceActive: Math.round((Date.now() - s.lastActivated.getTime()) / (1000 * 60 * 60 * 24) * 10) / 10,
    }));
    
    const totalActivations = states.reduce((sum, s) => sum + s.activations, 0);
    
    return { neurons, totalActivations };
  }
}

// 单例
let linkManagerInstance: NeuronLinkManager | null = null;

export function getNeuronLinkManager(): NeuronLinkManager {
  if (!linkManagerInstance) {
    linkManagerInstance = new NeuronLinkManager();
  }
  return linkManagerInstance;
}
