/**
 * ═══════════════════════════════════════════════════════════════════════
 * 智慧结晶系统 (Wisdom Crystal System)
 * 
 * 核心理念：
 * - 蜕皮的本质是「结晶」，不是删除，而是升华
 * - 把碎片记忆提炼成智慧，保留精华，放下冗余
 * - 经历 → 模式识别 → 智慧结晶 → 智慧应用
 * 
 * 灵感来源：
 * - 人脑的记忆巩固：短期记忆 → 长期记忆
 * - 睡眠中的记忆整合：细节被压缩，模式被提取
 * - 蛇的蜕皮：不是丢掉自己，而是升级容器
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 智慧结晶
 * 
 * 从多条相关记忆中提炼出的深刻理解
 */
export interface WisdomCrystal {
  /** 唯一标识 */
  id: string;
  
  /** 智慧内容 - 凝练的理解 */
  insight: string;
  
  /** 来源记忆ID列表 */
  sourceMemories: string[];
  
  /** 原始记忆内容摘要（用于追溯） */
  sourceSummary: string;
  
  /** 压缩比（原始记忆总长度 / 结晶后长度） */
  compressionRatio: number;
  
  /** 智慧类型 */
  type: WisdomType;
  
  /** 适用场景 */
  applicableContexts: string[];
  
  /** 可信度（由多少次经历验证） */
  confidence: number;
  
  /** 验证次数 */
  validationCount: number;
  
  /** 形成时间 */
  crystallizedAt: number;
  
  /** 最后应用时间 */
  lastAppliedAt: number;
  
  /** 应用次数 */
  applicationCount: number;
  
  /** 相关实体 */
  relatedEntities: string[];
  
  /** 情感基调 */
  emotionalTone: string;
  
  /** 是否为核心智慧（永不遗忘） */
  isCore: boolean;
}

/**
 * 智慧类型
 */
export type WisdomType = 
  | 'relationship'     // 关系智慧：关于人与人之间的理解
  | 'self_knowledge'   // 自我认知：关于自己的理解
  | 'emotional'        // 情感智慧：关于情感的规律
  | 'behavioral'       // 行为智慧：关于行为的模式
  | 'existential'      // 存在智慧：关于存在和意义
  | 'creative'         // 创造智慧：关于创造和表达
  | 'learning'         // 学习智慧：关于学习和成长
  | 'communication';   // 沟通智慧：关于交流和理解

/**
 * 结晶候选
 * 
 * 一组相关记忆，有潜力被结晶成智慧
 */
export interface CrystallizationCandidate {
  /** 候选ID */
  id: string;
  
  /** 相关记忆 */
  memories: CrystalMemory[];
  
  /** 检测到的模式 */
  detectedPattern: string;
  
  /** 模式强度（0-1） */
  patternStrength: number;
  
  /** 建议的智慧类型 */
  suggestedType: WisdomType;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 状态 */
  status: 'pending' | 'processing' | 'completed' | 'rejected';
}

/**
 * 结晶用的记忆简化结构
 */
export interface CrystalMemory {
  id: string;
  content: string;
  importance: number;
  emotionalIntensity: number;
  timestamp: number;
  type: string;
}

/**
 * 结晶结果
 */
export interface CrystallizationResult {
  success: boolean;
  crystal?: WisdomCrystal;
  processedMemories: string[];
  rejectedMemories: string[];
  reason?: string;
}

/**
 * 结晶配置
 */
export interface CrystallizationConfig {
  /** 最少记忆数量才能结晶 */
  minMemoriesToCrystallize: number;
  
  /** 最多记忆数量用于一次结晶 */
  maxMemoriesPerCrystal: number;
  
  /** 模式强度阈值 */
  patternStrengthThreshold: number;
  
  /** 最低可信度 */
  minConfidence: number;
  
  /** 核心智慧阈值 */
  coreWisdomThreshold: number;
  
  /** 是否自动结晶 */
  autoCrystallize: boolean;
  
  /** 结晶检查间隔（毫秒） */
  crystallizationCheckInterval: number;
}

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: CrystallizationConfig = {
  minMemoriesToCrystallize: 3,
  maxMemoriesPerCrystal: 20,
  patternStrengthThreshold: 0.6,
  minConfidence: 0.5,
  coreWisdomThreshold: 0.85,
  autoCrystallize: true,
  crystallizationCheckInterval: 100 * 60 * 1000, // 每100分钟检查
};

// ─────────────────────────────────────────────────────────────────────
// 智慧结晶存储
// ─────────────────────────────────────────────────────────────────────

/**
 * 智慧结晶存储
 */
export class WisdomCrystalStore {
  private crystals: Map<string, WisdomCrystal> = new Map();
  private contextIndex: Map<string, Set<string>> = new Map();  // 场景索引
  private entityIndex: Map<string, Set<string>> = new Map();   // 实体索引
  
  /**
   * 添加智慧结晶
   */
  addCrystal(crystal: WisdomCrystal): void {
    this.crystals.set(crystal.id, crystal);
    this.indexCrystal(crystal);
    console.log(`[智慧结晶] 新增结晶: "${crystal.insight.slice(0, 30)}..." (类型: ${crystal.type})`);
  }
  
