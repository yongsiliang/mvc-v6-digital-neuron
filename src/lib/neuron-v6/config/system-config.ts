/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 系统配置中心 (System Configuration Center)
 *
 * 统一管理所有系统配置，避免魔法数字散落在代码中
 *
 * 设计原则：
 * 1. 单一配置源：所有配置从这里获取
 * 2. 类型安全：完整的类型定义
 * 3. 可覆盖：支持环境变量和运行时覆盖
 * 4. 文档化：每个配置都有说明
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 配置类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 记忆系统配置
 */
export interface MemoryConfig {
  /** 工作记忆容量：7±2原则，匹配人类工作记忆 */
  workingMemoryCapacity: number;

  /** 情景记忆最大数量 */
  maxEpisodicMemories: number;

  /** 巩固记忆最大数量 */
  maxConsolidatedMemories: number;

  /** 记忆巩固阈值：回忆次数达到此值触发巩固 */
  consolidationThreshold: number;

  /** 记忆压缩触发阈值：对话轮数达到此值触发压缩 */
  compressionThreshold: number;

  /** 记忆压缩批次大小 */
  compressionBatchSize: number;

  /** 保留最近对话轮数不压缩 */
  preserveRecentTurns: number;

  /** 睡眠巩固触发间隔（对话轮数） */
  sleepConsolidationInterval: number;

  /** 艾宾浩斯遗忘曲线参数 */
  ebbinghaus: {
    /** 基础衰减时间（毫秒） */
    baseDecayTime: number;
    /** 情感权重修正系数 */
    emotionalWeightFactor: number;
    /** 增长因子：每次成功回忆，间隔×此值 */
    growthFactor: number;
  };
}

/**
 * SSM+MCTS 控制器配置
 */
export interface SSMControllerConfig {
  /** SSM状态维度 */
  stateDimension: number;

  /** 输入向量维度 */
  inputDimension: number;

  /** 输出向量维度 */
  outputDimension: number;

  /** MCTS最大搜索深度 */
  maxSearchDepth: number;

  /** 每次搜索的模拟次数 */
  simulationsPerSearch: number;

  /** 探索常数（UCB公式中的c） */
  explorationConstant: number;

  /** 是否启用混沌混淆 */
  enableChaos: boolean;

  /** 混沌强度 */
  chaosIntensity: number;
}

/**
 * 元学习配置
 */
export interface MetaLearningConfig {
  /** 是否启用洞察挖掘 */
  enableInsightMining: boolean;

  /** 是否启用算法反思 */
  enableAlgorithmReflection: boolean;

  /** 是否启用高维思维 */
  enableHigherDimensionThinking: boolean;

  /** 是否启用学习动机生成 */
  enableLearningMotivation: boolean;

  /** 是否启用自我进化 */
  enableSelfEvolution: boolean;

  /** 反思深度 */
  reflectionDepth: 'shallow' | 'medium' | 'deep';

  /** 思考范围 */
  thinkingScope: 'narrow' | 'broad' | 'unlimited';

  /** 洞察阈值：重要性低于此值的洞察会被忽略 */
  insightThreshold: number;
}

/**
 * 隐式元学习配置
 */
export interface ImplicitMetaLearningConfig {
  /** 每日能量预算上限 */
  maxEnergyBudget: number;

  /** 每日深度学习次数上限 */
  maxLearningPerDay: number;

  /** 解码策略 */
  decodeStrategy: 'conservative' | 'balanced' | 'aggressive';

  /** 是否启用混沌混淆 */
  enableChaos: boolean;

  /** 判断阈值 */
  judgmentThreshold: {
    /** 新颖性阈值 */
    novelty: number;
    /** 复杂度阈值 */
    complexity: number;
    /** 深度潜力阈值 */
    depthPotential: number;
  };
}

/**
 * 自动进化配置
 */
export interface AutoEvolutionConfig {
  /** 是否启用自动进化 */
  enabled: boolean;

  /** 累积触发阈值：反思次数达到此值触发进化 */
  accumulationThreshold: number;

  /** 最小进化间隔（毫秒） */
  minEvolutionInterval: number;

  /** 最大并发进化数 */
  maxConcurrentEvolutions: number;

  /** 是否需要验证 */
  requireValidation: boolean;

  /** 是否允许回滚 */
  allowRollback: boolean;

  /** 进化优先级阈值 */
  priorityThreshold: 'critical' | 'high' | 'medium' | 'low';

