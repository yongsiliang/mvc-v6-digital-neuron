/**
 * ═══════════════════════════════════════════════════════════════════════
 * 模式吸引子动力学 (Pattern Attractor Dynamics)
 * 
 * 核心思想：
 * - 模式是场中的吸引子，自然涌现而非预设
 * - 相似的行动被吸引到同一个模式
 * - 吸引子的强度取决于被吸引的行动数量和质量
 * - 模式会随时间演化：形成 → 稳定 → 衰退
 * 
 * 灵感来源：
 * - 动力系统理论：吸引子是系统演化的终态
 * - 神经网络：Hebbian学习，一起激发的神经元连接在一起
 * - 复杂系统：自组织临界性
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type { ActionField, ActionParticle, PotentialPeak } from './action-field';

// ─────────────────────────────────────────────────────────────────────
// 常量配置
// ─────────────────────────────────────────────────────────────────────

/** 初始吸引半径 */
const INITIAL_RADIUS = 0.3;

/** 最小吸引强度 */
const MIN_STRENGTH = 0.1;

/** 最大吸引强度 */
const MAX_STRENGTH = 1.0;

/** 形成期阈值（被吸引的行动数） */
const FORMATION_THRESHOLD = 3;

/** 稳定期阈值 */
const STABILITY_THRESHOLD = 10;

/** 衰退速率 */
const DECAY_RATE = 0.02;

/** 学习率 */
const LEARNING_RATE = 0.1;

/** 涌现阈值 */
const EMERGENCE_THRESHOLD = 0.5;

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 吸引子相位
 */
export type AttractorPhase = 'forming' | 'stable' | 'decaying';

/**
 * 模式类型
 */
export type PatternType = 
  | 'sequential'    // 顺序模式：A → B → C
  | 'conditional'   // 条件模式：如果 X，则 Y
  | 'iterative'     // 迭代模式：重复直到成功
  | 'fallback'      // 降级模式：A 失败 → B
  | 'parallel';     // 并行模式：A 和 B 同时

/**
 * 模式吸引子
 */
export interface PatternAttractor {
  /** 唯一标识 */
  id: string;
  
  /** 吸引子中心（在特征空间中） */
  center: number[];
  
  /** 吸引半径 */
  radius: number;
  
  /** 吸引强度 (0-1) */
  strength: number;
  
  /** 模式类型 */
  type: PatternType;
  
  /** 模式描述（自然语言） */
  description: string;
  
  /** 模式摘要（用于检索） */
  summary: string;
  
  /** 演化相位 */
  phase: AttractorPhase;
  
  /** 被吸引的行动ID */
  attractedParticles: string[];
  
  /** 典型行动序列 */
  typicalSequence: string[];
  
  /** 统计信息 */
  statistics: {
    totalCount: number;
    successCount: number;
    failCount: number;
    successRate: number;
    avgDuration: number;
    avgRetries: number;
  };
  
  /** 时间演化 */
  evolution: {
    createdAt: number;
    lastReinforced: number;
    lastUsed: number;
    peakStrength: number;
    reinforcementCount: number;
  };
  
  /** 领域标签 */
  domains: string[];
  
  /** 可信度 */
  confidence: number;
}

/**
 * 吸引结果
 */
export interface AttractionResult {
  /** 被哪个吸引子吸引 */
  attractorId: string | null;
  
  /** 吸引强度 */
  attraction: number;
  
  /** 是否形成新吸引子 */
  newAttractor: PatternAttractor | null;
}

/**
 * 动力学配置
 */
export interface DynamicsConfig {
  /** 初始吸引半径 */
  initialRadius: number;
  
  /** 学习率 */
  learningRate: number;
  
  /** 涌现阈值 */
  emergenceThreshold: number;
  
  /** 衰退速率 */
  decayRate: number;
  
  /** 形成期阈值 */
  formationThreshold: number;
}

// ─────────────────────────────────────────────────────────────────────
// 吸引子动力学
// ─────────────────────────────────────────────────────────────────────

/**
 * 吸引子动力学
 */
export class AttractorDynamics {
  private actionField: ActionField;
  private config: DynamicsConfig;
  
  /** 吸引子集合 */
  private attractors: Map<string, PatternAttractor> = new Map();
  
  /** 按类型索引 */
  private typeIndex: Map<PatternType, Set<string>> = new Map();
  
  /** 按领域索引 */
  private domainIndex: Map<string, Set<string>> = new Map();
  
