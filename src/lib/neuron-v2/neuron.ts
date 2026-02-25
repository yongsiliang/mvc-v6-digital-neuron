/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经元：关系节点
 * Neuron: Relationship Node
 * 
 * 本质：
 * - 神经元不存储信息
 * - 神经元是关系的交汇点
 * - 神经元的"身份"由它的连接定义
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Neuron as INeuron,
  NeuronId,
  Timestamp,
  SensitivityVector,
  ActivationValue,
  ActivationRecord,
  NeuronStats,
  FunctionalRole,
  EmergentLayer,
  ConnectionId,
  InfluencePattern,
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 常量
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_SENSITIVITY_DIMENSION = 768;
const DEFAULT_SENSITIVITY_PLASTICITY = 0.5;
const DEFAULT_REFRACTORY_PERIOD = 100; // ms
const MAX_ACTIVATION_HISTORY = 100;
const ACTIVATION_DECAY_RATE = 0.95;

// ─────────────────────────────────────────────────────────────────────
// 神经元配置
// ─────────────────────────────────────────────────────────────────────

export interface NeuronConfig {
  id?: NeuronId;
  sensitivity?: SensitivityVector;
  sensitivityDimension?: number;
  sensitivityPlasticity?: number;
  refractoryPeriod?: number;
  label?: string;
  labelSource?: 'human' | 'inferred' | 'learned';
  functionalRole?: FunctionalRole;
}

// ─────────────────────────────────────────────────────────────────────
// 神经元类实现
// ─────────────────────────────────────────────────────────────────────

export class Neuron implements INeuron {
  // ─────────────────────────────────────────────────────────────────
  // 标识
  // ─────────────────────────────────────────────────────────────────

  readonly id: NeuronId;
  readonly createdAt: Timestamp;
  updatedAt: Timestamp;

  // ─────────────────────────────────────────────────────────────────
  // 敏感度：神经元的"本性"
  // ─────────────────────────────────────────────────────────────────

  private _sensitivity: SensitivityVector;
  readonly sensitivityDimension: number;
  sensitivityPlasticity: number;

  // ─────────────────────────────────────────────────────────────────
  // 关系：神经元的"真正内容"
  // ─────────────────────────────────────────────────────────────────

  private _incomingConnections: Map<NeuronId, ConnectionId>;
  private _outgoingConnections: Map<NeuronId, ConnectionId>;

  // ─────────────────────────────────────────────────────────────────
  // 状态
  // ─────────────────────────────────────────────────────────────────

  private _activation: ActivationValue;
  private _activationHistory: ActivationRecord[];
  private _activationTrend: 'rising' | 'stable' | 'falling';
  refractoryPeriod: number;
  lastActivatedAt: Timestamp | null;

  // ─────────────────────────────────────────────────────────────────
  // 功能角色（涌现的）
  // ─────────────────────────────────────────────────────────────────

  functionalRole: FunctionalRole;
  emergentLayer: EmergentLayer | null;

  // ─────────────────────────────────────────────────────────────────
  // 元数据
  // ─────────────────────────────────────────────────────────────────

  label?: string;
  labelSource?: 'human' | 'inferred' | 'learned';
  stats: NeuronStats;

  // ─────────────────────────────────────────────────────────────────
  // 构造函数
  // ─────────────────────────────────────────────────────────────────