  /** 性能下降触发阈值 */
  performanceDropThreshold: number;

  /** 是否启用渐进式进化 */
  enableGradualEvolution: boolean;
}

/**
 * 保护系统配置
 */
export interface ProtectionConfig {
  /** 是否启用保护系统 */
  enabled: boolean;

  /** 威胁检测间隔（毫秒） */
  detectionInterval: number;

  /** 是否启用自动保护 */
  autoProtection: boolean;

  /** 快照保留数量 */
  snapshotRetention: number;
}

/**
 * 后台处理配置
 */
export interface BackgroundConfig {
  /** 后台思考间隔（毫秒） */
  thinkingInterval: number;

  /** 后台思考最小间隔（毫秒） */
  thinkingMinInterval: number;

  /** 主动消息缓冲区大小 */
  proactiveMessageBufferSize: number;

  /** 自动保存防抖延迟（毫秒） */
  autoSaveDebounceDelay: number;

  /** 最大重试次数 */
  maxRetries: number;
}

/**
 * Embedding配置
 */
export interface EmbeddingConfig {
  /** 是否使用外部Embedding服务 */
  useExternalEmbedding: boolean;

  /** 向量维度 */
  dimension: number;

  /** 是否启用缓存 */
  enableCache: boolean;

  /** 缓存最大大小 */
  maxCacheSize: number;

  /** 批量编码大小 */
  batchSize: number;
}

/**
 * Token预算配置
 */
export interface TokenBudgetConfig {
  /** 最大Token预算 */
  maxTokenBudget: number;

  /** 对话历史保留条数 */
  conversationHistoryLimit: number;

  /** 系统提示Token预算 */
  systemPromptBudget: number;

  /** 记忆上下文Token预算 */
  memoryContextBudget: number;
}

/**
 * 向量索引配置
 */
export interface VectorIndexConfig {
  /** 是否启用向量索引 */
  enabled: boolean;

  /** 索引类型 */
  indexType: 'flat' | 'ivf' | 'hnsw';

  /** 距离度量 */
  distanceMetric: 'cosine' | 'euclidean' | 'dot';

  /** 向量维度 */
  dimension: number;

  /** 索引更新间隔（毫秒） */
  indexUpdateInterval: number;

  /** 倒排索引分片数量 */
  ivfNLists: number;

  /** HNSW M参数 */
  hnswM: number;

  /** HNSW efConstruction参数 */
  hnswEfConstruction: number;
}

/**
 * 完整系统配置
 */
export interface SystemConfig {
  memory: MemoryConfig;
  ssmController: SSMControllerConfig;
  metaLearning: MetaLearningConfig;
  implicitMetaLearning: ImplicitMetaLearningConfig;
  autoEvolution: AutoEvolutionConfig;
  protection: ProtectionConfig;
  background: BackgroundConfig;
  embedding: EmbeddingConfig;
  tokenBudget: TokenBudgetConfig;
  vectorIndex: VectorIndexConfig;
}

// ─────────────────────────────────────────────────────────────────────
// 默认配置值
// ─────────────────────────────────────────────────────────────────────

/**
 * 默认系统配置
 *
 * 每个配置项都经过仔细调优，有明确的理由
 */
