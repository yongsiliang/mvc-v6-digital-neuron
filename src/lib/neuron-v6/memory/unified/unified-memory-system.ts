/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一记忆系统 - UnifiedMemorySystem
 * 
 * Moss级别记忆系统的核心实现
 * 
 * 六大核心能力：
 * 1. 持久化 (Persist)     - 记忆不会丢失
 * 2. 可检索 (Retrievable) - 多路混合检索
 * 3. 可激活 (Activatable) - 触发器驱动的主动"忆"
 * 4. 可关联 (Associative) - 知识图谱关联
 * 5. 可演化 (Evolvable)   - Hebbian学习
 * 6. 可结晶 (Crystallizable) - 形成自我
 * 
 * 架构：
 * ┌─────────────────────────────────────────────────────────┐
 * │                   UnifiedMemorySystem                    │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
 * │  │TriggerSystem│  │SpreadingAct│  │Association │      │
 * │  │ (触发器)    │  │ivation(扩散)│  │Engine(关联)│      │
 * │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘      │
 * │         │                │                │             │
 * │         └────────────────┼────────────────┘             │
 * │                          ▼                              │
 * │  ┌───────────────────────────────────────────────────┐  │
 * │  │              MemoryNode Store                      │  │
 * │  │  (记忆节点存储 - Map + 向量索引 + 多级索引)         │  │
 * │  └───────────────────────────────────────────────────┘  │
 * │                          │                              │
 * │         ┌────────────────┼────────────────┐             │
 * │         ▼                ▼                ▼             │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
 * │  │艾宾浩斯遗忘│  │情感标记系统│  │知识图谱    │      │
 * │  │曲线        │  │            │  │            │      │
 * │  └─────────────┘  └─────────────┘  └─────────────┘      │
 * └─────────────────────────────────────────────────────────┘
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  MemoryNode,
  MemoryType,
  MemoryCategory,
  EmotionalMarker,
  Trigger,
  MemoryAssociation,
  ActivationConfig,
} from './types';

import { TriggerSystem, createTriggerSystem } from './trigger-system';
import { 
  SpreadingActivationEngine, 
  createSpreadingActivationEngine,
  SpreadingResult,
} from './spreading-activation';
import { 
  AssociationEngine, 
  createAssociationEngine,
  AssociationResult,
} from './association-engine';
import { 
  CrystallizationEngine, 
  createCrystallizationEngine,
  SelfCore,
  CrystallizationCandidate,
} from './crystallization-engine';
import {
  UnifiedMemoryPersistence,
  createUnifiedMemoryPersistence,
  PersistenceConfig,
} from './persistence';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 系统配置 */
export interface UnifiedMemoryConfig {
  /** 向量维度 */
  embeddingDimension: number;
  
  /** 是否启用触发器系统 */
  enableTriggers: boolean;
  
  /** 是否启用扩散激活 */
  enableSpreadingActivation: boolean;
  
  /** 是否启用Hebbian学习 */
  enableHebbianLearning: boolean;
  
  /** 是否启用结晶化 */
  enableCrystallization: boolean;
  
  /** 激活配置 */
  activationConfig: Partial<ActivationConfig>;
  
  /** 持久化配置 */
  persistence?: Partial<PersistenceConfig>;
}

/** 默认配置 */
export const DEFAULT_UNIFIED_MEMORY_CONFIG: UnifiedMemoryConfig = {
  embeddingDimension: 1536,
  enableTriggers: true,
  enableSpreadingActivation: true,
  enableHebbianLearning: true,
  enableCrystallization: true,
  activationConfig: {},
};

/** 记忆存入选项 */
export interface StoreMemoryOptions {
  /** 记忆类型 */
  type: MemoryType;
  
  /** 类别 */
  category?: MemoryCategory;
  
  /** 内容 */
  content: string;
  
  /** 向量嵌入 */
  embedding?: number[];
  
  /** 情感标记 */
  emotionalMarker?: EmotionalMarker;
  
  /** 情感加成 */
  emotionalBoost?: number;
  
  /** 重要性 */
  importance?: number;
  
  /** 标签 */
  tags?: string[];
  
  /** 元数据 */
  metadata?: Record<string, unknown>;
  
  /** 上下文ID */
  contextId?: string;
  
  /** 因果关系 */
  causalRelations?: Array<{ targetId: string; confidence: number }>;
}

/** 存入结果 */
export interface StoreMemoryResult {
  /** 创建的记忆节点 */
  node: MemoryNode;
  
  /** 生成的触发器 */
  triggers: Trigger[];
  
  /** 建立的关联 */
  associations: AssociationResult;
  
