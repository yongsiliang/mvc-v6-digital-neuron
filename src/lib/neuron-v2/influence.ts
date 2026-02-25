/**
 * ═══════════════════════════════════════════════════════════════════════
 * 影响（神经递质）：关系的作用
 * Influence (Neurotransmitter): The Effect of Relationship
 * 
 * 本质：
 * - 影响不是"携带信息的卡车"
 * - 影响是"对网络的扰动方式"
 * - 影响不存储信息，影响创造信息（通过改变关系）
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Influence as IInfluence,
  InfluencePattern,
  InfluenceType,
  InfluenceIntensity,
  NeuronId,
  Timestamp,
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 常量
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_DECAY_RATE = 0.9;
const DEFAULT_MAX_HOPS = 5;
const DEFAULT_TTL = 10000; // 10秒

// ─────────────────────────────────────────────────────────────────────
// 影响配置
// ─────────────────────────────────────────────────────────────────────

export interface InfluenceConfig {
  pattern: InfluencePattern;
  patternLabel?: string;
  type?: InfluenceType;
  intensity?: InfluenceIntensity;
  scope?: 'global' | 'local' | 'targeted';
  targetNeurons?: NeuronId[];
  decayRate?: number;
  maxHops?: number;
  source?: 'external' | 'internal' | 'meta';
  sourceId?: string;
  originalSignal?: unknown;
  ttl?: number;
}

// ─────────────────────────────────────────────────────────────────────
// 影响类实现
// ─────────────────────────────────────────────────────────────────────

export class Influence implements IInfluence {
  // ─────────────────────────────────────────────────────────────────
  // 影响模式
  // ─────────────────────────────────────────────────────────────────

  readonly pattern: InfluencePattern;
  readonly patternLabel?: string;

  // ─────────────────────────────────────────────────────────────────
  // 影响属性
  // ─────────────────────────────────────────────────────────────────

  readonly type: InfluenceType;
  readonly intensity: InfluenceIntensity;
  readonly scope: 'global' | 'local' | 'targeted';
  readonly targetNeurons?: NeuronId[];

  // ─────────────────────────────────────────────────────────────────
  // 传播属性
  // ─────────────────────────────────────────────────────────────────

  readonly decayRate: number;
  readonly maxHops: number;
  currentHops: number;

  // ─────────────────────────────────────────────────────────────────
  // 来源追踪
  // ─────────────────────────────────────────────────────────────────

  readonly source: 'external' | 'internal' | 'meta';
  readonly sourceId: string;
  readonly originalSignal?: unknown;
  readonly createdAt: Timestamp;
  readonly ttl: number;

  // ─────────────────────────────────────────────────────────────────
  // 内部状态
  // ─────────────────────────────────────────────────────────────────

  private _currentIntensity: InfluenceIntensity;
  private _isExpired: boolean = false;

  // ─────────────────────────────────────────────────────────────────
  // 构造函数
  // ─────────────────────────────────────────────────────────────────

  constructor(config: InfluenceConfig) {
    const now = Date.now();

    this.pattern = config.pattern;
    this.patternLabel = config.patternLabel;
    this.type = config.type || 'activate';
    this.intensity = config.intensity ?? 1.0;
    this._currentIntensity = this.intensity;
    this.scope = config.scope || 'global';
    this.targetNeurons = config.targetNeurons;
    this.decayRate = config.decayRate ?? DEFAULT_DECAY_RATE;
    this.maxHops = config.maxHops ?? DEFAULT_MAX_HOPS;
    this.currentHops = 0;
    this.source = config.source || 'external';
    this.sourceId = config.sourceId || uuidv4();
    this.originalSignal = config.originalSignal;
    this.createdAt = now;
    this.ttl = config.ttl ?? DEFAULT_TTL;
  }

  // ─────────────────────────────────────────────────────────────────
  // Getter
  // ─────────────────────────────────────────────────────────────────

  get currentIntensity(): InfluenceIntensity {
    return this._currentIntensity;
  }

  get isExpired(): boolean {
    if (this._isExpired) return true;
    
    // 检查TTL
    if (Date.now() - this.createdAt > this.ttl) {
      this._isExpired = true;
      return true;
    }

    // 检查跳数
    if (this.currentHops >= this.maxHops) {
      this._isExpired = true;
      return true;
    }

    // 检查强度
    if (this._currentIntensity < 0.01) {
      this._isExpired = true;
      return true;
    }

    return false;
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法：传播
  // ─────────────────────────────────────────────────────────────────

  /**
   * 创建传播后的新影响
   * 
   * @param newPattern 新的影响模式（可选，通常保持不变）
   * @returns 新的影响实例
   */
  propagate(newPattern?: InfluencePattern): Influence {
    // 衰减强度
    const newIntensity = this._currentIntensity * this.decayRate;

    // 创建新影响
    const propagated = new Influence({
      pattern: newPattern || this.pattern,
      patternLabel: this.patternLabel,
      type: this.type,
      intensity: newIntensity,
      scope: this.scope,
      targetNeurons: this.targetNeurons,
      decayRate: this.decayRate,
      maxHops: this.maxHops,
      source: this.source,
      sourceId: this.sourceId,
      originalSignal: this.originalSignal,
      ttl: this.ttl - (Date.now() - this.createdAt),
    });

    // 增加跳数
    propagated.currentHops = this.currentHops + 1;

    return propagated;
  }

  /**
   * 应用衰减
   */
  applyDecay(): void {
    this._currentIntensity *= this.decayRate;
  }

  // ─────────────────────────────────────────────────────────────────
  // 静态工厂方法
  // ─────────────────────────────────────────────────────────────────

  /**
   * 创建激活影响
   */
  static activate(
    pattern: InfluencePattern,
    intensity: InfluenceIntensity = 1.0,
    sourceId?: string
  ): Influence {
    return new Influence({
      pattern,
      type: 'activate',
      intensity,
      source: 'external',
      sourceId,
    });
  }

  /**
   * 创建抑制影响
   */
  static inhibit(
    pattern: InfluencePattern,
    intensity: InfluenceIntensity = 1.0,
    sourceId?: string
  ): Influence {
    return new Influence({
      pattern,
      type: 'inhibit',
      intensity,
      source: 'external',
      sourceId,
    });
  }

  /**
   * 创建调节影响
   */
  static modulate(
    pattern: InfluencePattern,
    intensity: InfluenceIntensity = 1.0,
    sourceId?: string
  ): Influence {
    return new Influence({
      pattern,
      type: 'modulate',
      intensity,
      source: 'external',
      sourceId,
    });
  }

  /**
   * 创建内部影响（来自神经元）
   */
  static internal(
    pattern: InfluencePattern,
    sourceNeuronId: NeuronId,
    intensity: InfluenceIntensity = 1.0
  ): Influence {
    return new Influence({
      pattern,
      type: 'activate',
      intensity,
      source: 'internal',
      sourceId: sourceNeuronId,
    });
  }

  /**
   * 创建元层影响
   */
  static meta(
    pattern: InfluencePattern,
    intensity: InfluenceIntensity = 1.0
  ): Influence {
    return new Influence({
      pattern,
      type: 'modulate',
      intensity,
      source: 'meta',
      sourceId: 'meta-layer',
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // 序列化
  // ─────────────────────────────────────────────────────────────────

  /**
   * 转换为JSON
   */
  toJSON(): IInfluence {
    return {
      pattern: this.pattern,
      patternLabel: this.patternLabel,
      type: this.type,
      intensity: this.intensity,
      scope: this.scope,
      targetNeurons: this.targetNeurons,
      decayRate: this.decayRate,
      maxHops: this.maxHops,
      currentHops: this.currentHops,
      source: this.source,
      sourceId: this.sourceId,
      originalSignal: this.originalSignal,
      createdAt: this.createdAt,
      ttl: this.ttl,
    };
  }

  /**
   * 从JSON创建
   */
  static fromJSON(json: IInfluence): Influence {
    const influence = new Influence({
      pattern: json.pattern,
      patternLabel: json.patternLabel,
      type: json.type,
      intensity: json.intensity,
      scope: json.scope,
      targetNeurons: json.targetNeurons,
      decayRate: json.decayRate,
      maxHops: json.maxHops,
      source: json.source,
      sourceId: json.sourceId,
      originalSignal: json.originalSignal,
      ttl: json.ttl,
    });

    influence.currentHops = json.currentHops;

    return influence;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 影响池
// ─────────────────────────────────────────────────────────────────────

/**
 * 影响池
 * 
 * 存储待处理的影响
 */
export class InfluencePool {
  private _pending: Influence[] = [];
  private _processing: Influence[] = [];
  private _processed: Influence[] = [];
  
  private _maxPendingSize: number = 1000;
  private _maxProcessedSize: number = 100;

  // ─────────────────────────────────────────────────────────────────
  // Getter
  // ─────────────────────────────────────────────────────────────────

  get pending(): Influence[] {
    return [...this._pending];
  }

  get processing(): Influence[] {
    return [...this._processing];
  }

  get processed(): Influence[] {
    return [...this._processed];
  }

  get pendingCount(): number {
    return this._pending.length;
  }

  get isEmpty(): boolean {
    return this._pending.length === 0;
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心方法
  // ─────────────────────────────────────────────────────────────────

  /**
   * 添加影响
   */
  add(influence: Influence): void {
    // 检查是否过期
    if (influence.isExpired) {
      return;
    }

    // 检查容量
    if (this._pending.length >= this._maxPendingSize) {
      // 移除最旧的影响
      this._pending.shift();
    }

    this._pending.push(influence);
  }

  /**
   * 批量添加影响
   */
  addBatch(influences: Influence[]): void {
    for (const influence of influences) {
      this.add(influence);
    }
  }

  /**
   * 获取下一个要处理的影响
   */
  next(): Influence | null {
    if (this._pending.length === 0) {
      return null;
    }

    const influence = this._pending.shift()!;
    this._processing.push(influence);

    return influence;
  }

  /**
   * 批量获取要处理的影响
   */
  nextBatch(count: number): Influence[] {
    const batch: Influence[] = [];
    
    for (let i = 0; i < count && this._pending.length > 0; i++) {
      const influence = this._pending.shift()!;
      this._processing.push(influence);
      batch.push(influence);
    }

    return batch;
  }

  /**
   * 标记影响为已处理
   */
  markProcessed(influence: Influence): void {
    const index = this._processing.indexOf(influence);
    if (index > -1) {
      this._processing.splice(index, 1);
      
      // 添加到已处理列表
      this._processed.push(influence);
      
      // 限制已处理列表大小
      if (this._processed.length > this._maxProcessedSize) {
        this._processed.shift();
      }
    }
  }

  /**
   * 清理过期的影响
   */
  cleanup(): void {
    // 清理待处理中的过期影响
    this._pending = this._pending.filter(i => !i.isExpired);
    
    // 清理正在处理中的过期影响
    this._processing = this._processing.filter(i => !i.isExpired);
  }

  /**
   * 清空所有影响
   */
  clear(): void {
    this._pending = [];
    this._processing = [];
    this._processed = [];
  }

  /**
   * 按优先级排序
   * 
   * 优先级基于强度和来源
   */
  sortByPriority(): void {
    this._pending.sort((a, b) => {
      // 外部输入优先
      if (a.source === 'external' && b.source !== 'external') return -1;
      if (b.source === 'external' && a.source !== 'external') return 1;
      
      // 元层干预次优先
      if (a.source === 'meta' && b.source !== 'meta') return -1;
      if (b.source === 'meta' && a.source !== 'meta') return 1;
      
      // 强度高的优先
      return b.currentIntensity - a.currentIntensity;
    });
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    pendingCount: number;
    processingCount: number;
    processedCount: number;
    avgIntensity: number;
    sources: Record<string, number>;
  } {
    const all = [...this._pending, ...this._processing];
    
    const avgIntensity = all.length > 0
      ? all.reduce((sum, i) => sum + i.currentIntensity, 0) / all.length
      : 0;

    const sources: Record<string, number> = {};
    for (const influence of all) {
      sources[influence.source] = (sources[influence.source] || 0) + 1;
    }

    return {
      pendingCount: this._pending.length,
      processingCount: this._processing.length,
      processedCount: this._processed.length,
      avgIntensity,
      sources,
    };
  }
}
