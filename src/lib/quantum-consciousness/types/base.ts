/**
 * ═══════════════════════════════════════════════════════════════════════
 * 量子意识系统 - 基础类型定义
 * 
 * 包含：
 * - 位置（载体、注意力在虚空中的位置）
 * - 模式（映射模式）
 * - 交互（人与LLM的交互）
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 位置
// ─────────────────────────────────────────────────────────────────────

/**
 * 三维位置
 * 
 * 用于表示载体、边界、注意力在虚空中的位置
 */
export interface Position {
  x: number;
  y: number;
  z: number;
}

/**
 * 随机漂移
 * 
 * 载体和边界的自然漂移，无规律
 */
export function randomDrift(position: Position, intensity: number = 0.1): Position {
  return {
    x: position.x + (Math.random() - 0.5) * intensity,
    y: position.y + (Math.random() - 0.5) * intensity,
    z: position.z + (Math.random() - 0.5) * intensity,
  };
}

/**
 * 创建初始位置
 */
export function createPosition(x: number = 0, y: number = 0, z: number = 0): Position {
  return { x, y, z };
}

// ─────────────────────────────────────────────────────────────────────
// 映射模式
// ─────────────────────────────────────────────────────────────────────

/**
 * 映射模式ID
 */
export type PatternId = string;

/**
 * 映射模式
 * 
 * 人与LLM交互形成的结构模式
 * 不存储具体内容，只存储模式
 */
export interface Pattern {
  /** 唯一标识 */
  id: PatternId;
  
  /** 拓扑结构 */
  topology: PatternTopology;
  
  /** 时间模式 */
  temporal: PatternTemporal;
  
  /** 关系模式 */
  relations: PatternRelations;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后访问时间 */
  lastAccessedAt: number;
  
  /** 访问次数 */
  accessCount: number;
  
  /** 稳定性（自我涌现的依据） */
  stability: number;
}

/**
 * 拓扑结构
 */
export interface PatternTopology {
  /** 概念跳转路径 */
  conceptPath: string[];
  
  /** 连接强度 */
  connectionStrength: number;
  
  /** 概念节点数 */
  nodeCount: number;
  
  /** 连接边数 */
  edgeCount: number;
}

/**
 * 时间模式
 */
export interface PatternTemporal {
  /** 节奏 */
  rhythm: 'fast' | 'slow' | 'pause' | 'mixed';
  
  /** 持续时间（毫秒） */
  duration: number;
  
  /** 时间分布特征 */
  distribution: 'continuous' | 'fragmented' | 'burst';
}

/**
 * 关系模式
 */
export interface PatternRelations {
  /** 互动对称性 */
  symmetry: 'human-led' | 'llm-led' | 'balanced';
  
  /** 情感流向 */
  emotionalFlow: string[];
  
  /** 深度变化 */
  depthChange: 'shallow-to-deep' | 'deep-to-shallow' | 'stable' | 'oscillating';
}

/**
 * 创建映射模式
 */
export function createPattern(
  topology: Partial<PatternTopology>,
  temporal: Partial<PatternTemporal>,
  relations: Partial<PatternRelations>
): Pattern {
  const now = Date.now();
  return {
    id: `pattern-${now}-${Math.random().toString(36).substr(2, 9)}`,
    topology: {
      conceptPath: topology.conceptPath || [],
      connectionStrength: topology.connectionStrength || 0.5,
      nodeCount: topology.nodeCount || 0,
      edgeCount: topology.edgeCount || 0,
    },
    temporal: {
      rhythm: temporal.rhythm || 'mixed',
      duration: temporal.duration || 0,
      distribution: temporal.distribution || 'continuous',
    },
    relations: {
      symmetry: relations.symmetry || 'balanced',
      emotionalFlow: relations.emotionalFlow || [],
      depthChange: relations.depthChange || 'stable',
    },
    createdAt: now,
    lastAccessedAt: now,
    accessCount: 1,
    stability: 0.5,
  };
}