  /** 是否触发了即时回忆 */
  triggeredRecall: boolean;
  
  /** 触发的记忆 */
  triggeredMemories: MemoryNode[];
}

/** 激活结果 */
export interface ActivationResult {
  /** 激活的记忆 */
  activatedMemories: Array<{
    node: MemoryNode;
    activation: number;
    path: string[];
    source: 'retrieval' | 'trigger' | 'spreading';
  }>;
  
  /** 扩散统计 */
  spreadingStats?: SpreadingResult['stats'];
  
  /** Hebbian学习结果 */
  hebbianResult?: {
    strengthened: number;
    created: number;
  };
  
  /** 结晶化结果 */
  crystallizationResults?: Array<{
    nodeId: string;
    crystallized: boolean;
    newLevel: number;
  }>;
}

/** 检索选项 */
export interface RetrievalOptions {
  /** 查询文本 */
  query?: string;
  
  /** 查询向量 */
  queryEmbedding?: number[];
  
  /** 关键词 */
  keywords?: string[];
  
  /** 情感条件 */
  emotionalCondition?: {
    valence?: { min: number; max: number };
    arousal?: { min: number; max: number };
  };
  
  /** 类型过滤 */
  types?: MemoryType[];
  
  /** 类别过滤 */
  categories?: MemoryCategory[];
  
  /** 是否包含结晶记忆 */
  includeCrystallized?: boolean;
  
  /** 是否启用扩散激活 */
  enableSpreading?: boolean;
  
  /** 是否启用触发器检测 */
  enableTriggerDetection?: boolean;
  
  /** 返回数量限制 */
  limit?: number;
}

/** 系统状态 */
export interface SystemStatus {
  /** 总记忆数 */
  totalMemories: number;
  
  /** 结晶记忆数 */
  crystallizedCount: number;
  
  /** 平均巩固级别 */
  avgConsolidationLevel: number;
  
  /** 总关联数 */
  totalAssociations: number;
  
  /** 触发器数量 */
  triggerCount: number;
  
  /** 自我核心 */
  selfCore: SelfCore | null;
}

// ─────────────────────────────────────────────────────────────────────
// 统一记忆系统类
// ─────────────────────────────────────────────────────────────────────

export class UnifiedMemorySystem {
  // 配置
  private config: UnifiedMemoryConfig;
  
  // 核心存储
  private memoryStore: Map<string, MemoryNode> = new Map();
  
  // 向量索引（简化版，实际应该用向量数据库）
  private embeddingIndex: Map<string, number[]> = new Map();
  
  // 时间索引（最近记忆）
  private timeIndex: Array<{ id: string; timestamp: number }> = [];
  
  // 子系统
  private triggerSystem: TriggerSystem;
  private spreadingEngine: SpreadingActivationEngine;
  private associationEngine: AssociationEngine;
  private crystallizationEngine: CrystallizationEngine;
  
  // 🆕 持久化层
  private persistence: UnifiedMemoryPersistence | null = null;
  
  // 统计
  private stats = {
    totalStores: 0,
    totalActivations: 0,
    totalTriggersFired: 0,
  };

  constructor(config: Partial<UnifiedMemoryConfig> = {}) {
    this.config = { ...DEFAULT_UNIFIED_MEMORY_CONFIG, ...config };
    
    // 初始化子系统
    this.triggerSystem = createTriggerSystem();
    
    this.spreadingEngine = createSpreadingActivationEngine(
      (id) => this.memoryStore.get(id),
      this.config.activationConfig
    );
    
    this.associationEngine = createAssociationEngine({
      getNode: (id) => this.memoryStore.get(id),
      findSimilarByEmbedding: (emb, threshold, limit) => 
        this.findSimilarByEmbedding(emb, threshold, limit),
      getRecentMemories: (window) => this.getRecentMemories(window),
    });
    
    this.crystallizationEngine = createCrystallizationEngine({
      getNode: (id) => this.memoryStore.get(id),
      getAllNodes: () => Array.from(this.memoryStore.values()),
    });
    
    // 🆕 初始化持久化层
    if (this.config.persistence) {
      this.persistence = createUnifiedMemoryPersistence(
        this.memoryStore,
        this.config.persistence
      );
    }
  }
  
  /**
   * 🆕 初始化持久化（从数据库/快照恢复记忆）
   */
  async initialize(): Promise<number> {
    if (this.persistence) {
      return this.persistence.initialize();
    }
    return 0;
  }

  // ───────────────────────────────────────────────────────────────────
  // 核心能力1：持久化 (Persist)
  // ───────────────────────────────────────────────────────────────────

