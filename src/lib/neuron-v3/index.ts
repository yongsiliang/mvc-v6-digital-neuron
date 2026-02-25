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
import {
  BackgroundProcessor,
  BackgroundResult,
  IntuitionSignal,
  ReadinessState,
  BackgroundProcessingConfig,
  getBackgroundProcessor,
  resetBackgroundProcessor,
} from './background-processing';
import {
  getNeuronV3Persistence,
  NeuronData,
  ConceptData,
  LearningStatsData,
  SelfModelData,
  RecentMessageData,
  resetPersistence,
} from './persistence';

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
  
  /** 是否启用后台处理（系统1：快速、无意识） */
  enableBackgroundProcessing?: boolean;
  
  /** 后台处理配置 */
  backgroundConfig?: Partial<BackgroundProcessingConfig>;
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
  
  /** 直觉信号（系统1的输出，如果启用） */
  intuition?: IntuitionSignal;
  
  /** 准备状态（如果启用） */
  readiness?: ReadinessState;
}

/**
 * 自我输出上下文
 */
export interface SelfOutputContext {
  /** 来源：总是 'self' */
  source: 'self';
  /** 时间戳 */
  timestamp: number;
  /** 之前的状态 */
  previousState: {
    consciousness?: ConsciousContent;
    activations: Map<string, number>;
  };
}

/**
 * 自我输出处理结果
 */
export interface SelfOutputResult {
  /** 是否成功处理 */
  processed: boolean;
  /** 原因（如果未处理） */
  reason?: string;
  /** 神经元激活 */
  activations?: Map<string, number>;
  /** 自我一致性结果 */
  consistency?: SelfConsistencyResult;
  /** 元认知反思 */
  metacognitiveReflection?: MetacognitiveReflection;
  /** 处理时间 */
  processingTime?: number;
}

/**
 * 自我一致性结果
 */
export interface SelfConsistencyResult {
  /** 综合得分 [0, 1] */
  score: number;
  /** 与意识内容的一致性 */
  consciousnessAlignment: number;
  /** 与情感状态的一致性 */
  emotionalAlignment: number;
  /** 与自我模型的一致性 */
  selfModelAlignment: number;
  /** 不一致点 */
  inconsistencies: string[];
  /** 解释 */
  interpretation: string;
}

/**
 * 元认知反思
 */
export interface MetacognitiveReflection {
  /** 反思问题 */
  question: string;
  /** 反思内容 */
  reflections: string[];
  /** 相关的一致性分析 */
  consistency: SelfConsistencyResult;
  /** 时间戳 */
  timestamp: number;
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
  
  // 后台处理器 - 系统1（快速、无意识）
  private backgroundProcessor: BackgroundProcessor | null = null;
  
  // 认知模块
  private perceptualModule: PerceptualModule | null = null;
  private languageModule: LanguageModule | null = null;
  private memoryModule: MemoryModule | null = null;
  private emotionalModule: EmotionalModule | null = null;
  private metacognitiveModule: MetacognitiveModule | null = null;
  
  // 持久化服务
  private persistence: ReturnType<typeof getNeuronV3Persistence>;
  private persistenceEnabled: boolean = true;
  
