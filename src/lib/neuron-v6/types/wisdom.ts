/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 智慧类型系统 (Wisdom Type System)
 * 
 * 统一的智慧定义，替代以下模块中的重复定义：
 * - wisdom-crystal.ts: WisdomCrystal
 * - long-term-memory.ts: Wisdom
 * - wisdom-space.ts: WisdomVector
 * - consciousness-legacy.ts: WisdomCrystallization
 * 
 * 设计原则：
 * - 智慧是从经验中提炼的高层次理解
 * - 支持多种智慧类型和表达形式
 * - 支持智慧的验证、应用和演化
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  BaseEntity,
  Confidence,
  Importance,
  Weight,
  Timestamp,
  EntityId,
  Source,
  EmotionalMarker,
} from './base';

// ─────────────────────────────────────────────────────────────────────
// 智慧类型枚举
// ─────────────────────────────────────────────────────────────────────

/** 智慧类型 */
export type WisdomType = 
  | 'procedural'     // 过程智慧：如何做某事
  | 'diagnostic'     // 诊断智慧：识别问题
  | 'strategic'      // 策略智慧：决策指导
  | 'relational'     // 关系智慧：事物关联
  | 'temporal'       // 时间智慧：时机把握
  | 'self_knowledge' // 自我认知：关于自己
  | 'social'         // 社交智慧：人际交往
  | 'existential'    // 存在智慧：生命意义
  | 'creative'       // 创造智慧：创新思维
  | 'emotional';     // 情感智慧：情绪管理

/** 智慧层级 */
export type WisdomTier = 
  | 'insight'        // 洞察：单一的理解点
  | 'principle'      // 原则：通用的行为准则
  | 'wisdom';        // 智慧：深层次的人生智慧

/** 智慧状态 */
export type WisdomState = 
  | 'forming'        // 形成中
  | 'validating'     // 验证中
  | 'established'    // 已确立
  | 'refining'       // 精细化中
  | 'transcended';   // 已超越（被更高层次智慧替代）

// ─────────────────────────────────────────────────────────────────────
// 核心智慧类型
// ─────────────────────────────────────────────────────────────────────

/**
 * 核心智慧 - 最小化的智慧定义
 * 所有智慧相关类型的基础
 */
export interface CoreWisdom {
  /** 唯一标识 */
  id: EntityId;
  
  /** 智慧内容（简洁的表述） */
  content: string;
  
  /** 智慧类型 */
  type: WisdomType;
  
  /** 可信度 [0, 1] */
  confidence: Confidence;
  
  /** 创建时间 */
  createdAt: Timestamp;
}

/**
 * 基础智慧 - 包含更多通用属性
 * 适用于大多数智慧存储场景
 */
export interface BaseWisdom extends CoreWisdom {
  /** 智慧摘要（一句话概括） */
  summary?: string;
  
  /** 详细描述 */
  description?: string;
  
  /** 智慧层级 */
  tier: WisdomTier;
  
  /** 智慧状态 */
  state: WisdomState;
  
  /** 重要程度 [0, 1] */
  importance: Importance;
  
  /** 来源（经验/对话/反思等） */
  source: Source;
  
  /** 来源追溯ID列表 */
  sourceIds: EntityId[];
  
  /** 验证次数 */
  validationCount: number;
  
  /** 应用次数 */
  applicationCount: number;
  
  /** 最后应用时间 */
  lastAppliedAt: Timestamp | null;
  
  /** 适用场景 */
  applicableContexts: string[];
  
  /** 相关实体 */
  relatedEntities: EntityId[];
  
  /** 情感基调 */
  emotionalTone?: string;
  
  /** 是否为核心智慧（永不遗忘） */
  isCore: boolean;
}

/**
 * 完整智慧 - 包含所有属性
 * 用于智慧的高级处理和分析
 */
export interface Wisdom extends BaseWisdom, BaseEntity {
  /** 智慧向量表示（用于语义计算） */
  vector?: number[];
  
  /** 压缩比（原始记忆长度 / 智慧长度） */
  compressionRatio?: number;
  
  /** 跨域适用性得分 [0, 1] */
  crossDomainScore: number;
  
  /** 适用领域 */
  domains: string[];
  
  /** 反例/例外情况 */
  exceptions?: string[];
  
  /** 相关智慧ID */
  relatedWisdomIds: EntityId[];
  
  /** 演化历史 */
  evolutionHistory: Array<{
    timestamp: Timestamp;
    change: string;
    trigger: string;
  }>;
  
  /** 使用效果记录 */
  effectivenessRecords: Array<{
    context: string;
    outcome: 'positive' | 'neutral' | 'negative';
    feedback?: string;
    timestamp: Timestamp;
  }>;
}

// ─────────────────────────────────────────────────────────────────────
// 智慧结晶类型
// ─────────────────────────────────────────────────────────────────────

/** 结晶来源 */
export interface CrystallizationSource {
  /** 来源记忆ID */
  memoryId: EntityId;
  
  /** 来源记忆摘要 */
  summary: string;
  
  /** 提取的关键信息 */
  extractedInfo: string;
  
  /** 贡献权重 */
  contribution: Weight;
}

/** 智慧结晶 - 从多条记忆中提炼 */
export interface WisdomCrystallization {
  /** 结晶ID */
  id: EntityId;
  
  /** 产生的智慧 */
  wisdom: Wisdom;
  
