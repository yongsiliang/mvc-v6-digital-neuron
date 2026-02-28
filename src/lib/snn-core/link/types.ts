/**
 * ═══════════════════════════════════════════════════════════════════════
 * 链接层类型定义
 * 
 * 链接 = 脉冲的稳定模式
 * 意义从连接中涌现
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { NeuronId, SynapseId, NetworkSnapshot } from '../types';

// ─────────────────────────────────────────────────────────────────────
// 概念与链接
// ─────────────────────────────────────────────────────────────────────

/**
 * 概念 ID（可以是词、短语、实体）
 */
export type ConceptId = string;

/**
 * 链接类型
 */
export type LinkType = 
  | 'bind'      // 绑定：持久关联（猫-宠物）
  | 'flow'      // 流动：信息传递（问题→答案）
  | 'hold'      // 保持：状态维持（当前焦点）
  | 'inhibit'   // 抑制：互斥关系（快乐-悲伤）
  | 'associate' // 联想：弱关联（蓝-海）

/**
 * 单条链接
 */
export interface Link {
  id: string;
  type: LinkType;
  source: ConceptId;
  target: ConceptId;
  
  // 链接强度 (0-1)
  strength: number;
  
  // 映射到 SNN 的突触
  synapseIds: SynapseId[];
  
  // 元数据
  createdAt: number;
  lastActivated: number;
  activationCount: number;
  
  // 来源
  origin: 'explicit' | 'emerged' | 'taught';  // 显式/涌现/教学
}

/**
 * 链接组（多条链接的聚合）
 */
export interface LinkGroup {
  concept: ConceptId;
  
  // 各种类型的链接
  boundTo: Array<{ concept: ConceptId; strength: number }>;
  flowsTo: Array<{ concept: ConceptId; path: ConceptId[] }>;
  holds: Array<{ concept: ConceptId; duration: number }>;
  inhibits: Array<{ concept: ConceptId; strength: number }>;
  associates: Array<{ concept: ConceptId; strength: number }>;
}

// ─────────────────────────────────────────────────────────────────────
// SNN 映射
// ─────────────────────────────────────────────────────────────────────

/**
 * 链接到突触的映射规则
 */
export interface LinkToSynapseRule {
  // 突触权重范围
  weightRange: {
    min: number;
    max: number;
    default: number;
  };
  
  // 是否双向
  bidirectional: boolean;
  
  // 延迟设置
  delayRange: {
    min: number;  // 时间步
    max: number;
    default: number;
  };
  
  // 是否可塑 (参与 STDP)
  plastic: boolean;
  
  // 权重符号 (抑制链接为负)
  sign: 1 | -1;
}

/**
 * 各类型链接的默认映射规则
 */
export const LINK_SYNAPSE_RULES: Record<LinkType, LinkToSynapseRule> = {
  bind: {
    weightRange: { min: 1.0, max: 2.0, default: 1.5 },
    bidirectional: true,
    delayRange: { min: 0, max: 1, default: 0 },
    plastic: true,
    sign: 1
  },
  
  flow: {
    weightRange: { min: 0.5, max: 1.2, default: 0.8 },
    bidirectional: false,
    delayRange: { min: 1, max: 5, default: 2 },
    plastic: true,
    sign: 1
  },
  
  hold: {
    weightRange: { min: 0.8, max: 1.5, default: 1.0 },
    bidirectional: false,  // 自环
    delayRange: { min: 0, max: 2, default: 1 },
    plastic: true,
    sign: 1
  },
  
  inhibit: {
    weightRange: { min: -2.0, max: -0.5, default: -1.0 },
    bidirectional: true,
    delayRange: { min: 0, max: 1, default: 0 },
    plastic: true,
    sign: -1
  },
  
  associate: {
    weightRange: { min: 0.1, max: 0.5, default: 0.3 },
    bidirectional: true,
    delayRange: { min: 2, max: 10, default: 5 },
    plastic: true,
    sign: 1
  }
};

// ─────────────────────────────────────────────────────────────────────
// 涌现检测
// ─────────────────────────────────────────────────────────────────────

/**
 * 涌现链接候选
 */
export interface EmergedLinkCandidate {
  source: ConceptId;
  target: ConceptId;
  
  // 检测依据
  evidence: {
    coActivationCount: number;    // 共激活次数
    avgCorrelation: number;        // 平均相关性
    sequentialPattern: boolean;   // 是否有序列模式
    timeDelay: number;            // 时间延迟 (负=source先)
  };
  
  // 推断的链接类型
  inferredType: LinkType;
  confidence: number;  // 置信度
}

/**
 * 链接层配置
 */
export interface LinkLayerConfig {
  // 最小强度阈值（低于此值的链接会被修剪）
  pruneThreshold: number;
  
  // 涌现检测参数
  emergence: {
    minCoActivation: number;    // 最小共激活次数
    correlationThreshold: number;  // 相关性阈值
    confidenceThreshold: number;   // 置信度阈值
  };
  
  // 学习率
  learningRate: {
    reinforce: number;  // 强化
    decay: number;      // 衰减
  };
}

/**
 * 默认配置
 */
export const DEFAULT_LINK_CONFIG: LinkLayerConfig = {
  pruneThreshold: 0.1,
  emergence: {
    minCoActivation: 5,
    correlationThreshold: 0.6,
    confidenceThreshold: 0.7
  },
  learningRate: {
    reinforce: 0.1,
    decay: 0.01
  }
};
