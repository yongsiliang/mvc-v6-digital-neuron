/**
 * ═══════════════════════════════════════════════════════════════════════
 * 记忆关联系统 (Memory Association System)
 * 
 * 核心概念：
 * - 记忆不是孤立的，而是相互关联的
 * - 关联可以增强检索效果
 * - 关联强度会随时间和使用而变化
 * 
 * 灵感来源：
 * - 联想记忆理论
 * - 海马体的模式完成功能
 * - Hebbian 学习规则：一起激发的神经元会连接在一起
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 关联类型 */
export type AssociationType = 
  | 'same_topic'      // 同一主题
  | 'same_person'     // 同一人物
  | 'same_time'       // 同一时间
  | 'same_place'      // 同一地点
  | 'causal'          // 因果关系
  | 'contrast'        // 对比关系
  | 'similarity'      // 相似关系
  | 'temporal'        // 时间顺序
  | 'hierarchical';   // 层次关系

/** 记忆关联 */
export interface MemoryAssociation {
  id: string;
  
  /** 源记忆ID */
  sourceId: string;
  
  /** 目标记忆ID */
  targetId: string;
  
  /** 关联类型 */
  type: AssociationType;
  
  /** 关联强度 (0-1) */
  strength: number;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后激活时间 */
  lastActivatedAt: number;
  
  /** 激活次数 */
  activationCount: number;
  
  /** 关联描述 */
  description?: string;
  
  /** 共同标签 */
  commonTags: string[];
}

/** 关联配置 */
export interface AssociationConfig {
  /** 最小关联强度 */
  minStrength: number;
  
  /** 最大关联数（每个记忆） */
  maxAssociations: number;
  
  /** 共同标签阈值（超过此数量的共同标签建立关联） */
  commonTagThreshold: number;
  
  /** 是否自动建立关联 */
  autoAssociate: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: AssociationConfig = {
  minStrength: 0.1,
  maxAssociations: 20,
  commonTagThreshold: 2,
  autoAssociate: true,
};

// ─────────────────────────────────────────────────────────────────────
// 记忆关联管理器
// ─────────────────────────────────────────────────────────────────────

/**
 * 记忆关联管理器
 */
export class MemoryAssociationSystem {
  private associations: Map<string, MemoryAssociation> = new Map();
  
  /** 源记忆索引 */
  private sourceIndex: Map<string, Set<string>> = new Map();
  
  /** 目标记忆索引 */
  private targetIndex: Map<string, Set<string>> = new Map();
  
  private config: AssociationConfig;
  
