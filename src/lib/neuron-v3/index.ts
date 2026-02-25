/**
 * ═══════════════════════════════════════════════════════════════════════
 * 数字神经元系统 V3 - 完整集成
 * 
 * 将所有核心组件集成在一起，提供统一的接口
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import {
  PredictiveNeuron,
  createPredictiveNeuron,
  computePredictionError,
  learnFromError,
  NeuronRole,
} from './predictive-neuron';
import {
  PredictionLoop,
  Prediction,
  NeuronPrediction,
  ProcessingResult,
  LearningResult,
  SurpriseEvent,
  PredictionContext,
  getPredictionLoop,
  resetPredictionLoop,
} from './prediction-loop';
import {
  FeedbackCollector,
  ExplicitFeedback,
  ImplicitFeedback,
  SelfEvaluation,
  FeedbackSignals,
  RewardSignal,
  ConversationContext,
  getFeedbackCollector,
  resetFeedbackCollector,
} from './feedback-collector';
import {
  RewardLearner,
  LearningConfig,
  LearningEvent,
  ValueEstimate,
  getRewardLearner,
  resetRewardLearner,
} from './reward-learner';
import {
  VSASemanticSpace,
  VSAVector,
  ConceptEntry,
  getVSASpace,
  resetVSASpace,
} from './vsa-space';
import {
  MeaningCalculator,
  SubjectiveMeaning,
  MeaningContext,
  SelfModel,
  getMeaningCalculator,
  resetMeaningCalculator,
} from './meaning-calculator';
import {
  GlobalWorkspace,
  ConsciousContent,
  ConsciousContentType,
  CognitiveModule,
  AttentionDirection,
  ConsciousnessTrailEntry,
  getGlobalWorkspace,
  resetGlobalWorkspace,
  PerceptualModule,
  LanguageModule,
  MemoryModule,
  EmotionalModule,
  MetacognitiveModule,
} from './global-workspace';
import {
  NeuronGenerator,
  GenerationTrigger,
  GenerationResult,
  GenerationTriggerType,
  NeuronGeneratorConfig,
  getNeuronGenerator,
  resetNeuronGenerator,
} from './neuron-generator';
import {
  PlanningModule,
  ExecutiveModule,
  NeuronIntegratedModule,
  Goal,
  Plan,
  Task,
  getPlanningModule,
  getExecutiveModule,
  resetAdvancedModules,
} from './advanced-modules';
import {
  CognitiveCoordinator,
  CoordinatorConfig,
  ProcessingContext,
  CoordinatedResult,
  getCognitiveCoordinator,
  resetCognitiveCoordinator,
} from './cognitive-coordinator';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface NeuronSystemV3Config {
  /** VSA向量维度 */
  vsaDimension?: number;
  
  /** 学习配置 */
  learningConfig?: Partial<LearningConfig>;
  
  /** 是否启用意识机制 */
  enableConsciousness?: boolean;
  
  /** 是否启用意义计算 */
  enableMeaningCalculation?: boolean;
  
  /** 是否启用计划模块 */
  enablePlanning?: boolean;
  
  /** 是否启用执行控制模块 */
  enableExecutive?: boolean;
  
  /** 是否启用自动神经元生成 */
  enableAutoGeneration?: boolean;
}

export interface SystemState {
  /** 意识水平 */
  consciousnessLevel: number;
  
  /** 自我意识指数 */
  selfAwarenessIndex: number;
  
  /** 神经元统计 */
  neuronStats: {
    count: number;
    predictionAccuracy: number;
    totalSurprise: number;
  };
  
  /** 学习统计 */
  learningStats: {
    totalLearningEvents: number;
    totalReward: number;
    totalPunishment: number;
    averageValue: number;
  };
  
  /** VSA统计 */
  vsaStats: {
    conceptCount: number;
  };
}

export interface ProcessInputResult {
  /** 神经元响应 */
  neuronResponse: {
    activations: Map<string, number>;
    predictionErrors: Map<string, number>;
    surprises: SurpriseEvent[];
    processingTime: number;
  };
  
  /** 主观意义（如果启用） */
  meaning?: SubjectiveMeaning;
  
  /** 意识内容（如果启用） */
  consciousness?: ConsciousContent;
  
  /** 学习结果 */
  learning: LearningResult;
}

