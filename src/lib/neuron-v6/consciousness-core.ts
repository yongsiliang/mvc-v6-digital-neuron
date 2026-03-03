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
import { 
  MeaningAssigner, 
  createMeaningAssigner,
} from './meaning-system';
import { 
  SelfConsciousness, 
  createSelfConsciousness 
} from './self-consciousness';
import { 
  LongTermMemory, 
  createLongTermMemory 
} from './long-term-memory';
import { 
  LayeredMemorySystem,
} from './layered-memory';
import {
  UnifiedMemoryManager,
  createUnifiedMemoryManager,
} from './memory/unified-manager';
import {
  HappeningRecorder,
  createHappeningRecorder,
} from './memory/happening-recorder';
import {
  InsightExtractor,
  createInsightExtractor,
} from './memory/insight-extractor';
import {
  MemoryCompressor,
  createMemoryCompressor,
} from './memory/memory-compressor';
import {
  DynamicContextBuilder,
  createDynamicContextBuilder,
} from './memory/dynamic-context';
import {
  SuperMemorySystem,
  createSuperMemorySystem,
} from './memory/super-memory';
import {
  DrawerMemorySystem,
} from './memory/drawer';
import {
  MetaLearningEngine,
  createMetaLearningEngine,
} from './meta-learning';
import {
  BeliefPresence,
  createBeliefPresence,
} from './belief/presence';
import {
  ConceptWorkshop,
  createConceptWorkshop,
} from './belief/concept-workshop';
import {
  IntuitiveRetriever,
  createIntuitiveRetriever,
} from './belief/intuitive-retriever';
import { 
  MetacognitionEngine, 
  createMetacognitionEngine 
} from './metacognition';
import { 
  ConsciousnessLayerEngine,
  createConsciousnessLayerEngine
} from './consciousness-layers';
import { 
  InnerMonologueEngine,
  createInnerMonologueEngine
} from './inner-monologue';
import { 
  EmotionEngine,
  createEmotionEngine,
} from './emotion-system';
import { 
  InnerDialogueEngine,
  DialecticThinkingEngine,
} from './inner-dialogue';
import { 
  ValueEvolutionEngine,
} from './value-evolution';
import { 
  PersonalityGrowthSystem,
} from './personality-growth';
import { 
  KnowledgeGraphSystem,
  createKnowledgeGraphSystem,
} from './knowledge-graph';
import { 
  MultiConsciousnessSystem,
  createMultiConsciousnessSystem,
} from './multi-consciousness';
import { 
  KeyInfoExtractor,
  createKeyInfoExtractor
} from './key-info-extractor';
import { 
  ToolIntentRecognizer,
  ToolIntent,
  ToolExecutionResult,
  createToolIntentRecognizer
} from './tool-intent-recognizer';
import { 
  ResonanceEngine,
  createResonanceEngine,
} from './resonance-engine';
import { PersistenceManagerV6 } from './consciousness-core/persistence';

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
import {
  rebuildKnowledgeGraph,
} from './consciousness-core/memory-helpers';
import {
  syncCreatorFromDatabase,
} from './consciousness-core/creator-helpers';
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
  private unifiedMemoryManager!: UnifiedMemoryManager;  // 🆕 统一记忆管理器
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
      workingMemoryCapacity: 30,  // 🆕 增加容量到 30，匹配主流上下文能力
      enableAssociations: true,
    });
    
    // 初始化发生记录器和洞见提取器
    this.happeningRecorder = createHappeningRecorder();
    this.insightExtractor = createInsightExtractor(llmClient);
    
    // 🆕 初始化智能记忆压缩系统（超越主流的关键）
    this.memoryCompressor = createMemoryCompressor(llmClient, {
      compressionThreshold: 20,     // 20轮对话后触发压缩
      compressionBatchSize: 15,     // 每次压缩15轮
      preserveRecentTurns: 10,      // 保留最近10轮不压缩
    });
    this.dynamicContextBuilder = createDynamicContextBuilder(llmClient, {
      maxTokenBudget: 30000,        // 30K tokens 预算
    });
    
    // 🆕🚀 初始化超越传统的超级记忆系统
    // 核心：艾宾浩斯遗忘曲线 + 情感加权 + 联想网络 + 睡眠巩固
    this.superMemory = createSuperMemorySystem({
      maxMemories: 10000,           // 最多存储10000条记忆
      emotionalWeight: 0.4,         // 情感权重40%
      associationThreshold: 0.3,    // 联想阈值30%
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
    this.intuitiveRetriever = createIntuitiveRetriever(this.beliefPresence, this.unifiedMemoryManager);
    
    // 初始化后台思考和主动消息管理器
    this.backgroundManager = new BackgroundThinkingManager({ intervalMs: 30000, minIntervalMs: 60000 });
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
      unifiedMemoryManager: this.unifiedMemoryManager,  // 🆕 传入统一记忆管理器
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
      superMemory: this.superMemory,  // 🚀 传入超级记忆系统
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
      input, context, thinking, toolExecutionResult
    );
    
    // 学习过程
    this.resonanceEngine.activateSubsystem('metacongition', 0.7);
    this.resonanceEngine.activateSubsystem('self', 0.6);
    
    const extractionResult = this.keyInfoExtractor.extract(input, response);
    const learning = await this.learningHandler.learn(
      input, response,
      {
        keyInfos: extractionResult.keyInfos,
        shouldRemember: extractionResult.shouldRemember ?? false,
        memoryPriority: extractionResult.memoryPriority ?? 'medium',
        summary: extractionResult.summary ?? '',
      },
      thinking
    );
    
    // 更新对话历史
    this.conversationHistory = updateConversationHistory(
      this.conversationHistory, input, response
    );
    
    // 🆕 智能记忆压缩（超越主流的关键）
    // 检查是否需要压缩（后台异步执行，不阻塞响应）
    if (this.memoryCompressor.shouldCompress(this.conversationHistory)) {
      // 后台执行压缩，不阻塞响应
      this.memoryCompressor.compress(this.conversationHistory)
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
        .catch(error => {
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
          type: keyInfo.type === 'preference' ? 'emotional' : 
                keyInfo.type === 'person' ? 'episodic' : 'semantic',
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
      console.log(`[睡眠巩固] 重放${result.replayed}, 遗忘${result.forgotten}, 强化${result.strengthened}`);
      
      // 🆕🎯 抽屉系统：执行自动折叠检查
      console.log('[抽屉系统] 执行自动折叠...');
      const foldingResult = this.drawerSystem.performAutoFolding();
      console.log(`[抽屉系统] 检查${foldingResult.checked}条记忆，折叠${foldingResult.folded}条`);
    }
    
    // 🆕 提取洞见并记录发生（后台异步执行，不阻塞响应）
    // 优化：将耗时的洞见提取移到后台，避免阻塞用户响应
    const insightsPromise = this.insightExtractor.extract(
      input, response, this.conversationHistory.slice(0, -1)
    ).then(insights => {
      // 后台处理洞见
      this.processInsightsInBackground(insights, input, response);
      return insights;
    }).catch(error => {
      console.error('[洞见提取] 后台处理失败:', error);
      return { insights: [], conceptsCreated: [], perspectiveShifts: [], deepUnderstanding: [], openQuestions: [], summary: '' };
    });
    
    // 洞见处理已移至后台，此处不再阻塞
    
    // 更新意愿进度
    this.updateVolitionsFromConversation(input, response);
    
    // 🚀 元学习引擎：后台异步执行，不阻塞响应
    // 优化：将元学习移到后台，避免阻塞用户响应
    const metaLearningPromise = this.metaLearning.learn(
      input,
      response,
      this.conversationHistory.slice(0, -1),
      {
        recentLearnings: learning.newExperiences,
        activeGoals: [],
        knownConcepts: [],
      }
    ).then(result => {
      this.processMetaLearningInBackground(result);
      return result;
    }).catch(error => {
      console.error('[元学习] 后台处理失败:', error);
      return {
        insights: [],
        algorithmReflections: [],
        higherDimensionThoughts: [],
        dimensionalElevations: [],
        learningMotivations: [],
        knowledgeGaps: [],
        summary: '元学习处理失败',
      };
    });
    
    // 获取状态
    const memoryStats = this.longTermMemory.getStats();
    const beliefSystem = this.meaningAssigner.getBeliefSystem();
    const emergenceReport = this.layerEngine.getEmergenceReport();
    const emotionState = this.emotionEngine.getState();
    const emotionReport = this.emotionEngine.getEmotionReport();
    const drivenBehaviors = this.emotionEngine.getEmotionDrivenBehaviors();
    
    // 多声音对话
    const innerDialogue = this.innerDialogueEngine.startDialogue(input);
    const dialecticProcess = this.innerDialogueEngine.conductDialecticRound(innerDialogue, context.summary);
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
      insights: Array<{ content: string; importance: number; triggeredBy: string; coCreated: boolean }>;
      conceptsCreated: Array<{ name: string; definition: string }>;
      perspectiveShifts: Array<{ from: string; to: string; trigger: string }>;
      deepUnderstanding: string[];
      summary: string;
    },
    input: string,
    response: string
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
          this.conceptWorkshop.getVocabulary()
        );
        
        if (need.needed && need.suggestedName) {
          this.conceptWorkshop.create(
            need.suggestedName,
            need.suggestedDefinition ?? insight.content,
            {
              forBelief: insight.content,
              context: response,
              method: need.method,
            }
          );
        }
        
        // 记录概念创造
        for (const concept of insights.conceptsCreated) {
          this.conceptWorkshop.create(
            concept.name,
            concept.definition,
            {
              forBelief: insight.content,
              context: response,
              method: 'naming',
            }
          );
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
    algorithmReflections: Array<{ targetSystem: string; potentialImprovements: string[]; priority: string }>;
    higherDimensionThoughts: Array<{ dimension: string; question: string; higherDimensionView: string }>;
    dimensionalElevations: Array<{ fromDimension: { name: string }; toDimension: { name: string }; understanding: { essence: string; newVisibility: string } }>;
  }): void {
    console.log('[后台处理] 开始处理元学习...');
    
    // 输出元学习发现
    if (result.insights.length > 0) {
      console.log(`[元学习] 发现 ${result.insights.length} 个洞察`);
      result.insights.slice(0, 3).forEach(i => {
        console.log(`  - [${i.type}] ${i.content.slice(0, 50)}...`);
      });
    }
    if (result.algorithmReflections.length > 0) {
      console.log(`[元学习] 反思 ${result.algorithmReflections.length} 个算法`);
      result.algorithmReflections.forEach(r => {
        console.log(`  - ${r.targetSystem}: ${r.potentialImprovements[0]?.slice(0, 30) || '改进'}...`);
      });
    }
    if (result.higherDimensionThoughts.length > 0) {
      console.log(`[元学习] 产生 ${result.higherDimensionThoughts.length} 个高维思考`);
      result.higherDimensionThoughts.forEach(t => {
        console.log(`  - [${t.dimension}] ${t.question.slice(0, 40)}...`);
      });
    }
    // 🚀 升维理解输出（核心：理解是升维而非分析）
    if (result.dimensionalElevations.length > 0) {
      console.log(`[元学习] 🚀 升维理解：`);
      result.dimensionalElevations.forEach(e => {
        console.log(`  - ${e.fromDimension.name} → ${e.toDimension.name}`);
        console.log(`    本质：${e.understanding.essence}`);
        console.log(`    新视角：${e.understanding.newVisibility}`);
      });
    }
    
    console.log('[后台处理] 元学习处理完成');
  }

  private processEmotion(input: string): import('./emotion-system').EmotionExperience | null {
    const detectedEmotion = this.emotionEngine.detectFromText(input);
    if (detectedEmotion) {
      const experience = this.emotionEngine.experience(
        detectedEmotion.emotion,
        { type: 'conversation', description: `对话中检测到${detectedEmotion.emotion}`, relatedConcepts: [] },
        detectedEmotion.intensity
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
        console.log('[工具意图] 检测到工具调用意图:', toolIntent.toolCalls.map(t => t.name).join(', '));
        toolExecutionResult = await this.toolIntentRecognizer.executeTools(
          toolIntent.toolCalls.map(tc => ({ name: tc.name, arguments: tc.arguments }))
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
      beliefSystem
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
      this.proactiveBuffer.getAll()
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
      networkState
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
      this.network
    );
    this.conversationHistory = (state.conversationHistory || []).map(h => ({
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
      console.log(`[意识核心] 🚀 恢复超级记忆系统: ${stats.totalMemories} 条记忆, 平均强度 ${stats.avgStrength.toFixed(2)}, 平均巩固级别 ${stats.avgConsolidationLevel.toFixed(1)}`);
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

  prependConversationHistory(history: Array<{ role: 'user' | 'assistant'; content: string }>): void {
    this.conversationHistory = prependToConversationHistory(this.conversationHistory, history);
  }

  addEpisodicMemory(content: string, options?: { importance?: number; tags?: string[]; sourceType?: string }): void {
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

  migrateNeurons(neurons: Array<{ id: string; label: string; type?: string; activation?: number }>): { created: number; existing: number } {
    return migrateNeuronsToNetwork(this.network, neurons);
  }

  migrateSynapses(synapses: Array<{ from: string; to: string; weight: number }>): { created: number; skipped: number } {
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
  async activateMemories(query: string, options?: {
    queryEmbedding?: number[];
    limit?: number;
    enableSpreading?: boolean;
    enableTriggerDetection?: boolean;
  }) {
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
