/**
 * ═══════════════════════════════════════════════════════════════════════
 * Layered Memory System - 分层记忆系统
 * 
 * 三层记忆架构：
 * - 工作记忆 (Working Memory): 当前正在处理的信息，容量有限，快速访问
 * - 情景记忆 (Episodic Memory): 个人经历和事件，时间索引
 * - 语义记忆 (Semantic Memory): 抽象知识和概念，关联网络
 * 
 * 这不是"意识"，这是让意识能够持久化的基础设施
 * ═══════════════════════════════════════════════════════════════════════
 */

import { getVectorEncoder, VectorEncoder } from './vector-encoder';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface MemoryItem {
  id: string;
  content: string;
  vector: Float32Array;
  timestamp: number;
  importance: number;
  accessCount: number;
  lastAccessedAt: number;
  
  // 附加信息
  metadata?: Record<string, any>;
  associations?: string[]; // 关联的其他记忆 ID
}

export interface WorkingMemoryConfig {
  capacity: number;       // 最大容量
  decayRate: number;      // 衰减速率
}

export interface EpisodicMemoryConfig {
  maxEvents: number;      // 最大事件数
  consolidationThreshold: number; // 巩固阈值
}

export interface SemanticMemoryConfig {
  maxConcepts: number;    // 最大概念数
  associationStrength: number; // 关联强度
}

