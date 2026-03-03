/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一记忆系统 - 类型定义
 * 
 * 融合所有现有记忆系统的能力：
 * - super-memory: 艾宾浩斯 + 情感加权
 * - drawer: 分类 + 索引
 * - knowledge-graph: 知识网络
 * - hebbian-network: 连接演化
 * 
 * 核心创新：
 * - 触发器系统：主动"忆"
 * - 三路激活：检索 + 触发器 + 扩散
 * - 动态结晶：记忆成长，形成"自我"
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 基础类型
// ─────────────────────────────────────────────────────────────────────

/** 记忆类型 */
export type MemoryType = 
  | 'episodic'    // 事件/经历
  | 'semantic'    // 知识/事实
  | 'procedural'  // 技能/方法
  | 'emotional'   // 情感体验
  | 'insight'     // 洞察/领悟
  | 'identity';   // 身份相关

/** 记忆分类 */
export type MemoryCategory = 
  | 'work'          // 工作
  | 'life'          // 生活
  | 'skill'         // 技能
  | 'knowledge'     // 知识
  | 'emotion'       // 情感
  | 'relationship'  // 关系
  | 'goal'          // 目标
  | 'insight'       // 洞察
  | 'belief'        // 信念
  | 'creative'      // 创意
  | 'identity'      // 身份
  | 'custom';       // 自定义

/** 关联类型 */
export type AssociationType = 
  | 'semantic'    // 语义相似
  | 'temporal'    // 时间相近
  | 'causal'      // 因果相关
  | 'emotional'   // 情感相似
  | 'trigger';    // 触发器关联

/** 触发器类型 */
export type TriggerType = 
  | 'keyword'     // 关键词触发
  | 'concept'     // 概念触发
  | 'emotion'     // 情感触发
  | 'time'        // 时间触发
  | 'context';    // 上下文触发（相似记忆激活时）

// ─────────────────────────────────────────────────────────────────────
// 核心数据结构
// ─────────────────────────────────────────────────────────────────────

/**
 * 情感标记
 * 来自 super-memory 的情感分析
 */
export interface EmotionalMarker {
  /** 正负性 (-1 到 1)：负面到正面 */
  valence: number;
  
  /** 激动程度 (0 到 1)：平静到激动 */
  arousal: number;
  
  /** 控制感 (0 到 1)：被动到主动 */
  dominance: number;
  
  /** 情感标签 */
  labels?: string[];
}

/**
 * 触发器
 * 核心创新：让记忆能主动被"忆"起
 */
export interface Trigger {
  /** 触发器ID */
  id: string;
  
  /** 所属记忆ID */
  memoryId: string;
  
  /** 触发器类型 */
  type: TriggerType;
  
  /** 触发模式（不同类型有不同的格式） */
  pattern: string | string[] | RegExp;
  
  /** 触发强度 (0-1) */
  strength: number;
  
  /** 最后触发时间 */
  lastTriggered?: number;
  
  /** 触发次数 */
  triggerCount: number;
  
  /** 是否启用 */
  enabled: boolean;
}

// 保持向后兼容的别名
export type MemoryTrigger = Trigger;

/**
 * 记忆关联
 * 融合 hebbian-network 和 knowledge-graph
 */
export interface MemoryAssociation {
  /** 目标记忆ID */
  targetId: string;
  
  /** 关联类型 */
  type: AssociationType;
  
  /** 连接权重 (0-1) */
  weight: number;
  
  /** 关联形成时间 */
  formedAt: number;
  
  /** 共同激活次数（Hebbian学习） */
  coActivationCount: number;
  
  /** 最后共同激活时间 */
  lastCoActivated?: number;
}

/**
 * 统一记忆节点
 * 融合所有现有系统的能力
 */
export interface MemoryNode {
  // === 基础信息 ===
  /** 唯一ID */
  id: string;
  
  /** 原始内容 */
  content: string;
  
  /** 记忆类型 */
  type: MemoryType;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后更新时间 */
  updatedAt?: number;
  
  // === 向量表示（用于语义检索）===
  /** 语义向量 */
  embedding?: number[];
  
  /** 向量维度 */
  embeddingDimension?: number;
  
  // === 时间信息（艾宾浩斯遗忘曲线）===
  /** 最后回忆时间 */
  lastRecalledAt?: number;
  
  /** 最后访问时间 */
  lastAccessedAt?: number;
  
  /** 回忆次数 */
  recallCount?: number;
  
  /** 下次最优复习时间 */
  nextReviewTime?: number;
  
  /** 当前强度 (0-1) */
  strength?: number;
  
  /** 保留率 (0-1) */
  retentionRate?: number;
  
  /** 复习次数 */
  reviewCount?: number;
  
  /** 下次复习时间 */
  nextReviewAt?: number;
  
  /** 遗忘曲线 */
  forgettingCurve?: number[];
  
  /** 复习历史 */
  reviewHistory?: Array<{
    at: number;
    strength: number;
    success: boolean;
  }>;
  
  // === 情感信息 ===
  /** 情感标记 */
  emotionalMarker: EmotionalMarker;
  
  /** 情感加成 (0-1) */
  emotionalBoost: number;
  
  // === 关联信息 ===
  /** 关联列表 */
  associations: MemoryAssociation[];
  
  /** 入度（被多少记忆关联） */
  inDegree: number;
  
