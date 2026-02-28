/**
 * ═══════════════════════════════════════════════════════════════════════
 * Vector Encoder - 向量编码器
 * 
 * 使用真正的 Embedding API 将文本转换为向量
 * 支持缓存和批量处理
 * ═══════════════════════════════════════════════════════════════════════
 */

import { EmbeddingClient, Config } from 'coze-coding-dev-sdk';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface EncodingResult {
  vector: Float32Array;
  dimension: number;
  cached: boolean;
  timestamp: number;
}

export interface EncoderStats {
  totalEncodings: number;
  cacheHits: number;
  cacheMisses: number;
  averageTime: number;
}

// ─────────────────────────────────────────────────────────────────────
// 向量编码器
// ─────────────────────────────────────────────────────────────────────

export class VectorEncoder {
  private client: EmbeddingClient | null = null;
  private dimension: number;
  
  // 缓存
  private cache: Map<string, EncodingResult> = new Map();
  private maxCacheSize: number = 10000;
  
  // 统计
  private stats = {
    totalEncodings: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalTime: 0,
  };
  
  constructor(dimension: number = 256) {
    this.dimension = dimension;
    
    // 初始化 Embedding 客户端
    try {
      this.client = new EmbeddingClient(new Config());
      console.log('[VectorEncoder] Embedding 客户端初始化成功');
    } catch (e) {
      console.warn('[VectorEncoder] Embedding 客户端初始化失败，将使用备用编码');
      this.client = null;
    }
  }
  
  /**
   * 编码文本为向量
   */
  async encode(text: string): Promise<Float32Array> {
    const startTime = Date.now();
    this.stats.totalEncodings++;
    
    // 检查缓存
    const cacheKey = this.getCacheKey(text);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      this.stats.cacheHits++;
      return cached.vector;
    }
    
    this.stats.cacheMisses++;
    
    let vector: Float32Array;
    
    if (this.client) {
      // 使用真正的 Embedding API
      try {
        vector = await this.encodeWithAPI(text);
      } catch (e) {
        // API 失败时使用备用编码
        console.warn('[VectorEncoder] API 编码失败，使用备用');
        vector = this.fallbackEncode(text);
      }
    } else {
      // 没有客户端时使用备用编码
      vector = this.fallbackEncode(text);
    }
    
    // 存入缓存
    const result: EncodingResult = {
      vector,
      dimension: this.dimension,
      cached: false,
      timestamp: Date.now(),
    };
    
    this.cache.set(cacheKey, result);
    
    // 限制缓存大小
    if (this.cache.size > this.maxCacheSize) {
      // 删除最旧的条目
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.stats.totalTime += Date.now() - startTime;
    
    return vector;
  }
  
  /**
   * 批量编码
   */
  async encodeBatch(texts: string[]): Promise<Float32Array[]> {
    const results: Float32Array[] = [];
    
    // 分组处理：缓存命中的直接取，未命中的批量调用 API
    const uncachedTexts: string[] = [];
    const uncachedIndices: number[] = [];
    
    for (let i = 0; i < texts.length; i++) {
      const cacheKey = this.getCacheKey(texts[i]);
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        results[i] = cached.vector;
        this.stats.cacheHits++;
      } else {
        uncachedTexts.push(texts[i]);
        uncachedIndices.push(i);
        this.stats.cacheMisses++;
      }
      
      this.stats.totalEncodings++;
    }
    
    // 批量编码未缓存的
    if (uncachedTexts.length > 0 && this.client) {
      try {
        const vectors = await this.encodeBatchWithAPI(uncachedTexts);
        
        for (let i = 0; i < vectors.length; i++) {
          const originalIndex = uncachedIndices[i];
          results[originalIndex] = vectors[i];
          
          // 存入缓存
          const cacheKey = this.getCacheKey(uncachedTexts[i]);
          this.cache.set(cacheKey, {
            vector: vectors[i],
            dimension: this.dimension,
            cached: false,
            timestamp: Date.now(),
          });
        }
      } catch (e) {
        // 批量失败，逐个使用备用编码
        for (const idx of uncachedIndices) {
          results[idx] = this.fallbackEncode(texts[idx]);
        }
      }
    } else {
      // 没有客户端，逐个备用编码
      for (const idx of uncachedIndices) {
        results[idx] = this.fallbackEncode(texts[idx]);
      }
    }
    
