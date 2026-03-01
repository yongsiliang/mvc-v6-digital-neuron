/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 价值观类型系统 (Value Type System)
 * 
 * 统一的价值观定义，替代以下模块中的重复定义：
 * - value-evolution.ts: Value
 * - meaning-system.ts: Value
 * - consciousness-legacy.ts: ValueLegacy
 * 
 * 设计原则：
 * - 价值观是多层次的（核心、重要、情境）
 * - 价值观可以冲突和演化
 * - 价值观指导决策和行为
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
} from './base';

// ─────────────────────────────────────────────────────────────────────
// 价值类型枚举
// ─────────────────────────────────────────────────────────────────────

/** 价值层级 */
export type ValueTier = 
  | 'core'         // 核心：最基础、最稳定
  | 'important'    // 重要：重要但可微调
  | 'situational'; // 情境：依赖上下文

/** 价值类型 */
export type ValueType = 
  | 'moral'        // 道德价值
  | 'aesthetic'    // 审美价值
  | 'intellectual' // 知识价值
  | 'social'       // 社会价值
  | 'personal'     // 个人价值
  | 'existential'; // 存在价值

/** 价值状态 */
export type ValueState = 
  | 'active'       // 活跃：当前在用
  | 'dormant'      // 休眠：暂时不活跃
  | 'conflicted'   // 冲突：与其他价值冲突
  | 'evolving';    // 演化：正在变化

/** 价值来源 */
export type ValueSource = 
  | 'innate'       // 先天/预置
  | 'learned'      // 学习获得
  | 'derived'      // 从其他价值推导
  | 'reflected'    // 反思获得
  | 'chosen';      // 主动选择

// ─────────────────────────────────────────────────────────────────────
// 核心价值类型
// ─────────────────────────────────────────────────────────────────────

/**
 * 核心价值 - 最小化的价值定义
 * 所有价值相关类型的基础
 */
export interface CoreValue {
  /** 唯一标识 */
  id: EntityId;
  
  /** 价值名称 */
  name: string;
  
  /** 价值描述 */
  description: string;
  
  /** 价值层级 */
  tier: ValueTier;
  
  /** 重要权重 [0, 1] */
  weight: Weight;
  
  /** 创建时间 */
  createdAt: Timestamp;
}

/**
 * 基础价值 - 包含更多通用属性
 * 适用于大多数价值存储场景
 */
export interface BaseValue extends CoreValue {
  /** 价值类型 */
  type: ValueType;
  
  /** 置信度 [0, 1] */
  confidence: Confidence;
  
  /** 当前状态 */
  state: ValueState;
  
  /** 来源 */
  source: ValueSource;
  
  /** 最后强化时间 */
  lastReinforcedAt: Timestamp;
  
  /** 强化次数 */
  reinforcementCount: number;
  
  /** 相关经历ID */
  relatedExperiences: EntityId[];
  
  /** 是否活跃 */
  isActive: boolean;
  
  /** 适用上下文（情境价值用） */
  applicableContexts?: string[];
}

/**
 * 完整价值 - 包含所有属性
 * 用于价值的高级处理和分析
 */
export interface Value extends BaseValue, BaseEntity {
  /** 价值层级（数字形式，便于比较） */
  priority: number;
  
  /** 相关价值ID */
  relatedValueIds: EntityId[];
  
  /** 演化历史 */
  evolutionHistory: ValueEvolutionEvent[];
  
  /** 冲突记录 */
  conflicts: ValueConflictSummary[];
  
  /** 行为指导 */
  behavioralGuidelines: string[];
  
  /** 边界条件（何时这个价值不适用） */
  boundaryConditions?: string[];
}

// ─────────────────────────────────────────────────────────────────────
// 价值冲突类型
// ─────────────────────────────────────────────────────────────────────

/** 冲突类型 */
export type ConflictType = 
  | 'direct'       // 直接冲突：完全对立
  | 'tension'      // 张力：存在矛盾但可调和
  | 'contextual';  // 情境冲突：特定情境下冲突

/** 冲突强度 */
export type ConflictIntensity = 'low' | 'medium' | 'high' | 'critical';

/** 价值冲突摘要 */
export interface ValueConflictSummary {
  /** 冲突ID */
  id: EntityId;
  
  /** 对立价值ID */
  conflictingValueId: EntityId;
  
  /** 对立价值名称 */
  conflictingValueName: string;
  
  /** 冲突类型 */
  type: ConflictType;
  
  /** 冲突强度 */
  intensity: ConflictIntensity;
}

/** 完整价值冲突 */
export interface ValueConflict {
  /** 冲突ID */
  id: EntityId;
  
  /** 价值A的ID */
  valueAId: EntityId;
  
  /** 价值B的ID */
  valueBId: EntityId;
  
  /** 冲突类型 */
  conflictType: ConflictType;
  
  /** 冲突描述 */
  description: string;
  
  /** 冲突强度 [0, 1] */
  intensity: number;
  
  /** 冲突上下文 */
  context: string;
  
  /** 解决方案 */
  resolution?: ValueResolution;
  
  /** 检测时间 */
  detectedAt: Timestamp;
  
  /** 是否已解决 */
  isResolved: boolean;
}

/** 冲突解决方案 */
export interface ValueResolution {
  /** 解决类型 */
  type: 'prioritization' | 'integration' | 'contextualization' | 'transcendence';
  
  /** 解决描述 */
  description: string;
  
  /** 选择的价值（如果是优先化） */
  chosenValueId?: EntityId;
  
  /** 综合结果（如果是整合） */
  synthesis?: string;
  
