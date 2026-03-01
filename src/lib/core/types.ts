/**
 * ═══════════════════════════════════════════════════════════════════════
 * 贾维斯核心系统 - 从第一性原理重新设计
 * 
 * 设计原则:
 * 1. 极简 - 只保留必要的数据结构和操作
 * 2. 可学习 - 所有策略都可以通过反馈改进
 * 3. 可验证 - 每个组件都可以独立测试
 * 
 * 核心公式:
 * J = (U, W, π)
 * 其中 U = 用户状态, W = 世界状态, π = 策略函数
 * ═══════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════
// 第一部分：核心数据结构
// ═══════════════════════════════════════════════════════════════════════

/**
 * 用户状态 (User State)
 * 
 * 这是系统"理解用户"的核心。
 * 不是对话历史的堆砌，而是对用户的完整建模。
 * 
 * 数学表示: U = (P, G, H, R)
 * 其中 P=偏好, G=目标, H=历史, R=关系
 */
export interface UserState {
  // ───────────────────────────────────────────────────────────────────
  // 基本身份
  // ───────────────────────────────────────────────────────────────────
  
  /** 用户ID */
  id: string;
  
  /** 用户名称 */
  name: string;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后活跃时间 */
  lastActiveAt: number;
  
  // ───────────────────────────────────────────────────────────────────
  // P: 偏好向量 (Preferences)
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 偏好向量
   * 
   * 这是一个高维向量，表示用户的偏好。
   * 维度含义可以包括：
   * - 沟通风格偏好 (简洁/详细)
   * - 时间偏好 (早起/晚睡)
   * - 内容偏好 (技术/生活/娱乐)
   * - 交互偏好 (文字/语音/视觉)
   * 
   * 通过学习不断调整，而不是硬编码规则
   */
  preferences: {
    /** 偏好向量 (可学习) */
    vector: number[];
    
    /** 已知的明确偏好 (用户明确表达的) */
    explicit: Map<string, PreferenceEntry>;
    
    /** 从行为推断的隐式偏好 */
    implicit: Map<string, PreferenceEntry>;
  };
  
  // ───────────────────────────────────────────────────────────────────
  // G: 目标树 (Goals)
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 目标树
   * 
   * 用户想要达成的事情。
   * 支持目标分解和依赖关系。
   */
  goals: {
    /** 活跃目标 */
    active: Goal[];
    
    /** 已完成目标 */
    completed: Goal[];
    
    /** 放弃的目标 */
    abandoned: Goal[];
  };
  
  // ───────────────────────────────────────────────────────────────────
  // H: 经验轨迹 (History)
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 经验轨迹
   * 
   * 这是强化学习的核心数据结构。
   * 记录 (状态, 动作, 奖励, 下一状态) 的序列。
   */
  experience: {
    /** 近期经验 (工作记忆) */
    recent: Experience[];
    
    /** 重要经验 (长期记忆) */
    significant: Experience[];
    
    /** 经验统计 */
    stats: {
      totalInteractions: number;
      averageSatisfaction: number;
      topicsDiscussed: Map<string, number>;
    };
  };
  
  // ───────────────────────────────────────────────────────────────────
  // R: 关系网络 (Relationships)
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 关系网络
   * 
   * 用户在乎的人和事。
   */
  relationships: {
    /** 人际关系 */
    people: Relationship[];
    
    /** 重要实体 (项目、组织等) */
    entities: EntityRelation[];
    
    /** 与AI助手的关系 (信任度、亲密度等) */
    withAI: {
      trustLevel: number;      // 信任度 0-1
      familiarity: number;     // 熟悉度 0-1
      interactionStyle: string; // 交互风格
    };
  };
}

/**
 * 偏好条目
 */
export interface PreferenceEntry {
  /** 偏好内容 */
  content: string;
  
  /** 重要程度 0-1 */
  importance: number;
  
  /** 来源 */
  source: 'explicit' | 'implicit' | 'inferred';
  
  /** 置信度 0-1 */
  confidence: number;
  
  /** 最后更新时间 */
  updatedAt: number;
}

/**
 * 目标
 */
export interface Goal {
  /** 目标ID */
  id: string;
  
  /** 目标内容 */
  content: string;
  
  /** 重要程度 0-1 */
  importance: number;
  