  /** 来源记忆列表 */
  sources: CrystallizationSource[];
  
  /** 原始内容摘要 */
  originalSummary: string;
  
  /** 压缩比 */
  compressionRatio: number;
  
  /** 结晶时间 */
  crystallizedAt: Timestamp;
  
  /** 结晶过程描述 */
  processDescription?: string;
}

// ─────────────────────────────────────────────────────────────────────
// 智慧指导类型
// ─────────────────────────────────────────────────────────────────────

/** 智慧指导建议 */
export interface WisdomGuidance {
  /** 相关智慧 */
  wisdom: Wisdom;
  
  /** 适用程度 [0, 1] */
  relevance: number;
  
  /** 指导建议 */
  suggestion: string;
  
  /** 应用场景匹配 */
  contextMatch: string;
  
  /** 可能的效果 */
  expectedOutcome?: string;
  
  /** 注意事项 */
  caveats?: string[];
}

// ─────────────────────────────────────────────────────────────────────
// 智慧验证类型
// ─────────────────────────────────────────────────────────────────────

/** 验证结果 */
export type ValidationResult = 
  | 'confirmed'     // 确认有效
  | 'refined'       // 需要精细化
  | 'questioned'    // 受到质疑
  | 'invalidated';  // 被证伪

/** 智慧验证事件 */
export interface WisdomValidation {
  /** 验证ID */
  id: EntityId;
  
  /** 被验证的智慧ID */
  wisdomId: EntityId;
  
  /** 验证结果 */
  result: ValidationResult;
  
  /** 验证上下文 */
  context: string;
  
  /** 验证时间 */
  timestamp: Timestamp;
  
  /** 验证详情 */
  details?: string;
  
  /** 是否导致智慧修改 */
  ledToModification: boolean;
  
  /** 修改后的智慧内容（如果有） */
  modifiedContent?: string;
}

// ─────────────────────────────────────────────────────────────────────
// 智慧升华类型
// ─────────────────────────────────────────────────────────────────────

/** 升华触发条件 */
export type SublimationTrigger = 
  | 'validation'    // 多次验证
  | 'application'   // 成功应用
  | 'integration'   // 与其他智慧整合
  | 'reflection';   // 深度反思

/** 智慧升华事件 */
export interface WisdomSublimation {
  /** 升华ID */
  id: EntityId;
  
  /** 原智慧ID */
  originalWisdomId: EntityId;
  
  /** 升华后的智慧 */
  sublimatedWisdom: Wisdom;
  
  /** 升华触发条件 */
  trigger: SublimationTrigger;
  
  /** 升华描述 */
  description: string;
  
  /** 升华时间 */
  timestamp: Timestamp;
  
  /** 层次变化 */
  tierChange: {
    from: WisdomTier;
    to: WisdomTier;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 类型守卫
// ─────────────────────────────────────────────────────────────────────

/** 检查是否为核心智慧 */
export function isCoreWisdom(obj: unknown): obj is CoreWisdom {
  const w = obj as CoreWisdom;
  return (
    typeof w?.id === 'string' &&
    typeof w?.content === 'string' &&
    typeof w?.type === 'string' &&
    typeof w?.confidence === 'number' &&
    typeof w?.createdAt === 'number'
  );
}

/** 检查是否为基础智慧 */
export function isBaseWisdom(obj: unknown): obj is BaseWisdom {
  const w = obj as BaseWisdom;
  return isCoreWisdom(w) && typeof w?.tier === 'string' && typeof w?.state === 'string';
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/** 创建核心智慧 */
export function createCoreWisdom(
  content: string,
  type: WisdomType,
  options: Partial<CoreWisdom> = {}
): CoreWisdom {
  const now = Date.now();
  return {
    id: `wisdom-${now}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    type,
    confidence: options.confidence ?? 0.5,
    createdAt: options.createdAt ?? now,
    ...options,
  };
}

/** 创建基础智慧 */
export function createBaseWisdom(
  content: string,
  type: WisdomType,
  source: Source,
  options: Partial<BaseWisdom> = {}
): BaseWisdom {
  const core = createCoreWisdom(content, type, options);
  return {
    ...core,
    tier: options.tier ?? 'insight',
    state: options.state ?? 'forming',
    importance: options.importance ?? 0.5,
    source,
    sourceIds: options.sourceIds ?? [],
    validationCount: options.validationCount ?? 0,
    applicationCount: options.applicationCount ?? 0,
    lastAppliedAt: options.lastAppliedAt ?? null,
    applicableContexts: options.applicableContexts ?? [],
    relatedEntities: options.relatedEntities ?? [],
    isCore: options.isCore ?? false,
    ...options,
  };
}

/** 智慧类型转中文 */
export function wisdomTypeToLabel(type: WisdomType): string {
  const labels: Record<WisdomType, string> = {
    procedural: '过程智慧',
    diagnostic: '诊断智慧',
    strategic: '策略智慧',
    relational: '关系智慧',
    temporal: '时间智慧',
    self_knowledge: '自我认知',
    social: '社交智慧',
    existential: '存在智慧',
    creative: '创造智慧',
    emotional: '情感智慧',
  };
  return labels[type] || type;
}

/** 智慧层级转中文 */
export function wisdomTierToLabel(tier: WisdomTier): string {
  const labels: Record<WisdomTier, string> = {
    insight: '洞察',
    principle: '原则',
    wisdom: '智慧',
  };
  return labels[tier] || tier;
}
