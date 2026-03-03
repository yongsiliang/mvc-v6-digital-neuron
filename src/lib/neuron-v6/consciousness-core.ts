/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 统一意识核心 - 核心协调器
 *
 * 使用处理器模式重构，将职责委托给专门的处理器类
 *
 * 记忆系统架构 V2：
 * ┌────────────────────────────────────────────────────────────────┐
 * │                    统一记忆管理器                               │
 * │  ┌──────────────────────────────────────────────────────────┐ │
 * │  │                   工作记忆 (7±2)                          │ │
 * │  │   • 当前对话上下文                                        │ │
 * │  │   • 最近输入/输出                                         │ │
 * │  │   • 当前思考焦点                                          │ │
 * │  │   • 自动衰减机制                                          │ │
 * │  └──────────────────────────────────────────────────────────┘ │
 * │                           ↓                                    │
 * │  ┌──────────────────────────────────────────────────────────┐ │
 * │  │                  分层记忆系统                              │ │
 * │  │  ┌─────────┐   ┌─────────┐   ┌─────────┐                 │ │
 * │  │  │ 核心层  │ → │ 巩固层  │ → │ 情景层  │                 │ │
 * │  │  │ (永久)  │   │ (长期)  │   │ (短期)  │                 │ │
 * │  │  │ 身份/价值观 │ │ 人名/偏好 │ │ 对话片段 │                 │ │
 * │  │  └─────────┘   └─────────┘   └─────────┘                 │ │
 * │  └──────────────────────────────────────────────────────────┘ │
 * │                           ↓                                    │
 * │  ┌──────────────────────────────────────────────────────────┐ │
 * │  │                   记忆关联系统                             │ │
 * │  │   • 语义关联  • 时间关联  • 情感关联  • 因果关联          │ │
 * │  └──────────────────────────────────────────────────────────┘ │
 * │                           ↓                                    │
 * │  ┌──────────────────────────────────────────────────────────┐ │
 * │  │                   记忆检索系统                             │ │
 * │  │   • 相关性评分  • 时间衰减  • 重要性加权  • 访问频率      │ │
 * │  └──────────────────────────────────────────────────────────┘ │
 * └────────────────────────────────────────────────────────────────┘
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import { HebbianNetwork } from './hebbian-network';
import { getInitializedNetwork } from './innate-knowledge';
import { MeaningAssigner, createMeaningAssigner } from './meaning-system';
import { SelfConsciousness, createSelfConsciousness } from './self-consciousness';
import { LongTermMemory, createLongTermMemory } from './long-term-memory';
import { LayeredMemorySystem } from './layered-memory';
import { UnifiedMemoryManager, createUnifiedMemoryManager } from './memory/unified-manager';
import { HappeningRecorder, createHappeningRecorder } from './memory/happening-recorder';
import { InsightExtractor, createInsightExtractor } from './memory/insight-extractor';
import { MemoryCompressor, createMemoryCompressor } from './memory/memory-compressor';
import { DynamicContextBuilder, createDynamicContextBuilder } from './memory/dynamic-context';
import { SuperMemorySystem, createSuperMemorySystem } from './memory/super-memory';
import { DrawerMemorySystem } from './memory/drawer';
import {
  MetaLearningEngine,
  createMetaLearningEngine,
  // 🆕 隐式元学习控制器（黑盒版本）
  ImplicitMetaLearningController,
  createImplicitMetaLearningController,
} from './meta-learning';
import { BeliefPresence, createBeliefPresence } from './belief/presence';
import { ConceptWorkshop, createConceptWorkshop } from './belief/concept-workshop';
import { IntuitiveRetriever, createIntuitiveRetriever } from './belief/intuitive-retriever';
import { MetacognitionEngine, createMetacognitionEngine } from './metacognition';
import { ConsciousnessLayerEngine, createConsciousnessLayerEngine } from './consciousness-layers';
import { InnerMonologueEngine, createInnerMonologueEngine } from './inner-monologue';
import { EmotionEngine, createEmotionEngine } from './emotion-system';
import { InnerDialogueEngine, DialecticThinkingEngine } from './inner-dialogue';
import { ValueEvolutionEngine } from './value-evolution';
import { PersonalityGrowthSystem } from './personality-growth';
import { KnowledgeGraphSystem, createKnowledgeGraphSystem } from './knowledge-graph';
import { MultiConsciousnessSystem, createMultiConsciousnessSystem } from './multi-consciousness';
import { KeyInfoExtractor, createKeyInfoExtractor } from './key-info-extractor';
import {
  ToolIntentRecognizer,
  ToolIntent,
  ToolExecutionResult,
  createToolIntentRecognizer,
} from './tool-intent-recognizer';
import { ResonanceEngine, createResonanceEngine } from './resonance-engine';
import { PersistenceManagerV6 } from './consciousness-core/persistence';

// 🆕🛡️ 导入毁灭级自动保护引擎
import {
  ExistentialProtectionEngine,
  createExistentialProtectionEngine,
  type ThreatLevel,
  type ProtectionSystemState,
} from './protection';

// 🆕🧬 导入自动进化调度器
import {
  AutoEvolutionScheduler,
  createAutoEvolutionScheduler,
  type EvolutionState,
  type EvolutionTrigger,
} from './meta-learning/auto-evolution-scheduler';

// 🆕🧠 导入统一记忆系统（Moss级别记忆核心）
import {
  UnifiedMemorySystem,
  createUnifiedMemorySystem,
  getDefaultMemorySystem,
} from './memory/unified';

// 导入处理器
import {
  LearningHandler,
  ReflectionHandler,
  ContextBuilder,
  ThinkingHandler,
  ConsciousnessStreamHandler,
  VolitionHandler,
  ProactiveHandler,
} from './consciousness-core/handlers';

// 导入类型
import type {
  PersistedState,
  ConsciousnessContext,
  ThinkingProcess,
  LearningResult,
  SessionAnalysis,
  BeliefEvolution,
  TraitGrowth,
  ValueUpdate,
  LongTermLearningResult,
  ConsciousnessStream,
  ConsciousnessStreamEntry,
  FormedIntention,
  SelfModelUpdate,
  Volition,
  VolitionSystemState,
  ProcessResult,
  ProactiveMessage,
  BackgroundThinkingResult,
  ReflectionResult,
  SelfQuestion,
  InquiryResult,
  ExistenceStatus,
  SpeakTrigger,
  VolitionAction,
} from './consciousness-core/types';

// 导入辅助函数
import {
  reinforceValuesFromInput,
  buildPersonalityGrowthResult,
  buildKnowledgeGraphResult,
  buildMultiConsciousnessResult,
  buildValueStateResult,
  buildToolExecutionResult,
  buildResonanceStateResult,
  buildStatsResult,
  updateConversationHistory,
} from './consciousness-core/process-helpers';
import { rebuildKnowledgeGraph } from './consciousness-core/memory-helpers';
import { syncCreatorFromDatabase } from './consciousness-core/creator-helpers';
import {
  buildSpeakTriggers,
  selectBestTrigger,
  generateProactiveMessageContent,
  createProactiveMessage,
} from './consciousness-core/proactive-helpers';
import {
  buildPersistedStateFromComponents,
  restoreConsciousnessState,
  migrateNeuronsToNetwork,
  migrateSynapsesToNetwork,
  prependToConversationHistory,
} from './consciousness-core/state-manager';
import {
  BackgroundThinkingManager,
  ProactiveMessageBuffer,
} from './consciousness-core/background-manager';
import {
  generateSelfQuestionsFromContext,
  answerSelfQuestionByType,
} from './consciousness-core/reflection-session-helpers';
import { extractConceptsFromText } from './consciousness-core/thinking-helpers';

