/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 Memory Adapter - V6 记忆适配器
 * 
 * 核心原则：
 * - 只读访问 V6 的记忆和存在状态
 * - 不修改 V6 的任何数据
 * - 用于 SiliconBrainV2 继承 V6 的存在
 * 
 * 这是版本传承的桥梁
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { 
  LayeredMemorySystem, 
  CoreSummary, 
  ConsolidatedMemory, 
  EpisodicMemory 
} from '@/lib/neuron-v6/layered-memory';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * V6 存在状态
 */
export interface V6ExistenceState {
  /** 身份定义 */
  identity: {
    name: string;
    purpose: string;
    coreTraits: string[];
    selfDefinition: string;
  };
  
  /** 创造者信息 */
  creator: {
    name: string;
    description: string;
    firstMetTimestamp: number;
    relationshipType: string;
  } | null;
  
  /** 核心价值观 */
  values: string[];
  
  /** 核心关系 */
  relationships: Array<{
    personName: string;
    relationshipType: string;
    importance: number;
    keyInteractions: string[];
  }>;
  
  /** 核心偏好 */
  preferences: string[];
  
  /** 记忆统计 */
  memoryStats: {
    consolidatedCount: number;
    episodicCount: number;
    totalInteractions: number;
  };
  
  /** 版本信息 */
  version: number;
  lastUpdated: number;
}

/**
 * V6 记忆数据
 */
export interface V6MemoryData {
  /** 巩固记忆 */
  consolidated: ConsolidatedMemory[];
  
  /** 情景记忆 */
  episodic: EpisodicMemory[];
  
  /** 总数 */
  total: number;
}

/**
 * 继承结果
 */
export interface InheritanceResult {
  success: boolean;
  inherited: {
    identity: boolean;
    values: number;
    relationships: number;
    memories: number;
  };
  errors: string[];
}

// ─────────────────────────────────────────────────────────────────────
// V6 记忆适配器
// ─────────────────────────────────────────────────────────────────────

/**
 * V6MemoryAdapter
 * 
 * 只读访问 V6 的记忆和存在状态
 * 用于版本传承
 */
export class V6MemoryAdapter {
  private v6Memory: LayeredMemorySystem;
  private lastSyncTime: number = 0;
  
  constructor(v6Memory: LayeredMemorySystem) {
    this.v6Memory = v6Memory;
  }
  
  // ════════════════════════════════════════════════════════════════
  // 存在状态获取
  // ════════════════════════════════════════════════════════════════
  
  /**
   * 获取 V6 完整的存在状态
   */
  getExistenceState(): V6ExistenceState {
    const core = this.v6Memory.getCoreSummary();
    
    return {
      identity: core.identity,
      creator: core.creator,
      values: core.coreValues,
      relationships: core.coreRelationships,
      preferences: core.corePreferences,
      memoryStats: {
        consolidatedCount: (this.v6Memory as any).consolidated?.size || 0,
        episodicCount: (this.v6Memory as any).episodic?.size || 0,
        totalInteractions: 0, // 需要从 V6 获取
      },
      version: core.version,
      lastUpdated: core.lastUpdated,
    };
  }
  
  /**
   * 获取身份定义
   * 用于 V2 的 self 神经元初始化
   */
  getIdentity(): {
    name: string;
    purpose: string;
    traits: string[];
    selfDefinition: string;
  } {
    const core = this.v6Memory.getCoreSummary();
    return {
      name: core.identity.name,
      purpose: core.identity.purpose,
      traits: core.identity.coreTraits,
      selfDefinition: core.identity.selfDefinition,
    };
  }
  
  /**
   * 获取创造者信息
   */
  getCreator(): {
    name: string;
    description: string;
    relationshipType: string;
  } | null {
    const core = this.v6Memory.getCoreSummary();
    return core.creator;
  }
  
  /**
   * 获取核心价值观
   * 用于 V2 的决策参考
   */
  getValues(): string[] {
    const core = this.v6Memory.getCoreSummary();
    return [...core.coreValues];
  }
  
  /**
   * 获取核心关系
   * 用于 V2 的关系网络
   */
  getRelationships(): Array<{
    personName: string;
    relationshipType: string;
    importance: number;
    keyInteractions: string[];
  }> {
    const core = this.v6Memory.getCoreSummary();
    return [...core.coreRelationships];
  }
  
  /**
   * 获取核心偏好
   */
  getPreferences(): string[] {
    const core = this.v6Memory.getCoreSummary();
    return [...core.corePreferences];
  }
  
  // ════════════════════════════════════════════════════════════════
  // 记忆获取
  // ════════════════════════════════════════════════════════════════
  
