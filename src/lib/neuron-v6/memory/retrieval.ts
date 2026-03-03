/**
 * ═══════════════════════════════════════════════════════════════════════
 * 记忆检索系统 (Memory Retrieval System)
 * 
 * 核心功能：
 * - 智能记忆检索
 * - 时间衰减权重
 * - 重要性权重
 * - 访问频率权重
 * - 关联性检索
 * 
 * 设计原则：
 * - 检索不只是关键词匹配
 * - 记忆的价值随时间衰减
 * - 重要的记忆更容易被检索
 * - 经常被访问的记忆更容易被检索
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 检索选项 */
export interface RetrievalOptions {
  /** 最大结果数 */
  maxResults: number;
  
  /** 是否包含情景记忆 */
  includeEpisodic: boolean;
  
  /** 是否包含巩固记忆 */
  includeConsolidated: boolean;
  
  /** 是否包含核心记忆 */
  includeCore: boolean;
  
  /** 时间衰减因子（0 = 不衰减，1 = 完全衰减） */
  timeDecayFactor: number;
  
  /** 重要性权重 */
  importanceWeight: number;
  
  /** 访问频率权重 */
  accessWeight: number;
  
  /** 相关性权重 */
  relevanceWeight: number;
  
  /** 最小相关性阈值 */
  minRelevance: number;
}

/** 检索结果项 */
export interface RetrievalResultItem<T> {
  memory: T;
  score: number;
  components: {
    relevance: number;
    timeDecay: number;
    importance: number;
    accessBoost: number;
  };
}