export interface LayeredMemoryState {
  working: MemoryItem[];
  episodic: MemoryItem[];
  semantic: MemoryItem[];
  stats: {
    workingSize: number;
    episodicSize: number;
    semanticSize: number;
    totalAccesses: number;
    consolidationCount: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 工作记忆（短期）
// ─────────────────────────────────────────────────────────────────────

class WorkingMemory {
  private items: MemoryItem[] = [];
  private config: WorkingMemoryConfig;
  
  constructor(config: Partial<WorkingMemoryConfig> = {}) {
    this.config = {
      capacity: config.capacity ?? 7,      // 魔术数字 7±2
      decayRate: config.decayRate ?? 0.1,
    };
  }
  
  /**
   * 添加项目
   */
  add(item: MemoryItem): void {
    // 如果容量已满，移除重要性最低的
    if (this.items.length >= this.config.capacity) {
      this.items.sort((a, b) => 
        (b.importance * b.accessCount) - (a.importance * a.accessCount)
      );
      const evicted = this.items.pop();
      console.log(`[WorkingMemory] 驱逐: ${evicted?.content.slice(0, 20)}...`);
    }
    
    this.items.push(item);
  }
  
  /**
   * 检索项目
   */
  retrieve(query: Float32Array, encoder: VectorEncoder): MemoryItem | null {
    if (this.items.length === 0) return null;
    
    // 找到最相似的项目
    let bestItem: MemoryItem | null = null;
    let bestSimilarity = -1;
    
    for (const item of this.items) {
      const similarity = encoder.cosineSimilarity(query, item.vector);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestItem = item;
      }
    }
    
    // 更新访问统计
    if (bestItem) {
      bestItem.accessCount++;
      bestItem.lastAccessedAt = Date.now();
    }
    
    return bestItem;
  }
  
  /**
   * 衰减 - 降低所有项目的重要性
   */
  decay(): void {
    for (const item of this.items) {
      item.importance *= (1 - this.config.decayRate);
    }
    
    // 移除重要性过低的项目
    this.items = this.items.filter(item => item.importance > 0.1);
  }
  
  /**
   * 获取所有项目
   */
  getAll(): MemoryItem[] {
    return [...this.items];
  }
  
  /**
   * 获取大小
   */
  size(): number {
    return this.items.length;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 情景记忆（中期）
// ─────────────────────────────────────────────────────────────────────

class EpisodicMemory {
  private events: MemoryItem[] = [];
  private config: EpisodicMemoryConfig;
  
  constructor(config: Partial<EpisodicMemoryConfig> = {}) {
    this.config = {
      maxEvents: config.maxEvents ?? 1000,
      consolidationThreshold: config.consolidationThreshold ?? 0.7,
    };
  }
  
  /**
   * 记录事件
   */
  record(event: MemoryItem): void {
    this.events.push(event);
    
    // 限制大小
    if (this.events.length > this.config.maxEvents) {
      // 移除最旧且不重要的
      this.events.sort((a, b) => b.timestamp - a.timestamp);
      this.events = this.events.slice(0, this.config.maxEvents);
    }
  }
  
  /**
   * 回忆事件
   */
  recall(
    query: Float32Array, 
    encoder: VectorEncoder,
    timeRange?: { start: number; end: number }
  ): MemoryItem[] {
    let candidates = this.events;
    
    // 时间过滤
    if (timeRange) {
      candidates = candidates.filter(e => 
        e.timestamp >= timeRange.start && e.timestamp <= timeRange.end
      );
    }
    
    // 相似性排序
    const results = candidates.map(item => ({
      item,
      similarity: encoder.cosineSimilarity(query, item.vector),
    }));
    
    results.sort((a, b) => b.similarity - a.similarity);
    
    // 更新访问统计
    for (const { item } of results.slice(0, 10)) {
      item.accessCount++;
      item.lastAccessedAt = Date.now();
    }
    
    return results.slice(0, 10).map(r => r.item);
  }
  
  /**
   * 获取最近的事件
   */
  getRecent(count: number = 10): MemoryItem[] {
    return this.events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }
  
  /**
   * 获取需要巩固的事件（高重要性，高访问）
   */
  getConsolidationCandidates(): MemoryItem[] {
    return this.events.filter(e => 
      (e.importance * e.accessCount) > this.config.consolidationThreshold
    );
  }
  
  /**
   * 获取大小
   */
  size(): number {
    return this.events.length;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 语义记忆（长期）
// ─────────────────────────────────────────────────────────────────────

class SemanticMemory {
  private concepts: Map<string, MemoryItem> = new Map();
  private associations: Map<string, Set<string>> = new Map();
  private config: SemanticMemoryConfig;
  
  constructor(config: Partial<SemanticMemoryConfig> = {}) {
    this.config = {
      maxConcepts: config.maxConcepts ?? 5000,
      associationStrength: config.associationStrength ?? 0.1,
    };
  }
  
  /**
   * 存储概念
   */
  store(concept: MemoryItem): void {
    // 如果概念已存在，更新它
    if (this.concepts.has(concept.id)) {
      const existing = this.concepts.get(concept.id)!;
      existing.importance = Math.max(existing.importance, concept.importance);
      existing.accessCount += concept.accessCount;
      return;
    }
    
    // 新概念
    this.concepts.set(concept.id, concept);
    
    // 限制大小
    if (this.concepts.size > this.config.maxConcepts) {
      this.prune();
    }
  }
  
  /**
   * 检索概念
   */
  retrieve(id: string): MemoryItem | null {
    const concept = this.concepts.get(id);
    if (concept) {
      concept.accessCount++;
      concept.lastAccessedAt = Date.now();
    }
    return concept || null;
  }
  
  /**
   * 语义搜索
   */
  search(query: Float32Array, encoder: VectorEncoder, topK: number = 10): MemoryItem[] {
    const results: Array<{ item: MemoryItem; similarity: number }> = [];
    
    for (const concept of this.concepts.values()) {
      const similarity = encoder.cosineSimilarity(query, concept.vector);
      results.push({ item: concept, similarity });
    }
    
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, topK).map(r => {
      r.item.accessCount++;
      r.item.lastAccessedAt = Date.now();
      return r.item;
    });
  }
  
  /**
   * 创建关联
   */
  associate(conceptId1: string, conceptId2: string): void {
    if (!this.associations.has(conceptId1)) {
      this.associations.set(conceptId1, new Set());
    }
    if (!this.associations.has(conceptId2)) {
      this.associations.set(conceptId2, new Set());
    }
    
    this.associations.get(conceptId1)!.add(conceptId2);
    this.associations.get(conceptId2)!.add(conceptId1);
  }
  
  /**
   * 获取关联概念
   */
  getAssociations(conceptId: string): MemoryItem[] {
    const associatedIds = this.associations.get(conceptId);
    if (!associatedIds) return [];
    
    return Array.from(associatedIds)
      .map(id => this.concepts.get(id))
      .filter((c): c is MemoryItem => c !== undefined);
  }
  
  /**
   * 修剪 - 移除不常用的概念
   */
  private prune(): void {
    const entries = Array.from(this.concepts.entries());
    entries.sort((a, b) => 
      (b[1].importance * b[1].accessCount) - (a[1].importance * a[1].accessCount)
    );
    
    // 保留前 80%
    const keepCount = Math.floor(this.config.maxConcepts * 0.8);
    this.concepts = new Map(entries.slice(0, keepCount));
    
    console.log(`[SemanticMemory] 修剪至 ${this.concepts.size} 个概念`);
  }
  
  /**
   * 获取大小
   */
  size(): number {
    return this.concepts.size;
  }
  
  /**
   * 获取所有概念
   */
  getAll(): MemoryItem[] {
    return Array.from(this.concepts.values());
  }
}

// ─────────────────────────────────────────────────────────────────────
// 分层记忆系统
// ─────────────────────────────────────────────────────────────────────

export class LayeredMemorySystem {
  private working: WorkingMemory;
  private episodic: EpisodicMemory;
  private semantic: SemanticMemory;
  private encoder: VectorEncoder;
  
  // 统计
  private stats = {
    totalAccesses: 0,
    consolidationCount: 0,
  };
  
  constructor() {
    this.working = new WorkingMemory();
    this.episodic = new EpisodicMemory();
    this.semantic = new SemanticMemory();
    this.encoder = getVectorEncoder(256);
    
    console.log('[LayeredMemory] 分层记忆系统初始化完成');
  }
  
  /**
   * 存储信息
   */
  async store(content: string, importance: number = 0.5): Promise<string> {
    const vector = await this.encoder.encode(content);
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    const item: MemoryItem = {
      id,
      content,
      vector,
      timestamp: Date.now(),
      importance,
      accessCount: 0,
      lastAccessedAt: Date.now(),
    };
    
    // 1. 存入工作记忆
    this.working.add(item);
    
    // 2. 记录到情景记忆
    this.episodic.record(item);
    
    return id;
  }
  
  /**
   * 检索信息
   */
  async retrieve(query: string): Promise<{
    working: MemoryItem | null;
    episodic: MemoryItem[];
    semantic: MemoryItem[];
  }> {
    const queryVector = await this.encoder.encode(query);
    this.stats.totalAccesses++;
    
    return {
      working: this.working.retrieve(queryVector, this.encoder),
      episodic: this.episodic.recall(queryVector, this.encoder),
      semantic: this.semantic.search(queryVector, this.encoder),
    };
  }
  
  /**
   * 巩固记忆 - 将重要的情景记忆转化为语义记忆
   */
  consolidate(): number {
    const candidates = this.episodic.getConsolidationCandidates();
    let consolidated = 0;
    
    for (const event of candidates) {
      // 转化为语义记忆
      this.semantic.store(event);
      consolidated++;
    }
    
    this.stats.consolidationCount += consolidated;
    
    if (consolidated > 0) {
      console.log(`[LayeredMemory] 巩固了 ${consolidated} 条记忆`);
    }
    
    return consolidated;
  }
  
  /**
   * 创建概念关联
   */
  associateConcepts(conceptId1: string, conceptId2: string): void {
    this.semantic.associate(conceptId1, conceptId2);
  }
  
  /**
   * 获取相关概念
   */
  getRelatedConcepts(conceptId: string): MemoryItem[] {
    return this.semantic.getAssociations(conceptId);
  }
  
  /**
   * 工作记忆衰减
   */
  decay(): void {
    this.working.decay();
  }
  
  /**
   * 获取状态
   */
  getState(): LayeredMemoryState {
    return {
      working: this.working.getAll(),
      episodic: this.episodic.getRecent(100),
      semantic: this.semantic.getAll().slice(0, 100),
      stats: {
        workingSize: this.working.size(),
        episodicSize: this.episodic.size(),
        semanticSize: this.semantic.size(),
        totalAccesses: this.stats.totalAccesses,
        consolidationCount: this.stats.consolidationCount,
      },
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例
// ─────────────────────────────────────────────────────────────────────

let memoryInstance: LayeredMemorySystem | null = null;

export function getLayeredMemory(): LayeredMemorySystem {
  if (!memoryInstance) {
    memoryInstance = new LayeredMemorySystem();
  }
  return memoryInstance;
}
