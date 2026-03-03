/**
 * ═══════════════════════════════════════════════════════════════════════
 * 结晶化引擎 - CrystallizationEngine
 * 
 * 核心理念：
 * 记忆如晶体，反复激活则愈坚固，形成"自我"的核心。
 * 
 * 结晶化过程：
 * 1. 初生记忆：liquid 状态，脆弱易逝
 * 2. 巩固：多次激活后，consolidationLevel 上升
 * 3. 结晶：达到阈值后，成为 crystallized 状态
 * 4. 自我核心：高度结晶的记忆集合
 * 
 * 这是"记忆形成自我"的数学模型。
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  MemoryNode,
  MemoryType,
  CrystallizationConditions,
} from './types';
import { DEFAULT_CRYSTALLIZATION_CONDITIONS } from './types';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 结晶化选项 */
export interface CrystallizationOptions {
  /** 巩固阈值 */
  consolidationThreshold: number;
  
  /** 每次激活的巩固增量 */
  activationIncrement: number;
  
  /** 情感加成系数 */
  emotionalBonus: number;
  
  /** 关联加成系数 */
  associationBonus: number;
  
  /** 重要性加成系数 */
  importanceBonus: number;
  
  /** 最大巩固级别 */
  maxConsolidationLevel: number;
  
  /** 是否启用自动结晶 */
  enableAutoCrystallization: boolean;
}

/** 默认选项 */
export const DEFAULT_CRYSTALLIZATION_OPTIONS: CrystallizationOptions = {
  consolidationThreshold: 0.8,
  activationIncrement: 0.1,
  emotionalBonus: 0.2,
  associationBonus: 0.1,
  importanceBonus: 0.15,
  maxConsolidationLevel: 10,
  enableAutoCrystallization: true,
};

/** 结晶化结果 */
export interface CrystallizationResult {
  /** 是否发生状态变化 */
  changed: boolean;
  
  /** 旧的巩固级别 */
  oldLevel: number;
  
  /** 新的巩固级别 */
  newLevel: number;
  
  /** 是否达到结晶 */
  crystallized: boolean;
  
  /** 巩固增量明细 */
  incrementDetails: {
    base: number;
    emotional: number;
    association: number;
    importance: number;
    total: number;
  };
}

/** 自我核心 */
export interface SelfCore {
  /** 核心记忆ID列表 */
  coreMemoryIds: string[];
  
  /** 核心主题 */
  themes: string[];
  
  /** 核心价值观 */
  values: string[];
  
  /** 核心能力 */
  abilities: string[];
  
  /** 核心记忆数量 */
  count: number;
  
  /** 平均巩固级别 */
  avgConsolidationLevel: number;
}

