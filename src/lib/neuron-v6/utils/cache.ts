/**
 * ═══════════════════════════════════════════════════════════════════════
 * 缓存管理工具 (Cache Manager)
 * 
 * 用于优化 V6 系统的内存访问和缓存策略
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * 缓存条目
 */
export interface CacheEntry<T> {
  /** 缓存值 */
  value: T;
  /** 创建时间 */
  createdAt: number;
  /** 过期时间（毫秒，0 表示永不过期） */
  ttl: number;
  /** 访问次数 */
  accessCount: number;
  /** 最后访问时间 */
  lastAccessedAt: number;
  /** 优先级（越高越不容易被淘汰） */
  priority: number;
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  /** 最大条目数 */
  maxSize: number;
  /** 默认 TTL（毫秒，0 表示永不过期） */
  defaultTTL: number;
  /** 清理间隔（毫秒） */
  cleanupInterval: number;
  /** 是否启用 LRU 淘汰 */
  enableLRU: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 1000,
  defaultTTL: 5 * 60 * 1000, // 5 分钟
  cleanupInterval: 60 * 1000, // 1 分钟
  enableLRU: true,
};

/**
 * LRU 缓存实现
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
    this.startCleanupTimer();
  }

  /**
   * 设置缓存
   */
  set(key: K, value: V, ttl?: number, priority: number = 0): void {
    // 如果超出最大大小，执行淘汰
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      value,
      createdAt: Date.now(),
      ttl: ttl ?? this.config.defaultTTL,
      accessCount: 0,
      lastAccessedAt: Date.now(),
      priority,
    });
  }

  /**
   * 获取缓存
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // 检查是否过期
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return undefined;
    }

    // 更新访问信息
    entry.accessCount++;
    entry.lastAccessedAt = Date.now();

    // LRU: 重新插入以更新顺序
    if (this.config.enableLRU) {
      this.cache.delete(key);
      this.cache.set(key, entry);
    }

    return entry.value;
  }

  /**
   * 检查键是否存在
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 删除缓存
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 获取所有键
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalAccess: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    let totalAccess = 0;
    let oldestEntry = Infinity;
    let newestEntry = 0;

    for (const entry of this.cache.values()) {
      totalAccess += entry.accessCount;
      oldestEntry = Math.min(oldestEntry, entry.createdAt);
      newestEntry = Math.max(newestEntry, entry.createdAt);
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: 0, // 需要额外的命中/未命中统计
      totalAccess,
      oldestEntry: oldestEntry === Infinity ? 0 : oldestEntry,
      newestEntry,
    };
  }

  /**
   * 执行淘汰策略
   */
  private evict(): void {
    if (this.cache.size === 0) return;

    // 先清理过期条目
    this.cleanupExpired();

    if (this.cache.size < this.config.maxSize) return;

    // 按优先级和 LRU 淘汰
    const entries = Array.from(this.cache.entries());
    
    // 排序：优先级低的优先淘汰，相同优先级按 LRU
    entries.sort((a, b) => {
      if (a[1].priority !== b[1].priority) {
        return a[1].priority - b[1].priority;
      }
      return a[1].lastAccessedAt - b[1].lastAccessedAt;
    });

    // 淘汰 10% 或至少 1 个
    const evictCount = Math.max(1, Math.floor(this.config.maxSize * 0.1));
    for (let i = 0; i < evictCount && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * 清理过期条目
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 检查条目是否过期
   */
  private isExpired(entry: CacheEntry<unknown>): boolean {
    if (entry.ttl === 0) return false;
    return Date.now() > entry.createdAt + entry.ttl;
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    if (this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanupExpired();
      }, this.config.cleanupInterval);
    }
  }

  /**
   * 停止清理定时器
   */
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}

/**
 * 内存限制管理器
 */
export class MemoryLimiter {
  private maxSize: number;
  private currentSize: number = 0;
  private entries: Map<string, { size: number; timestamp: number }> = new Map();

  constructor(maxSizeBytes: number) {
    this.maxSize = maxSizeBytes;
  }

  /**
   * 尝试分配内存
   */
  allocate(key: string, size: number): boolean {
    if (size > this.maxSize) {
      console.warn(`[内存限制] 请求大小 ${size} 超过最大限制 ${this.maxSize}`);
      return false;
    }

    // 如果已存在，先释放旧空间
    if (this.entries.has(key)) {
      const oldEntry = this.entries.get(key);
      if (oldEntry) {
        this.currentSize -= oldEntry.size;
      }
    }

    // 如果空间不足，清理旧条目
    while (this.currentSize + size > this.maxSize && this.entries.size > 0) {
      this.evictOldest();
    }

    if (this.currentSize + size > this.maxSize) {
      return false;
    }

    this.entries.set(key, { size, timestamp: Date.now() });
    this.currentSize += size;
    return true;
  }

  /**
   * 释放内存
   */
  release(key: string): void {
    const entry = this.entries.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.entries.delete(key);
    }
  }

  /**
   * 获取当前使用情况
   */
  getUsage(): { used: number; max: number; percentage: number } {
    return {
      used: this.currentSize,
      max: this.maxSize,
      percentage: (this.currentSize / this.maxSize) * 100,
    };
  }

  /**
   * 淘汰最旧的条目
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.entries.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.release(oldestKey);
    }
  }

  /**
   * 清空所有
   */
  clear(): void {
    this.entries.clear();
    this.currentSize = 0;
  }
}

/**
 * 会话历史管理器（限制大小）
 */
export class SessionHistoryManager<T> {
  private history: Array<{ data: T; timestamp: number }> = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * 添加条目
   */
  push(data: T): void {
    this.history.push({ data, timestamp: Date.now() });

    // 超出限制时删除旧条目
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(-this.maxSize);
    }
  }

  /**
   * 获取最近 N 条
   */
  getRecent(count: number): Array<{ data: T; timestamp: number }> {
    return this.history.slice(-count);
  }

  /**
   * 获取全部
   */
  getAll(): Array<{ data: T; timestamp: number }> {
    return [...this.history];
  }

  /**
   * 清空
   */
  clear(): void {
    this.history = [];
  }

  /**
   * 获取大小
   */
  get size(): number {
    return this.history.length;
  }
}

/**
 * 导出默认缓存实例
 */
export const globalCache = new LRUCache<string, unknown>({
  maxSize: 2000,
  defaultTTL: 10 * 60 * 1000, // 10 分钟
});

export const memoryLimiter = new MemoryLimiter(100 * 1024 * 1024); // 100MB
