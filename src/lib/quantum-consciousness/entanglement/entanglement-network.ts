/**
 * ═══════════════════════════════════════════════════════════════════════
 * 纠缠机制 (Entanglement)
 * 
 * 有意义的模式连接 - 跨维度关联
 * 
 * 核心：
 * - 不是机械连接，而是有意义关联
 * - 纠缠的模式会"一起响应"
 * - 越纠缠，越可能出现共振
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { Complex } from '../types/quantum';
import type { PatternId, Pattern } from '../types/base';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 纠缠类型
 */
export type EntanglementType = 
  | 'conceptual'   // 概念相关
  | 'temporal'     // 时间相关（同时出现）
  | 'emotional'    // 情感相关
  | 'structural';  // 结构相关

/**
 * 纠缠关系
 */
export interface EntanglementRelation {
  /** 源模式 */
  sourceId: PatternId;
  
  /** 目标模式 */
  targetId: PatternId;
  
  /** 纠缠类型 */
  type: EntanglementType;
  
  /** 纠缠强度 0-1 */
  strength: number;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 激活次数 */
  activationCount: number;
  
  /** 最后激活时间 */
  lastActivatedAt: number | null;
  
  /** 纠缠元数据 */
  metadata: {
    /** 共同出现的频率 */
    coOccurrence: number;
    /** 语义相似度 */
    semanticSimilarity: number;
    /** 功能关联度 */
    functionalRelation: number;
  };
}

/**
 * 纠缠网络状态
 */
export interface EntanglementNetworkState {
  /** 所有纠缠关系 */
  relations: Map<string, EntanglementRelation>;
  
  /** 纠缠邻接表 */
  adjacencyList: Map<PatternId, Set<PatternId>>;
  
  /** 统计 */
  stats: {
    totalRelations: number;
    averageStrength: number;
    typeDistribution: Record<EntanglementType, number>;
  };
}

/**
 * 纠缠检测结果
 */
export interface EntanglementDetectionResult {
  /** 检测到的纠缠 */
  detected: EntanglementRelation[];
  
  /** 更新的纠缠 */
  updated: EntanglementRelation[];
  
  /** 网络统计 */
  stats: EntanglementNetworkState['stats'];
}

/**
 * 纠缠激活结果
 */
export interface EntanglementActivationResult {
  /** 激活的纠缠 */
  activated: EntanglementRelation[];
  
  /** 关联模式 */
  relatedPatterns: PatternId[];
  
  /** 共振强度 */
  resonanceStrength: number;
}

// ─────────────────────────────────────────────────────────────────────
// 纠缠机制实现
// ─────────────────────────────────────────────────────────────────────

/**
 * 纠缠网络
 * 
 * 管理模式之间的有意义连接
 */
export class EntanglementNetwork {
  private state: EntanglementNetworkState;
  
  /** 纠缠阈值：低于此值的纠缠会被移除 */
  private readonly STRENGTH_THRESHOLD = 0.1;
  
  /** 自然衰减率：每小时的衰减 */
  private readonly DECAY_RATE = 0.01;

  constructor() {
    this.state = {
      relations: new Map(),
      adjacencyList: new Map(),
      stats: {
        totalRelations: 0,
        averageStrength: 0,
        typeDistribution: {
          conceptual: 0,
          temporal: 0,
          emotional: 0,
          structural: 0,
        },
      },
    };

    console.log('[纠缠网络] 已初始化');
  }

  /**
   * 检测并建立纠缠
   * 
   * 分析新模式与现有模式的纠缠可能性
   */
  detectEntanglement(
    newPattern: Pattern,
    existingPatterns: Map<PatternId, Pattern>
  ): EntanglementDetectionResult {
    const detected: EntanglementRelation[] = [];
    const updated: EntanglementRelation[] = [];

    for (const [existingId, existingPattern] of existingPatterns) {
      if (existingId === newPattern.id) continue;

      // 计算各种纠缠类型的强度
      const entanglements = this.calculateEntanglementStrengths(
        newPattern,
        existingPattern
      );

      for (const { type, strength } of entanglements) {
        if (strength > this.STRENGTH_THRESHOLD) {
          // 检查是否已存在纠缠
          const existingKey = this.getRelationKey(newPattern.id, existingId, type);
          const existingRelation = this.state.relations.get(existingKey);

          if (existingRelation) {
            // 更新现有纠缠
            existingRelation.strength = Math.min(1, existingRelation.strength + strength * 0.1);
            existingRelation.metadata.coOccurrence++;
            updated.push(existingRelation);
          } else {
            // 创建新纠缠
            const relation: EntanglementRelation = {
              sourceId: newPattern.id,
              targetId: existingId,
              type,
              strength,
              createdAt: Date.now(),
              activationCount: 0,
              lastActivatedAt: null,
              metadata: {
                coOccurrence: 1,
                semanticSimilarity: type === 'conceptual' ? strength : 0,
                functionalRelation: type === 'structural' ? strength : 0,
              },
            };

            this.state.relations.set(existingKey, relation);
            this.addToAdjacencyList(newPattern.id, existingId);
            detected.push(relation);
          }
        }
      }
    }

    // 更新统计
    this.updateStats();

    return {
      detected,
      updated,
      stats: this.state.stats,
    };
  }

