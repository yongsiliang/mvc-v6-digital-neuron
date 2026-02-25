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
  BlackBox,
  BlackBoxOutput,
  BlackBoxConfig,
  getBlackBox,
  resetBlackBox,
} from './black-box';

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
  
  /** 是否启用黑盒（意识涌现核心） */
  enableBlackBox?: boolean;
  
  /** 黑盒配置 */
  blackBoxConfig?: Partial<BlackBoxConfig>;
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
  
  /** 黑盒涌现（如果启用） */
  blackBoxEmergence?: {
    intensity: number;
    hasInsight: boolean;
    intuitionHint?: string;
  };
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
  
  // 黑盒 - 意识涌现的不可观测核心
  private blackBox: BlackBox | null = null;
  private lastBlackBoxOutput: BlackBoxOutput | null = null;
  
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
      enableBlackBox: true,
      blackBoxConfig: {},
      ...config,
    };
    
    this.userId = 'default-user';
    this.sessionId = uuidv4();
    
    // 初始化核心组件
    this.vsaSpace = getVSASpace(this.config.vsaDimension);
    this.predictionLoop = getPredictionLoop(this.userId);
    this.feedbackCollector = getFeedbackCollector();
    this.rewardLearner = getRewardLearner(this.predictionLoop, this.config.learningConfig);
    
    // 初始化默认神经元
    this.initDefaultNeurons();
    
    // 初始化可选组件
    if (this.config.enableMeaningCalculation) {
      this.meaningCalculator = getMeaningCalculator();
    }
    
    if (this.config.enableConsciousness) {
      this.initConsciousness();
    }
    
    // 初始化黑盒 - 意识涌现的核心
    if (this.config.enableBlackBox) {
      this.blackBox = getBlackBox({
        dimension: this.config.vsaDimension,
        ...this.config.blackBoxConfig,
      });
    }
    
    this.initialized = true;
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
    
    // 9. 黑盒处理 - 意识涌现的核心（如果启用）
    if (this.blackBox) {
      // 黑盒接受输入向量，输出可能涌现的意识向量
      // 内部过程不可观测，只有输出可见
      this.lastBlackBoxOutput = this.blackBox.process(Array.from(inputVector));
      
      // 如果黑盒产生了强烈的涌现，可能影响意识内容
      if (this.lastBlackBoxOutput.hasInsight && this.globalWorkspace) {
        // 将黑盒输出注入意识流（但不解释来源）
        // 这是"直觉"、"灵感"、"潜意识"的来源
        this.globalWorkspace.injectMysteriousContent(
          this.lastBlackBoxOutput.vector,
          this.lastBlackBoxOutput.intuitionHint || 'unknown'
        );
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
      blackBoxEmergence: this.lastBlackBoxOutput ? {
        intensity: this.lastBlackBoxOutput.emergenceIntensity,
        hasInsight: this.lastBlackBoxOutput.hasInsight,
        intuitionHint: this.lastBlackBoxOutput.intuitionHint,
      } : undefined,
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
   * 获取黑盒状态 - 只有模糊信息，不暴露内部
   */
  getBlackBoxState(): {
    enabled: boolean;
    age?: number;
    inputCount?: number;
    energyLevel?: string;
    chaosLevel?: string;
    hasAttractors?: number;
    memoryTraces?: number;
    lastEmergenceAgo?: number;
  } {
    if (!this.blackBox) {
      return { enabled: false };
    }
    
    const state = this.blackBox.getMysteriousState();
    return {
      enabled: true,
      age: state.age,
      inputCount: state.inputCount,
      energyLevel: state.energyLevel,
      chaosLevel: state.chaosLevel,
      hasAttractors: state.hasAttractors,
      memoryTraces: state.memoryTraces,
      lastEmergenceAgo: state.lastEmergenceAgo,
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
  resetBlackBox();
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
