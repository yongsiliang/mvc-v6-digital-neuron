/**
 * ═══════════════════════════════════════════════════════════════════════
 * STDP Learning - 脉冲时间依赖可塑性学习
 * 
 * 更高级的赫布学习：
 * - 如果前神经元先于后神经元激发 → LTP (长时程增强)
 * - 如果后神经元先于前神经元激发 → LTD (长时程抑制)
 * 
 * 学习的时间窗口：前后脉冲的时间差决定权重变化的幅度
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface STDPConfig {
  /** 学习率 */
  learningRate: number;
  
  /** LTP 时间窗口 (毫秒) */
  ltpWindow: number;
  
  /** LTD 时间窗口 (毫秒) */
  ltdWindow: number;
  
  /** LTP 强度 */
  ltpStrength: number;
  
  /** LTD 强度 */
  ltdStrength: number;
  
  /** 权重上限 */
  maxWeight: number;
  
  /** 权重下限 */
  minWeight: number;
}

export interface SpikeEvent {
  neuronId: string;
  timestamp: number;
  strength: number;
}

export interface SynapseState {
  preNeuron: string;
  postNeuron: string;
  weight: number;
  lastPreSpike: number;
  lastPostSpike: number;
  ltpHistory: number[];  // 最近 LTP 事件
  ltdHistory: number[];  // 最近 LTD 事件
}

// ─────────────────────────────────────────────────────────────────────
// STDP 学习系统
// ─────────────────────────────────────────────────────────────────────

export class STDPLearner {
  protected config: STDPConfig;
  
  // 突触状态
  private synapses: Map<string, SynapseState> = new Map();
  
  // 最近的脉冲事件
  private recentSpikes: SpikeEvent[] = [];
  private readonly maxSpikeHistory = 1000;
  
  // 学习统计
  private stats = {
    totalLTP: 0,
    totalLTD: 0,
    totalSpikes: 0,
    averageWeight: 0.5,
  };
  
  constructor(config: Partial<STDPConfig> = {}) {
    this.config = {
      learningRate: config.learningRate ?? 0.01,
      ltpWindow: config.ltpWindow ?? 20,    // 20ms LTP 窗口
      ltdWindow: config.ltdWindow ?? 20,    // 20ms LTD 窗口
      ltpStrength: config.ltpStrength ?? 0.1,
      ltdStrength: config.ltdStrength ?? 0.12, // LTD 通常比 LTP 稍强
      maxWeight: config.maxWeight ?? 1.0,
      minWeight: config.minWeight ?? 0.01,
    };
  }
  
  /**
   * 注册突触
   */
  registerSynapse(preNeuron: string, postNeuron: string, initialWeight: number = 0.5): void {
    const id = this.getSynapseId(preNeuron, postNeuron);
    
    if (!this.synapses.has(id)) {
      this.synapses.set(id, {
        preNeuron,
        postNeuron,
        weight: initialWeight,
        lastPreSpike: 0,
        lastPostSpike: 0,
        ltpHistory: [],
        ltdHistory: [],
      });
    }
  }
  
  /**
   * 记录脉冲事件
   */
  recordSpike(neuronId: string, strength: number = 1): void {
    const spike: SpikeEvent = {
      neuronId,
      timestamp: Date.now(),
      strength,
    };
    
    this.recentSpikes.push(spike);
    this.stats.totalSpikes++;
    
    // 限制历史长度
    if (this.recentSpikes.length > this.maxSpikeHistory) {
      this.recentSpikes.shift();
    }
    
    // 处理 STDP
    this.processSTDP(neuronId, spike.timestamp);
  }
  
  /**
   * 处理 STDP 学习
   */
  private processSTDP(neuronId: string, timestamp: number): void {
    // 找到所有与此神经元相关的突触
    for (const [id, synapse] of this.synapses) {
      if (synapse.preNeuron === neuronId) {
        // 这是前神经元激发
        synapse.lastPreSpike = timestamp;
        
        // 检查是否有最近的后神经元激发（LTD 条件：后先于前）
        const timeDiff = synapse.lastPostSpike - timestamp;
        if (timeDiff > 0 && timeDiff < this.config.ltdWindow) {
          this.applyLTD(synapse, timeDiff);
        }
      } else if (synapse.postNeuron === neuronId) {
        // 这是后神经元激发
        synapse.lastPostSpike = timestamp;
        
        // 检查是否有最近的前神经元激发（LTP 条件：先于后）
        const timeDiff = timestamp - synapse.lastPreSpike;
        if (timeDiff > 0 && timeDiff < this.config.ltpWindow) {
          this.applyLTP(synapse, timeDiff);
        }
      }
    }
  }
  
  /**
   * 应用 LTP（长时程增强）
   */
  private applyLTP(synapse: SynapseState, timeDiff: number): void {
    // LTP 强度随时间差指数衰减
    const decayFactor = Math.exp(-timeDiff / this.config.ltpWindow);
    const deltaWeight = this.config.ltpStrength * decayFactor * this.config.learningRate;
    
    const oldWeight = synapse.weight;
    synapse.weight = Math.min(this.config.maxWeight, synapse.weight + deltaWeight);
    
    // 记录 LTP 历史
    synapse.ltpHistory.push(deltaWeight);
    if (synapse.ltpHistory.length > 100) {
      synapse.ltpHistory.shift();
    }
    
    this.stats.totalLTP++;
    
    console.log(`[STDP] LTP: ${synapse.preNeuron}→${synapse.postNeuron} ` +
                `${oldWeight.toFixed(4)} → ${synapse.weight.toFixed(4)} ` +
                `(Δ=${deltaWeight.toFixed(4)})`);
  }
  
