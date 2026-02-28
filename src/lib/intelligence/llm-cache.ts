/**
 * ═══════════════════════════════════════════════════════════════════════
 * 智能层 - LLM 缓存
 * 
 * 缓存 LLM 调用结果，减少冗余调用
 * - 基于输入相似度的缓存命中
 * - 支持缓存过期
 * - 统计缓存效率
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  key: string;
  input: string;
  inputEmbedding?: number[];
  result: T;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  ttl: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTtl: number;    // 毫秒
  similarityThreshold: number; // 相似度阈值 (0-1)
}

// ─────────────────────────────────────────────────────────────────────
// LLM 缓存
// ─────────────────────────────────────────────────────────────────────

/**
 * LLM 调用缓存
 * 
 * 支持精确匹配和语义相似度匹配
 */
export class LLMCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private stats = { hits: 0, misses: 0 };
  
  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize ?? 100,
      defaultTtl: config.defaultTtl ?? 1000 * 60 * 60, // 1小时
      similarityThreshold: config.similarityThreshold ?? 0.95
    };
  }
  
  /**
   * 生成缓存键
   */
  generateKey(input: string, context?: Record<string, unknown>): string {
    const normalizedInput = input.trim().toLowerCase();
    const contextStr = context ? JSON.stringify(context) : '';
    return `${normalizedInput}:${contextStr}`;
  }
  
  /**
   * 获取缓存
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return undefined;
    }
    
    // 检查是否过期
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }
    
    // 更新访问记录
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.stats.hits++;
    
    return entry.result;
  }
  
  /**
   * 设置缓存
   */
  set(key: string, input: string, result: T, ttl?: number): void {
    // 如果缓存已满，淘汰最旧的条目
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }
    
    const entry: CacheEntry<T> = {
      key,
      input,
      result,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      ttl: ttl ?? this.config.defaultTtl
    };
    
    this.cache.set(key, entry);
  }
  
  /**
   * 通过语义相似度查找
   * 
   * 需要提供输入的 embedding 向量
   */
  findBySimilarity(embedding: number[]): T | undefined {
    let bestMatch: CacheEntry<T> | null = null;
    let bestSimilarity = this.config.similarityThreshold;
    
    for (const entry of this.cache.values()) {
      if (!entry.inputEmbedding) continue;
      if (this.isExpired(entry)) continue;
      
      const similarity = this.cosineSimilarity(embedding, entry.inputEmbedding);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = entry;
      }
    }
    
    if (bestMatch) {
      bestMatch.lastAccessed = Date.now();
      bestMatch.accessCount++;
      this.stats.hits++;
      return bestMatch.result;
    }
    
    this.stats.misses++;
    return undefined;
  }
  
  /**
   * 设置带 embedding 的缓存
   */
  setWithEmbedding(
    key: string, 
    input: string, 
    result: T, 
    embedding: number[],
    ttl?: number
  ): void {
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }
    
    const entry: CacheEntry<T> = {
      key,
      input,
      inputEmbedding: embedding,
      result,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      ttl: ttl ?? this.config.defaultTtl
    };
    
    this.cache.set(key, entry);
  }
  
  /**
   * 检查是否有缓存
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
  
  /**
   * 清除缓存
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }
  
  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      size: this.cache.size,
      maxSize: this.config.maxSize
    };
  }
  
  /**
   * 清理过期缓存
   */
  cleanup(): number {
    let cleaned = 0;
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    return cleaned;
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 私有方法
  // ───────────────────────────────────────────────────────────────────
  
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.createdAt > entry.ttl;
  }
  
  private evictOldest(): void {
    let oldest: CacheEntry<T> | null = null;
    let oldestKey: string | null = null;
    
    for (const [key, entry] of this.cache) {
      if (!oldest || entry.lastAccessed < oldest.lastAccessed) {
        oldest = entry;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  
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
}

// ─────────────────────────────────────────────────────────────────────
// 带缓存的 LLM 调用包装器
// ─────────────────────────────────────────────────────────────────────

/**
 * 带缓存的 LLM 调用包装器
 */
export class CachedLLMCaller {
  private cache: LLMCache;
  
  constructor(config?: Partial<CacheConfig>) {
    this.cache = new LLMCache(config);
  }
  
  /**
   * 执行 LLM 调用（带缓存）
   */
  async call<T>(
    key: string,
    input: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // 尝试从缓存获取
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return cached as T;
    }
    
    // 执行调用
    const result = await fn();
    
    // 存入缓存
    this.cache.set(key, input, result, ttl);
    
    return result;
  }
  
  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    return this.cache.getStats();
  }
  
  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}
