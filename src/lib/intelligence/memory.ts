/**
 * ═══════════════════════════════════════════════════════════════════════
 * 智能层 - 记忆存储
 * 
 * 存储和检索智能体的记忆
 * 记忆 = 经编码的信息 + 重要性 + 访问记录
 * ═══════════════════════════════════════════════════════════════════════
 */

import { MemoryStructure, DenseVectorStructure } from '../info-field/structures';

/**
 * 记忆条目
 */
export interface MemoryEntry {
  id: string;
  content: string;
  embedding?: number[];
  importance: number;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  associations: string[];
  metadata: Record<string, unknown>;
}

/**
 * 记忆存储
 * 
 * 管理智能体的长期记忆
 */
export class MemoryStore {
  private memories: Map<string, MemoryEntry> = new Map();
  private maxMemories: number;
  
  constructor(maxMemories: number = 1000) {
    this.maxMemories = maxMemories;
  }
  
  /**
   * 存储新记忆
   */
  store(
    content: string,
    embedding?: number[],
    importance: number = 0.5,
    metadata: Record<string, unknown> = {}
  ): MemoryEntry {
    const id = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const entry: MemoryEntry = {
      id,
      content,
      embedding,
      importance,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0,
      associations: [],
      metadata
    };
    
    this.memories.set(id, entry);
    
    // 如果超过最大数量，移除最不重要的记忆
    if (this.memories.size > this.maxMemories) {
      this.evictLeastImportant();
    }
    
    return entry;
  }
  
  /**
   * 检索记忆
   */
  retrieve(id: string): MemoryEntry | undefined {
    const entry = this.memories.get(id);
    if (entry) {
      // 更新访问记录
      entry.lastAccessed = Date.now();
      entry.accessCount++;
    }
    return entry;
  }
  
  /**
   * 语义搜索
   * 
   * 根据嵌入向量查找最相关的记忆
   */
  searchByEmbedding(queryEmbedding: number[], topK: number = 5): MemoryEntry[] {
    const similarities: Array<{ entry: MemoryEntry; similarity: number }> = [];
    
    for (const entry of this.memories.values()) {
      if (entry.embedding) {
        const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding);
        similarities.push({ entry, similarity });
      }
    }
    
    // 按相似度降序排序
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    // 返回 topK 结果，并更新访问记录
    return similarities.slice(0, topK).map(({ entry }) => {
      entry.lastAccessed = Date.now();
      entry.accessCount++;
      return entry;
    });
  }
  
  /**
   * 关键词搜索
   */
  searchByKeyword(keyword: string, topK: number = 5): MemoryEntry[] {
    const results: MemoryEntry[] = [];
    const lowerKeyword = keyword.toLowerCase();
    
    for (const entry of this.memories.values()) {
      if (entry.content.toLowerCase().includes(lowerKeyword)) {
        entry.lastAccessed = Date.now();
        entry.accessCount++;
        results.push(entry);
        if (results.length >= topK) break;
      }
    }
    
    return results;
  }
  
  /**
   * 添加关联
   */
  addAssociation(id1: string, id2: string): void {
    const entry1 = this.memories.get(id1);
    const entry2 = this.memories.get(id2);
    
    if (entry1 && !entry1.associations.includes(id2)) {
      entry1.associations.push(id2);
    }
    if (entry2 && !entry2.associations.includes(id1)) {
      entry2.associations.push(id1);
    }
  }
  
  /**
   * 获取关联记忆
   */
  getAssociations(id: string): MemoryEntry[] {
    const entry = this.memories.get(id);
    if (!entry) return [];
    
    return entry.associations
      .map(assocId => this.memories.get(assocId))
      .filter((e): e is MemoryEntry => e !== undefined);
  }
  
  /**
   * 更新重要性
   */
  updateImportance(id: string, importance: number): void {
    const entry = this.memories.get(id);
    if (entry) {
      entry.importance = Math.max(0, Math.min(1, importance));
    }
  }
  
  /**
   * 获取最近的记忆
   */
  getRecent(count: number = 10): MemoryEntry[] {
    const entries = Array.from(this.memories.values());
    entries.sort((a, b) => b.createdAt - a.createdAt);
    return entries.slice(0, count);
  }
  
  /**
   * 获取最重要的记忆
   */
  getImportant(count: number = 10): MemoryEntry[] {
    const entries = Array.from(this.memories.values());
    entries.sort((a, b) => b.importance - a.importance);
    return entries.slice(0, count);
  }
  
  /**
   * 清除所有记忆
   */
  clear(): void {
    this.memories.clear();
  }
  
  /**
   * 获取记忆数量
   */
  get size(): number {
    return this.memories.size;
  }
  
  /**
   * 导出所有记忆
   */
  export(): MemoryEntry[] {
    return Array.from(this.memories.values());
  }
  
  /**
   * 导入记忆
   */
  import(entries: MemoryEntry[]): void {
    for (const entry of entries) {
      this.memories.set(entry.id, entry);
    }
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 私有方法
  // ───────────────────────────────────────────────────────────────────
  
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
    
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
  }
  
  private evictLeastImportant(): void {
    // 计算每个记忆的综合分数：重要性 × 时间衰减
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    let minScore = Infinity;
    let minId: string | null = null;
    
    for (const [id, entry] of this.memories) {
      const age = (now - entry.createdAt) / dayInMs;
      const recency = Math.exp(-age / 7); // 一周衰减
      const score = entry.importance * recency * Math.log(entry.accessCount + 1);
      
      if (score < minScore) {
        minScore = score;
        minId = id;
      }
    }
    
    if (minId) {
      this.memories.delete(minId);
    }
  }
}