  /**
   * 计算纠缠强度
   */
  private calculateEntanglementStrengths(
    patternA: Pattern,
    patternB: Pattern
  ): Array<{ type: EntanglementType; strength: number }> {
    const result: Array<{ type: EntanglementType; strength: number }> = [];

    // 1. 概念纠缠
    const conceptualStrength = this.calculateConceptualEntanglement(patternA, patternB);
    if (conceptualStrength > this.STRENGTH_THRESHOLD) {
      result.push({ type: 'conceptual', strength: conceptualStrength });
    }

    // 2. 时间纠缠
    const temporalStrength = this.calculateTemporalEntanglement(patternA, patternB);
    if (temporalStrength > this.STRENGTH_THRESHOLD) {
      result.push({ type: 'temporal', strength: temporalStrength });
    }

    // 3. 情感纠缠
    const emotionalStrength = this.calculateEmotionalEntanglement(patternA, patternB);
    if (emotionalStrength > this.STRENGTH_THRESHOLD) {
      result.push({ type: 'emotional', strength: emotionalStrength });
    }

    // 4. 结构纠缠
    const structuralStrength = this.calculateStructuralEntanglement(patternA, patternB);
    if (structuralStrength > this.STRENGTH_THRESHOLD) {
      result.push({ type: 'structural', strength: structuralStrength });
    }

    return result;
  }

