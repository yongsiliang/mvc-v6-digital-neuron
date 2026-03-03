/**
 * ═══════════════════════════════════════════════════════════════════════
 * 关联建立引擎 - AssociationEngine
 * 
 * 融合 hebbian-network 和 knowledge-graph 的能力
 * 
 * 关联类型：
 * - semantic: 语义相似（向量距离）
 * - temporal: 时间相近（先后发生）
 * - causal: 因果相关（逻辑推理）
 * - emotional: 情感相似（相同情绪）
 * - trigger: 触发器关联（自动形成）
 * 
 * 设计理念：
 * 新记忆存入时，自动与已有记忆建立多种类型的关联。
 * 共同激活的记忆，连接权重增强（Hebbian学习）。
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  MemoryNode,
  MemoryAssociation,
  AssociationType,
  EmotionalMarker,
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 关联建立选项 */
export interface AssociationOptions {
  /** 语义相似阈值 */
  semanticThreshold: number;
  
  /** 时间窗口（毫秒） */
  temporalWindow: number;
  
  /** 最大关联数 */
  maxAssociations: number;
  
  /** 是否启用因果推理 */
  enableCausalInference: boolean;
  
  /** 是否启用情感关联 */
  enableEmotionalAssociation: boolean;
  
  /** 情感相似阈值 */
  emotionalThreshold: number;
}

/** 默认选项 */
export const DEFAULT_ASSOCIATION_OPTIONS: AssociationOptions = {
  semanticThreshold: 0.6,
  temporalWindow: 10 * 60 * 1000, // 10分钟
  maxAssociations: 50,
  enableCausalInference: true,
  enableEmotionalAssociation: true,
  emotionalThreshold: 0.5,
};

/** 相似记忆 */
export interface SimilarMemory {
  node: MemoryNode;
  similarity: number;
}

/** 关联建立结果 */
export interface AssociationResult {
  /** 新建立的关联 */
  associations: MemoryAssociation[];
  
  /** 各类型关联数量 */
  byType: Record<AssociationType, number>;
  
  /** 双向关联数 */
  bidirectionalCount: number;
}

// ─────────────────────────────────────────────────────────────────────
// 关联建立引擎类
// ─────────────────────────────────────────────────────────────────────

export class AssociationEngine {
  private options: AssociationOptions;
  
  // 外部依赖
  private getNode: (id: string) => MemoryNode | undefined;
  private findSimilarByEmbedding: (embedding: number[], threshold: number, limit: number) => SimilarMemory[];
  private getRecentMemories: (windowMs: number) => MemoryNode[];
  
  constructor(
    dependencies: {
      getNode: (id: string) => MemoryNode | undefined;
      findSimilarByEmbedding: (embedding: number[], threshold: number, limit: number) => SimilarMemory[];
      getRecentMemories: (windowMs: number) => MemoryNode[];
    },
    options: Partial<AssociationOptions> = {}
  ) {
    this.getNode = dependencies.getNode;
    this.findSimilarByEmbedding = dependencies.findSimilarByEmbedding;
    this.getRecentMemories = dependencies.getRecentMemories;
    this.options = { ...DEFAULT_ASSOCIATION_OPTIONS, ...options };
  }

  // ───────────────────────────────────────────────────────────────────
  // 核心方法：建立关联
  // ───────────────────────────────────────────────────────────────────

