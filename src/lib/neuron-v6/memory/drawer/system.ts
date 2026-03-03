/**
 * ═══════════════════════════════════════════════════════════════════════
 * 抽屉式记忆管理系统 - 统一入口
 * 
 * 整合所有组件：
 * - DrawerManager: 抽屉管理
 * - FoldingEngine: 折叠引擎
 * - RetrievalOptimizer: 检索优化
 * - AutoPlayController: 自动播放控制
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { SuperMemory } from '../super-memory';
import { DrawerManager } from './drawer-manager';
import { FoldingEngine } from './folding-engine';
import { RetrievalOptimizer } from './retrieval-optimizer';
import { AutoPlayController } from './autoplay-controller';
import type {
  DrawerCategory,
  DrawerState,
  DrawerOperationResult,
  MemoryAssignmentResult,
  SearchOptions,
  SearchResult,
  FoldingRule,
  FoldingReason,
  AutoPlayMode,
  AutoPlayEvent,
  AutoPlayTriggerReason,
  DrawerSystemState,
  DrawerSystemOptions,
  DrawerSystemStats,
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 抽屉式记忆系统类
// ─────────────────────────────────────────────────────────────────────

export class DrawerMemorySystem {
  private drawerManager: DrawerManager;
  private foldingEngine: FoldingEngine;
  private retrievalOptimizer: RetrievalOptimizer;
  private autoPlayController: AutoPlayController;

  constructor(options: Partial<DrawerSystemOptions> = {}) {
    // 初始化抽屉管理器
    this.drawerManager = new DrawerManager(options);
    
    // 获取共享状态
    const state = this.drawerManager.getState();
    
    // 初始化其他组件
    this.foldingEngine = new FoldingEngine(state, options.defaultFoldingRules);
    this.retrievalOptimizer = new RetrievalOptimizer(state);
    this.autoPlayController = new AutoPlayController(state);
  }

  // ───────────────────────────────────────────────────────────────────
  // 记忆存入
  // ───────────────────────────────────────────────────────────────────

  /**
   * 存入记忆
   * 自动分类、分配到合适的抽屉
   */
  storeMemory(memory: SuperMemory): MemoryAssignmentResult {
    return this.drawerManager.assignMemory(memory);
  }

  /**
   * 批量存入记忆
   */
  storeMemories(memories: SuperMemory[]): MemoryAssignmentResult[] {
    return memories.map(m => this.storeMemory(m));
  }

  // ───────────────────────────────────────────────────────────────────
  // 抽屉操作
  // ───────────────────────────────────────────────────────────────────

  /**
   * 创建抽屉
   */
  createDrawer(
    label: string,
    category: DrawerCategory,
    priority?: number,
    description?: string
  ): DrawerOperationResult {
    return this.drawerManager.createDrawer(label, category, priority, description);
  }

  /**
   * 打开抽屉
   */
  openDrawer(drawerId: string): DrawerOperationResult {
    return this.drawerManager.openDrawer(drawerId);
  }

  /**
   * 关闭抽屉
   */
  closeDrawer(drawerId: string): DrawerOperationResult {
    return this.drawerManager.closeDrawer(drawerId);
  }

  /**
   * 设置焦点抽屉
   */
  setFocusedDrawer(drawerId: string | null): DrawerOperationResult {
    return this.drawerManager.setFocusedDrawer(drawerId);
  }

  /**
   * 获取所有抽屉
   */
  getAllDrawers() {
    return this.drawerManager.getAllDrawers();
  }

  /**
   * 获取打开的抽屉
   */
  getOpenDrawers() {
    return this.drawerManager.getOpenDrawers();
  }

  /**
   * 获取焦点抽屉
   */
  getFocusedDrawer() {
    return this.drawerManager.getFocusedDrawer();
  }

  // ───────────────────────────────────────────────────────────────────
  // 折叠操作
  // ───────────────────────────────────────────────────────────────────

  /**
   * 折叠记忆
   */
  foldMemory(memoryId: string, reason?: FoldingReason) {
    // 找到记忆所在的抽屉
    for (const drawer of this.drawerManager.getAllDrawers()) {
      const item = drawer.index.get(memoryId);
      if (item) {
        return this.foldingEngine.foldMemory(
          item,
          drawer,
          reason || 'user_explicit_fold'
        );
      }
    }
    return null;
  }

  /**
   * 展开记忆
   */
  unfoldMemory(memoryId: string) {
    return this.foldingEngine.unfoldMemory(memoryId);
  }

  /**
   * 折叠整个抽屉
   */
  foldDrawer(drawerId: string, reason?: FoldingReason) {
    return this.foldingEngine.foldDrawer(drawerId, reason);
  }

  /**
   * 执行自动折叠检查
   */
  performAutoFolding() {
    return this.foldingEngine.performAutoFolding();
  }

  /**
   * 添加折叠规则
   */
  addFoldingRule(rule: FoldingRule) {
    this.foldingEngine.addRule(rule);
  }

  /**
   * 获取折叠统计
   */
  getFoldingStats() {
    return this.foldingEngine.getFoldingStats();
  }

  // ───────────────────────────────────────────────────────────────────
  // 检索操作
  // ───────────────────────────────────────────────────────────────────

  /**
   * 搜索记忆
   */
  search(query: string, options?: Partial<SearchOptions>): SearchResult {
    return this.retrievalOptimizer.search(query, options);
  }

  /**
   * 快速搜索（仅从打开的抽屉）
   */
  quickSearch(query: string) {
    return this.retrievalOptimizer.quickSearchFromOpenDrawers(query);
  }

  /**
   * 从焦点抽屉搜索
   */
  searchFromFocusedDrawer(query: string) {
    return this.retrievalOptimizer.searchFromFocusedDrawer(query);
  }

  /**
   * 按分类搜索
   */
  searchByCategory(category: DrawerCategory, options?: Partial<SearchOptions>) {
    return this.retrievalOptimizer.searchByCategory(category, options);
  }

  /**
   * 重建索引
   */
  rebuildIndex() {
    return this.retrievalOptimizer.rebuildIndex();
  }

  /**
   * 获取索引统计
   */
  getIndexStats() {
    return this.retrievalOptimizer.getIndexStats();
  }

  // ───────────────────────────────────────────────────────────────────
  // 自动播放控制
  // ───────────────────────────────────────────────────────────────────

  /**
   * 启动自动播放
   */
  startAutoPlay(reason: AutoPlayTriggerReason, drawerIds?: string[]) {
    return this.autoPlayController.startAutoPlay(reason, drawerIds);
  }

  /**
   * 停止自动播放
   */
  stopAutoPlay() {
    return this.autoPlayController.stopAutoPlay();
  }

  /**
   * 获取自动播放状态
   */
  getAutoPlayStatus() {
    return this.autoPlayController.getStatus();
  }

  /**
   * 设置自动播放模式
   */
  setAutoPlayMode(mode: AutoPlayMode) {
    this.autoPlayController.setMode(mode);
  }

  /**
   * 允许抽屉自动播放
   */
  allowAutoPlay(drawerId: string) {
    this.autoPlayController.allowDrawer(drawerId);
  }

  /**
   * 阻止抽屉自动播放
   */
  blockAutoPlay(drawerId: string) {
    this.autoPlayController.blockDrawer(drawerId);
  }

  /**
   * 启用专注模式
   */
  enableFocusMode() {
    this.autoPlayController.enableFocusMode();
  }

  /**
   * 禁用专注模式
   */
  disableFocusMode() {
    this.autoPlayController.disableFocusMode();
  }

  /**
   * 启动睡眠巩固
   */
  startSleepConsolidation() {
    return this.autoPlayController.startSleepConsolidation();
  }

  /**
   * 完成睡眠巩固
   */
  completeSleepConsolidation() {
    return this.autoPlayController.completeSleepConsolidation();
  }

  /**
   * 获取自动播放统计
   */
  getAutoPlayStats() {
    return this.autoPlayController.getStats();
  }

  // ───────────────────────────────────────────────────────────────────
  // 系统状态
  // ───────────────────────────────────────────────────────────────────

  /**
   * 获取系统状态
   */
  getState(): DrawerSystemState {
    return this.drawerManager.getState();
  }

  /**
   * 获取系统统计
   */
  getStats(): DrawerSystemStats {
    return this.drawerManager.getStats();
  }

  /**
   * 获取系统报告
   */
  getReport(): {
    summary: string;
    drawers: {
      total: number;
      open: number;
      byCategory: Record<DrawerCategory, number>;
    };
    memories: {
      total: number;
      folded: number;
      avgPerDrawer: number;
    };
    retrieval: {
      indexStats: ReturnType<RetrievalOptimizer['getIndexStats']>;
      searchPerformance: string;
    };
    autoPlay: {
      status: ReturnType<AutoPlayController['getStatus']>;
      stats: ReturnType<AutoPlayController['getStats']>;
    };
  } {
    const stats = this.drawerManager.getStats();
    const indexStats = this.retrievalOptimizer.getIndexStats();
    const autoPlayStatus = this.autoPlayController.getStatus();
    const autoPlayStats = this.autoPlayController.getStats();

    // 按分类统计抽屉
    const byCategory: Record<DrawerCategory, number> = {
      work: 0, life: 0, skill: 0, knowledge: 0, emotion: 0,
      relationship: 0, goal: 0, insight: 0, belief: 0, creative: 0,
      routine: 0, archive: 0, custom: 0,
    };

    for (const drawer of this.drawerManager.getAllDrawers()) {
      byCategory[drawer.category]++;
    }

    return {
      summary: `抽屉式记忆系统: ${stats.totalDrawers} 个抽屉, ${stats.totalMemories} 条记忆, ${stats.foldedMemories} 条已折叠`,
      drawers: {
        total: stats.totalDrawers,
        open: this.drawerManager.getOpenDrawers().length,
        byCategory,
      },
      memories: {
        total: stats.totalMemories,
        folded: stats.foldedMemories,
        avgPerDrawer: stats.totalDrawers > 0 
          ? Math.round(stats.totalMemories / stats.totalDrawers) 
          : 0,
      },
      retrieval: {
        indexStats,
        searchPerformance: indexStats.keywordCount > 0 ? '良好' : '需要重建索引',
      },
      autoPlay: {
        status: autoPlayStatus,
        stats: autoPlayStats,
      },
    };
  }
}
