/**
 * ═══════════════════════════════════════════════════════════════════════
 * 意识编译系统 - 类型定义
 * 
 * 核心理念：
 * - 三层架构：调度层(显式) → 黑盒层(隐性) → 输出层(显式)
 * - Attention机制提供数学精密性
 * - 黑盒特性保持涌现性
 * - 能量预算控制Token
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 系统状态
// ─────────────────────────────────────────────────────────────────────

/**
 * 系统状态
 */
export interface SystemState {
  /** 能量预算 0-100 */
  energy: number;
  /** 好奇心 0-1 */
  curiosity: number;
  /** 疲劳度 0-100 */
  fatigue: number;
  /** 最近编译深度 */
  recentDepth: number;
  /** 最后活动时间 */
  lastActivity: number;
  /** 对话轮数 */
  conversationTurns: number;
}

/**
 * 系统状态的默认值
 */
export const DEFAULT_SYSTEM_STATE: SystemState = {
  energy: 100,
  curiosity: 0.5,
  fatigue: 0,
  recentDepth: 0,
  lastActivity: Date.now(),
  conversationTurns: 0,
};

// ─────────────────────────────────────────────────────────────────────
// 编译深度
// ─────────────────────────────────────────────────────────────────────

/**
 * 编译深度
 */
export interface CompilationDepth {
  /** 总深度 1-5 */
  total: number;
  /** 激活的模块 */
  modules: string[];
  /** 能量消耗 */
  energyCost: number;
  /** 每个模块的权重 */
  moduleWeights: Map<string, number>;
}

/**
 * 模块定义
 */
export interface ModuleDefinition {
  name: string;
  key: number[];       // Attention Key向量
  cost: number;        // 能量消耗
  description: string;
}

/**
 * 预定义模块
 */
export const MODULES: ModuleDefinition[] = [
  { name: 'perception', key: [1, 0, 0, 0], cost: 1, description: '感知处理' },
  { name: 'insight', key: [0, 1, 0, 0], cost: 3, description: '洞察挖掘' },
  { name: 'dimension', key: [0, 0, 1, 0], cost: 5, description: '升维理解' },
  { name: 'motivation', key: [0, 0, 0, 1], cost: 2, description: '动机生成' },
];

// ─────────────────────────────────────────────────────────────────────
// Attention节点
// ─────────────────────────────────────────────────────────────────────

/**
 * 节点类型
 */
export type NodeType = 
  | 'concept'     // 概念节点
  | 'emotion'     // 情感节点
  | 'memory'      // 记忆节点
  | 'insight'     // 洞察节点
  | 'pattern';    // 模式节点

/**
 * Attention节点
 */
export interface AttentionNode {
  /** 节点ID */
  id: string;
  /** 激活度 0-1 */
  activation: number;
  /** Query向量: "我在找什么" */
  query: number[];
  /** Key向量: "我有什么特征" */
  key: number[];
  /** Value向量: "我的实际内容" */
  value: number[];
  /** 节点类型 */
  type: NodeType;
  /** 最后一次Attention权重 */
  lastAttentionWeights?: number[];
  /** 元数据 */
  metadata?: Record<string, any>;
  /** 创建时间 */
  createdAt: number;
  /** 最后更新时间 */
  updatedAt: number;
}

/**
 * 节点连接
 */
export interface Connection {
  /** 源节点ID */
  from: string;
  /** 目标节点ID */
  to: string;
  /** 连接权重 0-1 */
  weight: number;
  /** 连接类型 */
  type: 'excitatory' | 'inhibitory';
  /** 创建时间 */
  createdAt: number;
  /** 最后激活时间 */
  lastActivated?: number;
}

// ─────────────────────────────────────────────────────────────────────
// 多头Attention
// ─────────────────────────────────────────────────────────────────────

/**
 * Attention头
 */
export interface AttentionHead {
  /** 头名称 */
  name: string;
  /** 关注类型 */
  focus: string;
  /** 向量维度 */
  dimension: number;
  /** 输出向量 */
  output?: number[];
}