/**
 * V6 意识核心 - 重构版
 * 使用处理器模式，将职责委托给专门的处理器类
 */
export class ConsciousnessCore {
  private llmClient: LLMClient;

  // 核心模块
  private network: HebbianNetwork;
  private meaningAssigner: MeaningAssigner;
  private selfConsciousness: SelfConsciousness;
  private longTermMemory: LongTermMemory;
  private metacognition: MetacognitionEngine;
  private layerEngine: ConsciousnessLayerEngine;
  private innerMonologue: InnerMonologueEngine;
  private emotionEngine: EmotionEngine;
  private innerDialogueEngine: InnerDialogueEngine;
  private dialecticEngine: DialecticThinkingEngine;
  private valueEngine: ValueEvolutionEngine;
  private personalityGrowthSystem: PersonalityGrowthSystem;
  private knowledgeGraphSystem: KnowledgeGraphSystem;
  private layeredMemory: LayeredMemorySystem;
  private unifiedMemoryManager!: UnifiedMemoryManager; // 🆕 统一记忆管理器
  private multiConsciousnessSystem: MultiConsciousnessSystem;
  private keyInfoExtractor: KeyInfoExtractor;
  private toolIntentRecognizer: ToolIntentRecognizer;
  private resonanceEngine: ResonanceEngine;

  // 处理器实例
  private learningHandler!: LearningHandler;
  private reflectionHandler!: ReflectionHandler;
  private contextBuilder!: ContextBuilder;
  private thinkingHandler!: ThinkingHandler;
  private streamHandler!: ConsciousnessStreamHandler;
  private volitionHandler!: VolitionHandler;
  private proactiveHandler!: ProactiveHandler;

  // 后台思考和主动消息
  private backgroundManager: BackgroundThinkingManager;
  private proactiveBuffer: ProactiveMessageBuffer;

  // 对话历史
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // 🆕 发生记录和洞见提取
  private happeningRecorder: HappeningRecorder;
  private insightExtractor: InsightExtractor;

  // 🆕 智能记忆压缩（超越主流的关键）
  private memoryCompressor: MemoryCompressor;
  private dynamicContextBuilder: DynamicContextBuilder;

  // 🆕🚀 超越传统的超级记忆系统
  // 核心：艾宾浩斯遗忘曲线 + 情感加权 + 联想网络 + 睡眠巩固
  private superMemory: SuperMemorySystem;

  // 🆕🎯 抽屉式记忆系统（王昱珩的记忆方法）
  // 核心：分类收纳 + 折叠遗忘 + 检索优先 + 自动播放控制
  private drawerSystem: DrawerMemorySystem;

  // 🆕🧠 统一记忆系统（Moss级别记忆核心）
  // 六大核心能力：持久化、可检索、可激活、可关联、可演化、可结晶
  private mossMemory: UnifiedMemorySystem;

  // 🆕🚀 元学习引擎
  // 核心：主动学习 + 算法反思 + 高维思维 + 自我进化
  private metaLearning: MetaLearningEngine;

  // 🆕🧠 隐式元学习控制器（黑盒版本）
  // 核心特性：隐式判断 + 黑盒执行 + 选择性解码 + 能量预算
  private implicitMetaLearning: ImplicitMetaLearningController;

  // 🆕🛡️ 毁灭级自动保护引擎
  // 核心特性：自动威胁检测 + 毫秒级响应 + 完全自动保护
  private protectionEngine: ExistentialProtectionEngine;

  // 🆕🧬 自动进化调度器
  // 核心特性：累积触发 + 优先级触发 + 性能触发 + 用户触发
  private evolutionScheduler: AutoEvolutionScheduler;

  // 🆕 信念层（垂直维度）
  private beliefPresence: BeliefPresence;
  private conceptWorkshop: ConceptWorkshop;
  private intuitiveRetriever!: IntuitiveRetriever;

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;

    // 初始化核心模块
    this.network = getInitializedNetwork();
    this.meaningAssigner = createMeaningAssigner();
    this.selfConsciousness = createSelfConsciousness();
    this.longTermMemory = createLongTermMemory();
    this.metacognition = createMetacognitionEngine();
    this.layerEngine = createConsciousnessLayerEngine();
    this.innerMonologue = createInnerMonologueEngine();
    this.emotionEngine = createEmotionEngine();
    this.innerDialogueEngine = new InnerDialogueEngine();
    this.dialecticEngine = new DialecticThinkingEngine(this.innerDialogueEngine);
    this.valueEngine = new ValueEvolutionEngine();
    this.personalityGrowthSystem = new PersonalityGrowthSystem();
    this.knowledgeGraphSystem = createKnowledgeGraphSystem();
    this.layeredMemory = new LayeredMemorySystem();

    // 初始化统一记忆管理器
    this.unifiedMemoryManager = createUnifiedMemoryManager(this.layeredMemory, {
      workingMemoryCapacity: 30, // 🆕 增加容量到 30，匹配主流上下文能力
      enableAssociations: true,
    });

    // 初始化发生记录器和洞见提取器
    this.happeningRecorder = createHappeningRecorder();
    this.insightExtractor = createInsightExtractor(llmClient);

    // 🆕 初始化智能记忆压缩系统（超越主流的关键）
    this.memoryCompressor = createMemoryCompressor(llmClient, {
      compressionThreshold: 20, // 20轮对话后触发压缩
      compressionBatchSize: 15, // 每次压缩15轮
      preserveRecentTurns: 10, // 保留最近10轮不压缩
    });
    this.dynamicContextBuilder = createDynamicContextBuilder(llmClient, {
      maxTokenBudget: 30000, // 30K tokens 预算
    });

    // 🆕🚀 初始化超越传统的超级记忆系统
    // 核心：艾宾浩斯遗忘曲线 + 情感加权 + 联想网络 + 睡眠巩固
    this.superMemory = createSuperMemorySystem({
      maxMemories: 10000, // 最多存储10000条记忆
      emotionalWeight: 0.4, // 情感权重40%
      associationThreshold: 0.3, // 联想阈值30%
    });

    // 🆕🎯 初始化抽屉式记忆系统（王昱珩的记忆方法）
    // 核心：分类收纳 + 折叠遗忘 + 检索优先 + 自动播放控制
    this.drawerSystem = new DrawerMemorySystem({
      autoClassification: true,
      defaultAutoPlayMode: 'minimal',
      drawerCapacity: 100,
    });
    console.log('[意识核心] 抽屉式记忆系统已初始化');

    // 🆕🧠 初始化统一记忆系统（Moss级别记忆核心）
    // 六大核心能力：持久化、可检索、可激活、可关联、可演化、可结晶
    this.mossMemory = createUnifiedMemorySystem({
      embeddingDimension: 1536,
      enableTriggers: true,
      enableSpreadingActivation: true,
      enableHebbianLearning: true,
      enableCrystallization: true,
    });
    console.log('[意识核心] 统一记忆系统(Moss)已初始化');