  /**
   * 应用 LTD（长时程抑制）
   */
  private applyLTD(synapse: SynapseState, timeDiff: number): void {
    // LTD 强度随时间差指数衰减
    const decayFactor = Math.exp(-timeDiff / this.config.ltdWindow);
    const deltaWeight = this.config.ltdStrength * decayFactor * this.config.learningRate;
    
    const oldWeight = synapse.weight;
    synapse.weight = Math.max(this.config.minWeight, synapse.weight - deltaWeight);
    
    // 记录 LTD 历史
    synapse.ltdHistory.push(deltaWeight);
    if (synapse.ltdHistory.length > 100) {
      synapse.ltdHistory.shift();
    }
    
    this.stats.totalLTD++;
    
    console.log(`[STDP] LTD: ${synapse.preNeuron}→${synapse.postNeuron} ` +
                `${oldWeight.toFixed(4)} → ${synapse.weight.toFixed(4)} ` +
                `(Δ=-${deltaWeight.toFixed(4)})`);
  }
  
  /**
   * 获取突触权重
   */
  getWeight(preNeuron: string, postNeuron: string): number {
    const id = this.getSynapseId(preNeuron, postNeuron);
    const synapse = this.synapses.get(id);
    return synapse?.weight ?? 0.5;
  }
  
  /**
   * 获取所有突触状态
   */
  getAllSynapses(): SynapseState[] {
    return Array.from(this.synapses.values());
  }
  
  /**
   * 获取最强突触
   */
  getStrongestSynapses(count: number = 10): SynapseState[] {
    return Array.from(this.synapses.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, count);
  }
  
  /**
   * 获取统计信息
   */
  getStats(): typeof this.stats & {
    synapseCount: number;
    averageLTP: number;
    averageLTD: number;
  } {
    const synapseList = Array.from(this.synapses.values());
    const totalWeight = synapseList.reduce((sum, s) => sum + s.weight, 0);
    const avgLTP = synapseList.reduce((sum, s) => 
      sum + s.ltpHistory.reduce((a, b) => a + b, 0), 0) / (synapseList.length || 1);
    const avgLTD = synapseList.reduce((sum, s) => 
      sum + s.ltdHistory.reduce((a, b) => a + b, 0), 0) / (synapseList.length || 1);
    
    return {
      ...this.stats,
      synapseCount: this.synapses.size,
      averageWeight: totalWeight / (synapseList.length || 1),
      averageLTP: avgLTP,
      averageLTD: avgLTD,
    };
  }
  
  /**
   * 突触修剪 - 移除弱突触
   */
  prune(threshold: number = 0.1): number {
    let prunedCount = 0;
    
    for (const [id, synapse] of this.synapses) {
      if (synapse.weight < threshold) {
        this.synapses.delete(id);
        prunedCount++;
      }
    }
    
    if (prunedCount > 0) {
      console.log(`[STDP] 修剪了 ${prunedCount} 个弱突触`);
    }
    
    return prunedCount;
  }
  
  /**
   * 突触生长 - 创建新突触
   */
  grow(preNeuron: string, postNeuron: string, initialWeight: number = 0.3): void {
    this.registerSynapse(preNeuron, postNeuron, initialWeight);
    console.log(`[STDP] 新突触生长: ${preNeuron}→${postNeuron}`);
  }
  
  /**
   * 导出状态
   */
  exportState(): { config: STDPConfig; synapses: [string, SynapseState][] } {
    return {
      config: { ...this.config },
      synapses: Array.from(this.synapses.entries()),
    };
  }
  
  /**
   * 导入状态
   */
  importState(state: { config: STDPConfig; synapses: [string, SynapseState][] }): void {
    this.config = state.config;
    this.synapses = new Map(state.synapses);
    console.log(`[STDP] 已导入 ${this.synapses.size} 个突触状态`);
  }
  
  private getSynapseId(pre: string, post: string): string {
    return `${pre}→${post}`;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 奖励调制 STDP
// ─────────────────────────────────────────────────────────────────────

export class RewardModulatedSTDP extends STDPLearner {
  private rewardHistory: Array<{ reward: number; timestamp: number }> = [];
  private currentReward: number = 0;
  
  /**
   * 设置奖励信号
   */
  setReward(reward: number): void {
    this.currentReward = reward;
    this.rewardHistory.push({ reward, timestamp: Date.now() });
    
    if (this.rewardHistory.length > 1000) {
      this.rewardHistory.shift();
    }
  }
  
  /**
   * 获取调制后的学习率
   */
  protected getModulatedLearningRate(): number {
    // 奖励调制学习率
    // 正奖励增强学习，负奖励抑制学习
    const modulation = 1 + this.currentReward * 0.5;
    return this.config.learningRate * Math.max(0.1, Math.min(2, modulation));
  }
  
  /**
   * 获取平均奖励
   */
  getAverageReward(): number {
    if (this.rewardHistory.length === 0) return 0;
    return this.rewardHistory.reduce((sum, r) => sum + r.reward, 0) / this.rewardHistory.length;
  }
}