/**
 * 预定义的Attention头
 */
export const ATTENTION_HEADS: AttentionHead[] = [
  { name: 'semantic', focus: '语义关系', dimension: 16 },
  { name: 'temporal', focus: '时间关系', dimension: 16 },
  { name: 'causal', focus: '因果关系', dimension: 16 },
  { name: 'emotional', focus: '情感关系', dimension: 16 },
];

// ─────────────────────────────────────────────────────────────────────
// 理解结果
// ─────────────────────────────────────────────────────────────────────

/**
 * 理解结果
 */
export interface Understanding {
  /** 核心理解 */
  essence: string;
  /** 置信度 0-1 */
  confidence: number;
  /** 推导路径（激活的节点ID） */
  derivation: string[];
  /** Attention权重 */
  attentionWeights?: Map<string, number>;
  /** 情感效价 */
  emotionalValence?: number;
  /** 行动建议 */
  actionHint?: string;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 聚焦内容
 */
export interface FocusedContent {
  /** 聚焦的内容 */
  focused: Array<{
    aspect: string;
    content: string;
    weight: number;
  }>;
  /** 权重分布 */
  weights: number[];
}

// ─────────────────────────────────────────────────────────────────────
// 编译结果
// ─────────────────────────────────────────────────────────────────────

/**
 * 编译结果
 */
export interface CompilationResult {
  /** 理解结果 */
  understanding: Understanding;
  /** 响应内容 */
  response: string;
  /** 系统状态 */
  state: SystemState;
  /** 统计信息 */
  stats: CompilationStats;
}

/**
 * 编译统计
 */
export interface CompilationStats {
  /** 编译深度 */
  depth: number;
  /** 使用的模块 */
  modulesUsed: string[];
  /** 能量消耗 */
  energyConsumed: number;
  /** 迭代次数 */
  iterations: number;
  /** 节点数量 */
  nodeCount: number;
  /** 连接数量 */
  connectionCount: number;
  /** 处理时间(ms) */
  processingTime: number;
}

// ─────────────────────────────────────────────────────────────────────
// 配置
// ─────────────────────────────────────────────────────────────────────

/**
 * 调度器配置
 */
export interface SchedulerConfig {
  /** 初始能量 */
  initialEnergy?: number;
  /** 初始好奇心 */
  initialCuriosity?: number;
  /** 能量恢复率 */
  energyRecoveryRate?: number;
  /** 最大深度 */
  maxDepth?: number;
}

/**
 * 黑盒配置
 */
export interface BlackBoxConfig {
  /** 向量维度 */
  vectorDimension?: number;
  /** 衰减率 */
  decayRate?: number;
  /** 最大节点数 */
  maxNodes?: number;
  /** 激活阈值 */
  activationThreshold?: number;
}

/**
 * 学习配置
 */
export interface LearningConfig {
  /** 学习率 */
  learningRate?: number;
  /** LTP时间常数 */
  ltpTau?: number;
  /** LTD时间常数 */
  ltdTau?: number;
  /** LTP强度 */
  ltpStrength?: number;
  /** LTD强度 */
  ltdStrength?: number;
}

/**
 * 输出层配置
 */
export interface OutputConfig {
  /** 是否使用LLM */
  useLLM?: boolean;
  /** 聚焦阈值 */
  focusThreshold?: number;
}

/**
 * 编译器配置
 */
export interface CompilerConfig {
  scheduler?: SchedulerConfig;
  blackbox?: BlackBoxConfig;
  learning?: LearningConfig;
  output?: OutputConfig;
}

// ─────────────────────────────────────────────────────────────────────
// 上下文
// ─────────────────────────────────────────────────────────────────────

/**
 * 处理上下文
 */
export interface ProcessContext {
  /** 原始输入 */
  input: string;
  /** 编译深度 */
  depth: CompilationDepth;
  /** 对话历史 */
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** 额外参数 */
  extra?: Record<string, any>;
}
