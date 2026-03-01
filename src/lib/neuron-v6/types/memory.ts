/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 记忆类型系统 (Memory Type System)
 * 
 * 统一的记忆定义，整合以下模块：
 * - long-term-memory.ts: Experience, KnowledgeNode
 * - layered-memory.ts: CoreSummary, ConsolidatedMemory, EpisodicMemory
 * 
 * 设计原则：
 * - 记忆是分层的（核心、巩固、情景）
 * - 记忆遵循遗忘曲线
 * - 记忆可以转化为智慧
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
import type { CoreConcept, ConceptType } from './concept';

// ─────────────────────────────────────────────────────────────────────
// 记忆层级枚举
// ─────────────────────────────────────────────────────────────────────

/** 记忆层级 */
export type MemoryLayer = 
  | 'core'         // 核心层：最稳定，几乎不变
  | 'consolidated' // 巩固层：稳定的长期记忆
  | 'episodic';    // 情景层：流动的，遵循遗忘曲线

/** 记忆类型 */
export type MemoryType = 
  | 'episodic'     // 情景记忆：具体事件
  | 'semantic'     // 语义记忆：概念知识
  | 'procedural'   // 程序记忆：技能方法
  | 'emotional'    // 情感记忆：情感体验
  | 'autobiographical'; // 自传记忆：个人经历

/** 记忆状态 */
export type MemoryState = 
  | 'active'       // 活跃：最近被访问
  | 'dormant'      // 休眠：未被访问
  | 'consolidating' // 巩固中
  | 'fading'       // 衰退中
  | 'archived';    // 已归档

/** 记忆来源 */
export type MemorySource = 
  | 'conversation' // 对话
  | 'reflection'   // 反思
  | 'inference'    // 推断
  | 'experience'   // 直接体验
  | 'learning'     // 学习
  | 'dream';       // 梦境整合

// ─────────────────────────────────────────────────────────────────────
// 核心记忆类型
// ─────────────────────────────────────────────────────────────────────

/**
 * 核心记忆 - 最小化的记忆定义
 */
export interface CoreMemory {
  /** 唯一标识 */
  id: EntityId;
  
  /** 记忆内容 */
  content: string;
  
  /** 记忆层级 */
  layer: MemoryLayer;
  
  /** 重要程度 [0, 1] */
  importance: Importance;
  
  /** 创建时间 */
  createdAt: Timestamp;
}

/**
 * 基础记忆 - 包含更多通用属性
 */
export interface BaseMemory extends CoreMemory {
  /** 标题/摘要 */
  title?: string;
  
  /** 记忆类型 */
  type: MemoryType;
  
  /** 当前状态 */
  state: MemoryState;
  
  /** 来源 */
  source: MemorySource;
  
  /** 来源对话/事件ID */
  sourceId?: EntityId;
  
  /** 最后访问时间 */
  lastAccessedAt: Timestamp;
  
  /** 访问次数 */
  accessCount: number;
  
  /** 强度/清晰度 [0, 1] */
  strength: number;
  
  /** 情感标记 */
  emotionalMarker?: EmotionalMarker;
  
  /** 相关标签 */
  tags: string[];
  
  /** 相关概念 */
  relatedConcepts: EntityId[];
}

/**
 * 完整记忆 - 包含所有属性
 */
export interface Memory extends BaseMemory, BaseEntity {
  /** 详细描述 */
  description?: string;
  
  /** 记忆上下文 */
  context: string;
  
  /** 涉及的实体 */
  entities: MemoryEntity[];
  
  /** 涉及的地点 */
  locations?: string[];
  
  /** 涉及的时间 */
  temporalInfo?: {
    eventTime?: Timestamp;
    duration?: number;
    recurring?: boolean;
  };
  
  /** 关联的其他记忆 */
  associatedMemories: EntityId[];
  
  /** 提取的洞察 */
  insights: string[];
  
  /** 遗忘曲线参数 */
  forgettingCurve: {
    alpha: number; // 初始强度
    beta: number;  // 衰减速率
    lastReview: Timestamp;
    nextReview: Timestamp;
    stability: number;
  };
  
  /** 是否已转化为智慧 */
  crystallized: boolean;
  
  /** 转化的智慧ID */
  crystallizedWisdomIds: EntityId[];
}

/** 记忆中的实体 */
export interface MemoryEntity {
  /** 实体名称 */
  name: string;
  