    return results;
  }
  
  /**
   * 使用 API 编码
   */
  private async encodeWithAPI(text: string): Promise<Float32Array> {
    if (!this.client) {
      throw new Error('Embedding 客户端未初始化');
    }
    
    try {
      // 调用 Embedding API - 使用 embedText 方法
      const embedding = await this.client.embedText(text);
      
      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Embedding API 返回空向量');
      }
      
      // 转换为 Float32Array 并调整维度
      return this.adjustDimension(new Float32Array(embedding));
    } catch (e) {
      console.warn('[VectorEncoder] API 调用失败:', e);
      throw e;
    }
  }
  
  /**
   * 批量使用 API 编码
   */
  private async encodeBatchWithAPI(texts: string[]): Promise<Float32Array[]> {
    // 简化：逐个编码
    const results: Float32Array[] = [];
    for (const text of texts) {
      try {
        const vector = await this.encodeWithAPI(text);
        results.push(vector);
      } catch {
        results.push(this.fallbackEncode(text));
      }
    }
    return results;
  }
  
  /**
   * 备用编码（当 API 不可用时）
   * 基于字符的简单编码
   */
  private fallbackEncode(text: string): Float32Array {
    const vector = new Float32Array(this.dimension);
    
    // 方法1: 字符频率
    const charFreq = new Map<string, number>();
    for (const char of text) {
      charFreq.set(char, (charFreq.get(char) || 0) + 1);
    }
    
    // 方法2: N-gram 频率
    const ngrams = new Map<string, number>();
    for (let i = 0; i < text.length - 2; i++) {
      const ngram = text.slice(i, i + 3);
      ngrams.set(ngram, (ngrams.get(ngram) || 0) + 1);
    }
    
    // 方法3: 基本统计
    const stats = {
      length: text.length,
      words: text.split(/\s+/).length,
      avgWordLength: text.length / (text.split(/\s+/).length || 1),
      punctuation: (text.match(/[.,!?;:]/g) || []).length,
      digits: (text.match(/\d/g) || []).length,
      uppercase: (text.match(/[A-Z]/g) || []).length,
    };
    
    // 填充向量
    for (let i = 0; i < this.dimension; i++) {
      // 组合多种特征
      const charFeature = text.charCodeAt(i % text.length) / 65535;
      const ngramFeature = (ngrams.get(text.slice(i % (text.length - 2), i % (text.length - 2) + 3)) || 0) / 10;
      const statFeature = Object.values(stats)[i % 6] / 100;
      
      // 加权组合
      vector[i] = Math.tanh(charFeature * 0.5 + ngramFeature * 0.3 + statFeature * 0.2);
    }
    
    // 归一化
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }
    
    return vector;
  }
  
  /**
   * 调整向量维度
   */
  private adjustDimension(vector: Float32Array): Float32Array {
    if (vector.length === this.dimension) {
      return vector;
    }
    
    const result = new Float32Array(this.dimension);
    
    if (vector.length > this.dimension) {
      // 降维：截断或平均
      const ratio = vector.length / this.dimension;
      for (let i = 0; i < this.dimension; i++) {
        const start = Math.floor(i * ratio);
        const end = Math.floor((i + 1) * ratio);
        let sum = 0;
        for (let j = start; j < end; j++) {
          sum += vector[j];
        }
        result[i] = sum / (end - start || 1);
      }
    } else {
      // 升维：复制并插值
      for (let i = 0; i < this.dimension; i++) {
        const idx = i % vector.length;
        const nextIdx = (idx + 1) % vector.length;
        const t = (i % vector.length) / vector.length;
        result[i] = vector[idx] * (1 - t) + vector[nextIdx] * t;
      }
    }
    
    // 归一化
    const norm = Math.sqrt(result.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < result.length; i++) {
        result[i] /= norm;
      }
    }
    
    return result;
  }
  
  /**
   * 生成缓存键
   */
  private getCacheKey(text: string): string {
    // 使用文本的简单哈希作为键
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `${text.length}_${hash}`;
  }
  
  /**
   * 计算向量相似度
   */
  cosineSimilarity(a: Float32Array, b: Float32Array): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * 获取统计信息
   */
  getStats(): EncoderStats {
    return {
      totalEncodings: this.stats.totalEncodings,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      averageTime: this.stats.totalEncodings > 0 
        ? this.stats.totalTime / this.stats.totalEncodings 
        : 0,
    };
  }
  
  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[VectorEncoder] 缓存已清除');
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例
// ─────────────────────────────────────────────────────────────────────

let encoderInstance: VectorEncoder | null = null;

export function getVectorEncoder(dimension: number = 256): VectorEncoder {
  if (!encoderInstance) {
    encoderInstance = new VectorEncoder(dimension);
  }
  return encoderInstance;
}
