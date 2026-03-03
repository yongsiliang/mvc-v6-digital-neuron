/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一记忆管理器 (Unified Memory Manager)
 * 
 * 整合所有记忆组件：
 * - 分层记忆 (LayeredMemorySystem)
 * - 工作记忆 (WorkingMemory)
 * - 记忆检索 (MemoryRetriever)
 * - 记忆关联 (MemoryAssociationSystem)
 * 
 * 提供统一的记忆管理接口
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LayeredMemorySystem, type EpisodicMemory, type ConsolidatedMemory } from '../layered-memory';
import { WorkingMemory, createWorkingMemory, type WorkingMemoryItem } from './working-memory';
import { MemoryRetriever, createMemoryRetriever, type RetrievalOptions } from './retrieval';
import { MemoryAssociationSystem, createMemoryAssociationSystem, type AssociationType } from './association';

// 🆕 重新导出类型供外部使用
export type { WorkingMemoryItem } from './working-memory';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 统一记忆配置 */
export interface UnifiedMemoryConfig {
  /** 工作记忆容量 */
  workingMemoryCapacity: number;
  
  /** 检索选项 */
  retrievalOptions: Partial<RetrievalOptions>;
  
  /** 是否启用关联系统 */
  enableAssociations: boolean;
}

/** 统一检索结果 */
export interface UnifiedRetrievalResult {
  /** 来自工作记忆 */
  workingMemoryItems: WorkingMemoryItem[];
  
  /** 来自核心层 */
  coreMatches: Array<{ field: string; value: string; relevance: number }>;
  
  /** 来自巩固层 */
  consolidatedMatches: Array<{ memory: ConsolidatedMemory; score: number }>;
  
  /** 来自情景层 */
  episodicMatches: Array<{ memory: EpisodicMemory; score: number }>;
  
  /** 相关联的记忆 */
  associatedMemories: Array<{ memoryId: string; associationType: AssociationType; distance: number }>;
  
  /** 总相关性分数 */
  totalRelevance: number;
  
  /** 检索摘要 */
  summary: string;
}