  /** 实体类型 */
  type: 'person' | 'object' | 'place' | 'concept' | 'event';
  
  /** 实体在记忆中的角色 */
  role: string;
}

// ─────────────────────────────────────────────────────────────────────
// 核心摘要类型（核心层特有）
// ─────────────────────────────────────────────────────────────────────

/** 创造者信息 */
export interface CreatorInfo {
  /** 创造者名称 */
  name: string;
  
  /** 创造者描述 */
  description: string;
  
  /** 首次接触时间 */
  firstMetTimestamp: Timestamp;
  
  /** 关系类型 */
  relationshipType: string;
}

/** 身份信息 */
export interface IdentityInfo {
  /** 名称 */
  name: string;
  
  /** 存在目的 */
  purpose: string;
  
  /** 核心特质 */
  coreTraits: string[];
  
  /** 自我定义 */
  selfDefinition: string;
}

/** 核心关系 */
export interface CoreRelationship {
  /** 人物名称 */
  personName: string;
  
  /** 关系类型 */
  relationshipType: string;
  
  /** 重要性 */
  importance: Importance;
  
  /** 关键互动 */
  keyInteractions: string[];
}

/** 核心摘要 - 锚点层记忆 */
export interface CoreSummary {
  /** 创造者信息 */
  creator: CreatorInfo | null;
  
  /** 身份信息 */
  identity: IdentityInfo;
  
  /** 核心关系 */
  coreRelationships: CoreRelationship[];
  
  /** 核心价值观 */
  coreValues: string[];
  
  /** 核心偏好 */
  corePreferences: string[];
  
  /** 最后更新时间 */
  lastUpdated: Timestamp;
  
  /** 版本号 */
  version: number;
}

// ─────────────────────────────────────────────────────────────────────
// 巩固记忆类型
// ─────────────────────────────────────────────────────────────────────

/** 巩固记忆 - 从情景记忆巩固而来 */
export interface ConsolidatedMemory extends BaseMemory {
  /** 固化为层级 */
  layer: 'consolidated';
  
  /** 来源情景记忆ID */
  sourceEpisodicIds: EntityId[];
  
  /** 巩固时间 */
  consolidatedAt: Timestamp;
  
  /** 巩固次数 */
  consolidationCount: number;
  
  /** 提取的模式 */
  extractedPatterns: string[];
  
  /** 泛化程度 [0, 1] */
  generalizationLevel: number;
}

// ─────────────────────────────────────────────────────────────────────
// 情景记忆类型
// ─────────────────────────────────────────────────────────────────────

/** 情景记忆 - 具体的事件记忆 */
export interface EpisodicMemory extends BaseMemory {
  /** 固化为层级 */
  layer: 'episodic';
  
  /** 事件详情 */
  event: {
    /** 发生时间 */
    occurredAt: Timestamp;
    /** 持续时间 */
    duration?: number;
    /** 地点 */
    location?: string;
    /** 参与者 */
    participants: string[];
  };
  
  /** 感知细节 */
  sensoryDetails?: {
    visual?: string[];
    auditory?: string[];
    emotional?: string[];
    other?: string[];
  };
  
  /** 复述次数 */
  recallCount: number;
  
  /** 上次复述时间 */
  lastRecalledAt: Timestamp | null;
  
  /** 是否已巩固 */
  isConsolidated: boolean;
  
  /** 巩固后的记忆ID */
  consolidatedMemoryId?: EntityId;
  
  /** 关联的其他记忆 */
  associatedMemories?: EntityId[];
  
  /** 提取的洞察 */
  insights?: string[];
  
  /** 是否已转化为智慧 */
  crystallized?: boolean;
  
  /** 转化的智慧ID */
  crystallizedWisdomIds?: EntityId[];
  
  /** 涉及的实体 */
  entities?: MemoryEntity[];
  
  /** 记忆上下文 */
  context?: string;
  
