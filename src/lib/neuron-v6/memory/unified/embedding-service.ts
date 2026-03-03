/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一记忆系统 - 嵌入服务
 * 
 * 为记忆节点生成真实的语义嵌入向量
 * 支持缓存、批量处理和降级方案
 * ═══════════════════════════════════════════════════════════════════════
 */

import { EmbeddingClient, Config } from 'coze-coding-dev-sdk';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface EmbeddingResult {
  /** 嵌入向量 */
  embedding: number[];
  
  /** 向量维度 */
  dimension: number;
  
  /** 是否来自缓存 */
  cached: boolean;
  
  /** 是否使用降级方案 */
  fallback: boolean;
}

export interface EmbeddingServiceConfig {
  /** 目标向量维度（默认1536，匹配OpenAI embedding） */
  dimension: number;
  
  /** 是否启用缓存 */
  enableCache: boolean;
  
  /** 最大缓存条目数 */
  maxCacheSize: number;
  
  /** 是否允许降级到简单编码 */
  allowFallback: boolean;
}

const DEFAULT_CONFIG: EmbeddingServiceConfig = {
  dimension: 1536,
  enableCache: true,
  maxCacheSize: 5000,
  allowFallback: true,
};

// ─────────────────────────────────────────────────────────────────────
// 嵌入服务类
// ─────────────────────────────────────────────────────────────────────

export class EmbeddingService {
  private client: EmbeddingClient | null = null;
  private config: EmbeddingServiceConfig;
  
  // 缓存
  private cache: Map<string, number[]> = new Map();
  
  // 统计
  private stats = {
    totalEncodings: 0,
    cacheHits: 0,
    cacheMisses: 0,
    apiCalls: 0,
    fallbackCalls: 0,
    errors: 0,
  };
  
  constructor(config: Partial<EmbeddingServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 初始化 Embedding 客户端
    try {
      this.client = new EmbeddingClient(new Config());
      console.log('[EmbeddingService] 客户端初始化成功');
    } catch (e) {
      console.warn('[EmbeddingService] 客户端初始化失败，将使用降级方案');
      this.client = null;
    }
  }
  
  /**
   * 生成文本的嵌入向量
   */
  async embed(text: string): Promise<EmbeddingResult> {
    this.stats.totalEncodings++;
    
    // 检查缓存
    if (this.config.enableCache) {
      const cacheKey = this.getCacheKey(text);
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        this.stats.cacheHits++;
        return {
          embedding: cached,
          dimension: cached.length,
          cached: true,
          fallback: false,
        };
      }
    }
    
    this.stats.cacheMisses++;
    
    // 生成嵌入
    let embedding: number[];
    let fallback = false;
    
    if (this.client) {
      try {
        embedding = await this.callAPI(text);
        this.stats.apiCalls++;
      } catch (e) {
        this.stats.errors++;
        
        if (this.config.allowFallback) {
          console.warn('[EmbeddingService] API调用失败，使用降级方案');
          embedding = this.fallbackEmbed(text);
          fallback = true;
          this.stats.fallbackCalls++;
        } else {
          throw e;
        }
      }
    } else {
      embedding = this.fallbackEmbed(text);
      fallback = true;
      this.stats.fallbackCalls++;
    }
    
    // 存入缓存
    if (this.config.enableCache) {
      const cacheKey = this.getCacheKey(text);
      this.cache.set(cacheKey, embedding);
      
      // 清理过期缓存
      if (this.cache.size > this.config.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey) {
          this.cache.delete(firstKey);
        }
      }
    }
    
    return {
      embedding,
      dimension: embedding.length,
      cached: false,
      fallback,
    };
  }
  
  /**
   * 批量生成嵌入向量
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    
    // 可以优化为并行处理
    for (const text of texts) {
      const result = await this.embed(text);
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * 调用嵌入API
   */
  private async callAPI(text: string): Promise<number[]> {
    if (!this.client) {
      throw new Error('Embedding客户端未初始化');
    }
    
    try {
      const embedding = await this.client.embedText(text);
      
      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('API返回空向量');
      }
      
      // 调整维度（如果需要）
      return this.adjustDimension(embedding);
    } catch (e) {
      console.error('[EmbeddingService] API调用失败:', e);
      throw e;
    }
  }
  
  /**
   * 降级方案：简单的基于文本特征的嵌入
   */
  private fallbackEmbed(text: string): number[] {
    const embedding: number[] = [];
    
    // 使用文本的多种特征生成伪向量
    const features = this.extractTextFeatures(text);
    
    // 生成指定维度的向量
    for (let i = 0; i < this.config.dimension; i++) {
      // 使用多个特征混合生成向量值
      const value = (
        Math.sin(features.charCount * (i + 1) * 0.01) * 0.3 +
        Math.cos(features.wordCount * (i + 1) * 0.02) * 0.3 +
        Math.sin(features.hash * (i + 1) * 0.03) * 0.4
      );
      embedding.push(value);
    }
    
    // 归一化
    return this.normalizeVector(embedding);
  }
  
  /**
   * 提取文本特征
   */
  private extractTextFeatures(text: string): {
    charCount: number;
    wordCount: number;
    hash: number;
    uniqueChars: number;
  } {
    // 简单哈希
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return {
      charCount: text.length,
      wordCount: text.split(/[\s\u4e00-\u9fa5]+/).filter(w => w).length,
      hash: Math.abs(hash),
      uniqueChars: new Set(text).size,
    };
  }
  
  /**
   * 调整向量维度
   */
  private adjustDimension(embedding: number[]): number[] {
    const currentDim = embedding.length;
    const targetDim = this.config.dimension;
    
    if (currentDim === targetDim) {
      return embedding;
    }
    
    if (currentDim > targetDim) {
      // 截断
      return embedding.slice(0, targetDim);
    } else {
      // 填充
      const result = [...embedding];
      while (result.length < targetDim) {
        result.push(0);
      }
      return result;
    }
  }
  
  /**
   * 归一化向量
   */
  private normalizeVector(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    
    if (norm === 0) {
      return vector;
    }
    
    return vector.map(v => v / norm);
  }
  
  /**
   * 获取缓存键
   */
  private getCacheKey(text: string): string {
    // 使用文本的简单哈希作为缓存键
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `emb_${hash}_${text.length}`;
  }
  
  /**
   * 获取统计信息
   */
  getStats(): typeof this.stats & { cacheSize: number } {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
    };
  }
  
  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例实例
// ─────────────────────────────────────────────────────────────────────

let defaultInstance: EmbeddingService | null = null;

/**
 * 获取默认嵌入服务实例
 */
export function getEmbeddingService(
  config?: Partial<EmbeddingServiceConfig>
): EmbeddingService {
  if (!defaultInstance) {
    defaultInstance = new EmbeddingService(config);
  }
  return defaultInstance;
}

/**
 * 创建新的嵌入服务实例
 */
export function createEmbeddingService(
  config?: Partial<EmbeddingServiceConfig>
): EmbeddingService {
  return new EmbeddingService(config);
}
