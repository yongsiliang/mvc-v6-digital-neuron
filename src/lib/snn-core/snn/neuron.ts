/**
 * ═══════════════════════════════════════════════════════════════════════
 * LIF (Leaky Integrate-and-Fire) 脉冲神经元
 * 
 * 模拟生物神经元的核心行为：
 * 1. 接收输入脉冲
 * 2. 膜电位累积
 * 3. 超过阈值时发射脉冲
 * 4. 发射后重置并进入不应期
 * 5. 无输入时膜电位泄漏下降
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  NeuronId,
  NeuronType,
  NeuronRegion,
  LIFNeuronState,
  Spike
} from '../types';

/**
 * LIF 神经元类
 */
export class LIFNeuron {
  private state: LIFNeuronState;
  private globalTime: number = 0;

  constructor(
    id: NeuronId,
    type: NeuronType = 'excitatory',
    region: NeuronRegion = 'core',
    config: Partial<LIFNeuronState> = {}
  ) {
    this.state = {
      id,
      type,
      region,
      membranePotential: config.membranePotential ?? 0,
      threshold: config.threshold ?? 1.0,
      resetPotential: config.resetPotential ?? 0,
      decayFactor: config.decayFactor ?? 0.9,
      refractoryPeriod: config.refractoryPeriod ?? 2,
      refractoryCounter: 0,
      totalSpikes: 0,
      lastSpikeTime: -1000,
      silenceDuration: 0,
      createdAt: Date.now(),
      protectionLevel: 0,
      ...config
    };
  }

  /**
   * 获取神经元 ID
   */
  get id(): NeuronId {
    return this.state.id;
  }

  /**
   * 获取神经元类型
   */
  get type(): NeuronType {
    return this.state.type;
  }

  /**
   * 获取神经元区域
   */
  get region(): NeuronRegion {
    return this.state.region;
  }

  /**
   * 获取当前膜电位
   */
  get potential(): number {
    return this.state.membranePotential;
  }

  /**
   * 获取完整状态
   */
  getState(): Readonly<LIFNeuronState> {
    return { ...this.state };
  }

  /**
   * 是否在不应期
   */
  isInRefractory(): boolean {
    return this.state.refractoryCounter > 0;
  }

  /**
   * 更新全局时间
   */
  setGlobalTime(time: number): void {
    this.globalTime = time;
  }

  /**
   * 接收输入并积分
   * @param inputSum 输入总和 (来自所有突触的加权和)
   * @returns 是否发射脉冲
   */
  integrate(inputSum: number): boolean {
    // 更新静默时长
    if (this.state.lastSpikeTime < this.globalTime - 1) {
      this.state.silenceDuration++;
    }

    // 如果在不应期，不处理输入
    if (this.isInRefractory()) {
      this.state.refractoryCounter--;
      // 但仍然泄漏
      this.state.membranePotential *= this.state.decayFactor;
      return false;
    }

    // 膜电位更新：泄漏 + 输入积分
    this.state.membranePotential = 
      this.state.membranePotential * this.state.decayFactor + inputSum;

    // 检查是否发射
    return this.checkFire();
  }

  /**
   * 检查是否应该发射脉冲
   */
  private checkFire(): boolean {
    if (this.state.membranePotential >= this.state.threshold) {
      // 发射脉冲！
      this.fire();
      return true;
    }
    return false;
  }

  /**
   * 发射脉冲
   */
  private fire(): void {
    // 重置膜电位
    this.state.membranePotential = this.state.resetPotential;
    
    // 进入不应期
    this.state.refractoryCounter = this.state.refractoryPeriod;
    
    // 更新统计
    this.state.totalSpikes++;
    this.state.lastSpikeTime = this.globalTime;
    this.state.silenceDuration = 0;
  }

  /**
   * 强制发射 (用于外部刺激)
   */
  forceFire(): Spike {
    this.fire();
    return {
      neuronId: this.state.id,
      timestamp: this.globalTime
    };
  }

  /**
   * 重置神经元状态
   */
  reset(): void {
    this.state.membranePotential = this.state.resetPotential;
    this.state.refractoryCounter = 0;
  }

  /**
   * 调整阈值 (稳态调节)
   */
  adjustThreshold(delta: number): void {
    this.state.threshold = Math.max(0.5, Math.min(2.0, 
      this.state.threshold + delta
    ));
  }

  /**
   * 设置保护级别
   */
  setProtection(level: number): void {
    this.state.protectionLevel = Math.max(0, Math.min(1, level));
  }

  /**
   * 获取发放率 (最近 N 个时间步)
   */
  getFiringRate(windowSize: number): number {
    const timeSinceLastSpike = this.globalTime - this.state.lastSpikeTime;
    if (timeSinceLastSpike > windowSize) {
      return 0;
    }
    return this.state.totalSpikes / Math.max(1, this.globalTime);
  }

  /**
   * 克隆神经元
   */
  clone(): LIFNeuron {
    return new LIFNeuron(
      this.state.id,
      this.state.type,
      this.state.region,
      { ...this.state }
    );
  }

  /**
   * 序列化
   */
  toJSON(): LIFNeuronState {
    return { ...this.state };
  }

  /**
   * 从 JSON 恢复
   */
  static fromJSON(state: LIFNeuronState): LIFNeuron {
    return new LIFNeuron(state.id, state.type, state.region, state);
  }
}

/**
 * 创建 LIF 神经元
 */
export function createLIFNeuron(
  id: NeuronId,
  type: NeuronType = 'excitatory',
  region: NeuronRegion = 'core',
  config?: Partial<LIFNeuronState>
): LIFNeuron {
  return new LIFNeuron(id, type, region, config);
}

/**
 * 批量创建神经元
 */
export function createNeuronPopulation(
  count: number,
  region: NeuronRegion,
  startId: number = 0,
  excitatoryRatio: number = 0.8
): LIFNeuron[] {
  const neurons: LIFNeuron[] = [];
  
  for (let i = 0; i < count; i++) {
    const id = `${region}_${startId + i}`;
    const type: NeuronType = Math.random() < excitatoryRatio 
      ? 'excitatory' 
      : 'inhibitory';
    
    neurons.push(createLIFNeuron(id, type, region));
  }
  
  return neurons;
}