  /** 紧急程度 0-1 */
  urgency: number;
  
  /** 截止时间 */
  deadline?: number;
  
  /** 子目标 */
  subGoals?: Goal[];
  
  /** 依赖的目标 */
  dependsOn?: string[];
  
  /** 状态 */
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  
  /** 创建时间 */
  createdAt: number;
  
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 经验 (强化学习中的 transition)
 */
export interface Experience {
  /** 经验ID */
  id: string;
  
  /** 时间戳 */
  timestamp: number;
  
  /** 触发消息 */
  trigger: string;
  
  /** 理解的意图 */
  intent: string;
  
  /** 采取的动作 */
  actions: string[];
  
  /** 生成的响应 */
  response: string;
  
  /** 奖励信号 (用户满意度) */
  reward: {
    explicit?: number;  // 用户明确反馈
    implicit?: number;  // 从行为推断
    computed: number;   // 综合计算
  };
  
  /** 用户反馈 */
  feedback?: {
    type: 'positive' | 'negative' | 'neutral';
    content?: string;
  };
  
  /** 学到的内容 */
  learned?: string;
}

/**
 * 关系
 */
export interface Relationship {
  /** 人名 */
  name: string;
  
  /** 关系类型 */
  type: 'family' | 'friend' | 'colleague' | 'acquaintance' | 'other';
  
  /** 重要程度 0-1 */
  importance: number;
  
  /** 关键互动 */
  keyInteractions: string[];
  
  /** 备注 */
  notes?: string;
}

/**
 * 实体关系
 */
export interface EntityRelation {
  /** 实体名称 */
  name: string;
  
  /** 实体类型 */
  type: 'project' | 'organization' | 'interest' | 'possession' | 'other';
  
  /** 重要程度 0-1 */
  importance: number;
  
  /** 关联信息 */
  details?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// 第二部分：世界状态
// ═══════════════════════════════════════════════════════════════════════

/**
 * 世界状态 (World State)
 * 
 * 这是系统"理解世界"的核心。
 * 不是工具的堆砌，而是对世界的完整建模。
 * 
 * 数学表示: W = (E, R, O, A)
 * 其中 E=实体, R=关系, O=可观察状态, A=可用动作
 */
export interface WorldState {
  // ───────────────────────────────────────────────────────────────────
  // E: 实体 (Entities)
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 已知实体
   * 
   * 系统知道的"东西" - 人、物、概念、服务等
   */
  entities: Map<string, WorldEntity>;
  
  // ───────────────────────────────────────────────────────────────────
  // R: 关系 (Relations)
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 实体关系
   * 
   * 实体之间的关联
   */
  relations: WorldRelation[];
  
  // ───────────────────────────────────────────────────────────────────
  // O: 可观察状态 (Observable)
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 当前可观察状态
   * 
   * 系统能感知到的当前世界状态
   */
  observable: {
    /** 当前时间 */
    time: number;
    
    /** 时区 */
    timezone: string;
    
    /** 日期信息 */
    date: {
      weekday: string;
      isWeekend: boolean;
      isHoliday: boolean;
      holidayName?: string;
    };
    
    /** 用户设备 */
    device?: {
      type: 'desktop' | 'mobile' | 'tablet';
      os: string;
      browser: string;
    };
    
    /** 用户位置 (如果授权) */
    location?: {
      city?: string;
      country?: string;
      timezone: string;
    };
  };
  
  // ───────────────────────────────────────────────────────────────────
  // A: 可用动作 (Available Actions)
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 可用动作
   * 
   * 系统能执行的操作
   */
  availableActions: {
    /** 信息类动作 */
    information: ActionCapability[];
    
    /** 执行类动作 */
    execution: ActionCapability[];
    
    /** 沟通类动作 */
    communication: ActionCapability[];
  };
}

/**
 * 世界实体
 */
export interface WorldEntity {
  /** 实体ID */
  id: string;
  
  /** 实体名称 */
  name: string;
  
  /** 实体类型 */
  type: 'person' | 'place' | 'thing' | 'concept' | 'service' | 'event';
  
  /** 属性 */
  attributes: Map<string, unknown>;
  
  /** 向量表示 (用于语义搜索) */
  embedding?: number[];
}

/**
 * 世界关系
 */
export interface WorldRelation {
  /** 源实体ID */
  from: string;
  