  constructor(config: Partial<AssociationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心操作
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 创建关联
   */
  createAssociation(
    sourceId: string,
    targetId: string,
    type: AssociationType,
    options: {
      strength?: number;
      description?: string;
      commonTags?: string[];
    } = {}
  ): MemoryAssociation | null {
    // 不允许自关联
    if (sourceId === targetId) {
      return null;
    }
    
    // 检查是否已存在
    const existing = this.findAssociation(sourceId, targetId);
    if (existing) {
      // 增强现有关联
      this.strengthenAssociation(existing.id, 0.1);
      return existing;
    }
    
    // 检查关联数量限制
    const sourceAssociations = this.sourceIndex.get(sourceId);
    if (sourceAssociations && sourceAssociations.size >= this.config.maxAssociations) {
      // 移除最弱的关联
      this.removeWeakestAssociation(sourceId);
    }
    
    const association: MemoryAssociation = {
      id: uuidv4(),
      sourceId,
      targetId,
      type,
      strength: options.strength ?? this.calculateDefaultStrength(type),
      createdAt: Date.now(),
      lastActivatedAt: Date.now(),
      activationCount: 0,
      description: options.description,
      commonTags: options.commonTags ?? [],
    };
    
    this.associations.set(association.id, association);
    this.indexAssociation(association);
    
    console.log(`[记忆关联] 创建关联: ${sourceId.slice(0, 8)} -> ${targetId.slice(0, 8)} (${type})`);
    
    return association;
  }
  
  /**
   * 自动建立关联
   */
  autoAssociate(
    memoryId: string,
    memoryTags: string[],
    existingMemories: Array<{ id: string; tags: string[]; content: string }>
  ): MemoryAssociation[] {
    if (!this.config.autoAssociate) {
      return [];
    }
    
    const newAssociations: MemoryAssociation[] = [];
    
    for (const existing of existingMemories) {
      if (existing.id === memoryId) continue;
      
      // 1. 计算共同标签
      const commonTags = memoryTags.filter(t => existing.tags.includes(t));
      
      // 2. 根据共同标签创建关联
      if (commonTags.length >= this.config.commonTagThreshold) {
        const type = this.determineAssociationType(commonTags);
        const association = this.createAssociation(memoryId, existing.id, type, {
          commonTags,
          strength: 0.3 + commonTags.length * 0.1,
        });
        if (association) {
          newAssociations.push(association);
        }
      }
    }
    
    return newAssociations;
  }
  
  /**
   * 获取相关记忆
   */
  getRelatedMemories(
    memoryId: string,
    options: {
      maxDepth?: number;
      minStrength?: number;
      types?: AssociationType[];
    } = {}
  ): Array<{ memoryId: string; association: MemoryAssociation; distance: number }> {
    const maxDepth = options.maxDepth ?? 2;
    const minStrength = options.minStrength ?? this.config.minStrength;
    
    const results: Array<{ memoryId: string; association: MemoryAssociation; distance: number }> = [];
    const visited = new Set<string>([memoryId]);
    const queue: Array<{ id: string; distance: number }> = [{ id: memoryId, distance: 0 }];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.distance >= maxDepth) {
        continue;
      }
      
      // 获取出边关联
      const outgoingIds = this.sourceIndex.get(current.id) || new Set();
      for (const assocId of outgoingIds) {
        const association = this.associations.get(assocId);
        if (!association) continue;
        
        // 过滤条件
        if (association.strength < minStrength) continue;
        if (options.types && !options.types.includes(association.type)) continue;
        
        if (!visited.has(association.targetId)) {
          visited.add(association.targetId);
          results.push({
            memoryId: association.targetId,
            association,
            distance: current.distance + 1,
          });
          
          queue.push({
            id: association.targetId,
            distance: current.distance + 1,
          });
        }
      }
      
      // 获取入边关联
      const incomingIds = this.targetIndex.get(current.id) || new Set();
      for (const assocId of incomingIds) {
        const association = this.associations.get(assocId);
        if (!association) continue;
        
        if (association.strength < minStrength) continue;
        if (options.types && !options.types.includes(association.type)) continue;
        
        if (!visited.has(association.sourceId)) {
          visited.add(association.sourceId);
          results.push({
            memoryId: association.sourceId,
            association,
            distance: current.distance + 1,
          });
          
          queue.push({
            id: association.sourceId,
            distance: current.distance + 1,
          });
        }
      }
    }
    
    // 按关联强度和距离排序
    results.sort((a, b) => {
      const strengthDiff = b.association.strength - a.association.strength;
      if (strengthDiff !== 0) return strengthDiff;
      return a.distance - b.distance;
    });
    
    return results;
  }
  
  /**
   * 激活关联（触发联想）
   */
  activateAssociation(associationId: string): void {
    const association = this.associations.get(associationId);
    if (!association) return;
    
    association.activationCount++;
    association.lastActivatedAt = Date.now();
    
    // 激活增强关联强度
    this.strengthenAssociation(associationId, 0.05);
  }
  
  /**
   * 增强关联
   */
  strengthenAssociation(associationId: string, delta: number): void {
    const association = this.associations.get(associationId);
    if (!association) return;
    
    association.strength = Math.min(1.0, association.strength + delta);
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    totalAssociations: number;
    avgStrength: number;
    typeDistribution: Record<AssociationType, number>;
    mostConnectedMemories: Array<{ memoryId: string; connectionCount: number }>;
  } {
    const associations = Array.from(this.associations.values());
    
    // 类型分布
    const typeDistribution: Record<AssociationType, number> = {
      same_topic: 0,
      same_person: 0,
      same_time: 0,
      same_place: 0,
      causal: 0,
      contrast: 0,
      similarity: 0,
      temporal: 0,
      hierarchical: 0,
    };
    
    for (const assoc of associations) {
      typeDistribution[assoc.type]++;
    }
    
    // 连接数最多的记忆
    const connectionCounts = new Map<string, number>();
    for (const assoc of associations) {
      connectionCounts.set(assoc.sourceId, (connectionCounts.get(assoc.sourceId) ?? 0) + 1);
      connectionCounts.set(assoc.targetId, (connectionCounts.get(assoc.targetId) ?? 0) + 1);
    }
    
    const mostConnected = Array.from(connectionCounts.entries())
      .map(([memoryId, count]) => ({ memoryId, connectionCount: count }))
      .sort((a, b) => b.connectionCount - a.connectionCount)
      .slice(0, 5);
    
    return {
      totalAssociations: associations.length,
      avgStrength: associations.length > 0
        ? associations.reduce((sum, a) => sum + a.strength, 0) / associations.length
        : 0,
      typeDistribution,
      mostConnectedMemories: mostConnected,
    };
  }
  
