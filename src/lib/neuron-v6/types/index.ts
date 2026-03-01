/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 统一类型系统 (Unified Type System)
 * 
 * 这是V6意识核心的类型系统入口
 * 所有核心类型都从这里导出，确保类型一致性
 * 
 * 使用方式：
 * ```typescript
 * import { CoreConcept, BaseConcept, createBaseConcept } from '@/lib/neuron-v6/types';
 * ```
 * 
 * 设计原则：
 * - 核心类型最小化，扩展类型按需继承
 * - 所有跨模块共享的类型都在这里定义
 * - 模块特定类型在各模块内部定义
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 基础类型
// ─────────────────────────────────────────────────────────────────────
export type {
  // 时间相关
  Timestamp,
  TimeRange,
  Timestamped,
  Traceable,
  
  // 标识相关
  EntityId,
  Identifiable,
  Namable,
  Describable,
  
  // 数值相关
  Activation,
  Weight,
  Confidence,
  Importance,
  Strength,
  Activatable,
  Weighted,
  Confident,
  Important,
  
  // 来源追溯
  SourceType,
  Source,
  TraceableSource,
  
  // 情感相关
  BasicEmotionType,
  EmotionalMarker,
  EmotionallyMarked,
  
  // 标签分类
  Taggable,
  Categorizable,
  
  // 元数据
  Metadata,
  WithMetadata,
  
  // 组合类型
  BaseEntity,
  CoreEntity,
  ActiveEntity,
  StrongEntity,
  
  // 关系
  RelationStrength,
  BaseRelation,
  
  // 状态
  EntityState,
  Stateful,
  
  // 版本
  Versioned,
} from './base';

export {
  isValidActivation,
  isValidWeight,
  isValidConfidence,
  isValidImportance,
} from './base';

// ─────────────────────────────────────────────────────────────────────
// 概念类型
// ─────────────────────────────────────────────────────────────────────
export type {
  ConceptType,
  ConceptLevel,
  ConceptMaturity,
  CoreConcept,
  BaseConcept,
  Concept,
  ConceptRelationType,
  ConceptRelation,
  ConceptDomain,
  LearningEventType,
  ConceptLearningEvent,
  ActivationSpreadResult,
  ConceptQuery,
} from './concept';

export {
  isCoreConcept,
  isBaseConcept,
  isConceptRelation,
  createCoreConcept,
  createBaseConcept,
} from './concept';

// ─────────────────────────────────────────────────────────────────────
// 智慧类型
// ─────────────────────────────────────────────────────────────────────
export type {
  WisdomType,
  WisdomTier,
  WisdomState,
  CoreWisdom,
  BaseWisdom,
  Wisdom,
  CrystallizationSource,
  WisdomCrystallization,
  WisdomGuidance,
  ValidationResult,
  WisdomValidation,
  SublimationTrigger,
  WisdomSublimation,
} from './wisdom';

export {
  isCoreWisdom,
  isBaseWisdom,
  createCoreWisdom,
  createBaseWisdom,
  wisdomTypeToLabel,
  wisdomTierToLabel,
} from './wisdom';

// ─────────────────────────────────────────────────────────────────────
// 价值类型
// ─────────────────────────────────────────────────────────────────────
export type {
  ValueTier,
  ValueType,
  ValueState,
  ValueSource,
  CoreValue,
  BaseValue,
  Value,
  ConflictType,
  ConflictIntensity,
  ValueConflictSummary,
  ValueConflict,
  ValueResolution,
  EvolutionType,
  ValueEvolutionEvent,
  ValueJudgmentRequest,
  ValueJudgmentResult,
  ValueLegacy,
} from './value';

export {
  isCoreValue,
  isBaseValue,
  createCoreValue,
  createBaseValue,
  valueTierToLabel,
  valueTypeToLabel,
} from './value';

// ─────────────────────────────────────────────────────────────────────
// 记忆类型
// ─────────────────────────────────────────────────────────────────────
export type {
  MemoryLayer,
  MemoryType,
  MemoryState,
  MemorySource,
  CoreMemory,
  BaseMemory,
  Memory,
  MemoryEntity,
  CreatorInfo,
  IdentityInfo,
  CoreRelationship,
  CoreSummary,
  ConsolidatedMemory,
  EpisodicMemory,
  MemoryRetrievalResult,
  MemoryQuery,
  ConsolidationResult,
} from './memory';

export {
  isCoreMemory,
  isEpisodicMemory,
  isConsolidatedMemory,
  createCoreMemory,
  createEpisodicMemory,
  memoryLayerToLabel,
  memoryTypeToLabel,
} from './memory';

// ─────────────────────────────────────────────────────────────────────
// 类型适配器（向后兼容）
// ─────────────────────────────────────────────────────────────────────

export {
  TypeAdapter,
  ConceptAdapter,
  WisdomAdapter,
  ValueAdapter,
} from './adapter';

export type {
  // 旧类型定义（用于兼容）
  LegacyAssociationConcept,
  LegacyKnowledgeConcept,
  LegacyWisdomLTM,
  LegacyWisdomCrystal,
  LegacyValueEvolution,
  LegacyValueMeaning,
} from './adapter';

// ─────────────────────────────────────────────────────────────────────
// 类型系统版本信息
// ─────────────────────────────────────────────────────────────────────

/** 类型系统版本 */
export const TYPE_SYSTEM_VERSION = '1.0.0';

/** 类型系统创建时间 */
export const TYPE_SYSTEM_CREATED_AT = '2026-03-01';

/**
 * 类型迁移工具
 * 用于将旧类型转换为新类型
 */
export const TypeMigrator = {
  /**
   * 检查对象是否为旧版概念格式
   */
  isLegacyConcept(obj: unknown): boolean {
    const c = obj as Record<string, unknown>;
    return (
      typeof c?.label === 'string' &&
      (typeof c?.definition === 'string' || typeof c?.description === 'string')
    );
  },
  
  /**
   * 检查对象是否为旧版智慧格式
   */
  isLegacyWisdom(obj: unknown): boolean {
    const w = obj as Record<string, unknown>;
    return (
      typeof w?.statement === 'string' ||
      typeof w?.insight === 'string' ||
      typeof w?.formulation === 'string'
    );
  },
  
  /**
   * 检查对象是否为旧版价值格式
   */
  isLegacyValue(obj: unknown): boolean {
    const v = obj as Record<string, unknown>;
    return (
      typeof v?.name === 'string' &&
      (typeof v?.formedAt === 'number' || typeof v?.weight === 'number')
    );
  },
};