  /** 关系类型 */
  type: string;
  
  /** 目标实体ID */
  to: string;
  
  /** 关系强度 */
  strength: number;
}

/**
 * 动作能力
 */
export interface ActionCapability {
  /** 动作ID */
  id: string;
  
  /** 动作名称 */
  name: string;
  
  /** 动作描述 */
  description: string;
  
  /** 参数模式 */
  parameters: JSONSchema;
  
  /** 是否可用 */
  available: boolean;
  
  /** 前置条件 */
  preconditions?: string[];
}

/**
 * JSON Schema 类型
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  [key: string]: unknown;
}

// ═══════════════════════════════════════════════════════════════════════
// 第三部分：系统策略
// ═══════════════════════════════════════════════════════════════════════

/**
 * 系统策略 (System Policy)
 * 
 * 这是系统"如何决策"的核心。
 * 不是规则引擎，而是可学习的策略函数。
 * 
 * 数学表示: π: (U × W × M) → (A, ΔU, ΔW)
 * 其中 M=消息, A=动作, Δ=状态更新
 */
export interface SystemPolicy {
  // ───────────────────────────────────────────────────────────────────
  // 核心策略函数
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 意图理解函数
   * 
   * 输入: 用户消息 + 用户状态
   * 输出: 结构化意图
   */
  understandIntent: (message: string, userState: UserState) => Promise<Intent>;
  
  /**
   * 记忆检索函数
   * 
   * 输入: 意图 + 用户状态
   * 输出: 相关上下文
   */
  recallMemory: (intent: Intent, userState: UserState) => Promise<MemoryContext>;
  
  /**
   * 动作规划函数
   * 
   * 输入: 意图 + 上下文 + 世界状态
   * 输出: 动作序列
   */
  planActions: (
    intent: Intent,
    context: MemoryContext,
    worldState: WorldState
  ) => Promise<Action[]>;
  
  /**
   * 动作执行函数
   * 
   * 输入: 动作
   * 输出: 执行结果
   */
  executeAction: (action: Action) => Promise<ActionResult>;
  
  /**
   * 响应生成函数
   * 
   * 输入: 动作结果
   * 输出: 用户响应
   */
  generateResponse: (
    intent: Intent,
    results: ActionResult[],
    context: MemoryContext,
    userState: UserState
  ) => Promise<string>;
  
  /**
   * 状态更新函数
   * 
   * 输入: 整个交互过程
   * 输出: 状态更新
   */
  updateState: (interaction: Interaction) => StateUpdate;
  
  // ───────────────────────────────────────────────────────────────────
  // 学习机制
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 学习函数
   * 
   * 从经验中学习，改进策略
   */
  learn: (experience: Experience) => Promise<void>;
  
  /**
   * 获取当前策略参数
   */
  getParameters: () => PolicyParameters;
  
  /**
   * 设置策略参数
   */
  setParameters: (params: Partial<PolicyParameters>) => void;
}

/**
 * 意图
 */
export interface Intent {
  /** 意图ID */
  id: string;
  
  /** 意图类型 */
  type: IntentType;
  
  /** 意图内容 */
  content: string;
  
  /** 置信度 0-1 */
  confidence: number;
  
  /** 槽位 (提取的关键信息) */
  slots: Map<string, string>;
  
  /** 子意图 */
  subIntents?: Intent[];
}

/**
 * 意图类型
 */
export type IntentType = 
  | 'question'        // 提问
  | 'command'         // 命令
  | 'statement'       // 陈述
  | 'preference'      // 表达偏好
  | 'feedback'        // 反馈
  | 'greeting'        // 问候
  | 'farewell'        // 告别
  | 'unknown';        // 未知

/**
 * 记忆上下文
 */
export interface MemoryContext {
  /** 直接相关的记忆 */
  directMemories: MemoryItem[];
  
  /** 相关的用户偏好 */
  relevantPreferences: PreferenceEntry[];
  
  /** 相关的目标 */
  relevantGoals: Goal[];
  
  /** 相关的关系 */
  relevantRelationships: Relationship[];
  
  /** 相关的历史交互 */
  relevantHistory: Experience[];
  
