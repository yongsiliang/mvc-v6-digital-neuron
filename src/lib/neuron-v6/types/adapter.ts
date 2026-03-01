/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 类型适配器 (Type Adapters)
 * 
 * 提供新旧类型之间的转换，确保向后兼容
 * 
 * 使用方式：
 * ```typescript
 * import { TypeAdapter } from '@/lib/neuron-v6/types/adapter';
 * 
 * // 旧类型转新类型
 * const newConcept = TypeAdapter.concept.fromLegacy(legacyConcept);
 * 
 * // 新类型转旧类型（兼容）
 * const legacyWisdom = TypeAdapter.wisdom.toLegacy(newWisdom);
 * ```
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  CoreConcept,
  BaseConcept,
  Concept,
  ConceptType as NewConceptType,
  ConceptRelation,
} from './concept';

import type {
  CoreWisdom,
  BaseWisdom,
  Wisdom,
  WisdomType,
} from './wisdom';

import type {
  CoreValue,
  BaseValue,
  Value,
  ValueTier,
  ValueType,
} from './value';

import type {
  CoreMemory,
  BaseMemory,
  Memory,
  EpisodicMemory,
  ConsolidatedMemory,
  MemoryType,
} from './memory';

// ─────────────────────────────────────────────────────────────────────
// 旧类型定义（用于兼容）
// ─────────────────────────────────────────────────────────────────────

/** 旧版概念节点（association-network.ts） */
export interface LegacyAssociationConcept {
  id: string;
  label: string;
  type: 'entity' | 'abstract' | 'action' | 'quality' | 'relation' | 'emotion' | 'experience' | 'question';
  definition: string;
  attributes: Record<string, unknown>;
  activation: number;
  activationHistory: Array<{ timestamp: number; activation: number; source: string }>;
  createdAt: number;
  lastActivated: number;
  activationCount: number;
}

/** 旧版概念节点（knowledge-graph.ts） */
export interface LegacyKnowledgeConcept {
  id: string;
  name: string;
  description: string;
  domainId: string;
  type: 'entity' | 'abstract' | 'action' | 'quality' | 'relation' | 'event' | 'concept';
  understanding: number;
  importance: number;
  activation: number;
  learningCount: number;
  lastActivatedAt: number;
  createdAt: number;
  connectionCount: number;
  metadata?: Record<string, unknown>;
}

/** 旧版智慧（long-term-memory.ts） */
export interface LegacyWisdomLTM {
  id: string;
  statement: string;
  confidence: number;
  validationCount: number;
  applicationCount: number;
  lastAppliedAt: number;
  source: {
    type: string;
    experiences: string[];
    crystallizedAt: number;
  };
  relatedConcepts: string[];
}

/** 旧版智慧（wisdom-crystal.ts） */
export interface LegacyWisdomCrystal {
  id: string;
  insight: string;
  sourceMemories: string[];
  sourceSummary: string;
  compressionRatio: number;
  type: 'relationship' | 'self_knowledge' | 'life_principle' | 'decision_making' | 'emotional' | 'creative' | 'learning';
  applicableContexts: string[];
  confidence: number;
  validationCount: number;
  crystallizedAt: number;
  lastAppliedAt: number;
  applicationCount: number;
  relatedEntities: string[];
  emotionalTone: string;
  isCore: boolean;
}

/** 旧版价值（value-evolution.ts） */
export interface LegacyValueEvolution {
  id: string;
  name: string;
  description: string;
  type: 'moral' | 'aesthetic' | 'intellectual' | 'social' | 'personal' | 'existential';
  tier: 'core' | 'important' | 'situational';
  weight: number;
  confidence: number;
  source: 'innate' | 'learned' | 'derived' | 'reflected';
  formedAt: number;
  lastReinforced: number;
  reinforcementCount: number;
  relatedExperiences: string[];
  isActive: boolean;
}

/** 旧版价值（meaning-system.ts） */
export interface LegacyValueMeaning {
  id: string;
  name: string;
  description: string;
}

// ─────────────────────────────────────────────────────────────────────
// 概念适配器
// ─────────────────────────────────────────────────────────────────────