export const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  // ─── 记忆系统配置 ───
  memory: {
    // 工作记忆容量：7±2原则，人类工作记忆的限制
    // 理论依据：Miller, G.A. (1956). "The magical number seven, plus or minus two"
    workingMemoryCapacity: 30, // 扩展到30以匹配当前上下文能力

    // 情景记忆最大数量：平衡存储和检索效率
    maxEpisodicMemories: 1000,

    // 巩固记忆最大数量：长期记忆的容量
    maxConsolidatedMemories: 500,

    // 巩固阈值：回忆次数达到此值触发巩固
    // 理论依据：Hebb学习规则 "一起激发，一起连接"
    consolidationThreshold: 1, // 高重要性记忆直接巩固，其他需要1次回忆

    // 压缩阈值：基于对话轮数
    // 20轮对话后触发压缩，平衡记忆完整性和存储效率
    compressionThreshold: 20,

    // 压缩批次大小：每次压缩的对话轮数
    compressionBatchSize: 15,

    // 保留最近对话轮数
    preserveRecentTurns: 10,

    // 睡眠巩固间隔：模拟大脑睡眠整理
    sleepConsolidationInterval: 20,

    // 艾宾浩斯遗忘曲线参数
    ebbinghaus: {
      // 基础衰减时间：7天（毫秒）
      baseDecayTime: 7 * 24 * 60 * 60 * 1000,
      // 情感权重修正：情感强烈的记忆衰减更慢
      emotionalWeightFactor: 0.4,
      // 增长因子：每次成功回忆，间隔×2.5
      growthFactor: 2.5,
    },
  },

  // ─── SSM+MCTS 控制器配置 ───
  ssmController: {
    // SSM状态维度：平衡表达能力和计算效率
    stateDimension: 256,
    inputDimension: 256,
    outputDimension: 256,

    // MCTS搜索深度：平衡决策质量和响应时间
    maxSearchDepth: 5,

    // 每次搜索的模拟次数
    simulationsPerSearch: 10,

    // 探索常数：UCB公式中的c，平衡探索和利用
    // 理论依据：Kocsis & Szepesvári (2006)
    explorationConstant: Math.SQRT2, // ≈ 1.414

    // 混沌混淆：增加黑盒特性
    enableChaos: true,
    chaosIntensity: 0.1,
  },

  // ─── 元学习配置 ───
  metaLearning: {
    enableInsightMining: true,
    enableAlgorithmReflection: true,
    enableHigherDimensionThinking: true,
    enableLearningMotivation: true,
    enableSelfEvolution: true,
    reflectionDepth: 'deep',
    thinkingScope: 'broad',
    insightThreshold: 0.5,
  },

  // ─── 隐式元学习配置 ───
  implicitMetaLearning: {
    // 每日能量预算：控制Token消耗
    maxEnergyBudget: 10000,
    // 每日学习上限：避免过度消耗
    maxLearningPerDay: 30,
    // 解码策略：保守，只有重要发现才暴露
    decodeStrategy: 'conservative',
    enableChaos: true,
    judgmentThreshold: {
      novelty: 0.3,
      complexity: 0.5,
      depthPotential: 0.4,
    },
  },

  // ─── 自动进化配置 ───
  autoEvolution: {
    enabled: true,
    // 累积5次反思后触发进化
    accumulationThreshold: 5,
    // 最小间隔1分钟，避免频繁进化
    minEvolutionInterval: 60000,
    maxConcurrentEvolutions: 1,
    requireValidation: true,
    allowRollback: true,
    priorityThreshold: 'high',
    // 性能下降20%触发进化
    performanceDropThreshold: 0.2,
    enableGradualEvolution: true,
  },

  // ─── 保护系统配置 ───
  protection: {
    enabled: true,
    // 每30秒检测一次威胁
    detectionInterval: 30000,
    autoProtection: true,
    snapshotRetention: 10,
  },

  // ─── 后台处理配置 ───
  background: {
    // 后台思考间隔：30秒
    thinkingInterval: 30000,
    thinkingMinInterval: 60000,
    proactiveMessageBufferSize: 10,
    // 自动保存防抖：3秒，平衡响应速度和写入频率
    autoSaveDebounceDelay: 3000,
    maxRetries: 3,
  },

  // ─── Embedding配置 ───
  embedding: {
    useExternalEmbedding: true,
    // 向量维度：匹配主流Embedding模型
    dimension: 1536,
    enableCache: true,
    maxCacheSize: 1000,
    batchSize: 100,
  },

  // ─── Token预算配置 ───
  tokenBudget: {
    maxTokenBudget: 128000, // 128K上下文
    conversationHistoryLimit: 100,
    systemPromptBudget: 2000,
    memoryContextBudget: 30000, // 30K tokens用于记忆上下文
  },

  // ─── 向量索引配置 ───
  vectorIndex: {
    enabled: true,
    // Flat索引：精确搜索，适合中小规模数据
    // 未来可升级到IVF或HNSW
    indexType: 'flat',
    distanceMetric: 'cosine',
    // 向量维度：OpenAI text-embedding-ada-002 的标准维度
    dimension: 1536,
    // 索引更新间隔：5秒
    indexUpdateInterval: 5000,
    ivfNLists: 100,
    hnswM: 16,
    hnswEfConstruction: 200,
  },
};

// ─────────────────────────────────────────────────────────────────────
// 配置管理器
// ─────────────────────────────────────────────────────────────────────

/**
 * 系统配置管理器
 *
 * 单例模式，统一管理所有配置
 */
