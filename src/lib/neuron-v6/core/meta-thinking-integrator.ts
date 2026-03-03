/**
 * ═══════════════════════════════════════════════════════════════════════
 * 元思考集成器 (Meta-Thinking Integrator)
 * 
 * 将隐式MCTS和DE-RL集成到意识核心
 * 
 * 核心理念：
 * - 元思考在LLM外部实现
 * - 对LLM推理过程进行监控、规划、评估、修正
 * - 隐性黑盒特质：内部过程不可观察
 * 
 * 适配阶段：
 * - 阶段1：隐式MCTS（数字神经元1.0 → 贾维斯级）
 * - 阶段2：DE-RL元控制器（贾维斯级）
 * - 阶段3：NSIR + DNAS + 混沌调度（MOSS级）
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
  ImplicitMCTSController,
  createImplicitMCTSController,
  type MetaThinkingResult,
  type LLMInstruction,
  type ImplicitVector,
} from './implicit-mcts';

import {
  ImplicitStateStorage,
  createImplicitStateStorage,
  type ImplicitStateRecord,
} from './implicit-state-storage';

import {
  DERLController,
  createDERLController,
  type RewardSignal,
  type TaskContext,
  type PolicyGenome,
} from './de-rl-controller';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 元思考阶段
 */
export type MetaThinkingStage = 
  | 'implicit_mcts'   // 阶段1：隐式MCTS
  | 'de_rl'           // 阶段2：DE-RL元控制器
  | 'moss';           // 阶段3：MOSS级全能力

/**
 * 元思考配置
 */
export interface MetaThinkingConfig {
  /** 当前阶段 */
  stage: MetaThinkingStage;
  
  /** 向量维度 */
  vectorDimension: number;
  
  /** 是否启用混沌混淆 */
  enableChaos: boolean;
  
  /** 混沌强度 */
  chaosIntensity: number;
  
  /** 是否启用DE-RL优化 */
  enableDERL: boolean;
  
  /** Token预算基数 */
  tokenBudgetBase: number;
  
  /** 是否启用状态持久化 */
  enablePersistence: boolean;
}

const DEFAULT_META_CONFIG: MetaThinkingConfig = {
  stage: 'implicit_mcts',
  vectorDimension: 256,
  enableChaos: true,
  chaosIntensity: 0.1,
  enableDERL: true,
  tokenBudgetBase: 500,
  enablePersistence: true,
};

/**
 * 元思考输出
 */
export interface MetaThinkingOutput {
  /** 是否需要调用LLM */
  needsLLM: boolean;
  
  /** LLM指令列表 */
  instructions: LLMInstruction[];
  
  /** 总Token预算 */
  totalTokenBudget: number;
  
  /** 置信度 */
  confidence: number;
  
  /** 当前阶段 */
  stage: MetaThinkingStage;
  
  /** 决策耗时（ms） */
  decisionTime: number;
  
  /** 隐式状态ID（用于反馈） */
  implicitStateId?: string;
}

/**
 * 反馈输入
 */
export interface MetaThinkingFeedback {
  /** 是否成功 */
  success: boolean;
  
  /** 质量评分（0-1） */
  quality: number;
  
  /** 实际使用的Token */
  tokensUsed: number;
  
  /** 执行时间（ms） */
  executionTime: number;
  
  /** 用户满意度（可选） */
  userSatisfaction?: number;
}

// ─────────────────────────────────────────────────────────────────────
// 元思考集成器
// ─────────────────────────────────────────────────────────────────────

/**
 * 元思考集成器
 * 
 * 核心功能：
 * 1. 规划：拆分任务为LLM可执行的子步骤
 * 2. 调度：决定何时调用LLM、何时调用工具、何时反思
 * 3. 评估：判断LLM输出是否符合目标
 * 4. 记忆：更新任务的隐式状态
 * 
 * 黑盒特性：
 * - 状态隐式化：用高维向量存储
 * - 策略动态化：算法随任务实时演化
 * - 计算不可追溯：无显式IF-THEN逻辑
 */
export class MetaThinkingIntegrator {
  private config: MetaThinkingConfig;
  
