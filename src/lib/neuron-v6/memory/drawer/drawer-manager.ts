/**
 * ═══════════════════════════════════════════════════════════════════════
 * 抽屉管理器 - DrawerManager
 * 
 * 核心职责：
 * 1. 创建和管理记忆抽屉
 * 2. 将记忆分配到合适的抽屉
 * 3. 控制抽屉的打开/关闭状态
 * 4. 维护抽屉间的层级关系
 * 
 * 设计理念（王昱珩的记忆方法）：
 * - 抽屉不是用来"装东西"的，而是用来"关东西"的
 * - 抽屉保护的是注意力，不是记忆
 * - 抽屉的本质是门，不是容器
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type { SuperMemory } from '../super-memory';
import type {
  MemoryDrawer,
  DrawerCategory,
  DrawerState,
  DrawerItem,
  DrawerOperationResult,
  MemoryAssignmentResult,
  DrawerSystemState,
  DrawerSystemOptions,
  DrawerSystemStats,
  IndexedMemoryRef,
  MemoryIndex,
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: DrawerSystemOptions = {
  autoClassification: true,
  defaultAutoPlayMode: 'minimal',
  defaultFoldingRules: [],
  drawerCapacity: 100,
  autoIndexUpdate: true,
};

// 预定义的分类标签
const CATEGORY_LABELS: Record<DrawerCategory, string> = {
  work: '工作',
  life: '生活',
  skill: '技能',
  knowledge: '知识',
  emotion: '情感',
  relationship: '关系',
  goal: '目标',
  insight: '洞察',
  belief: '信念',
  creative: '创意',
  routine: '日常',
  archive: '归档',
  custom: '自定义',
};

// 分类关键词映射
const CATEGORY_KEYWORDS: Record<DrawerCategory, string[]> = {
  work: ['工作', '任务', '项目', '会议', '报告', 'work', 'task', 'project', 'meeting'],
  life: ['生活', '日常', '习惯', '作息', 'life', 'daily', 'habit'],
  skill: ['技能', '学习', '练习', '掌握', 'skill', 'learn', 'practice'],
  knowledge: ['知识', '概念', '原理', '理论', 'knowledge', 'concept', 'theory'],
  emotion: ['情感', '感受', '情绪', '心情', 'emotion', 'feeling', 'mood'],
  relationship: ['关系', '朋友', '家人', '同事', 'relationship', 'friend', 'family'],
  goal: ['目标', '计划', '愿景', '方向', 'goal', 'plan', 'vision'],
  insight: ['洞察', '发现', '领悟', '突破', 'insight', 'discovery'],
  belief: ['信念', '价值观', '原则', '信条', 'belief', 'value', 'principle'],
  creative: ['创意', '想法', '灵感', '创作', 'creative', 'idea', 'inspiration'],
  routine: ['常规', '流程', '步骤', '例行', 'routine', 'process', 'step'],
  archive: ['归档', '历史', '过去', '旧', 'archive', 'history', 'old'],
  custom: [],
};

// ─────────────────────────────────────────────────────────────────────
// 抽屉管理器类
// ─────────────────────────────────────────────────────────────────────

export class DrawerManager {
  private options: DrawerSystemOptions;
  private state: DrawerSystemState;

  constructor(options: Partial<DrawerSystemOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.state = this.initializeState();
    this.initializeDefaultDrawers();
  }

  // ───────────────────────────────────────────────────────────────────
  // 初始化
  // ───────────────────────────────────────────────────────────────────

  private initializeState(): DrawerSystemState {
    return {
      drawers: new Map(),
      openDrawers: [],
      focusedDrawer: null,
      index: this.createEmptyIndex(),
      foldingRules: this.options.defaultFoldingRules,
      autoPlayControl: {
        allowedDrawers: [],
        triggers: {
          idle: false,
          sleep: true,
          emotional: true,
          associative: true,
          contextual: true,
        },
        blockers: {
          focusMode: false,
          suppressedTags: [],
          timeWindows: [],
          maxDuration: 30,
        },
        currentMode: this.options.defaultAutoPlayMode,
      },
      stats: this.createEmptyStats(),
    };
  }

  private createEmptyIndex(): MemoryIndex {
    return {
      labelIndex: new Map(),
      contentIndex: new Map(),
      timeIndex: new Map(),
      associationIndex: new Map(),
      foldedIndex: new Map(),
      categoryIndex: new Map(),
      stats: {
        totalIndexed: 0,
        foldedCount: 0,
        labelCount: 0,
        keywordCount: 0,
        lastUpdated: Date.now(),
      },
    };
  }

  private createEmptyStats(): DrawerSystemStats {
    return {
      totalDrawers: 0,
      totalMemories: 0,
      foldedMemories: 0,
      avgAccessFrequency: 0,
      highestPriorityDrawer: null,
      recentlyAccessedDrawers: [],
      lastUpdated: Date.now(),
    };
  }

  /**
   * 初始化默认抽屉
   * 创建基础的分类抽屉
   */
  private initializeDefaultDrawers(): void {
    const defaultCategories: DrawerCategory[] = [
      'work', 'life', 'skill', 'knowledge', 'emotion',
      'relationship', 'goal', 'insight', 'belief', 'creative',
    ];

    for (const category of defaultCategories) {
      this.createDrawer(
        CATEGORY_LABELS[category],
        category,
        0.5,
        `默认${CATEGORY_LABELS[category]}抽屉`
      );
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // 抽屉操作
  // ───────────────────────────────────────────────────────────────────

  /**
   * 创建新抽屉
   */
  createDrawer(
    label: string,
    category: DrawerCategory,
    priority: number = 0.5,
    description?: string,
    parentDrawerId?: string
  ): DrawerOperationResult {
    const id = `drawer-${uuidv4().slice(0, 8)}`;
    
    const drawer: MemoryDrawer = {
      id,
      label,
      category,
      priority,
      state: 'closed',
      contents: [],
      index: new Map(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
      autoPlayAllowed: category !== 'archive',
      capacity: this.options.drawerCapacity,
      createdAt: Date.now(),
      description,
      parentDrawerId,
      childDrawerIds: [],
    };

    this.state.drawers.set(id, drawer);

    // 更新层级关系
    if (parentDrawerId) {
      const parent = this.state.drawers.get(parentDrawerId);
      if (parent) {
        parent.childDrawerIds.push(id);
      }
    }

    // 更新分类索引
    this.addToCategoryIndex(category, id);

    // 更新标签索引
    this.addToLabelIndex(label, id);

    this.updateStats();

    return {
      success: true,
      operation: 'create',
      drawerId: id,
      affectedMemories: 0,
      message: `创建抽屉"${label}"成功`,
    };
  }

  /**
   * 打开抽屉
   * 打开后的抽屉内容可以被检索和自动浮现
   */
  openDrawer(drawerId: string): DrawerOperationResult {
    const drawer = this.state.drawers.get(drawerId);
    
    if (!drawer) {
      return {
        success: false,
        operation: 'open',
        drawerId,
        affectedMemories: 0,
        message: '抽屉不存在',
        error: 'DRAWER_NOT_FOUND',
      };
    }

    const previousState = drawer.state;
    drawer.state = 'open';
    drawer.lastAccessedAt = Date.now();
    drawer.accessCount++;

    // 添加到打开列表
    if (!this.state.openDrawers.includes(drawerId)) {
      this.state.openDrawers.push(drawerId);
    }

    // 记录访问历史
    for (const item of drawer.contents) {
      item.accessHistory.push({
        at: Date.now(),
        type: 'open',
      });
    }

    this.updateStats();

    return {
      success: true,
      operation: 'open',
      drawerId,
      affectedMemories: drawer.contents.length,
      message: `打开抽屉"${drawer.label}"${previousState === 'folded' ? '（展开折叠内容）' : ''}`,
    };
  }

  /**
   * 关闭抽屉
   * 关闭后的抽屉内容不会自动浮现，但仍可被检索
   */
  closeDrawer(drawerId: string): DrawerOperationResult {
    const drawer = this.state.drawers.get(drawerId);
    
    if (!drawer) {
      return {
        success: false,
        operation: 'close',
        drawerId,
        affectedMemories: 0,
        message: '抽屉不存在',
        error: 'DRAWER_NOT_FOUND',
      };
    }

    drawer.state = 'closed';
    drawer.lastAccessedAt = Date.now();

    // 从打开列表移除
    const index = this.state.openDrawers.indexOf(drawerId);
    if (index > -1) {
      this.state.openDrawers.splice(index, 1);
    }

    // 如果是焦点抽屉，清除焦点
    if (this.state.focusedDrawer === drawerId) {
      this.state.focusedDrawer = null;
    }

    // 记录访问历史
    for (const item of drawer.contents) {
      item.accessHistory.push({
        at: Date.now(),
        type: 'close',
      });
    }

    this.updateStats();

    return {
      success: true,
      operation: 'close',
      drawerId,
      affectedMemories: drawer.contents.length,
      message: `关闭抽屉"${drawer.label}"`,
    };
  }

  /**
   * 设置焦点抽屉
   */
  setFocusedDrawer(drawerId: string | null): DrawerOperationResult {
    if (drawerId && !this.state.drawers.has(drawerId)) {
      return {
        success: false,
        operation: 'open',
        drawerId,
        affectedMemories: 0,
        message: '抽屉不存在',
        error: 'DRAWER_NOT_FOUND',
      };
    }

    // 关闭之前的焦点
    if (this.state.focusedDrawer) {
      this.closeDrawer(this.state.focusedDrawer);
    }

    this.state.focusedDrawer = drawerId;

    if (drawerId) {
      this.openDrawer(drawerId);
    }

    return {
      success: true,
      operation: 'open',
      drawerId: drawerId || '',
      affectedMemories: drawerId ? (this.state.drawers.get(drawerId)?.contents.length || 0) : 0,
      message: drawerId ? `设置焦点到抽屉"${this.state.drawers.get(drawerId)?.label}"` : '清除焦点',
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 记忆分配
  // ───────────────────────────────────────────────────────────────────

  /**
   * 将记忆分配到合适的抽屉
   */
  assignMemory(memory: SuperMemory): MemoryAssignmentResult {
    // 自动分类
    const category = this.options.autoClassification
      ? this.classifyMemory(memory)
      : 'custom';

    // 找到或创建合适的抽屉
    let targetDrawer: MemoryDrawer | null = this.findBestDrawer(category, memory);

    if (!targetDrawer) {
      // 创建新抽屉
      const label = this.generateDrawerLabel(memory, category);
      const result = this.createDrawer(label, category, 0.5);
      if (result.success) {
        targetDrawer = this.state.drawers.get(result.drawerId) || null;
      }
    }

    if (!targetDrawer) {
      return {
        success: false,
        drawerId: '',
        drawerLabel: '',
        newDrawerCreated: false,
        triggeredFolding: false,
        foldedCount: 0,
      };
    }

    // 检查是否需要折叠旧记忆
    let triggeredFolding = false;
    let foldedCount = 0;

    if (targetDrawer.capacity > 0 && targetDrawer.contents.length >= targetDrawer.capacity) {
      triggeredFolding = true;
      foldedCount = this.foldOldestItems(targetDrawer, Math.ceil(targetDrawer.capacity * 0.2));
    }

    // 添加记忆到抽屉
    const item: DrawerItem = {
      memoryId: memory.id,
      memory,
      localLabel: this.generateLocalLabel(memory),
      folded: false,
      addedAt: Date.now(),
      localPriority: memory.importance,
      accessHistory: [{ at: Date.now(), type: 'open' }],
    };

    targetDrawer.contents.push(item);
    targetDrawer.index.set(memory.id, item);

    // 更新索引
    this.indexMemory(memory, targetDrawer.id);

    this.updateStats();

    return {
      success: true,
      drawerId: targetDrawer.id,
      drawerLabel: targetDrawer.label,
      newDrawerCreated: !this.findBestDrawer(category, memory),
      triggeredFolding,
      foldedCount,
    };
  }

  /**
   * 分类记忆
   */
  private classifyMemory(memory: SuperMemory): DrawerCategory {
    const content = memory.content.toLowerCase();
    const tags = memory.tags.map(t => t.toLowerCase());

    // 计算每个分类的匹配分数
    const scores: Record<DrawerCategory, number> = {
      work: 0, life: 0, skill: 0, knowledge: 0, emotion: 0,
      relationship: 0, goal: 0, insight: 0, belief: 0, creative: 0,
      routine: 0, archive: 0, custom: 0,
    };

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const keyword of keywords) {
        if (content.includes(keyword.toLowerCase())) {
          scores[category as DrawerCategory] += 1;
        }
        for (const tag of tags) {
          if (tag.includes(keyword.toLowerCase())) {
            scores[category as DrawerCategory] += 0.5;
          }
        }
      }
    }

    // 考虑记忆类型
    if (memory.type === 'emotional') scores.emotion += 2;
    if (memory.type === 'insight') scores.insight += 2;
    if (memory.type === 'procedural') scores.skill += 1;
    if (memory.type === 'semantic') scores.knowledge += 1;
    if (memory.type === 'episodic') scores.life += 0.5;

    // 找到最高分的分类
    let bestCategory: DrawerCategory = 'custom';
    let bestScore = 0;

    for (const [category, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category as DrawerCategory;
      }
    }

    // 如果没有明显匹配，使用 custom
    if (bestScore === 0) {
      return 'custom';
    }

    return bestCategory;
  }

  /**
   * 找到最合适的抽屉
   */
  private findBestDrawer(category: DrawerCategory, memory: SuperMemory): MemoryDrawer | null {
    const categoryDrawers = this.state.index.categoryIndex.get(category) || [];
    
    if (categoryDrawers.length === 0) {
      return null;
    }

    // 找到有空间且优先级最匹配的抽屉
    let bestDrawer: MemoryDrawer | null = null;
    let bestScore = -1;

    for (const drawerId of categoryDrawers) {
      const drawer = this.state.drawers.get(drawerId);
      if (!drawer) continue;

      // 检查容量
      if (drawer.capacity > 0 && drawer.contents.length >= drawer.capacity) {
        continue;
      }

      // 计算匹配分数
      const score = this.calculateDrawerMatchScore(drawer, memory);
      if (score > bestScore) {
        bestScore = score;
        bestDrawer = drawer;
      }
    }

    return bestDrawer;
  }

  /**
   * 计算抽屉与记忆的匹配分数
   */
  private calculateDrawerMatchScore(drawer: MemoryDrawer, memory: SuperMemory): number {
    let score = drawer.priority;

    // 检查标签匹配
    const labelKeywords = drawer.label.toLowerCase().split(/\s+/);
    const memoryContent = memory.content.toLowerCase();
    
    for (const keyword of labelKeywords) {
      if (memoryContent.includes(keyword)) {
        score += 0.2;
      }
    }

    // 检查已有内容的相似性
    for (const item of drawer.contents.slice(0, 5)) {
      const similarity = this.calculateSimilarity(item.memory.content, memory.content);
      score += similarity * 0.1;
    }

    return score;
  }

  /**
   * 计算文本相似度（简单的词重叠）
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    let intersection = 0;
    for (const word of words1) {
      if (words2.has(word)) intersection++;
    }

    const union = words1.size + words2.size - intersection;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * 生成抽屉标签
   */
  private generateDrawerLabel(memory: SuperMemory, category: DrawerCategory): string {
    const categoryLabel = CATEGORY_LABELS[category];
    
    // 从内容中提取关键词作为标签的一部分
    const words = memory.content.split(/\s+/).slice(0, 3).join(' ');
    
    if (words.length > 20) {
      return `${categoryLabel}-${words.slice(0, 20)}...`;
    }
    
    return `${categoryLabel}-${words}`;
  }

  /**
   * 生成本地标签
   */
  private generateLocalLabel(memory: SuperMemory): string {
    if (memory.tags.length > 0) {
      return memory.tags[0];
    }
    
    const words = memory.content.split(/\s+/).slice(0, 5).join(' ');
    return words.length > 30 ? `${words.slice(0, 30)}...` : words;
  }

  /**
   * 折叠最旧的项
   */
  private foldOldestItems(drawer: MemoryDrawer, count: number): number {
    // 按添加时间排序
    const sortedItems = [...drawer.contents]
      .filter(item => !item.folded)
      .sort((a, b) => a.addedAt - b.addedAt);

    let foldedCount = 0;
    for (let i = 0; i < Math.min(count, sortedItems.length); i++) {
      const item = sortedItems[i];
      item.folded = true;
      item.foldedReason = 'drawer_full';
      item.accessHistory.push({ at: Date.now(), type: 'fold' });
      foldedCount++;
    }

    return foldedCount;
  }

  // ───────────────────────────────────────────────────────────────────
  // 索引管理
  // ───────────────────────────────────────────────────────────────────

  private createEmptyRef(memoryId: string, drawerId: string): IndexedMemoryRef {
    return {
      memoryId,
      drawerId,
      relevanceScore: 1,
      folded: false,
      keywords: [],
      timestamp: Date.now(),
    };
  }

  private addToCategoryIndex(category: DrawerCategory, drawerId: string): void {
    const existing = this.state.index.categoryIndex.get(category) || [];
    if (!existing.includes(drawerId)) {
      existing.push(drawerId);
      this.state.index.categoryIndex.set(category, existing);
    }
  }

  private addToLabelIndex(label: string, drawerId: string): void {
    const keywords = label.toLowerCase().split(/\s+/);
    for (const keyword of keywords) {
      const existing = this.state.index.labelIndex.get(keyword) || [];
      if (!existing.includes(drawerId)) {
        existing.push(drawerId);
        this.state.index.labelIndex.set(keyword, existing);
      }
    }
  }

  private indexMemory(memory: SuperMemory, drawerId: string): void {
    const ref: IndexedMemoryRef = {
      memoryId: memory.id,
      drawerId,
      relevanceScore: memory.importance,
      folded: false,
      keywords: this.extractKeywords(memory.content),
      timestamp: memory.createdAt,
    };

    // 内容索引
    for (const keyword of ref.keywords) {
      const existing = this.state.index.contentIndex.get(keyword) || [];
      existing.push(ref);
      this.state.index.contentIndex.set(keyword, existing);
    }

    // 时间索引（按天）
    const dayKey = new Date(memory.createdAt).toISOString().slice(0, 10);
    const existing = this.state.index.timeIndex.get(dayKey) || [];
    existing.push(ref);
    this.state.index.timeIndex.set(dayKey, existing);

    // 更新统计
    this.state.index.stats.totalIndexed++;
    this.state.index.stats.keywordCount = this.state.index.contentIndex.size;
    this.state.index.stats.lastUpdated = Date.now();
  }

  private extractKeywords(content: string): string[] {
    // 简单的关键词提取：分词并过滤停用词
    const stopWords = new Set(['的', '是', '在', '和', '了', '有', '我', '他', '她', '它', '这', '那', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once']);
    
    const words = content.toLowerCase().split(/[\s\p{P}]+/u);
    return [...new Set(words.filter(w => w.length > 1 && !stopWords.has(w)))].slice(0, 10);
  }

  // ───────────────────────────────────────────────────────────────────
  // 状态管理
  // ───────────────────────────────────────────────────────────────────

  private updateStats(): void {
    let totalMemories = 0;
    let foldedMemories = 0;
    let highestPriority = 0;
    let highestPriorityDrawer: string | null = null;
    const accessFrequencies: number[] = [];

    for (const [id, drawer] of this.state.drawers) {
      totalMemories += drawer.contents.length;
      foldedMemories += drawer.contents.filter(i => i.folded).length;
      accessFrequencies.push(drawer.accessCount);

      if (drawer.priority > highestPriority) {
        highestPriority = drawer.priority;
        highestPriorityDrawer = id;
      }
    }

    this.state.stats = {
      totalDrawers: this.state.drawers.size,
      totalMemories,
      foldedMemories,
      avgAccessFrequency: accessFrequencies.length > 0
        ? accessFrequencies.reduce((a, b) => a + b, 0) / accessFrequencies.length
        : 0,
      highestPriorityDrawer,
      recentlyAccessedDrawers: this.getRecentlyAccessedDrawers(),
      lastUpdated: Date.now(),
    };
  }

  private getRecentlyAccessedDrawers(): string[] {
    return [...this.state.drawers.values()]
      .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
      .slice(0, 5)
      .map(d => d.id);
  }

  // ───────────────────────────────────────────────────────────────────
  // 查询接口
  // ───────────────────────────────────────────────────────────────────

  getState(): DrawerSystemState {
    return this.state;
  }

  getDrawer(drawerId: string): MemoryDrawer | undefined {
    return this.state.drawers.get(drawerId);
  }

  getAllDrawers(): MemoryDrawer[] {
    return [...this.state.drawers.values()];
  }

  getOpenDrawers(): MemoryDrawer[] {
    return this.state.openDrawers
      .map(id => this.state.drawers.get(id))
      .filter((d): d is MemoryDrawer => d !== undefined);
  }

  getFocusedDrawer(): MemoryDrawer | null {
    if (!this.state.focusedDrawer) return null;
    return this.state.drawers.get(this.state.focusedDrawer) || null;
  }

  getStats(): DrawerSystemStats {
    return this.state.stats;
  }

  getDrawersByCategory(category: DrawerCategory): MemoryDrawer[] {
    const drawerIds = this.state.index.categoryIndex.get(category) || [];
    return drawerIds
      .map(id => this.state.drawers.get(id))
      .filter((d): d is MemoryDrawer => d !== undefined);
  }

  /**
   * 获取抽屉内的所有记忆
   */
  getDrawerMemories(drawerId: string): SuperMemory[] {
    const drawer = this.state.drawers.get(drawerId);
    if (!drawer) return [];
    return drawer.contents.map(item => item.memory);
  }

  /**
   * 获取抽屉内未折叠的记忆
   */
  getActiveMemories(drawerId: string): SuperMemory[] {
    const drawer = this.state.drawers.get(drawerId);
    if (!drawer) return [];
    return drawer.contents
      .filter(item => !item.folded)
      .map(item => item.memory);
  }
}