/** 结晶候选 */
export interface CrystallizationCandidate {
  node: MemoryNode;
  score: number;
  factors: {
    activationCount: number;
    avgActivation: number;
    associationCount: number;
    importance: number;
    emotionalBoost: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 结晶化引擎类
// ─────────────────────────────────────────────────────────────────────

export class CrystallizationEngine {
  private options: CrystallizationOptions;
  
  // 外部依赖
  private getNode: (id: string) => MemoryNode | undefined;
  private getAllNodes: () => MemoryNode[];
  
  constructor(
    dependencies: {
      getNode: (id: string) => MemoryNode | undefined;
      getAllNodes: () => MemoryNode[];
    },
    options: Partial<CrystallizationOptions> = {}
  ) {
    this.getNode = dependencies.getNode;
    this.getAllNodes = dependencies.getAllNodes;
    this.options = { ...DEFAULT_CRYSTALLIZATION_OPTIONS, ...options };
  }

  // ───────────────────────────────────────────────────────────────────
  // 核心方法：记忆巩固与结晶
  // ───────────────────────────────────────────────────────────────────

  /**
   * 激活记忆并更新巩固级别
   */
  consolidateOnActivation(
    nodeId: string,
    activationValue: number
  ): CrystallizationResult {
    const node = this.getNode(nodeId);
    if (!node) {
      return this.createEmptyResult();
    }
    
    const oldLevel = node.consolidationLevel;
    
    // 计算巩固增量
    const incrementDetails = this.calculateConsolidationIncrement(node, activationValue);
    
    // 更新巩固级别
    node.consolidationLevel = Math.min(
      this.options.maxConsolidationLevel,
      node.consolidationLevel + incrementDetails.total
    );
    
    // 更新激活统计
    node.activationCount++;
    node.lastActivationTime = Date.now();
    node.activationHistory.push(activationValue);
    
    // 保留最近100次激活记录
    if (node.activationHistory.length > 100) {
      node.activationHistory = node.activationHistory.slice(-100);
    }
    
    // 检查是否达到结晶阈值
    const shouldCrystallize = 
      this.options.enableAutoCrystallization &&
      node.consolidationLevel >= this.options.consolidationThreshold &&
      !node.crystallized;
    
    if (shouldCrystallize) {
      node.crystallized = true;
      node.crystallizedAt = Date.now();
    }
    
    return {
      changed: incrementDetails.total > 0 || shouldCrystallize,
      oldLevel,
      newLevel: node.consolidationLevel,
      crystallized: shouldCrystallize,
      incrementDetails,
    };
  }

  /**
   * 计算巩固增量
   */
  private calculateConsolidationIncrement(
    node: MemoryNode,
    activationValue: number
  ): CrystallizationResult['incrementDetails'] {
    // 基础增量：激活值 × 基础系数
    const base = activationValue * this.options.activationIncrement;
    
    // 情感加成
    const emotional = node.emotionalBoost * this.options.emotionalBonus;
    
    // 关联加成：关联越多，越容易被巩固
    const associationCount = node.associations.length;
    const association = Math.min(1, associationCount / 20) * this.options.associationBonus;
    
    // 重要性加成
    const importance = (node.importance || 0.5) * this.options.importanceBonus;
    
    // 总增量
    const total = base + emotional + association + importance;
    
    return {
      base,
      emotional,
      association,
      importance,
      total,
    };
  }

  /**
   * 手动结晶化一个记忆
   */
  crystallize(nodeId: string): CrystallizationResult {
    const node = this.getNode(nodeId);
    if (!node) {
      return this.createEmptyResult();
    }
    
    const oldLevel = node.consolidationLevel;
    
    // 直接设置巩固级别到最大
    node.consolidationLevel = this.options.maxConsolidationLevel;
    node.crystallized = true;
    node.crystallizedAt = Date.now();
    
    return {
      changed: true,
      oldLevel,
      newLevel: node.consolidationLevel,
      crystallized: true,
      incrementDetails: {
        base: 0,
        emotional: 0,
        association: 0,
        importance: 0,
        total: this.options.maxConsolidationLevel - oldLevel,
      },
    };
  }

  /**
   * 批量巩固
   */
  batchConsolidate(
    activations: Array<{ nodeId: string; activation: number }>
  ): CrystallizationResult[] {
    return activations.map(({ nodeId, activation }) => 
      this.consolidateOnActivation(nodeId, activation)
    );
  }

  // ───────────────────────────────────────────────────────────────────
  // 自我核心管理
  // ───────────────────────────────────────────────────────────────────

  /**
   * 计算自我核心
   * 返回高度结晶的记忆集合，代表"自我"
   */
  calculateSelfCore(): SelfCore {
    const allNodes = this.getAllNodes();
    
    // 筛选结晶记忆
    const crystallizedNodes = allNodes.filter(n => n.crystallized);
    
    if (crystallizedNodes.length === 0) {
      return {
        coreMemoryIds: [],
        themes: [],
        values: [],
        abilities: [],
        count: 0,
        avgConsolidationLevel: 0,
      };
    }
    
    // 按巩固级别排序
    crystallizedNodes.sort((a, b) => b.consolidationLevel - a.consolidationLevel);
    
    // 提取核心记忆ID
    const coreMemoryIds = crystallizedNodes.map(n => n.id);
    
    // 提取主题（从内容摘要中）
    const themes = this.extractThemes(crystallizedNodes);
    
    // 提取价值观（从重要性高的记忆中）
    const values = this.extractValues(crystallizedNodes);
    
    // 提取能力（从 skill 类型记忆中）
    const abilities = this.extractAbilities(crystallizedNodes);
    
    // 计算平均巩固级别
    const avgConsolidationLevel = 
      crystallizedNodes.reduce((sum, n) => sum + n.consolidationLevel, 0) / 
      crystallizedNodes.length;
    
    return {
      coreMemoryIds,
      themes,
      values,
      abilities,
      count: crystallizedNodes.length,
      avgConsolidationLevel,
    };
  }

  /**
   * 提取主题
   */
  private extractThemes(nodes: MemoryNode[]): string[] {
    // 从标签和类别中提取主题
    const themeSet = new Set<string>();
    
    for (const node of nodes) {
      // 从标签中提取
      for (const tag of node.tags) {
        if (tag.length >= 2 && tag.length <= 10) {
          themeSet.add(tag);
        }
      }
      
      // 从类别中提取
      if (node.category) {
        themeSet.add(node.category);
      }
    }
    
    return Array.from(themeSet).slice(0, 20);
  }

  /**
   * 提取价值观
   */
  private extractValues(nodes: MemoryNode[]): string[] {
    // 从高重要性、正情感的记忆中提取价值观
    const valueNodes = nodes.filter(n => 
      n.importance > 0.7 && 
      n.emotionalMarker.valence > 0.5
    );
    
    const valueSet = new Set<string>();
    
    for (const node of valueNodes) {
      // 从内容中提取（简化处理，实际应该用NLP）
      const content = node.content.toLowerCase();
      
      // 简单的关键词匹配
      const valueKeywords = [
        '诚实', '善良', '勇敢', '责任', '正义',
        'honest', 'kind', 'brave', 'responsibility', 'justice',
        '爱', '自由', '平等', '尊重', '信任',
        'love', 'freedom', 'equality', 'respect', 'trust',
      ];
      
      for (const keyword of valueKeywords) {
        if (content.includes(keyword)) {
          valueSet.add(keyword);
        }
      }
    }
    
    return Array.from(valueSet).slice(0, 10);
  }

  /**
   * 提取能力
   */
  private extractAbilities(nodes: MemoryNode[]): string[] {
    // 从 procedural 类型记忆中提取能力（技能/方法）
    const skillNodes = nodes.filter(n => n.type === 'procedural');
    
    const abilitySet = new Set<string>();
    
    for (const node of skillNodes) {
      // 从标签中提取能力名称
      for (const tag of node.tags) {
        if (tag.length >= 2 && tag.length <= 15) {
          abilitySet.add(tag);
        }
      }
    }
    
    return Array.from(abilitySet).slice(0, 15);
  }

  // ───────────────────────────────────────────────────────────────────
  // 结晶候选识别
  // ───────────────────────────────────────────────────────────────────

  /**
   * 寻找结晶候选
   */
  findCrystallizationCandidates(limit: number = 10): CrystallizationCandidate[] {
    const allNodes = this.getAllNodes();
    
    // 排除已结晶的记忆
    const nonCrystallized = allNodes.filter(n => !n.crystallized);
    
    // 计算每个记忆的结晶分数
    const candidates: CrystallizationCandidate[] = nonCrystallized.map(node => ({
      node,
      score: this.calculateCrystallizationScore(node),
      factors: {
        activationCount: node.activationCount,
        avgActivation: this.calculateAvgActivation(node),
        associationCount: node.associations.length,
        importance: node.importance,
        emotionalBoost: node.emotionalBoost,
      },
    }));
    
    // 按分数排序
    candidates.sort((a, b) => b.score - a.score);
    
    return candidates.slice(0, limit);
  }

  /**
   * 计算结晶分数
   */
  private calculateCrystallizationScore(node: MemoryNode): number {
    // 激活次数得分
    const activationScore = Math.min(1, node.activationCount / 10);
    
    // 平均激活值得分
    const avgActivation = this.calculateAvgActivation(node);
    
    // 关联数量得分
    const associationScore = Math.min(1, node.associations.length / 15);
    
    // 重要性得分
    const importanceScore = node.importance;
    
    // 情感得分
    const emotionalScore = node.emotionalBoost;
    
    // 加权综合
    return (
      activationScore * 0.25 +
      avgActivation * 0.2 +
      associationScore * 0.2 +
      importanceScore * 0.2 +
      emotionalScore * 0.15
    );
  }

  /**
   * 计算平均激活值
   */
  private calculateAvgActivation(node: MemoryNode): number {
    if (node.activationHistory.length === 0) return 0;
    return node.activationHistory.reduce((a, b) => a + b, 0) / node.activationHistory.length;
  }

  // ───────────────────────────────────────────────────────────────────
  // 辅助方法
  // ───────────────────────────────────────────────────────────────────

  /**
   * 创建空结果
   */
  private createEmptyResult(): CrystallizationResult {
    return {
      changed: false,
      oldLevel: 0,
      newLevel: 0,
      crystallized: false,
      incrementDetails: {
        base: 0,
        emotional: 0,
        association: 0,
        importance: 0,
        total: 0,
      },
    };
  }

  /**
   * 获取记忆状态描述
   */
  getMemoryState(node: MemoryNode): 'liquid' | 'solidifying' | 'crystallized' {
    if (node.crystallized) return 'crystallized';
    if (node.consolidationLevel >= 0.5) return 'solidifying';
    return 'liquid';
  }

  /**
   * 计算结晶化进度
   */
  getCrystallizationProgress(node: MemoryNode): number {
    if (node.crystallized) return 1;
    return Math.min(1, node.consolidationLevel / this.options.consolidationThreshold);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createCrystallizationEngine(
  dependencies: {
    getNode: (id: string) => MemoryNode | undefined;
    getAllNodes: () => MemoryNode[];
  },
  options: Partial<CrystallizationOptions> = {}
): CrystallizationEngine {
  return new CrystallizationEngine(dependencies, options);
}