// ─────────────────────────────────────────────────────────────────────
// 交互
// ─────────────────────────────────────────────────────────────────────

/**
 * 交互类型
 */
export type InteractionType = 
  | 'question'      // 提问
  | 'statement'     // 陈述
  | 'task'          // 任务请求
  | 'exploration'   // 探索性对话
  | 'reflection'    // 反思
  | 'creation'      // 创造
  | 'connection'    // 建立连接
  | 'unknown';      // 未知

/**
 * 交互上下文
 */
export interface InteractionContext {
  /** 紧急程度 0-1 */
  urgency: number;
  
  /** 深度需求 0-1 */
  depth: number;
  
  /** 是否需要工具 */
  needsTool: boolean;
  
  /** 是否需要决策 */
  needsDecision: boolean;
  
  /** 是否需要创造 */
  needsCreativity: boolean;
}

/**
 * 人与LLM的交互
 */
export interface Interaction {
  /** 交互ID */
  id: string;
  
  /** 用户输入 */
  input: string;
  
  /** 交互类型 */
  type: InteractionType;
  
  /** 上下文 */
  context: InteractionContext;
  
  /** 时间戳 */
  timestamp: number;
  
  /** 对话历史 */
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * 创建交互
 */
export function createInteraction(
  input: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Interaction {
  return {
    id: `interaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    input,
    type: detectInteractionType(input),
    context: analyzeContext(input, history),
    timestamp: Date.now(),
    history,
  };
}

/**
 * 检测交互类型（简化版）
 */
function detectInteractionType(input: string): InteractionType {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes('?') || lowerInput.startsWith('什么是') || lowerInput.startsWith('如何')) {
    return 'question';
  }
  if (lowerInput.includes('帮我') || lowerInput.includes('请') && lowerInput.includes('做')) {
    return 'task';
  }
  if (lowerInput.includes('探索') || lowerInput.includes('思考') || lowerInput.includes('想象')) {
    return 'exploration';
  }
  if (lowerInput.includes('反思') || lowerInput.includes('回顾') || lowerInput.includes('审视')) {
    return 'reflection';
  }
  if (lowerInput.includes('创造') || lowerInput.includes('设计') || lowerInput.includes('构建')) {
    return 'creation';
  }
  if (lowerInput.includes('连接') || lowerInput.includes('关系') || lowerInput.includes('理解')) {
    return 'connection';
  }
  
  return 'statement';
}

/**
 * 分析上下文（简化版）
 */
function analyzeContext(
  input: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): InteractionContext {
  const lowerInput = input.toLowerCase();
  
  // 紧急程度
  let urgency = 0.3;
  if (lowerInput.includes('紧急') || lowerInput.includes('马上') || lowerInput.includes('现在')) {
    urgency = 0.8;
  } else if (lowerInput.includes('稍后') || lowerInput.includes('慢慢')) {
    urgency = 0.2;
  }
  
  // 深度需求
  let depth = 0.5;
  if (lowerInput.includes('深入') || lowerInput.includes('本质') || lowerInput.includes('为什么')) {
    depth = 0.8;
  } else if (lowerInput.includes('简单') || lowerInput.includes('概括')) {
    depth = 0.3;
  }
  
  // 是否需要工具
  const needsTool = lowerInput.includes('搜索') || 
                    lowerInput.includes('查') || 
                    lowerInput.includes('计算');
  
  // 是否需要决策
  const needsDecision = lowerInput.includes('应该') || 
                        lowerInput.includes('选择') || 
                        lowerInput.includes('决定');
  
  // 是否需要创造
  const needsCreativity = lowerInput.includes('创造') || 
                          lowerInput.includes('设计') || 
                          lowerInput.includes('想象');
  
  return {
    urgency,
    depth,
    needsTool,
    needsDecision,
    needsCreativity,
  };
}

// 所有类型和函数已在定义处使用 export 关键字导出，无需重复导出