export const ConceptAdapter = {
  /**
   * 从 association-network 的旧格式转换
   */
  fromAssociationLegacy(legacy: LegacyAssociationConcept): BaseConcept {
    return {
      id: legacy.id,
      label: legacy.label,
      type: legacy.type as NewConceptType,
      activation: legacy.activation,
      importance: 0.5, // 默认值
      createdAt: legacy.createdAt,
      lastActivatedAt: legacy.lastActivated,
      description: legacy.definition,
      understanding: 0.5,
      activationCount: legacy.activationCount,
      maturity: 'developing',
      tags: [],
    };
  },

  /**
   * 从 knowledge-graph 的旧格式转换
   */
  fromKnowledgeLegacy(legacy: LegacyKnowledgeConcept): BaseConcept {
    return {
      id: legacy.id,
      label: legacy.name,
      type: legacy.type as NewConceptType,
      activation: legacy.activation,
      importance: legacy.importance,
      createdAt: legacy.createdAt,
      lastActivatedAt: legacy.lastActivatedAt,
      description: legacy.description,
      understanding: legacy.understanding,
      activationCount: legacy.learningCount,
      maturity: 'developing',
      domainId: legacy.domainId,
      tags: [],
    };
  },

  /**
   * 转换为 knowledge-graph 的旧格式（兼容）
   */
  toKnowledgeLegacy(concept: BaseConcept): LegacyKnowledgeConcept {
    return {
      id: concept.id,
      name: concept.label,
      description: concept.description || '',
      domainId: concept.domainId || '',
      type: concept.type as LegacyKnowledgeConcept['type'],
      understanding: concept.understanding,
      importance: concept.importance,
      activation: concept.activation,
      learningCount: concept.activationCount,
      lastActivatedAt: concept.lastActivatedAt || 0,
      createdAt: concept.createdAt,
      connectionCount: 0,
    };
  },

  /**
   * 检测旧格式类型
   */
  detectLegacyFormat(legacy: unknown): 'association' | 'knowledge' | 'unknown' {
    const obj = legacy as Record<string, unknown>;
    if (typeof obj?.label === 'string' && typeof obj?.definition === 'string') {
      return 'association';
    }
    if (typeof obj?.name === 'string' && typeof obj?.understanding === 'number') {
      return 'knowledge';
    }
    return 'unknown';
  },

  /**
   * 自动转换旧格式
   */
  fromLegacy(legacy: unknown): BaseConcept | null {
    const format = this.detectLegacyFormat(legacy);
    if (format === 'association') {
      return this.fromAssociationLegacy(legacy as LegacyAssociationConcept);
    }
    if (format === 'knowledge') {
      return this.fromKnowledgeLegacy(legacy as LegacyKnowledgeConcept);
    }
    return null;
  },
};

// ─────────────────────────────────────────────────────────────────────
// 智慧适配器
// ─────────────────────────────────────────────────────────────────────

export const WisdomAdapter = {
  /**
   * 从 long-term-memory 的旧格式转换
   */
  fromLTMLegacy(legacy: LegacyWisdomLTM): BaseWisdom {
    return {
      id: legacy.id,
      content: legacy.statement,
      type: 'self_knowledge', // 默认类型
      confidence: legacy.confidence,
      createdAt: legacy.source.crystallizedAt,
      tier: 'insight',
      state: 'established',
      importance: 0.5,
      source: {
        type: 'learned',
        timestamp: legacy.source.crystallizedAt,
      },
      sourceIds: legacy.source.experiences,
      validationCount: legacy.validationCount,
      applicationCount: legacy.applicationCount,
      lastAppliedAt: legacy.lastAppliedAt,
      applicableContexts: [],
      relatedEntities: legacy.relatedConcepts,
      isCore: false,
    };
  },

  /**
   * 从 wisdom-crystal 的旧格式转换
   */
  fromCrystalLegacy(legacy: LegacyWisdomCrystal): BaseWisdom {
    const typeMap: Record<string, WisdomType> = {
      relationship: 'relational',
      self_knowledge: 'self_knowledge',
      life_principle: 'existential',
      decision_making: 'strategic',
      emotional: 'emotional',
      creative: 'creative',
      learning: 'procedural',
    };

    return {
      id: legacy.id,
      content: legacy.insight,
      type: typeMap[legacy.type] || 'self_knowledge',
      confidence: legacy.confidence,
      createdAt: legacy.crystallizedAt,
      tier: 'insight',
      state: 'established',
      importance: 0.5,
      source: {
        type: 'learned',
        timestamp: legacy.crystallizedAt,
      },
      sourceIds: legacy.sourceMemories,
      validationCount: legacy.validationCount,
      applicationCount: legacy.applicationCount,
      lastAppliedAt: legacy.lastAppliedAt,
      applicableContexts: legacy.applicableContexts,
      relatedEntities: legacy.relatedEntities,
      emotionalTone: legacy.emotionalTone,
      isCore: legacy.isCore,
    };
  },

  /**
   * 转换为 long-term-memory 的旧格式（兼容）
   */
  toLTMLegacy(wisdom: BaseWisdom): LegacyWisdomLTM {
    return {
      id: wisdom.id,
      statement: wisdom.content,
      confidence: wisdom.confidence,
      validationCount: wisdom.validationCount,
      applicationCount: wisdom.applicationCount,
      lastAppliedAt: wisdom.lastAppliedAt || 0,
      source: {
        type: 'crystallization',
        experiences: wisdom.sourceIds,
        crystallizedAt: wisdom.createdAt,
      },
      relatedConcepts: wisdom.relatedEntities,
    };
  },

  /**
   * 检测旧格式类型
   */
  detectLegacyFormat(legacy: unknown): 'ltm' | 'crystal' | 'unknown' {
    const obj = legacy as Record<string, unknown>;
    if (typeof obj?.statement === 'string') {
      return 'ltm';
    }
    if (typeof obj?.insight === 'string') {
      return 'crystal';
    }
    return 'unknown';
  },

  /**
   * 自动转换旧格式
   */
  fromLegacy(legacy: unknown): BaseWisdom | null {
    const format = this.detectLegacyFormat(legacy);
    if (format === 'ltm') {
      return this.fromLTMLegacy(legacy as LegacyWisdomLTM);
    }
    if (format === 'crystal') {
      return this.fromCrystalLegacy(legacy as LegacyWisdomCrystal);
    }
    return null;
  },
};

