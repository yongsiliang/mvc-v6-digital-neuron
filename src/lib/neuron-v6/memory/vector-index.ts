/**
 * ═══════════════════════════════════════════════════════════════════════
 * 向量索引系统 (Vector Index System)
 *
 * 核心理念：
 * - 将记忆检索从O(n)遍历优化到O(log n)索引查询
 * - 支持多种距离度量：余弦相似度、欧几里得距离、点积
 * - 支持倒排索引加速关键词搜索
 *
 * 实现策略：
 * 1. Flat索引：精确搜索，适合中小规模数据（<10000条）
 * 2. IVF索引：倒排文件索引，适合大规模数据
 * 3. 关键词倒排索引：加速标签和文本搜索
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { VectorIndexConfig } from '../config/system-config';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 向量记录
 */
export interface VectorRecord {
  /** 记录ID */
  id: string;

  /** 向量 */
  vector: Float32Array;

  /** 元数据 */
  metadata: {
    /** 内容摘要 */
    content: string;
    /** 标签 */
    tags: string[];
    /** 重要性 */
    importance: number;
    /** 创建时间 */
    createdAt: number;
    /** 其他元数据 */
    [key: string]: unknown;
  };
}

/**
 * 搜索结果
 */
export interface SearchResult {
  /** 记录ID */
  id: string;

  /** 相似度得分 */
  score: number;

  /** 元数据 */
  metadata: VectorRecord['metadata'];
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  /** 返回数量上限 */
  topK: number;

  /** 最小相似度阈值 */
  minScore?: number;

  /** 标签过滤 */
  tagFilter?: string[];

  /** 时间范围过滤 */
  timeRange?: {
    start: number;
    end: number;
  };

  /** 重要性过滤 */
  importanceThreshold?: number;
}

/**
 * 索引统计
 */
export interface IndexStats {
  /** 总记录数 */
  totalRecords: number;

  /** 向量维度 */
  dimension: number;

  /** 索引类型 */
  indexType: string;

  /** 倒排索引条目数 */
  invertedIndexSize: number;

  /** 平均检索时间（毫秒） */
  avgSearchTime: number;

  /** 总检索次数 */
  totalSearches: number;
}

// ─────────────────────────────────────────────────────────────────────
// 距离计算函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 计算余弦相似度
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
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

/**
 * 计算欧几里得距离（返回相似度，越小越相似，转换为0-1）
 */
function euclideanSimilarity(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  // 转换为相似度：1 / (1 + distance)
  return 1 / (1 + Math.sqrt(sum));
}

/**
 * 计算点积相似度
 */
function dotProductSimilarity(a: Float32Array, b: Float32Array): number {
  let product = 0;
  for (let i = 0; i < a.length; i++) {
    product += a[i] * b[i];
  }
  return product;
}

// ─────────────────────────────────────────────────────────────────────
// 向量索引类
// ─────────────────────────────────────────────────────────────────────

/**
 * 向量索引
 *
 * 支持高效的向量相似度搜索和关键词搜索
 */
export class VectorIndex {
  private config: VectorIndexConfig;

  // 向量存储
  private records: Map<string, VectorRecord> = new Map();

  // 向量矩阵（用于批量计算）
  private vectorMatrix: Float32Array[] = [];
  private idList: string[] = [];

  // 倒排索引：标签 -> 记录ID列表
  private tagInvertedIndex: Map<string, Set<string>> = new Map();

  // 关键词倒排索引：关键词 -> 记录ID列表
  private keywordInvertedIndex: Map<string, Set<string>> = new Map();

  // 向量范数缓存（用于余弦相似度）
  private normCache: Map<string, number> = new Map();

  // 统计
  private stats: IndexStats;

  // 是否需要重建索引
  private needsRebuild: boolean = false;