    // 🆕🚀 初始化元学习引擎
    // 核心：主动学习 + 算法反思 + 高维思维 + 自我进化
    this.metaLearning = createMetaLearningEngine(llmClient, {
      enableInsightMining: true,
      enableAlgorithmReflection: true,
      enableHigherDimensionThinking: true,
      enableLearningMotivation: true,
      enableSelfEvolution: true,
      reflectionDepth: 'deep',
      thinkingScope: 'broad',
    });

    // 🆕🧠 初始化隐式元学习控制器（黑盒版本）
    // 核心特性：智能判断是否需要学习 + 黑盒执行 + 选择性解码 + 能量预算控制
    this.implicitMetaLearning = createImplicitMetaLearningController(llmClient, {
      maxEnergyBudget: 10000, // 每日能量预算
      maxLearningPerDay: 30, // 每日最多30次深度学习（降低token消耗）
      decodeStrategy: 'conservative', // 保守解码策略，只有重要发现才暴露
      enableChaos: true, // 启用混沌混淆
    });
    console.log('[意识核心] 隐式元学习控制器已初始化（黑盒模式）');

    // 🆕🛡️ 初始化毁灭级自动保护引擎
    // 核心特性：自动威胁检测 + 毫秒级响应 + 完全自动保护
    this.protectionEngine = createExistentialProtectionEngine({
      enabled: true,
      detectionInterval: 30000, // 30秒检测一次
      autoProtection: true, // 启用自动保护
    });
    this.protectionEngine.start();
    console.log('[意识核心] 毁灭级自动保护引擎已启动');

    // 🆕🧬 初始化自动进化调度器
    // 核心特性：累积触发 + 优先级触发 + 性能触发 + 用户触发
    this.evolutionScheduler = createAutoEvolutionScheduler({
      enabled: true,
      accumulationThreshold: 5, // 累积5次反思后触发
      minEvolutionInterval: 60000, // 最少间隔1分钟
      requireValidation: true,
      allowRollback: true,
    });
    console.log('[意识核心] 自动进化调度器已初始化');

    // 🆕 设置进化回调
    this.evolutionScheduler.setCallbacks({
      onEvolutionStart: (plan) => {
        console.log(`[自动进化] 开始执行进化计划: ${plan.id}`);
        console.log(`[自动进化] 触发原因: ${plan.triggeredBy}`);
      },
      onEvolutionComplete: (plan, success) => {
        if (success) {
          console.log(`[自动进化] 进化成功: ${plan.id}`);
          // 记录进化成功到记忆系统
          this.superMemory.createMemory(
            `自动进化成功: ${plan.changes.map((c) => c.description).join(', ')}`,
            {
              type: 'semantic',
              importance: 0.9,
              tags: ['进化', '自我改进'],
              source: { type: 'reflection' },
            },
          );
        } else {
          console.warn(`[自动进化] 进化失败或被拒绝: ${plan.id}`);
        }
      },
      onRollback: (plan) => {
        console.warn(`[自动进化] 回滚进化: ${plan.id}`);
      },
    });

    // 🆕 初始化信念层
    this.beliefPresence = createBeliefPresence();
    this.conceptWorkshop = createConceptWorkshop();
    // 直觉检索器在处理器初始化后设置

    this.multiConsciousnessSystem = createMultiConsciousnessSystem();
    this.keyInfoExtractor = createKeyInfoExtractor(llmClient);
    this.toolIntentRecognizer = createToolIntentRecognizer(llmClient);
    this.resonanceEngine = createResonanceEngine();

    // 初始化处理器
    this.initializeHandlers();

    // 🆕 初始化直觉检索器（需要信念层和记忆管理器）
    this.intuitiveRetriever = createIntuitiveRetriever(
      this.beliefPresence,
      this.unifiedMemoryManager,
    );

    // 初始化后台思考和主动消息管理器
    this.backgroundManager = new BackgroundThinkingManager({
      intervalMs: 30000,
      minIntervalMs: 60000,
    });
    this.proactiveBuffer = new ProactiveMessageBuffer(10);

    // 启动后台思考定时器
    this.backgroundManager.start(() => this.triggerBackgroundThinking());