  constructor(actionField: ActionField, config?: Partial<DynamicsConfig>) {
    this.actionField = actionField;
    this.config = {
      initialRadius: config?.initialRadius || INITIAL_RADIUS,
      learningRate: config?.learningRate || LEARNING_RATE,
      emergenceThreshold: config?.emergenceThreshold || EMERGENCE_THRESHOLD,
      decayRate: config?.decayRate || DECAY_RATE,
      formationThreshold: config?.formationThreshold || FORMATION_THRESHOLD,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心动力学
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 处理新行动粒子
   * 
   * 核心算法：
   * 1. 计算与所有吸引子的吸引强度
   * 2. 被最强吸引子吸引，或形成新吸引子
   * 3. 更新吸引子状态
   */
  processParticle(particle: ActionParticle): AttractionResult {
    // 1. 计算与所有吸引子的吸引
    const attractions = this.calculateAllAttractions(particle);
    
    // 2. 找到最强吸引
    const maxAttraction = attractions.reduce(
      (max, a) => a.attraction > max.attraction ? a : max,
      { attractorId: null as string | null, attraction: 0 }
    );
    
    // 3. 决定：被吸引 or 新涌现
    if (maxAttraction.attraction > this.config.emergenceThreshold) {
      // 被现有吸引子吸引
      const attractor = this.attractors.get(maxAttraction.attractorId!);
      if (attractor) {
        this.reinforceAttractor(attractor, particle);
        
        return {
          attractorId: attractor.id,
          attraction: maxAttraction.attraction,
          newAttractor: null,
        };
      }
    }
    
    // 4. 检查是否应该形成新吸引子
    const newAttractor = this.checkEmergence(particle);
    
    return {
      attractorId: null,
      attraction: 0,
      newAttractor,
    };
  }
  
  /**
   * 计算粒子与所有吸引子的吸引强度
   */
  private calculateAllAttractions(
    particle: ActionParticle
  ): Array<{ attractorId: string; attraction: number }> {
    const results: Array<{ attractorId: string; attraction: number }> = [];
    
    for (const [id, attractor] of this.attractors) {
      const attraction = this.calculateAttraction(particle, attractor);
      if (attraction > 0.1) {
        results.push({ attractorId: id, attraction });
      }
    }
    
    return results.sort((a, b) => b.attraction - a.attraction);
  }
  
  /**
   * 计算单个吸引强度
   * 
   * 使用高斯核函数：
   * attraction = strength × exp(-distance² / (2 × radius²))
   */
  calculateAttraction(
    particle: ActionParticle,
    attractor: PatternAttractor
  ): number {
    const distance = this.euclideanDistance(particle.position, attractor.center);
    
    // 高斯核
    const gaussian = Math.exp(
      -distance * distance / (2 * attractor.radius * attractor.radius)
    );
    
    // 结果类型影响吸引力
    const outcomeBoost = particle.charge > 0 ? 1.2 : 0.8;
    
    return attractor.strength * gaussian * outcomeBoost;
  }
  
  /**
   * 强化吸引子
   * 
   * 当新粒子被吸引时：
   * 1. 中心漂移（向新粒子移动）
   * 2. 强度更新
   * 3. 统计更新
   */
  private reinforceAttractor(
    attractor: PatternAttractor,
    particle: ActionParticle
  ): void {
    const lr = this.config.learningRate;
    
    // 中心漂移
    for (let i = 0; i < attractor.center.length; i++) {
      attractor.center[i] += lr * (particle.position[i] - attractor.center[i]);
    }
    
    // 强度更新
    if (particle.charge > 0) {
      attractor.strength = Math.min(
        MAX_STRENGTH,
        attractor.strength + particle.charge * 0.05
      );
    } else {
      attractor.strength = Math.max(
        MIN_STRENGTH,
        attractor.strength + particle.charge * 0.03
      );
    }
    
    // 记录被吸引的粒子
    attractor.attractedParticles.push(particle.id);
    
    // 更新统计
    this.updateStatistics(attractor, particle);
    
    // 更新演化状态
    attractor.evolution.lastReinforced = Date.now();
    attractor.evolution.reinforcementCount++;
    attractor.evolution.peakStrength = Math.max(
      attractor.evolution.peakStrength,
      attractor.strength
    );
    
    // 更新相位
    this.updatePhase(attractor);
    
    // 更新可信度
    attractor.confidence = this.calculateConfidence(attractor);
  }
  
  /**
   * 检查新吸引子的涌现
   */
  private checkEmergence(particle: ActionParticle): PatternAttractor | null {
    // 查找场中的势能峰值
    const peaks = this.actionField.findPotentialPeaks();
    
    // 检查粒子是否在某个峰值附近
    for (const peak of peaks) {
      // 检查是否已有吸引子在这个位置
      const nearbyAttractor = this.findNearbyAttractor(peak.position);
      if (nearbyAttractor) continue;
      
      // 创建新吸引子
      if (peak.density >= this.config.emergenceThreshold && 
          peak.particleIds.length >= this.config.formationThreshold) {
        return this.createAttractor(peak, particle);
      }
    }
    
    return null;
  }
  
  /**
   * 创建新吸引子
   */
  private createAttractor(peak: PotentialPeak, seedParticle: ActionParticle): PatternAttractor {
    const particles = peak.particleIds
      .map(id => this.actionField.getParticle(id))
      .filter(Boolean) as ActionParticle[];
    
    // 推断模式类型
    const patternType = this.inferPatternType(particles);
    
    // 生成描述
    const description = this.generateDescription(particles, patternType);
    
    const attractor: PatternAttractor = {
      id: uuidv4(),
      center: [...peak.position],
      radius: this.config.initialRadius,
      strength: peak.potential / particles.length,
      type: patternType,
      description,
      summary: description.slice(0, 50),
      phase: 'forming',
      attractedParticles: peak.particleIds,
      typicalSequence: this.extractTypicalSequence(particles),
      statistics: this.calculateStatistics(particles),
      evolution: {
        createdAt: Date.now(),
        lastReinforced: Date.now(),
        lastUsed: Date.now(),
        peakStrength: peak.potential / particles.length,
        reinforcementCount: 1,
      },
      domains: this.inferDomains(particles),
      confidence: 0.5,
    };
    
    // 添加到集合
    this.attractors.set(attractor.id, attractor);
    this.updateIndices(attractor);
    
    console.log(`[吸引子动力学] 新模式涌现: ${description.slice(0, 30)}... (类型: ${patternType})`);
    
    return attractor;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 模式推断
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 推断模式类型
   */
  private inferPatternType(particles: ActionParticle[]): PatternType {
    // 分析行动序列
    const types = particles.map(p => p.type);
    const results = particles.map(p => p.result);
    const retries = particles.map(p => p.retryCount);
    
    // 检查迭代模式
    if (retries.some(r => r > 0)) {
      return 'iterative';
    }
    
    // 检查降级模式
    if (results.includes('failed') && types.length > 1) {
      const failedIndex = results.indexOf('failed');
      if (failedIndex < types.length - 1 && results[failedIndex + 1] === 'success') {
        return 'fallback';
      }
    }
    
    // 检查顺序模式
    if (new Set(types).size === types.length && types.length > 1) {
      return 'sequential';
    }
    
    // 检查条件模式
    if (particles.some(p => p.context.includes('如果') || p.context.includes('当'))) {
      return 'conditional';
    }
    
    // 默认
    return 'sequential';
  }
  
  /**
   * 生成模式描述
   */
  private generateDescription(particles: ActionParticle[], type: PatternType): string {
    const types = [...new Set(particles.map(p => p.type))];
    const targets = [...new Set(particles.map(p => p.target.toLowerCase()))];
    
    switch (type) {
      case 'sequential':
        return `顺序执行: ${types.join(' → ')}`;
      case 'iterative':
        return `重试直到成功: ${types[0]}`;
      case 'fallback':
        return `失败后降级: ${types[0]} → ${types[1] || '替代方案'}`;
      case 'conditional':
        return `条件执行: ${types.join(' 或 ')}`;
      case 'parallel':
        return `并行执行: ${types.join(' + ')}`;
      default:
        return `模式: ${types.join(', ')}`;
    }
  }
  
  /**
   * 提取典型序列
   */
  private extractTypicalSequence(particles: ActionParticle[]): string[] {
    // 按时间排序
    const sorted = [...particles].sort((a, b) => a.timestamp - b.timestamp);
    
    // 提取行动类型序列
    return sorted.map(p => `${p.type}:${p.target.slice(0, 20)}`);
  }
  
  /**
   * 推断领域
   */
  private inferDomains(particles: ActionParticle[]): string[] {
    const domains = new Set<string>();
    
    for (const particle of particles) {
      const context = particle.context.toLowerCase();
      
      if (context.includes('表单') || context.includes('输入')) {
        domains.add('表单操作');
      }
      if (context.includes('导航') || context.includes('页面')) {
        domains.add('页面导航');
      }
      if (context.includes('错误') || context.includes('失败')) {
        domains.add('错误处理');
      }
      if (context.includes('数据') || context.includes('提取')) {
        domains.add('数据处理');
      }
      if (context.includes('等待') || context.includes('加载')) {
        domains.add('异步等待');
      }
    }
    
    return Array.from(domains);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 统计与演化
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 计算统计信息
   */
  private calculateStatistics(particles: ActionParticle[]): PatternAttractor['statistics'] {
    const successCount = particles.filter(p => p.result === 'success').length;
    const failCount = particles.filter(p => p.result === 'failed').length;
    
    return {
      totalCount: particles.length,
      successCount,
      failCount,
      successRate: particles.length > 0 ? successCount / particles.length : 0,
      avgDuration: particles.reduce((sum, p) => sum + p.duration, 0) / Math.max(particles.length, 1),
      avgRetries: particles.reduce((sum, p) => sum + p.retryCount, 0) / Math.max(particles.length, 1),
    };
  }
  
  /**
   * 更新统计信息
   */
  private updateStatistics(
    attractor: PatternAttractor,
    particle: ActionParticle
  ): void {
    const stats = attractor.statistics;
    const n = stats.totalCount;
    
    // 在线平均更新
    stats.totalCount++;
    stats.avgDuration = (stats.avgDuration * n + particle.duration) / (n + 1);
    stats.avgRetries = (stats.avgRetries * n + particle.retryCount) / (n + 1);
    
    if (particle.result === 'success') {
      stats.successCount++;
    } else if (particle.result === 'failed') {
      stats.failCount++;
    }
    
    stats.successRate = stats.successCount / stats.totalCount;
  }
  
  /**
   * 更新相位
   */
  private updatePhase(attractor: PatternAttractor): void {
    const reinforcementCount = attractor.evolution.reinforcementCount;
    
    if (reinforcementCount < this.config.formationThreshold * 2) {
      attractor.phase = 'forming';
    } else if (attractor.strength > attractor.evolution.peakStrength * 0.7) {
      attractor.phase = 'stable';
    } else {
      attractor.phase = 'decaying';
    }
  }
  
  /**
   * 计算可信度
   */
  private calculateConfidence(attractor: PatternAttractor): number {
    const stats = attractor.statistics;
    
    // 成功率贡献
    const successContrib = stats.successRate * 0.4;
    
    // 样本量贡献
    const sampleContrib = Math.min(stats.totalCount / 20, 1) * 0.3;
    
    // 稳定性贡献
    const stabilityContrib = attractor.phase === 'stable' ? 0.2 : 0.1;
    
    // 一致性贡献（低重试次数）
    const consistencyContrib = Math.max(0, 0.1 - stats.avgRetries * 0.02);
    
    return Math.min(1, successContrib + sampleContrib + stabilityContrib + consistencyContrib);
  }
  
  /**
   * 应用时间衰减
   */
  applyTimeDecay(): void {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    for (const attractor of this.attractors.values()) {
      const daysSinceReinforced = 
        (now - attractor.evolution.lastReinforced) / dayInMs;
      
      // 指数衰减
      attractor.strength *= Math.exp(-this.config.decayRate * daysSinceReinforced);
      
      // 更新相位
      if (attractor.strength < attractor.evolution.peakStrength * 0.5) {
        attractor.phase = 'decaying';
      }
      
      // 移除过弱的吸引子
      if (attractor.strength < MIN_STRENGTH && attractor.phase === 'decaying') {
        this.removeAttractor(attractor.id);
      }
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 查询接口
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取所有吸引子
   */
  getAllAttractors(): PatternAttractor[] {
    return Array.from(this.attractors.values());
  }
  
  /**
   * 获取指定类型的吸引子
   */
  getAttractorsByType(type: PatternType): PatternAttractor[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    return Array.from(ids)
      .map(id => this.attractors.get(id))
      .filter(Boolean) as PatternAttractor[];
  }
  
  /**
   * 获取指定领域的吸引子
   */
  getAttractorsByDomain(domain: string): PatternAttractor[] {
    const ids = this.domainIndex.get(domain);
    if (!ids) return [];
    return Array.from(ids)
      .map(id => this.attractors.get(id))
      .filter(Boolean) as PatternAttractor[];
  }
  
  /**
   * 获取最相关的吸引子
   */
  getMostRelevantAttractor(context: string): PatternAttractor | null {
    let best: PatternAttractor | null = null;
    let bestScore = 0;
    
    const contextLower = context.toLowerCase();
    
    for (const attractor of this.attractors.values()) {
      let score = attractor.strength * attractor.confidence;
      
      // 领域匹配加分
      if (attractor.domains.some(d => contextLower.includes(d.toLowerCase()))) {
        score *= 1.5;
      }
      
      // 描述匹配加分
      if (contextLower.includes(attractor.description.toLowerCase().slice(0, 10))) {
        score *= 1.3;
      }
      
      if (score > bestScore) {
        bestScore = score;
        best = attractor;
      }
    }
    
    return best;
  }
  
  /**
   * 获取稳定的吸引子
   */
  getStableAttractors(): PatternAttractor[] {
    return this.getAllAttractors()
      .filter(a => a.phase === 'stable' && a.confidence > 0.6)
      .sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * 获取吸引子
   */
  getAttractor(id: string): PatternAttractor | undefined {
    return this.attractors.get(id);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 辅助方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 找到附近的吸引子
   */
  private findNearbyAttractor(position: number[]): PatternAttractor | null {
    for (const attractor of this.attractors.values()) {
      const distance = this.euclideanDistance(position, attractor.center);
      if (distance < attractor.radius) {
        return attractor;
      }
    }
    return null;
  }
  
  /**
   * 更新索引
   */
  private updateIndices(attractor: PatternAttractor): void {
    // 类型索引
    if (!this.typeIndex.has(attractor.type)) {
      this.typeIndex.set(attractor.type, new Set());
    }
    this.typeIndex.get(attractor.type)!.add(attractor.id);
    
    // 领域索引
    for (const domain of attractor.domains) {
      if (!this.domainIndex.has(domain)) {
        this.domainIndex.set(domain, new Set());
      }
      this.domainIndex.get(domain)!.add(attractor.id);
    }
  }
  
  /**
   * 移除吸引子
   */
  private removeAttractor(id: string): void {
    const attractor = this.attractors.get(id);
    if (!attractor) return;
    
    // 从索引移除
    this.typeIndex.get(attractor.type)?.delete(id);
    for (const domain of attractor.domains) {
      this.domainIndex.get(domain)?.delete(id);
    }
    
    // 从集合移除
    this.attractors.delete(id);
    
    console.log(`[吸引子动力学] 吸引子衰亡: ${attractor.summary}`);
  }
  
  /**
   * 欧氏距离
   */
  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
      sum += (a[i] - b[i]) * (a[i] - b[i]);
    }
    return Math.sqrt(sum);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态管理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取统计信息
   */
  getStats(): {
    totalAttractors: number;
    byPhase: Record<AttractorPhase, number>;
    byType: Record<PatternType, number>;
    avgStrength: number;
    avgConfidence: number;
  } {
    const attractors = Array.from(this.attractors.values());
    
    const byPhase: Record<AttractorPhase, number> = {
      forming: 0,
      stable: 0,
      decaying: 0,
    };
    
    const byType: Record<PatternType, number> = {
      sequential: 0,
      conditional: 0,
      iterative: 0,
      fallback: 0,
      parallel: 0,
    };
    
    for (const a of attractors) {
      byPhase[a.phase]++;
      byType[a.type]++;
    }
    
    return {
      totalAttractors: attractors.length,
      byPhase,
      byType,
      avgStrength: attractors.length > 0
        ? attractors.reduce((sum, a) => sum + a.strength, 0) / attractors.length
        : 0,
      avgConfidence: attractors.length > 0
        ? attractors.reduce((sum, a) => sum + a.confidence, 0) / attractors.length
        : 0,
    };
  }
  
  /**
   * 导出状态
   */
  exportState(): string {
    return JSON.stringify({
      attractors: Array.from(this.attractors.entries()),
    });
  }
  
  /**
   * 导入状态
   */
  importState(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.attractors.clear();
      this.typeIndex.clear();
      this.domainIndex.clear();
      
      if (parsed.attractors) {
        for (const [id, attractor] of parsed.attractors) {
          this.attractors.set(id, attractor);
          this.updateIndices(attractor);
        }
      }
      
      console.log(`[吸引子动力学] 已恢复 ${this.attractors.size} 个吸引子`);
    } catch (e) {
      console.error('[吸引子动力学] 导入状态失败:', e);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

let dynamicsInstance: AttractorDynamics | null = null;

export function createAttractorDynamics(
  actionField: ActionField,
  config?: Partial<DynamicsConfig>
): AttractorDynamics {
  if (!dynamicsInstance) {
    dynamicsInstance = new AttractorDynamics(actionField, config);
  }
  return dynamicsInstance;
}

export function getAttractorDynamics(): AttractorDynamics | null {
  return dynamicsInstance;
}
