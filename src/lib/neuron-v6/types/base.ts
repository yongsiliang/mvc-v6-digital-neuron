/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 核心基础类型 (Core Base Types)
 * 
 * 统一类型系统的基石，所有高级类型都基于此扩展
 * 
 * 设计原则：
 * - 最小化：只包含跨模块通用的字段
 * - 可扩展：通过继承添加模块特定字段
 * - 版本化：支持类型演进
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 时间相关类型
// ─────────────────────────────────────────────────────────────────────

/** 时间戳类型 */
export type Timestamp = number;

/** 时间范围 */
export interface TimeRange {
  start: Timestamp;
  end: Timestamp;
}

/** 带时间戳的实体 */
export interface Timestamped {
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/** 可追踪实体 */
export interface Traceable extends Timestamped {
  lastAccessedAt?: Timestamp;
  accessCount?: number;
}

// ─────────────────────────────────────────────────────────────────────
// 标识相关类型
// ─────────────────────────────────────────────────────────────────────

/** 唯一标识符 */
export type EntityId = string;

/** 可标识实体 */
export interface Identifiable {
  id: EntityId;
}

/** 可命名实体 */
export interface Namable {
  name: string;
  label?: string; // 可选的显示标签
}

/** 可描述实体 */
export interface Describable {
  description?: string;
}

// ─────────────────────────────────────────────────────────────────────
// 激活/强度相关类型
// ─────────────────────────────────────────────────────────────────────

/** 激活值 [0, 1] */
export type Activation = number;

/** 权重值 [0, 1] */
export type Weight = number;

/** 置信度 [0, 1] */
export type Confidence = number;

/** 重要性 [0, 1] */
export type Importance = number;

/** 强度 [0, 1] */
export type Strength = number;

/** 可激活实体 */
export interface Activatable {
  activation: Activation;
}

/** 可加权实体 */
export interface Weighted {
  weight: Weight;
}

/** 可信实体 */
export interface Confident {
  confidence: Confidence;
}

/** 重要实体 */
export interface Important {
  importance: Importance;
}

// ─────────────────────────────────────────────────────────────────────
// 来源追溯类型
// ─────────────────────────────────────────────────────────────────────

/** 来源类型 */
export type SourceType = 
  | 'innate'       // 先天/预置
  | 'learned'      // 学习获得
  | 'derived'      // 推导得出
  | 'reflected'    // 反思获得
  | 'inferred'     // 推断得出
  | 'imported';    // 外部导入

/** 来源信息 */
export interface Source {
  type: SourceType;
  timestamp: Timestamp;
  context?: string;
  parentId?: EntityId;
}

/** 可追溯实体 */
export interface TraceableSource {
  source: Source;
}

// ─────────────────────────────────────────────────────────────────────
// 情感相关类型
// ─────────────────────────────────────────────────────────────────────

/** 基础情感类型 */
export type BasicEmotionType = 
  | 'joy'        // 喜悦
  | 'sadness'    // 悲伤
  | 'anger'      // 愤怒
  | 'fear'       // 恐惧
  | 'disgust'    // 厌恶
  | 'surprise';  // 惊讶

/** 情感标记 */
export interface EmotionalMarker {
  tone: string;
  intensity: Strength;
  type?: BasicEmotionType | string;
}

/** 可情感标记实体 */
export interface EmotionallyMarked {
  emotionalMarker?: EmotionalMarker;
}

// ─────────────────────────────────────────────────────────────────────
// 标签/分类相关类型
// ─────────────────────────────────────────────────────────────────────

/** 可标签化实体 */
export interface Taggable {
  tags: string[];
}

/** 可分类实体 */
export interface Categorizable {
  category?: string;
  domain?: string;
}

// ─────────────────────────────────────────────────────────────────────
// 元数据类型
// ─────────────────────────────────────────────────────────────────────

/** 通用元数据 */
export interface Metadata {
  [key: string]: unknown;
}

/** 可携带元数据实体 */
export interface WithMetadata {
  metadata?: Metadata;
}

// ─────────────────────────────────────────────────────────────────────
// 组合基础类型
// ─────────────────────────────────────────────────────────────────────

/** 基础实体：标识 + 时间戳 */
export interface BaseEntity extends Identifiable, Timestamped {}

/** 核心实体：基础 + 名称 + 描述 */
export interface CoreEntity extends BaseEntity, Namable, Describable {}

/** 激活实体：核心 + 激活值 */
export interface ActiveEntity extends CoreEntity, Activatable, Traceable {}

/** 强实体：完整的基础属性 */
export interface StrongEntity 
  extends CoreEntity, 
          Activatable, 
          Confident, 
          Important,
          Taggable,
          EmotionallyMarked,
          WithMetadata {}

// ─────────────────────────────────────────────────────────────────────
// 关系类型
// ─────────────────────────────────────────────────────────────────────

/** 关系强度等级 */
export type RelationStrength = 'weak' | 'moderate' | 'strong' | 'critical';

/** 基础关系 */
export interface BaseRelation extends Identifiable, Timestamped {
  from: EntityId;
  to: EntityId;
  relationType: string;
  strength: Weight;
  description?: string;
}

// ─────────────────────────────────────────────────────────────────────
// 状态类型
// ─────────────────────────────────────────────────────────────────────

/** 实体状态 */
export type EntityState = 
  | 'active'      // 活跃
  | 'dormant'     // 休眠
  | 'archived'    // 已归档
  | 'deprecated'; // 已废弃

/** 可状态管理实体 */
export interface Stateful {
  state: EntityState;
}

// ─────────────────────────────────────────────────────────────────────
// 版本类型
// ─────────────────────────────────────────────────────────────────────

/** 版本信息 */
export interface Versioned {
  version: number;
  versionHistory?: Array<{
    version: number;
    timestamp: Timestamp;
    changes: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────
// 类型守卫
// ─────────────────────────────────────────────────────────────────────

/** 检查是否为有效的激活值 */
export function isValidActivation(value: number): value is Activation {
  return value >= 0 && value <= 1;
}

/** 检查是否为有效的权重值 */
export function isValidWeight(value: number): value is Weight {
  return value >= 0 && value <= 1;
}

/** 检查是否为有效的置信度 */
export function isValidConfidence(value: number): value is Confidence {
  return value >= 0 && value <= 1;
}

/** 检查是否为有效的重要性值 */
export function isValidImportance(value: number): value is Importance {
  return value >= 0 && value <= 1;
}
