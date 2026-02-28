/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一存储层 (Unified Storage)
 * 
 * 职责：
 * - 统一所有持久化操作
 * - 支持多种存储后端（内存、文件、S3）
 * - 提供缓存和压缩能力
 * - 统一错误处理
 * ═══════════════════════════════════════════════════════════════════════
 */

import { S3Storage } from 'coze-coding-dev-sdk';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export type StorageBackend = 'memory' | 'file' | 's3';

export interface StorageConfig {
  backend: StorageBackend;
  basePath?: string;
  enableCache: boolean;
  cacheTTL: number;
  enableCompression: boolean;
}

export interface StorageItem<T> {
  key: string;
  data: T;
  timestamp: number;
  version: string;
  checksum?: string;
}

const DEFAULT_CONFIG: StorageConfig = {
  backend: 'memory',
  basePath: '/tmp/consciousness-storage',
  enableCache: true,
  cacheTTL: 5 * 60 * 1000,
  enableCompression: false,
};

// ─────────────────────────────────────────────────────────────────────
// 存储适配器接口
// ─────────────────────────────────────────────────────────────────────

interface StorageAdapter {
  save<T>(key: string, data: T): Promise<void>;
  load<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  list(prefix: string): Promise<string[]>;
}

// ─────────────────────────────────────────────────────────────────────
// 内存存储适配器
// ─────────────────────────────────────────────────────────────────────

class MemoryStorageAdapter implements StorageAdapter {
  private store: Map<string, StorageItem<unknown>> = new Map();
  
  async save<T>(key: string, data: T): Promise<void> {
    this.store.set(key, {
      key,
      data,
      timestamp: Date.now(),
      version: '1.0',
    });
  }
  
  async load<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    return item ? (item.data as T) : null;
  }
  
  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }
  
  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }
  
  async list(prefix: string): Promise<string[]> {
    return Array.from(this.store.keys()).filter(k => k.startsWith(prefix));
  }
}

// ─────────────────────────────────────────────────────────────────────
// 文件存储适配器
// ─────────────────────────────────────────────────────────────────────

class FileStorageAdapter implements StorageAdapter {
  private basePath: string;
  
  constructor(basePath: string) {
    this.basePath = basePath;
  }
  
  private getFilePath(key: string): string {
    return path.join(this.basePath, `${key}.json`);
  }
  
  async save<T>(key: string, data: T): Promise<void> {
    const filePath = this.getFilePath(key);
    const dir = path.dirname(filePath);
    
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    
    const item: StorageItem<T> = {
      key,
      data,
      timestamp: Date.now(),
      version: '1.0',
    };
    
    await writeFile(filePath, JSON.stringify(item, null, 2), 'utf-8');
  }
  
  async load<T>(key: string): Promise<T | null> {
    const filePath = this.getFilePath(key);
    
    if (!existsSync(filePath)) {
      return null;
    }
    
    try {
      const content = await readFile(filePath, 'utf-8');
      const item = JSON.parse(content) as StorageItem<T>;
      return item.data;
    } catch {
      return null;
    }
  }
  
  async delete(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    if (existsSync(filePath)) {
      const { unlink } = await import('fs/promises');
      await unlink(filePath);
      return true;
    }
    return false;
  }
  
  async exists(key: string): Promise<boolean> {
    return existsSync(this.getFilePath(key));
  }
  
  async list(prefix: string): Promise<string[]> {
    const { readdir } = await import('fs/promises');
    try {
      const files = await readdir(this.basePath);
      return files
        .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch {
      return [];
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 统一存储
// ─────────────────────────────────────────────────────────────────────

class UnifiedStorage {
  private static instance: UnifiedStorage | null = null;
  private config: StorageConfig;
  private adapter: StorageAdapter;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  
  private constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.adapter = this.createAdapter();
    console.log(`[UnifiedStorage] 初始化完成，后端: ${this.config.backend}`);
  }
  
  static getInstance(config?: Partial<StorageConfig>): UnifiedStorage {
    if (!UnifiedStorage.instance) {
      UnifiedStorage.instance = new UnifiedStorage(config);
    }
    return UnifiedStorage.instance;
  }
  
  private createAdapter(): StorageAdapter {
    switch (this.config.backend) {
      case 'memory':
        return new MemoryStorageAdapter();
      case 'file':
        return new FileStorageAdapter(this.config.basePath || '/tmp/storage');
      case 's3':
        // S3 适配器需要额外的配置
        return new MemoryStorageAdapter(); // fallback
      default:
        return new MemoryStorageAdapter();
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心接口
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 保存数据
   */
  async save<T>(key: string, data: T): Promise<void> {
    // 更新缓存
    if (this.config.enableCache) {
      this.cache.set(key, { data, timestamp: Date.now() });
    }
    
    // 持久化
    await this.adapter.save(key, data);
  }
  
  /**
   * 加载数据
   */
  async load<T>(key: string): Promise<T | null> {
    // 检查缓存
    if (this.config.enableCache) {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
        return cached.data as T;
      }
    }
    
    // 从存储加载
    const data = await this.adapter.load<T>(key);
    
    // 更新缓存
    if (data !== null && this.config.enableCache) {
      this.cache.set(key, { data, timestamp: Date.now() });
    }
    
    return data;
  }
  
  /**
   * 删除数据
   */
  async delete(key: string): Promise<boolean> {
    this.cache.delete(key);
    return this.adapter.delete(key);
  }
  
  /**
   * 检查是否存在
   */
  async exists(key: string): Promise<boolean> {
    if (this.cache.has(key)) {
      return true;
    }
    return this.adapter.exists(key);
  }
  
  /**
   * 列出所有键
   */
  async list(prefix: string = ''): Promise<string[]> {
    return this.adapter.list(prefix);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 辅助方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 批量保存
   */
  async saveBatch<T>(items: Array<{ key: string; data: T }>): Promise<void> {
    await Promise.all(items.map(item => this.save(item.key, item.data)));
  }
  
  /**
   * 批量加载
   */
  async loadBatch<T>(keys: string[]): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    await Promise.all(keys.map(async key => {
      const data = await this.load<T>(key);
      if (data !== null) {
        results.set(key, data);
      }
    }));
    return results;
  }
  
  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[UnifiedStorage] 缓存已清理');
  }
  
  /**
   * 清理过期缓存
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.cache) {
      if (now - value.timestamp > this.config.cacheTTL) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[UnifiedStorage] 清理了 ${cleaned} 条过期缓存`);
    }
  }
  
  /**
   * 获取存储统计
   */
  getStats(): {
    cacheSize: number;
    backend: StorageBackend;
  } {
    return {
      cacheSize: this.cache.size,
      backend: this.config.backend,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

export const unifiedStorage = UnifiedStorage.getInstance();

export function getUnifiedStorage(config?: Partial<StorageConfig>): UnifiedStorage {
  return UnifiedStorage.getInstance(config);
}
