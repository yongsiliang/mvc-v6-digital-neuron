/**
 * ═══════════════════════════════════════════════════════════════════════
 * 连接（突触）：关系本身
 * Connection (Synapse): The Relationship Itself
 * 
 * 本质：
 * - 连接不是"数据线"
 * - 连接是信息本身
 * - 连接的强度、历史、类型定义了信息如何流动
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Connection as IConnection,
  ConnectionId,
  NeuronId,
  Timestamp,
  ConnectionStrength,
  ConnectionType,
  StrengthRecord,
  ConnectionActivationRecord,
  ConnectionStats,
  HebbianParams,
  STDPParams,
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 常量
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_INITIAL_STRENGTH = 0.5;
const DEFAULT_PLASTICITY = 0.5;
const DEFAULT_DELAY = 0;
const DEFAULT_EFFICIENCY = 1.0;
const DEFAULT_TYPE: ConnectionType = 'excitatory';

const DEFAULT_HEBBIAN_PARAMS: HebbianParams = {
  learningRate: 0.1,
  decayRate: 0.01,
  stabilizationRate: 0.05,
};

const DEFAULT_STDP_PARAMS: STDPParams = {
  enabled: true,
  timeWindow: 20, // ms
  ltpRate: 0.1,
  ltdRate: 0.05,
};

const MAX_STRENGTH_HISTORY = 100;
const MAX_ACTIVATION_HISTORY = 1000;

// ─────────────────────────────────────────────────────────────────────
// 连接配置
// ─────────────────────────────────────────────────────────────────────

export interface ConnectionConfig {
  id?: ConnectionId;
  strength?: number;
  plasticity?: number;
  delay?: number;
  efficiency?: number;
  type?: ConnectionType;
  hebbianParams?: Partial<HebbianParams>;
  stdpParams?: Partial<STDPParams>;
  source?: 'initial' | 'learned' | 'created' | 'inherited';
}

// ─────────────────────────────────────────────────────────────────────
// 连接类实现
// ─────────────────────────────────────────────────────────────────────

export class Connection implements IConnection {
  // ─────────────────────────────────────────────────────────────────
  // 标识
  // ─────────────────────────────────────────────────────────────────

  readonly id: ConnectionId;
  readonly from: NeuronId;
  readonly to: NeuronId;
  readonly createdAt: Timestamp;

  // ─────────────────────────────────────────────────────────────────
  // 连接强度：关系的"深度"
  // ─────────────────────────────────────────────────────────────────

  private _strength: ConnectionStrength;
  private _strengthHistory: StrengthRecord[];
  private _strengthTrend: 'strengthening' | 'stable' | 'weakening';

  // ─────────────────────────────────────────────────────────────────
  // 传播特性
  // ─────────────────────────────────────────────────────────────────

  delay: number;
  efficiency: number;
  type: ConnectionType;

  // ─────────────────────────────────────────────────────────────────
  // 可塑性
  // ─────────────────────────────────────────────────────────────────

  plasticity: number;
  hebbianParams: HebbianParams;
  stdpParams: STDPParams;

  // ─────────────────────────────────────────────────────────────────
  // 使用统计
  // ─────────────────────────────────────────────────────────────────

  private _activationHistory: ConnectionActivationRecord[];
  lastActivatedAt: Timestamp | null;
  totalActivations: number;
  averageActivationStrength: number;

  // ─────────────────────────────────────────────────────────────────
  // 元数据
  // ─────────────────────────────────────────────────────────────────

  source: 'initial' | 'learned' | 'created' | 'inherited';
  stats: ConnectionStats;

  // ─────────────────────────────────────────────────────────────────
  // 构造函数
  // ─────────────────────────────────────────────────────────────────

  constructor(
    from: NeuronId,
    to: NeuronId,
    config: ConnectionConfig = {}
  ) {
    const now = Date.now();

    // 标识
    this.id = config.id || uuidv4();
    this.from = from;
    this.to = to;
    this.createdAt = now;

    // 强度
    this._strength = this.clampStrength(config.strength ?? DEFAULT_INITIAL_STRENGTH);
    this._strengthHistory = [];
    this._strengthTrend = 'stable';

    // 传播特性
    this.delay = config.delay ?? DEFAULT_DELAY;
    this.efficiency = config.efficiency ?? DEFAULT_EFFICIENCY;
    this.type = config.type ?? DEFAULT_TYPE;

    // 可塑性
    this.plasticity = config.plasticity ?? DEFAULT_PLASTICITY;
    this.hebbianParams = { ...DEFAULT_HEBBIAN_PARAMS, ...config.hebbianParams };
    this.stdpParams = { ...DEFAULT_STDP_PARAMS, ...config.stdpParams };

    // 使用统计
    this._activationHistory = [];
    this.lastActivatedAt = null;
    this.totalActivations = 0;
    this.averageActivationStrength = 0;

    // 元数据
    this.source = config.source || 'created';
    this.stats = {
      usefulness: 0.5,
      reliability: 0.5,
      age: 0,
      usageFrequency: 0,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // Getter
  // ─────────────────────────────────────────────────────────────────

  get strength(): ConnectionStrength {
    return this._strength;
  }

  get strengthHistory(): StrengthRecord[] {
    return [...this._strengthHistory];
  }

  get strengthTrend(): 'strengthening' | 'stable' | 'weakening' {
    return this._strengthTrend;
  }

  get activationHistory(): ConnectionActivationRecord[] {
    return [...this._activationHistory];
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：激活传播
  // ─────────────────────────────────────────────────────────────────

  /**
   * 传播激活
   * 
   * @param fromActivation 源神经元的激活值
   * @returns 目标神经元应该接收到的激活值
   */
  propagate(fromActivation: number): number {
    const now = Date.now();

    // 计算传递的激活值
    let transmittedActivation = fromActivation * this._strength * this.efficiency;

    // 根据连接类型调整
    switch (this.type) {
      case 'excitatory':
        // 兴奋性：保持正值
        transmittedActivation = Math.abs(transmittedActivation);
        break;
      case 'inhibitory':
        // 抑制性：转为负值
        transmittedActivation = -Math.abs(transmittedActivation);
        break;
      case 'modulatory':
        // 调节性：平方（强化强信号，弱化弱信号）
        transmittedActivation = Math.sign(transmittedActivation) * transmittedActivation ** 2;
        break;
    }

    // 记录激活
    this.recordActivation(fromActivation, transmittedActivation);
    this.lastActivatedAt = now;
    this.totalActivations++;

    // 更新有用性
    this.updateUsefulness();

    return transmittedActivation;
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：学习
  // ─────────────────────────────────────────────────────────────────

  /**
   * Hebbian学习
   * 
   * 如果from和to神经元同时激活，增强连接
   * 
   * @param fromActivation 源神经元激活值
   * @param toActivation 目标神经元激活值
   */
  hebbianLearn(fromActivation: number, toActivation: number): void {
    // 同时激活时增强
    if (fromActivation > 0.3 && toActivation > 0.3) {
      const delta = this.hebbianParams.learningRate * this.plasticity * fromActivation * toActivation;
      this.modifyStrength(delta, 'hebbian_learning');
    }

    // 自然衰减
    this.modifyStrength(-this.hebbianParams.decayRate * this._strength, 'decay');

    // 稳定化（防止过强或过弱）
    if (this._strength > 0.9) {
      this.modifyStrength(-this.hebbianParams.stabilizationRate, 'stabilization');
    } else if (this._strength < 0.1 && this.totalActivations > 10) {
      this.modifyStrength(this.hebbianParams.stabilizationRate, 'stabilization');
    }
  }

  /**
   * STDP学习（脉冲时间依赖可塑性）
   * 
   * @param fromSpikeTime 源神经元发放时间
   * @param toSpikeTime 目标神经元发放时间
   */
  stdpLearn(fromSpikeTime: number, toSpikeTime: number): void {
    if (!this.stdpParams.enabled) return;

    const deltaT = toSpikeTime - fromSpikeTime; // 正值表示to在from之后发放

    if (Math.abs(deltaT) < this.stdpParams.timeWindow) {
      if (deltaT > 0) {
        // to在from之后发放 → 增强连接（LTP）
        const ltp = this.stdpParams.ltpRate * Math.exp(-deltaT / this.stdpParams.timeWindow);
        this.modifyStrength(ltp * this.plasticity, 'stdp_ltp');
      } else {
        // to在from之前发放 → 减弱连接（LTD）
        const ltd = this.stdpParams.ltdRate * Math.exp(deltaT / this.stdpParams.timeWindow);
        this.modifyStrength(-ltd * this.plasticity, 'stdp_ltd');
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：强度管理
  // ─────────────────────────────────────────────────────────────────

  /**
   * 修改连接强度
   */
  modifyStrength(delta: number, reason: string): void {
    const previousStrength = this._strength;
    this._strength = this.clampStrength(this._strength + delta);

    // 记录变化
    const record: StrengthRecord = {
      timestamp: Date.now(),
      previousStrength,
      newStrength: this._strength,
      reason,
    };
    this._strengthHistory.push(record);

    // 限制历史长度
    if (this._strengthHistory.length > MAX_STRENGTH_HISTORY) {
      this._strengthHistory.shift();
    }

    // 更新趋势
    this.updateStrengthTrend();
  }

  /**
   * 设置连接强度
   */
  setStrength(strength: number, reason: string = 'manual'): void {
    const previousStrength = this._strength;
    this._strength = this.clampStrength(strength);

    const record: StrengthRecord = {
      timestamp: Date.now(),
      previousStrength,
      newStrength: this._strength,
      reason,
    };
    this._strengthHistory.push(record);

    this.updateStrengthTrend();
  }

  // ─────────────────────────────────────────────────────────────────
  // 查询方法
  // ─────────────────────────────────────────────────────────────────

  /**
   * 连接是否活跃
   */
  isActive(): boolean {
    return this._strength > 0.1;
  }

  /**
   * 连接是否应该被修剪
   */
  shouldPrune(threshold: number = 0.05): boolean {
    return this._strength < threshold && this.totalActivations > 100;
  }

  /**
   * 获取最近的激活强度
   */
  getRecentActivationStrength(n: number = 10): number {
    const recent = this._activationHistory.slice(-n);
    if (recent.length === 0) return 0;
    return recent.reduce((sum, r) => sum + Math.abs(r.activationValue), 0) / recent.length;
  }

  // ─────────────────────────────────────────────────────────────────
  // 辅助方法
  // ─────────────────────────────────────────────────────────────────

  /**
   * 记录激活
   */
  private recordActivation(fromActivation: number, toActivation: number): void {
    const record: ConnectionActivationRecord = {
      timestamp: Date.now(),
      activationValue: toActivation,
      fromActivation,
      toActivation,
    };
    this._activationHistory.push(record);

    // 限制历史长度
    if (this._activationHistory.length > MAX_ACTIVATION_HISTORY) {
      this._activationHistory.shift();
    }

    // 更新平均激活强度
    this.averageActivationStrength = this.getRecentActivationStrength(100);
  }

  /**
   * 更新强度趋势
   */
  private updateStrengthTrend(): void {
    if (this._strengthHistory.length < 3) {
      this._strengthTrend = 'stable';
      return;
    }

    const recent = this._strengthHistory.slice(-5);
    const values = recent.map(r => r.newStrength);

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = avgSecond - avgFirst;

    if (diff > 0.02) {
      this._strengthTrend = 'strengthening';
    } else if (diff < -0.02) {
      this._strengthTrend = 'weakening';
    } else {
      this._strengthTrend = 'stable';
    }
  }

  /**
   * 更新有用性
   */
  private updateUsefulness(): void {
    // 基于使用频率和平均激活强度计算有用性
    const usageFactor = Math.min(1, this.totalActivations / 100);
    const strengthFactor = this._strength;
    const reliabilityFactor = this.stats.reliability;

    this.stats.usefulness = (usageFactor * 0.3 + strengthFactor * 0.4 + reliabilityFactor * 0.3);
  }

  /**
   * 限制强度范围
   */
  private clampStrength(strength: number): ConnectionStrength {
    return Math.max(0, Math.min(1, strength));
  }

  // ─────────────────────────────────────────────────────────────────
  // 序列化
  // ─────────────────────────────────────────────────────────────────

  /**
   * 转换为JSON
   */
  toJSON(): IConnection {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      createdAt: this.createdAt,
      strength: this._strength,
      strengthHistory: this._strengthHistory,
      strengthTrend: this._strengthTrend,
      delay: this.delay,
      efficiency: this.efficiency,
      type: this.type,
      plasticity: this.plasticity,
      hebbianParams: this.hebbianParams,
      stdpParams: this.stdpParams,
      activationHistory: this._activationHistory,
      lastActivatedAt: this.lastActivatedAt,
      totalActivations: this.totalActivations,
      averageActivationStrength: this.averageActivationStrength,
      source: this.source,
      stats: this.stats,
    };
  }

  /**
   * 从JSON创建
   */
  static fromJSON(json: IConnection): Connection {
    const connection = new Connection(json.from, json.to, {
      id: json.id,
      strength: json.strength,
      plasticity: json.plasticity,
      delay: json.delay,
      efficiency: json.efficiency,
      type: json.type,
      hebbianParams: json.hebbianParams,
      stdpParams: json.stdpParams,
      source: json.source,
    });

    connection._strengthHistory = json.strengthHistory || [];
    connection._strengthTrend = json.strengthTrend;
    connection._activationHistory = json.activationHistory || [];
    connection.lastActivatedAt = json.lastActivatedAt;
    connection.totalActivations = json.totalActivations;
    connection.averageActivationStrength = json.averageActivationStrength;
    connection.stats = json.stats;

    return connection;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建兴奋性连接
 */
export function createExcitatoryConnection(
  from: NeuronId,
  to: NeuronId,
  strength: number = 0.5
): Connection {
  return new Connection(from, to, {
    type: 'excitatory',
    strength,
  });
}

/**
 * 创建抑制性连接
 */
export function createInhibitoryConnection(
  from: NeuronId,
  to: NeuronId,
  strength: number = 0.5
): Connection {
  return new Connection(from, to, {
    type: 'inhibitory',
    strength,
  });
}

/**
 * 创建调节性连接
 */
export function createModulatoryConnection(
  from: NeuronId,
  to: NeuronId,
  strength: number = 0.5
): Connection {
  return new Connection(from, to, {
    type: 'modulatory',
    strength,
  });
}