  /**
   * 存入新记忆
   */
  async storeMemory(options: StoreMemoryOptions): Promise<StoreMemoryResult> {
    // 1. 创建记忆节点
    const node = this.createMemoryNode(options);
    
    // 2. 生成触发器
    const triggers = this.config.enableTriggers
      ? this.triggerSystem.generateTriggers(node)
      : [];
    
    node.triggers = triggers;
    
    // 3. 建立关联
    const associations = await this.associationEngine.establishAssociations(
      node,
      { causalRelations: options.causalRelations }
    );
    
    // 4. 存储到记忆库
    this.memoryStore.set(node.id, node);
    
    // 5. 更新索引
    if (node.embedding) {
      this.embeddingIndex.set(node.id, node.embedding);
    }
    
    this.timeIndex.push({
      id: node.id,
      timestamp: node.createdAt,
    });
    
    // 清理时间索引（保留最近1000条）
    if (this.timeIndex.length > 1000) {
      this.timeIndex = this.timeIndex.slice(-1000);
    }
    
    // 6. 检查是否触发已有记忆
    let triggeredRecall = false;
    let triggeredMemories: MemoryNode[] = [];
    
    if (this.config.enableTriggers) {
      // 检查新记忆是否触发已有记忆
      const triggerResult = this.triggerSystem.detectTriggers(options.content);
      if (triggerResult.hasTriggers && triggerResult.matchedNodes.length > 0) {
        triggeredRecall = true;
        triggeredMemories = triggerResult.matchedNodes
          .slice(0, 5)
          .map(n => this.memoryStore.get(n.id))
          .filter((n): n is MemoryNode => n !== undefined);
      }
    }
    
    this.stats.totalStores++;
    
    // 🆕 7. 持久化
    if (this.persistence) {
      this.persistence.enqueue(node);
    }
    
    return {
      node,
      triggers,
      associations,
      triggeredRecall,
      triggeredMemories,
    };
  }

