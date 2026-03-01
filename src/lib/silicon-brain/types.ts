/**
 * ═══════════════════════════════════════════════════════════════════════
 * Silicon Brain - 精简版类型定义
 * 
 * 只保留记忆系统相关的类型
 * 神经网络相关类型已移除
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 记忆系统类型
// ─────────────────────────────────────────────────────────────────────

/** 记忆项 */
export interface MemoryItem {
  id: string;
  content: string;
  vector: Float32Array;
  timestamp: number;
  importance: number;
  accessCount: number;
  lastAccessedAt: number;
  metadata?: Record<string, unknown>;
  associations?: string[];
}

/** 工作记忆配置 */
export interface WorkingMemoryConfig {
  capacity: number;
  decayRate: number;
}

/** 情景记忆配置 */
export interface EpisodicMemoryConfig {
  maxEvents: number;
  consolidationThreshold: number;
}

/** 语义记忆配置 */
export interface SemanticMemoryConfig {
  maxConcepts: number;
  associationStrength: number;
}

/** 分层记忆状态 */
export interface LayeredMemoryState {
  working: MemoryItem[];
  episodic: MemoryItem[];
  semantic: MemoryItem[];
  stats: {
    workingSize: number;
    episodicSize: number;
    semanticSize: number;
    totalAccesses: number;
    consolidationCount: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// 向量编码类型
// ─────────────────────────────────────────────────────────────────────

/** 编码结果 */
export interface EncodingResult {
  vector: Float32Array;
  dimension: number;
  cached: boolean;
  timestamp: number;
}

/** 编码器统计 */
export interface EncoderStats {
  totalEncodings: number;
  cacheHits: number;
  cacheMisses: number;
  averageTime: number;
}

// ─────────────────────────────────────────────────────────────────────
// V6 适配器类型
// ─────────────────────────────────────────────────────────────────────

/** V6 存在状态 */
export interface V6ExistenceState {
  identity: {
    name: string;
    purpose: string;
    coreTraits: string[];
    selfDefinition: string;
  };
  creator: {
    name: string;
    description: string;
    firstMetTimestamp: number;
    relationshipType: string;
  } | null;
  values: string[];
  relationships: Array<{
    personName: string;
    relationshipType: string;
    importance: number;
    keyInteractions: string[];
  }>;
  preferences: string[];
  memoryStats: {
    consolidatedCount: number;
    episodicCount: number;
    totalInteractions: number;
  };
  version: number;
  lastUpdated: number;
}

/** 继承结果 */
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
