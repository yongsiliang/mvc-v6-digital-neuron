/**
 * ═══════════════════════════════════════════════════════════════════════
 * 突触与 STDP 学习规则
 * 
 * STDP (Spike-Timing-Dependent Plasticity):
 * 生物学习的核心机制
 * 
 * - 前神经元先发射 → 后神经元后发射：加强连接 (因果关系)
 * - 后神经元先发射 → 前神经元后发射：减弱连接 (无因果关系)
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  SynapseId,
  NeuronId,
  SynapseState
} from '../types';

/**
 * 突触类
 */
export class Synapse {
  private state: SynapseState;

  constructor(
    preNeuronId: NeuronId,
    postNeuronId: NeuronId,
    config: Partial<SynapseState> = {}
  ) {
    this.state = {
      id: `${preNeuronId}->${postNeuronId}`,
      preNeuronId,
      postNeuronId,
      weight: config.weight ?? 0.5,
      preTrace: 0,
      postTrace: 0,
      learningRate: config.learningRate ?? 0.01,
      stpdDecay: config.stpdDecay ?? 0.95,
      age: 0,
      activity: 0,
      lastActiveTime: 0,
      isActive: false,
      isProtected: false,
      ...config
    };
  }

  get id(): SynapseId {
    return this.state.id;
  }

  get preNeuronId(): NeuronId {
    return this.state.preNeuronId;
  }

  get postNeuronId(): NeuronId {
    return this.state.postNeuronId;
  }

  get weight(): number {
    return this.state.weight;
  }

  get isActive(): boolean {
    return this.state.isActive;
  }

  getState(): Readonly<SynapseState> {
    return { ...this.state };
  }

  /**
   * 获取输出 (权重 × 前神经元脉冲)
   */
  getOutput(preSpike: number): number {
    if (preSpike > 0) {
      this.state.isActive = true;
      this.state.activity++;
      this.state.lastActiveTime = Date.now();
    }
    return this.state.weight * preSpike;
  }

  /**
   * STDP 学习更新
   * 
   * @param preSpike 前神经元是否发射
   * @param postSpike 后神经元是否发射
   * @param timeConstants 时间常数 (控制学习窗口)
   */
  updateSTDP(
    preSpike: boolean,
    postSpike: boolean,
    timeConstants: {
      tauPlus: number;   // LTP 时间常数
      tauMinus: number;  // LTD 时间常数
    } = { tauPlus: 20, tauMinus: 20 }
  ): void {
    // 更新脉冲痕迹 (指数衰减 + 新脉冲)
    this.state.preTrace = 
      this.state.preTrace * this.state.stpdDecay + (preSpike ? 1 : 0);
    this.state.postTrace = 
      this.state.postTrace * this.state.stpdDecay + (postSpike ? 1 : 0);

    // STDP 规则
    let weightChange = 0;

    if (preSpike) {
      // 前神经元发射
      // 如果后神经元刚发射过 (postTrace 高)，说明前→后因果性强，加强
      weightChange += this.state.learningRate * this.state.postTrace;
    }

    if (postSpike) {
      // 后神经元发射
      // 如果前神经元刚发射过 (preTrace 高)，说明前→后因果性强，加强
      // 但如果前神经元没发射，可能需要抑制
      weightChange -= this.state.learningRate * this.state.preTrace * 0.5;
    }

    // 应用权重变化 (考虑保护)
    if (!this.state.isProtected) {
      const protectionFactor = 1 - this.getProtectionFactor();
      this.state.weight += weightChange * protectionFactor;
      
      // 限制权重范围
      this.state.weight = Math.max(0.01, Math.min(2.0, this.state.weight));
    }

    // 增加年龄
    this.state.age++;
  }

  /**
   * 获取保护因子 (权重越高越保护)
   */
  private getProtectionFactor(): number {
    // 权重越高，保护越强
    return Math.min(0.9, (this.state.weight - 0.5) * 0.5);
  }

  /**
   * 设置保护状态
   */
  setProtected(protected_: boolean): void {
    this.state.isProtected = protected_;
  }

  /**
   * 调整学习率
   */
  setLearningRate(rate: number): void {
    this.state.learningRate = Math.max(0.0001, Math.min(0.1, rate));
  }

  /**
   * 检查是否应该被修剪
   */
  shouldPrune(threshold: number): boolean {
    return (
      !this.state.isProtected &&
      this.state.weight < threshold &&
      this.state.age > 100 &&
      this.state.activity < 10
    );
  }

  /**
   * 重置活动状态
   */
  resetActivity(): void {
    this.state.isActive = false;
  }

  /**
   * 克隆
   */
  clone(): Synapse {
    return new Synapse(
      this.state.preNeuronId,
      this.state.postNeuronId,
      { ...this.state }
    );
  }

  /**
   * 序列化
   */
  toJSON(): SynapseState {
    return { ...this.state };
  }

  /**
   * 从 JSON 恢复
   */
  static fromJSON(state: SynapseState): Synapse {
    return new Synapse(state.preNeuronId, state.postNeuronId, state);
  }
}

/**
 * STDP 学习窗口函数
 * 计算 LTP/LTD 的强度随时间差的变化
 */
export class STDPWindow {
  private tauPlus: number;
  private tauMinus: number;
  private aPlus: number;  // LTP 幅度
  private aMinus: number; // LTD 幅度

  constructor(
    tauPlus: number = 20,
    tauMinus: number = 20,
    aPlus: number = 0.1,
    aMinus: number = 0.1
  ) {
    this.tauPlus = tauPlus;
    this.tauMinus = tauMinus;
    this.aPlus = aPlus;
    this.aMinus = aMinus;
  }

  /**
   * 计算权重变化
   * @param deltaTime 前神经元发射时间 - 后神经元发射时间
   *                   正值 = 前先发射 (应该加强)
   *                   负值 = 后先发射 (应该减弱)
   */
  getWeightChange(deltaTime: number): number {
    if (deltaTime > 0) {
      // 前先发射，后后发射 → LTP (长时程增强)
      return this.aPlus * Math.exp(-deltaTime / this.tauPlus);
    } else {
      // 后先发射，前后发射 → LTD (长时程抑制)
      return -this.aMinus * Math.exp(deltaTime / this.tauMinus);
    }
  }

  /**
   * 可视化学习窗口
   */
  visualizeWindow(range: number = 50): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    for (let dt = -range; dt <= range; dt++) {
      points.push({
        x: dt,
        y: this.getWeightChange(dt)
      });
    }
    return points;
  }
}

/**
 * 创建突触
 */
export function createSynapse(
  preNeuronId: NeuronId,
  postNeuronId: NeuronId,
  weight?: number
): Synapse {
  return new Synapse(preNeuronId, postNeuronId, { weight: weight ?? 0.5 });
}

/**
 * 创建随机连接
 */
export function createRandomConnections(
  preNeurons: NeuronId[],
  postNeurons: NeuronId[],
  connectionProbability: number = 0.1
): Synapse[] {
  const synapses: Synapse[] = [];

  for (const pre of preNeurons) {
    for (const post of postNeurons) {
      if (Math.random() < connectionProbability) {
        // 随机初始权重
        const weight = 0.3 + Math.random() * 0.7;
        synapses.push(createSynapse(pre, post, weight));
      }
    }
  }

  return synapses;
}
