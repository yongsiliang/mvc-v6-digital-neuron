/**
 * ═══════════════════════════════════════════════════════════════════════
 * 智能层 - 增强记忆存储
 * 
 * 功能：
 * - 向量语义检索
 * - 持久化存储
 * - 重要性衰减
 * - 关联网络
 * ═══════════════════════════════════════════════════════════════════════
 */

import { MemoryStructure } from '../info-field/structures';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 记忆条目 */
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
  tags: string[];
}

/** 记忆搜索选项 */
export interface MemorySearchOptions {
  /** 返回数量 */
  limit?: number;
  /** 最小相似度 */
  minSimilarity?: number;
  /** 按标签过滤 */
  tags?: string[];
  /** 按元数据过滤 */
  metadata?: Record<string, unknown>;
  /** 是否包含重要性权重 */
  includeImportance?: boolean;
}

/** 记忆搜索结果 */
export interface MemorySearchResult {
  entry: MemoryEntry;
  similarity?: number;
  score: number;
}

/** 持久化配置 */
export interface PersistenceConfig {
  enabled: boolean;
  storageKey: string;
  autoSave: boolean;
  saveInterval: number; // 毫秒
}

// ─────────────────────────────────────────────────────────────────────
// 增强记忆存储
// ─────────────────────────────────────────────────────────────────────

/**
 * 增强记忆存储
 * 
 * 支持向量检索和持久化
 */
export class EnhancedMemoryStore {
  private memories: Map<string, MemoryEntry> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private maxMemories: number;
  private persistence: PersistenceConfig;
  private saveTimer?: ReturnType<typeof setInterval>;
  
  constructor(
    maxMemories: number = 1000,
    persistence?: Partial<PersistenceConfig>
  ) {
    this.maxMemories = maxMemories;
    this.persistence = {
      enabled: persistence?.enabled ?? true,
      storageKey: persistence?.storageKey ?? 'agent-memory-store',
      autoSave: persistence?.autoSave ?? true,
      saveInterval: persistence?.saveInterval ?? 30000
    };
    
    // 加载持久化数据
    if (this.persistence.enabled && typeof window !== 'undefined') {
      this.load();
      
      // 自动保存
      if (this.persistence.autoSave) {
        this.saveTimer = setInterval(() => {
          this.save();
        }, this.persistence.saveInterval);
      }
    }
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 核心操作
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 存储新记忆
   */
  store(
    content: string,
    options: {
      embedding?: number[];
      importance?: number;
      metadata?: Record<string, unknown>;
      tags?: string[];
    } = {}
  ): MemoryEntry {
    const id = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();
    
    const entry: MemoryEntry = {
      id,
      content,
      embedding: options.embedding,
      importance: options.importance ?? 0.5,
      createdAt: now,
      lastAccessed: now,
      accessCount: 0,
      associations: [],
      metadata: options.metadata ?? {},
      tags: options.tags ?? []
    };
    
    this.memories.set(id, entry);
    
    // 更新标签索引
    for (const tag of entry.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(id);
    }
    
    // 如果超过最大数量，淘汰最不重要的记忆
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
      entry.lastAccessed = Date.now();
      entry.accessCount++;
    }
    return entry;
  }
  
  /**
   * 更新记忆
   */
  update(id: string, updates: Partial<MemoryEntry>): MemoryEntry | undefined {
    const entry = this.memories.get(id);
    if (!entry) return undefined;
    
    // 更新标签索引
    if (updates.tags) {
      // 移除旧标签
      for (const tag of entry.tags) {
        this.tagIndex.get(tag)?.delete(id);
      }
      // 添加新标签
      for (const tag of updates.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(id);
      }
    }
    
    Object.assign(entry, updates);
    return entry;
  }
  
  /**
   * 删除记忆
   */
  delete(id: string): boolean {
    const entry = this.memories.get(id);
    if (!entry) return false;
    
    // 清理标签索引
    for (const tag of entry.tags) {
      this.tagIndex.get(tag)?.delete(id);
    }
    
    return this.memories.delete(id);
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 搜索功能
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 向量语义搜索
   */
  searchByEmbedding(
    queryEmbedding: number[],
    options: MemorySearchOptions = {}
  ): MemorySearchResult[] {
    const {
      limit = 5,
      minSimilarity = 0.5,
      tags,
      includeImportance = true
    } = options;
    
    const similarities: Array<{ entry: MemoryEntry; similarity: number }> = [];
    
    for (const entry of this.memories.values()) {
      // 标签过滤
      if (tags && tags.length > 0) {
        if (!tags.some(t => entry.tags.includes(t))) continue;
      }
      
      if (entry.embedding) {
        const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding);
        if (similarity >= minSimilarity) {
          similarities.push({ entry, similarity });
        }
      }
    }
    
    // 按相似度排序
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    // 计算综合分数
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    return similarities.slice(0, limit).map(({ entry, similarity }) => {
      const recency = Math.exp(-((now - entry.lastAccessed) / dayInMs));
      const frequency = Math.log(entry.accessCount + 1) / 10;
      
      const score = includeImportance
        ? similarity * 0.6 + entry.importance * 0.2 + recency * 0.1 + frequency * 0.1
        : similarity;
      
      // 更新访问记录
      entry.lastAccessed = now;
      entry.accessCount++;
      
      return { entry, similarity, score };
    });
  }
  