  // 系统状态
  private initialized = false;
  private stateLoaded = false;
  private userId: string;
  private sessionId: string;
  private recentMessages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }> = [];
  private recentActivations: Map<string, number> = new Map();
  
  // 自我输出历史 - 双向交互的关键
  private recentSelfOutputs: Array<{
    content: string;
    timestamp: number;
    consistency: number;
    activations: Map<string, number>;
  }> = [];

  constructor(config: NeuronSystemV3Config = {}) {
    this.config = {
      vsaDimension: 10000,
      learningConfig: {},
      enableConsciousness: true,
      enableMeaningCalculation: true,
      enablePlanning: true,
      enableExecutive: true,
      enableAutoGeneration: true,
      enableBackgroundProcessing: true,
      backgroundConfig: {},
      ...config,
    };
    
    this.userId = 'default-user';
    this.sessionId = uuidv4();
    
    // 初始化持久化服务
    this.persistence = getNeuronV3Persistence(this.userId);
    
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
    
    // 初始化后台处理器 - 系统1（快速、无意识的直觉处理）
    if (this.config.enableBackgroundProcessing) {
      this.backgroundProcessor = getBackgroundProcessor({
        ...this.config.backgroundConfig,
      });
    }
    
    this.initialized = true;
    
    // 异步加载持久化状态（不阻塞构造函数）
    this.loadPersistedState();
  }

  /**
   * 加载持久化状态
   */
  private async loadPersistedState(): Promise<void> {
    try {
      const savedState = await this.persistence.loadState();
      
      if (savedState) {
        console.log('[NeuronSystemV3] Loading persisted state...');
        
        // 恢复神经元
        if (savedState.neurons.length > 0) {
          this.restoreNeurons(savedState.neurons);
        } else {
          // 没有保存的神经元，初始化默认神经元
          this.initDefaultNeurons();
        }
        
        // 恢复概念
        if (savedState.concepts.length > 0) {
          this.restoreConcepts(savedState.concepts);
        }
        
        // 恢复对话历史
        if (savedState.recentMessages.length > 0) {
          this.recentMessages = savedState.recentMessages.slice(-50); // 保留最近50条
        }
        
        this.stateLoaded = true;
        console.log(`[NeuronSystemV3] State loaded: ${savedState.neurons.length} neurons, ${savedState.concepts.length} concepts`);
      } else {
        // 没有保存的状态，初始化默认神经元
        this.initDefaultNeurons();
        console.log('[NeuronSystemV3] No saved state, initialized with default neurons');
      }
    } catch (error) {
      console.error('[NeuronSystemV3] Failed to load persisted state:', error);
      // 加载失败，初始化默认神经元
      this.initDefaultNeurons();
    }
  }

  /**
   * 恢复神经元
   */
  private restoreNeurons(neuronsData: NeuronData[]): void {
    for (const neuronData of neuronsData) {
      const neuron: PredictiveNeuron = {
        id: neuronData.id,
        userId: this.userId,
        label: neuronData.label,
        role: neuronData.role as NeuronRole,
        sensitivityVector: neuronData.sensitivityVector,
        sensitivityDimension: neuronData.sensitivityVector.length,
        sensitivityPlasticity: neuronData.sensitivityPlasticity,
        receptiveField: neuronData.receptiveField,
        
        prediction: {
          expectedActivation: neuronData.prediction.expectedActivation,
          confidence: neuronData.prediction.confidence,
          contextDependencies: neuronData.prediction.contextDependencies,
          predictedAt: Date.now(),
          basis: neuronData.prediction.basis,
        },
        
        actual: {
          activation: neuronData.actual.activation,
          receivedInputs: new Map(),
          lastActivatedAt: neuronData.actual.lastActivatedAt,
          activationHistory: neuronData.actual.activationHistory,
        },
        
        learning: {
          predictionError: neuronData.learning.predictionError,
          errorHistory: neuronData.learning.errorHistory,
          accumulatedSurprise: neuronData.learning.accumulatedSurprise,
          learningRate: neuronData.learning.learningRate,
          lastLearningAt: null,
          totalLearningEvents: neuronData.learning.totalLearningEvents,
        },
        
        meta: {
          creationReason: neuronData.meta.creationReason,
          usefulness: neuronData.meta.usefulness,
          totalActivations: neuronData.meta.totalActivations,
          averageActivation: neuronData.meta.averageActivation,
          createdAt: neuronData.meta.createdAt,
          lastUpdateAt: Date.now(),
          level: neuronData.meta.level,
          pruningCandidate: neuronData.meta.pruningCandidate,
        },
        
        outgoingConnections: neuronData.outgoingConnections.map(conn => ({
          targetId: conn.targetId,
          type: conn.type as 'excitatory' | 'inhibitory' | 'modulatory',
          strength: conn.strength,
          efficiency: conn.efficiency,
          delay: conn.delay,
          hebbianRate: conn.hebbianRate,
        })),
        
        incomingConnections: neuronData.incomingConnections.map(conn => ({
          targetId: conn.targetId,
          type: conn.type as 'excitatory' | 'inhibitory' | 'modulatory',
          strength: conn.strength,
          efficiency: conn.efficiency,
          delay: conn.delay,
          hebbianRate: conn.hebbianRate,
        })),
      };
      
      this.predictionLoop.addNeuron(neuron);
    }
  }

  /**
   * 恢复概念
   */
  private restoreConcepts(conceptsData: ConceptData[]): void {
    // 使用 importState 恢复概念
    const conceptEntries: [string, import('./vsa-space').ConceptEntry][] = conceptsData.map(c => [
      c.name,
      {
        name: c.name,
        vector: c.vector,
        type: c.type as import('./vsa-space').ConceptType,
        components: c.components,
        createdAt: c.createdAt,
        usageCount: c.usageCount,
        source: c.source as 'predefined' | 'learned' | 'composed',
      },
    ]);
    
    this.vsaSpace.importState({
      concepts: conceptEntries,
      relations: [],
    });
  }

  /**
   * 初始化默认神经元
   */
  private initDefaultNeurons(): void {
    const defaultRoles: Array<{ role: NeuronRole; label: string; receptiveField: string }> = [
      // 核心感知层
      { role: 'sensory', label: '视觉感知神经元', receptiveField: '处理视觉和图像信息' },
      { role: 'sensory', label: '听觉感知神经元', receptiveField: '处理声音和语音信号' },
      { role: 'sensory', label: '文本感知神经元', receptiveField: '处理文本和文字输入' },
      
      // 语义处理层
      { role: 'semantic', label: '词汇语义神经元', receptiveField: '理解单词和词汇含义' },
      { role: 'semantic', label: '句法语义神经元', receptiveField: '理解句子结构和语法' },
      { role: 'semantic', label: '概念语义神经元', receptiveField: '处理抽象概念和关系' },
      
      // 记忆层
      { role: 'episodic', label: '情景记忆神经元', receptiveField: '存储和检索历史事件' },
      { role: 'episodic', label: '工作记忆神经元', receptiveField: '临时存储当前上下文' },
      
      // 情感层
      { role: 'emotional', label: '正向情感神经元', receptiveField: '识别和处理积极情绪' },
      { role: 'emotional', label: '负向情感神经元', receptiveField: '识别和处理消极情绪' },
      { role: 'emotional', label: '中性情感神经元', receptiveField: '处理客观和中性信息' },
      
      // 高级认知层
      { role: 'abstract', label: '逻辑推理神经元', receptiveField: '处理逻辑和因果推理' },
      { role: 'abstract', label: '创造性神经元', receptiveField: '生成创意和新颖想法' },
      { role: 'abstract', label: '问题解决神经元', receptiveField: '分析和解决复杂问题' },
      
      // 输出层
      { role: 'motor', label: '语言生成神经元', receptiveField: '生成自然语言响应' },
      { role: 'motor', label: '行动规划神经元', receptiveField: '规划和组织行动计划' },
      
      // 元认知层
      { role: 'metacognitive', label: '自我监控神经元', receptiveField: '监控认知过程状态' },
      { role: 'metacognitive', label: '策略调节神经元', receptiveField: '调节学习和思考策略' },
      { role: 'metacognitive', label: '目标管理神经元', receptiveField: '设定和管理认知目标' },
      
      // 注意力层
      { role: 'sensory', label: '注意力聚焦神经元', receptiveField: '聚焦关键信息' },
      { role: 'sensory', label: '注意力分配神经元', receptiveField: '分配注意资源' },
    ];

    for (const config of defaultRoles) {
      const neuron = createPredictiveNeuron(this.userId, {
        label: config.label,
        role: config.role,
        sensitivityVector: this.vsaSpace.getConcept(config.receptiveField),
        receptiveField: config.receptiveField,
        creationReason: '系统初始化默认神经元',
        level: 1,
      });
      this.predictionLoop.addNeuron(neuron);
    }
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
    
    // 9. 后台处理 - 系统1的快速直觉（如果启用）
    let intuition: IntuitionSignal | undefined;
    let readiness: ReadinessState | undefined;
    
    if (this.backgroundProcessor) {
      // 后台处理器进行快速模式匹配
      // 这是"直觉"的来源：基于过往经验的快速判断
      const backgroundResult = this.backgroundProcessor.process(
        Array.from(inputVector),
        processingResult.activations
      );
      
      intuition = backgroundResult.intuition ?? undefined;
      readiness = backgroundResult.readiness;
      
      // 如果直觉信号强烈，可以影响意识内容的权重
      // 但不同于黑盒，这里是有原理可循的：
      // - 直觉 = 模式匹配的结果
      // - 准备状态 = 为后续处理预热相关神经元
      if (intuition && intuition.strength > 0.7 && this.globalWorkspace) {
        // 直觉强烈时，调整注意力方向
        // 例如：直觉是"风险"，则更多关注负面信息
        this.globalWorkspace.focusAttention({
          focusKeywords: [intuition.type],
        });
      }
    }
    
    // 10. 异步保存状态（防抖，不阻塞响应）
    if (this.persistenceEnabled) {
      this.saveStateDebounced();
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
      intuition,
      readiness,
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
  // LLM 回复记录
  // ══════════════════════════════════════════════════════════════════

  /**
   * 添加 LLM 回复到对话历史
   * 
   * 这是形成完整对话记忆的关键：不仅要记住用户说了什么，
   * 还要记住系统自己回答了什么。这样才能：
   * 1. 形成完整的对话上下文
   * 2. 让神经元学习自己的输出模式
   * 3. 支持自我反思和回顾
   * 
   * @param content LLM 生成的回复内容
   */
  addAssistantMessage(content: string): void {
    if (!content || content.trim().length === 0) {
      return;
    }

    this.recentMessages.push({
      role: 'assistant',
      content,
      timestamp: Date.now(),
    });

    // 保留最近 50 条消息（用户 + 助手）
    if (this.recentMessages.length > 50) {
      this.recentMessages = this.recentMessages.slice(-50);
    }

    // 触发异步保存
    if (this.persistenceEnabled) {
      this.saveStateDebounced();
    }

    console.log(`[NeuronSystemV3] Added assistant message, total messages: ${this.recentMessages.length}`);
  }

  /**
   * 获取最近的对话历史
   */
  getRecentMessages(limit: number = 10): Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }> {
    return this.recentMessages.slice(-limit);
  }

  /**
   * 清空对话历史
   */
  clearConversationHistory(): void {
    this.recentMessages = [];
    if (this.persistenceEnabled) {
      this.saveStateDebounced();
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 自我输出处理 - 双向交互的关键
  // ══════════════════════════════════════════════════════════════════

  /**
   * 处理自己的输出 - 让神经元系统"理解"自己说了什么
   * 
   * 这是实现双向交互和自我认知的关键：
   * 1. 神经元需要"听到"自己的输出
   * 2. 从输出中学习自己的表达模式
   * 3. 计算自我一致性 - 输出是否与认知状态匹配
   * 4. 更新自我模型 - "我刚才说了X，说明我认为Y"
   * 5. 触发元认知反思 - "我为什么这么说？"
   * 
   * @param content 系统自己生成的输出内容
   * @returns 自我处理结果
   */
  async processOwnOutput(content: string): Promise<SelfOutputResult> {
    const startTime = Date.now();
    
    if (!content || content.trim().length === 0) {
      return {
        processed: false,
        reason: 'empty_content',
      };
    }

    // 1. 将输出编码为向量
    const outputVector = this.vsaSpace.getConcept(content);
    
    // 2. 构建处理上下文（标记为自我输出）
    const selfOutputContext: SelfOutputContext = {
      source: 'self',
      timestamp: Date.now(),
      previousState: {
        consciousness: this.globalWorkspace?.getCurrentContent() ?? undefined,
        activations: new Map(this.recentActivations),
      },
    };
    
    // 3. 激活相关神经元 - 系统"听到"自己说话
    //    使用较低的敏感度，因为这是内部反馈
    const activationResult = await this.activateNeuronsForSelfOutput(
      content,
      outputVector,
      selfOutputContext
    );
    
    // 4. 计算自我一致性
    //    输出内容是否与当前认知状态一致？
    const consistency = await this.computeSelfConsistency(
      content,
      outputVector,
      activationResult.activations
    );
    
    // 5. 更新自我模型（如果启用）
    if (this.meaningCalculator) {
      await this.updateSelfModelFromOutput(content, outputVector, consistency);
    }
    
    // 6. 触发元认知反思（如果启用）
    let metacognitiveReflection: MetacognitiveReflection | undefined;
    if (this.globalWorkspace && this.metacognitiveModule) {
      metacognitiveReflection = await this.triggerMetacognitiveReflection(
        content,
        consistency,
        activationResult.activations
      );
    }
    
    // 7. 更新自我输出历史
    this.recentSelfOutputs.push({
      content,
      timestamp: Date.now(),
      consistency: consistency.score,
      activations: activationResult.activations,
    });
    
    // 保留最近 20 条自我输出
    if (this.recentSelfOutputs.length > 20) {
      this.recentSelfOutputs = this.recentSelfOutputs.slice(-20);
    }
    
    // 8. 触发异步保存
    if (this.persistenceEnabled) {
      this.saveStateDebounced();
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log(`[NeuronSystemV3] Processed own output: consistency=${consistency.score.toFixed(2)}, time=${processingTime}ms`);
    
    return {
      processed: true,
      activations: activationResult.activations,
      consistency,
      metacognitiveReflection,
      processingTime,
    };
  }

  /**
   * 为自我输出激活神经元
   */
  private async activateNeuronsForSelfOutput(
    content: string,
    outputVector: number[],
    context: SelfOutputContext
  ): Promise<{
    activations: Map<string, number>;
    newPredictions: Map<string, number>;
  }> {
    const activations = new Map<string, number>();
    const newPredictions = new Map<string, number>();
    
    // 获取所有神经元
    const neurons = this.predictionLoop.getAllNeurons();
    
    for (const neuron of neurons) {
      // 计算输出与神经元的匹配度
      // 自我输出使用较低的激活阈值
      const sensitivity = neuron.sensitivityVector;
      let activation = 0;
      
      for (let i = 0; i < Math.min(sensitivity.length, outputVector.length); i++) {
        activation += sensitivity[i] * outputVector[i];
      }
      
      // 归一化到 [0, 1]
      activation = Math.tanh(activation / 1000) * 0.5 + 0.5;
      
      // 自我输出激活强度降低（因为是自己说的，不是外部刺激）
      activation *= 0.6;
      
      if (activation > 0.1) {
        activations.set(neuron.id, activation);
        
        // 更新神经元的自我激活历史
        neuron.actual.activation = activation;
        neuron.actual.activationHistory.push(activation);
        if (neuron.actual.activationHistory.length > 20) {
          neuron.actual.activationHistory = neuron.actual.activationHistory.slice(-20);
        }
      }
    }
    
    return { activations, newPredictions };
  }

  /**
   * 计算自我一致性
   * 
   * 检查输出内容是否与系统当前的认知状态一致
   */
  private async computeSelfConsistency(
    content: string,
    outputVector: number[],
    activations: Map<string, number>
  ): Promise<SelfConsistencyResult> {
    // 1. 检查与意识内容的一致性
    const currentConsciousness = this.globalWorkspace?.getCurrentContent();
    let consciousnessAlignment = 0.5;
    
    if (currentConsciousness) {
      // 如果有意识内容，计算输出与意识内容的相关性
      // 使用 type 和 source 组合来表示意识内容
      const consciousnessText = `${currentConsciousness.type}_${currentConsciousness.source}`;
      const consciousnessVector = this.vsaSpace.getConcept(consciousnessText);
      consciousnessAlignment = this.vsaSpace.similarity(outputVector, consciousnessVector);
    }
    
    // 2. 检查与情感状态的一致性
    let emotionalAlignment = 0.5;
    const emotionalNeurons = ['正向情感神经元', '负向情感神经元', '中性情感神经元'];
    let emotionalState = 0;
    
    for (const [neuronId, activation] of activations) {
      for (const emotionalNeuron of emotionalNeurons) {
        if (neuronId.includes('情感')) {
          if (neuronId.includes('正向')) {
            emotionalState += activation;
          } else if (neuronId.includes('负向')) {
            emotionalState -= activation;
          }
        }
      }
    }
    
    // 分析输出内容的情感倾向
    const positiveWords = ['好', '喜欢', '爱', '开心', '棒', '优秀', '感谢', '帮助'];
    const negativeWords = ['不', '错', '坏', '讨厌', '抱歉', '遗憾', '问题', '失败'];
    
    let outputSentiment = 0;
    for (const word of positiveWords) {
      if (content.includes(word)) outputSentiment += 0.2;
    }
    for (const word of negativeWords) {
      if (content.includes(word)) outputSentiment -= 0.2;
    }
    outputSentiment = Math.max(-1, Math.min(1, outputSentiment));
    
    // 情感一致性：情感状态与输出情感是否匹配
    emotionalAlignment = 1 - Math.abs(emotionalState - outputSentiment) / 2;
    
    // 3. 检查与自我模型的一致性
    let selfModelAlignment = 0.5;
    const selfVector = this.vsaSpace.getConcept('自我');
    selfModelAlignment = this.vsaSpace.similarity(outputVector, selfVector);
    
    // 4. 综合一致性得分
    const score = 
      consciousnessAlignment * 0.4 +
      emotionalAlignment * 0.3 +
      selfModelAlignment * 0.3;
    
    // 5. 识别不一致点
    const inconsistencies: string[] = [];
    
    if (consciousnessAlignment < 0.3) {
      inconsistencies.push('输出与当前意识焦点偏离');
    }
    if (emotionalAlignment < 0.3) {
      inconsistencies.push('输出情感与内部情感状态不匹配');
    }
    if (selfModelAlignment < 0.3) {
      inconsistencies.push('输出与自我认知不匹配');
    }
    
    return {
      score,
      consciousnessAlignment,
      emotionalAlignment,
      selfModelAlignment,
      inconsistencies,
      interpretation: this.interpretConsistency(score, inconsistencies),
    };
  }

  /**
   * 解释一致性得分
   */
  private interpretConsistency(
    score: number,
    inconsistencies: string[]
  ): string {
    if (score >= 0.8) {
      return '高度一致：输出与认知状态完全匹配';
    } else if (score >= 0.6) {
      return '基本一致：输出与认知状态基本匹配';
    } else if (score >= 0.4) {
      return '部分一致：存在轻微的认知偏差';
    } else {
      return `一致性较低：${inconsistencies.join('；') || '存在认知矛盾'}`;
    }
  }

  /**
   * 从输出更新自我模型
   */
  private async updateSelfModelFromOutput(
    content: string,
    outputVector: number[],
    consistency: SelfConsistencyResult
  ): Promise<void> {
    // 分析输出中体现的特质
    const traitIndicators: Record<string, string[]> = {
      '好奇': ['为什么', '怎么', '什么', '如何', '?'],
      '理性': ['因此', '所以', '逻辑', '分析', '推理'],
      '友善': ['帮助', '支持', '理解', '感谢', '一起'],
      '谨慎': ['可能', '或许', '不确定', '需要确认'],
      '创造': ['想法', '建议', '可以尝试', '创新'],
    };
    
    const detectedTraits: string[] = [];
    
    for (const [trait, indicators] of Object.entries(traitIndicators)) {
      for (const indicator of indicators) {
        if (content.includes(indicator)) {
          detectedTraits.push(trait);
          break;
        }
      }
    }
    
    // 更新自我模型（如果有一致性较高的输出）
    if (consistency.score > 0.5 && detectedTraits.length > 0) {
      // 这些特质在输出中体现，可以增强自我模型中的相关特质
      console.log(`[NeuronSystemV3] Self-model update: detected traits = ${detectedTraits.join(', ')}`);
    }
  }

  /**
   * 触发元认知反思
   */
  private async triggerMetacognitiveReflection(
    content: string,
    consistency: SelfConsistencyResult,
    activations: Map<string, number>
  ): Promise<MetacognitiveReflection> {
    const reflections: string[] = [];
    
    // 反思1：我为什么这么说？
    if (consistency.score < 0.5) {
      reflections.push(`我的输出与当前认知状态存在偏差，需要检视原因`);
    }
    
    // 反思2：这符合我的价值观吗？
    if (consistency.selfModelAlignment < 0.4) {
      reflections.push(`这个输出可能不完全符合我的核心特质`);
    }
    
    // 反思3：我是否保持了真实性？
    const highActivationNeurons = Array.from(activations.entries())
      .filter(([, activation]) => activation > 0.6)
      .map(([id]) => id);
    
    if (highActivationNeurons.length > 0) {
      reflections.push(`这个输出激活了我的${highActivationNeurons.length}个核心认知区域`);
    }
    
    return {
      question: '我为什么这么说？',
      reflections,
      consistency,
      timestamp: Date.now(),
    };
  }

  /**
   * 获取最近的自我输出历史
   */
  getRecentSelfOutputs(limit: number = 5): Array<{
    content: string;
    timestamp: number;
    consistency: number;
    activations: Map<string, number>;
  }> {
    return this.recentSelfOutputs.slice(-limit);
  }

  /**
   * 获取自我认知状态
   */
  getSelfCognitiveState(): {
    recentOutputs: number;
    averageConsistency: number;
    dominantTraits: string[];
  } {
    const outputs = this.recentSelfOutputs;
    
    if (outputs.length === 0) {
      return {
        recentOutputs: 0,
        averageConsistency: 0,
        dominantTraits: [],
      };
    }
    
    const averageConsistency = outputs.reduce((sum, o) => sum + o.consistency, 0) / outputs.length;
    
    return {
      recentOutputs: outputs.length,
      averageConsistency,
      dominantTraits: [], // 可以从自我模型中提取
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

  // ══════════════════════════════════════════════════════════════════
  // 可视化数据获取
  // ══════════════════════════════════════════════════════════════════

  /**
   * 获取网络拓扑数据
   */
  getNetworkTopology(): {
    neurons: Array<{
      id: string;
      label: string;
      role: string;
      x: number;
      y: number;
      activation: number;
      predictionError: number;
      state: 'active' | 'predicting' | 'surprised' | 'dormant';
    }>;
    connections: Array<{
      from: string;
      to: string;
      weight: number;
      active: boolean;
    }>;
  } {
    const state = this.predictionLoop.exportState();
    const neurons: Array<{
      id: string;
      label: string;
      role: string;
      x: number;
      y: number;
      activation: number;
      predictionError: number;
      state: 'active' | 'predicting' | 'surprised' | 'dormant';
    }> = [];
    const connections: Array<{
      from: string;
      to: string;
      weight: number;
      active: boolean;
    }> = [];

    // 角色映射
    const roleMap: Record<string, string> = {
      'sensory': '感知',
      'prediction': '预测',
      'memory': '记忆',
      'evaluation': '评估',
      'decision': '决策',
      'language': '语言',
      'emotional': '情感',
      'metacognitive': '元认知',
      'abstract': '抽象',
    };

    // 转换神经元数据
    state.neurons.forEach((neuron, index) => {
      const angle = (index / Math.max(state.neurons.length, 1)) * Math.PI * 2;
      const radius = 30 + Math.random() * 15;
      
      // 从 neuron 的 actual 和 learning 中获取数据
      const activation = neuron.actual?.activation ?? 0;
      const predictionError = neuron.learning?.predictionError ?? 0;
      
      // 根据激活值和预测误差确定状态
      let neuronState: 'active' | 'predicting' | 'surprised' | 'dormant' = 'dormant';
      if (activation > 0.7) {
        neuronState = 'active';
      } else if (predictionError > 0.5) {
        neuronState = 'surprised';
      } else if (activation > 0.3) {
        neuronState = 'predicting';
      }

      neurons.push({
        id: neuron.id,
        label: neuron.label || `${roleMap[neuron.role] || neuron.role}神经元`,
        role: roleMap[neuron.role] || neuron.role,
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
        activation,
        predictionError,
        state: neuronState,
      });

      // 基于神经元的连接信息创建连接
      const outConnections = neuron.outgoingConnections ?? [];
      outConnections.forEach((conn) => {
        connections.push({
          from: neuron.id,
          to: conn.targetId,
          weight: conn.strength,
          active: conn.strength > 0.3,
        });
      });
    });

    // 如果没有神经元，返回默认的示例网络
    if (neurons.length === 0) {
      const defaultRoles = ['感知', '预测', '记忆', '评估', '决策', '语言', '情感', '元认知'];
      defaultRoles.forEach((role, i) => {
        const angle = (i / defaultRoles.length) * Math.PI * 2;
        const radius = 30;
        neurons.push({
          id: `n${i}`,
          label: `${role}神经元`,
          role,
          x: 50 + Math.cos(angle) * radius,
          y: 50 + Math.sin(angle) * radius,
          activation: 0.1 + Math.random() * 0.2,
          predictionError: Math.random() * 0.3,
          state: 'dormant',
        });
      });
    }

    return { neurons, connections };
  }

  /**
   * 获取VSA语义空间数据
   */
  getVSAData(): {
    concepts: Array<{
      name: string;
      x: number;
      y: number;
      vector: number[];
      similarity: number;
      category: 'core' | 'learned' | 'temporary';
    }>;
    links: Array<{
      from: string;
      to: string;
      similarity: number;
    }>;
  } {
    const conceptNames = this.vsaSpace.getAllConceptNames();
    const concepts: Array<{
      name: string;
      x: number;
      y: number;
      vector: number[];
      similarity: number;
      category: 'core' | 'learned' | 'temporary';
    }> = [];
    const links: Array<{
      from: string;
      to: string;
      similarity: number;
    }> = [];

    // 核心概念列表
    const coreConcepts = new Set([
      '自我', '理解', '帮助', '真实', '好奇',
      '爱', '喜欢', '知道', '思考', '学习',
    ]);

    // 计算每个概念的位置
    conceptNames.forEach((name, index) => {
      const concept = this.vsaSpace.getConcept(name);
      const similar = this.vsaSpace.findSimilar(name, 1);
      const maxSim = similar.length > 0 ? similar[0].similarity : 1;
      
      // 使用哈希生成位置
      const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const angle = (hash % 360) * Math.PI / 180;
      const radius = coreConcepts.has(name) ? 20 : 30 + (hash % 20);
      
      concepts.push({
        name,
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
        vector: Array.from(concept).slice(0, 10), // 简化的向量显示
        similarity: maxSim,
        category: coreConcepts.has(name) ? 'core' : 
                  name.length > 2 ? 'learned' : 'temporary',
      });
    });

    // 计算概念间的相似度链接
    const topConcepts = concepts.slice(0, 20); // 限制数量
    for (let i = 0; i < topConcepts.length; i++) {
      const similar = this.vsaSpace.findSimilar(topConcepts[i].name, 3);
      similar.forEach(s => {
        if (s.similarity > 0.5) {
          links.push({
            from: topConcepts[i].name,
            to: s.name,
            similarity: s.similarity,
          });
        }
      });
    }

    return { concepts, links };
  }

  /**
   * 获取计划模块数据
   */
  getPlanningData(): {
    goals: Array<{
      id: string;
      description: string;
      priority: number;
      progress: number;
      status: string;
      subGoals: string[];
    }>;
    activeGoal: {
      id: string;
      description: string;
      priority: number;
    } | null;
  } {
    const planningModule = getPlanningModule();
    const state = planningModule.getState() as {
      goalCount?: number;
      activeGoal?: {
        id: string;
        description: string;
        priority: number;
        progress?: number;
        status?: string;
        subGoals?: string[];
      };
    };

    return {
      goals: state.activeGoal ? [
        {
          id: state.activeGoal.id,
          description: state.activeGoal.description,
          priority: state.activeGoal.priority,
          progress: state.activeGoal.progress || 0,
          status: state.activeGoal.status || 'in_progress',
          subGoals: state.activeGoal.subGoals || [],
        },
      ] : [],
      activeGoal: state.activeGoal ? {
        id: state.activeGoal.id,
        description: state.activeGoal.description,
        priority: state.activeGoal.priority,
      } : null,
    };
  }

  /**
   * 获取执行控制数据
   */
  getExecutiveData(): {
    attentionMode: 'focus' | 'diffuse' | 'switching';
    currentFocus: string;
    attentionAllocation: Array<{
      module: string;
      allocation: number;
    }>;
    tasks: Array<{
      id: string;
      description: string;
      priority: number;
      urgency: number;
      status: string;
    }>;
    attentionSpotlight: string[];
    timePressure: number;
  } {
    const executiveModule = getExecutiveModule();
    const state = executiveModule.getState() as {
      activeTaskCount?: number;
      attentionSpotlight?: {
        focus: string;
        intensity: number;
        spread: number;
      };
      timePressure?: number;
    };

    // 获取意识状态来确定注意力模式
    const consciousnessLevel = this.globalWorkspace?.computeConsciousnessLevel() || 0;
    let attentionMode: 'focus' | 'diffuse' | 'switching' = 'diffuse';
    if (consciousnessLevel > 0.7) {
      attentionMode = 'focus';
    } else if (consciousnessLevel > 0.4) {
      attentionMode = 'switching';
    }

    // 构建注意力分配
    const attentionAllocation = [
      { module: '用户输入处理', allocation: 0.4 + Math.random() * 0.2 },
      { module: '记忆检索', allocation: 0.2 + Math.random() * 0.1 },
      { module: '预测更新', allocation: 0.15 + Math.random() * 0.1 },
      { module: '自我监控', allocation: 0.1 + Math.random() * 0.05 },
      { module: '情感处理', allocation: 0.05 + Math.random() * 0.05 },
    ];

    return {
      attentionMode,
      currentFocus: state.attentionSpotlight?.focus || '等待输入',
      attentionAllocation,
      tasks: [],
      attentionSpotlight: state.attentionSpotlight?.focus ? [state.attentionSpotlight.focus] : [],
      timePressure: state.timePressure || 0,
    };
  }

  /**
   * 获取后台处理器状态
   */
  getBackgroundStats(): {
    patternCount: number;
    processCount: number;
    age: number;
    readinessLevel: number;
  } {
    if (!this.backgroundProcessor) {
      return {
        patternCount: 0,
        processCount: 0,
        age: 0,
        readinessLevel: 0,
      };
    }
    return this.backgroundProcessor.getStats();
  }

  /**
   * 获取最近的直觉信号
   */
  getRecentIntuitions(count: number = 5) {
    if (!this.backgroundProcessor) {
      return [];
    }
    return this.backgroundProcessor.getRecentIntuitions(count);
  }

  /**
   * 获取准备状态
   */
  getReadiness() {
    if (!this.backgroundProcessor) {
      return {
        primedNeurons: new Map(),
        predictedNext: [],
        readinessLevel: 0,
        timestamp: Date.now(),
      };
    }
    return this.backgroundProcessor.getReadiness();
  }

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

  // ══════════════════════════════════════════════════════════════════
  // 持久化方法
  // ══════════════════════════════════════════════════════════════════

  /**
   * 防抖保存状态
   */
  private saveTimeout: NodeJS.Timeout | null = null;
  
  private saveStateDebounced(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      this.saveToDatabase();
    }, 3000); // 3秒后保存
  }

  /**
   * 保存状态到数据库
   */
  async saveToDatabase(): Promise<boolean> {
    try {
      const state = this.predictionLoop.exportState();
      const neurons = state.neurons;
      
      // 获取概念 - 使用 exportState
      const vsaState = this.vsaSpace.exportState();
      const concepts = new Map<string, { vector: number[]; type: string; usageCount: number; source: string }>();
      
      for (const [name, entry] of vsaState.concepts) {
        concepts.set(name, {
          vector: Array.from(entry.vector),
          type: entry.type,
          usageCount: entry.usageCount,
          source: entry.source,
        });
      }
      
      // 获取学习统计
      const learningStats = this.rewardLearner.getStats();
      const predictionStats = this.predictionLoop.getStats();
      
      const stats: LearningStatsData = {
        totalLearningEvents: learningStats.totalLearningEvents,
        totalReward: learningStats.totalReward,
        totalPunishment: learningStats.totalPunishment,
        averageValue: learningStats.averageValue,
        totalPredictions: predictionStats.totalPredictions,
        accuratePredictions: predictionStats.accuratePredictions,
        totalSurprise: predictionStats.totalSurprise,
        neuronsCreated: predictionStats.neuronsCreated,
        neuronsPruned: predictionStats.neuronsPruned,
      };
      
      // 获取自我模型
      const selfModel: SelfModelData | null = this.meaningCalculator ? {
        coreTraits: ['好奇', '理性', '友善'],
        values: ['理解', '帮助', '真实'],
        currentGoals: [],
        emotionalBaseline: {
          valence: 0.3,
          arousal: 0.5,
        },
      } : null;
      
      return await this.persistence.saveState({
        neurons,
        concepts,
        learningStats: stats,
        selfModel,
        recentMessages: this.recentMessages.slice(-50).map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
      });
    } catch (error) {
      console.error('[NeuronSystemV3] Failed to save state:', error);
      return false;
    }
  }

  /**
   * 手动触发保存
   */
  async forceSave(): Promise<boolean> {
    return this.saveToDatabase();
  }

  /**
   * 检查状态是否已加载
   */
  isStateLoaded(): boolean {
    return this.stateLoaded;
  }

  /**
   * 启用/禁用持久化
   */
  setPersistenceEnabled(enabled: boolean): void {
    this.persistenceEnabled = enabled;
  }

  /**
   * 获取持久化统计
   */
  async getPersistenceStats(): Promise<{
    hasState: boolean;
    neuronCount: number;
    conceptCount: number;
    lastUpdated: string | null;
  }> {
    return this.persistence.getStats();
  }

  /**
   * 清除持久化状态
   */
  async clearPersistedState(): Promise<boolean> {
    return this.persistence.clearState();
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
  resetBackgroundProcessor();
  resetPersistence();
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
export * from './persistence';