  /** 出度（关联多少记忆） */
  outDegree: number;
  
  // === 触发器 ===
  /** 触发器列表 */
  triggers: Trigger[];
  
  // === 分类信息 ===
  /** 分类 */
  category?: MemoryCategory;
  
  /** 标签 */
  tags: string[];
  
  // === 激活状态 ===
  /** 激活次数 */
  activationCount: number;
  
  /** 最后激活时间 */
  lastActivationTime: number;
  
  /** 激活历史 */
  activationHistory: number[];
  
  /** 重要性 (0-1) */
  importance: number;
  
  // === 结晶化 ===
  /** 巩固级别 (0-1，越高越稳固) */
  consolidationLevel: number;
  
  /** 是否已结晶 */
  crystallized: boolean;
  
  /** 结晶时间 */
  crystallizedAt?: number;
  
  /** 结晶原因 */
  crystallizedReason?: string;
  
  // === 元数据 ===
  /** 自定义元数据 */
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────
// 激活相关类型
// ─────────────────────────────────────────────────────────────────────

/** 激活的记忆 */
export interface ActivatedMemory {
  /** 记忆节点 */
  node: MemoryNode;
  
  /** 激活值 */
  activation: number;
  
  /** 综合评分 */
  score: number;
  
  /** 激活来源 */
  source: 'retrieval' | 'trigger' | 'spreading' | 'crystallized';
  
  /** 激活路径 */
  activationPath?: string[];
}

/** 激活配置 */
export interface ActivationConfig {
  /** 向量检索的 topK */
  retrievalTopK: number;
  
  /** 扩散衰减因子 */
  spreadDecayFactor: number;
  
  /** 最大扩散深度 */
  spreadMaxDepth: number;
  
  /** 最小激活阈值 */
  minActivationThreshold: number;
  
  /** 最大返回数量 */
  maxResults: number;
  
  /** 是否包含结晶记忆 */
  includeCrystallized: boolean;
}

/** 默认激活配置 */
export const DEFAULT_ACTIVATION_CONFIG: ActivationConfig = {
  retrievalTopK: 20,
  spreadDecayFactor: 0.7,
  spreadMaxDepth: 3,
  minActivationThreshold: 0.15,
  maxResults: 30,
  includeCrystallized: true,
};

// ─────────────────────────────────────────────────────────────────────
// 结晶化相关类型
// ─────────────────────────────────────────────────────────────────────

/** 结晶化条件 */
export interface CrystallizationConditions {
  /** 最小激活次数 */
  minActivationCount: number;
  
  /** 最小巩固级别 */
  minConsolidationLevel: number;
  
  /** 最小重要性 */
  minImportance: number;
  
  /** 最小关联数量 */
  minAssociationCount: number;
}

/** 默认结晶化条件 */
export const DEFAULT_CRYSTALLIZATION_CONDITIONS: CrystallizationConditions = {
  minActivationCount: 5,
  minConsolidationLevel: 0.7,
  minImportance: 0.5,
  minAssociationCount: 3,
};

// 向后兼容的别名
export type CrystallizationConfig = CrystallizationConditions;
export const DEFAULT_CRYSTALLIZATION_CONFIG = DEFAULT_CRYSTALLIZATION_CONDITIONS;

// ─────────────────────────────────────────────────────────────────────
// 存储相关类型
// ─────────────────────────────────────────────────────────────────────

/** 记忆存入选项 */
export interface StoreMemoryOptions {
  /** 记忆类型 */
  type?: MemoryType;
  
  /** 分类 */
  category?: MemoryCategory;
  
  /** 标签 */
  tags?: string[];
  
  /** 重要性 */
  importance?: number;
  
  /** 情感标记 */
  emotionalMarker?: Partial<EmotionalMarker>;
  
  /** 是否强制结晶 */
  forceCrystallize?: boolean;
  
  /** 自定义元数据 */
  metadata?: Record<string, unknown>;
}

/** 记忆存入结果 */
export interface StoreMemoryResult {
  /** 是否成功 */
  success: boolean;
  
  /** 创建的记忆节点 */
  node?: MemoryNode;
  
  /** 建立的关联数量 */
  associationsCreated: number;
  
  /** 生成的触发器数量 */
  triggersCreated: number;
  
  /** 是否触发了结晶 */
  crystallized: boolean;
  
  /** 错误信息 */
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────
// 触发器相关类型
// ─────────────────────────────────────────────────────────────────────

/** 触发器选项 */
export interface TriggerOptions {
  /** 是否启用关键词触发器 */
  enableKeywordTriggers: boolean;
  
  /** 是否启用概念触发器 */
  enableConceptTriggers: boolean;
  
  /** 是否启用情感触发器 */
  enableEmotionTriggers: boolean;
  
  /** 是否启用上下文触发器 */
  enableContextTriggers: boolean;
  
  /** 关键词最小长度 */
  minKeywordLength: number;
  
  /** 最大触发器数量 */
  maxTriggersPerMemory: number;
}

/** 默认触发器选项 */
export const DEFAULT_TRIGGER_OPTIONS: TriggerOptions = {
  enableKeywordTriggers: true,
  enableConceptTriggers: true,
  enableEmotionTriggers: true,
  enableContextTriggers: true,
  minKeywordLength: 2,
  maxTriggersPerMemory: 10,
};