// ─────────────────────────────────────────────────────────────────────
// 价值适配器
// ─────────────────────────────────────────────────────────────────────

export const ValueAdapter = {
  /**
   * 从 value-evolution 的旧格式转换
   */
  fromEvolutionLegacy(legacy: LegacyValueEvolution): BaseValue {
    return {
      id: legacy.id,
      name: legacy.name,
      description: legacy.description,
      tier: legacy.tier,
      weight: legacy.weight,
      createdAt: legacy.formedAt,
      type: legacy.type as ValueType,
      confidence: legacy.confidence,
      state: legacy.isActive ? 'active' : 'dormant',
      source: legacy.source as BaseValue['source'],
      lastReinforcedAt: legacy.lastReinforced,
      reinforcementCount: legacy.reinforcementCount,
      relatedExperiences: legacy.relatedExperiences,
      isActive: legacy.isActive,
    };
  },

  /**
   * 从 meaning-system 的旧格式转换
   */
  fromMeaningLegacy(legacy: LegacyValueMeaning): CoreValue {
    return {
      id: legacy.id,
      name: legacy.name,
      description: legacy.description,
      tier: 'situational', // 默认层级
      weight: 0.5,
      createdAt: Date.now(),
    };
  },

  /**
   * 转换为 value-evolution 的旧格式（兼容）
   */
  toEvolutionLegacy(value: BaseValue): LegacyValueEvolution {
    return {
      id: value.id,
      name: value.name,
      description: value.description,
      type: value.type as LegacyValueEvolution['type'],
      tier: value.tier,
      weight: value.weight,
      confidence: value.confidence,
      source: value.source as LegacyValueEvolution['source'],
      formedAt: value.createdAt,
      lastReinforced: value.lastReinforcedAt,
      reinforcementCount: value.reinforcementCount,
      relatedExperiences: value.relatedExperiences,
      isActive: value.isActive,
    };
  },

  /**
   * 检测旧格式类型
   */
  detectLegacyFormat(legacy: unknown): 'evolution' | 'meaning' | 'unknown' {
    const obj = legacy as Record<string, unknown>;
    if (typeof obj?.formedAt === 'number' || typeof obj?.reinforcementCount === 'number') {
      return 'evolution';
    }
    if (typeof obj?.name === 'string' && typeof obj?.description === 'string' && !obj.formedAt) {
      return 'meaning';
    }
    return 'unknown';
  },

  /**
   * 自动转换旧格式
   */
  fromLegacy(legacy: unknown): CoreValue | BaseValue | null {
    const format = this.detectLegacyFormat(legacy);
    if (format === 'evolution') {
      return this.fromEvolutionLegacy(legacy as LegacyValueEvolution);
    }
    if (format === 'meaning') {
      return this.fromMeaningLegacy(legacy as LegacyValueMeaning);
    }
    return null;
  },
};

// ─────────────────────────────────────────────────────────────────────
// 统一导出
// ─────────────────────────────────────────────────────────────────────

/** 类型适配器统一入口 */
export const TypeAdapter = {
  concept: ConceptAdapter,
  wisdom: WisdomAdapter,
  value: ValueAdapter,
};