  // 阶段1：隐式MCTS
  private mctsController: ImplicitMCTSController;
  
  // 隐式状态存储
  private stateStorage: ImplicitStateStorage;
  
  // 阶段2：DE-RL元控制器
  private derlController: DERLController | null = null;
  
  // 历史向量（用于构建上下文）
  private historyVectors: ImplicitVector[];
  
  // 当前状态ID
  private currentStateId: string | null = null;
  
  // 统计
  private stats: {
    totalDecisions: number;
    avgConfidence: number;
    avgDecisionTime: number;
    totalTokensSaved: number;
  };
  
  constructor(config?: Partial<MetaThinkingConfig>) {
    this.config = { ...DEFAULT_META_CONFIG, ...config };
    
    // 初始化隐式MCTS
    this.mctsController = createImplicitMCTSController({
      vectorDimension: this.config.vectorDimension,
      chaosIntensity: this.config.chaosIntensity,
    });
    
    // 初始化状态存储
    this.stateStorage = createImplicitStateStorage({
      vectorDimension: this.config.vectorDimension,
    });
    
    // 如果启用DE-RL，初始化DE-RL控制器
    if (this.config.enableDERL) {
      this.derlController = createDERLController({
        vectorDimension: this.config.vectorDimension,
        chaosIntensity: this.config.chaosIntensity,
      });
    }
    
    this.historyVectors = [];
    
    this.stats = {
      totalDecisions: 0,
      avgConfidence: 0,
      avgDecisionTime: 0,
      totalTokensSaved: 0,
    };
  }
  
  /**
   * ══════════════════════════════════════════════════════════════════
   * 主接口：思考
   * 
   * 输入：用户输入 + 上下文
   * 输出：元思考结果（LLM指令）
   * 
   * 注意：内部过程完全不可观察！
   * ══════════════════════════════════════════════════════════════════
   */
  async think(
    userInput: string,
    context?: {
      conversationHistory?: Array<{ role: string; content: string }>;
      taskType?: TaskContext['type'];
      complexity?: number;
    }
  ): Promise<MetaThinkingOutput> {
    const startTime = Date.now();
    
    // ============================================
    // 黑盒内部 - 以下是不可观察的处理过程
    // ============================================
    
    // 阶段选择
    let result: MetaThinkingResult;
    
    if (this.config.stage === 'de_rl' && this.derlController) {
      // 阶段2：DE-RL元控制器
      result = this.derlController.decide({
        description: userInput,
        type: context?.taskType || 'reasoning',
        complexity: context?.complexity || 0.5,
        historyVectors: this.historyVectors.slice(-5),
      });
    } else {
      // 阶段1：隐式MCTS
      result = await this.mctsController.think(userInput);
    }
    
    // 存储隐式状态
    if (this.config.enablePersistence) {
      this.currentStateId = this.stateStorage.store(result.implicitState, {
        type: 'task',
        priority: result.confidence > 0.7 ? 1 : 0,
      });
    }
    
    // 更新历史
    this.historyVectors.push(result.implicitState);
    if (this.historyVectors.length > 20) {
      this.historyVectors.shift();
    }
    
    // 更新统计
    const decisionTime = Date.now() - startTime;
    this.updateStats(result.confidence, decisionTime);
    
    // ============================================
    // 黑盒输出 - 只有这个是可见的
    // ============================================
    
    return {
      needsLLM: result.needsLLM,
      instructions: result.instructions,
      totalTokenBudget: result.totalTokenBudget,
      confidence: result.confidence,
      stage: this.config.stage,
      decisionTime,
      implicitStateId: this.currentStateId || undefined,
    };
  }
  