/** 记忆统计 */
export interface MemoryStats {
  workingMemory: {
    capacity: number;
    used: number;
    avgStrength: number;
  };
  core: {
    hasCreator: boolean;
    relationshipCount: number;
    valueCount: number;
  };
  consolidated: {
    total: number;
    byType: Record<string, number>;
  };
  episodic: {
    total: number;
    avgStrength: number;
    candidates: number;
  };
  associations: {
    total: number;
    avgStrength: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: UnifiedMemoryConfig = {
  workingMemoryCapacity: 7,
  retrievalOptions: {},
  enableAssociations: true,
};

// ─────────────────────────────────────────────────────────────────────
// 统一记忆管理器
// ─────────────────────────────────────────────────────────────────────

/**
 * 统一记忆管理器
 */
export class UnifiedMemoryManager {
  private layeredMemory: LayeredMemorySystem;
  private workingMemory: WorkingMemory;
  private retriever: MemoryRetriever;
  private associations: MemoryAssociationSystem;
  private config: UnifiedMemoryConfig;
  
  constructor(layeredMemory: LayeredMemorySystem, config: Partial<UnifiedMemoryConfig> = {}) {
    this.layeredMemory = layeredMemory;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.workingMemory = createWorkingMemory({
      maxCapacity: this.config.workingMemoryCapacity,
    });
    
    this.retriever = createMemoryRetriever(this.config.retrievalOptions);
    
    this.associations = createMemoryAssociationSystem({
      autoAssociate: this.config.enableAssociations,
    });
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心操作
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 添加记忆
   */
  addMemory(
    content: string,
    options: {
      type?: 'person' | 'preference' | 'event' | 'fact' | 'other';
      importance?: number;
      tags?: string[];
      emotionalMarker?: WorkingMemoryItem['emotionalMarker'];
    } = {}
  ): {
    episodic?: EpisodicMemory;
    working: WorkingMemoryItem;
  } {
    const importance = options.importance ?? 0.5;
    const tags = options.tags ?? [];
    
    // 1. 添加到工作记忆
    const working = this.workingMemory.add(content, 'key_info', {
      importance,
      emotionalMarker: options.emotionalMarker,
    });
    
    // 2. 添加到分层记忆
    const episodic = this.layeredMemory.addEpisodicMemory(content, {
      importance,
      tags,
      consolidationCandidate: importance > 0.6,
    });
    
    // 3. 自动建立关联
    if (this.config.enableAssociations && episodic) {
      const existingMemories = this.getExistingMemoriesForAssociation();
      this.associations.autoAssociate(episodic.id, tags, existingMemories);
    }
    
    console.log(`[统一记忆] 添加记忆: "${content.slice(0, 30)}..." (重要性: ${importance.toFixed(2)})`);
    
    return { episodic, working };
  }
  
  /**
   * 检索记忆（统一检索）
   */
  retrieve(query: string, options: Partial<RetrievalOptions> = {}): UnifiedRetrievalResult {
    // 1. 从工作记忆检索
    const workingMemoryItems = this.workingMemory.retrieve(query, { maxResults: 3 });
    
    // 2. 从分层记忆检索
    const layeredResult = this.layeredMemory.retrieve(query, options);
    
    // 3. 使用高级检索器对巩固层和情景层进行排序
    const consolidatedMatches = layeredResult.consolidatedMatches.length > 0
      ? this.retriever.retrieve(
          query,
          layeredResult.consolidatedMatches,
          m => m.content,
          m => m.consolidatedAt,
          m => m.importance,
          m => m.recallCount,
        ).items.map(r => ({ memory: r.memory, score: r.score }))
      : [];
    
    const episodicMatches = layeredResult.episodicMatches.length > 0
      ? this.retriever.retrieve(
          query,
          layeredResult.episodicMatches,
          m => m.content,
          m => m.timestamp,
          m => m.importance,
          m => m.recallCount,
        ).items.map(r => ({ memory: r.memory, score: r.score }))
      : [];
    
    // 4. 查找相关联的记忆
    const associatedMemories: UnifiedRetrievalResult['associatedMemories'] = [];
    if (this.config.enableAssociations && consolidatedMatches.length > 0) {
      const topMemory = consolidatedMatches[0].memory;
      const related = this.associations.getRelatedMemories(topMemory.id, { maxDepth: 2 });
      for (const r of related.slice(0, 5)) {
        associatedMemories.push({
          memoryId: r.memoryId,
          associationType: r.association.type,
          distance: r.distance,
        });
      }
    }
    
    // 5. 计算总相关性
    const totalRelevance =
      workingMemoryItems.length * 0.3 +
      layeredResult.coreMatches.length * 0.3 +
      consolidatedMatches.length * 0.2 +
      episodicMatches.length * 0.1 +
      associatedMemories.length * 0.1;
    
    // 6. 生成摘要
    const summary = this.generateRetrievalSummary(
      workingMemoryItems,
      layeredResult.coreMatches,
      consolidatedMatches,
      episodicMatches,
    );
    
    return {
      workingMemoryItems,
      coreMatches: layeredResult.coreMatches,
      consolidatedMatches,
      episodicMatches,
      associatedMemories,
      totalRelevance,
      summary,
    };
  }
  
  /**
   * 添加用户输入到工作记忆
   */
  addUserInput(content: string, options: { importance?: number } = {}): WorkingMemoryItem {
    return this.workingMemory.add(content, 'user_input', options);
  }
  
  /**
   * 添加助手响应到工作记忆
   */
  addAssistantResponse(content: string): WorkingMemoryItem {
    return this.workingMemory.add(content, 'assistant_response', { importance: 0.4 });
  }
  
  /**
   * 添加情感到工作记忆
   */
  addEmotion(emotion: string, intensity: number, valence: number): WorkingMemoryItem {
    return this.workingMemory.add(emotion, 'emotion', {
      importance: 0.8,
      emotionalMarker: { valence, arousal: intensity },
    });
  }
  
  /**
   * 获取统计信息
   */
  getStats(): MemoryStats {
    const layeredStats = this.layeredMemory.getStats();
    const workingState = this.workingMemory.getState();
    const assocStats = this.associations.getStats();
    
    return {
      workingMemory: {
        capacity: workingState.totalCapacity,
        used: workingState.usedCapacity,
        avgStrength: workingState.averageStrength,
      },
      core: layeredStats.core,
      consolidated: layeredStats.consolidated,
      episodic: layeredStats.episodic,
      associations: {
        total: assocStats.totalAssociations,
        avgStrength: assocStats.avgStrength,
      },
    };
  }
  
  /**
   * 获取工作记忆状态
   */
  getWorkingMemoryState() {
    return this.workingMemory.getState();
  }
  
  /**
   * 清空工作记忆
   */
  clearWorkingMemory(): void {
    this.workingMemory.clear();
  }
  
  /**
   * 获取分层记忆（供外部使用）
   */
  getLayeredMemory(): LayeredMemorySystem {
    return this.layeredMemory;
  }
  
  /**
   * 🆕 获取所有工作记忆内容（用于上下文构建）
   * 
   * 这是解决"记不住上下文"问题的关键方法
   * 返回所有工作记忆项，而不只是相关的
   */
  getAllWorkingMemory(): WorkingMemoryItem[] {
    return this.workingMemory.getAll();
  }
  
  /**
   * 🆕 获取格式化的工作记忆摘要
   * 用于注入到 LLM 提示中
   */
  getWorkingMemorySummary(): string {
    const items = this.getAllWorkingMemory();
    if (items.length === 0) return '';
    
    const parts: string[] = [];
    
    // 按类型分组
    const grouped: Record<string, WorkingMemoryItem[]> = {
      user_input: [],
      assistant_response: [],
      key_info: [],
      context: [],
      emotion: [],
    };
    
    for (const item of items) {
      if (grouped[item.type]) {
        grouped[item.type].push(item);
      }
    }
    
    // 格式化输出
    if (grouped.key_info.length > 0) {
      parts.push(`**关键信息**: ${grouped.key_info.map(m => m.content).join('；')}`);
    }
    
    if (grouped.user_input.length > 0) {
      const recentInputs = grouped.user_input.slice(-3);
      parts.push(`**最近对话**: ${recentInputs.map(m => m.content).join(' → ')}`);
    }
    
    if (grouped.emotion.length > 0) {
      parts.push(`**情感状态**: ${grouped.emotion.map(m => m.content).join('、')}`);
    }
    
    return parts.join('\n');
  }
  
  /**
   * 导出状态
   */
  exportState(): {
    associations: ReturnType<MemoryAssociationSystem['exportState']>;
  } {
    return {
      associations: this.associations.exportState(),
    };
  }
  
  /**
   * 导入状态
   */
  importState(state: { associations?: ReturnType<MemoryAssociationSystem['exportState']> }): void {
    if (state.associations) {
      this.associations.importState(state.associations);
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 内部方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取现有记忆用于关联
   */
  private getExistingMemoriesForAssociation(): Array<{ id: string; tags: string[]; content: string }> {
    const memories: Array<{ id: string; tags: string[]; content: string }> = [];
    
    // 从巩固层获取
    for (const memory of this.layeredMemory.getConsolidatedMemories()) {
      memories.push({
        id: memory.id,
        tags: memory.tags,
        content: memory.content,
      });
    }
    
    // 从情景层获取
    for (const memory of this.layeredMemory.getAllEpisodicMemories()) {
      memories.push({
        id: memory.id,
        tags: memory.tags,
        content: memory.content,
      });
    }
    
    return memories;
  }
  
  /**
   * 生成检索摘要
   */
  private generateRetrievalSummary(
    workingMemoryItems: WorkingMemoryItem[],
    coreMatches: UnifiedRetrievalResult['coreMatches'],
    consolidatedMatches: UnifiedRetrievalResult['consolidatedMatches'],
    episodicMatches: UnifiedRetrievalResult['episodicMatches'],
  ): string {
    const parts: string[] = [];
    
    if (workingMemoryItems.length > 0) {
      parts.push(`工作记忆: ${workingMemoryItems.length}条`);
    }
    
    if (coreMatches.length > 0) {
      parts.push(`核心记忆: ${coreMatches.map(m => m.value).join('、')}`);
    }
    
    if (consolidatedMatches.length > 0) {
      parts.push(`长期记忆: ${consolidatedMatches.length}条`);
    }
    
    if (episodicMatches.length > 0) {
      parts.push(`情景记忆: ${episodicMatches.length}条`);
    }
    
    if (parts.length === 0) {
      return '未找到相关记忆';
    }
    
    return parts.join('；');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createUnifiedMemoryManager(
  layeredMemory: LayeredMemorySystem,
  config?: Partial<UnifiedMemoryConfig>,
): UnifiedMemoryManager {
  return new UnifiedMemoryManager(layeredMemory, config);
}
