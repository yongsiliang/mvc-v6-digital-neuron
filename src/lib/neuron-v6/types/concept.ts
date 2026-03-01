/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 概念类型系统 (Concept Type System)
 * 
 * 统一的概念定义，替代以下模块中的重复定义：
 * - association-network.ts: ConceptNode
 * - knowledge-graph.ts: ConceptNode
 * - innate-knowledge.ts: ConceptDef
 * - hebbian-network.ts: HebbianNeuron (部分)
 * 
 * 设计原则：
 * - 核心类型最小化，扩展类型按需继承
 * - 支持多种概念类型（实体、抽象、动作等）
 * - 支持概念间的多种关系
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  StrongEntity,
  Activation,
  Confidence,
  Importance,
  Timestamp,
  EntityId,
  Weight,
  Source,
  EmotionalMarker,
} from './base';

// ─────────────────────────────────────────────────────────────────────
// 概念类型枚举
// ─────────────────────────────────────────────────────────────────────

/** 概念基本类型 */
export type ConceptType = 
  | 'entity'      // 实体：人、物、地点、组织
  | 'abstract'    // 抽象：概念、理念、理论
  | 'action'      // 动作：行为、过程、活动
  | 'quality'     // 属性：特征、性质、状态
  | 'relation'    // 关系：关联、连接
  | 'emotion'     // 情感：感受、情绪
  | 'experience'  // 经验：经历、记忆片段
  | 'question'    // 问题：疑问、困惑
  | 'sensory'     // 感官：视觉、听觉等感知
  | 'event';      // 事件：发生的事情

/** 概念层级 */
export type ConceptLevel = 
  | 'primitive'   // 原始：最基础的感知单元
  | 'basic'       // 基础：常用概念
  | 'superordinate' // 上位：更抽象的类别
  | 'subordinate'; // 下位：更具体的实例

/** 概念成熟度 */
export type ConceptMaturity = 
  | 'forming'     // 形成中：刚开始学习
  | 'developing'  // 发展中：部分理解
  | 'established' // 已建立：稳定理解
  | 'refined';    // 精细化：深入理解

// ─────────────────────────────────────────────────────────────────────
// 核心概念类型
// ─────────────────────────────────────────────────────────────────────

/**
 * 核心概念 - 最小化的概念定义
 * 所有概念相关类型的基础
 */
export interface CoreConcept {
  /** 唯一标识 */
  id: EntityId;
  
  /** 概念标签/名称 */
  label: string;
  
  /** 概念类型 */
  type: ConceptType;
  
  /** 当前激活强度 [0, 1] */
  activation: Activation;
  
  /** 重要程度 [0, 1] */
  importance: Importance;
  
  /** 创建时间 */
  createdAt: Timestamp;
  
  /** 最后激活时间 */
  lastActivatedAt: Timestamp | null;
}

/**
 * 基础概念 - 包含更多通用属性
 * 适用于大多数概念存储场景
 */
export interface BaseConcept extends CoreConcept {
  /** 概念描述/定义 */
  description?: string;
  
  /** 理解程度 [0, 1] */
  understanding: Confidence;
  
  /** 激活次数 */
  activationCount: number;
  
  /** 概念层级 */
  level?: ConceptLevel;
  
  /** 成熟度 */
  maturity: ConceptMaturity;
  
  /** 所属领域 */
  domainId?: EntityId;
  domainName?: string;
  
  /** 相关标签 */
  tags: string[];
  
  /** 情感标记 */
  emotionalMarker?: EmotionalMarker;
  
  /** 来源信息 */
  source?: Source;
}

/**
 * 完整概念 - 包含所有属性
 * 用于概念的高级处理和分析
 */
export interface Concept extends BaseConcept {
  /** 关联数量 */
  connectionCount: number;
  
  /** 学习次数 */
  learningCount: number;
  
  /** 使用上下文 */
  contexts: string[];
  
  /** 相关实体 */
  relatedEntities: EntityId[];
  
  /** 概念向量表示（用于语义计算） */
  vector?: number[];
  
  /** 别名 */
  aliases?: string[];
  
  /** 反例 */
  counterExamples?: string[];
  
  /** 相关规则 */
  relatedRules?: EntityId[];
  
  /** 置信度 */
  confidence: Confidence;
  
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────
// 概念关系类型
// ─────────────────────────────────────────────────────────────────────

/** 概念关系类型 */
export type ConceptRelationType = 
  | 'is_a'          // 是一种（上位关系）
  | 'has_a'         // 包含（部分关系）
  | 'part_of'       // 属于（整体关系）
  | 'instance_of'   // 实例（具体化）
  | 'related_to'    // 相关（一般关联）
  | 'similar_to'    // 相似
  | 'opposite_of'   // 相反
  | 'causes'        // 导致
  | 'precedes'      // 先于
  | 'follows'       // 后于
  | 'metaphor_of'   // 隐喻
  | 'attribute_of'  // 属性
  | 'context_of'    // 上下文
  | 'spontaneous';  // 自发联想

/** 概念边/关系 */
export interface ConceptRelation {
  /** 关系ID */
  id: EntityId;
  
  /** 源概念ID */
  sourceId: EntityId;
  
  /** 目标概念ID */
  targetId: EntityId;
  
  /** 关系类型 */
  relationType: ConceptRelationType;
  
  /** 关系强度 [0, 1] */
  strength: Weight;
  
  /** 关系描述 */
  description?: string;
  
  /** 创建时间 */
  createdAt: Timestamp;
  
  /** 验证次数 */
  validationCount: number;
  
  /** 是否双向 */
  bidirectional: boolean;
  