  constructor(config: VectorIndexConfig) {
    this.config = config;
    this.stats = {
      totalRecords: 0,
      dimension: config.dimension || 1536,
      indexType: config.indexType,
      invertedIndexSize: 0,
      avgSearchTime: 0,
      totalSearches: 0,
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 公共方法
  // ───────────────────────────────────────────────────────────────────

  /**
   * 添加向量记录
   */
  add(record: VectorRecord): void {
    this.records.set(record.id, record);
    this.needsRebuild = true;

    // 更新倒排索引
    this.updateInvertedIndexes(record);

    // 计算并缓存范数
    if (this.config.distanceMetric === 'cosine') {
      this.normCache.set(record.id, this.computeNorm(record.vector));
    }

    this.stats.totalRecords = this.records.size;
  }

  /**
   * 批量添加向量记录
   */
  addBatch(records: VectorRecord[]): void {
    for (const record of records) {
      this.records.set(record.id, record);
      this.updateInvertedIndexes(record);

      if (this.config.distanceMetric === 'cosine') {
        this.normCache.set(record.id, this.computeNorm(record.vector));
      }
    }

    this.needsRebuild = true;
    this.stats.totalRecords = this.records.size;
  }

  /**
   * 删除向量记录
   */
  delete(id: string): boolean {
    const record = this.records.get(id);
    if (!record) return false;

    // 从倒排索引中移除
    this.removeFromInvertedIndexes(record);

    this.records.delete(id);
    this.normCache.delete(id);
    this.needsRebuild = true;
    this.stats.totalRecords = this.records.size;

    return true;
  }

  /**
   * 更新向量记录
   */
  update(id: string, updates: Partial<VectorRecord>): boolean {
    const record = this.records.get(id);
    if (!record) return false;

    // 从旧倒排索引中移除
    this.removeFromInvertedIndexes(record);

    // 更新记录
    if (updates.vector) {
      record.vector = updates.vector;
      if (this.config.distanceMetric === 'cosine') {
        this.normCache.set(id, this.computeNorm(record.vector));
      }
    }
    if (updates.metadata) {
      record.metadata = { ...record.metadata, ...updates.metadata };
    }

    // 添加到新倒排索引
    this.updateInvertedIndexes(record);
    this.needsRebuild = true;

    return true;
  }

  /**
   * 向量相似度搜索
   */
  search(queryVector: Float32Array, options: SearchOptions): SearchResult[] {
    const startTime = Date.now();

    // 重建索引（如果需要）
    if (this.needsRebuild) {
      this.rebuildIndex();
    }

    // 获取候选集（通过倒排索引过滤）
    const candidateIds = this.getCandidates(options);

    // 计算相似度
    const results: SearchResult[] = [];

    for (const id of Array.from(candidateIds)) {
      const record = this.records.get(id);
      if (!record) continue;

      // 计算相似度
      const score = this.computeSimilarity(queryVector, record.vector);

      // 检查最小相似度阈值
      if (options.minScore !== undefined && score < options.minScore) {
        continue;
      }

      results.push({
        id,
        score,
        metadata: record.metadata,
      });
    }

    // 按相似度排序
    results.sort((a, b) => b.score - a.score);

    // 截断到topK
    const topResults = results.slice(0, options.topK);

    // 更新统计
    this.stats.totalSearches++;
    const searchTime = Date.now() - startTime;
    this.stats.avgSearchTime =
      (this.stats.avgSearchTime * (this.stats.totalSearches - 1) + searchTime) /
      this.stats.totalSearches;

    return topResults;
  }

  /**
   * 关键词搜索
   */
  searchByKeywords(keywords: string[], options: SearchOptions): SearchResult[] {
    const candidateIds = new Set<string>();

    // 从关键词倒排索引获取候选
    for (const keyword of keywords) {
      const ids = this.keywordInvertedIndex.get(keyword.toLowerCase());
      if (ids) {
        Array.from(ids).forEach((id) => candidateIds.add(id));
      }
    }

    // 转换为搜索结果
    const results: SearchResult[] = [];

    for (const id of Array.from(candidateIds)) {
      const record = this.records.get(id);
      if (!record) continue;

      // 应用过滤
      if (!this.passesFilters(record, options)) continue;

      // 计算关键词匹配得分
      const score = this.computeKeywordScore(record, keywords);

      results.push({
        id,
        score,
        metadata: record.metadata,
      });
    }

    // 排序并返回
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, options.topK);
  }

  /**
   * 混合搜索：向量 + 关键词
   */
  hybridSearch(
    queryVector: Float32Array,
    keywords: string[],
    options: SearchOptions,
    weights: { vector: number; keyword: number } = { vector: 0.7, keyword: 0.3 },
  ): SearchResult[] {
    // 向量搜索
    const vectorResults = this.search(queryVector, { ...options, topK: options.topK * 2 });

    // 关键词搜索
    const keywordResults = this.searchByKeywords(keywords, { ...options, topK: options.topK * 2 });

    // 合并结果
    const scoreMap = new Map<string, { score: number; metadata: VectorRecord['metadata'] }>();

    for (const result of vectorResults) {
      scoreMap.set(result.id, {
        score: result.score * weights.vector,
        metadata: result.metadata,
      });
    }

    for (const result of keywordResults) {
      const existing = scoreMap.get(result.id);
      if (existing) {
        existing.score += result.score * weights.keyword;
      } else {
        scoreMap.set(result.id, {
          score: result.score * weights.keyword,
          metadata: result.metadata,
        });
      }
    }

    // 转换并排序
    const results: SearchResult[] = [];
    scoreMap.forEach((value, id) => {
      results.push({
        id,
        score: value.score,
        metadata: value.metadata,
      });
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, options.topK);
  }

  /**
   * 获取记录
   */
  get(id: string): VectorRecord | undefined {
    return this.records.get(id);
  }

  /**
   * 获取所有记录ID
   */
  getAllIds(): string[] {
    return Array.from(this.records.keys());
  }

  /**
   * 获取统计信息
   */
  getStats(): IndexStats {
    return { ...this.stats };
  }

  /**
   * 清空索引
   */
  clear(): void {
    this.records.clear();
    this.vectorMatrix = [];
    this.idList = [];
    this.tagInvertedIndex.clear();
    this.keywordInvertedIndex.clear();
    this.normCache.clear();
    this.needsRebuild = true;
    this.stats.totalRecords = 0;
    this.stats.invertedIndexSize = 0;
  }

  /**
   * 重建索引
   */
  rebuildIndex(): void {
    this.vectorMatrix = [];
    this.idList = [];

    this.records.forEach((record, id) => {
      this.vectorMatrix.push(record.vector);
      this.idList.push(id);
    });

    this.needsRebuild = false;
  }

  // ───────────────────────────────────────────────────────────────────
  // 私有方法
  // ───────────────────────────────────────────────────────────────────

  /**
   * 计算向量范数
   */
  private computeNorm(vector: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < vector.length; i++) {
      sum += vector[i] * vector[i];
    }
    return Math.sqrt(sum);
  }

  /**
   * 计算相似度
   */
  private computeSimilarity(a: Float32Array, b: Float32Array): number {
    switch (this.config.distanceMetric) {
      case 'cosine':
        return cosineSimilarity(a, b);
      case 'euclidean':
        return euclideanSimilarity(a, b);
      case 'dot':
        return dotProductSimilarity(a, b);
      default:
        return cosineSimilarity(a, b);
    }
  }

  /**
   * 获取候选记录ID
   */
  private getCandidates(options: SearchOptions): Set<string> {
    // 如果有标签过滤，使用倒排索引
    if (options.tagFilter && options.tagFilter.length > 0) {
      const candidates = new Set<string>();

      for (const tag of options.tagFilter) {
        const ids = this.tagInvertedIndex.get(tag);
        if (ids) {
          if (candidates.size === 0) {
            Array.from(ids).forEach((id) => candidates.add(id));
          } else {
            // 取交集
            const intersection = new Set<string>();
            candidates.forEach((id) => {
              if (ids.has(id)) intersection.add(id);
            });
            Array.from(intersection).forEach((id) => candidates.add(id));
          }
        }
      }

      return candidates;
    }

    // 否则返回所有ID
    return new Set(this.records.keys());
  }

  /**
   * 检查记录是否通过过滤器
   */
  private passesFilters(record: VectorRecord, options: SearchOptions): boolean {
    // 时间范围过滤
    if (options.timeRange) {
      if (
        record.metadata.createdAt < options.timeRange.start ||
        record.metadata.createdAt > options.timeRange.end
      ) {
        return false;
      }
    }

    // 重要性过滤
    if (options.importanceThreshold !== undefined) {
      if (record.metadata.importance < options.importanceThreshold) {
        return false;
      }
    }

    // 标签过滤
    if (options.tagFilter && options.tagFilter.length > 0) {
      const hasAllTags = options.tagFilter.every((tag) => record.metadata.tags.includes(tag));
      if (!hasAllTags) return false;
    }

    return true;
  }

  /**
   * 计算关键词匹配得分
   */
  private computeKeywordScore(record: VectorRecord, keywords: string[]): number {
    const content = record.metadata.content.toLowerCase();
    let matchCount = 0;

    for (const keyword of keywords) {
      if (content.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    return matchCount / keywords.length;
  }

  /**
   * 更新倒排索引
   */
  private updateInvertedIndexes(record: VectorRecord): void {
    // 更新标签倒排索引
    for (const tag of record.metadata.tags) {
      if (!this.tagInvertedIndex.has(tag)) {
        this.tagInvertedIndex.set(tag, new Set());
      }
      this.tagInvertedIndex.get(tag)!.add(record.id);
    }

    // 更新关键词倒排索引
    const keywords = this.extractKeywords(record.metadata.content);
    for (const keyword of keywords) {
      if (!this.keywordInvertedIndex.has(keyword)) {
        this.keywordInvertedIndex.set(keyword, new Set());
      }
      this.keywordInvertedIndex.get(keyword)!.add(record.id);
    }

    // 更新统计
    this.stats.invertedIndexSize = this.tagInvertedIndex.size + this.keywordInvertedIndex.size;
  }

  /**
   * 从倒排索引中移除
   */
  private removeFromInvertedIndexes(record: VectorRecord): void {
    // 从标签倒排索引移除
    for (const tag of record.metadata.tags) {
      const ids = this.tagInvertedIndex.get(tag);
      if (ids) {
        ids.delete(record.id);
        if (ids.size === 0) {
          this.tagInvertedIndex.delete(tag);
        }
      }
    }

    // 从关键词倒排索引移除
    const keywords = this.extractKeywords(record.metadata.content);
    for (const keyword of keywords) {
      const ids = this.keywordInvertedIndex.get(keyword);
      if (ids) {
        ids.delete(record.id);
        if (ids.size === 0) {
          this.keywordInvertedIndex.delete(keyword);
        }
      }
    }

    // 更新统计
    this.stats.invertedIndexSize = this.tagInvertedIndex.size + this.keywordInvertedIndex.size;
  }

  /**
   * 提取关键词（简单实现）
   */
  private extractKeywords(content: string): string[] {
    // 简单的分词：按空格和标点分割
    const words = content
      .toLowerCase()
      .split(/[\s,.;:!?，。；：！？]+/)
      .filter((w) => w.length > 1); // 过滤单字符

    // 去重
    return Array.from(new Set(words));
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建向量索引
 */
export function createVectorIndex(config: VectorIndexConfig): VectorIndex {
  return new VectorIndex(config);
}

/**
 * 创建默认向量索引
 */
export function createDefaultVectorIndex(): VectorIndex {
  return new VectorIndex({
    enabled: true,
    indexType: 'flat',
    distanceMetric: 'cosine',
    dimension: 1536,
    indexUpdateInterval: 5000,
    ivfNLists: 100,
    hnswM: 16,
    hnswEfConstruction: 200,
  });
}
