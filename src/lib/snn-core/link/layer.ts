/**
 * ═══════════════════════════════════════════════════════════════════════
 * 链接涌现层
 * 
 * 链接不是定义出来的，而是从脉冲模式中涌现的。
 * 
 * 职责：
 * 1. 观察 SNN 的脉冲模式
 * 2. 检测概念间的共激活
 * 3. 发现涌现的连接
 * 4. 维护连接的生命周期
 * 
 * 不提供：
 * - bind(), flow(), hold() 等显式 API
 * - 预设的链接类型
 * - 人为定义的关系
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { SpikingNeuralNetwork } from '../snn';
import type { V6Observer } from '../v6';
import type { NeuronId } from '../types';
import type {
  ConceptId,
  EmergentConnection,
  ConceptNetwork,
  CoActivationRecord,
  EmergenceConfig
} from './types';
import { DEFAULT_EMERGENCE_CONFIG } from './types';

/**
 * 链接涌现层
 * 
 * 不定义链接，只发现链接
 */
export class LinkEmergence {
  private snn: SpikingNeuralNetwork;
  private v6: V6Observer;
  private config: EmergenceConfig;
  
  // 概念到神经元的映射（由编码器维护）
  private conceptNeurons: Map<ConceptId, NeuronId[]> = new Map();
  
  // 共激活统计
  private coActivationStats: Map<string, {
    count: number;
    correlationSum: number;
    delaySum: number;
    lastUpdate: number;
  }> = new Map();
  
  // 涌现的连接
  private connections: Map<string, EmergentConnection> = new Map();
  
  // 概念统计
  private conceptStats: Map<ConceptId, {
    neuronCount: number;
    activations: number;
    lastActive: number;
  }> = new Map();
  
  // 观察计数
  private observationCount = 0;
  