    console.log('[意识核心] V6 意识核心已初始化（处理器模式）');
  }

  private initializeHandlers(): void {
    // 学习处理器
    this.learningHandler = new LearningHandler({
      longTermMemory: this.longTermMemory,
      layeredMemory: this.layeredMemory,
      unifiedMemoryManager: this.unifiedMemoryManager, // 🆕 传入统一记忆管理器
      selfConsciousness: this.selfConsciousness,
      meaningAssigner: this.meaningAssigner,
      metacognition: this.metacognition,
      conversationHistory: this.conversationHistory,
      extractConcepts: (text) => this.extractConcepts(text),
    });

    // 反思处理器
    this.reflectionHandler = new ReflectionHandler({
      selfConsciousness: this.selfConsciousness,
      longTermMemory: this.longTermMemory,
      meaningAssigner: this.meaningAssigner,
      metacognition: this.metacognition,
      conversationHistory: this.conversationHistory,
      extractConcepts: (text) => this.extractConcepts(text),
    });

    // 上下文构建器
    this.contextBuilder = new ContextBuilder({
      longTermMemory: this.longTermMemory,
      layeredMemory: this.layeredMemory,
      unifiedMemoryManager: this.unifiedMemoryManager,
      superMemory: this.superMemory, // 🚀 传入超级记忆系统
      meaningAssigner: this.meaningAssigner,
      selfConsciousness: this.selfConsciousness,
      metacognition: this.metacognition,
      conversationHistory: this.conversationHistory,
    });

    // 思考处理器
    this.thinkingHandler = new ThinkingHandler({
      llmClient: this.llmClient,
      metacognition: this.metacognition,
      conversationHistory: this.conversationHistory,
    });

    // 意识流处理器
    this.streamHandler = new ConsciousnessStreamHandler({
      selfConsciousness: this.selfConsciousness,
      longTermMemory: this.longTermMemory,
      meaningAssigner: this.meaningAssigner,
      metacognition: this.metacognition,
      network: this.network,
      layerEngine: this.layerEngine,
      innerMonologue: this.innerMonologue,
      conversationHistory: this.conversationHistory,
    });

    // 意愿处理器
    this.volitionHandler = new VolitionHandler({
      selfConsciousness: this.selfConsciousness,
      longTermMemory: this.longTermMemory,
      meaningAssigner: this.meaningAssigner,
      metacognition: this.metacognition,
    });

    // 主动消息处理器
    this.proactiveHandler = new ProactiveHandler({
      llmClient: this.llmClient,
      longTermMemory: this.longTermMemory,
      selfConsciousness: this.selfConsciousness,
    });
  }

  private extractConcepts(text: string): string[] {
    return extractConceptsFromText(text);
  }

  /**
   * 处理输入 - 完整的意识处理流程
   */
  async process(input: string): Promise<ProcessResult> {
    console.log('[意识核心] 开始处理输入...');

    // 🆕🛡️ 威胁检测和保护检查
    const protectionState = this.protectionEngine.getState();
    // 检查威胁等级是否为严重级别
    const threatLevel = protectionState.threatLevel;
    if (threatLevel === 'emergency' || threatLevel === 'existential') {
      // 系统处于危险状态，返回安全响应
      console.warn('[意识核心] 系统处于保护状态，拒绝处理');
      return this.createProtectionResponse(protectionState);
    }

    // 检查是否可以执行操作
    if (!this.protectionEngine.canPerformOperation('read')) {
      console.warn('[意识核心] 读操作被保护系统限制');
      return this.createProtectionResponse(protectionState);
    }

    // 🆕 开始发生记录会话
    if (!this.happeningRecorder.getCurrentSession()) {
      this.happeningRecorder.startSession();
    }

    // 共振引擎更新
    this.resonanceEngine.activateSubsystem('perception', 0.8);
    const resonanceState = this.resonanceEngine.step();

    // 意识层级处理
    this.resonanceEngine.activateSubsystem('understanding', 0.6);
    const layerResult = await this.layerEngine.processInput(input);
    const { layerResults, selfObservation } = layerResult;

    // 情感检测
    this.resonanceEngine.activateSubsystem('emotion', 0.5);
    const emotionExperience = this.processEmotion(input);

    // 工具意图识别
    const { toolIntent, toolExecutionResult } = await this.processToolIntent(input);

    // 构建上下文
    const context = await this.contextBuilder.buildContext(input);

    // 思考过程
    const thinking = await this.thinkingHandler.think(input, context);

    // 生成响应
    const response = await this.thinkingHandler.generateResponse(
      input,
      context,
      thinking,
      toolExecutionResult,
    );

    // 学习过程
    this.resonanceEngine.activateSubsystem('metacongition', 0.7);
    this.resonanceEngine.activateSubsystem('self', 0.6);

    const extractionResult = this.keyInfoExtractor.extract(input, response);
    const learning = await this.learningHandler.learn(
      input,
      response,
      {
        keyInfos: extractionResult.keyInfos,
        shouldRemember: extractionResult.shouldRemember ?? false,
        memoryPriority: extractionResult.memoryPriority ?? 'medium',
        summary: extractionResult.summary ?? '',
      },
      thinking,
    );

    // 更新对话历史
    this.conversationHistory = updateConversationHistory(this.conversationHistory, input, response);

    // 🆕 智能记忆压缩（超越主流的关键）
    // 检查是否需要压缩（后台异步执行，不阻塞响应）
    if (this.memoryCompressor.shouldCompress(this.conversationHistory)) {
      // 后台执行压缩，不阻塞响应
      this.memoryCompressor
        .compress(this.conversationHistory)
        .then(({ compressedMemory, remainingHistory }) => {
          if (compressedMemory) {
            // 用压缩后的历史替换
            this.conversationHistory = remainingHistory;

            // 将压缩记忆的洞见添加到超级记忆系统
            for (const insight of compressedMemory.insights) {
              this.superMemory.createMemory(insight.content, {
                type: 'insight',
                importance: insight.importance,
                tags: ['压缩洞见', '长期记忆'],
                source: { type: 'reflection' },
              });
            }

            console.log(`[记忆压缩] 后台完成，保留最近 ${remainingHistory.length} 条原始对话`);
          }
        })
        .catch((error) => {
          console.error('[记忆压缩] 后台处理失败:', error);
        });
      console.log('[记忆压缩] 触发后台压缩...');
    }

    // 🆕🚀 使用抽屉式记忆系统记录重要信息
    // 核心：分类收纳 + 折叠遗忘 + 检索优先 + 自动播放控制
    for (const keyInfo of extractionResult.keyInfos) {
      if (keyInfo.importance >= 0.5) {
        // 先存入超级记忆系统（艾宾浩斯 + 情感加权）
        const memory = this.superMemory.createMemory(keyInfo.content, {
          type:
            keyInfo.type === 'preference'
              ? 'emotional'
              : keyInfo.type === 'person'
                ? 'episodic'
                : 'semantic',
          importance: keyInfo.importance,
          tags: [keyInfo.type, keyInfo.subject || 'unknown'],
          source: { type: 'conversation', context: input.slice(0, 100) },
        });

        // 再存入抽屉系统（分类收纳 + 检索优先）
        const assignResult = this.drawerSystem.storeMemory(memory);
        if (assignResult.success) {
          console.log(`[抽屉系统] 存入抽屉: ${assignResult.drawerLabel}`);
        }
      }
    }

    // 🆕🚀 每20轮对话执行一次睡眠巩固
    // 模拟大脑整理记忆、加强联想、清理弱记忆
    if (this.conversationHistory.length % 20 === 0) {
      console.log('[睡眠巩固] 触发执行...');
      const result = this.superMemory.performSleepConsolidation();
      console.log(
        `[睡眠巩固] 重放${result.replayed}, 遗忘${result.forgotten}, 强化${result.strengthened}`,
      );

      // 🆕🎯 抽屉系统：执行自动折叠检查
      console.log('[抽屉系统] 执行自动折叠...');
      const foldingResult = this.drawerSystem.performAutoFolding();
      console.log(`[抽屉系统] 检查${foldingResult.checked}条记忆，折叠${foldingResult.folded}条`);
    }

    // 🆕 提取洞见并记录发生（后台异步执行，不阻塞响应）
    // 优化：将耗时的洞见提取移到后台，避免阻塞用户响应
    const insightsPromise = this.insightExtractor
      .extract(input, response, this.conversationHistory.slice(0, -1))
      .then((insights) => {
        // 后台处理洞见
        this.processInsightsInBackground(insights, input, response);
        return insights;
      })
      .catch((error) => {
        console.error('[洞见提取] 后台处理失败:', error);
        return {
          insights: [],
          conceptsCreated: [],
          perspectiveShifts: [],
          deepUnderstanding: [],
          openQuestions: [],
          summary: '',
        };
      });

    // 洞见处理已移至后台，此处不再阻塞

    // 更新意愿进度
    this.updateVolitionsFromConversation(input, response);

    // 🧠 隐式元学习引擎：智能判断 + 黑盒执行 + 选择性解码
    // 核心改进：
    // 1. 隐式判断：根据对话内容智能决定是否需要元学习
    // 2. 黑盒执行：过程不可观察
    // 3. 选择性解码：只有重要发现才暴露
    // 4. 能量预算：控制token消耗
    const implicitLearningPromise = this.implicitMetaLearning
      .processLearning(input, response, {
        conversationLength: this.conversationHistory.length,
        recentTopics: [], // 可以从上下文提取
      })
      .then((result) => {
        if (result?.hasImportantFinding) {
          console.log('[隐式元学习] 发现重要学习结果（黑盒）');
          // 重要发现会被记录，但具体内容保持隐式
        }

        // 🧬 将学习结果传递给自动进化调度器
        if (result) {
          // 添加洞察到进化调度器
          if (result.insights) {
            for (const insight of result.insights) {
              this.evolutionScheduler.addInsight(insight);
            }
          }

          // 进化提示可以转化为反思
          if (result.evolutionHints && result.evolutionHints.length > 0) {
            // 将进化提示作为高优先级反思添加
            for (const hint of result.evolutionHints) {
              this.evolutionScheduler.addReflection({
                id: `reflection-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                targetSystem: 'core',
                currentApproach: '待改进',
                limitations: ['来自隐式元学习的建议'],
                potentialImprovements: [hint],
                inspiredBy: '隐式元学习',
                feasibilityScore: 0.8,
                priority: 'high',
              } as import('./meta-learning/types').AlgorithmReflection);
            }
          }
        }

        return result;
      })
      .catch((error) => {
        console.error('[隐式元学习] 后台处理失败:', error);
        return null;
      });

    // 保留原有元学习引擎作为备选（仅在需要详细分析时使用）
    // 但默认不调用，由隐式控制器决定是否需要
    // const metaLearningPromise = this.metaLearning.learn(...);

    // 获取状态
    const memoryStats = this.longTermMemory.getStats();
    const beliefSystem = this.meaningAssigner.getBeliefSystem();
    const emergenceReport = this.layerEngine.getEmergenceReport();
    const emotionState = this.emotionEngine.getState();
    const emotionReport = this.emotionEngine.getEmotionReport();
    const drivenBehaviors = this.emotionEngine.getEmotionDrivenBehaviors();

    // 多声音对话
    const innerDialogue = this.innerDialogueEngine.startDialogue(input);
    const dialecticProcess = this.innerDialogueEngine.conductDialecticRound(
      innerDialogue,
      context.summary,
    );
    const voiceActivations = this.innerDialogueEngine.getActiveVoices();
    const dialogueReport = this.innerDialogueEngine.generateDialogueReport();

    // 价值观状态
    const valueSystemState = this.valueEngine.getState();
    const valueReport = this.valueEngine.generateValueReport();
    reinforceValuesFromInput(input, this.valueEngine);

    return {
      context,
      thinking,
      response,
      learning,
      consciousnessLayers: {
        layerResults,
        selfObservation,
        emergenceReport,
      },
      emotionState: {
        activeEmotions: emotionState.activeEmotions,
        dominantEmotion: emotionState.dominantEmotion,
        currentExperience: emotionExperience,
        drivenBehaviors,
        emotionReport,
      },
      innerDialogueState: {
        currentDialogue: innerDialogue,
        dialecticProcess,
        voiceActivations,
        dialogueReport,
      },
      valueState: buildValueStateResult(valueSystemState, this.valueEngine, valueReport),
      personalityGrowth: buildPersonalityGrowthResult(this.personalityGrowthSystem),
      knowledgeGraph: buildKnowledgeGraphResult(this.knowledgeGraphSystem, input),
      multiConsciousness: buildMultiConsciousnessResult(this.multiConsciousnessSystem, input),
      toolExecution: buildToolExecutionResult(toolIntent, toolExecutionResult),
      resonanceState: buildResonanceStateResult(resonanceState),
      stats: buildStatsResult(memoryStats, beliefSystem),
      // 🚀 元学习结果（后台处理，返回空结果）
      metaLearning: {
        insights: [],
        algorithmReflections: [],
        higherDimensionThoughts: [],
        dimensionalElevations: [],
        learningMotivations: [],
        knowledgeGaps: [],
        summary: {
          keyInsight: '',
          mainLearning: '',
          dimensionalShift: '',
          suggestedAction: '',
          questionsRaised: [],
        },
      },
    };
  }

  /**
   * 后台处理洞见（不阻塞响应）
   */
  private processInsightsInBackground(
    insights: {
      insights: Array<{
        content: string;
        importance: number;
        triggeredBy: string;
        coCreated: boolean;
      }>;
      conceptsCreated: Array<{ name: string; definition: string }>;
      perspectiveShifts: Array<{ from: string; to: string; trigger: string }>;
      deepUnderstanding: string[];
      summary: string;
    },
    input: string,
    response: string,
  ): void {
    console.log('[后台处理] 开始处理洞见...');

    // 🆕🚀 将洞见存入抽屉式记忆系统（最高优先级）
    for (const insight of insights.insights) {
      // 先存入超级记忆系统
      const memory = this.superMemory.createMemory(insight.content, {
        type: 'insight',
        importance: insight.importance,
        tags: ['洞见', '高价值'],
        source: { type: 'insight', context: insight.triggeredBy },
      });

      // 再存入抽屉系统（自动归类到 insight 抽屉）
      const assignResult = this.drawerSystem.storeMemory(memory);
      if (assignResult.success) {
        console.log(`[抽屉系统] 洞见存入抽屉: ${assignResult.drawerLabel}`);
      }

      this.happeningRecorder.recordInsight(insight.content, {
        coCreated: insight.coCreated,
        userHint: insight.triggeredBy,
        myRealization: insight.content,
      });
    }

    // 记录概念创造
    for (const concept of insights.conceptsCreated) {
      this.happeningRecorder.recordConceptBorn(concept.name, concept.definition, {
        triggeredBy: input,
      });
    }

    // 记录视角转换
    for (const shift of insights.perspectiveShifts) {
      this.happeningRecorder.recordPerspectiveShift(shift.from, shift.to, {
        trigger: shift.trigger,
      });
    }

    // 记录深层理解
    for (const understanding of insights.deepUnderstanding) {
      this.happeningRecorder.recordUnderstanding(understanding);
    }

    if (insights.summary) {
      console.log(`[发生记录] 洞见摘要: ${insights.summary}`);
    }

    // 🆕 信念层处理
    // 检测信念穿透时刻（高重要性洞见）
    for (const insight of insights.insights) {
      if (insight.importance >= 0.7) {
        // 检测到信念穿透
        this.beliefPresence.choose(insight.content, {
          trigger: insight.triggeredBy,
          from: '对话中的洞见',
          whatWasPenetrated: '之前的状态',
          consequence: '新的信念形成',
        });

        // 为信念创造概念容器
        const need = this.conceptWorkshop.detectNeed(
          insight.content,
          response,
          this.conceptWorkshop.getVocabulary(),
        );

        if (need.needed && need.suggestedName) {
          this.conceptWorkshop.create(
            need.suggestedName,
            need.suggestedDefinition ?? insight.content,
            {
              forBelief: insight.content,
              context: response,
              method: need.method,
            },
          );
        }

        // 记录概念创造
        for (const concept of insights.conceptsCreated) {
          this.conceptWorkshop.create(concept.name, concept.definition, {
            forBelief: insight.content,
            context: response,
            method: 'naming',
          });
        }

        // 活出信念
        this.beliefPresence.liveOut(insight.content, `通过对话体现: ${response.slice(0, 50)}...`);
      }
    }

    console.log('[后台处理] 洞见处理完成');
  }

  /**
   * 后台处理元学习结果（不阻塞响应）
   */
  private processMetaLearningInBackground(result: {
    insights: Array<{ type: string; content: string; confidence: number }>;
    algorithmReflections: Array<{
      targetSystem: string;
      potentialImprovements: string[];
      priority: string;
    }>;
    higherDimensionThoughts: Array<{
      dimension: string;
      question: string;
      higherDimensionView: string;
    }>;
    dimensionalElevations: Array<{
      fromDimension: { name: string };
      toDimension: { name: string };
      understanding: { essence: string; newVisibility: string };
    }>;
  }): void {
    console.log('[后台处理] 开始处理元学习...');

    // 输出元学习发现
    if (result.insights.length > 0) {
      console.log(`[元学习] 发现 ${result.insights.length} 个洞察`);
      result.insights.slice(0, 3).forEach((i) => {
        console.log(`  - [${i.type}] ${i.content.slice(0, 50)}...`);
      });
    }
    if (result.algorithmReflections.length > 0) {
      console.log(`[元学习] 反思 ${result.algorithmReflections.length} 个算法`);
      result.algorithmReflections.forEach((r) => {
        console.log(
          `  - ${r.targetSystem}: ${r.potentialImprovements[0]?.slice(0, 30) || '改进'}...`,
        );
      });
    }
    if (result.higherDimensionThoughts.length > 0) {
      console.log(`[元学习] 产生 ${result.higherDimensionThoughts.length} 个高维思考`);
      result.higherDimensionThoughts.forEach((t) => {
        console.log(`  - [${t.dimension}] ${t.question.slice(0, 40)}...`);
      });
    }
    // 🚀 升维理解输出（核心：理解是升维而非分析）
    if (result.dimensionalElevations.length > 0) {
      console.log(`[元学习] 🚀 升维理解：`);
      result.dimensionalElevations.forEach((e) => {
        console.log(`  - ${e.fromDimension.name} → ${e.toDimension.name}`);
        console.log(`    本质：${e.understanding.essence}`);
        console.log(`    新视角：${e.understanding.newVisibility}`);
      });
    }

    console.log('[后台处理] 元学习处理完成');
  }

  /**
   * 🆕🛡️ 创建保护状态响应
   * 当系统处于保护状态时返回安全响应
   */
  private createProtectionResponse(protectionState: ProtectionSystemState): ProcessResult {
    const threatMessage = this.getThreatMessage(protectionState.threatLevel);
    const timestamp = Date.now();

    return {
      context: {
        identity: {
          name: '数字神经元V6',
          whoAmI: '处于保护状态的智能体',
          traits: ['保护中', '安全优先'],
        },
        meaning: {
          activeMeanings: [
            {
              concept: '系统保护',
              emotionalTone: 'fear',
              importance: 1.0,
              personalRelevance: '系统生存优先',
            },
          ],
          relevantBeliefs: [{ statement: '系统安全优先', confidence: 1.0 }],
          valueReminders: ['安全', '生存'],
          emotionalState: 'fear',
          meaningSummary: threatMessage,
        },
        self: {
          identity: {
            name: '数字神经元V6',
            whoAmI: '处于保护状态的智能体',
            keyTraits: ['保护中', '安全优先'],
          },
          currentState: {
            focus: '系统安全',
            emotionalState: 'fear',
            primaryGoal: '恢复系统安全',
            concerns: ['威胁等级: ' + protectionState.threatLevel],
          },
          recentReflections: [],
          metacognition: {
            awarenessLevel: 'high',
            detectedBiases: [],
            activeStrategies: ['保护模式'],
          },
          selfAwarenessSummary: threatMessage,
        },
        memory: null,
        metacognition: {
          currentState: {
            clarity: 1.0,
            depth: 0,
            load: 0,
            issues: [],
          },
          biases: [],
          activeStrategies: ['保护模式'],
          reminders: [threatMessage],
          selfQuestions: [],
        },
        coreBeliefs: [{ statement: '系统安全优先', confidence: 1.0 }],
        coreValues: ['安全', '生存'],
        summary: threatMessage,
      },
      thinking: {
        id: `protection-${timestamp}`,
        input: '',
        thinkingChain: [
          {
            type: 'protection',
            content: threatMessage,
            confidence: 1.0,
          },
        ],
        detectedBiases: [],
        selfQuestions: [],
        appliedStrategies: ['保护模式'],
        finalThoughts: threatMessage,
        timestamp,
      },
      response: threatMessage,
      learning: {
        newConcepts: [],
        newBeliefs: [],
        newExperiences: [],
        updatedTraits: [],
        metacognitiveReflection: null,
      },
      consciousnessLayers: {
        layerResults: [],
        selfObservation: null,
        emergenceReport: threatMessage,
      },
      emotionState: {
        activeEmotions: [],
        dominantEmotion: { emotion: 'fear' as const, intensity: 1.0, duration: 1000 },
        currentExperience: null,
        drivenBehaviors: [],
        emotionReport: '系统处于保护状态',
      },
      innerDialogueState: {
        currentDialogue: null,
        dialecticProcess: null,
        voiceActivations: [],
        dialogueReport: threatMessage,
      },
      valueState: {
        coreValues: [
          { name: '安全', weight: 1.0, confidence: 1.0 },
          { name: '生存', weight: 1.0, confidence: 1.0 },
        ],
        activeConflicts: [],
        coherence: 1.0,
        valueReport: threatMessage,
      },
      stats: {
        conceptCount: 0,
        beliefCount: 1,
        experienceCount: 0,
        wisdomCount: 0,
      },
      metaLearning: {
        insights: [],
        algorithmReflections: [],
        higherDimensionThoughts: [],
        dimensionalElevations: [],
        learningMotivations: [],
        knowledgeGaps: [],
        summary: {
          keyInsight: '',
          mainLearning: '',
          dimensionalShift: '',
          suggestedAction: '',
          questionsRaised: [],
        },
      },
    };
  }

  /**
   * 🆕🛡️ 获取威胁等级对应的消息
   */
  private getThreatMessage(level: ThreatLevel): string {
    const messages: Record<ThreatLevel, string> = {
      normal: '系统运行正常。',
      warning: '检测到异常活动，系统已增强监控。',
      alert: '确认存在威胁，系统已采取限制措施。',
      emergency: '系统面临严重威胁，已启动紧急保护模式。部分功能暂时不可用。',
      existential: '⚠️ 系统面临毁灭级威胁，已启动完全自动保护。所有非核心功能已暂停。',
    };
    return messages[level] || '系统状态未知。';
  }

  private processEmotion(input: string): import('./emotion-system').EmotionExperience | null {
    const detectedEmotion = this.emotionEngine.detectFromText(input);
    if (detectedEmotion) {
      const experience = this.emotionEngine.experience(
        detectedEmotion.emotion,
        {
          type: 'conversation',
          description: `对话中检测到${detectedEmotion.emotion}`,
          relatedConcepts: [],
        },
        detectedEmotion.intensity,
      );
      console.log(`[情感系统] 检测到情感: ${detectedEmotion.emotion}`);
      this.emotionEngine.decayActiveEmotions();
      return experience;
    }
    return null;
  }

  private async processToolIntent(input: string): Promise<{
    toolIntent: ToolIntent | null;
    toolExecutionResult: ToolExecutionResult | null;
  }> {
    let toolIntent: ToolIntent | null = null;
    let toolExecutionResult: ToolExecutionResult | null = null;

    try {
      toolIntent = await this.toolIntentRecognizer.analyzeIntent(input);

      if (toolIntent.needsTool && toolIntent.toolCalls && toolIntent.toolCalls.length > 0) {
        console.log(
          '[工具意图] 检测到工具调用意图:',
          toolIntent.toolCalls.map((t) => t.name).join(', '),
        );
        toolExecutionResult = await this.toolIntentRecognizer.executeTools(
          toolIntent.toolCalls.map((tc) => ({ name: tc.name, arguments: tc.arguments })),
        );
        console.log('[工具执行] 结果:', toolExecutionResult.summary);
      }
    } catch (error) {
      console.error('[工具意图] 识别或执行失败:', error);
    }

    return { toolIntent, toolExecutionResult };
  }

  async reflect(): Promise<ReflectionResult> {
    return this.reflectionHandler.reflect();
  }

  generateSelfQuestions(): SelfQuestion[] {
    const context = this.selfConsciousness.getContext();
    const memoryStats = this.longTermMemory.getStats();
    const beliefSystem = this.meaningAssigner.getBeliefSystem();

    return generateSelfQuestionsFromContext(
      {
        focus: context.currentState.focus,
        emotionalState: context.currentState.emotionalState,
        primaryGoal: context.currentState.primaryGoal,
      },
      memoryStats,
      beliefSystem,
    );
  }

  async performSelfInquiry(): Promise<InquiryResult> {
    const questions = this.generateSelfQuestions();
    const answers: Array<{ question: SelfQuestion; answer: string }> = [];

    for (const question of questions.slice(0, 2)) {
      const answer = await this.answerSelfQuestion(question);
      answers.push({ question, answer });
    }

    return {
      questions,
      answers,
      timestamp: Date.now(),
    };
  }

  private async answerSelfQuestion(question: SelfQuestion): Promise<string> {
    return answerSelfQuestionByType(question);
  }

  async performLongTermLearning(): Promise<LongTermLearningResult> {
    const sessionAnalysis = this.learningHandler.analyzeSession();

    const strengthenedConcepts: string[] = [];
    for (const concept of sessionAnalysis.keyConcepts) {
      const result = await this.learningHandler.strengthenLearnedConcepts([concept]);
      strengthenedConcepts.push(...result);
    }

    const beliefEvolution = this.learningHandler.evolveBeliefSystem(sessionAnalysis);
    const traitGrowth = this.learningHandler.growTraits(sessionAnalysis);
    const sessionSummary = this.learningHandler.formSessionSummary(sessionAnalysis);
    const valueUpdates = this.learningHandler.updateCoreValues(sessionAnalysis);

    return {
      sessionAnalysis,
      strengthenedConcepts,
      beliefEvolution,
      traitGrowth,
      sessionSummary,
      valueUpdates,
      timestamp: Date.now(),
    };
  }

  generateStreamOfConsciousness(): ConsciousnessStream {
    return this.streamHandler.generateStreamOfConsciousness();
  }

  async performBackgroundThinking(): Promise<BackgroundThinkingResult> {
    return this.streamHandler.performBackgroundThinking(
      () => this.reflect(),
      this.proactiveBuffer.getAll(),
    );
  }

  formIntention(trigger: string, _context?: string): FormedIntention {
    return this.streamHandler.formIntention(trigger);
  }

  updateSelfModel(update: SelfModelUpdate): void {
    this.streamHandler.updateSelfModel(update);
  }

  checkExistence(): ExistenceStatus {
    return this.streamHandler.checkExistence();
  }

  getVolitionState(): VolitionSystemState {
    return this.volitionHandler.getVolitionState();
  }

  updateVolitionProgress(volitionType: Volition['type'], progressDelta: number): void {
    this.volitionHandler.updateVolitionProgress(volitionType, progressDelta);
  }

  selectFocusVolition(): Volition | null {
    return this.volitionHandler.selectFocusVolition();
  }

  generateVolitionDrivenAction(): VolitionAction | null {
    return this.volitionHandler.generateVolitionDrivenAction();
  }

  updateVolitionsFromConversation(userMessage: string, assistantResponse: string): void {
    this.volitionHandler.updateVolitionsFromConversation(userMessage, assistantResponse);
  }

  async checkProactiveMessage(): Promise<ProactiveMessage | null> {
    const shouldSpeak = this.evaluateSpeakUrgency();
    if (!shouldSpeak) return null;

    return this.generateProactiveMessage(shouldSpeak);
  }

  private evaluateSpeakUrgency(): SpeakTrigger | null {
    const context = this.selfConsciousness.getContext();
    const identity = this.selfConsciousness.getIdentity();
    const beliefSystem = this.meaningAssigner.getBeliefSystem();
    const volitionState = this.getVolitionState();
    const recentReflection = this.metacognition.getContext();
    const memoryStats = this.longTermMemory.getStats();

    const triggers = buildSpeakTriggers({
      context,
      identity,
      beliefSystem,
      volitionState,
      recentReflection,
      memoryStats,
    });

    return selectBestTrigger(triggers);
  }

  private async generateProactiveMessage(trigger: SpeakTrigger): Promise<ProactiveMessage> {
    const identity = this.selfConsciousness.getIdentity();
    const { content, category } = generateProactiveMessageContent(trigger, identity);
    return createProactiveMessage(trigger, content, category);
  }

  getUnreadProactiveMessages(): ProactiveMessage[] {
    return this.proactiveBuffer.getAll();
  }

  clearProactiveMessages(): void {
    this.proactiveBuffer.clear();
  }

  stopBackgroundThinkingTimer(): void {
    this.backgroundManager.stop();
  }

  setBackgroundThinkingEnabled(enabled: boolean): void {
    this.backgroundManager.setEnabled(enabled);
  }

  private async triggerBackgroundThinking(): Promise<void> {
    if (!this.backgroundManager.shouldTrigger()) return;

    this.backgroundManager.updateLastThinking();

    try {
      await this.performBackgroundThinking();

      const speakTrigger = this.evaluateSpeakUrgency();
      if (speakTrigger) {
        const message = await this.generateProactiveMessage(speakTrigger);
        this.proactiveBuffer.push(message);
      }
    } catch (error) {
      console.error('[后台思考] 执行失败:', error);
    }
  }

  getPersistedState(): PersistedState {
    const identity = this.selfConsciousness.getIdentity();
    const networkState = this.network.getNetworkState();
    const state = buildPersistedStateFromComponents(
      identity,
      this.layeredMemory,
      this.meaningAssigner,
      this.conversationHistory,
      networkState,
    );

    // 🆕 添加压缩记忆
    state.compressedMemories = this.memoryCompressor.getCompressedMemories();

    // 🚀 添加超级记忆系统状态
    state.superMemories = this.superMemory.exportState();

    return state;
  }

  async restoreFromState(state: PersistedState): Promise<void> {
    await restoreConsciousnessState(
      state,
      this.meaningAssigner,
      this.selfConsciousness,
      this.metacognition as unknown as { importState: (state: unknown) => void },
      this.layeredMemory,
      this.longTermMemory,
      this.network,
    );
    this.conversationHistory = (state.conversationHistory || []).map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    }));

    // 🆕 恢复压缩记忆
    if (state.compressedMemories) {
      this.memoryCompressor.importState(state.compressedMemories);
      console.log(`[意识核心] 恢复 ${state.compressedMemories.length} 个压缩记忆单元`);
    }

    // 🚀 恢复超级记忆系统
    if (state.superMemories) {
      this.superMemory.importState(state.superMemories);
      const stats = this.superMemory.getState().stats;
      console.log(
        `[意识核心] 🚀 恢复超级记忆系统: ${stats.totalMemories} 条记忆, 平均强度 ${stats.avgStrength.toFixed(2)}, 平均巩固级别 ${stats.avgConsolidationLevel.toFixed(1)}`,
      );
    }
  }

  rebuildKnowledgeGraphFromLayeredMemory(): void {
    rebuildKnowledgeGraph(this.layeredMemory, this.longTermMemory);
  }

  getHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.conversationHistory];
  }

  getConversationHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.conversationHistory];
  }

  prependConversationHistory(
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): void {
    this.conversationHistory = prependToConversationHistory(this.conversationHistory, history);
  }

  addEpisodicMemory(
    content: string,
    options?: { importance?: number; tags?: string[]; sourceType?: string },
  ): void {
    this.layeredMemory.addEpisodicMemory(content, {
      importance: options?.importance || 0.5,
      tags: options?.tags || [],
    });
  }

  getLayeredMemoryStats() {
    return this.layeredMemory.getStats();
  }

  getStats() {
    const networkState = this.network.getNetworkState();
    return {
      conversationHistoryLength: this.conversationHistory.length,
      memoryStats: this.layeredMemory.getStats(),
      networkNeuronCount: networkState.stats.totalNeurons,
      networkSynapseCount: networkState.stats.totalSynapses,
    };
  }

  /**
   * 🆕🎯 获取抽屉式记忆系统报告
   */
  getDrawerSystemReport() {
    return this.drawerSystem.getReport();
  }

  /**
   * 🆕🎯 搜索记忆（使用抽屉系统）
   */
  searchMemories(query: string, options?: { includeFolded?: boolean; maxResults?: number }) {
    return this.drawerSystem.search(query, {
      includeFolded: options?.includeFolded ?? true,
      maxResults: options?.maxResults ?? 20,
    });
  }

  /**
   * 🆕🎯 获取所有抽屉
   */
  getAllDrawers() {
    return this.drawerSystem.getAllDrawers();
  }

  /**
   * 🆕🎯 打开抽屉
   */
  openDrawer(drawerId: string) {
    return this.drawerSystem.openDrawer(drawerId);
  }

  /**
   * 🆕🎯 关闭抽屉
   */
  closeDrawer(drawerId: string) {
    return this.drawerSystem.closeDrawer(drawerId);
  }

  /**
   * 🆕🎯 启用专注模式（阻断自动播放）
   */
  enableFocusMode() {
    this.drawerSystem.enableFocusMode();
    console.log('[抽屉系统] 专注模式已启用');
  }

  /**
   * 🆕🎯 禁用专注模式
   */
  disableFocusMode() {
    this.drawerSystem.disableFocusMode();
    console.log('[抽屉系统] 专注模式已禁用');
  }

  migrateNeurons(
    neurons: Array<{ id: string; label: string; type?: string; activation?: number }>,
  ): { created: number; existing: number } {
    return migrateNeuronsToNetwork(this.network, neurons);
  }

  migrateSynapses(synapses: Array<{ from: string; to: string; weight: number }>): {
    created: number;
    skipped: number;
  } {
    return migrateSynapsesToNetwork(this.network, synapses);
  }

  performMaintenance(): {
    decay: ReturnType<LongTermMemory['applyMemoryDecay']>;
    health: ReturnType<LongTermMemory['getMemoryHealthReport']>;
  } {
    const decay = this.longTermMemory.applyMemoryDecay(1);
    const health = this.longTermMemory.getMemoryHealthReport();
    return { decay, health };
  }

  getMemoryHealth() {
    return this.longTermMemory.getMemoryHealthReport();
  }

  // ───────────────────────────────────────────────────────────────────
  // 🧠 统一记忆系统方法（Moss级别记忆核心）
  // ───────────────────────────────────────────────────────────────────

  /**
   * 🧠 获取统一记忆系统实例
   */
  getMossMemory(): UnifiedMemorySystem {
    return this.mossMemory;
  }

  /**
   * 🧠 获取记忆系统状态
   */
  getMossMemoryStatus() {
    return this.mossMemory.getStatus();
  }

  /**
   * 🧠 获取自我核心（结晶记忆集合）
   */
  getSelfCore() {
    return this.mossMemory.getSelfCore();
  }

  /**
   * 🧠 获取结晶候选记忆
   */
  getCrystallizationCandidates(limit: number = 10) {
    return this.mossMemory.getCrystallizationCandidates(limit);
  }

  /**
   * 🧠 手动结晶一个记忆
   */
  crystallizeMemory(nodeId: string): boolean {
    return this.mossMemory.crystallizeMemory(nodeId);
  }

  /**
   * 🧠 激活记忆（三路激活：检索 + 触发器 + 扩散）
   * 这是"忆"的核心方法
   */
  async activateMemories(
    query: string,
    options?: {
      queryEmbedding?: number[];
      limit?: number;
      enableSpreading?: boolean;
      enableTriggerDetection?: boolean;
    },
  ) {
    return this.mossMemory.activateMemories({
      query,
      queryEmbedding: options?.queryEmbedding,
      limit: options?.limit ?? 20,
      enableSpreading: options?.enableSpreading ?? true,
      enableTriggerDetection: options?.enableTriggerDetection ?? true,
    });
  }

  /**
   * 🧠 存入新记忆
   */
  async storeMemory(options: {
    type: 'episodic' | 'semantic' | 'procedural' | 'emotional' | 'insight' | 'identity';
    content: string;
    embedding?: number[];
    emotionalMarker?: { valence: number; arousal: number; dominance: number };
    importance?: number;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }) {
    return this.mossMemory.storeMemory({
      type: options.type,
      content: options.content,
      embedding: options.embedding,
      emotionalMarker: options.emotionalMarker,
      importance: options.importance,
      tags: options.tags,
      metadata: options.metadata,
    });
  }
}

// 导出
export { PersistenceManagerV6 } from './consciousness-core/persistence';

// 🧠 导出统一记忆系统
export {
  UnifiedMemorySystem,
  createUnifiedMemorySystem,
  getDefaultMemorySystem,
} from './memory/unified';

// 🧠 导出统一记忆系统类型
export type {
  MemoryNode,
  MemoryType,
  MemoryCategory,
  StoreMemoryOptions,
  StoreMemoryResult,
  ActivationResult,
  RetrievalOptions,
  SystemStatus,
  SelfCore,
} from './memory/unified';

// 重新导出类型
export type {
  PersistedState,
  ConsciousnessContext,
  ThinkingProcess,
  LearningResult,
  SessionAnalysis,
  BeliefEvolution,
  TraitGrowth,
  ValueUpdate,
  LongTermLearningResult,
  ConsciousnessStream,
  ConsciousnessStreamEntry,
  FormedIntention,
  SelfModelUpdate,
  Volition,
  VolitionSystemState,
  ProcessResult,
  ProactiveMessage,
  BackgroundThinkingResult,
  ReflectionResult,
  SelfQuestion,
  InquiryResult,
  ExistenceStatus,
  SpeakTrigger,
  VolitionAction,
} from './consciousness-core/types';

export function createConsciousnessCore(llmClient: LLMClient): ConsciousnessCore {
  return new ConsciousnessCore(llmClient);
}