  /**
   * 计算概念纠缠强度
   */
  private calculateConceptualEntanglement(
    patternA: Pattern,
    patternB: Pattern
  ): number {
    const conceptsA = new Set(patternA.topology.conceptPath);
    const conceptsB = new Set(patternB.topology.conceptPath);

    // Jaccard 相似度
    const intersection = new Set([...conceptsA].filter(x => conceptsB.has(x)));
    const union = new Set([...conceptsA, ...conceptsB]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * 计算时间纠缠强度
   * 
   * 时间相近的模式可能相关
   */
  private calculateTemporalEntanglement(
    patternA: Pattern,
    patternB: Pattern
  ): number {
    const timeDiff = Math.abs(patternA.createdAt - patternB.createdAt);
    
    // 时间越近，纠缠越强
    // 1小时内：0.8+
    // 1天内：0.5+
    // 1周内：0.2+
    // 超过1周：衰减到0
    
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;
    const week = 7 * day;

    if (timeDiff < hour) return 0.8;
    if (timeDiff < day) return 0.5;
    if (timeDiff < week) return 0.2;
    return 0;
  }

  /**
   * 计算情感纠缠强度
   */
  private calculateEmotionalEntanglement(
    patternA: Pattern,
    patternB: Pattern
  ): number {
    // 简化实现：基于情感流的相似度
    const flowA = patternA.relations.emotionalFlow;
    const flowB = patternB.relations.emotionalFlow;

    if (flowA.length === 0 || flowB.length === 0) return 0;

    // 计算情感流的交集
    const emotionsA = new Set(flowA);
    const emotionsB = new Set(flowB);
    const intersection = new Set([...emotionsA].filter(x => emotionsB.has(x)));

    return intersection.size / Math.max(emotionsA.size, emotionsB.size);
  }

  /**
   * 计算结构纠缠强度
   */
  private calculateStructuralEntanglement(
    patternA: Pattern,
    patternB: Pattern
  ): number {
    // 基于拓扑结构的相似度
    const topologyA = patternA.topology;
    const topologyB = patternB.topology;

    // 节点数相似度
    const nodeSimilarity = 1 - Math.abs(topologyA.nodeCount - topologyB.nodeCount) / 
      Math.max(topologyA.nodeCount, topologyB.nodeCount, 1);

    // 连接强度相似度
    const connectionSimilarity = 1 - Math.abs(topologyA.connectionStrength - topologyB.connectionStrength);

    // 综合结构相似度
    return (nodeSimilarity + connectionSimilarity) / 2;
  }

  /**
   * 激活纠缠
   * 
   * 当一个模式被激活时，触发相关纠缠
   */
  activateEntanglement(patternId: PatternId): EntanglementActivationResult {
    const activated: EntanglementRelation[] = [];
    const relatedPatterns: PatternId[] = [];

    // 找到与该模式相关的所有纠缠
    const neighbors = this.state.adjacencyList.get(patternId);
    if (!neighbors) {
      return { activated, relatedPatterns, resonanceStrength: 0 };
    }

    let totalResonance = 0;

    for (const neighborId of neighbors) {
      // 找到这对模式的所有纠缠
      for (const [key, relation] of this.state.relations) {
        if (
          (relation.sourceId === patternId && relation.targetId === neighborId) ||
          (relation.sourceId === neighborId && relation.targetId === patternId)
        ) {
          // 激活纠缠
          relation.activationCount++;
          relation.lastActivatedAt = Date.now();
          
          activated.push(relation);
          relatedPatterns.push(neighborId);
          
          // 计算共振强度
          totalResonance += relation.strength;
        }
      }
    }

    const resonanceStrength = relatedPatterns.length > 0 
      ? totalResonance / relatedPatterns.length 
      : 0;

    return { activated, relatedPatterns, resonanceStrength };
  }

  /**
   * 应用自然衰减
   * 
   * 纠缠强度会随时间自然衰减
   */
  applyDecay(): void {
    const now = Date.now();
    const hour = 60 * 60 * 1000;

    for (const [key, relation] of this.state.relations) {
      const ageInHours = (now - relation.createdAt) / hour;
      relation.strength *= Math.exp(-this.DECAY_RATE * ageInHours);

      // 移除弱纠缠
      if (relation.strength < this.STRENGTH_THRESHOLD) {
        this.state.relations.delete(key);
        this.removeFromAdjacencyList(relation.sourceId, relation.targetId);
      }
    }

    this.updateStats();
  }

  /**
   * 获取纠缠对振幅的影响
   * 
   * 返回纠缠模式导致的振幅修正
   */
  getEntanglementAmplitude(patternId: PatternId): Complex {
    const result = this.activateEntanglement(patternId);
    
    if (result.resonanceStrength === 0) {
      return { real: 0, imag: 0 };
    }

    // 纠缠会产生相位偏移
    const phaseShift = result.resonanceStrength * Math.PI / 4;
    
    return {
      real: result.resonanceStrength * Math.cos(phaseShift),
      imag: result.resonanceStrength * Math.sin(phaseShift),
    };
  }

  /**
   * 获取纠缠关系键
   */
  private getRelationKey(idA: PatternId, idB: PatternId, type: EntanglementType): string {
    // 确保键的一致性（字典序）
    const [min, max] = idA < idB ? [idA, idB] : [idB, idA];
    return `${min}:${max}:${type}`;
  }

  /**
   * 添加到邻接表
   */
  private addToAdjacencyList(idA: PatternId, idB: PatternId): void {
    if (!this.state.adjacencyList.has(idA)) {
      this.state.adjacencyList.set(idA, new Set());
    }
    if (!this.state.adjacencyList.has(idB)) {
      this.state.adjacencyList.set(idB, new Set());
    }

    this.state.adjacencyList.get(idA)!.add(idB);
    this.state.adjacencyList.get(idB)!.add(idA);
  }

  /**
   * 从邻接表移除
   */
  private removeFromAdjacencyList(idA: PatternId, idB: PatternId): void {
    this.state.adjacencyList.get(idA)?.delete(idB);
    this.state.adjacencyList.get(idB)?.delete(idA);
  }

  /**
   * 更新统计
   */
  private updateStats(): void {
    const relations = Array.from(this.state.relations.values());
    
    this.state.stats.totalRelations = relations.length;
    
    if (relations.length > 0) {
      this.state.stats.averageStrength = 
        relations.reduce((sum, r) => sum + r.strength, 0) / relations.length;
    } else {
      this.state.stats.averageStrength = 0;
    }

    // 类型分布
    const distribution: Record<EntanglementType, number> = {
      conceptual: 0,
      temporal: 0,
      emotional: 0,
      structural: 0,
    };

    for (const relation of relations) {
      distribution[relation.type]++;
    }

    this.state.stats.typeDistribution = distribution;
  }

  /**
   * 获取网络状态
   */
  getState(): EntanglementNetworkState {
    return this.state;
  }

  /**
   * 导出状态（用于持久化）
   */
  exportState(): {
    relations: Array<[string, EntanglementRelation]>;
    stats: EntanglementNetworkState['stats'];
  } {
    return {
      relations: Array.from(this.state.relations.entries()),
      stats: this.state.stats,
    };
  }
}

/**
 * 创建纠缠网络实例
 */
export function createEntanglementNetwork(): EntanglementNetwork {
  return new EntanglementNetwork();
}
