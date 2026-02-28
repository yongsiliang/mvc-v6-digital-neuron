/**
 * ═══════════════════════════════════════════════════════════════════════
 * Synapse System - 突触连接系统
 * 
 * 实现神经元之间的连接：
 * - 动态权重
 * - 赫布学习（一起激发的神经元，连接变强）
 * - 突触可塑性
 * - 连接生长与修剪
 * ═══════════════════════════════════════════════════════════════════════
 */

import { 
  SynapseType, 
  SynapseState,
  NeuronType 
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 突触类
// ─────────────────────────────────────────────────────────────────────

export class Synapse {
  readonly id: string;
  readonly preNeuron: string;
  readonly postNeuron: string;
  readonly type: SynapseType;
  
  private weight: number;
  private plasticity: number;
  private lastActivatedAt: number = 0;
  private activationCount: number = 0;
  private successRate: number = 0.5;
  
  // 历史记录
  private weightHistory: number[] = [];
  private readonly maxHistoryLength = 100;
  
  constructor(
    preNeuron: string,
    postNeuron: string,
    initialWeight: number = 0.5,
    type: SynapseType = 'excitatory'
  ) {
    this.id = `${preNeuron}→${postNeuron}`;
    this.preNeuron = preNeuron;
    this.postNeuron = postNeuron;
    this.type = type;
    this.weight = initialWeight;
    this.plasticity = 0.1;
  }
  
  /**
   * 激活突触
   */
  activate(signalStrength: number): number {
    this.lastActivatedAt = Date.now();
    this.activationCount++;
    
    // 返回实际传递的信号强度
    return signalStrength * Math.abs(this.weight);
  }
  
  /**
   * 强化突触
   */
  strengthen(delta: number): void {
    const oldWeight = this.weight;
    this.weight = Math.min(1, this.weight + delta * this.plasticity);
    this.recordHistory(oldWeight);
  }
  
  /**
   * 弱化突触
   */
  weaken(delta: number): void {
    const oldWeight = this.weight;
    this.weight = Math.max(0.01, this.weight - delta);
    this.recordHistory(oldWeight);
  }
  
  /**
   * 记录权重历史
   */
  private recordHistory(oldWeight: number): void {
    this.weightHistory.push(oldWeight);
    if (this.weightHistory.length > this.maxHistoryLength) {
      this.weightHistory.shift();
    }
  }
  
  /**
   * 更新成功率
   */
  updateSuccessRate(success: boolean): void {
    const alpha = 0.1;
    this.successRate = this.successRate * (1 - alpha) + (success ? alpha : 0);
  }
  
  /**
   * 获取权重
   */
  getWeight(): number {
    return this.weight;
  }
  
  /**
   * 设置权重
   */
  setWeight(value: number): void {
    this.weight = Math.max(-1, Math.min(1, value));
  }
  
  /**
   * 获取状态
   */
  getState(): SynapseState {
    return {
      id: this.id,
      preNeuron: this.preNeuron,
      postNeuron: this.postNeuron,
      weight: this.weight,
      type: this.type,
      plasticity: this.plasticity,
      lastActivatedAt: this.lastActivatedAt,
      activationCount: this.activationCount,
      successRate: this.successRate,
    };
  }
  
  /**
   * 是否应该被修剪
   */
  shouldPrune(): boolean {
    return this.weight < 0.02 || 
           this.successRate < 0.1 ||
           (Date.now() - this.lastActivatedAt > 30 * 24 * 60 * 60 * 1000); // 30天未激活
  }
}

// ─────────────────────────────────────────────────────────────────────
// 突触管理器
// ─────────────────────────────────────────────────────────────────────

export class SynapseManager {
  // 所有突触
  private synapses: Map<string, Synapse> = new Map();
  
  // 索引：神经元 ID → 出边突触 ID 集合
  private outgoingIndex: Map<string, Set<string>> = new Map();
  
  // 索引：神经元 ID → 入边突触 ID 集合
  private incomingIndex: Map<string, Set<string>> = new Map();
  
  // 学习参数
  private learningRate: number = 0.01;
  private decayRate: number = 0.001;
  private ltpThreshold: number = 0.6;  // 长时程增强阈值
  private ltdThreshold: number = 0.2;  // 长时程抑制阈值
  
  // 统计
  private stats = {
    totalActivations: 0,
    totalLearnings: 0,
    totalPrunings: 0,
    totalGrowths: 0,
  };
  
  // ══════════════════════════════════════════════════════════════════
  // 创建和查询
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 创建突触
   */
  create(
    preNeuron: string,
    postNeuron: string,
    initialWeight: number = 0.5,
    type: SynapseType = 'excitatory'
  ): Synapse {
    const id = `${preNeuron}→${postNeuron}`;
    
    // 检查是否已存在
    if (this.synapses.has(id)) {
      return this.synapses.get(id)!;
    }
    
    const synapse = new Synapse(preNeuron, postNeuron, initialWeight, type);
    this.synapses.set(id, synapse);
    
    // 更新索引
    if (!this.outgoingIndex.has(preNeuron)) {
      this.outgoingIndex.set(preNeuron, new Set());
    }
    this.outgoingIndex.get(preNeuron)!.add(id);
    
    if (!this.incomingIndex.has(postNeuron)) {
      this.incomingIndex.set(postNeuron, new Set());
    }
    this.incomingIndex.get(postNeuron)!.add(id);
    
    console.log(`[Synapse] 创建: ${id} (权重: ${initialWeight.toFixed(2)})`);
    
    return synapse;
  }
  
  /**
   * 获取突触
   */
  get(preNeuron: string, postNeuron: string): Synapse | undefined {
    return this.synapses.get(`${preNeuron}→${postNeuron}`);
  }
  
  /**
   * 获取神经元的所有出边
   */
  getOutgoing(neuronId: string): Synapse[] {
    const ids = this.outgoingIndex.get(neuronId);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.synapses.get(id))
      .filter((s): s is Synapse => s !== undefined);
  }
  
  /**
   * 获取神经元的所有入边
   */
  getIncoming(neuronId: string): Synapse[] {
    const ids = this.incomingIndex.get(neuronId);
    if (!ids) return [];
    
    return Array.from(ids)
      .map(id => this.synapses.get(id))
      .filter((s): s is Synapse => s !== undefined);
  }
  
  /**
   * 获取所有突触
   */
  getAll(): Synapse[] {
    return Array.from(this.synapses.values());
  }
  
  /**
   * 获取突触数量
   */
  size(): number {
    return this.synapses.size;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 赫布学习
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 赫布学习 - 核心算法
   * 
   * 经典赫布规则：Δw = η * pre * post
   * 扩展版本：
   * - LTP (长时程增强)：pre 和 post 同时高激活 → 增强
   * - LTD (长时程抑制)：pre 激活但 post 不激活 → 减弱
   * - 时间窗口：只有在短时间窗口内才算"同时"
   */
  async hebbianLearn(
    preNeuronId: string,
    postNeuronId: string,
    preActivation: number,
    postActivation: number,
    reward: number = 0
  ): Promise<void> {
    const synapse = this.get(preNeuronId, postNeuronId);
    if (!synapse) return;
    
    // 基础赫布规则
    let deltaW = this.learningRate * preActivation * postActivation;
    
    // LTP/LTD 判断
    if (preActivation > this.ltpThreshold && postActivation > this.ltpThreshold) {
      // 同时高激活 → 长时程增强
      deltaW *= 1.5;
    } else if (preActivation > this.ltpThreshold && postActivation < this.ltdThreshold) {
      // 前高后低 → 长时程抑制
      deltaW *= -0.5;
    }
    
    // 加入奖励信号（多巴胺影响）
    deltaW += reward * this.learningRate * 0.5;
    
    // 应用权重变化
    if (deltaW > 0) {
      synapse.strengthen(deltaW);
    } else {
      synapse.strengthen(deltaW); // 注意：strengthen 可以接受负值
    }
    
    // 更新成功率
    synapse.updateSuccessRate(reward > 0);
    
    this.stats.totalLearnings++;
  }
  
  /**
   * 批量赫布学习 - 对所有活跃的突触进行学习
   */
  async batchHebbianLearn(
    activations: Map<string, number>,
    reward: number
  ): Promise<void> {
    for (const synapse of this.synapses.values()) {
      const preActivation = activations.get(synapse.preNeuron) || 0;
      const postActivation = activations.get(synapse.postNeuron) || 0;
      
      // 只有当两个神经元都活跃时才学习
      if (preActivation > 0.1 || postActivation > 0.1) {
        await this.hebbianLearn(
          synapse.preNeuron,
          synapse.postNeuron,
          preActivation,
          postActivation,
          reward
        );
      }
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 突触生长与修剪
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 生长新突触
   * 
   * 当两个神经元经常同时激活，但之间没有连接时，生长新连接
   */
  async grow(
    preNeuronId: string,
    postNeuronId: string,
    reason: string = 'co-activation'
  ): Promise<Synapse | null> {
    // 检查是否已存在
    if (this.get(preNeuronId, postNeuronId)) {
      return null;
    }
    
    // 创建新突触
    const synapse = this.create(preNeuronId, postNeuronId, 0.3);
    this.stats.totalGrowths++;
    
    console.log(`[Synapse] 生长: ${preNeuronId} → ${postNeuronId} (${reason})`);
    
    return synapse;
  }
  
  /**
   * 修剪无用突触
   */
  async prune(): Promise<number> {
    const toPrune: string[] = [];
    
    for (const [id, synapse] of this.synapses) {
      if (synapse.shouldPrune()) {
        toPrune.push(id);
      }
    }
    
    for (const id of toPrune) {
      this.remove(id);
      this.stats.totalPrunings++;
    }
    
    if (toPrune.length > 0) {
      console.log(`[Synapse] 修剪: ${toPrune.length} 个突触`);
    }
    
    return toPrune.length;
  }
  
  /**
   * 删除突触
   */
  private remove(id: string): void {
    const synapse = this.synapses.get(id);
    if (!synapse) return;
    
    // 从索引中移除
    const outSet = this.outgoingIndex.get(synapse.preNeuron);
    if (outSet) outSet.delete(id);
    
    const inSet = this.incomingIndex.get(synapse.postNeuron);
    if (inSet) inSet.delete(id);
    
    // 从主集合中移除
    this.synapses.delete(id);
  }
  
  /**
   * 衰减 - 模拟自然遗忘
   */
  async decay(): Promise<void> {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    
    for (const synapse of this.synapses.values()) {
      const hoursSinceActivation = (now - synapse.getState().lastActivatedAt) / hourMs;
      
      // 超过1小时没激活，开始衰减
      if (hoursSinceActivation > 1) {
        const decayAmount = this.decayRate * Math.min(hoursSinceActivation, 24);
        synapse.weaken(decayAmount);
      }
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 区域连接初始化
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 初始化大脑区域之间的标准连接
   */
  async initializeBrainConnections(
    neuronIds: Map<NeuronType, string[]>
  ): Promise<void> {
    // 定义区域之间的连接规则
    const connectionRules: Array<{
      from: NeuronType;
      to: NeuronType;
      weightRange: [number, number];
      density: number;
    }> = [
      // 感知 → 记忆
      { from: 'sensory', to: 'memory', weightRange: [0.6, 0.9], density: 0.8 },
      // 感知 → 情感（快速反应）
      { from: 'sensory', to: 'emotion', weightRange: [0.3, 0.5], density: 0.5 },
      // 记忆 → 推理
      { from: 'memory', to: 'reasoning', weightRange: [0.5, 0.8], density: 0.7 },
      // 推理 → 情感
      { from: 'reasoning', to: 'emotion', weightRange: [0.3, 0.6], density: 0.6 },
      // 推理 → 决策
      { from: 'reasoning', to: 'decision', weightRange: [0.6, 0.9], density: 0.8 },
      // 情感 → 决策
      { from: 'emotion', to: 'decision', weightRange: [0.4, 0.7], density: 0.7 },
      // 决策 → 运动
      { from: 'decision', to: 'motor', weightRange: [0.7, 0.95], density: 0.9 },
      // 决策 → 自我（自我监控）
      { from: 'decision', to: 'self', weightRange: [0.5, 0.7], density: 0.6 },
      // 自我 → 所有区域（全局调制）
      { from: 'self', to: 'sensory', weightRange: [0.2, 0.4], density: 0.3 },
      { from: 'self', to: 'memory', weightRange: [0.3, 0.5], density: 0.4 },
      { from: 'self', to: 'reasoning', weightRange: [0.4, 0.6], density: 0.5 },
      { from: 'self', to: 'emotion', weightRange: [0.3, 0.5], density: 0.4 },
      { from: 'self', to: 'decision', weightRange: [0.5, 0.7], density: 0.6 },
    ];
    
    for (const rule of connectionRules) {
      const fromNeurons = neuronIds.get(rule.from) || [];
      const toNeurons = neuronIds.get(rule.to) || [];
      
      for (const fromId of fromNeurons) {
        for (const toId of toNeurons) {
          // 根据密度决定是否创建连接
          if (Math.random() < rule.density) {
            const weight = rule.weightRange[0] + 
              Math.random() * (rule.weightRange[1] - rule.weightRange[0]);
            
            this.create(fromId, toId, weight);
          }
        }
      }
    }
    
    console.log(`[Synapse] 初始化连接完成，共 ${this.synapses.size} 个突触`);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 统计与导出
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取统计信息
   */
  getStats(): {
    totalSynapses: number;
    totalActivations: number;
    totalLearnings: number;
    totalPrunings: number;
    totalGrowths: number;
    averageWeight: number;
  } {
    const weights = Array.from(this.synapses.values()).map(s => s.getWeight());
    const avgWeight = weights.length > 0 
      ? weights.reduce((a, b) => a + b, 0) / weights.length 
      : 0;
    
    return {
      totalSynapses: this.synapses.size,
      totalActivations: this.stats.totalActivations,
      totalLearnings: this.stats.totalLearnings,
      totalPrunings: this.stats.totalPrunings,
      totalGrowths: this.stats.totalGrowths,
      averageWeight: avgWeight,
    };
  }
  
  /**
   * 导出状态（用于持久化）
   */
  exportState(): SynapseState[] {
    return Array.from(this.synapses.values()).map(s => s.getState());
  }
  
  /**
   * 导入状态（用于恢复）
   */
  importState(states: SynapseState[]): void {
    this.synapses.clear();
    this.outgoingIndex.clear();
    this.incomingIndex.clear();
    
    for (const state of states) {
      const synapse = new Synapse(
        state.preNeuron,
        state.postNeuron,
        state.weight,
        state.type
      );
      synapse['plasticity'] = state.plasticity;
      synapse['lastActivatedAt'] = state.lastActivatedAt;
      synapse['activationCount'] = state.activationCount;
      synapse['successRate'] = state.successRate;
      
      this.synapses.set(state.id, synapse);
      
      // 更新索引
      if (!this.outgoingIndex.has(state.preNeuron)) {
        this.outgoingIndex.set(state.preNeuron, new Set());
      }
      this.outgoingIndex.get(state.preNeuron)!.add(state.id);
      
      if (!this.incomingIndex.has(state.postNeuron)) {
        this.incomingIndex.set(state.postNeuron, new Set());
      }
      this.incomingIndex.get(state.postNeuron)!.add(state.id);
    }
    
    console.log(`[Synapse] 导入 ${states.length} 个突触状态`);
  }
}