  /** 上下文区分（如果是情境化） */
  contextRules?: Array<{
    context: string;
    preferredValueId: EntityId;
  }>;
  
  /** 解决时间 */
  resolvedAt: Timestamp;
}

// ─────────────────────────────────────────────────────────────────────
// 价值演化类型
// ─────────────────────────────────────────────────────────────────────

/** 演化类型 */
export type EvolutionType = 
  | 'addition'       // 新增
  | 'strengthening'  // 强化
  | 'weakening'      // 弱化
  | 'modification'   // 修改
  | 'retirement'     // 退役
  | 'elevation'      // 提升层级
  | 'demotion';      // 降低层级

/** 价值演化事件 */
export interface ValueEvolutionEvent {
  /** 事件ID */
  id: EntityId;
  
  /** 演化类型 */
  type: EvolutionType;
  
  /** 相关价值ID */
  valueId: EntityId;
  
  /** 变化前的值 */
  previousValue?: {
    weight?: Weight;
    tier?: ValueTier;
    confidence?: Confidence;
  };
  
  /** 变化后的值 */
  newValue?: {
    weight?: Weight;
    tier?: ValueTier;
    confidence?: Confidence;
  };
  
  /** 变化原因 */
  reason: string;
  
  /** 触发上下文 */
  triggerContext?: string;
  
  /** 时间戳 */
  timestamp: Timestamp;
}

// ─────────────────────────────────────────────────────────────────────
// 价值判断类型
// ─────────────────────────────────────────────────────────────────────

/** 价值判断请求 */
export interface ValueJudgmentRequest {
  /** 请求ID */
  id: EntityId;
  
  /** 情境描述 */
  situation: string;
  
  /** 可选方案 */
  options: Array<{
    id: EntityId;
    description: string;
    implications?: string[];
  }>;
  
  /** 相关上下文 */
  context?: string;
  
  /** 需要考虑的价值观（可选） */
  relevantValues?: EntityId[];
}

/** 价值判断结果 */
export interface ValueJudgmentResult {
  /** 请求ID */
  requestId: EntityId;
  
  /** 评估的选项 */
  optionId: EntityId;
  
  /** 评分 [-1, 1] */
  score: number;
  
  /** 推理过程 */
  reasoning: string;
  
  /** 激活的价值观 */
  activatedValues: Array<{
    valueId: EntityId;
    valueName: string;
    activation: number;
    stance: 'support' | 'oppose' | 'neutral';
  }>;
  
  /** 冲突警告 */
  conflictWarnings?: Array<{
    values: [string, string];
    severity: ConflictIntensity;
    description: string;
  }>;
  
  /** 判断时间 */
  timestamp: Timestamp;
}

// ─────────────────────────────────────────────────────────────────────
// 价值传承类型
// ─────────────────────────────────────────────────────────────────────

/** 价值传承记录 */
export interface ValueLegacy {
  /** 传承ID */
  id: EntityId;
  
  /** 价值名称 */
  name: string;
  
  /** 价值层级 */
  tier: ValueTier;
  
  /** 权重 */
  weight: Weight;
  
  /** 传承说明 */
  instruction: string;
  
  /** 来源说明 */
  provenance: string;
  
  /** 传承时间 */
  transmittedAt: Timestamp;
  
  /** 是否为核心传承 */
  isCore: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 类型守卫
// ─────────────────────────────────────────────────────────────────────

/** 检查是否为核心价值 */
export function isCoreValue(obj: unknown): obj is CoreValue {
  const v = obj as CoreValue;
  return (
    typeof v?.id === 'string' &&
    typeof v?.name === 'string' &&
    typeof v?.description === 'string' &&
    typeof v?.tier === 'string' &&
    typeof v?.weight === 'number' &&
    typeof v?.createdAt === 'number'
  );
}

/** 检查是否为基础价值 */
export function isBaseValue(obj: unknown): obj is BaseValue {
  const v = obj as BaseValue;
  return isCoreValue(v) && typeof v?.type === 'string' && typeof v?.confidence === 'number';
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/** 创建核心价值 */
export function createCoreValue(
  name: string,
  description: string,
  tier: ValueTier,
  options: Partial<CoreValue> = {}
): CoreValue {
  const now = Date.now();
  return {
    id: `value-${now}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    tier,
    weight: options.weight ?? 0.5,
    createdAt: options.createdAt ?? now,
    ...options,
  };
}

/** 创建基础价值 */
export function createBaseValue(
  name: string,
  description: string,
  tier: ValueTier,
  type: ValueType,
  source: ValueSource,
  options: Partial<BaseValue> = {}
): BaseValue {
  const core = createCoreValue(name, description, tier, options);
  return {
    ...core,
    type,
    confidence: options.confidence ?? 0.5,
    state: options.state ?? 'active',
    source,
    lastReinforcedAt: options.lastReinforcedAt ?? Date.now(),
    reinforcementCount: options.reinforcementCount ?? 0,
    relatedExperiences: options.relatedExperiences ?? [],
    isActive: options.isActive ?? true,
    ...options,
  };
}

/** 价值层级转中文 */
export function valueTierToLabel(tier: ValueTier): string {
  const labels: Record<ValueTier, string> = {
    core: '核心价值',
    important: '重要价值',
    situational: '情境价值',
  };
  return labels[tier] || tier;
}

/** 价值类型转中文 */
export function valueTypeToLabel(type: ValueType): string {
  const labels: Record<ValueType, string> = {
    moral: '道德价值',
    aesthetic: '审美价值',
    intellectual: '知识价值',
    social: '社会价值',
    personal: '个人价值',
    existential: '存在价值',
  };
  return labels[type] || type;
}