  /**
   * 关键词搜索
   */
  searchByKeyword(
    keyword: string,
    options: MemorySearchOptions = {}
  ): MemorySearchResult[] {
    const { limit = 5, tags, includeImportance = true } = options;
    const lowerKeyword = keyword.toLowerCase();
    
    const results: MemorySearchResult[] = [];
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    for (const entry of this.memories.values()) {
      // 标签过滤
      if (tags && tags.length > 0) {
        if (!tags.some(t => entry.tags.includes(t))) continue;
      }
      
      if (entry.content.toLowerCase().includes(lowerKeyword)) {
        const recency = Math.exp(-((now - entry.lastAccessed) / dayInMs));
        const frequency = Math.log(entry.accessCount + 1) / 10;
        
        // 关键词匹配的基础分数
        const matchScore = 0.5;
        
        const score = includeImportance
          ? matchScore * 0.5 + entry.importance * 0.3 + recency * 0.1 + frequency * 0.1
          : matchScore;
        
        entry.lastAccessed = now;
        entry.accessCount++;
        
        results.push({ entry, score });
        if (results.length >= limit * 2) break;
      }
    }
    
    // 按分数排序
    results.sort((a, b) => b.score - a.score);
    
    return results.slice(0, limit);
  }
  
  /**
   * 按标签搜索
   */
  searchByTags(tags: string[], limit: number = 10): MemoryEntry[] {
    const entries: MemoryEntry[] = [];
    
    for (const tag of tags) {
      const ids = this.tagIndex.get(tag);
      if (ids) {
        for (const id of ids) {
          const entry = this.memories.get(id);
          if (entry && !entries.find(e => e.id === id)) {
            entry.lastAccessed = Date.now();
            entry.accessCount++;
            entries.push(entry);
            if (entries.length >= limit) return entries;
          }
        }
      }
    }
    
    return entries;
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 关联功能
  // ───────────────────────────────────────────────────────────────────
  
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
  getAssociations(id: string, depth: number = 1): MemoryEntry[] {
    const visited = new Set<string>();
    const result: MemoryEntry[] = [];
    
    const traverse = (currentId: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(currentId)) return;
      visited.add(currentId);
      
      const entry = this.memories.get(currentId);
      if (!entry) return;
      
      if (currentDepth > 0) {
        result.push(entry);
      }
      
      for (const assocId of entry.associations) {
        traverse(assocId, currentDepth + 1);
      }
    };
    
    traverse(id, 0);
    return result;
  }
  
  /**
   * 自动关联相似记忆
   */
  autoAssociate(threshold: number = 0.8): number {
    let associated = 0;
    const entries = Array.from(this.memories.values()).filter(e => e.embedding);
    
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        if (!entries[i].embedding || !entries[j].embedding) continue;
        
        const similarity = this.cosineSimilarity(
          entries[i].embedding!,
          entries[j].embedding!
        );
        
        if (similarity >= threshold && !entries[i].associations.includes(entries[j].id)) {
          this.addAssociation(entries[i].id, entries[j].id);
          associated++;
        }
      }
    }
    
    return associated;
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 持久化
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 保存到存储
   */
  save(): void {
    if (!this.persistence.enabled || typeof window === 'undefined') return;
    
    try {
      const data = {
        memories: Array.from(this.memories.entries()),
        version: 1,
        savedAt: Date.now()
      };
      localStorage.setItem(this.persistence.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save memory store:', error);
    }
  }
  
  /**
   * 从存储加载
   */
  load(): void {
    if (!this.persistence.enabled || typeof window === 'undefined') return;
    
    try {
      const raw = localStorage.getItem(this.persistence.storageKey);
      if (!raw) return;
      
      const data = JSON.parse(raw);
      
      if (data.memories && Array.isArray(data.memories)) {
        this.memories = new Map(data.memories);
        
        // 重建标签索引
        this.tagIndex.clear();
        for (const [, entry] of this.memories) {
          for (const tag of entry.tags) {
            if (!this.tagIndex.has(tag)) {
              this.tagIndex.set(tag, new Set());
            }
            this.tagIndex.get(tag)!.add(entry.id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load memory store:', error);
    }
  }
  
  /**
   * 清除持久化数据
   */
  clearPersistence(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.persistence.storageKey);
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 工具方法
  // ───────────────────────────────────────────────────────────────────
  
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
   * 获取统计信息
   */
  getStats(): {
    total: number;
    withEmbeddings: number;
    totalAssociations: number;
    avgImportance: number;
    tagCount: number;
  } {
    let withEmbeddings = 0;
    let totalAssociations = 0;
    let totalImportance = 0;
    
    for (const entry of this.memories.values()) {
      if (entry.embedding) withEmbeddings++;
      totalAssociations += entry.associations.length;
      totalImportance += entry.importance;
    }
    
    return {
      total: this.memories.size,
      withEmbeddings,
      totalAssociations,
      avgImportance: this.memories.size > 0 ? totalImportance / this.memories.size : 0,
      tagCount: this.tagIndex.size
    };
  }
  
  /**
   * 清除所有记忆
   */
  clear(): void {
    this.memories.clear();
    this.tagIndex.clear();
  }
  
  /**
   * 获取记忆数量
   */
  get size(): number {
    return this.memories.size;
  }
  
  /**
   * 销毁（清理资源）
   */
  destroy(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }
    if (this.persistence.autoSave) {
      this.save();
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
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    let minScore = Infinity;
    let minId: string | null = null;
    
    for (const [id, entry] of this.memories) {
      const age = (now - entry.createdAt) / dayInMs;
      const recency = Math.exp(-age / 7);
      const score = entry.importance * recency * Math.log(entry.accessCount + 1);
      
      if (score < minScore) {
        minScore = score;
        minId = id;
      }
    }
    
    if (minId) {
      this.delete(minId);
    }
  }
}
