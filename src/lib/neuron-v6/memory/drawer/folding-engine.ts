/**
 * ═══════════════════════════════════════════════════════════════════════
 * 折叠引擎 - FoldingEngine
 * 
 * 核心理念（王昱珩的"折上书页"）：
 * 1. 折叠 ≠ 删除 - 记忆仍然存在，只是不展开
 * 2. 折叠 = 从主动记忆池移除，但保留检索路径
 * 3. 折叠的本质是"主动忽略"，不是"被动遗忘"
 * 4. 折叠后的记忆需要主动搜索才能找到
 * 
 * 设计目标：
 * - 解决"过载"问题，而不是"遗忘"问题
 * - 保护注意力，不让无用信息干扰
 * - 保持检索能力，随时可以展开
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  MemoryDrawer,
  DrawerItem,
  FoldingRule,
  FoldingReason,
  FoldingConditions,
  FoldingBehavior,
  FoldedMemoryReference,
  DrawerSystemState,
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 默认折叠规则
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_FOLDING_RULES: FoldingRule[] = [
  {
    id: 'low-access-frequency',
    name: '低访问频率折叠',
    conditions: {
      accessFrequencyThreshold: 0.1, // 每周访问少于 0.1 次
      daysSinceLastAccess: 30,       // 30 天未访问
    },
    behavior: {
      removeFromActivePool: true,
      retainIndexPath: true,
      strengthReduction: 0.3,
      archive: false,
      accessMode: 'search_only',
    },
    priority: 1,
    enabled: true,
  },
  {
    id: 'consolidation-complete',
    name: '巩固完成折叠',
    conditions: {
      consolidationLevelThreshold: 8, // 巩固级别达到 8
    },
    behavior: {
      removeFromActivePool: true,
      retainIndexPath: true,
      strengthReduction: 0.1,
      archive: true,
      accessMode: 'triggered',
    },
    priority: 2,
    enabled: true,
  },
  {
    id: 'low-emotional-weight',
    name: '低情感权重折叠',
    conditions: {
      emotionalWeightThreshold: 0.2,
      daysSinceLastAccess: 14,
    },
    behavior: {
      removeFromActivePool: true,
      retainIndexPath: true,
      strengthReduction: 0.5,
      archive: false,
      accessMode: 'search_only',
    },
    priority: 0,
    enabled: true,
  },
  {
    id: 'time-decay',
    name: '时间衰减折叠',
    conditions: {
      daysSinceLastAccess: 90,
      strengthThreshold: 0.3,
    },
    behavior: {
      removeFromActivePool: true,
      retainIndexPath: true,
      strengthReduction: 0.6,
      archive: true,
      accessMode: 'explicit_unfold',
    },
    priority: 0,
    enabled: true,
  },
];

// ─────────────────────────────────────────────────────────────────────
// 折叠引擎类
// ─────────────────────────────────────────────────────────────────────

export class FoldingEngine {
  private rules: FoldingRule[];
  private foldedIndex: Map<string, FoldedMemoryReference>;
  private state: DrawerSystemState;

  constructor(state: DrawerSystemState, customRules?: FoldingRule[]) {
    this.state = state;
    this.rules = customRules || DEFAULT_FOLDING_RULES;
    this.foldedIndex = new Map();
    this.sortRulesByPriority();
  }

  // ───────────────────────────────────────────────────────────────────
  // 核心折叠逻辑
  // ───────────────────────────────────────────────────────────────────

  /**
   * 评估是否应该折叠
   */
  evaluateFoldingConditions(item: DrawerItem): {
    shouldFold: boolean;
    reason: FoldingReason | null;
    matchedRule: FoldingRule | null;
  } {
    const memory = item.memory;
    const now = Date.now();
    const daysSinceLastAccess = (now - memory.lastRecalledAt) / (1000 * 60 * 60 * 24);

    // 按优先级检查规则
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      const conditions = rule.conditions;
      let matchesAll = true;

      // 检查访问频率
      if (conditions.accessFrequencyThreshold !== undefined) {
        const accessFrequency = memory.recallCount / Math.max(1, daysSinceLastAccess);
        if (accessFrequency > conditions.accessFrequencyThreshold) {
          matchesAll = false;
        }
      }

      // 检查时间
      if (matchesAll && conditions.daysSinceLastAccess !== undefined) {
        if (daysSinceLastAccess < conditions.daysSinceLastAccess) {
          matchesAll = false;
        }
      }

      // 检查情感权重
      if (matchesAll && conditions.emotionalWeightThreshold !== undefined) {
        if (memory.emotionalBoost > conditions.emotionalWeightThreshold) {
          matchesAll = false;
        }
      }

      // 检查记忆强度
      if (matchesAll && conditions.strengthThreshold !== undefined) {
        if (memory.currentStrength > conditions.strengthThreshold) {
          matchesAll = false;
        }
      }

      // 检查巩固级别
      if (matchesAll && conditions.consolidationLevelThreshold !== undefined) {
        if (memory.consolidationLevel < conditions.consolidationLevelThreshold) {
          matchesAll = false;
        }
      }

      if (matchesAll) {
        return {
          shouldFold: true,
          reason: this.getReasonFromRuleId(rule.id),
          matchedRule: rule,
        };
      }
    }

    return {
      shouldFold: false,
      reason: null,
      matchedRule: null,
    };
  }

  /**
   * 折叠单个记忆
   */
  foldMemory(
    item: DrawerItem,
    drawer: MemoryDrawer,
    reason: FoldingReason,
    rule?: FoldingRule
  ): FoldedMemoryReference {
    // 应用折叠行为
    const behavior = rule?.behavior || {
      removeFromActivePool: true,
      retainIndexPath: true,
      strengthReduction: 0.3,
      archive: false,
      accessMode: 'search_only' as const,
    };

    // 更新记忆强度
    const originalStrength = item.memory.currentStrength;
    item.memory.currentStrength *= (1 - behavior.strengthReduction);

    // 标记为折叠
    item.folded = true;
    item.foldedReason = reason;
    item.accessHistory.push({ at: Date.now(), type: 'fold' });

    // 创建折叠引用
    const ref: FoldedMemoryReference = {
      memoryId: item.memoryId,
      drawerId: drawer.id,
      foldedAt: Date.now(),
      reason,
      indexKeywords: this.extractIndexKeywords(item.memory.content),
      recoveryPath: `drawer:${drawer.id}:memory:${item.memoryId}`,
      originalStrength,
    };

    // 添加到折叠索引
    this.foldedIndex.set(item.memoryId, ref);
    this.state.index.foldedIndex.set(item.memoryId, ref);

    // 更新索引中的引用
    this.updateIndexReferences(item.memoryId, true);

    // 更新统计
    this.state.stats.foldedMemories++;

    return ref;
  }

  /**
   * 展开折叠的记忆
   */
  unfoldMemory(memoryId: string): {
    success: boolean;
    item: DrawerItem | null;
    drawer: MemoryDrawer | null;
    message: string;
  } {
    const ref = this.foldedIndex.get(memoryId);
    if (!ref) {
      return {
        success: false,
        item: null,
        drawer: null,
        message: '记忆未折叠或不存在',
      };
    }

    const drawer = this.state.drawers.get(ref.drawerId);
    if (!drawer) {
      return {
        success: false,
        item: null,
        drawer: null,
        message: '抽屉不存在',
      };
    }

    const item = drawer.index.get(memoryId);
    if (!item) {
      return {
        success: false,
        item: null,
        drawer: null,
        message: '记忆不在抽屉中',
      };
    }

    // 恢复强度
    item.memory.currentStrength = ref.originalStrength;
    item.folded = false;
    item.foldedReason = undefined;
    item.lastUnfoldedAt = Date.now();
    item.accessHistory.push({ at: Date.now(), type: 'unfold' });

    // 从折叠索引移除
    this.foldedIndex.delete(memoryId);
    this.state.index.foldedIndex.delete(memoryId);

    // 更新索引引用
    this.updateIndexReferences(memoryId, false);

    // 更新统计
    this.state.stats.foldedMemories--;

    return {
      success: true,
      item,
      drawer,
      message: `展开记忆"${item.localLabel}"`,
    };
  }

  /**
   * 批量折叠
   */
  foldMemories(
    items: Array<{ item: DrawerItem; drawer: MemoryDrawer }>
  ): Array<{
    memoryId: string;
    folded: boolean;
    reason: FoldingReason | null;
  }> {
    const results: Array<{
      memoryId: string;
      folded: boolean;
      reason: FoldingReason | null;
    }> = [];

    for (const { item, drawer } of items) {
      if (item.folded) {
        results.push({
          memoryId: item.memoryId,
          folded: false,
          reason: null,
        });
        continue;
      }

      const evaluation = this.evaluateFoldingConditions(item);
      
      if (evaluation.shouldFold && evaluation.reason) {
        this.foldMemory(item, drawer, evaluation.reason, evaluation.matchedRule || undefined);
        results.push({
          memoryId: item.memoryId,
          folded: true,
          reason: evaluation.reason,
        });
      } else {
        results.push({
          memoryId: item.memoryId,
          folded: false,
          reason: null,
        });
      }
    }

    return results;
  }

  /**
   * 折叠整个抽屉
   */
  foldDrawer(drawerId: string, reason: FoldingReason = 'category_archive'): {
    success: boolean;
    foldedCount: number;
    message: string;
  } {
    const drawer = this.state.drawers.get(drawerId);
    if (!drawer) {
      return {
        success: false,
        foldedCount: 0,
        message: '抽屉不存在',
      };
    }

    let foldedCount = 0;
    for (const item of drawer.contents) {
      if (!item.folded) {
        this.foldMemory(item, drawer, reason);
        foldedCount++;
      }
    }

    // 更新抽屉状态
    drawer.state = 'folded';

    return {
      success: true,
      foldedCount,
      message: `折叠抽屉"${drawer.label}"中的 ${foldedCount} 条记忆`,
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 规则管理
  // ───────────────────────────────────────────────────────────────────

  /**
   * 添加折叠规则
   */
  addRule(rule: FoldingRule): void {
    this.rules.push(rule);
    this.sortRulesByPriority();
  }

  /**
   * 移除折叠规则
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index > -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 启用/禁用规则
   */
  toggleRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * 获取所有规则
   */
  getRules(): FoldingRule[] {
    return [...this.rules];
  }

  // ───────────────────────────────────────────────────────────────────
  // 查询接口
  // ───────────────────────────────────────────────────────────────────

  /**
   * 获取折叠的记忆引用
   */
  getFoldedMemory(memoryId: string): FoldedMemoryReference | undefined {
    return this.foldedIndex.get(memoryId);
  }

  /**
   * 获取所有折叠的记忆
   */
  getAllFoldedMemories(): FoldedMemoryReference[] {
    return [...this.foldedIndex.values()];
  }

  /**
   * 检查记忆是否折叠
   */
  isFolded(memoryId: string): boolean {
    return this.foldedIndex.has(memoryId);
  }

  /**
   * 获取折叠统计
   */
  getFoldingStats(): {
    totalFolded: number;
    byReason: Record<FoldingReason, number>;
    avgFoldedAge: number;
  } {
    const refs = [...this.foldedIndex.values()];
    const byReason: Record<FoldingReason, number> = {
      low_access_frequency: 0,
      low_relevance: 0,
      time_decay: 0,
      low_emotional_weight: 0,
      user_explicit_fold: 0,
      drawer_full: 0,
      category_archive: 0,
      consolidation_complete: 0,
    };

    let totalAge = 0;
    const now = Date.now();

    for (const ref of refs) {
      byReason[ref.reason]++;
      totalAge += now - ref.foldedAt;
    }

    return {
      totalFolded: refs.length,
      byReason,
      avgFoldedAge: refs.length > 0 ? totalAge / refs.length : 0,
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 自动折叠
  // ───────────────────────────────────────────────────────────────────

  /**
   * 执行自动折叠检查
   * 扫描所有记忆，折叠符合条件的
   */
  performAutoFolding(): {
    checked: number;
    folded: number;
    details: Array<{
      memoryId: string;
      drawerLabel: string;
      reason: FoldingReason;
    }>;
  } {
    const details: Array<{
      memoryId: string;
      drawerLabel: string;
      reason: FoldingReason;
    }> = [];

    let checked = 0;
    let folded = 0;

    for (const drawer of this.state.drawers.values()) {
      for (const item of drawer.contents) {
        if (item.folded) continue;

        checked++;
        const evaluation = this.evaluateFoldingConditions(item);

        if (evaluation.shouldFold && evaluation.reason) {
          this.foldMemory(item, drawer, evaluation.reason, evaluation.matchedRule || undefined);
          folded++;
          details.push({
            memoryId: item.memoryId,
            drawerLabel: drawer.label,
            reason: evaluation.reason,
          });
        }
      }
    }

    return { checked, folded, details };
  }

  // ───────────────────────────────────────────────────────────────────
  // 辅助方法
  // ───────────────────────────────────────────────────────────────────

  private sortRulesByPriority(): void {
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  private getReasonFromRuleId(ruleId: string): FoldingReason {
    const mapping: Record<string, FoldingReason> = {
      'low-access-frequency': 'low_access_frequency',
      'consolidation-complete': 'consolidation_complete',
      'low-emotional-weight': 'low_emotional_weight',
      'time-decay': 'time_decay',
    };
    return mapping[ruleId] || 'time_decay';
  }

  private extractIndexKeywords(content: string): string[] {
    const stopWords = new Set([
      '的', '是', '在', '和', '了', '有', '我', '他', '她', '它',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    ]);

    return content.toLowerCase()
      .split(/[\s\p{P}]+/u)
      .filter(w => w.length > 1 && !stopWords.has(w))
      .slice(0, 10);
  }

  private updateIndexReferences(memoryId: string, folded: boolean): void {
    // 更新内容索引
    for (const refs of this.state.index.contentIndex.values()) {
      for (const ref of refs) {
        if (ref.memoryId === memoryId) {
          ref.folded = folded;
        }
      }
    }

    // 更新时间索引
    for (const refs of this.state.index.timeIndex.values()) {
      for (const ref of refs) {
        if (ref.memoryId === memoryId) {
          ref.folded = folded;
        }
      }
    }
  }
}
