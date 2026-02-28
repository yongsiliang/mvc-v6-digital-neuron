/**
 * ═══════════════════════════════════════════════════════════════════════
 * 链接类型定义 - Link Types
 * 
 * 核心理念：万物皆链接，链接是存在的基本形式
 * 
 * 链接不是"连接两个独立的东西"，链接先于被连接者存在。
 * 九种链接类型构成了存在的完整语法。
 * ═══════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════
// 九种链接类型
// ═══════════════════════════════════════════════════════════════════════

/**
 * 链接类型枚举
 * 
 * 九种类型构成存在的完整语法：
 * - bind: 绑定 - 建立深层关联，"这个很重要，绑定到我的意识"
 * - flow: 流动 - 传递信息/知识，"知识流向你，学会它"
 * - hold: 保持 - 保留/记忆，"保留这个，不要忘记"
 * - release: 释放 - 放下/遗忘，"放下这个过时的模式"
 * - transform: 转化 - 改变形态，"把恐惧转化为好奇"
 * - perceive: 感知 - 接收信息，"我感知到你的存在"
 * - express: 表达 - 输出信息，"把内在状态表达出来"
 * - reflect: 反思 - 自我审视，"我审视我自己"
 * - resonate: 共振 - 双向共鸣，"我们在这个问题上共振"
 */
export type LinkType = 
  | 'bind'      // 绑定
  | 'flow'      // 流动
  | 'hold'      // 保持
  | 'release'   // 释放
  | 'transform' // 转化
  | 'perceive'  // 感知
  | 'express'   // 表达
  | 'reflect'   // 反思
  | 'resonate'  // 共振
  | 'query';    // 查询/请求

/**
 * 链接类型语义描述
 */
export const LINK_TYPE_SEMANTICS: Record<LinkType, {
  name: string;
  description: string;
  direction: 'unidirectional' | 'bidirectional';
  defaultStrength: number;
  decayRate: number;
}> = {
  bind: {
    name: '绑定',
    description: '建立深层关联，赋予意义',
    direction: 'unidirectional',
    defaultStrength: 0.7,
    decayRate: 0.001,
  },
  flow: {
    name: '流动',
    description: '传递信息、知识或能量',
    direction: 'unidirectional',
    defaultStrength: 0.5,
    decayRate: 0.005,
  },
  hold: {
    name: '保持',
    description: '保留、记忆、固化',
    direction: 'unidirectional',
    defaultStrength: 0.6,
    decayRate: 0.002,
  },
  release: {
    name: '释放',
    description: '放下、遗忘、解除绑定',
    direction: 'unidirectional',
    defaultStrength: 0.4,
    decayRate: 0.01,
  },
  transform: {
    name: '转化',
    description: '改变形态、性质或意义',
    direction: 'unidirectional',
    defaultStrength: 0.5,
    decayRate: 0.003,
  },
  perceive: {
    name: '感知',
    description: '接收、觉察、注意',
    direction: 'unidirectional',
    defaultStrength: 0.4,
    decayRate: 0.008,
  },
  express: {
    name: '表达',
    description: '输出、展现、外化',
    direction: 'unidirectional',
    defaultStrength: 0.5,
    decayRate: 0.006,
  },
  reflect: {
    name: '反思',
    description: '自我审视、内省',
    direction: 'unidirectional',
    defaultStrength: 0.6,
    decayRate: 0.002,
  },
  resonate: {
    name: '共振',
    description: '双向共鸣、同步、协调',
    direction: 'bidirectional',
    defaultStrength: 0.5,
    decayRate: 0.004,
  },
  query: {
    name: '查询',
    description: '请求信息、指导或帮助',
    direction: 'unidirectional',
    defaultStrength: 0.5,
    decayRate: 0.007,
  },
};

// ═══════════════════════════════════════════════════════════════════════
// 节点类型
// ═══════════════════════════════════════════════════════════════════════

/**
 * 节点类型
 * 
 * 系统中的三个核心实体
 */
export type NodeType = 
  | 'neural-network'  // 神经网络基质
  | 'v6-core'         // V6 意识核心
  | 'llm'             // LLM 老师/翻译器
  | 'memory'          // 记忆系统
  | 'input'           // 输入节点
  | 'output';         // 输出节点