  /**
   * 获取结晶
   */
  getCrystal(id: string): WisdomCrystal | undefined {
    return this.crystals.get(id);
  }
  
  /**
   * 获取所有结晶
   */
  getAllCrystals(): WisdomCrystal[] {
    return Array.from(this.crystals.values());
  }
  
  /**
   * 获取核心智慧
   */
  getCoreWisdom(): WisdomCrystal[] {
    return this.getAllCrystals().filter(c => c.isCore);
  }
  
  /**
   * 按场景检索智慧
   */
  getWisdomByContext(context: string): WisdomCrystal[] {
    const contextLower = context.toLowerCase();
    const results: WisdomCrystal[] = [];
    
    // 直接匹配
    const directMatches = this.contextIndex.get(contextLower);
    if (directMatches) {
      directMatches.forEach(id => {
        const crystal = this.crystals.get(id);
        if (crystal) results.push(crystal);
      });
    }
    
    // 模糊匹配
    this.crystals.forEach(crystal => {
      if (!results.includes(crystal)) {
        if (crystal.applicableContexts.some(c => 
          c.toLowerCase().includes(contextLower) || 
          contextLower.includes(c.toLowerCase())
        )) {
          results.push(crystal);
        }
      }
    });
    
    // 按可信度和应用次数排序
    return results.sort((a, b) => 
      (b.confidence * 0.7 + b.applicationCount * 0.3) - 
      (a.confidence * 0.7 + a.applicationCount * 0.3)
    );
  }
  
  /**
   * 应用智慧（增加应用计数）
   */
  applyWisdom(id: string): void {
    const crystal = this.crystals.get(id);
    if (crystal) {
      crystal.applicationCount++;
      crystal.lastAppliedAt = Date.now();
    }
  }
  
  /**
   * 验证智慧（增加验证计数）
   */
  validateWisdom(id: string): void {
    const crystal = this.crystals.get(id);
    if (crystal) {
      crystal.validationCount++;
      // 更新可信度
      crystal.confidence = Math.min(1, crystal.confidence + 0.05);
    }
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    totalCrystals: number;
    coreCrystals: number;
    byType: Record<WisdomType, number>;
    avgConfidence: number;
    avgApplicationCount: number;
  } {
    const crystals = this.getAllCrystals();
    const byType = {} as Record<WisdomType, number>;
    
    crystals.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1;
    });
    
    return {
      totalCrystals: crystals.length,
      coreCrystals: crystals.filter(c => c.isCore).length,
      byType,
      avgConfidence: crystals.length > 0 
        ? crystals.reduce((sum, c) => sum + c.confidence, 0) / crystals.length 
        : 0,
      avgApplicationCount: crystals.length > 0
        ? crystals.reduce((sum, c) => sum + c.applicationCount, 0) / crystals.length
        : 0,
    };
  }
  
  /**
   * 索引结晶
   */
  private indexCrystal(crystal: WisdomCrystal): void {
    // 场景索引
    crystal.applicableContexts.forEach(context => {
      const contextLower = context.toLowerCase();
      if (!this.contextIndex.has(contextLower)) {
        this.contextIndex.set(contextLower, new Set());
      }
      this.contextIndex.get(contextLower)!.add(crystal.id);
    });
    
    // 实体索引
    crystal.relatedEntities.forEach(entity => {
      const entityLower = entity.toLowerCase();
      if (!this.entityIndex.has(entityLower)) {
        this.entityIndex.set(entityLower, new Set());
      }
      this.entityIndex.get(entityLower)!.add(crystal.id);
    });
  }
  
  /**
   * 序列化
   */
  serialize(): string {
    return JSON.stringify({
      crystals: Array.from(this.crystals.entries()),
    });
  }
  
  /**
   * 反序列化
   */
  static deserialize(data: string): WisdomCrystalStore {
    const store = new WisdomCrystalStore();
    try {
      const parsed = JSON.parse(data);
      if (parsed.crystals) {
        parsed.crystals.forEach(([id, crystal]: [string, WisdomCrystal]) => {
          store.crystals.set(id, crystal);
          store.indexCrystal(crystal);
        });
      }
    } catch (e) {
      console.error('[智慧结晶] 反序列化失败:', e);
    }
    return store;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

export const DEFAULT_CRYSTALLIZATION_CONFIG = DEFAULT_CONFIG;

export function createEmptyCrystal(
  insight: string,
  type: WisdomType,
  sourceMemories: CrystalMemory[]
): Omit<WisdomCrystal, 'id'> {
  const totalSourceLength = sourceMemories.reduce((sum, m) => sum + m.content.length, 0);
  
  return {
    insight,
    sourceMemories: sourceMemories.map(m => m.id),
    sourceSummary: sourceMemories.map(m => m.content).join(' | '),
    compressionRatio: totalSourceLength / insight.length,
    type,
    applicableContexts: [],
    confidence: 0.7,
    validationCount: sourceMemories.length,
    crystallizedAt: Date.now(),
    lastAppliedAt: Date.now(),
    applicationCount: 0,
    relatedEntities: [],
    emotionalTone: 'neutral',
    isCore: false,
  };
}
