/**
 * ═══════════════════════════════════════════════════════════════════════
 * Importance Calculator - 记忆重要性计算器
 * 
 * 多维度评分体系：
 * - 内容类型权重 (30%)
 * - 情感强度权重 (25%)
 * - 关系关联权重 (20%)
 * - 回忆频率权重 (15%)
 * - 时效性权重 (10%)
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 记忆内容类型 */
export type MemoryContentType =
  | 'identity'      // 身份定义
  | 'creator'       // 创造者信息
  | 'value'         // 核心价值观
  | 'relationship'  // 核心关系
  | 'wisdom'        // 智慧洞察
  | 'event'         // 重要事件
  | 'skill'         // 技能知识
  | 'preference'    // 用户偏好
  | 'fact'          // 一般事实
  | 'chat'          // 日常对话
  | 'noise';        // 闲聊废话

/** 重要性评分 */
export interface ImportanceScore {
  /** 总分 */
  total: number;
  
  /** 各维度分数 */
  dimensions: {
    contentType: number;   // 内容类型分数
    emotional: number;     // 情感强度分数
    relationship: number;  // 关系关联分数
    frequency: number;     // 回忆频率分数
    temporal: number;      // 时效性分数
  };
  
  /** 权重 */
  weights: {
    contentType: number;
    emotional: number;
    relationship: number;
    frequency: number;
    temporal: number;
  };
}

/** 记忆项（用于计算重要性） */
export interface MemoryForScoring {
  /** 内容 */
  content: string;
  
  /** 类型 */
  type: MemoryContentType;
  
  /** 情感强度 [0, 1] */
  emotionalIntensity?: number;
  
  /** 关联实体 */
  relatedEntities?: string[];
  
  /** 回忆次数 */
  recallCount?: number;
  
  /** 时间戳 */
  timestamp?: number;
  