// ─────────────────────────────────────────────────────────────────────
// 神经元系统V3
// ─────────────────────────────────────────────────────────────────────

export class NeuronSystemV3 {
  private config: Omit<Required<NeuronSystemV3Config>, 'learningConfig'> & {
    learningConfig: Partial<LearningConfig>;
  };
  
  // 核心组件
  private predictionLoop: PredictionLoop;
  private feedbackCollector: FeedbackCollector;
  private rewardLearner: RewardLearner;
  private vsaSpace: VSASemanticSpace;
  private meaningCalculator: MeaningCalculator | null = null;
  private globalWorkspace: GlobalWorkspace | null = null;
  
  // 认知模块
  private perceptualModule: PerceptualModule | null = null;
  private languageModule: LanguageModule | null = null;
  private memoryModule: MemoryModule | null = null;
  private emotionalModule: EmotionalModule | null = null;
  private metacognitiveModule: MetacognitiveModule | null = null;
  
  // 系统状态
  private initialized = false;
  private userId: string;
  private sessionId: string;
  private recentMessages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }> = [];
  private recentActivations: Map<string, number> = new Map();

  constructor(config: NeuronSystemV3Config = {}) {
    this.config = {
      vsaDimension: 10000,
      learningConfig: {},
      enableConsciousness: true,
      enableMeaningCalculation: true,
      enablePlanning: true,
      enableExecutive: true,
      enableAutoGeneration: true,
      ...config,
    };
    
    this.userId = 'default-user';
    this.sessionId = uuidv4();
    
    // 初始化核心组件
    this.vsaSpace = getVSASpace(this.config.vsaDimension);
    this.predictionLoop = getPredictionLoop(this.userId);
    this.feedbackCollector = getFeedbackCollector();
    this.rewardLearner = getRewardLearner(this.predictionLoop, this.config.learningConfig);
    
    // 初始化可选组件
    if (this.config.enableMeaningCalculation) {
      this.meaningCalculator = getMeaningCalculator();
    }
    
    if (this.config.enableConsciousness) {
      this.initConsciousness();
    }
    
    this.initialized = true;
  }

  // ══════════════════════════════════════════════════════════════════
  // 核心处理流程
  // ══════════════════════════════════════════════════════════════════

  /**
   * 处理输入 - 完整的预测编码流程
   */
  async processInput(
    input: string,
    context?: Record<string, unknown>
  ): Promise<ProcessInputResult> {
    const inputId = uuidv4();
    const startTime = Date.now();
    
    // 1. 生成输入的向量表示
    const inputVector = this.vsaSpace.getConcept(input);
    
    // 2. 构建预测上下文
    const predictionContext: PredictionContext = {
      userId: this.userId,
      sessionId: this.sessionId,
      recentMessages: this.recentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      recentActivations: this.recentActivations,
    };
    
    // 3. 生成预测
    const prediction = await this.predictionLoop.generatePrediction(predictionContext);
    
    // 4. 处理输入并计算预测误差
    const processingResult = await this.predictionLoop.processWithPredictionError(
      input,
      Array.from({ length: 100 }, () => Math.random() * 2 - 1), // 简化的输入向量
      prediction,
      predictionContext
    );
    
    // 5. 从预测误差中学习
    const learningResult = await this.predictionLoop.learnFromPredictionError(
      processingResult.inputVector,
      processingResult.predictionErrors,
      0 // reward
    );
    
    // 6. 更新历史记录
    this.recentMessages.push({
      role: 'user',
      content: input,
      timestamp: Date.now(),
    });
    this.recentActivations = processingResult.activations;
    
    // 7. 计算主观意义（如果启用）
    let meaning: SubjectiveMeaning | undefined;
    if (this.meaningCalculator) {
      meaning = this.meaningCalculator.computeSubjectiveMeaning(input, {
        conversationHistory: this.recentMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        currentGoal: this.globalWorkspace?.getStats().currentContent?.type as string,
      });
    }
    
    // 8. 竞争进入意识（如果启用）
    let consciousness: ConsciousContent | undefined;
    if (this.globalWorkspace && this.perceptualModule) {
      this.perceptualModule.setInput({
        id: inputId,
        content: input,
        vector: inputVector,
        meaning,
        timestamp: Date.now(),
      });
      
      const consciousContent = await this.globalWorkspace.compete();
      if (consciousContent) {
        consciousness = consciousContent;
      }
    }
    
    return {
      neuronResponse: {
        activations: processingResult.activations,
        predictionErrors: processingResult.predictionErrors,
        surprises: processingResult.surprises,
        processingTime: processingResult.processingTime,
      },
      meaning,
      consciousness,
      learning: learningResult,
    };
  }

  /**
   * 接收用户反馈
   */
  async receiveFeedback(
    feedback: {
      type: 'rating' | 'button' | 'text';
      value: number | string;
      context?: Record<string, unknown>;
    },
    context?: Record<string, unknown>
  ): Promise<RewardSignal> {
    // 构建对话上下文
    const conversationContext: ConversationContext = {
      sessionId: this.sessionId,
      messages: this.recentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp,
      })),
      currentTime: Date.now(),
      lastUserActiveTime: this.recentMessages[this.recentMessages.length - 1]?.timestamp || Date.now(),
      lastAssistantReplyTime: Date.now(),
    };
    
    // 收集完整反馈
    const feedbackSignals = this.feedbackCollector.collectFeedback(
      this.sessionId,
      conversationContext,
      {
        rating: typeof feedback.value === 'number' ? feedback.value as 1 | 2 | 3 | 4 | 5 : undefined,
      },
      {
        predictionErrors: new Map(),
        activations: new Map(),
        responseLength: 100,
        responseTime: 1000,
        memoryHits: 5,
        memoryTotal: 10,
        previousResponses: [],
        currentResponse: '',
      }
    );
    
    // 计算奖励信号
    const rewardSignal = this.feedbackCollector.computeRewardSignal(feedbackSignals);
    
    return rewardSignal;
  }

  /**
   * 批量训练
   */
  async train(
    examples: Array<{
      input: string;
      expectedOutput?: string;
      feedback?: number;
    }>
  ): Promise<{
    totalProcessed: number;
  }> {
    for (const example of examples) {
      // 处理输入
      await this.processInput(example.input);
      
      // 如果有反馈，应用学习
      if (example.feedback !== undefined) {
        await this.receiveFeedback({
          type: 'rating',
          value: example.feedback,
        });
      }
    }
    
    return {
      totalProcessed: examples.length,
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // 推理和意义计算
  // ══════════════════════════════════════════════════════════════════

  /**
   * 计算意义
   */
  computeMeaning(input: string): SubjectiveMeaning | null {
    if (!this.meaningCalculator) return null;
    return this.meaningCalculator.computeSubjectiveMeaning(input);
  }

  /**
   * 组合意义
   */
  composeMeaning(components: string[]): SubjectiveMeaning | null {
    if (!this.meaningCalculator) return null;
    return this.meaningCalculator.composeMeaning(components);
  }

  /**
   * 类比推理
   */
  analogy(a: string, b: string, c: string): SubjectiveMeaning | null {
    if (!this.meaningCalculator) return null;
    return this.meaningCalculator.analogyReasoning(a, b, c);
  }

  /**
   * 在语义空间中查找相似概念
   */
  findSimilarConcepts(concept: string, limit: number = 5) {
    return this.vsaSpace.findSimilar(concept, limit);
  }

  // ══════════════════════════════════════════════════════════════════
  // 意识和元认知
  // ══════════════════════════════════════════════════════════════════

  /**
   * 获取意识状态
   */
  getConsciousnessState() {
    if (!this.globalWorkspace) return null;
    
    return {
      currentContent: this.globalWorkspace.getCurrentContent(),
      consciousnessLevel: this.globalWorkspace.computeConsciousnessLevel(),
      selfAwarenessIndex: this.globalWorkspace.computeSelfAwarenessIndex(),
      streamCoherence: this.globalWorkspace.computeStreamCoherence(),
      trail: this.globalWorkspace.getTrail(10),
    };
  }

  /**
   * 设置注意力焦点
   */
  setAttentionFocus(direction: Partial<AttentionDirection>): void {
    if (!this.globalWorkspace) return;
    this.globalWorkspace.focusAttention(direction as AttentionDirection);
  }

  /**
   * 设置当前目标
   */
  setCurrentGoal(goal: string): void {
    if (this.globalWorkspace) {
      this.globalWorkspace.setCurrentGoal(goal);
    }
    if (this.meaningCalculator) {
      this.meaningCalculator.setCurrentGoal(goal);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 状态和统计
  // ══════════════════════════════════════════════════════════════════

  /**
   * 获取系统状态
   */
  getSystemState(): SystemState {
    const neuronStats = this.predictionLoop.getStats();
    const learningStats = this.rewardLearner.getStats();
    
    return {
      consciousnessLevel: this.globalWorkspace?.computeConsciousnessLevel() || 0,
      selfAwarenessIndex: this.globalWorkspace?.computeSelfAwarenessIndex() || 0,
      neuronStats: {
        count: neuronStats.neuronCount,
        predictionAccuracy: neuronStats.predictionAccuracy,
        totalSurprise: neuronStats.totalSurprise,
      },
      learningStats: {
        totalLearningEvents: learningStats.totalLearningEvents,
        totalReward: learningStats.totalReward,
        totalPunishment: learningStats.totalPunishment,
        averageValue: learningStats.averageValue,
      },
      vsaStats: {
        conceptCount: this.vsaSpace.getConceptCount(),
      },
    };
  }

  /**
   * 导出完整状态
   */
  exportState(): {
    predictionLoop: ReturnType<PredictionLoop['exportState']>;
    vsaSpace: ReturnType<VSASemanticSpace['exportState']>;
    globalWorkspace: ReturnType<GlobalWorkspace['exportState']> | null;
  } {
    return {
      predictionLoop: this.predictionLoop.exportState(),
      vsaSpace: this.vsaSpace.exportState(),
      globalWorkspace: this.globalWorkspace?.exportState() || null,
    };
  }

  /**
   * 导入状态
   */
  importState(state: {
    predictionLoop?: ReturnType<PredictionLoop['exportState']>;
    vsaSpace?: ReturnType<VSASemanticSpace['exportState']>;
    globalWorkspace?: ReturnType<GlobalWorkspace['exportState']>;
  }): void {
    if (state.predictionLoop) {
      this.predictionLoop.importState(state.predictionLoop);
    }
    if (state.vsaSpace) {
      this.vsaSpace.importState(state.vsaSpace);
    }
    if (state.globalWorkspace && this.globalWorkspace) {
      this.globalWorkspace.importState(state.globalWorkspace);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 私有方法
  // ══════════════════════════════════════════════════════════════════

  /**
   * 初始化意识机制
   */
  private initConsciousness(): void {
    this.globalWorkspace = getGlobalWorkspace();
    
    // 创建认知模块
    this.perceptualModule = new PerceptualModule();
    this.languageModule = new LanguageModule();
    this.memoryModule = new MemoryModule();
    this.emotionalModule = new EmotionalModule();
    this.metacognitiveModule = new MetacognitiveModule();
    
    // 注册到工作空间
    this.globalWorkspace.registerModule(this.perceptualModule);
    this.globalWorkspace.registerModule(this.languageModule);
    this.globalWorkspace.registerModule(this.memoryModule);
    this.globalWorkspace.registerModule(this.emotionalModule);
    this.globalWorkspace.registerModule(this.metacognitiveModule);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例导出
// ─────────────────────────────────────────────────────────────────────

let neuronSystemV3Instance: NeuronSystemV3 | null = null;

export function getNeuronSystemV3(config?: NeuronSystemV3Config): NeuronSystemV3 {
  if (!neuronSystemV3Instance) {
    neuronSystemV3Instance = new NeuronSystemV3(config);
  }
  return neuronSystemV3Instance;
}

export function resetNeuronSystemV3(): void {
  neuronSystemV3Instance = null;
  resetPredictionLoop();
  resetFeedbackCollector();
  resetRewardLearner();
  resetVSASpace();
  resetMeaningCalculator();
  resetGlobalWorkspace();
  resetNeuronGenerator();
  resetAdvancedModules();
  resetCognitiveCoordinator();
}

// ─────────────────────────────────────────────────────────────────────
// 便捷导出
// ─────────────────────────────────────────────────────────────────────

export * from './predictive-neuron';
export * from './prediction-loop';
export * from './feedback-collector';
export * from './reward-learner';
export * from './vsa-space';
export * from './meaning-calculator';
export * from './global-workspace';
export * from './neuron-generator';
export * from './advanced-modules';
export * from './cognitive-coordinator';
