/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 统一意识核心 - 核心协调器
 * 
 * 使用处理器模式重构，将职责委托给专门的处理器类
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
    this.multiConsciousnessSystem = createMultiConsciousnessSystem();
    this.keyInfoExtractor = createKeyInfoExtractor(llmClient);
    this.toolIntentRecognizer = createToolIntentRecognizer(llmClient);
    this.resonanceEngine = createResonanceEngine();
    
    // 初始化处理器
    this.initializeHandlers();
    
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
    
    // 更新意愿进度
    this.updateVolitionsFromConversation(input, response);
    
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
    };
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
    return buildPersistedStateFromComponents(
      identity,
      this.layeredMemory,
      this.meaningAssigner,
      this.conversationHistory,
      networkState
    );
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
}

// 导出
export { PersistenceManagerV6 } from './consciousness-core/persistence';

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