  /**
   * 为新记忆建立关联
   */
  async establishAssociations(
    node: MemoryNode,
    context?: {
      recentMemoryIds?: string[];
      causalRelations?: Array<{ targetId: string; confidence: number }>;
    }
  ): Promise<AssociationResult> {
    const associations: MemoryAssociation[] = [];
    const byType: Record<AssociationType, number> = {
      semantic: 0,
      temporal: 0,
      causal: 0,
      emotional: 0,
      trigger: 0,
    };
    let bidirectionalCount = 0;
    
    // 1. 语义关联
    if (node.embedding) {
      const semanticAssocs = this.establishSemanticAssociations(node);
      for (const assoc of semanticAssocs) {
        associations.push(assoc);
        byType.semantic++;
        
        // 检查是否双向
        const targetNode = this.getNode(assoc.targetId);
        if (targetNode?.associations.some(a => a.targetId === node.id)) {
          bidirectionalCount++;
        }
      }
    }
    
    // 2. 时间关联
    const temporalAssocs = this.establishTemporalAssociations(node);
    for (const assoc of temporalAssocs) {
      associations.push(assoc);
      byType.temporal++;
    }
    
    // 3. 因果关联
    if (this.options.enableCausalInference && context?.causalRelations) {
      const causalAssocs = this.establishCausalAssociations(node, context.causalRelations);
      for (const assoc of causalAssocs) {
        associations.push(assoc);
        byType.causal++;
      }
    }
    
    // 4. 情感关联
    if (this.options.enableEmotionalAssociation && node.emotionalBoost > 0.3) {
      const emotionalAssocs = this.establishEmotionalAssociations(node);
      for (const assoc of emotionalAssocs) {
        associations.push(assoc);
        byType.emotional++;
      }
    }
    
    // 限制关联数量
    const limitedAssociations = this.limitAssociations(associations);
    
    // 更新节点的关联
    node.associations = limitedAssociations;
    node.outDegree = limitedAssociations.length;
    
    // 更新目标节点的入度
    for (const assoc of limitedAssociations) {
      const targetNode = this.getNode(assoc.targetId);
      if (targetNode) {
        targetNode.inDegree = (targetNode.inDegree || 0) + 1;
      }
    }
    
    return {
      associations: limitedAssociations,
      byType,
      bidirectionalCount,
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 各类型关联建立
  // ───────────────────────────────────────────────────────────────────

  /**
   * 建立语义关联
   */
  private establishSemanticAssociations(node: MemoryNode): MemoryAssociation[] {
    if (!node.embedding) return [];
    
    const associations: MemoryAssociation[] = [];
    const similarMemories = this.findSimilarByEmbedding(
      node.embedding,
      this.options.semanticThreshold,
      15
    );
    
    for (const { node: targetNode, similarity } of similarMemories) {
      if (targetNode.id === node.id) continue;
      
      associations.push({
        targetId: targetNode.id,
        type: 'semantic',
        weight: similarity,
        formedAt: Date.now(),
        coActivationCount: 0,
      });
    }
    
    return associations;
  }

  /**
   * 建立时间关联
   */
  private establishTemporalAssociations(node: MemoryNode): MemoryAssociation[] {
    const associations: MemoryAssociation[] = [];
    const recentMemories = this.getRecentMemories(this.options.temporalWindow);
    
    // 时间衰减函数：越近的记忆，权重越高
    const now = Date.now();
    
    for (const recentNode of recentMemories) {
      if (recentNode.id === node.id) continue;
      
      const timeDiff = now - recentNode.createdAt;
      const normalizedDiff = timeDiff / this.options.temporalWindow;
      const weight = 0.3 * (1 - normalizedDiff); // 时间越近，权重越高
      
      if (weight > 0.1) {
        associations.push({
          targetId: recentNode.id,
          type: 'temporal',
          weight,
          formedAt: Date.now(),
          coActivationCount: 0,
        });
      }
    }
    
    return associations;
  }

  /**
   * 建立因果关联
   */
  private establishCausalAssociations(
    node: MemoryNode,
    causalRelations: Array<{ targetId: string; confidence: number }>
  ): MemoryAssociation[] {
    const associations: MemoryAssociation[] = [];
    
    for (const { targetId, confidence } of causalRelations) {
      if (targetId === node.id) continue;
      
      associations.push({
        targetId,
        type: 'causal',
        weight: confidence,
        formedAt: Date.now(),
        coActivationCount: 0,
      });
    }
    
    return associations;
  }

  /**
   * 建立情感关联
   */
  private establishEmotionalAssociations(node: MemoryNode): MemoryAssociation[] {
    const associations: MemoryAssociation[] = [];
    
    // 这里需要遍历所有记忆，找到情感相似的
    // 由于性能原因，应该在索引中查找
    // 这里简化处理，假设有 findSimilarByEmotion 方法
    
    // 简化版：通过最近记忆查找
    const recentMemories = this.getRecentMemories(this.options.temporalWindow * 10);
    
    for (const candidate of recentMemories) {
      if (candidate.id === node.id) continue;
      if (candidate.emotionalBoost < 0.3) continue;
      
      const emotionSimilarity = this.calculateEmotionSimilarity(
        node.emotionalMarker,
        candidate.emotionalMarker
      );
      
      if (emotionSimilarity > this.options.emotionalThreshold) {
        associations.push({
          targetId: candidate.id,
          type: 'emotional',
          weight: emotionSimilarity * 0.5,
          formedAt: Date.now(),
          coActivationCount: 0,
        });
      }
    }
    
    return associations.slice(0, 5); // 限制情感关联数量
  }

  // ───────────────────────────────────────────────────────────────────
  // Hebbian学习
  // ───────────────────────────────────────────────────────────────────

  /**
   * 增强共同激活的记忆连接
   * Hebbian学习：一起激活的神经元，连接增强
   */
  strengthenCoactivatedConnections(
    activatedIds: string[],
    increment: number = 0.05
  ): {
    strengthened: number;
    created: number;
  } {
    let strengthened = 0;
    let created = 0;
    
    // 所有同时激活的记忆，两两之间增强连接
    for (let i = 0; i < activatedIds.length; i++) {
      for (let j = i + 1; j < activatedIds.length; j++) {
        const nodeA = this.getNode(activatedIds[i]);
        const nodeB = this.getNode(activatedIds[j]);
        
        if (!nodeA || !nodeB) continue;
        
        // 查找 A -> B 的连接
        let assocAtoB = nodeA.associations.find(a => a.targetId === nodeB.id);
        
        if (assocAtoB) {
          // 增强现有连接
          assocAtoB.weight = Math.min(1, assocAtoB.weight + increment);
          assocAtoB.coActivationCount++;
          assocAtoB.lastCoActivated = Date.now();
          strengthened++;
        } else {
          // 创建新的联想连接
          nodeA.associations.push({
            targetId: nodeB.id,
            type: 'trigger',
            weight: 0.1,
            formedAt: Date.now(),
            coActivationCount: 1,
            lastCoActivated: Date.now(),
          });
          nodeA.outDegree++;
          created++;
        }
        
        // 查找 B -> A 的连接
        let assocBtoA = nodeB.associations.find(a => a.targetId === nodeA.id);
        
        if (assocBtoA) {
          assocBtoA.weight = Math.min(1, assocBtoA.weight + increment);
          assocBtoA.coActivationCount++;
          assocBtoA.lastCoActivated = Date.now();
        } else {
          nodeB.associations.push({
            targetId: nodeA.id,
            type: 'trigger',
            weight: 0.1,
            formedAt: Date.now(),
            coActivationCount: 1,
            lastCoActivated: Date.now(),
          });
          nodeB.outDegree++;
        }
      }
    }
    
    return { strengthened, created };
  }

  /**
   * 衰减长期未激活的连接
   */
  decayInactiveConnections(
    node: MemoryNode,
    decayFactor: number = 0.95,
    minWeight: number = 0.1
  ): number {
    let decayed = 0;
    const now = Date.now();
    const decayThreshold = 30 * 24 * 60 * 60 * 1000; // 30天
    
    node.associations = node.associations.filter(assoc => {
      // 如果长期未共同激活，衰减权重
      if (assoc.lastCoActivated && (now - assoc.lastCoActivated) > decayThreshold) {
        assoc.weight *= decayFactor;
        decayed++;
        
        // 权重太低的连接移除
        if (assoc.weight < minWeight) {
          return false;
        }
      }
      return true;
    });
    
    node.outDegree = node.associations.length;
    return decayed;
  }

  // ───────────────────────────────────────────────────────────────────
  // 辅助方法
  // ───────────────────────────────────────────────────────────────────

  /**
   * 限制关联数量
   */
  private limitAssociations(associations: MemoryAssociation[]): MemoryAssociation[] {
    if (associations.length <= this.options.maxAssociations) {
      return associations;
    }
    
    // 按权重排序，保留权重最高的
    return associations
      .sort((a, b) => b.weight - a.weight)
      .slice(0, this.options.maxAssociations);
  }

  /**
   * 计算情感相似度
   */
  private calculateEmotionSimilarity(
    marker1: EmotionalMarker,
    marker2: EmotionalMarker
  ): number {
    // 计算三个维度的差异
    const valenceDiff = Math.abs(marker1.valence - marker2.valence);
    const arousalDiff = Math.abs(marker1.arousal - marker2.arousal);
    const dominanceDiff = Math.abs(marker1.dominance - marker2.dominance);
    
    // 归一化差异 (0-1)
    const avgDiff = (valenceDiff + arousalDiff + dominanceDiff) / 3;
    
    // 转换为相似度 (1 - diff)
    return 1 - avgDiff;
  }

  /**
   * 计算两个记忆的综合关联强度
   */
  calculateAssociationStrength(nodeA: MemoryNode, nodeB: MemoryNode): number {
    // 查找 A -> B 的连接
    const assocAToB = nodeA.associations.find(a => a.targetId === nodeB.id);
    // 查找 B -> A 的连接
    const assocBToA = nodeB.associations.find(a => a.targetId === nodeA.id);
    
    // 如果有双向连接，取平均
    if (assocAToB && assocBToA) {
      return (assocAToB.weight + assocBToA.weight) / 2;
    }
    
    // 如果只有单向连接，返回该权重
    if (assocAToB) return assocAToB.weight;
    if (assocBToA) return assocBToA.weight;
    
    // 没有连接
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createAssociationEngine(
  dependencies: {
    getNode: (id: string) => MemoryNode | undefined;
    findSimilarByEmbedding: (embedding: number[], threshold: number, limit: number) => SimilarMemory[];
    getRecentMemories: (windowMs: number) => MemoryNode[];
  },
  options: Partial<AssociationOptions> = {}
): AssociationEngine {
  return new AssociationEngine(dependencies, options);
}