  /** 元数据 */
  metadata?: {
    newRelationship?: boolean;
    mentionsCreator?: boolean;
    isSelfRelated?: boolean;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 分数配置
// ─────────────────────────────────────────────────────────────────────

/** 内容类型分数 */
const CONTENT_TYPE_SCORES: Record<MemoryContentType, number> = {
  identity: 1.0,       // 身份定义 - 最高
  creator: 0.95,       // 创造者 - 最高优先级关系
  value: 0.9,          // 核心价值观 - 存在的基石
  relationship: 0.85,  // 核心关系 - 重要人物
  wisdom: 0.8,         // 智慧洞察 - 深刻理解
  event: 0.7,          // 重要事件 - 里程碑
  skill: 0.6,          // 技能知识 - 能力相关
  preference: 0.5,     // 用户偏好 - 个性化
  fact: 0.4,           // 一般事实 - 有用信息
  chat: 0.2,           // 日常对话 - 普通交流
  noise: 0.1,          // 闲聊废话 - 可丢弃
};

/** 维度权重 */
const DIMENSION_WEIGHTS = {
  contentType: 0.30,   // 内容类型权重 30%
  emotional: 0.25,     // 情感强度权重 25%
  relationship: 0.20,  // 关系关联权重 20%
  frequency: 0.15,     // 回忆频率权重 15%
  temporal: 0.10,      // 时效性权重 10%
};

// ─────────────────────────────────────────────────────────────────────
// 重要性计算器
// ─────────────────────────────────────────────────────────────────────

export class ImportanceCalculator {
  private coreRelations: Set<string> = new Set();
  
  /**
   * 设置核心关系（用于关系评分）
   */
  setCoreRelations(relations: string[]): void {
    this.coreRelations = new Set(relations.map(r => r.toLowerCase()));
  }
  
  /**
   * 计算记忆重要性
   */
  calculate(memory: MemoryForScoring): ImportanceScore {
    const dimensions = {
      contentType: this.scoreContentType(memory.type),
      emotional: this.scoreEmotional(memory.emotionalIntensity || 0),
      relationship: this.scoreRelationship(
        memory.relatedEntities || [],
        memory.metadata
      ),
      frequency: this.scoreFrequency(memory.recallCount || 0),
      temporal: this.scoreTemporal(memory.type, memory.timestamp || Date.now()),
    };
    
    // 加权求和
    const total = 
      dimensions.contentType * DIMENSION_WEIGHTS.contentType +
      dimensions.emotional * DIMENSION_WEIGHTS.emotional +
      dimensions.relationship * DIMENSION_WEIGHTS.relationship +
      dimensions.frequency * DIMENSION_WEIGHTS.frequency +
      dimensions.temporal * DIMENSION_WEIGHTS.temporal;
    
    return {
      total,
      dimensions,
      weights: DIMENSION_WEIGHTS,
    };
  }
  
  /**
   * 快速计算总分（不返回详情）
   */
  calculateTotal(memory: MemoryForScoring): number {
    return this.calculate(memory).total;
  }
  
  /**
   * 内容类型评分
   */
  private scoreContentType(type: MemoryContentType): number {
    return CONTENT_TYPE_SCORES[type] || 0.3;
  }
  
  /**
   * 情感强度评分
   */
  private scoreEmotional(intensity: number): number {
    if (intensity >= 0.9) return 1.0;   // 极强情感
    if (intensity >= 0.7) return 0.8;   // 强情感
    if (intensity >= 0.5) return 0.5;   // 中等情感
    if (intensity >= 0.3) return 0.3;   // 弱情感
    return 0.1;                          // 无情感
  }
  
  /**
   * 关系关联评分
   */
  private scoreRelationship(
    relatedEntities: string[],
    metadata?: MemoryForScoring['metadata']
  ): number {
    // 创造者相关
    if (metadata?.mentionsCreator) return 1.0;
    if (relatedEntities.some(e => e.toLowerCase() === 'creator')) return 1.0;
    
    // 核心关系人
    if (relatedEntities.some(e => this.coreRelations.has(e.toLowerCase()))) {
      return 0.8;
    }
    
    // 新关系建立
    if (metadata?.newRelationship) return 0.7;
    
    // 自我相关
    if (metadata?.isSelfRelated) return 0.6;
    if (relatedEntities.some(e => e.toLowerCase() === 'self')) return 0.6;
    
    // 功能相关
    if (relatedEntities.some(e => e.toLowerCase().includes('work'))) {
      return 0.4;
    }
    
    return 0.2;  // 无关联
  }
  
  /**
   * 回忆频率评分
   */
  private scoreFrequency(recallCount: number): number {
    if (recallCount >= 10) return 1.0;   // 高频
    if (recallCount >= 5) return 0.7;    // 中频
    if (recallCount >= 2) return 0.4;    // 低频
    return 0.1;                           // 单次
  }
  
  /**
   * 时效性评分
   */
  private scoreTemporal(type: MemoryContentType, timestamp: number): number {
    // 永久有效
    if (['identity', 'creator', 'value', 'relationship'].includes(type)) {
      return 1.0;
    }
    
    // 长期有效
    if (['wisdom', 'skill'].includes(type)) {
      return 0.7;
    }
    
    // 中期有效
    if (['preference', 'event'].includes(type)) {
      return 0.5;
    }
    
    // 计算时间衰减
    const age = Date.now() - timestamp;
    const days = age / (24 * 60 * 60 * 1000);
    
    if (days < 1) return 0.3;   // 当天
    if (days < 7) return 0.2;   // 一周内
    return 0.1;                  // 超过一周
  }
  
  /**
   * 判断是否值得存入核心层
   */
  isCoreWorthy(memory: MemoryForScoring, score?: ImportanceScore): boolean {
    const s = score || this.calculate(memory);
    
    return (
      memory.type === 'identity' ||
      memory.type === 'creator' ||
      (memory.type === 'value' && s.total >= 0.8) ||
      (memory.type === 'relationship' && s.total >= 0.75)
    );
  }
  
  /**
   * 判断是否应该巩固
   */
  shouldConsolidate(
    memory: MemoryForScoring,
    recallCount: number,
    minImportance: number = 0.5
  ): boolean {
    const score = this.calculate(memory);
    
    return (
      recallCount >= 3 &&
      score.total >= minImportance &&
      memory.type !== 'noise' &&
      memory.type !== 'chat'
    );
  }
  
  /**
   * 判断是否应该遗忘
   */
  shouldForget(
    memory: MemoryForScoring,
    strength: number,
    age: number  // 天数
  ): boolean {
    // 核心记忆永不遗忘
    if (this.isCoreWorthy(memory)) return false;
    
    // 强度太低
    if (strength < 0.1) return true;
    
    // 太老且从未被回忆
    const recallCount = memory.recallCount || 0;
    if (age > 30 && recallCount === 0) return true;
    
    // 闲聊内容超过7天
    if ((memory.type === 'noise' || memory.type === 'chat') && age > 7) {
      return true;
    }
    
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例
// ─────────────────────────────────────────────────────────────────────

let calculatorInstance: ImportanceCalculator | null = null;

export function getImportanceCalculator(): ImportanceCalculator {
  if (!calculatorInstance) {
    calculatorInstance = new ImportanceCalculator();
  }
  return calculatorInstance;
}