  /** 上下文摘要 */
  summary: string;
}

/**
 * 记忆项
 */
export interface MemoryItem {
  /** 记忆ID */
  id: string;
  
  /** 记忆内容 */
  content: string;
  
  /** 记忆类型 */
  type: 'episodic' | 'semantic' | 'procedural';
  
  /** 相关度 0-1 */
  relevance: number;
  
  /** 时间戳 */
  timestamp: number;
}

/**
 * 动作
 */
export interface Action {
  /** 动作ID */
  id: string;
  
  /** 动作类型 */
  type: ActionType;
  
  /** 动作内容 */
  content: string;
  
  /** 参数 */
  parameters: Record<string, unknown>;
  
  /** 预期结果 */
  expectedOutcome?: string;
}

/**
 * 动作类型
 */
export type ActionType = 
  | 'respond'         // 直接响应
  | 'search'          // 搜索信息
  | 'execute'         // 执行代码/命令
  | 'call_api'        // 调用API
  | 'store_memory'    // 存储记忆
  | 'update_state'    // 更新状态
  | 'ask_clarification'; // 请求澄清

/**
 * 动作结果
 */
export interface ActionResult {
  /** 动作ID */
  actionId: string;
  
  /** 是否成功 */
  success: boolean;
  
  /** 结果数据 */
  data?: unknown;
  
  /** 错误信息 */
  error?: string;
  
  /** 执行时间 (ms) */
  duration: number;
}

/**
 * 交互记录
 */
export interface Interaction {
  /** 交互ID */
  id: string;
  
  /** 时间戳 */
  timestamp: number;
  
  /** 用户消息 */
  message: string;
  
  /** 理解的意图 */
  intent: Intent;
  
  /** 检索的上下文 */
  context: MemoryContext;
  
  /** 执行的动作 */
  actions: Action[];
  
  /** 动作结果 */
  results: ActionResult[];
  
  /** 生成的响应 */
  response: string;
  
  /** 用户反馈 (如果有) */
  feedback?: {
    type: 'positive' | 'negative' | 'neutral';
    content?: string;
    rating?: number;
  };
}

/**
 * 状态更新
 */
export interface StateUpdate {
  /** 用户状态更新 */
  userStateDelta: Partial<UserState>;
  
  /** 世界状态更新 */
  worldStateDelta: Partial<WorldState>;
  
  /** 新的经验 */
  newExperience?: Experience;
}

/**
 * 策略参数
 */
export interface PolicyParameters {
  /** 意图理解参数 */
  intentRecognition: {
    temperature: number;
    maxTokens: number;
  };
  
  /** 记忆检索参数 */
  memoryRetrieval: {
    topK: number;
    minRelevance: number;
  };
  
  /** 动作规划参数 */
  actionPlanning: {
    maxActions: number;
    allowParallel: boolean;
  };
  
  /** 响应生成参数 */
  responseGeneration: {
    temperature: number;
    maxTokens: number;
    style: 'concise' | 'detailed' | 'balanced';
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 第四部分：核心循环
// ═══════════════════════════════════════════════════════════════════════

/**
 * 核心处理结果
 */
export interface ProcessResult {
  /** 生成的响应 */
  response: string;
  
  /** 更新后的用户状态 */
  userState: UserState;
  
  /** 更新后的世界状态 */
  worldState: WorldState;
  
  /** 处理详情 (用于调试和展示) */
  details: {
    intent: Intent;
    context: MemoryContext;
    actions: Action[];
    results: ActionResult[];
    duration: number;
  };
}

/**
 * 贾维斯核心系统接口
 */
export interface JarvisCore {
  /**
   * 处理用户消息
   * 
   * 这是系统的唯一入口
   */
  process(message: string): Promise<ProcessResult>;
  
  /**
   * 获取当前状态
   */
  getState(): {
    user: UserState;
    world: WorldState;
    policy: PolicyParameters;
  };
  
  /**
   * 提供反馈
   * 
   * 用于学习改进
   */
  provideFeedback(feedback: {
    interactionId: string;
    type: 'positive' | 'negative' | 'neutral';
    content?: string;
    rating?: number;
  }): Promise<void>;
  
  /**
   * 导出状态 (备份)
   */
  exportState(): Promise<string>;
  
  /**
   * 导入状态 (恢复)
   */
  importState(state: string): Promise<void>;
}