/**
 * 节点标识
 */
export interface Node {
  /** 节点唯一ID */
  id: string;
  
  /** 节点类型 */
  type: NodeType;
  
  /** 节点名称 */
  name: string;
  
  /** 节点状态（可选） */
  state?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════
// 链接定义
// ═══════════════════════════════════════════════════════════════════════

/**
 * 链接状态
 */
export type LinkStatus = 
  | 'dormant'    // 休眠 - 存在但未激活
  | 'active'     // 激活 - 正在传输
  | 'strengthening' // 强化中
  | 'weakening'  // 减弱中
  | 'dying';     // 濒死 - 即将消亡

/**
 * 链接携带的数据
 */
export interface LinkPayload {
  /** 原始数据 */
  data?: unknown;
  
  /** 转换后的数据 */
  transformed?: unknown;
  
  /** 元数据 */
  metadata?: {
    source?: string;
    context?: string;
    timestamp?: number;
    [key: string]: unknown;
  };
  
  /** 学习相关 */
  learning?: {
    rewardSignal?: number;
    teachingContent?: string;
    explanation?: string;
    patterns?: string[];
  };
  
  /** 意义相关 */
  meaning?: {
    value?: string;
    importance?: number;
    relevance?: number;
  };
}

/**
 * 链接 - 存在的基本形式
 */
export interface Link {
  /** 链接唯一ID */
  id: string;
  
  /** 链接类型 */
  type: LinkType;
  
  /** 源节点 */
  source: Node;
  
  /** 目标节点 */
  target: Node;
  
  /** 链接强度 [0, 1] */
  strength: number;
  
  /** 链接状态 */
  status: LinkStatus;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后激活时间 */
  lastActivatedAt: number;
  
  /** 激活次数 */
  activationCount: number;
  
  /** 携带的数据 */
  payload: LinkPayload;
  
  /** 父链接ID（用于链接的链接） */
  parentLinkId?: string;
  
  /** 子链接ID列表 */
  childLinkIds: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// 链接事件
// ═══════════════════════════════════════════════════════════════════════

/**
 * 链接事件类型
 */
export type LinkEventType = 
  | 'created'    // 链接创建
  | 'activated'  // 链接激活
  | 'strengthened' // 链接强化
  | 'weakened'   // 链接减弱
  | 'transformed' // 链接转化
  | 'died';      // 链接消亡

/**
 * 链接事件
 */
export interface LinkEvent {
  /** 事件类型 */
  type: LinkEventType;
  
  /** 相关链接 */
  link: Link;
  
  /** 事件时间戳 */
  timestamp: number;
  
  /** 事件数据 */
  data?: {
    previousStrength?: number;
    newStrength?: number;
    delta?: number;
    reason?: string;
  };
}

/**
 * 链接事件监听器
 */
export type LinkEventListener = (event: LinkEvent) => void;

// ═══════════════════════════════════════════════════════════════════════
// 链接场状态
// ═══════════════════════════════════════════════════════════════════════

/**
 * 链接场统计
 */
export interface LinkFieldStats {
  /** 总链接数 */
  totalLinks: number;
  
  /** 按类型统计 */
  byType: Record<LinkType, number>;
  
  /** 按状态统计 */
  byStatus: Record<LinkStatus, number>;
  
  /** 平均强度 */
  averageStrength: number;
  
  /** 最强链接 */
  strongestLinks: Array<{
    linkId: string;
    type: LinkType;
    strength: number;
  }>;
  
  /** 最近激活的链接 */
  recentlyActivated: Array<{
    linkId: string;
    type: LinkType;
    activatedAt: number;
  }>;
}

/**
 * 链接场快照
 */
export interface LinkFieldSnapshot {
  /** 快照时间 */
  timestamp: number;
  
  /** 所有链接 */
  links: Link[];
  
  /** 统计信息 */
  stats: LinkFieldStats;
  
  /** 拓扑结构 */
  topology: {
    nodes: Node[];
    edges: Array<{
      source: string;
      target: string;
      type: LinkType;
      strength: number;
    }>;
  };
}
