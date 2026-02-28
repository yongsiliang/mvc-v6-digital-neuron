/**
 * ═══════════════════════════════════════════════════════════════════════
 * 信息结构场 - 类型定义
 * 
 * 核心思想：
 * - 信息结构的变化 = 神经递质的传输
 * - 感受器是隐性黑盒子
 * - LLM 变换 = 神经传递
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 信息结构
// ─────────────────────────────────────────────────────────────────────

/**
 * 信息结构
 * 
 * 不是抽象的脉冲，而是有意义的信息形态
 * 在感受器之间流动、变换
 */
export interface InformationStructure {
  /** 唯一标识 */
  id: string;
  
  /** 内容（可以是文本、JSON、描述等） */
  content: string;
  
  /** 向量表示（可选，用于相似度计算） */
  embedding?: number[];
  
  /** 信息类型 */
  type: InformationType;
  
  /** 强度/重要性 (0-1) */
  intensity: number;
  
  /** 元数据 */
  metadata: {
    source: string;          // 来源感受器
    createdAt: number;       // 创建时间
    modifiedAt: number;      // 修改时间
    transformations: string[]; // 经历的变换
    [key: string]: unknown;
  };
}

/**
 * 信息类型
 */
export type InformationType = 
  | 'perception'    // 感知信息（来自外部）
  | 'thought'       // 思维信息（内部生成）
  | 'memory'        // 记忆信息
  | 'emotion'       // 情感信息
  | 'intention'     // 意图信息
  | 'knowledge'     // 知识信息
  | 'state'         // 状态信息
  | 'response';     // 响应信息

/**
 * 信息结构变换
 * 
 * 类似神经递质的化学修饰
 * 改变信息结构的形态
 */
export interface InformationTransformation {
  /** 变换类型 */
  type: TransformationType;
  
  /** 变换描述（供 LLM 理解） */
  description: string;
  
  /** 变换参数 */
  params?: Record<string, unknown>;
  
  /** 变换结果 */
  result?: InformationStructure;
}

/**
 * 变换类型
 */
export type TransformationType = 
  | 'encode'        // 编码：外部 → 内部
  | 'decode'        // 解码：内部 → 外部
  | 'attend'        // 注意：选择性增强
  | 'filter'        // 过滤：去除噪声
  | 'integrate'     // 整合：合并多个信息
  | 'transform'     // 变换：改变形态
  | 'associate'     // 联想：建立关联
  | 'reflect';      // 反思：元认知

// ─────────────────────────────────────────────────────────────────────
// 感受器（隐性黑盒子）
// ─────────────────────────────────────────────────────────────────────

/**
 * 感受器类型
 * 
 * 接收信息结构，产生效果
 * 内部如何工作 = 黑盒，由 LLM 隐性实现
 */
export type ReceptorType = 
  | 'perception'    // 感知感受器：接收外部信息
  | 'state'         // 状态感受器：感受系统状态
  | 'memory'        // 记忆感受器：感受/存取记忆
  | 'emotion'       // 情感感受器：感受/产生情感
  | 'thought'       // 思维感受器：处理思维
  | 'intention'     // 意图感受器：产生意图
  | 'expression';   // 表达感受器：产生输出

/**
 * 感受器状态
 */
export interface ReceptorState {
  /** 感受器 ID */
  id: string;
  
  /** 感受器类型 */
  type: ReceptorType;
  
  /** 当前活跃度 (0-1) */
  activation: number;
  
  /** 接收的信息队列 */
  inputQueue: InformationStructure[];
  
  /** 输出的信息 */
  output: InformationStructure | null;
  
  /** 内部状态（黑盒，我们不知道具体内容） */
  internalState: Record<string, unknown>;
  
  /** 最后激活时间 */
  lastActivation: number;
}

/**
 * 感受器配置
 */
export interface ReceptorConfig {
  /** 感受器类型 */
  type: ReceptorType;
  
  /** 感受器名称 */
  name: string;
  
  /** 接受的信息类型 */
  acceptsInformation: InformationType[];
  
  /** 产生的信息类型 */
  producesInformation: InformationType[];
  
  /** 灵敏度（多强的信息才能激活） */
  sensitivity: number;
  
  /** 反应时间（模拟延迟） */
  reactionDelay: number;
  
  /** 最大队列长度 */
  maxQueueLength: number;
}

// ─────────────────────────────────────────────────────────────────────
// 神经递质传输（信息传递）
// ─────────────────────────────────────────────────────────────────────

/**
 * 传输通道
 * 
 * 信息结构在感受器之间传递的路径
 */
export interface TransmissionChannel {
  /** 通道 ID */
  id: string;
  
  /** 源感受器 */
  source: string;
  
  /** 目标感受器 */
  target: string;
  
  /** 传输强度 (0-1) */
  strength: number;
  
  /** 变换规则（LLM 如何变换信息） */
  transformation: InformationTransformation;
  
  /** 使用次数 */
  usageCount: number;
  
  /** 最后传输时间 */
  lastTransmission: number;
}

/**
 * 传输结果
 */
export interface TransmissionResult {
  /** 是否成功 */
  success: boolean;
  
  /** 传输前的信息 */
  original: InformationStructure;
  
  /** 传输后的信息（可能被变换） */
  transformed: InformationStructure;
  
  /** 传输耗时 */
  duration: number;
  
  /** 错误信息（如果失败） */
  error?: string;
}

// ─────────────────────────────────────────────────────────────────────
// 信息场
// ─────────────────────────────────────────────────────────────────────

/**
 * 信息场状态
 */
export interface InformationFieldState {
  /** 所有感受器 */
  receptors: Map<string, ReceptorState>;
  
  /** 所有传输通道 */
  channels: Map<string, TransmissionChannel>;
  
  /** 当前活跃的信息结构 */
  activeInformation: InformationStructure[];
  
  /** 信息历史 */
  informationHistory: InformationStructure[];
  
  /** 场创建时间 */
  createdAt: number;
  
  /** 总传输次数 */
  totalTransmissions: number;
}

/**
 * 信息场配置
 */
export interface InformationFieldConfig {
  /** 最大活跃信息数 */
  maxActiveInformation: number;
  
  /** 历史保留数量 */
  historyRetention: number;
  
  /** 信息衰减率 */
  informationDecayRate: number;
  
  /** 通道强化率 */
  channelStrengthenRate: number;
  
  /** 通道衰减率 */
  channelDecayRate: number;
}

/**
 * 默认配置
 */
export const DEFAULT_FIELD_CONFIG: InformationFieldConfig = {
  maxActiveInformation: 100,
  historyRetention: 1000,
  informationDecayRate: 0.01,
  channelStrengthenRate: 0.1,
  channelDecayRate: 0.001
};