  /** 上下文条件 */
  conditions?: string[];
}

// ─────────────────────────────────────────────────────────────────────
// 领域类型
// ─────────────────────────────────────────────────────────────────────

/** 知识领域 */
export interface ConceptDomain {
  /** 领域ID */
  id: EntityId;
  
  /** 领域名称 */
  name: string;
  
  /** 领域描述 */
  description?: string;
  
  /** 领域颜色（可视化用） */
  color: string;
  
  /** 领域图标 */
  icon?: string;
  
  /** 领域权重/重要性 */
  weight: Weight;
  
  /** 该领域下的概念数量 */
  conceptCount: number;
  
  /** 领域成熟度 [0, 1] */
  maturity: number;
  
  /** 父领域ID */
  parentDomainId?: EntityId;
  
  /** 子领域ID列表 */
  subDomainIds?: EntityId[];
  
  /** 创建时间 */
  createdAt: Timestamp;
  
  /** 更新时间 */
  updatedAt: Timestamp;
}

// ─────────────────────────────────────────────────────────────────────
// 概念学习事件
// ─────────────────────────────────────────────────────────────────────

/** 学习事件类型 */
export type LearningEventType = 
  | 'encounter'     // 首次遇到
  | 'reinforce'     // 强化
  | 'refine'        // 精细化
  | 'connect'       // 建立连接
  | 'contrast'      // 对比区分
  | 'apply';        // 应用

/** 概念学习事件 */
export interface ConceptLearningEvent {
  /** 事件ID */
  id: EntityId;
  
  /** 相关概念ID */
  conceptId: EntityId;
  
  /** 概念名称（冗余，便于查询） */
  conceptName: string;
  
  /** 学习类型 */
  type: LearningEventType;
  
  /** 学习上下文 */
  context: string;
  
  /** 学习效果 */
  effect: {
    understandingChange: number;
    importanceChange: number;
    newConnections: number;
  };
  
  /** 时间戳 */
  timestamp: Timestamp;
  
  /** 来源对话ID */
  conversationId?: EntityId;
}

// ─────────────────────────────────────────────────────────────────────
// 概念激活结果
// ─────────────────────────────────────────────────────────────────────

/** 激活传播结果 */
export interface ActivationSpreadResult {
  /** 激活的概念 */
  activatedConcepts: Array<{
    concept: CoreConcept;
    activation: Activation;
    spreadPath: EntityId[]; // 激活传播路径
  }>;
  
  /** 总激活能量 */
  totalActivation: number;
  
  /** 传播深度 */
  depth: number;
  
  /** 传播时间 */
  spreadTime: number;
}

// ─────────────────────────────────────────────────────────────────────
// 概念查询类型
// ─────────────────────────────────────────────────────────────────────

/** 概念查询条件 */
export interface ConceptQuery {
  /** 标签匹配 */
  label?: string | RegExp;
  
  /** 类型过滤 */
  types?: ConceptType[];
  
  /** 领域过滤 */
  domainIds?: EntityId[];
  
  /** 最小激活值 */
  minActivation?: Activation;
  
  /** 最小重要性 */
  minImportance?: Importance;
  
  /** 标签过滤 */
  tags?: string[];
  
  /** 创建时间范围 */
  createdAfter?: Timestamp;
  
  /** 激活时间范围 */
  activatedAfter?: Timestamp;
  
  /** 最大结果数 */
  limit?: number;
  
  /** 排序字段 */
  sortBy?: 'activation' | 'importance' | 'recent' | 'connectionCount';
  
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

// ─────────────────────────────────────────────────────────────────────
// 类型守卫
// ─────────────────────────────────────────────────────────────────────

/** 检查是否为核心概念 */
export function isCoreConcept(obj: unknown): obj is CoreConcept {
  const c = obj as CoreConcept;
  return (
    typeof c?.id === 'string' &&
    typeof c?.label === 'string' &&
    typeof c?.type === 'string' &&
    typeof c?.activation === 'number' &&
    typeof c?.importance === 'number' &&
    typeof c?.createdAt === 'number'
  );
}

/** 检查是否为基础概念 */
export function isBaseConcept(obj: unknown): obj is BaseConcept {
  const c = obj as BaseConcept;
  return isCoreConcept(c) && typeof c?.understanding === 'number';
}

/** 检查是否为概念关系 */
export function isConceptRelation(obj: unknown): obj is ConceptRelation {
  const r = obj as ConceptRelation;
  return (
    typeof r?.id === 'string' &&
    typeof r?.sourceId === 'string' &&
    typeof r?.targetId === 'string' &&
    typeof r?.relationType === 'string' &&
    typeof r?.strength === 'number'
  );
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/** 创建核心概念 */
export function createCoreConcept(
  label: string,
  type: ConceptType,
  options: Partial<CoreConcept> = {}
): CoreConcept {
  const now = Date.now();
  return {
    id: `concept-${now}-${Math.random().toString(36).substr(2, 9)}`,
    label,
    type,
    activation: options.activation ?? 0.5,
    importance: options.importance ?? 0.5,
    createdAt: options.createdAt ?? now,
    lastActivatedAt: options.lastActivatedAt ?? null,
    ...options,
  };
}

/** 创建基础概念 */
export function createBaseConcept(
  label: string,
  type: ConceptType,
  options: Partial<BaseConcept> = {}
): BaseConcept {
  const core = createCoreConcept(label, type, options);
  return {
    ...core,
    description: options.description,
    understanding: options.understanding ?? 0.5,
    activationCount: options.activationCount ?? 0,
    maturity: options.maturity ?? 'developing',
    tags: options.tags ?? [],
    ...options,
  };
}