/** 检索结果 */
export interface RetrievalResult<T> {
  items: RetrievalResultItem<T>[];
  query: string;
  totalTime: number;
  stats: {
    searchedCount: number;
    matchedCount: number;
    avgScore: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: RetrievalOptions = {
  maxResults: 10,
  includeEpisodic: true,
  includeConsolidated: true,
  includeCore: true,
  timeDecayFactor: 0.3,
  importanceWeight: 0.3,
  accessWeight: 0.2,
  relevanceWeight: 0.5,
  minRelevance: 0.1,
};

// ─────────────────────────────────────────────────────────────────────
// 记忆检索器
// ─────────────────────────────────────────────────────────────────────

/**
 * 记忆检索器
 */
export class MemoryRetriever {
  private options: RetrievalOptions;
  
  constructor(options: Partial<RetrievalOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * 检索记忆
   * @param query 查询字符串
   * @param memories 记忆列表
   * @param getContent 获取记忆内容的函数
   * @param getTimestamp 获取记忆时间戳的函数
   * @param getImportance 获取记忆重要性的函数
   * @param getAccessCount 获取记忆访问次数的函数
   */
  retrieve<T>(
    query: string,
    memories: T[],
    getContent: (m: T) => string,
    getTimestamp: (m: T) => number,
    getImportance: (m: T) => number,
    getAccessCount: (m: T) => number,
  ): RetrievalResult<T> {
    const startTime = Date.now();
    const queryLower = query.toLowerCase();
    const now = Date.now();
    
    const results: RetrievalResultItem<T>[] = [];
    
    for (const memory of memories) {
      const content = getContent(memory);
      const timestamp = getTimestamp(memory);
      const importance = getImportance(memory);
      const accessCount = getAccessCount(memory);
      
      // 1. 计算相关性
      const relevance = this.calculateRelevance(content, queryLower);
      if (relevance < this.options.minRelevance) {
        continue;
      }
      
      // 2. 计算时间衰减
      const timeDecay = this.calculateTimeDecay(timestamp, now);
      
      // 3. 计算重要性加成
      const importanceBoost = importance;
      
      // 4. 计算访问频率加成
      const accessBoost = this.calculateAccessBoost(accessCount);
      
      // 5. 综合分数
      const score =
        relevance * this.options.relevanceWeight +
        timeDecay * this.options.timeDecayFactor +
        importanceBoost * this.options.importanceWeight +
        accessBoost * this.options.accessWeight;
      
      results.push({
        memory,
        score,
        components: {
          relevance,
          timeDecay,
          importance: importanceBoost,
          accessBoost,
        },
      });
    }
    
    // 按分数排序
    results.sort((a, b) => b.score - a.score);
    
    // 取前 N 个
    const topResults = results.slice(0, this.options.maxResults);
    
    const totalTime = Date.now() - startTime;
    const avgScore = topResults.length > 0
      ? topResults.reduce((sum, r) => sum + r.score, 0) / topResults.length
      : 0;
    
    return {
      items: topResults,
      query,
      totalTime,
      stats: {
        searchedCount: memories.length,
        matchedCount: results.length,
        avgScore,
      },
    };
  }
  
  /**
   * 计算相关性
   */
  private calculateRelevance(content: string, queryLower: string): number {
    const contentLower = content.toLowerCase();
    
    // 完全匹配
    if (contentLower === queryLower) {
      return 1.0;
    }
    
    // 包含匹配
    if (contentLower.includes(queryLower)) {
      // 根据匹配长度比例调整分数
      return 0.7 + 0.3 * (queryLower.length / contentLower.length);
    }
    
    // 反向包含（查询包含内容）
    if (queryLower.includes(contentLower)) {
      return 0.6;
    }
    
    // 关键词匹配
    const queryWords = this.extractKeywords(queryLower);
    const contentWords = this.extractKeywords(contentLower);
    
    if (queryWords.length === 0) {
      return 0;
    }
    
    let matchCount = 0;
    for (const qWord of queryWords) {
      for (const cWord of contentWords) {
        if (qWord === cWord) {
          matchCount += 1;
        } else if (qWord.includes(cWord) || cWord.includes(qWord)) {
          matchCount += 0.7;
        }
      }
    }
    
    const matchRatio = matchCount / queryWords.length;
    
    if (matchRatio > 0) {
      return 0.2 + matchRatio * 0.5;
    }
    
    // 语义相似度（简化版：基于共同字符）
    const similarity = this.calculateCharSimilarity(contentLower, queryLower);
    if (similarity > 0.3) {
      return similarity * 0.3;
    }
    
    return 0;
  }
  
  /**
   * 计算时间衰减
   * 使用指数衰减：score = e^(-kt)，其中 k 是衰减常数
   */
  private calculateTimeDecay(timestamp: number, now: number): number {
    const ageMs = now - timestamp;
    const ageHours = ageMs / (1000 * 60 * 60);
    
    // 不同时间尺度的衰减
    if (ageHours < 1) {
      // 1小时内：几乎不衰减
      return 1.0;
    } else if (ageHours < 24) {
      // 1天内：轻微衰减
      return Math.exp(-ageHours / 48);
    } else if (ageHours < 168) {
      // 1周内：中等衰减
      return Math.exp(-ageHours / 96);
    } else {
      // 超过1周：显著衰减
      return Math.exp(-ageHours / 168);
    }
  }
  
  /**
   * 计算访问频率加成
   * 使用对数函数：accessBoost = log(1 + count) / log(1 + maxCount)
   */
  private calculateAccessBoost(accessCount: number): number {
    if (accessCount === 0) return 0;
    
    // 对数增长，避免访问次数过多导致分数过高
    return Math.log10(1 + accessCount) / 2; // 最多约 0.5
  }
  
  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 停用词（中文常见）
    const stopWords = new Set([
      '的', '是', '在', '了', '和', '与', '有', '我', '你', '他',
      '她', '它', '这', '那', '有', '个', '也', '就', '都', '要',
      '会', '能', '不', '没', '很', '更', '最', '好', '对', '说',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'must', 'can', 'to', 'of',
      'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
    ]);
    
    // 分词（简化版：按空格和标点分割）
    const words = text
      .replace(/[，。！？、；：""''（）【】《》]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.has(w));
    
    return [...new Set(words)];
  }
  
  /**
   * 计算字符相似度（简化版 Jaccard 相似度）
   */
  private calculateCharSimilarity(text1: string, text2: string): number {
    const chars1 = new Set(text1.split(''));
    const chars2 = new Set(text2.split(''));
    
    const intersection = new Set([...chars1].filter(c => chars2.has(c)));
    const union = new Set([...chars1, ...chars2]);
    
    return intersection.size / union.size;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createMemoryRetriever(options?: Partial<RetrievalOptions>): MemoryRetriever {
  return new MemoryRetriever(options);
}