  constructor(
    snn: SpikingNeuralNetwork,
    v6: V6Observer,
    config: Partial<EmergenceConfig> = {}
  ) {
    this.snn = snn;
    this.v6 = v6;
    this.config = { ...DEFAULT_EMERGENCE_CONFIG, ...config };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心：观察与涌现
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 注册概念到神经元的映射
   * 由编码器调用，不暴露给外部
   */
  registerConceptNeurons(concept: ConceptId, neurons: NeuronId[]): void {
    this.conceptNeurons.set(concept, neurons);
    
    if (!this.conceptStats.has(concept)) {
      this.conceptStats.set(concept, {
        neuronCount: neurons.length,
        activations: 0,
        lastActive: Date.now()
      });
    }
  }
  
  /**
   * 观察一次激活事件
   * 由 SNN 网络在脉冲传播时调用
   */
  observeActivation(concept: ConceptId, timestamp: number = Date.now()): void {
    const stats = this.conceptStats.get(concept);
    if (stats) {
      stats.activations++;
      stats.lastActive = timestamp;
    }
    
    this.observationCount++;
    
    // 定期修剪
    if (this.observationCount % this.config.pruneInterval === 0) {
      this.prune();
    }
  }
  
  /**
   * 观察概念共激活
   * 当两个概念在时间窗口内同时激活时调用
   */
  observeCoActivation(
    concept1: ConceptId,
    concept2: ConceptId,
    delay: number = 0,
    intensity: number = 1.0
  ): void {
    // 确保 concept1 < concept2，避免重复
    const [c1, c2] = concept1 < concept2 ? [concept1, concept2] : [concept2, concept1];
    const key = `${c1}|${c2}`;
    
    const stats = this.coActivationStats.get(key) || {
      count: 0,
      correlationSum: 0,
      delaySum: 0,
      lastUpdate: Date.now()
    };
    
    stats.count++;
    stats.correlationSum += intensity;
    stats.delaySum += delay;
    stats.lastUpdate = Date.now();
    
    this.coActivationStats.set(key, stats);
    
    // 检查是否涌现为新连接
    this.checkEmergence(c1, c2, stats);
  }
  
  /**
   * 批量观察激活模式
   * V6 观察器可以调用此方法报告检测到的模式
   */
  observePattern(
    activeConcepts: ConceptId[],
    firingNeurons: Map<ConceptId, NeuronId[]>,
    timestamp: number = Date.now()
  ): void {
    // 记录每个概念的激活
    for (const concept of activeConcepts) {
      this.observeActivation(concept, timestamp);
    }
    
    // 检测共激活
    for (let i = 0; i < activeConcepts.length; i++) {
      for (let j = i + 1; j < activeConcepts.length; j++) {
        // 计算时间延迟（基于神经元发放顺序）
        const neurons1 = firingNeurons.get(activeConcepts[i]) || [];
        const neurons2 = firingNeurons.get(activeConcepts[j]) || [];
        
        // 简化：假设同时激活，延迟为0
        this.observeCoActivation(activeConcepts[i], activeConcepts[j], 0, 1.0);
      }
    }
  }
  
  /**
   * 检查是否涌现为新连接
   */
  private checkEmergence(
    concept1: ConceptId,
    concept2: ConceptId,
    stats: { count: number; correlationSum: number; delaySum: number; lastUpdate: number }
  ): void {
    // 检查是否满足最小观察次数
    if (stats.count < this.config.minObservations) return;
    
    const correlation = stats.correlationSum / stats.count;
    
    // 检查是否满足最小相关性
    if (Math.abs(correlation) < this.config.minCorrelation) return;
    
    const key = `${concept1}|${concept2}`;
    
    // 更新或创建连接
    const existing = this.connections.get(key);
    const now = Date.now();
    
    if (existing) {
      // 更新现有连接
      existing.coActivationCount = stats.count;
      existing.correlation = correlation;
      existing.avgTimeDelay = stats.delaySum / stats.count;
      existing.lastObserved = now;
      
      // 更新稳定性
      existing.stability = this.calculateStability(existing);
    } else {
      // 创建新连接
      this.connections.set(key, {
        source: concept1,
        target: concept2,
        coActivationCount: stats.count,
        correlation,
        avgTimeDelay: stats.delaySum / stats.count,
        avgWeight: 0.5, // 初始权重
        bidirectional: true, // 默认双向
        synapseCount: 0,
        stability: 0.5,
        firstObserved: now,
        lastObserved: now
      });
    }
  }
  
  /**
   * 计算连接稳定性
   */
  private calculateStability(conn: EmergentConnection): number {
    // 基于观察次数和相关性计算稳定性
    const countScore = Math.min(conn.coActivationCount / 20, 1);
    const corrScore = Math.abs(conn.correlation);
    
    return countScore * 0.4 + corrScore * 0.6;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 查询接口
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 查询与概念相关的其他概念
   * 返回按相关性排序的列表
   */
  queryRelated(concept: ConceptId): Array<{
    concept: ConceptId;
    correlation: number;
    coActivationCount: number;
    avgDelay: number;
  }> {
    const related: Array<{
      concept: ConceptId;
      correlation: number;
      coActivationCount: number;
      avgDelay: number;
    }> = [];
    
    for (const conn of this.connections.values()) {
      if (conn.source === concept || conn.target === concept) {
        const other = conn.source === concept ? conn.target : conn.source;
        
        // 只返回稳定的连接
        if (conn.stability >= this.config.minStability) {
          related.push({
            concept: other,
            correlation: conn.correlation,
            coActivationCount: conn.coActivationCount,
            avgDelay: conn.avgTimeDelay
          });
        }
      }
    }
    
    // 按相关性排序
    related.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
    
    return related;
  }
  
  /**
   * 查询两个概念之间的连接
   */
  queryConnection(concept1: ConceptId, concept2: ConceptId): EmergentConnection | undefined {
    const key = concept1 < concept2 
      ? `${concept1}|${concept2}` 
      : `${concept2}|${concept1}`;
    return this.connections.get(key);
  }
  
  /**
   * 获取所有涌现的连接
   */
  getAllConnections(): EmergentConnection[] {
    return Array.from(this.connections.values())
      .filter(c => c.stability >= this.config.minStability);
  }
  
  /**
   * 获取概念网络
   */
  getNetwork(): ConceptNetwork {
    const concepts = new Map<ConceptId, {
      neuronCount: number;
      totalActivations: number;
      lastActive: number;
    }>();
    
    for (const [concept, stats] of this.conceptStats) {
      concepts.set(concept, {
        neuronCount: stats.neuronCount,
        totalActivations: stats.activations,
        lastActive: stats.lastActive
      });
    }
    
    const connections = this.getAllConnections();
    const totalStrength = connections.reduce((sum, c) => sum + Math.abs(c.correlation), 0);
    
    return {
      concepts,
      connections,
      stats: {
        totalConcepts: concepts.size,
        totalConnections: connections.length,
        avgConnectionStrength: connections.length > 0 ? totalStrength / connections.length : 0,
        networkDensity: concepts.size > 1 
          ? connections.length / (concepts.size * (concepts.size - 1) / 2)
          : 0
      }
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 生命周期管理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 修剪不稳定的连接
   */
  prune(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [key, conn] of this.connections) {
      // 稳定性低于阈值
      if (conn.stability < this.config.pruneThreshold) {
        toDelete.push(key);
        continue;
      }
      
      // 长时间未观察到
      const age = now - conn.lastObserved;
      if (age > this.config.observationWindow * 10) {
        // 衰减稳定性
        conn.stability *= 0.9;
        if (conn.stability < this.config.pruneThreshold) {
          toDelete.push(key);
        }
      }
    }
    
    // 删除
    for (const key of toDelete) {
      this.connections.delete(key);
      this.coActivationStats.delete(key);
    }
    
    if (toDelete.length > 0) {
      console.log(`[LinkEmergence] 修剪了 ${toDelete.length} 个不稳定连接`);
    }
  }
  
  /**
   * 重置所有状态
   */
  reset(): void {
    this.coActivationStats.clear();
    this.connections.clear();
    this.conceptStats.clear();
    this.observationCount = 0;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 统计
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取统计信息
   */
  getStats(): {
    totalConcepts: number;
    totalConnections: number;
    stableConnections: number;
    avgStability: number;
    observationCount: number;
  } {
    const stable = Array.from(this.connections.values())
      .filter(c => c.stability >= this.config.minStability);
    
    const avgStability = stable.length > 0
      ? stable.reduce((sum, c) => sum + c.stability, 0) / stable.length
      : 0;
    
    return {
      totalConcepts: this.conceptStats.size,
      totalConnections: this.connections.size,
      stableConnections: stable.length,
      avgStability,
      observationCount: this.observationCount
    };
  }
  
  /**
   * 导出为图谱格式（用于可视化）
   */
  toGraph(): {
    nodes: Array<{ id: ConceptId; activations: number }>;
    edges: Array<{ 
      source: ConceptId; 
      target: ConceptId; 
      weight: number;
      stability: number;
    }>;
  } {
    const nodes: Array<{ id: ConceptId; activations: number }> = [];
    
    for (const [concept, stats] of this.conceptStats) {
      nodes.push({
        id: concept,
        activations: stats.activations
      });
    }
    
    const edges = this.getAllConnections().map(conn => ({
      source: conn.source,
      target: conn.target,
      weight: Math.abs(conn.correlation),
      stability: conn.stability
    }));
    
    return { nodes, edges };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════════════════

/**
 * 创建链接涌现层
 */
export function createLinkEmergence(
  snn: SpikingNeuralNetwork,
  v6: V6Observer,
  config?: Partial<EmergenceConfig>
): LinkEmergence {
  return new LinkEmergence(snn, v6, config);
}