  /**
   * 导出状态
   */
  exportState(): MemoryAssociation[] {
    return Array.from(this.associations.values());
  }
  
  /**
   * 导入状态
   */
  importState(associations: MemoryAssociation[]): void {
    this.associations.clear();
    this.sourceIndex.clear();
    this.targetIndex.clear();
    
    for (const assoc of associations) {
      this.associations.set(assoc.id, assoc);
      this.indexAssociation(assoc);
    }
    
    console.log(`[记忆关联] 已恢复 ${associations.length} 个关联`);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 内部方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 索引关联
   */
  private indexAssociation(association: MemoryAssociation): void {
    // 源索引
    if (!this.sourceIndex.has(association.sourceId)) {
      this.sourceIndex.set(association.sourceId, new Set());
    }
    this.sourceIndex.get(association.sourceId)!.add(association.id);
    
    // 目标索引
    if (!this.targetIndex.has(association.targetId)) {
      this.targetIndex.set(association.targetId, new Set());
    }
    this.targetIndex.get(association.targetId)!.add(association.id);
  }
  
  /**
   * 查找关联
   */
  private findAssociation(sourceId: string, targetId: string): MemoryAssociation | null {
    const assocIds = this.sourceIndex.get(sourceId);
    if (!assocIds) return null;
    
    for (const id of assocIds) {
      const assoc = this.associations.get(id);
      if (assoc && assoc.targetId === targetId) {
        return assoc;
      }
    }
    
    return null;
  }
  
  /**
   * 移除最弱的关联
   */
  private removeWeakestAssociation(sourceId: string): void {
    const assocIds = this.sourceIndex.get(sourceId);
    if (!assocIds || assocIds.size === 0) return;
    
    let weakest: MemoryAssociation | null = null;
    for (const id of assocIds) {
      const assoc = this.associations.get(id);
      if (!weakest || (assoc && assoc.strength < weakest.strength)) {
        weakest = assoc ?? null;
      }
    }
    
    if (weakest) {
      this.associations.delete(weakest.id);
      this.sourceIndex.get(weakest.sourceId)?.delete(weakest.id);
      this.targetIndex.get(weakest.targetId)?.delete(weakest.id);
    }
  }
  
  /**
   * 计算默认关联强度
   */
  private calculateDefaultStrength(type: AssociationType): number {
    switch (type) {
      case 'causal':
        return 0.8; // 因果关系最强
      case 'same_person':
      case 'same_topic':
        return 0.7;
      case 'temporal':
      case 'similarity':
        return 0.6;
      case 'contrast':
        return 0.5;
      case 'hierarchical':
        return 0.4;
      default:
        return 0.5;
    }
  }
  
  /**
   * 确定关联类型
   */
  private determineAssociationType(commonTags: string[]): AssociationType {
    if (commonTags.some(t => ['人物', '人名', '名字'].includes(t))) {
      return 'same_person';
    }
    if (commonTags.some(t => ['事件', '时间', '日期'].includes(t))) {
      return 'same_time';
    }
    if (commonTags.some(t => ['地点', '位置', '场所'].includes(t))) {
      return 'same_place';
    }
    if (commonTags.some(t => ['偏好', '喜好', '兴趣'].includes(t))) {
      return 'similarity';
    }
    return 'same_topic';
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createMemoryAssociationSystem(config?: Partial<AssociationConfig>): MemoryAssociationSystem {
  return new MemoryAssociationSystem(config);
}