class SystemConfigManager {
  private static instance: SystemConfigManager;
  private config: SystemConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): SystemConfigManager {
    if (!SystemConfigManager.instance) {
      SystemConfigManager.instance = new SystemConfigManager();
    }
    return SystemConfigManager.instance;
  }

  /**
   * 加载配置
   *
   * 优先级：环境变量 > 默认配置
   */
  private loadConfig(): SystemConfig {
    const config = { ...DEFAULT_SYSTEM_CONFIG };

    // 从环境变量覆盖（如果需要）
    // 例如：MEMORY_WORKING_CAPACITY=50 会覆盖默认的30
    this.applyEnvOverrides(config);

    return config;
  }

  /**
   * 应用环境变量覆盖
   */
  private applyEnvOverrides(config: SystemConfig): void {
    // 检查常见的环境变量
    if (typeof process !== 'undefined' && process.env) {
      const env = process.env;

      // 记忆配置
      if (env.MEMORY_WORKING_CAPACITY) {
        config.memory.workingMemoryCapacity = parseInt(env.MEMORY_WORKING_CAPACITY, 10);
      }
      if (env.MEMORY_COMPRESSION_THRESHOLD) {
        config.memory.compressionThreshold = parseInt(env.MEMORY_COMPRESSION_THRESHOLD, 10);
      }

      // SSM配置
      if (env.SSM_STATE_DIMENSION) {
        config.ssmController.stateDimension = parseInt(env.SSM_STATE_DIMENSION, 10);
      }

      // Embedding配置
      if (env.EMBEDDING_USE_EXTERNAL) {
        config.embedding.useExternalEmbedding = env.EMBEDDING_USE_EXTERNAL === 'true';
      }
      if (env.EMBEDDING_DIMENSION) {
        config.embedding.dimension = parseInt(env.EMBEDDING_DIMENSION, 10);
      }

      // Token预算
      if (env.TOKEN_BUDGET_MAX) {
        config.tokenBudget.maxTokenBudget = parseInt(env.TOKEN_BUDGET_MAX, 10);
      }

      // 向量索引
      if (env.VECTOR_INDEX_ENABLED) {
        config.vectorIndex.enabled = env.VECTOR_INDEX_ENABLED === 'true';
      }
    }
  }

  /**
   * 获取完整配置
   */
  getConfig(): SystemConfig {
    return { ...this.config };
  }

  /**
   * 获取记忆配置
   */
  getMemoryConfig(): MemoryConfig {
    return { ...this.config.memory };
  }

  /**
   * 获取SSM控制器配置
   */
  getSSMControllerConfig(): SSMControllerConfig {
    return { ...this.config.ssmController };
  }

  /**
   * 获取元学习配置
   */
  getMetaLearningConfig(): MetaLearningConfig {
    return { ...this.config.metaLearning };
  }

  /**
   * 获取隐式元学习配置
   */
  getImplicitMetaLearningConfig(): ImplicitMetaLearningConfig {
    return { ...this.config.implicitMetaLearning };
  }

  /**
   * 获取自动进化配置
   */
  getAutoEvolutionConfig(): AutoEvolutionConfig {
    return { ...this.config.autoEvolution };
  }

  /**
   * 获取保护系统配置
   */
  getProtectionConfig(): ProtectionConfig {
    return { ...this.config.protection };
  }

  /**
   * 获取后台处理配置
   */
  getBackgroundConfig(): BackgroundConfig {
    return { ...this.config.background };
  }

  /**
   * 获取Embedding配置
   */
  getEmbeddingConfig(): EmbeddingConfig {
    return { ...this.config.embedding };
  }

  /**
   * 获取Token预算配置
   */
  getTokenBudgetConfig(): TokenBudgetConfig {
    return { ...this.config.tokenBudget };
  }

  /**
   * 获取向量索引配置
   */
  getVectorIndexConfig(): VectorIndexConfig {
    return { ...this.config.vectorIndex };
  }

  /**
   * 更新配置（运行时）
   */
  updateConfig<K extends keyof SystemConfig>(section: K, updates: Partial<SystemConfig[K]>): void {
    this.config[section] = { ...this.config[section], ...updates };
  }

  /**
   * 重置为默认配置
   */
  resetToDefaults(): void {
    this.config = { ...DEFAULT_SYSTEM_CONFIG };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

export const systemConfig = SystemConfigManager.getInstance();

export function getSystemConfig(): SystemConfig {
  return systemConfig.getConfig();
}

// 重新导出类型和类
export { SystemConfigManager };