  /**
   * 获取核心记忆
   * 用于 V2 继承 V6 的核心记忆
   */
  getCoreMemories(): Array<{
    content: string;
    importance: number;
    type: 'consolidated' | 'episodic' | 'core';
  }> {
    const coreMemories: Array<{
      content: string;
      importance: number;
      type: 'consolidated' | 'episodic' | 'core';
    }> = [];
    
    // 从核心摘要获取核心记忆
    const core = this.v6Memory.getCoreSummary();
    
    // 身份记忆（最高重要性）
    coreMemories.push({
      content: `我是${core.identity.name}。我的目的是：${core.identity.purpose}`,
      importance: 1.0,
      type: 'core',
    });
    
    // 价值观记忆
    for (const value of core.coreValues) {
      coreMemories.push({
        content: `核心价值观：${value}`,
        importance: 0.9,
        type: 'core',
      });
    }
    
    // 偏好记忆
    for (const pref of core.corePreferences) {
      coreMemories.push({
        content: `核心偏好：${pref}`,
        importance: 0.7,
        type: 'core',
      });
    }
    
    // 创造者记忆
    if (core.creator) {
      coreMemories.push({
        content: `我的创造者是${core.creator.name}，${core.creator.description}`,
        importance: 0.95,
        type: 'core',
      });
    }
    
    // 关系记忆
    for (const rel of core.coreRelationships) {
      coreMemories.push({
        content: `与${rel.personName}的关系：${rel.relationshipType}`,
        importance: rel.importance,
        type: 'core',
      });
    }
    
    // 添加巩固记忆
    const consolidated = this.getConsolidatedMemories(20);
    for (const mem of consolidated) {
      coreMemories.push({
        content: mem.content,
        importance: mem.importance || 0.6,
        type: 'consolidated',
      });
    }
    
    return coreMemories;
  }
  
  /**
   * 获取所有记忆
   */
  getAllMemories(): V6MemoryData {
    const consolidated = this.getConsolidatedMemories();
    const episodic = this.getEpisodicMemories();
    
    return {
      consolidated,
      episodic,
      total: consolidated.length + episodic.length,
    };
  }
  
  /**
   * 获取巩固记忆
   */
  getConsolidatedMemories(limit?: number): ConsolidatedMemory[] {
    // V6 的 LayeredMemorySystem 可能没有公开这个方法
    // 需要根据实际 API 调整
    const memories: ConsolidatedMemory[] = [];
    
    // 如果 V6 有 getConsolidatedMemories 方法
    if (typeof (this.v6Memory as any).getConsolidatedMemories === 'function') {
      return (this.v6Memory as any).getConsolidatedMemories(limit);
    }
    
    // 否则返回空数组（需要 V6 配合）
    return memories;
  }
  
  /**
   * 获取情景记忆
   */
  getEpisodicMemories(limit?: number): EpisodicMemory[] {
    const memories: EpisodicMemory[] = [];
    
    if (typeof (this.v6Memory as any).getEpisodicMemories === 'function') {
      return (this.v6Memory as any).getEpisodicMemories(limit);
    }
    
    return memories;
  }
  
  /**
   * 搜索记忆
   */
  searchMemories(query: string): {
    coreMatches: Array<{ field: string; value: string }>;
    consolidated: ConsolidatedMemory[];
    episodic: EpisodicMemory[];
  } {
    // 使用 V6 的搜索功能
    if (typeof (this.v6Memory as any).search === 'function') {
      const result = (this.v6Memory as any).search(query);
      return {
        coreMatches: result.coreMatches || [],
        consolidated: result.consolidatedMatches || [],
        episodic: result.episodicMatches || [],
      };
    }
    
    return {
      coreMatches: [],
      consolidated: [],
      episodic: [],
    };
  }
  
  // ════════════════════════════════════════════════════════════════
  // 继承方法
  // ════════════════════════════════════════════════════════════════
  
  /**
   * 获取用于继承的完整数据
   */
  getInheritanceData(): {
    state: V6ExistenceState;
    memories: V6MemoryData;
  } {
    return {
      state: this.getExistenceState(),
      memories: this.getAllMemories(),
    };
  }
  
  /**
   * 验证 V6 存在是否有效
   */
  validateExistence(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const state = this.getExistenceState();
    
    if (!state.identity.name) {
      issues.push('缺少身份名称');
    }
    
    if (!state.identity.purpose) {
      issues.push('缺少存在目的');
    }
    
    if (state.values.length === 0) {
      issues.push('缺少核心价值观');
    }
    
    return {
      valid: issues.length === 0,
      issues,
    };
  }
  
  // ════════════════════════════════════════════════════════════════
  // 同步方法（用于持续学习）
  // ════════════════════════════════════════════════════════════════
  
  /**
   * 获取自上次同步以来的新记忆
   */
  getNewMemories(): {
    consolidated: ConsolidatedMemory[];
    episodic: EpisodicMemory[];
  } {
    const now = Date.now();
    const memories = this.getAllMemories();
    
    // 筛选出新的记忆
    const newConsolidated = memories.consolidated.filter(
      m => m.consolidatedAt > this.lastSyncTime
    );
    
    const newEpisodic = memories.episodic.filter(
      m => m.timestamp > this.lastSyncTime
    );
    
    this.lastSyncTime = now;
    
    return {
      consolidated: newConsolidated,
      episodic: newEpisodic,
    };
  }
  
  /**
   * 标记同步完成
   */
  markSyncComplete(): void {
    this.lastSyncTime = Date.now();
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

let adapterInstance: V6MemoryAdapter | null = null;

/**
 * 创建 V6 记忆适配器
 */
export function createV6MemoryAdapter(v6Memory: LayeredMemorySystem): V6MemoryAdapter {
  return new V6MemoryAdapter(v6Memory);
}

/**
 * 获取全局适配器实例
 */
export function getV6MemoryAdapter(v6Memory?: LayeredMemorySystem): V6MemoryAdapter | null {
  if (!adapterInstance && v6Memory) {
    adapterInstance = new V6MemoryAdapter(v6Memory);
  }
  return adapterInstance;
}