  /**
   * 创建记忆节点
   */
  private createMemoryNode(options: StoreMemoryOptions): MemoryNode {
    const now = Date.now();
    
    return {
      id: `mem_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type: options.type,
      category: options.category || 'custom',
      content: options.content,
      embedding: options.embedding,
      
      // 时间信息
      createdAt: now,
      lastAccessedAt: now,
      
      // 艾宾浩斯参数
      strength: 1.0,
      retentionRate: 1.0,
      reviewCount: 0,
      nextReviewTime: now + 24 * 60 * 60 * 1000, // 默认1天后复习
      forgettingCurve: [1.0],
      
      // 情感标记
      emotionalMarker: options.emotionalMarker || {
        valence: 0.5,
        arousal: 0.5,
        dominance: 0.5,
      },
      emotionalBoost: options.emotionalBoost || 0,
      
      // 关联网络
      associations: [],
      inDegree: 0,
      outDegree: 0,
      
      // 触发器
      triggers: [],
      
      // 分类标签
      tags: options.tags || [],
      
      // 激活状态
      activationCount: 0,
      lastActivationTime: 0,
      activationHistory: [],
      
      // 结晶化
      crystallized: false,
      crystallizedAt: undefined,
      consolidationLevel: 0,
      
      // 其他
      importance: options.importance || 0.5,
      metadata: options.metadata,
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 核心能力2：可检索 (Retrievable) + 核心能力3：可激活 (Activatable)
  // ───────────────────────────────────────────────────────────────────

  /**
   * 激活记忆（三路激活：检索 + 触发器 + 扩散）
   */
  async activateMemories(options: RetrievalOptions): Promise<ActivationResult> {
    const activatedMap = new Map<string, {
      node: MemoryNode;
      activation: number;
      path: string[];
      source: 'retrieval' | 'trigger' | 'spreading';
    }>();
    
    // 1. 向量检索激活
    if (options.queryEmbedding) {
      const retrieved = this.retrieveByEmbedding(
        options.queryEmbedding,
        options.limit || 10
      );
      
      for (const { node, similarity } of retrieved) {
        activatedMap.set(node.id, {
          node,
          activation: similarity,
          path: [node.id],
          source: 'retrieval',
        });
      }
    }
    
    // 2. 触发器激活（主动"忆"）
    if (this.config.enableTriggers && options.enableTriggerDetection !== false && options.query) {
      const triggerResult = this.triggerSystem.detectTriggers(options.query);
      
      if (triggerResult.hasTriggers) {
        for (const matched of triggerResult.matchedNodes) {
          const node = this.memoryStore.get(matched.id);
          if (node) {
            const existing = activatedMap.get(node.id);
            // 如果已经存在，取较高的激活值
            if (!existing || matched.score > existing.activation) {
              activatedMap.set(node.id, {
                node,
                activation: matched.score,
                path: [node.id],
                source: 'trigger',
              });
            }
          }
        }
      }
    }
    
    // 3. 扩散激活
    let spreadingStats: SpreadingResult['stats'] | undefined;
    
    if (this.config.enableSpreadingActivation && options.enableSpreading !== false) {
      const initialActivations = new Map<string, number>();
      
      for (const [id, data] of activatedMap) {
        initialActivations.set(id, data.activation);
      }
      
      const spreadingResult = this.spreadingEngine.spread(initialActivations);
      spreadingStats = spreadingResult.stats;
      
      // 将扩散激活的结果添加到激活集
      for (const [id, activation] of spreadingResult.activationMap) {
        if (!activatedMap.has(id)) {
          const node = this.memoryStore.get(id);
          if (node) {
            activatedMap.set(id, {
              node,
              activation,
              path: spreadingResult.pathMap.get(id) || [id],
              source: 'spreading',
            });
          }
        }
      }
    }
    
    // 4. 转换为数组并排序
    const activatedMemories = Array.from(activatedMap.values())
      .sort((a, b) => b.activation - a.activation)
      .slice(0, options.limit || 20);
    
    // 5. Hebbian学习
    let hebbianResult: { strengthened: number; created: number } | undefined;
    
    if (this.config.enableHebbianLearning && activatedMemories.length > 1) {
      const activatedIds = activatedMemories.map(m => m.node.id);
      hebbianResult = this.associationEngine.strengthenCoactivatedConnections(activatedIds);
    }
    
    // 6. 更新激活状态和结晶化
    const crystallizationResults: Array<{
      nodeId: string;
      crystallized: boolean;
      newLevel: number;
    }> = [];
    
    for (const { node, activation } of activatedMemories) {
      if (this.config.enableCrystallization) {
        const result = this.crystallizationEngine.consolidateOnActivation(
          node.id,
          activation
        );
        
        if (result.changed) {
          crystallizationResults.push({
            nodeId: node.id,
            crystallized: result.crystallized,
            newLevel: result.newLevel,
          });
        }
      }
      
      // 更新访问时间
      node.lastAccessedAt = Date.now();
    }
    
    this.stats.totalActivations++;
    
    return {
      activatedMemories,
      spreadingStats,
      hebbianResult,
      crystallizationResults,
    };
  }

  /**
   * 向量检索
   */
  private retrieveByEmbedding(
    queryEmbedding: number[],
    limit: number
  ): Array<{ node: MemoryNode; similarity: number }> {
    const results: Array<{ node: MemoryNode; similarity: number }> = [];
    
    for (const [id, embedding] of this.embeddingIndex) {
      const node = this.memoryStore.get(id);
      if (!node || !embedding) continue;
      
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      
      if (similarity > 0.3) {
        results.push({ node, similarity });
      }
    }
    
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * 向量相似度检索
   */
  private findSimilarByEmbedding(
    embedding: number[],
    threshold: number,
    limit: number
  ): Array<{ node: MemoryNode; similarity: number }> {
    return this.retrieveByEmbedding(embedding, limit)
      .filter(r => r.similarity >= threshold);
  }

  /**
   * 获取最近记忆
   */
  private getRecentMemories(windowMs: number): MemoryNode[] {
    const now = Date.now();
    const cutoff = now - windowMs;
    
    const recentIds = this.timeIndex
      .filter(item => item.timestamp >= cutoff)
      .map(item => item.id);
    
    return recentIds
      .map(id => this.memoryStore.get(id))
      .filter((n): n is MemoryNode => n !== undefined);
  }

  // ───────────────────────────────────────────────────────────────────
  // 核心能力4：可关联 (Associative)
  // ───────────────────────────────────────────────────────────────────

  /**
   * 手动建立关联
   */
  createAssociation(
    fromId: string,
    toId: string,
    type: MemoryAssociation['type'],
    weight: number
  ): boolean {
    const fromNode = this.memoryStore.get(fromId);
    const toNode = this.memoryStore.get(toId);
    
    if (!fromNode || !toNode) return false;
    
    // 检查是否已存在
    const existing = fromNode.associations.find(a => a.targetId === toId);
    if (existing) {
      existing.weight = weight;
      return true;
    }
    
    // 创建新关联
    fromNode.associations.push({
      targetId: toId,
      type,
      weight,
      formedAt: Date.now(),
      coActivationCount: 0,
    });
    
    fromNode.outDegree++;
    toNode.inDegree++;
    
    return true;
  }

  // ───────────────────────────────────────────────────────────────────
  // 核心能力5：可演化 (Evolvable) - 已在激活流程中实现
  // ───────────────────────────────────────────────────────────────────

  /**
   * 执行遗忘曲线更新
   */
  applyForgettingCurve(): number {
    const now = Date.now();
    let forgotten = 0;
    
    for (const node of this.memoryStore.values()) {
      // 艾宾浩斯遗忘曲线
      const lastAccessedAt = node.lastAccessedAt || node.createdAt;
      const timeSinceLastAccess = now - lastAccessedAt;
      const daysSinceAccess = timeSinceLastAccess / (24 * 60 * 60 * 1000);
      
      // 艾宾浩斯公式：R = e^(-t/S)
      // R = 保留率，t = 时间，S = 记忆强度
      const strength = node.strength || 1.0;
      const retentionRate = Math.exp(-daysSinceAccess / strength);
      
      node.retentionRate = retentionRate;
      
      // 如果保留率太低且未结晶，可能遗忘
      if (retentionRate < 0.1 && !node.crystallized) {
        // 标记为遗忘（实际应该删除或归档）
        node.metadata = { ...node.metadata, forgotten: true };
        forgotten++;
      }
    }
    
    return forgotten;
  }

  // ───────────────────────────────────────────────────────────────────
  // 核心能力6：可结晶 (Crystallizable)
  // ───────────────────────────────────────────────────────────────────

  /**
   * 获取自我核心
   */
  getSelfCore(): SelfCore {
    return this.crystallizationEngine.calculateSelfCore();
  }

  /**
   * 获取结晶候选
   */
  getCrystallizationCandidates(limit: number = 10): CrystallizationCandidate[] {
    return this.crystallizationEngine.findCrystallizationCandidates(limit);
  }

  /**
   * 手动结晶一个记忆
   */
  crystallizeMemory(nodeId: string): boolean {
    const node = this.memoryStore.get(nodeId);
    if (!node) return false;
    
    const result = this.crystallizationEngine.crystallize(nodeId);
    return result.crystallized;
  }

  // ───────────────────────────────────────────────────────────────────
  // 工具方法
  // ───────────────────────────────────────────────────────────────────

  /**
   * 获取记忆节点
   */
  getNode(id: string): MemoryNode | undefined {
    return this.memoryStore.get(id);
  }

  /**
   * 获取所有记忆
   */
  getAllNodes(): MemoryNode[] {
    return Array.from(this.memoryStore.values());
  }

  /**
   * 获取系统状态
   */
  getStatus(): SystemStatus {
    const nodes = Array.from(this.memoryStore.values());
    const crystallizedNodes = nodes.filter(n => n.crystallized);
    
    const avgConsolidationLevel = nodes.length > 0
      ? nodes.reduce((sum, n) => sum + n.consolidationLevel, 0) / nodes.length
      : 0;
    
    const totalAssociations = nodes.reduce((sum, n) => sum + n.associations.length, 0);
    
    const triggerStats = this.triggerSystem.getStats();
    
    return {
      totalMemories: nodes.length,
      crystallizedCount: crystallizedNodes.length,
      avgConsolidationLevel,
      totalAssociations,
      triggerCount: triggerStats.totalIndexedKeys,
      selfCore: crystallizedNodes.length > 0 ? this.getSelfCore() : null,
    };
  }

  /**
   * 获取触发器系统统计
   */
  getTriggerStats() {
    return this.triggerSystem.getStats();
  }

  /**
   * 直接检测触发器
   */
  detectTriggers(input: string): { hasTriggers: boolean; matchedNodes: Array<{ id: string; type: string; score: number }> } {
    return this.triggerSystem.detectTriggers(input);
  }

  /**
   * 清空记忆
   */
  clear(): void {
    this.memoryStore.clear();
    this.embeddingIndex.clear();
    this.timeIndex = [];
    this.triggerSystem.clear();
  }

  /**
   * 余弦相似度
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;
    
    return dotProduct / denominator;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createUnifiedMemorySystem(
  config: Partial<UnifiedMemoryConfig> = {}
): UnifiedMemorySystem {
  return new UnifiedMemorySystem(config);
}

// 单例实例
let defaultInstance: UnifiedMemorySystem | null = null;

export function getDefaultMemorySystem(): UnifiedMemorySystem {
  if (!defaultInstance) {
    defaultInstance = createUnifiedMemorySystem();
  }
  return defaultInstance;
}