  /**
   * 反馈学习
   * 
   * 根据执行结果更新内部策略
   * 注意：学习过程在内部完成，无梯度路径
   */
  feedback(feedback: MetaThinkingFeedback): void {
    // 计算Token节省
    const tokensSaved = Math.max(0, 1000 - feedback.tokensUsed);
    this.stats.totalTokensSaved += tokensSaved;
    
    // 更新隐式MCTS
    this.mctsController.feedback({
      success: feedback.success,
      quality: feedback.quality,
      tokenUsed: feedback.tokensUsed,
    });
    
    // 如果启用DE-RL，更新DE-RL
    if (this.derlController) {
      const reward: RewardSignal = {
        taskCompletion: feedback.success ? 1 : 0,
        efficiency: 1 - (feedback.executionTime / 10000),
        userSatisfaction: feedback.userSatisfaction || 0.5,
        tokenSavings: tokensSaved / 1000,
        timestamp: Date.now(),
      };
      
      this.derlController.learn(reward);
    }
    
    // 更新状态价值
    if (this.currentStateId) {
      const deltaValue = feedback.success ? 0.1 : -0.1;
      this.stateStorage.updateValue(this.currentStateId, deltaValue * feedback.quality);
    }
  }
  
  /**
   * 检索相关状态
   * 
   * 用于构建上下文
   */
  retrieveRelevantStates(queryVector: ImplicitVector, topK: number = 5): ImplicitStateRecord[] {
    return this.stateStorage.querySimilar(queryVector, topK);
  }
  
  /**
   * 获取当前阶段
   */
  getStage(): MetaThinkingStage {
    return this.config.stage;
  }
  
  /**
   * 升级阶段
   * 
   * 从隐式MCTS升级到DE-RL
   */
  upgradeStage(newStage: MetaThinkingStage): void {
    this.config.stage = newStage;
    
    if (newStage === 'de_rl' && !this.derlController) {
      this.derlController = createDERLController({
        vectorDimension: this.config.vectorDimension,
        chaosIntensity: this.config.chaosIntensity,
      });
    }
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    stage: MetaThinkingStage;
    totalDecisions: number;
    avgConfidence: number;
    avgDecisionTime: number;
    totalTokensSaved: number;
    stateStorageStats: ReturnType<ImplicitStateStorage['getStats']>;
    derlStats?: ReturnType<DERLController['getStats']>;
  } {
    return {
      stage: this.config.stage,
      totalDecisions: this.stats.totalDecisions,
      avgConfidence: this.stats.avgConfidence,
      avgDecisionTime: this.stats.avgDecisionTime,
      totalTokensSaved: this.stats.totalTokensSaved,
      stateStorageStats: this.stateStorage.getStats(),
      derlStats: this.derlController?.getStats(),
    };
  }
  
  /**
   * 导出状态
   * 
   * 用于持久化
   */
  exportState(): ArrayBuffer {
    return this.stateStorage.exportBinary();
  }
  
  /**
   * 导入状态
   * 
   * 从持久化恢复
   */
  importState(buffer: ArrayBuffer): void {
    this.stateStorage.importBinary(buffer);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 内部方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 更新统计
   */
  private updateStats(confidence: number, decisionTime: number): void {
    const n = this.stats.totalDecisions;
    
    this.stats.avgConfidence = 
      (this.stats.avgConfidence * n + confidence) / (n + 1);
    
    this.stats.avgDecisionTime = 
      (this.stats.avgDecisionTime * n + decisionTime) / (n + 1);
    
    this.stats.totalDecisions++;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建元思考集成器
 */
export function createMetaThinkingIntegrator(
  config?: Partial<MetaThinkingConfig>
): MetaThinkingIntegrator {
  return new MetaThinkingIntegrator(config);
}

/**
 * 创建默认的元思考集成器（阶段1：隐式MCTS）
 */
export function createDefaultMetaThinkingIntegrator(): MetaThinkingIntegrator {
  return createMetaThinkingIntegrator({
    stage: 'implicit_mcts',
    enableDERL: true,
  });
}

/**
 * 创建贾维斯级元思考集成器（阶段2：DE-RL）
 */
export function createJarvisMetaThinkingIntegrator(): MetaThinkingIntegrator {
  return createMetaThinkingIntegrator({
    stage: 'de_rl',
    enableDERL: true,
    chaosIntensity: 0.15,
  });
}

/**
 * 创建MOSS级元思考集成器（阶段3）
 */
export function createMossMetaThinkingIntegrator(): MetaThinkingIntegrator {
  return createMetaThinkingIntegrator({
    stage: 'moss',
    enableDERL: true,
    chaosIntensity: 0.2,
    tokenBudgetBase: 800,
  });
}
