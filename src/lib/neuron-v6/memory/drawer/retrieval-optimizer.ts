/**
 * ═══════════════════════════════════════════════════════════════════════
 * 检索优化器 - RetrievalOptimizer
 * 
 * 核心理念（王昱珩的"检索优先于存储"）：
 * 1. 好的记忆系统 ≠ 存得多
 * 2. 好的记忆系统 = 找得快 + 找得准 + 找得省力
 * 3. 检索效率 > 存储容量
 * 
 * 检索层级：
 * 第一层：直接命中的标签
 * 第二层：关键词匹配的内容
 * 第三层：时间范围筛选
 * 第四层：关联线索追踪
 * 第五层：折叠记忆的深度搜索（最慢，但可用）
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  MemoryDrawer,
  DrawerItem,
  DrawerCategory,
  SearchOptions,
  SearchResult,
  SearchResultItem,
  IndexedMemoryRef,
  DrawerSystemState,
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 默认搜索选项
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  includeFolded: true,
  autoUnfold: false,
  maxResults: 20,
  depth: 'normal',
};

// ─────────────────────────────────────────────────────────────────────
// 检索优化器类
// ─────────────────────────────────────────────────────────────────────

export class RetrievalOptimizer {
  private state: DrawerSystemState;

  constructor(state: DrawerSystemState) {
    this.state = state;
  }

  // ───────────────────────────────────────────────────────────────────
  // 核心搜索
  // ───────────────────────────────────────────────────────────────────

  /**
   * 搜索记忆
   */
  search(query: string, options: Partial<SearchOptions> = {}): SearchResult {
    const opts = { ...DEFAULT_SEARCH_OPTIONS, ...options };
    const startTime = Date.now();
    const items: SearchResultItem[] = [];
    const sources = {
      activeDrawers: 0,
      foldedMemories: 0,
      associationTrails: 0,
    };

    // 第一层：标签直接命中
    const labelResults = this.searchByLabel(query, opts);
    items.push(...labelResults);
    sources.activeDrawers += labelResults.length;

    // 第二层：关键词匹配
    const keywordResults = this.searchByKeywords(query, opts);
    this.mergeResults(items, keywordResults);
    sources.activeDrawers += keywordResults.filter(r => !r.fromFolded).length;

    // 第三层：时间范围筛选
    if (opts.timeRange) {
      const timeResults = this.searchByTimeRange(opts.timeRange, opts);
      this.mergeResults(items, timeResults);
    }

    // 第四层：关联线索追踪
    if (opts.depth === 'deep') {
      const associationResults = this.searchByAssociations(query, items);
      this.mergeResults(items, associationResults);
      sources.associationTrails = associationResults.length;
    }

    // 第五层：折叠记忆深度搜索
    if (opts.includeFolded) {
      const foldedResults = this.searchFoldedMemories(query, opts);
      this.mergeResults(items, foldedResults);
      sources.foldedMemories = foldedResults.length;
    }

    // 排序和限制
    const sortedItems = this.prioritizeResults(items, query);
    const limitedItems = sortedItems.slice(0, opts.maxResults);

    return {
      items: limitedItems,
      totalMatches: items.length,
      searchTime: Date.now() - startTime,
      sources,
    };
  }

  /**
   * 按标签搜索
   */
  searchByLabel(query: string, options: SearchOptions): SearchResultItem[] {
    const results: SearchResultItem[] = [];
    const queryLower = query.toLowerCase();

    // 从标签索引查找
    const labelIndex = this.state.index.labelIndex;
    
    for (const [label, drawerIds] of labelIndex) {
      if (label.includes(queryLower)) {
        for (const drawerId of drawerIds) {
          // 检查抽屉是否在搜索范围内
          if (options.drawerIds && !options.drawerIds.includes(drawerId)) {
            continue;
          }

          const drawer = this.state.drawers.get(drawerId);
          if (!drawer) continue;

          // 检查分类过滤
          if (options.categories && !options.categories.includes(drawer.category)) {
            continue;
          }

          // 添加抽屉内未折叠的记忆
          for (const item of drawer.contents) {
            if (item.folded && !options.includeFolded) continue;

            results.push({
              ref: {
                memoryId: item.memoryId,
                drawerId: drawer.id,
                relevanceScore: 1.0,
                folded: item.folded,
                keywords: [],
                timestamp: item.addedAt,
              },
              matchType: 'tag',
              score: 0.9,
              matchedSegments: [label],
              fromFolded: item.folded,
            });
          }
        }
      }
    }

    return results;
  }

  /**
   * 按关键词搜索
   */
  searchByKeywords(query: string, options: SearchOptions): SearchResultItem[] {
    const results: SearchResultItem[] = [];
    const queryKeywords = this.tokenize(query);

    const contentIndex = this.state.index.contentIndex;

    for (const keyword of queryKeywords) {
      const refs = contentIndex.get(keyword) || [];

      for (const ref of refs) {
        // 检查抽屉范围
        if (options.drawerIds && !options.drawerIds.includes(ref.drawerId)) {
          continue;
        }

        // 检查折叠状态
        if (ref.folded && !options.includeFolded) {
          continue;
        }

        // 检查最小相关性
        if (options.minRelevance && ref.relevanceScore < options.minRelevance) {
          continue;
        }

        // 检查时间范围
        if (options.timeRange) {
          if (ref.timestamp < options.timeRange.start || ref.timestamp > options.timeRange.end) {
            continue;
          }
        }

        results.push({
          ref,
          matchType: 'keyword',
          score: ref.relevanceScore * 0.8,
          matchedSegments: [keyword],
          fromFolded: ref.folded,
        });
      }
    }

    return results;
  }

  /**
   * 按时间范围搜索
   */
  searchByTimeRange(
    range: { start: number; end: number },
    options: SearchOptions
  ): SearchResultItem[] {
    const results: SearchResultItem[] = [];

    // 从时间索引查找
    const startDate = new Date(range.start).toISOString().slice(0, 10);
    const endDate = new Date(range.end).toISOString().slice(0, 10);

    for (const [dayKey, refs] of this.state.index.timeIndex) {
      if (dayKey >= startDate && dayKey <= endDate) {
        for (const ref of refs) {
          // 检查抽屉范围
          if (options.drawerIds && !options.drawerIds.includes(ref.drawerId)) {
            continue;
          }

          // 检查折叠状态
          if (ref.folded && !options.includeFolded) {
            continue;
          }

          results.push({
            ref,
            matchType: 'time',
            score: 0.5,
            matchedSegments: [dayKey],
            fromFolded: ref.folded,
          });
        }
      }
    }

    return results;
  }

  /**
   * 按关联线索搜索
   */
  searchByAssociations(query: string, existingResults: SearchResultItem[]): SearchResultItem[] {
    const results: SearchResultItem[] = [];
    const visitedMemoryIds = new Set(existingResults.map(r => r.ref.memoryId));

    // 从已有结果出发，追踪关联
    for (const result of existingResults) {
      const associations = this.state.index.associationIndex.get(result.ref.memoryId) || [];

      for (const associatedId of associations) {
        if (visitedMemoryIds.has(associatedId)) continue;
        visitedMemoryIds.add(associatedId);

        // 找到关联记忆的引用
        const ref = this.findMemoryRef(associatedId);
        if (ref) {
          results.push({
            ref,
            matchType: 'association',
            score: result.score * 0.6,
            matchedSegments: [`关联: ${result.ref.memoryId}`],
            fromFolded: ref.folded,
          });
        }
      }
    }

    return results;
  }

  /**
   * 搜索折叠的记忆
   */
  searchFoldedMemories(query: string, options: SearchOptions): SearchResultItem[] {
    const results: SearchResultItem[] = [];
    const queryKeywords = this.tokenize(query);

    for (const [memoryId, ref] of this.state.index.foldedIndex) {
      // 检查抽屉范围
      if (options.drawerIds && !options.drawerIds.includes(ref.drawerId)) {
        continue;
      }

      // 检查关键词匹配
      const matchedKeywords = queryKeywords.filter(k => 
        ref.indexKeywords.some(kw => kw.includes(k))
      );

      if (matchedKeywords.length > 0) {
        results.push({
          ref: {
            memoryId,
            drawerId: ref.drawerId,
            relevanceScore: matchedKeywords.length / queryKeywords.length,
            folded: true,
            keywords: ref.indexKeywords,
            timestamp: ref.foldedAt,
          },
          matchType: 'keyword',
          score: matchedKeywords.length / queryKeywords.length * 0.5,
          matchedSegments: matchedKeywords,
          fromFolded: true,
        });
      }
    }

    return results;
  }

  // ───────────────────────────────────────────────────────────────────
  // 结果处理
  // ───────────────────────────────────────────────────────────────────

  /**
   * 合并搜索结果（去重）
   */
  private mergeResults(
    target: SearchResultItem[],
    source: SearchResultItem[]
  ): void {
    const existingIds = new Set(target.map(r => r.ref.memoryId));

    for (const item of source) {
      if (!existingIds.has(item.ref.memoryId)) {
        target.push(item);
        existingIds.add(item.ref.memoryId);
      } else {
        // 更新分数（取最高）
        const existing = target.find(r => r.ref.memoryId === item.ref.memoryId);
        if (existing && item.score > existing.score) {
          existing.score = item.score;
          existing.matchType = item.matchType;
          existing.matchedSegments.push(...item.matchedSegments);
        }
      }
    }
  }

  /**
   * 排序结果
   */
  prioritizeResults(items: SearchResultItem[], query: string): SearchResultItem[] {
    return items.sort((a, b) => {
      // 1. 匹配类型优先级
      const typePriority: Record<string, number> = {
        exact: 5,
        tag: 4,
        keyword: 3,
        association: 2,
        time: 1,
      };
      const typeDiff = (typePriority[b.matchType] || 0) - (typePriority[a.matchType] || 0);
      if (typeDiff !== 0) return typeDiff;

      // 2. 分数优先
      if (b.score !== a.score) return b.score - a.score;

      // 3. 非折叠优先
      if (a.fromFolded !== b.fromFolded) return a.fromFolded ? 1 : -1;

      // 4. 时间优先
      return b.ref.timestamp - a.ref.timestamp;
    });
  }

  // ───────────────────────────────────────────────────────────────────
  // 快捷检索
  // ───────────────────────────────────────────────────────────────────

  /**
   * 从打开的抽屉快速检索
   */
  quickSearchFromOpenDrawers(query: string): SearchResultItem[] {
    const results: SearchResultItem[] = [];
    const queryLower = query.toLowerCase();

    for (const drawerId of this.state.openDrawers) {
      const drawer = this.state.drawers.get(drawerId);
      if (!drawer) continue;

      for (const item of drawer.contents) {
        if (item.folded) continue;

        if (item.memory.content.toLowerCase().includes(queryLower)) {
          results.push({
            ref: {
              memoryId: item.memoryId,
              drawerId: drawer.id,
              relevanceScore: 1,
              folded: false,
              keywords: [],
              timestamp: item.addedAt,
            },
            matchType: 'keyword',
            score: 1,
            matchedSegments: [query],
            fromFolded: false,
          });
        }
      }
    }

    return results;
  }

  /**
   * 从焦点抽屉检索
   */
  searchFromFocusedDrawer(query: string): SearchResultItem[] {
    if (!this.state.focusedDrawer) return [];

    const drawer = this.state.drawers.get(this.state.focusedDrawer);
    if (!drawer) return [];

    const results: SearchResultItem[] = [];
    const queryLower = query.toLowerCase();

    for (const item of drawer.contents) {
      if (item.memory.content.toLowerCase().includes(queryLower)) {
        results.push({
          ref: {
            memoryId: item.memoryId,
            drawerId: drawer.id,
            relevanceScore: item.localPriority,
            folded: item.folded,
            keywords: [],
            timestamp: item.addedAt,
          },
          matchType: 'keyword',
          score: item.localPriority,
          matchedSegments: [query],
          fromFolded: item.folded,
        });
      }
    }

    return results;
  }

  /**
   * 按分类快速检索
   */
  searchByCategory(
    category: DrawerCategory,
    options: Partial<SearchOptions> = {}
  ): SearchResultItem[] {
    const opts = { ...DEFAULT_SEARCH_OPTIONS, ...options };
    const results: SearchResultItem[] = [];
    const drawerIds = this.state.index.categoryIndex.get(category) || [];

    for (const drawerId of drawerIds) {
      const drawer = this.state.drawers.get(drawerId);
      if (!drawer) continue;

      for (const item of drawer.contents) {
        if (item.folded && !opts.includeFolded) continue;

        results.push({
          ref: {
            memoryId: item.memoryId,
            drawerId: drawer.id,
            relevanceScore: item.localPriority,
            folded: item.folded,
            keywords: [],
            timestamp: item.addedAt,
          },
          matchType: 'tag',
          score: item.localPriority,
          matchedSegments: [category],
          fromFolded: item.folded,
        });
      }
    }

    return results;
  }

  // ───────────────────────────────────────────────────────────────────
  // 索引构建
  // ───────────────────────────────────────────────────────────────────

  /**
   * 重建索引
   */
  rebuildIndex(): {
    indexed: number;
    duration: number;
  } {
    const startTime = Date.now();
    let indexed = 0;

    // 清空现有索引
    this.state.index.contentIndex.clear();
    this.state.index.timeIndex.clear();
    this.state.index.associationIndex.clear();
    this.state.index.labelIndex.clear();

    // 重建索引
    for (const drawer of this.state.drawers.values()) {
      // 标签索引
      const labelWords = drawer.label.toLowerCase().split(/\s+/);
      for (const word of labelWords) {
        const existing = this.state.index.labelIndex.get(word) || [];
        if (!existing.includes(drawer.id)) {
          existing.push(drawer.id);
          this.state.index.labelIndex.set(word, existing);
        }
      }

      // 内容索引
      for (const item of drawer.contents) {
        const keywords = this.tokenize(item.memory.content);
        const ref: IndexedMemoryRef = {
          memoryId: item.memoryId,
          drawerId: drawer.id,
          relevanceScore: item.memory.importance,
          folded: item.folded,
          keywords,
          timestamp: item.memory.createdAt,
        };

        for (const keyword of keywords) {
          const existing = this.state.index.contentIndex.get(keyword) || [];
          existing.push(ref);
          this.state.index.contentIndex.set(keyword, existing);
        }

        // 时间索引
        const dayKey = new Date(item.memory.createdAt).toISOString().slice(0, 10);
        const timeRefs = this.state.index.timeIndex.get(dayKey) || [];
        timeRefs.push(ref);
        this.state.index.timeIndex.set(dayKey, timeRefs);

        // 关联索引
        for (const assoc of item.memory.associations) {
          const existing = this.state.index.associationIndex.get(item.memoryId) || [];
          if (!existing.includes(assoc.targetId)) {
            existing.push(assoc.targetId);
            this.state.index.associationIndex.set(item.memoryId, existing);
          }
        }

        indexed++;
      }
    }

    // 更新统计
    this.state.index.stats = {
      totalIndexed: indexed,
      foldedCount: this.state.index.foldedIndex.size,
      labelCount: this.state.index.labelIndex.size,
      keywordCount: this.state.index.contentIndex.size,
      lastUpdated: Date.now(),
    };

    return {
      indexed,
      duration: Date.now() - startTime,
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 辅助方法
  // ───────────────────────────────────────────────────────────────────

  private tokenize(text: string): string[] {
    const stopWords = new Set([
      '的', '是', '在', '和', '了', '有', '我', '他', '她', '它',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    ]);

    return text.toLowerCase()
      .split(/[\s\p{P}]+/u)
      .filter(w => w.length > 1 && !stopWords.has(w));
  }

  private findMemoryRef(memoryId: string): IndexedMemoryRef | null {
    // 在内容索引中查找
    for (const refs of this.state.index.contentIndex.values()) {
      const ref = refs.find(r => r.memoryId === memoryId);
      if (ref) return ref;
    }

    // 在折叠索引中查找
    const foldedRef = this.state.index.foldedIndex.get(memoryId);
    if (foldedRef) {
      return {
        memoryId,
        drawerId: foldedRef.drawerId,
        relevanceScore: 0.5,
        folded: true,
        keywords: foldedRef.indexKeywords,
        timestamp: foldedRef.foldedAt,
      };
    }

    return null;
  }

  // ───────────────────────────────────────────────────────────────────
  // 统计接口
  // ───────────────────────────────────────────────────────────────────

  getIndexStats(): {
    totalIndexed: number;
    keywordCount: number;
    labelCount: number;
    foldedCount: number;
    avgKeywordsPerMemory: number;
  } {
    const stats = this.state.index.stats;
    return {
      totalIndexed: stats.totalIndexed,
      keywordCount: stats.keywordCount,
      labelCount: stats.labelCount,
      foldedCount: stats.foldedCount,
      avgKeywordsPerMemory: stats.totalIndexed > 0
        ? stats.keywordCount / stats.totalIndexed
        : 0,
    };
  }
}