  constructor(config: NeuronConfig = {}) {
    const now = Date.now();

    // 标识
    this.id = config.id || uuidv4();
    this.createdAt = now;
    this.updatedAt = now;

    // 敏感度
    this.sensitivityDimension = config.sensitivityDimension || DEFAULT_SENSITIVITY_DIMENSION;
    this._sensitivity = config.sensitivity || this.createRandomSensitivity();
    this.sensitivityPlasticity = config.sensitivityPlasticity ?? DEFAULT_SENSITIVITY_PLASTICITY;

    // 关系
    this._incomingConnections = new Map();
    this._outgoingConnections = new Map();

    // 状态
    this._activation = 0;
    this._activationHistory = [];
    this._activationTrend = 'stable';
    this.refractoryPeriod = config.refractoryPeriod ?? DEFAULT_REFRACTORY_PERIOD;
    this.lastActivatedAt = null;

    // 功能角色
    this.functionalRole = config.functionalRole || 'latent';
    this.emergentLayer = null;

    // 元数据
    this.label = config.label;
    this.labelSource = config.labelSource;
    this.stats = {
      totalActivations: 0,
      averageActivation: 0,
      connectionChanges: 0,
      lifetime: 0,
      usefulness: 0.5,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // Getter
  // ─────────────────────────────────────────────────────────────────

  get sensitivity(): SensitivityVector {
    return this._sensitivity;
  }

  get activation(): ActivationValue {
    return this._activation;
  }

  get activationHistory(): ActivationRecord[] {
    return [...this._activationHistory];
  }

  get activationTrend(): 'rising' | 'stable' | 'falling' {
    return this._activationTrend;
  }

  get incomingConnections(): Map<NeuronId, ConnectionId> {
    return new Map(this._incomingConnections);
  }

  get outgoingConnections(): Map<NeuronId, ConnectionId> {
    return new Map(this._outgoingConnections);
  }

  get connectionCount(): number {
    return this._incomingConnections.size + this._outgoingConnections.size;
  }

  get totalConnectionStrength(): number {
    // 需要网络层提供连接信息才能计算
    return this.connectionCount;
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：计算与影响模式的匹配度
  // ─────────────────────────────────────────────────────────────────

  /**
   * 计算与影响模式的匹配度
   * 
   * @param pattern 影响模式向量
   * @returns 匹配度 [0, 1]
   */
  calculateMatch(pattern: InfluencePattern): number {
    if (pattern.length !== this.sensitivityDimension) {
      console.warn(`Pattern dimension ${pattern.length} does not match sensitivity dimension ${this.sensitivityDimension}`);
      return 0;
    }

    // 计算余弦相似度
    const dotProduct = this._sensitivity.reduce((sum, s, i) => sum + s * pattern[i], 0);
    const magnitudeS = Math.sqrt(this._sensitivity.reduce((sum, s) => sum + s * s, 0));
    const magnitudeP = Math.sqrt(pattern.reduce((sum, p) => sum + p * p, 0));

    if (magnitudeS === 0 || magnitudeP === 0) {
      return 0;
    }

    const similarity = dotProduct / (magnitudeS * magnitudeP);
    
    // 将 [-1, 1] 映射到 [0, 1]
    return (similarity + 1) / 2;
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：激活
  // ─────────────────────────────────────────────────────────────────

  /**
   * 激活神经元
   * 
   * @param value 激活值
   * @param source 激活来源
   * @param triggeredBy 触发者
   */
  activate(
    value: ActivationValue,
    source: 'external' | 'internal' | 'meta' = 'external',
    triggeredBy?: NeuronId[]
  ): void {
    const now = Date.now();

    // 检查不应期
    if (this.lastActivatedAt && now - this.lastActivatedAt < this.refractoryPeriod) {
      // 在不应期内，激活值降低
      value *= 0.5;
    }

    // 更新激活值
    this._activation = Math.max(0, Math.min(1, value));
    this.lastActivatedAt = now;

    // 记录激活历史
    const record: ActivationRecord = {
      timestamp: now,
      value: this._activation,
      source,
      triggeredBy,
    };
    this._activationHistory.push(record);

    // 限制历史长度
    if (this._activationHistory.length > MAX_ACTIVATION_HISTORY) {
      this._activationHistory.shift();
    }

    // 更新趋势
    this.updateTrend();

    // 更新统计
    this.stats.totalActivations++;
    this.updateAverageActivation();

    this.updatedAt = now;
  }

  /**
   * 自然衰减
   */
  decay(): void {
    this._activation *= ACTIVATION_DECAY_RATE;
    
    if (this._activation < 0.01) {
      this._activation = 0;
    }

    this.updateTrend();
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：连接管理
  // ─────────────────────────────────────────────────────────────────

  /**
   * 添加输入连接
   */
  addIncomingConnection(fromNeuronId: NeuronId, connectionId: ConnectionId): void {
    this._incomingConnections.set(fromNeuronId, connectionId);
    this.stats.connectionChanges++;
    this.updatedAt = Date.now();
  }

  /**
   * 添加输出连接
   */
  addOutgoingConnection(toNeuronId: NeuronId, connectionId: ConnectionId): void {
    this._outgoingConnections.set(toNeuronId, connectionId);
    this.stats.connectionChanges++;
    this.updatedAt = Date.now();
  }

  /**
   * 移除输入连接
   */
  removeIncomingConnection(fromNeuronId: NeuronId): void {
    this._incomingConnections.delete(fromNeuronId);
    this.stats.connectionChanges++;
    this.updatedAt = Date.now();
  }

  /**
   * 移除输出连接
   */
  removeOutgoingConnection(toNeuronId: NeuronId): void {
    this._outgoingConnections.delete(toNeuronId);
    this.stats.connectionChanges++;
    this.updatedAt = Date.now();
  }

  /**
   * 获取输入连接ID
   */
  getIncomingConnectionId(fromNeuronId: NeuronId): ConnectionId | undefined {
    return this._incomingConnections.get(fromNeuronId);
  }

  /**
   * 获取输出连接ID
   */
  getOutgoingConnectionId(toNeuronId: NeuronId): ConnectionId | undefined {
    return this._outgoingConnections.get(toNeuronId);
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：敏感度调整
  // ─────────────────────────────────────────────────────────────────

  /**
   * 调整敏感度（学习）
   * 
   * @param pattern 影响模式
   * @param rate 学习率
   */
  adjustSensitivity(pattern: InfluencePattern, rate: number): void {
    if (pattern.length !== this.sensitivityDimension) {
      return;
    }

    // 根据可塑性调整
    const effectiveRate = rate * this.sensitivityPlasticity;

    for (let i = 0; i < this._sensitivity.length; i++) {
      // 向pattern方向微调
      this._sensitivity[i] += (pattern[i] - this._sensitivity[i]) * effectiveRate;
    }

    // 归一化
    const magnitude = Math.sqrt(this._sensitivity.reduce((sum, s) => sum + s * s, 0));
    if (magnitude > 0) {
      this._sensitivity = this._sensitivity.map(s => s / magnitude);
    }

    this.updatedAt = Date.now();
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：状态查询
  // ─────────────────────────────────────────────────────────────────

  /**
   * 是否处于不应期
   */
  isInRefractoryPeriod(): boolean {
    if (!this.lastActivatedAt) return false;
    return Date.now() - this.lastActivatedAt < this.refractoryPeriod;
  }

  /**
   * 是否激活
   */
  isActivated(threshold: number = 0.3): boolean {
    return this._activation > threshold;
  }

  /**
   * 获取最近N次激活的平均值
   */
  getRecentAverageActivation(n: number = 10): number {
    const recent = this._activationHistory.slice(-n);
    if (recent.length === 0) return 0;
    return recent.reduce((sum, r) => sum + r.value, 0) / recent.length;
  }

  // ─────────────────────────────────────────────────────────────────
  // 辅助方法
  // ─────────────────────────────────────────────────────────────────

  /**
   * 创建随机敏感度向量
   */
  private createRandomSensitivity(): SensitivityVector {
    const vector: number[] = [];
    for (let i = 0; i < this.sensitivityDimension; i++) {
      vector.push(Math.random() * 2 - 1); // [-1, 1]
    }

    // 归一化
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return vector.map(v => v / magnitude);
  }

  /**
   * 更新激活趋势
   */
  private updateTrend(): void {
    if (this._activationHistory.length < 3) {
      this._activationTrend = 'stable';
      return;
    }

    const recent = this._activationHistory.slice(-5);
    const values = recent.map(r => r.value);

    // 简单线性趋势判断
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const diff = avgSecond - avgFirst;

    if (diff > 0.05) {
      this._activationTrend = 'rising';
    } else if (diff < -0.05) {
      this._activationTrend = 'falling';
    } else {
      this._activationTrend = 'stable';
    }
  }

  /**
   * 更新平均激活
   */
  private updateAverageActivation(): void {
    if (this._activationHistory.length === 0) return;
    this.stats.averageActivation = 
      this._activationHistory.reduce((sum, r) => sum + r.value, 0) / this._activationHistory.length;
  }

  // ─────────────────────────────────────────────────────────────────
  // 序列化
  // ─────────────────────────────────────────────────────────────────

  /**
   * 转换为JSON
   */
  toJSON(): INeuron {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      sensitivity: this._sensitivity,
      sensitivityDimension: this.sensitivityDimension,
      sensitivityPlasticity: this.sensitivityPlasticity,
      incomingConnections: new Map(this._incomingConnections),
      outgoingConnections: new Map(this._outgoingConnections),
      activation: this._activation,
      activationHistory: this._activationHistory,
      activationTrend: this._activationTrend,
      refractoryPeriod: this.refractoryPeriod,
      lastActivatedAt: this.lastActivatedAt,
      functionalRole: this.functionalRole,
      emergentLayer: this.emergentLayer,
      label: this.label,
      labelSource: this.labelSource,
      stats: this.stats,
    };
  }

  /**
   * 从JSON创建
   */
  static fromJSON(json: INeuron): Neuron {
    const neuron = new Neuron({
      id: json.id,
      sensitivity: json.sensitivity,
      sensitivityDimension: json.sensitivityDimension,
      sensitivityPlasticity: json.sensitivityPlasticity,
      refractoryPeriod: json.refractoryPeriod,
      label: json.label,
      labelSource: json.labelSource,
      functionalRole: json.functionalRole,
    });

    // 恢复连接
    if (json.incomingConnections) {
      neuron._incomingConnections = new Map(json.incomingConnections);
    }
    if (json.outgoingConnections) {
      neuron._outgoingConnections = new Map(json.outgoingConnections);
    }

    // 恢复状态
    neuron._activation = json.activation;
    neuron._activationHistory = json.activationHistory || [];
    neuron._activationTrend = json.activationTrend;
    neuron.lastActivatedAt = json.lastActivatedAt;
    neuron.emergentLayer = json.emergentLayer;
    neuron.stats = json.stats;

    return neuron;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建感觉神经元
 */
export function createSensoryNeuron(config: Partial<NeuronConfig> = {}): Neuron {
  return new Neuron({
    ...config,
    functionalRole: 'sensory',
  });
}

/**
 * 创建概念神经元
 */
export function createConceptualNeuron(config: Partial<NeuronConfig> = {}): Neuron {
  return new Neuron({
    ...config,
    functionalRole: 'conceptual',
  });
}

/**
 * 创建情感神经元
 */
export function createEmotionalNeuron(config: Partial<NeuronConfig> = {}): Neuron {
  return new Neuron({
    ...config,
    functionalRole: 'emotional',
  });
}

/**
 * 创建情景神经元
 */
export function createEpisodicNeuron(config: Partial<NeuronConfig> = {}): Neuron {
  return new Neuron({
    ...config,
    functionalRole: 'episodic',
  });
}

/**
 * 创建整合神经元
 */
export function createIntegrativeNeuron(config: Partial<NeuronConfig> = {}): Neuron {
  return new Neuron({
    ...config,
    functionalRole: 'integrative',
  });
}

/**
 * 创建表达神经元
 */
export function createExpressiveNeuron(config: Partial<NeuronConfig> = {}): Neuron {
  return new Neuron({
    ...config,
    functionalRole: 'expressive',
  });
}