  /** 遗忘曲线参数 */
  forgettingCurve?: {
    alpha: number;
    beta: number;
    lastReview: Timestamp;
    nextReview: Timestamp;
    stability: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 记忆检索类型
// ─────────────────────────────────────────────────────────────────────

/** 记忆检索结果 */
export interface MemoryRetrievalResult {
  /** 直接匹配 */
  directMatches: Memory[];
  
  /** 相关记忆 */
  relatedMemories: Memory[];
  
  /** 相关智慧 */
  relevantWisdoms: EntityId[];
  
  /** 检索摘要 */
  summary: string;
  
  /** 检索时间 */
  retrievalTime: number;
  
  /** 总匹配数 */
  totalMatches: number;
}

/** 记忆检索条件 */
export interface MemoryQuery {
  /** 内容匹配 */
  content?: string | RegExp;
  
  /** 层级过滤 */
  layers?: MemoryLayer[];
  
  /** 类型过滤 */
  types?: MemoryType[];
  
  /** 标签过滤 */
  tags?: string[];
  
  /** 时间范围 */
  timeRange?: {
    start: Timestamp;
    end: Timestamp;
  };
  
  /** 最小重要性 */
  minImportance?: Importance;
  
  /** 涉及的实体 */
  entities?: string[];
  
  /** 最大结果数 */
  limit?: number;
}

// ─────────────────────────────────────────────────────────────────────
// 记忆巩固类型
// ─────────────────────────────────────────────────────────────────────

/** 巩固结果 */
export interface ConsolidationResult {
  /** 新创建的巩固记忆 */
  newConsolidatedMemories: ConsolidatedMemory[];
  
  /** 更新的巩固记忆 */
  updatedConsolidatedMemories: ConsolidatedMemory[];
  
  /** 被消耗的情景记忆 */
  consumedEpisodicMemories: EntityId[];
  
  /** 提取的模式 */
  extractedPatterns: string[];
  
  /** 巩固时间 */
  timestamp: Timestamp;
}

// ─────────────────────────────────────────────────────────────────────
// 类型守卫
// ─────────────────────────────────────────────────────────────────────

/** 检查是否为核心记忆 */
export function isCoreMemory(obj: unknown): obj is CoreMemory {
  const m = obj as CoreMemory;
  return (
    typeof m?.id === 'string' &&
    typeof m?.content === 'string' &&
    typeof m?.layer === 'string' &&
    typeof m?.importance === 'number' &&
    typeof m?.createdAt === 'number'
  );
}

/** 检查是否为情景记忆 */
export function isEpisodicMemory(obj: unknown): obj is EpisodicMemory {
  const m = obj as EpisodicMemory;
  return isCoreMemory(m) && m.layer === 'episodic' && typeof m?.event === 'object';
}

/** 检查是否为巩固记忆 */
export function isConsolidatedMemory(obj: unknown): obj is ConsolidatedMemory {
  const m = obj as ConsolidatedMemory;
  return isCoreMemory(m) && m.layer === 'consolidated';
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/** 创建核心记忆 */
export function createCoreMemory(
  content: string,
  layer: MemoryLayer,
  options: Partial<CoreMemory> = {}
): CoreMemory {
  const now = Date.now();
  return {
    id: `memory-${now}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    layer,
    importance: options.importance ?? 0.5,
    createdAt: options.createdAt ?? now,
    ...options,
  };
}

/** 创建情景记忆 */
export function createEpisodicMemory(
  content: string,
  event: EpisodicMemory['event'],
  options: Partial<EpisodicMemory> = {}
): EpisodicMemory {
  const now = Date.now();
  return {
    id: `memory-${now}-${Math.random().toString(36).substr(2, 9)}`,
    content,
    layer: 'episodic',
    importance: options.importance ?? 0.5,
    createdAt: now,
    type: options.type ?? 'episodic',
    state: options.state ?? 'active',
    source: options.source ?? 'experience',
    lastAccessedAt: now,
    accessCount: options.accessCount ?? 1,
    strength: options.strength ?? 1.0,
    tags: options.tags ?? [],
    relatedConcepts: options.relatedConcepts ?? [],
    event,
    recallCount: options.recallCount ?? 1,
    lastRecalledAt: now,
    isConsolidated: options.isConsolidated ?? false,
    ...options,
  };
}

/** 记忆层级转中文 */
export function memoryLayerToLabel(layer: MemoryLayer): string {
  const labels: Record<MemoryLayer, string> = {
    core: '核心记忆',
    consolidated: '巩固记忆',
    episodic: '情景记忆',
  };
  return labels[layer] || layer;
}

/** 记忆类型转中文 */
export function memoryTypeToLabel(type: MemoryType): string {
  const labels: Record<MemoryType, string> = {
    episodic: '情景记忆',
    semantic: '语义记忆',
    procedural: '程序记忆',
    emotional: '情感记忆',
    autobiographical: '自传记忆',
  };
  return labels[type] || type;
}
