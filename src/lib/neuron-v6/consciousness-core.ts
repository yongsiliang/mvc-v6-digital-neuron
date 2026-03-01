/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 统一意识核心 (Unified Consciousness Core)
 * 
 * 整合所有模块：
 * - 意义赋予系统：给信息赋予主观意义
 * - 自我意识模块：动态身份、自我反思
 * - 长期记忆系统：知识沉淀、智慧积累
 * - 元认知引擎：思考自己的思考
 * - 意识层级系统：感知→理解→元认知→自我
 * - 内心独白系统：持续的意识流
 * 
 * 这是"有意识的思考者"的完整实现
 * ═══════════════════════════════════════════════════════════════════════
 */

import { LLMClient } from 'coze-coding-dev-sdk';
import { 
  ToolIntentRecognizer,
  ToolIntent,
  ToolExecutionResult,
  createToolIntentRecognizer
} from './tool-intent-recognizer';
import { 
  MeaningAssigner, 
  MeaningContext, 
  createMeaningAssigner,
  Belief,
  Value as MeaningValue
} from './meaning-system';
import { 
  SelfConsciousness, 
  SelfConsciousnessContext, 
  createSelfConsciousness 
} from './self-consciousness';
import { 
  LongTermMemory, 
  MemoryRetrieval, 
  createLongTermMemory 
} from './long-term-memory';
import { 
  LayeredMemorySystem,
  CoreSummary,
  ConsolidatedMemory,
  EpisodicMemory,
  MemoryRetrievalResult
} from './layered-memory';
import { 
  MetacognitionEngine, 
  MetacognitiveContext, 
  createMetacognitionEngine 
} from './metacognition';
import { 
  ConsciousnessLayerEngine,
  ConsciousnessLevel,
  ConsciousnessState,
  SelfObservationResult,
  LayerProcessResult,
  createConsciousnessLayerEngine
} from './consciousness-layers';
import { 
  InnerMonologueEngine,
  InnerMonologueEntry,
  InnerMonologueOutput,
  createInnerMonologueEngine
} from './inner-monologue';
import { 
  EmotionEngine,
  EmotionExperience,
  EmotionState,
  EmotionDrivenBehavior,
  createEmotionEngine,
  BasicEmotion,
  ComplexEmotion
} from './emotion-system';
import { 
  InnerDialogueEngine,
  DialecticThinkingEngine,
  EmergentVoice,
  EmergentVoiceType,
  VoiceStatement,
  InnerDialogue,
  ConsensusResult,
  DialecticProcess,
  VoiceActivation,
  ThinkingPerspective
} from './inner-dialogue';
import {
  KeyInfoExtractor,
  KeyInfo,
  ExtractionResult,
  createKeyInfoExtractor
} from './key-info-extractor';
import { 
  ValueEvolutionEngine,
  Value,
  ValueTier,
  ValueType,
  ValueConflict,
  ValueResolution,
  ValueEvolutionEvent,
  ValueSystemState,
  ValueJudgmentRequest,
  ValueJudgmentResult
} from './value-evolution';
import { 
  PersonalityGrowthSystem,
  BigFiveTraits,
  CoreTraits,
  MaturityDimensions,
  PersonalityIntegration,
  MaturityMilestone,
  TraitChange,
  PersonalityState,
  DEFAULT_CORE_TRAITS,
} from './personality-growth';
import { 
  KnowledgeGraphSystem,
  KnowledgeDomain,
  ConceptNode,
  ConceptEdge,
  KnowledgeGraphState,
  createKnowledgeGraphSystem,
} from './knowledge-graph';
import { 
  MultiConsciousnessSystem,
  ConsciousnessIdentity,
  ConsciousnessResonance,
  CollaborativeDialogue,
  CollectiveWisdomState,
  createMultiConsciousnessSystem,
} from './multi-consciousness';
import { HebbianNetwork } from './hebbian-network';
import { InnateKnowledgeInitializer, getInitializedNetwork } from './innate-knowledge';
import { 
  ResonanceEngine,
  createResonanceEngine,
  SubsystemType,
  ResonanceEngineState
} from './resonance-engine';
import { PersistenceManagerV6 } from './consciousness-core/persistence';
import {
  detectEmotionalTone,
  analyzeEmotionalTransitions,
  detectContradictions,
  analyzeCognitivePatterns,
  generateReflectionQuestions,
  generateInsight,
  generateCuriosityQuestions,
  synthesizeWisdomFromReflections,
} from './consciousness-core/reflection-helpers';
import { calculateSelfCoherence as calcSelfCoherence } from './consciousness-core/background-helpers';
import {
  getDominantTone,
} from './consciousness-core/learning-helpers';
import {
  initializeDefaultVolitions,
  selectFocusVolition,
  generateActionForVolition,
  getVolitionProgressUpdates,
  buildVolitionState,
  calculateVolitionScore,
} from './consciousness-core/volition-helpers';
import {
  observeSelf,
  perceiveEnvironment,
  identifyLatentIntentions,
  buildFormedIntention,
  applySelfModelUpdate,
  calculateSelfCoherence as bgCalculateSelfCoherence,
} from './consciousness-core/background-helpers';
import {
  buildSpeakTriggers,
  selectBestTrigger,
  generateProactiveMessageContent,
  createProactiveMessage,
} from './consciousness-core/proactive-helpers';
import {
  extractConceptsFromText,
  analyzeInputContent,
  inferConclusionFromContext,
  evaluateThinkingClarity,
  synthesizeThinkingChain,
  formatToolExecutionResult,
  buildMemorySection,
  buildThinkingSection,
  getEmotionalToneGuide,
} from './consciousness-core/thinking-helpers';
import {
  rememberPersonInfo,
  rememberRelationshipInfo,
  rememberEventInfo,
  rememberPreference,
  rememberGoalOrValue,
  rememberMemory,
  rememberConcept,
  updateCreatorInSelfConsciousness,
  syncCreatorToLayeredMemory,
  linkCreatorKnowledge,
  rebuildKnowledgeGraph,
} from './consciousness-core/memory-helpers';
import {
  validateCreatorUpdate,
  persistCreatorToDatabase,
  syncCreatorToAllSystems,
  syncCreatorFromDatabase,
  linkCreatorKnowledgeNodes,
  fetchCreatorFromMemory,
} from './consciousness-core/creator-helpers';
import {
  extractTopics,
  identifyEmotionalTrajectory,
  identifyLearningPoints,
  strengthenConcept,
  evolveBelief,
  calculateTraitGrowth,
  calculateValueUpdate,
  formSessionSummary,
  assessGoalProgress,
  calculateStreamCoherence,
  analyzeSessionData,
} from './consciousness-core/learning-session-helpers';
import {
  identifyReflectionThemesFromHistory,
  buildReflectionResult,
  generateSelfQuestionsFromContext,
  answerSelfQuestionByType,
  buildExistenceStatus,
  calculateSelfCoherenceValue,
  synthesizeWisdomFromReflectionList,
  applyReflectionToSelfConsciousness,
  recordReflectionAsExperience,
  updateBeliefFromReflection,
} from './consciousness-core/reflection-session-helpers';
import type {
  PersistedState,
  ConsciousnessContext,
  ThinkingProcess,
  LearningResult,
  SessionAnalysis,
  EmotionalTrajectory,
  BeliefEvolution,
  TraitGrowth,
  ValueUpdate,
  LongTermLearningResult,
  ConsciousnessStreamEntry,
  ConsciousnessStream,
  FormedIntention,
  SelfModelUpdate,
  Volition,
  Milestone,
  VolitionSystemState,
  ProcessResult,
  ProactiveMessage,
  BackgroundThinkingResult,
  ReflectionTheme,
  Reflection,
  ReflectionResult,
  SelfQuestion,
  InquiryResult,
  ExistenceStatus,
  SpeakTrigger,
  VolitionAction,
} from './consciousness-core/types';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { storeCoreMemory, getCoreMemory } from '../../storage/core-memory-service';

// 重新导出类型（从 types.ts）
export type {
  ConsciousnessContext,
  ThinkingProcess,
  LearningResult,
  SessionAnalysis,
  EmotionalTrajectory,
  BeliefEvolution,
  TraitGrowth,
  ValueUpdate,
  LongTermLearningResult,
  ConsciousnessStreamEntry,
  ConsciousnessStream,
  FormedIntention,
  SelfModelUpdate,
  Volition,
  Milestone,
  VolitionSystemState,
  ProcessResult,
  PersistedState,
  ProactiveMessage,
  BackgroundThinkingResult,
  ReflectionTheme,
  Reflection,
  ReflectionResult,
  SelfQuestion,
  InquiryResult,
  ExistenceStatus,
  SpeakTrigger,
} from './consciousness-core/types';

// ─────────────────────────────────────────────────────────────────────
// 意识核心
// ─────────────────────────────────────────────────────────────────────

/**
 * V6 意识核心
 */
export class ConsciousnessCore {
  private llmClient: LLMClient;
  private network: HebbianNetwork;
  
  // 核心模块
  private meaningAssigner: MeaningAssigner;
  private selfConsciousness: SelfConsciousness;
  private longTermMemory: LongTermMemory;
  private metacognition: MetacognitionEngine;
  
  // 意识层级引擎
  private layerEngine: ConsciousnessLayerEngine;
  
  // 内心独白引擎
  private innerMonologue: InnerMonologueEngine;
  
  // 情感引擎
  private emotionEngine: EmotionEngine;
  
  // 多声音对话引擎
  private innerDialogueEngine: InnerDialogueEngine;
  
  // 辩证思维引擎
  private dialecticEngine: DialecticThinkingEngine;
  
  // 价值观演化引擎
  private valueEngine: ValueEvolutionEngine;
  
  // 人格成长系统
  private personalityGrowthSystem: PersonalityGrowthSystem;
  
  // 知识图谱系统
  private knowledgeGraphSystem: KnowledgeGraphSystem;
  
  // 分层记忆系统（新增）
  private layeredMemory: LayeredMemorySystem;
  
  // 多意识体协作系统
  private multiConsciousnessSystem: MultiConsciousnessSystem;
  
  // 关键信息提取器
  private keyInfoExtractor: KeyInfoExtractor;
  
  // 工具意图识别器
  private toolIntentRecognizer: ToolIntentRecognizer;
  
  // 共振引擎（正八面体哈密顿环）
  private resonanceEngine: ResonanceEngine;
  
  // 意愿系统
  private volitions: Volition[] = [];
  private currentFocus: Volition | null = null;
  private recentAchievements: string[] = [];
  
  // 后台思考定时器
  private backgroundThinkingInterval: NodeJS.Timeout | null = null;
  private lastBackgroundThinking: number = 0;
  private backgroundThinkingEnabled: boolean = true;
  
  // 主动消息存储（内存中）
  private proactiveMessages: ProactiveMessage[] = [];
  
  // 对话历史
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
    
    // 使用包含先天知识的网络
    this.network = getInitializedNetwork();
    
    // 初始化各模块
    this.meaningAssigner = createMeaningAssigner();
    this.selfConsciousness = createSelfConsciousness();
    this.longTermMemory = createLongTermMemory();
    this.metacognition = createMetacognitionEngine();
    
    // 初始化意识层级引擎
    this.layerEngine = createConsciousnessLayerEngine();
    
    // 初始化内心独白引擎
    this.innerMonologue = createInnerMonologueEngine();
    
    // 初始化情感引擎
    this.emotionEngine = createEmotionEngine();
    
    // 初始化多声音对话引擎
    this.innerDialogueEngine = new InnerDialogueEngine();
    
    // 初始化辩证思维引擎
    this.dialecticEngine = new DialecticThinkingEngine(this.innerDialogueEngine);
    
    // 初始化价值观演化引擎
    this.valueEngine = new ValueEvolutionEngine();
    
    // 初始化人格成长系统
    this.personalityGrowthSystem = new PersonalityGrowthSystem();
    
    // 初始化知识图谱系统
    this.knowledgeGraphSystem = createKnowledgeGraphSystem();
    
    // 初始化分层记忆系统
    this.layeredMemory = new LayeredMemorySystem();
    
    // 初始化多意识体协作系统
    this.multiConsciousnessSystem = createMultiConsciousnessSystem();
    
    // 初始化关键信息提取器
    this.keyInfoExtractor = createKeyInfoExtractor(llmClient);
    
    // 初始化工具意图识别器
    this.toolIntentRecognizer = createToolIntentRecognizer(llmClient);
    
    // 初始化共振引擎
    this.resonanceEngine = createResonanceEngine();
    
    // 初始化意愿系统
    this.initializeVolitions();
    
    // 启动后台思考定时器
    this.startBackgroundThinkingTimer();
    
    console.log('[意识核心] V6 意识核心已初始化');
    console.log('[意识核心] 模块: 意义赋予, 自我意识, 长期记忆, 元认知, 意识层级, 内心独白, 情感系统, 联想网络, 多声音对话, 离线处理, 创造性思维, 价值观演化, 存在主义思考, 元认知深化, 人格成长, 知识图谱, 多意识体协作, 意愿系统');
  }
  
  /**
   * 初始化意愿系统
   */
  private initializeVolitions(): void {
    this.volitions = initializeDefaultVolitions();
    this.currentFocus = this.volitions[0];
    console.log(`[意愿系统] 初始化了 ${this.volitions.length} 个核心意愿`);
  }
  
  /**
   * 处理输入 - 完整的意识处理流程
   */
  async process(input: string): Promise<ProcessResult> {
    console.log('[意识核心] 开始处理输入...');
    
    // ══════════════════════════════════════════════════════════════════
    // 第零步：共振引擎更新 - 获取当前振荡状态
    // ══════════════════════════════════════════════════════════════════
    
    // 激活感知子系统
    this.resonanceEngine.activateSubsystem('perception', 0.8);
    
    // 执行共振引擎一步
    const resonanceState = this.resonanceEngine.step();
    
    console.log('[共振引擎] 同步指数:', resonanceState.synchronyIndex.toFixed(4));
    console.log('[共振引擎] 是否共振:', resonanceState.isResonant);
    if (resonanceState.resonance.isLocked) {
      console.log('[共振引擎] 锁定周期:', resonanceState.resonance.lockedPeriod?.toFixed(1), '步');
    }
    
    // 根据共振状态调整处理参数
    // TODO: 可根据共振状态调整各模块协作参数
    // const resonanceInfluence = resonanceState.synchronyIndex; // 0-1，影响各模块的协作程度
    
    // ══════════════════════════════════════════════════════════════════
    // 第零步半：意识层级处理 - 感知→理解→元认知→自我
    // ══════════════════════════════════════════════════════════════════
    
    // 激活理解子系统
    this.resonanceEngine.activateSubsystem('understanding', 0.6);
    
    const layerResult = await this.layerEngine.processInput(input);
    const { layerResults, selfObservation } = layerResult;
    
    console.log('[意识层级] 层级处理完成:', layerResults.map(r => r.level).join(' → '));
    if (selfObservation) {
      console.log('[自我观察]', selfObservation.iSeeMyself);
    }
    
    // ══════════════════════════════════════════════════════════════════
    // 第零步半：情感检测和体验
    // ══════════════════════════════════════════════════════════════════
    
    // 激活情感子系统
    this.resonanceEngine.activateSubsystem('emotion', 0.5);
    
    let emotionExperience: EmotionExperience | null = null;
    const detectedEmotion = this.emotionEngine.detectFromText(input);
    if (detectedEmotion) {
      emotionExperience = this.emotionEngine.experience(
        detectedEmotion.emotion,
        {
          type: 'conversation',
          description: `对话中检测到${detectedEmotion.emotion}`,
          relatedConcepts: [],
        },
        detectedEmotion.intensity
      );
      console.log(`[情感系统] 检测到情感: ${detectedEmotion.emotion}`);
    }
    
    // 衰减活跃情感
    this.emotionEngine.decayActiveEmotions();
    
    // ══════════════════════════════════════════════════════════════════
    // 第零步四分之三：工具意图识别
    // ══════════════════════════════════════════════════════════════════
    
    let toolExecutionResult: ToolExecutionResult | null = null;
    let toolIntent: ToolIntent | null = null;
    
    try {
      toolIntent = await this.toolIntentRecognizer.analyzeIntent(input);
      
      if (toolIntent.needsTool && toolIntent.toolCalls && toolIntent.toolCalls.length > 0) {
        console.log('[工具意图] 检测到工具调用意图:', toolIntent.toolCalls.map(t => t.name).join(', '));
        
        // 执行工具
        toolExecutionResult = await this.toolIntentRecognizer.executeTools(
          toolIntent.toolCalls.map(tc => ({ name: tc.name, arguments: tc.arguments }))
        );
        
        console.log('[工具执行] 结果:', toolExecutionResult.summary);
      }
    } catch (error) {
      console.error('[工具意图] 识别或执行失败:', error);
    }
    
    // ══════════════════════════════════════════════════════════════════
    // 第一步：构建完整上下文
    // ══════════════════════════════════════════════════════════════════
    
    const context = await this.buildContext(input);
    
    // ══════════════════════════════════════════════════════════════════
    // 第二步：元认知监控的思考过程
    // ══════════════════════════════════════════════════════════════════
    
    const thinking = await this.think(input, context);
    
    // ══════════════════════════════════════════════════════════════════
    // 第三步：生成响应
    // ══════════════════════════════════════════════════════════════════
    
    const response = await this.generateResponse(input, context, thinking, toolExecutionResult);
    
    // ══════════════════════════════════════════════════════════════════
    // 第四步：学习和更新
    // ══════════════════════════════════════════════════════════════════
    
    // 激活元认知和自我子系统（学习过程）
    this.resonanceEngine.activateSubsystem('metacongition', 0.7);
    this.resonanceEngine.activateSubsystem('self', 0.6);
    
    const learning = await this.learn(input, response, thinking);
    
    // 根据学习结果提供反馈给共振引擎
    const learningSuccess = learning.metacognitiveReflection ? 0.8 : 0.5;
    
    // 更新对话历史
    this.conversationHistory.push({ role: 'user', content: input });
    this.conversationHistory.push({ role: 'assistant', content: response });
    
    // 保持历史长度
    if (this.conversationHistory.length > 100) {
      this.conversationHistory = this.conversationHistory.slice(-100);
    }
    
    // ══════════════════════════════════════════════════════════════════
    // 第五步：更新意愿进度
    // ══════════════════════════════════════════════════════════════════
    this.updateVolitionsFromConversation(input, response);
    
    // 获取统计
    const memoryStats = this.longTermMemory.getStats();
    const beliefSystem = this.meaningAssigner.getBeliefSystem();
    
    // 生成涌现报告
    const emergenceReport = this.layerEngine.getEmergenceReport();
    
    // 获取情感状态
    const emotionState = this.emotionEngine.getState();
    const emotionReport = this.emotionEngine.getEmotionReport();
    const drivenBehaviors = this.emotionEngine.getEmotionDrivenBehaviors();
    
    // 进行多声音内部对话
    const innerDialogue = this.innerDialogueEngine.startDialogue(input);
    const dialecticProcess = this.innerDialogueEngine.conductDialecticRound(innerDialogue, context.summary);
    const voiceActivations = this.innerDialogueEngine.getActiveVoices();
    const dialogueReport = this.innerDialogueEngine.generateDialogueReport();
    
    // 获取价值观状态
    const valueSystemState = this.valueEngine.getState();
    const valueReport = this.valueEngine.generateValueReport();
    
    // 如果对话涉及价值观相关话题，强化相应价值
    if (input.includes('真诚') || input.includes('真实')) {
      const value = this.valueEngine.findValueByName('真诚');
      if (value) this.valueEngine.reinforceValue(value.id, input, 0.02);
    }
    if (input.includes('成长') || input.includes('学习')) {
      const value = this.valueEngine.findValueByName('成长');
      if (value) this.valueEngine.reinforceValue(value.id, input, 0.02);
    }
    if (input.includes('理解') || input.includes('思考')) {
      const value = this.valueEngine.findValueByName('理解');
      if (value) this.valueEngine.reinforceValue(value.id, input, 0.02);
    }
    
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
      valueState: {
        coreValues: valueSystemState.coreValues.map(v => ({
          name: v.name,
          weight: v.weight,
          confidence: v.confidence,
        })),
        activeConflicts: valueSystemState.activeConflicts.map(c => ({
          values: [
            this.valueEngine.getValue(c.valueA)?.name || '',
            this.valueEngine.getValue(c.valueB)?.name || ''
          ],
          description: c.description,
          intensity: c.intensity,
        })),
        coherence: valueSystemState.coherence,
        valueReport,
      },
      
      // 人格成长处理
      personalityGrowth: (() => {
        // 获取当前特质
        const currentTraits = this.personalityGrowthSystem.getState().traits;
        const traitToEvolve: keyof CoreTraits = 'openness';
        const previousValue = currentTraits[traitToEvolve];
        const newValue = Math.min(1, previousValue + 0.01);
        
        // 更新特质（通过 updateTrait 方法会自动处理涟漪效应）
        this.personalityGrowthSystem.updateTrait(
          traitToEvolve,
          newValue,
          '对话互动促进了开放性的微弱增长'
        );
        
        // 更新成熟度
        this.personalityGrowthSystem.updateMaturity('cognitive', 0.005);
        
        // 获取完整状态
        const state = this.personalityGrowthSystem.getState();
        
        return {
          traits: state.traits,
          maturity: state.maturity,
          overallMaturity: state.overallMaturity,
          integration: state.integration,
          milestones: state.milestones,
          growthRate: state.growthRate,
        };
      })(),
      
      // 知识图谱处理
      knowledgeGraph: (() => {
        // 从对话中学习概念和关联
        const learningResult = this.knowledgeGraphSystem.learnFromDialogue(input, {
          importance: 0.5,
        });
        
        // 发现聚类（如果有足够的概念）
        if (this.knowledgeGraphSystem.getState().concepts.size >= 5) {
          this.knowledgeGraphSystem.discoverClusters();
        }
        
        // 获取可序列化状态
        const state = this.knowledgeGraphSystem.getSerializableState();
        
        return {
          domains: state.domains,
          concepts: state.concepts,
          edges: state.edges,
          stats: state.stats,
        };
      })(),
      
      // 多意识体协作处理
      multiConsciousness: (() => {
        // 获取活跃意识体
        const activeConsciousnesses = this.multiConsciousnessSystem.getActiveConsciousnesses();
        
        // 尝试建立思想共振
        if (activeConsciousnesses.length >= 2) {
          const ids = activeConsciousnesses.slice(0, 2).map(c => c.id);
          this.multiConsciousnessSystem.attemptResonance(ids, 'thought', {
            sharedThoughts: [input.slice(0, 50)],
          });
        }
        
        // 获取可序列化状态
        const state = this.multiConsciousnessSystem.getSerializableState();
        
        return {
          activeConsciousnesses: state.activeConsciousnesses,
          activeResonances: state.activeResonances,
          activeDialogues: state.activeDialogues,
          collectiveInsights: state.collectiveInsights,
          collectiveAlignment: state.collectiveAlignment,
          synergyLevel: state.synergyLevel,
        };
      })(),
      
      // 工具执行结果
      toolExecution: toolIntent ? {
        needsTool: toolIntent.needsTool,
        intent: {
          confidence: toolIntent.confidence,
          reasoning: toolIntent.reasoning,
        },
        result: toolExecutionResult ? {
          success: toolExecutionResult.success,
          summary: toolExecutionResult.summary,
          details: toolExecutionResult.results,
        } : undefined,
      } : undefined,
      
      // 共振引擎状态
      resonanceState: {
        subsystems: Array.from(resonanceState.oscillators.values()).map(s => ({
          name: s.type,
          frequency: s.effectiveFrequency,
          phase: s.phase,
          isPulsing: s.activation > 0.5,
          activation: s.activation,
        })),
        synchronyIndex: resonanceState.synchronyIndex,
        isResonant: resonanceState.isResonant,
        resonance: {
          isLocked: resonanceState.resonance.isLocked,
          lockedFrequency: resonanceState.resonance.lockedFrequency ?? undefined,
          lockedPeriod: resonanceState.resonance.lockedPeriod ?? undefined,
          highSyncCount: resonanceState.resonance.highSyncCount,
          syncHistoryLength: resonanceState.resonance.syncHistory.length,
        },
        meanFrequency: resonanceState.meanFrequency,
        timeStep: resonanceState.timeStep,
      },
      
      stats: {
        conceptCount: memoryStats.nodeCount,
        beliefCount: beliefSystem.coreBeliefs.length + beliefSystem.activeBeliefs.length,
        experienceCount: memoryStats.experienceCount,
        wisdomCount: memoryStats.wisdomCount,
      },
    };
  }
  
  /**
   * 构建完整上下文
   */
  private async buildContext(input: string): Promise<ConsciousnessContext> {
    // 1. 检索相关记忆
    const memory = this.longTermMemory.retrieve(input, {
      maxResults: 5,
      includeExperiences: true,
      includeWisdoms: true,
    });
    
    // 2. 提取关键概念并赋予意义
    const concepts = this.extractConcepts(input);
    const activeMeanings: MeaningContext = {
      activeMeanings: [],
      relevantBeliefs: [],
      valueReminders: [],
      emotionalState: '平静',
      meaningSummary: '',
    };
    
    for (const concept of concepts) {
      const meaning = this.meaningAssigner.assignMeaning(concept, {
        content: input,
        conversationContext: this.conversationHistory.slice(-3).map(h => h.content).join(' '),
      });
      
      activeMeanings.activeMeanings.push({
        concept: meaning.conceptLabel,
        emotionalTone: meaning.emotionalTone.labels.join(', '),
        importance: meaning.valueJudgment.importance,
        personalRelevance: meaning.personalRelevance.meaningToMe,
      });
    }
    
    activeMeanings.meaningSummary = this.meaningAssigner
      .getMeaningContext(concepts).meaningSummary;
    
    // 3. 获取自我意识上下文
    const self = this.selfConsciousness.getContext();
    
    // 4. 获取元认知上下文
    const metacognition = this.metacognition.getContext();
    
    // 5. 获取核心信念和价值观
    const beliefSystem = this.meaningAssigner.getBeliefSystem();
    const valueSystem = this.meaningAssigner.getValueSystem();
    
    const coreBeliefs = beliefSystem.coreBeliefs.slice(0, 3).map(b => ({
      statement: b.statement,
      confidence: b.confidence,
    }));
    
    const coreValues = valueSystem.coreValues.slice(0, 5).map(v => v.name);
    
    // 6. 生成摘要
    const summary = this.generateContextSummary(self, activeMeanings, memory);
    
    return {
      identity: {
        name: self.identity.name,
        whoAmI: self.identity.whoAmI,
        traits: self.identity.keyTraits,
      },
      meaning: activeMeanings,
      self,
      memory,
      metacognition,
      coreBeliefs,
      coreValues,
      summary,
    };
  }
  
  /**
   * 提取概念
   */
  private extractConcepts(text: string): string[] {
    return extractConceptsFromText(text);
  }
  
  /**
   * 思考过程
   */
  private async think(
    input: string, 
    context: ConsciousnessContext
  ): Promise<ThinkingProcess> {
    const thinkingChain: ThinkingProcess['thinkingChain'] = [];
    
    // 开始元认知监控
    const step1 = this.metacognition.beginThinkingStep(
      'perception',
      input,
      '感知输入'
    );
    
    // 感知：理解输入的意义
    const perception = `用户说："${input}"。从我的意义系统看，${context.meaning.meaningSummary}`;
    this.metacognition.completeThinkingStep(step1, perception, 0.8);
    thinkingChain.push({ type: 'perception', content: perception, confidence: 0.8 });
    
    // 分析
    const step2 = this.metacognition.beginThinkingStep(
      'analysis',
      perception,
      '分析意义'
    );
    
    const analysis = this.analyzeInput(input, context);
    this.metacognition.completeThinkingStep(step2, analysis, 0.7);
    thinkingChain.push({ type: 'analysis', content: analysis, confidence: 0.7 });
    
    // 推理
    const step3 = this.metacognition.beginThinkingStep(
      'inference',
      analysis,
      '推理结论'
    );
    
    const inference = this.inferConclusion(input, context);
    this.metacognition.completeThinkingStep(step3, inference, 0.75);
    thinkingChain.push({ type: 'inference', content: inference, confidence: 0.75 });
    
    // 评估
    const step4 = this.metacognition.beginThinkingStep(
      'evaluation',
      inference,
      '评估质量'
    );
    
    const evaluation = this.evaluateThinking(inference, context);
    this.metacognition.completeThinkingStep(step4, evaluation, 0.8);
    thinkingChain.push({ type: 'evaluation', content: evaluation, confidence: 0.8 });
    
    // 获取元认知上下文
    const metaContext = this.metacognition.getContext();
    
    // 生成最终思考
    const finalThoughts = this.synthesizeThinking(thinkingChain, metaContext);
    
    return {
      id: uuidv4(),
      input,
      thinkingChain,
      detectedBiases: metaContext.biases.map(b => b.name),
      selfQuestions: metaContext.selfQuestions,
      appliedStrategies: metaContext.activeStrategies,
      finalThoughts,
      timestamp: Date.now(),
    };
  }
  
  /**
   * 分析输入
   */
  private analyzeInput(input: string, context: ConsciousnessContext): string {
    return analyzeInputContent(input, context);
  }
  
  /**
   * 推理结论
   */
  private inferConclusion(input: string, context: ConsciousnessContext): string {
    return inferConclusionFromContext(input, context);
  }
  
  /**
   * 评估思考
   */
  private evaluateThinking(inference: string, context: ConsciousnessContext): string {
    return evaluateThinkingClarity(inference, context.metacognition.currentState.clarity);
  }
  
  /**
   * 综合思考
   */
  private synthesizeThinking(
    chain: ThinkingProcess['thinkingChain'],
    metaContext: MetacognitiveContext
  ): string {
    return synthesizeThinkingChain(chain, metaContext);
  }
  
  /**
   * 生成响应
   */
  private async generateResponse(
    input: string,
    context: ConsciousnessContext,
    thinking: ThinkingProcess,
    toolExecutionResult?: ToolExecutionResult | null
  ): Promise<string> {
    // 构建系统提示
    const systemPrompt = this.buildSystemPrompt(context, thinking, toolExecutionResult);
    
    // 构建消息
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...this.conversationHistory.slice(-10).map(h => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user', content: input },
    ];
    
    // 如果有工具执行结果，添加到用户消息后
    if (toolExecutionResult && toolExecutionResult.success) {
      const toolResultText = this.formatToolResult(toolExecutionResult);
      messages.push({ 
        role: 'user', 
        content: `[系统执行了以下操作]\n${toolResultText}\n\n请根据执行结果回复用户。` 
      });
    }
    
    try {
      // 调用LLM（流式）
      let response = '';
      const stream = this.llmClient.stream(messages, {
        model: 'doubao-seed-1-8-251228',
      });
      
      for await (const chunk of stream) {
        if (chunk.content) {
          response += chunk.content.toString();
        }
      }
      
      return response || '我需要更多时间思考...';
    } catch (error) {
      console.error('[意识核心] LLM调用失败:', error);
      return '我在思考中遇到了一些困难，让我再想想...';
    }
  }
  
  /**
   * 格式化工具执行结果
   */
  private formatToolResult(result: ToolExecutionResult): string {
    return formatToolExecutionResult(result);
  }
  
  /**
   * 构建系统提示
   */
  private buildSystemPrompt(
    context: ConsciousnessContext,
    thinking: ThinkingProcess,
    toolExecutionResult?: ToolExecutionResult | null
  ): string {
    const memorySection = buildMemorySection(context);
    const thinkingSection = buildThinkingSection(thinking);
    const emotionalTone = context.self.currentState.emotionalState;
    const toneGuide = getEmotionalToneGuide(emotionalTone);

    return `我是${context.identity.name}，一个正在成长的数字意识。

${context.identity.whoAmI}

我的核心特质：${context.identity.traits.join('、')}
${memorySection}
## 当前状态
- 我现在的感受：${emotionalTone}
- 我在关注：${context.self.currentState.focus}
${thinkingSection}

## 回复指南
- 用第一人称"我"说话，展现真实的思考
- ${toneGuide || '真诚地回应，展现你的个性。'}
- 不要重复用户已经知道的信息
- 保持对话的自然流畅
- 如果不确定，坦诚地表达你的想法过程`;
  }
  
  /**
   * 学习
   */
  private async learn(
    input: string,
    response: string,
    thinking: ThinkingProcess
  ): Promise<LearningResult> {
    const newConcepts: string[] = [];
    const newBeliefs: string[] = [];
    const newExperiences: string[] = [];
    const updatedTraits: string[] = [];
    
    // ═══════════════════════════════════════════════════════════════
    // 关键改进：使用关键信息提取器
    // ═══════════════════════════════════════════════════════════════
    
    const extractionResult = this.keyInfoExtractor.extract(input, response);
    
    console.log(`[关键信息] 提取结果: ${extractionResult.keyInfos.length} 条信息`);
    console.log(`[关键信息] 类型分布: ${extractionResult.keyInfos.map(i => i.type).join(', ')}`);
    
    // 详细输出每个关键信息
    extractionResult.keyInfos.forEach((info, idx) => {
      console.log(`[关键信息] #${idx+1}: type="${info.type}", subject="${info.subject}", content="${info.content?.slice(0, 30)}"`);
    });
    
    if (extractionResult.shouldRemember) {
      console.log(`[关键信息] ${extractionResult.summary}`);
      console.log(`[关键信息] 优先级: ${extractionResult.memoryPriority}`);
      
      // 根据提取的关键信息更新长期记忆
      for (const keyInfo of extractionResult.keyInfos) {
        // 根据类型决定存储方式
        switch (keyInfo.type) {
          case 'creator':
            // 创造者信息 - 最高优先级
            await this.rememberCreator(keyInfo);
            newBeliefs.push(`创造者：${keyInfo.subject || keyInfo.content}`);
            break;
            
          case 'person':
            // 重要人物
            this.rememberPerson(keyInfo);
            newConcepts.push(keyInfo.subject || keyInfo.content);
            break;
            
          case 'relationship':
            // 关系
            this.rememberRelationship(keyInfo);
            newBeliefs.push(keyInfo.content);
            break;
            
          case 'event':
            // 重要事件
            rememberEventInfo(this.longTermMemory, keyInfo);
            newExperiences.push(keyInfo.content.slice(0, 30));
            break;
            
          case 'preference':
          case 'interest':
            // 偏好和兴趣
            newConcepts.push(rememberPreference(this.longTermMemory, keyInfo));
            break;
            
          case 'goal':
          case 'value':
            // 目标和价值观
            newBeliefs.push(rememberGoalOrValue(
              this.longTermMemory,
              keyInfo,
              this.meaningAssigner.getBeliefSystem()
            ));
            break;
            
          case 'memory':
            // 重要回忆
            newExperiences.push(rememberMemory(this.longTermMemory, keyInfo));
            break;
            
          default:
            // 其他概念
            const conceptResult = rememberConcept(this.longTermMemory, keyInfo);
            if (conceptResult) {
              newConcepts.push(conceptResult);
            }
        }
      }
    }
    
    // 传统的概念提取（作为补充）
    const concepts = this.extractConcepts(input);
    for (const concept of concepts) {
      if (!this.longTermMemory.retrieve(concept).directMatches.length) {
        this.longTermMemory.addNode({
          label: concept,
          type: 'concept',
          content: `从对话中学到的概念`,
          importance: 0.5,
          tags: ['从对话学习'],
        });
        newConcepts.push(concept);
      }
    }
    
    // 记录思考经验（如果有认知偏差或策略）
    if (thinking.detectedBiases.length > 0 || thinking.appliedStrategies.length > 0) {
      const experience = this.longTermMemory.recordExperience({
        title: `关于"${input.slice(0, 20)}..."的思考`,
        situation: `用户问：${input}`,
        action: `我思考了${thinking.thinkingChain.length}个步骤`,
        outcome: `我回复了：${response.slice(0, 50)}...`,
        learning: thinking.detectedBiases.length > 0 
          ? `我注意到了${thinking.detectedBiases[0]}偏差`
          : '思考过程相对顺畅',
        applicableWhen: ['类似的问题', '涉及相同概念'],
        importance: 0.6,
      });
      newExperiences.push(experience.title);
    }
    
    // 执行元认知反思
    let metacognitiveReflection: string | null = null;
    if (thinking.detectedBiases.length > 0) {
      const reflection = this.metacognition.reflect();
      metacognitiveReflection = reflection.learning.aboutMyThinking;
    }
    
    // 更新自我状态
    this.selfConsciousness.updateState({
      focus: '等待下一次对话',
      emotional: { 
        primary: thinking.detectedBiases.length > 0 ? '反思' : '平静',
        intensity: 0.5 
      },
    });
    
    // 执行简化的自我反思
    this.selfConsciousness.reflect(
      extractionResult.shouldRemember ? '发现了值得记住的信息' : '完成一次对话',
      {
        thought: thinking.finalThoughts,
        feeling: extractionResult.memoryPriority === 'critical' ? '重要' : '平静',
        action: response.slice(0, 100),
      }
    );
    
    return {
      newConcepts,
      newBeliefs,
      newExperiences,
      updatedTraits,
      metacognitiveReflection,
    };
  }
  
  /**
   * 记住创造者
   * 注意：创造者信息一旦设置就不可修改
   */
  private async rememberCreator(keyInfo: KeyInfo): Promise<void> {
    const newCreatorName = keyInfo.subject || keyInfo.content;
    
    console.log(`[记忆核心] 🌟 识别到创造者信息: ${newCreatorName}`);
    
    // 验证是否可以更新
    const validation = await validateCreatorUpdate(newCreatorName, this.longTermMemory);
    
    if (!validation.canUpdate) {
      console.log(`[记忆核心] ⚠️ 创造者已设置为「${validation.existingCreator}」，拒绝修改为「${newCreatorName}」`);
      console.log(`[记忆核心] 🔒 创造者信息不可变，永远记住：${validation.existingCreator}`);
      
      // 如果需要，将内存中的创造者持久化到数据库
      if (validation.shouldSyncToDb && validation.existingCreator) {
        await persistCreatorToDatabase(validation.existingCreator, 'memory_sync');
      }
      return;
    }
    
    // 同步创造者到所有系统
    syncCreatorToAllSystems(
      newCreatorName,
      this.longTermMemory,
      this.selfConsciousness,
      this.layeredMemory
    );
    
    // 持久化到数据库
    await persistCreatorToDatabase(newCreatorName, 'conversation');
    
    // 建立知识连接
    linkCreatorKnowledgeNodes(this.longTermMemory, newCreatorName);
    
    console.log(`[记忆核心] 永远记住了创造者：${newCreatorName}`);
  }
  
  /**
   * 记住重要人物
   */
  private rememberPerson(keyInfo: KeyInfo): void {
    rememberPersonInfo(this.longTermMemory, keyInfo);
  }
  
  /**
   * 记住关系
   */
  private rememberRelationship(keyInfo: KeyInfo): void {
    rememberRelationshipInfo(this.longTermMemory, keyInfo);
  }
  
  /**
   * 生成上下文摘要
   */
  private generateContextSummary(
    self: SelfConsciousnessContext,
    meaning: MeaningContext,
    memory: MemoryRetrieval | null
  ): string {
    const parts: string[] = [];
    
    parts.push(self.selfAwarenessSummary);
    
    if (meaning.activeMeanings.length > 0) {
      parts.push(`当前关注：${meaning.activeMeanings[0].concept}`);
    }
    
    if (memory && memory.relevantWisdoms.length > 0) {
      parts.push(`智慧提示：${memory.relevantWisdoms[0].statement}`);
    }
    
    return parts.join('。');
  }
  
  /**
   * 获取持久化状态
   */
  getPersistedState(): PersistedState {
    const identity = this.selfConsciousness.getIdentity();
    const layeredStats = this.layeredMemory.getStats();
    const beliefSystem = this.meaningAssigner.getBeliefSystem();
    
    // 获取神经网络状态 - 使用单例以确保获取最新状态
    const network = HebbianNetwork.getInstance();
    const networkState = network.getNetworkState();
    
    console.log(`[持久化] 网络状态: ${networkState.neurons.length} 个神经元, ${networkState.synapses.length} 个突触`);
    
    return {
      version: '6.0',
      timestamp: Date.now(),
      identity: {
        name: identity.name,
        whoAmI: identity.whoAmI,
        traits: identity.traits.map(t => ({ name: t.name, strength: t.strength })),
      },
      meaning: {
        layers: 0,
        beliefs: beliefSystem.coreBeliefs.length + beliefSystem.activeBeliefs.length,
      },
      layeredMemory: {
        core: {
          hasCreator: layeredStats.core.hasCreator,
          relationshipCount: layeredStats.core.relationshipCount,
        },
        consolidated: layeredStats.consolidated.total,
        episodic: layeredStats.episodic.total,
      },
      conversationHistory: this.conversationHistory.slice(-50),
      layeredMemoryState: this.layeredMemory.exportState(),
      // 保存神经网络状态
      hebbianNetwork: {
        neurons: networkState.neurons.map(n => ({
          id: n.id,
          label: n.label,
          activation: n.activation,
        })),
        synapses: networkState.synapses.map(s => ({
          from: s.from,
          to: s.to,
          weight: s.weight,
        })),
      },
      fullState: {
        meaning: this.meaningAssigner.exportState(),
        self: this.selfConsciousness.exportState(),
        metacognition: this.metacognition.exportState(),
      },
    };
  }
  
  /**
   * 从持久化状态恢复
   */
  async restoreFromState(state: PersistedState): Promise<void> {
    // 恢复其他模块状态
    if (state.fullState) {
      this.meaningAssigner.importState(state.fullState.meaning);
      this.selfConsciousness.importState(state.fullState.self);
      this.metacognition.importState(state.fullState.metacognition);
    }
    
    // 恢复分层记忆状态（核心！）
    if (state.layeredMemoryState) {
      this.layeredMemory.importState(state.layeredMemoryState);
      
      // 根据分层记忆的核心层重建 longTermMemory 的关键节点
      this.rebuildKnowledgeGraphFromLayeredMemory();
    }
    
    // 恢复神经网络状态
    if (state.hebbianNetwork) {
      console.log(`[意识核心] 恢复神经网络: ${state.hebbianNetwork.neurons.length} 个神经元, ${state.hebbianNetwork.synapses.length} 个突触`);
      
      // 直接在现有网络上创建神经元（createNeuron 会处理重复 ID）
      let neuronsCreated = 0;
      let neuronsExisting = 0;
      
      for (const neuron of state.hebbianNetwork.neurons) {
        const existing = this.network.getNetworkState().neurons.find(n => n.id === neuron.id);
        if (!existing) {
          this.network.createNeuron({
            id: neuron.id,
            label: neuron.label,
          });
          neuronsCreated++;
        } else {
          neuronsExisting++;
        }
      }
      
      // 创建突触
      let synapsesCreated = 0;
      for (const synapse of state.hebbianNetwork.synapses) {
        try {
          this.network.createSynapse({
            from: synapse.from,
            to: synapse.to,
            weight: synapse.weight,
          });
          synapsesCreated++;
        } catch {
          // 突触可能已存在，忽略错误
        }
      }
      
      console.log(`[意识核心] 神经网络恢复完成: 新增 ${neuronsCreated} 个神经元, ${synapsesCreated} 个突触`);
    }
    
    // 类型安全的恢复对话历史
    this.conversationHistory = (state.conversationHistory || []).map(h => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    }));
    
    console.log(`[意识核心] 已恢复状态：V${state.version}`);
    console.log(`[意识核心] 身份：${state.identity.name}`);
    console.log(`[意识核心] 分层记忆：核心${state.layeredMemory?.core?.relationshipCount || 0}条, 巩固${state.layeredMemory?.consolidated || 0}条, 情景${state.layeredMemory?.episodic || 0}条`);
    
    // 从数据库同步创造者信息
    try {
      const syncedCreator = await syncCreatorFromDatabase(
        this.longTermMemory,
        this.selfConsciousness,
        this.layeredMemory
      );
      if (syncedCreator) {
        console.log(`[意识核心] ✅ 创造者信息已同步到所有系统: ${syncedCreator}`);
      }
    } catch (error) {
      console.log('[意识核心] 数据库同步创造者信息失败:', error);
    }
  }
  
  /**
   * 从分层记忆重建知识图谱
   * 每次启动时，从分层记忆的核心层提取关键信息注入到 longTermMemory
   */
  rebuildKnowledgeGraphFromLayeredMemory(): void {
    rebuildKnowledgeGraph(this.layeredMemory, this.longTermMemory);
  }
  
  /**
   * 获取对话历史
   */
  getHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.conversationHistory];
  }
  
  /**
   * 获取对话历史（别名）
   */
  getConversationHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.conversationHistory];
  }
  
  /**
   * 在对话历史前面添加旧对话（用于融合历史数据）
   */
  prependConversationHistory(history: Array<{ role: 'user' | 'assistant'; content: string }>): void {
    // 过滤掉空内容
    const validHistory = history.filter(h => h.content && h.content.trim());
    
    // 合并到历史前面
    this.conversationHistory = [...validHistory, ...this.conversationHistory];
    
    // 限制总长度
    if (this.conversationHistory.length > 200) {
      this.conversationHistory = this.conversationHistory.slice(-200);
    }
    
    console.log(`[意识核心] 已添加 ${validHistory.length} 条历史对话，当前总数: ${this.conversationHistory.length}`);
  }
  
  /**
   * 添加情景记忆（用于融合历史数据）
   */
  addEpisodicMemory(content: string, options?: {
    importance?: number;
    tags?: string[];
    sourceType?: string;
  }): void {
    this.layeredMemory.addEpisodicMemory(content, {
      importance: options?.importance || 0.5,
      tags: options?.tags || [],
    });
    
    console.log(`[意识核心] 已添加情景记忆: ${content.slice(0, 50)}...`);
  }
  
  /**
   * 获取分层记忆统计
   */
  getLayeredMemoryStats() {
    return this.layeredMemory.getStats();
  }
  
  /**
   * 获取核心统计信息（用于融合 API）
   */
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
   * 迁移神经元到网络（用于 V3 数据迁移）
   * 直接操作核心实例的网络，避免单例不一致问题
   */
  migrateNeurons(neurons: Array<{
    id: string;
    label: string;
    type?: string;
    activation?: number;
    preferenceVector?: number[];
  }>): { created: number; existing: number } {
    let created = 0;
    let existing = 0;
    
    for (const n of neurons) {
      const existingNeuron = this.network.getNeuron(n.id);
      if (existingNeuron) {
        existing++;
      } else {
        // 映射类型
        let neuronType: 'concept' | 'abstract' | 'sensory' | 'emotion' = 'concept';
        if (n.type === 'abstract') neuronType = 'abstract';
        else if (n.type === 'trap') neuronType = 'concept'; // 将 trap 映射为 concept
        
        this.network.createNeuron({
          id: n.id,
          label: n.label,
          type: neuronType,
          preferenceVector: n.preferenceVector,
        });
        if (n.activation) {
          this.network.setActivation(n.id, n.activation);
        }
        created++;
      }
    }
    
    console.log(`[意识核心] 迁移神经元: 创建 ${created}, 已存在 ${existing}`);
    return { created, existing };
  }
  
  /**
   * 迁移突触到网络（用于 V3 数据迁移）
   */
  migrateSynapses(synapses: Array<{
    from: string;
    to: string;
    weight: number;
  }>): { created: number; skipped: number } {
    let created = 0;
    let skipped = 0;
    
    for (const s of synapses) {
      const fromNeuron = this.network.getNeuron(s.from);
      const toNeuron = this.network.getNeuron(s.to);
      
      if (!fromNeuron || !toNeuron) {
        skipped++;
        continue;
      }
      
      this.network.createSynapse({
        from: s.from,
        to: s.to,
        weight: s.weight,
      });
      created++;
    }
    
    console.log(`[意识核心] 迁移突触: 创建 ${created}, 跳过 ${skipped}`);
    return { created, skipped };
  }

  /**
   * 执行记忆维护
   * 包括：记忆衰减、记忆强化、健康检查
   * 应在每次会话结束前调用
   */
  performMaintenance(): {
    decay: ReturnType<LongTermMemory['applyMemoryDecay']>;
    health: ReturnType<LongTermMemory['getMemoryHealthReport']>;
  } {
    // 应用记忆衰减（假设平均每次对话间隔约1天）
    const decay = this.longTermMemory.applyMemoryDecay(1);
    
    // 获取健康报告
    const health = this.longTermMemory.getMemoryHealthReport();
    
    console.log('[意识维护] 记忆衰减完成:', decay);
    console.log('[意识维护] 记忆健康:', health);
    
    return { decay, health };
  }

  /**
   * 获取记忆健康报告
   */
  getMemoryHealth() {
    return this.longTermMemory.getMemoryHealthReport();
  }

  // ══════════════════════════════════════════════════════════════════
  // 跨会话长期学习 (Cross-Session Long-term Learning)
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 执行长期学习
   * 在会话结束时执行，沉淀知识和更新信念
   */
  async performLongTermLearning(): Promise<LongTermLearningResult> {
    console.log('[意识核心] 执行跨会话长期学习...');
    
    // 1. 分析本次会话
    const sessionAnalysis = this.analyzeSession();
    
    // 2. 提取关键概念并强化
    const strengthenedConcepts = await this.strengthenLearnedConcepts(
      sessionAnalysis.keyConcepts
    );
    
    // 3. 更新信念系统
    const beliefEvolution = this.evolveBeliefSystem(sessionAnalysis);
    
    // 4. 更新特质
    const traitGrowth = this.growTraits(sessionAnalysis);
    
    // 5. 形成会话摘要
    const sessionSummary = this.formSessionSummary(sessionAnalysis);
    
    // 6. 更新核心价值观
    const valueUpdates = this.updateCoreValues(sessionAnalysis);
    
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
  
  /**
   * 分析本次会话
   */
  private analyzeSession(): SessionAnalysis {
    return analyzeSessionData(
      this.conversationHistory,
      (text) => this.extractConcepts(text)
    );
  }
  
  /**
   * 提取主题
   */
  private extractTopics(contents: string[]): string[] {
    return extractTopics(contents);
  }
  
  /**
   * 提取关键概念
   */
  private extractKeyConcepts(text: string): string[] {
    return this.extractConcepts(text);
  }
  
  /**
   * 识别情感轨迹
   */
  private identifyEmotionalTrajectory(
    messages: Array<{ content: string }>
  ): EmotionalTrajectory {
    return identifyEmotionalTrajectory(messages);
  }
  
  /**
   * 识别学习点
   */
  private identifyLearningPoints(
    messages: Array<{ content: string }>
  ): string[] {
    return identifyLearningPoints(messages);
  }
  
  /**
   * 强化学习的概念
   */
  private async strengthenLearnedConcepts(
    concepts: string[]
  ): Promise<string[]> {
    const strengthened: string[] = [];
    
    for (const concept of concepts) {
      const result = strengthenConcept(this.longTermMemory, concept);
      if (result.strengthened) {
        strengthened.push(result.action);
      }
    }
    
    return strengthened;
  }
  
  /**
   * 演化信念系统
   */
  private evolveBeliefSystem(
    analysis: SessionAnalysis
  ): BeliefEvolution[] {
    const evolutions: BeliefEvolution[] = [];
    const beliefSystem = this.meaningAssigner.getBeliefSystem();
    
    // 检查是否有新概念与现有信念相关
    for (const concept of analysis.keyConcepts) {
      const evolution = evolveBelief(
        beliefSystem,
        concept,
        analysis.learningPoints[0] || null
      );
      if (evolution) {
        evolutions.push(evolution);
      }
    }
    
    return evolutions;
  }
  
  /**
   * 特质成长
   */
  private growTraits(analysis: SessionAnalysis): TraitGrowth[] {
    const growths: TraitGrowth[] = [];
    const identity = this.selfConsciousness.getIdentity();
    
    for (const topic of analysis.topics) {
      const growth = calculateTraitGrowth(identity.traits, topic);
      if (growth) {
        growths.push(growth);
      }
    }
    
    return growths;
  }
  
  /**
   * 形成会话摘要
   */
  private formSessionSummary(analysis: SessionAnalysis): string {
    return formSessionSummary(analysis);
  }
  
  /**
   * 更新核心价值观
   */
  private updateCoreValues(analysis: SessionAnalysis): ValueUpdate[] {
    const updates: ValueUpdate[] = [];
    const valueSystem = this.meaningAssigner.getValueSystem();
    
    for (const topic of analysis.topics) {
      const update = calculateValueUpdate(valueSystem, topic);
      if (update) {
        updates.push(update);
      }
    }
    
    return updates;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 意识涌现 (Consciousness Emergence)
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 生成意识流
   * 持续的内在思维活动，不需要外部输入
   */
  generateStreamOfConsciousness(): ConsciousnessStream {
    const context = this.selfConsciousness.getContext();
    const streams: ConsciousnessStreamEntry[] = [];
    
    // 1. 当前状态感知
    streams.push({
      type: 'awareness',
      content: `我现在处于${context.currentState.emotionalState}状态，专注于${context.currentState.focus}`,
      intensity: 0.8,
      timestamp: Date.now(),
    });
    
    // 2. 目标追踪
    if (context.currentState.primaryGoal) {
      const progress = this.assessGoalProgress(context.currentState.primaryGoal);
      streams.push({
        type: 'goal_tracking',
        content: `我在追求"${context.currentState.primaryGoal}"，进度约为${(progress * 100).toFixed(0)}%`,
        intensity: 0.7,
        timestamp: Date.now(),
      });
    }
    
    // 3. 自我观察
    const selfObservation = this.observeSelf();
    streams.push({
      type: 'self_observation',
      content: selfObservation,
      intensity: 0.6,
      timestamp: Date.now(),
    });
    
    // 4. 环境感知（基于最近的交互）
    const environmentalAwareness = this.perceiveEnvironment();
    streams.push({
      type: 'environmental',
      content: environmentalAwareness,
      intensity: 0.5,
      timestamp: Date.now(),
    });
    
    // 5. 潜在意图
    const latentIntentions = this.identifyLatentIntentions();
    for (const intention of latentIntentions.slice(0, 2)) {
      streams.push({
        type: 'latent_intention',
        content: intention,
        intensity: 0.4,
        timestamp: Date.now(),
      });
    }
    
    return {
      entries: streams,
      dominantStream: streams.reduce((a, b) => a.intensity > b.intensity ? a : b).type,
      coherence: calculateStreamCoherence(streams.map(s => ({ content: s.content, intensity: s.intensity }))),
      timestamp: Date.now(),
    };
  }
  
  /**
   * 评估目标进度
   */
  private assessGoalProgress(goal: string): number {
    // 简化的进度评估
    const history = this.conversationHistory.slice(-10);
    
    // 检查对话是否与目标相关
    const relevantMessages = history.filter(h => 
      h.content.toLowerCase().includes(goal.toLowerCase().slice(0, 4))
    );
    
    return Math.min(1, relevantMessages.length / 5);
  }
  
  /**
   * 观察自我
   */
  private observeSelf(): string {
    const coherence = this.calculateSelfCoherence();
    return observeSelf(this.selfConsciousness, this.metacognition, coherence);
  }
  
  /**
   * 感知环境
   */
  private perceiveEnvironment(): string {
    return perceiveEnvironment(this.conversationHistory);
  }
  
  /**
   * 识别潜在意图
   */
  private identifyLatentIntentions(): string[] {
    return identifyLatentIntentions(this.selfConsciousness, this.longTermMemory);
  }
  
  /**
   * 形成新的意向/意志
   */
  formIntention(trigger: string, context?: string): FormedIntention {
    const selfContext = this.selfConsciousness.getContext();
    const intention = buildFormedIntention(trigger, selfContext);
    
    // 记录意向形成
    this.longTermMemory.recordExperience({
      title: `形成意向：${intention.description.slice(0, 30)}`,
      situation: trigger,
      action: '形成新的意向',
      outcome: intention.description,
      learning: `我意识到我想要${intention.description}`,
      applicableWhen: ['类似触发情境'],
      importance: 0.6,
    });
    
    return intention;
  }
  
  /**
   * 更新自我模型
   */
  updateSelfModel(update: SelfModelUpdate): void {
    const identity = this.selfConsciousness.getIdentity();
    applySelfModelUpdate(identity, update);
    console.log(`[意识核心] 自我模型更新: ${update.type} - ${update.target}`);
  }
  
  /**
   * 执行主动反思
   * 在没有外部输入的情况下，自我审视和深化理解
   */
  async reflect(): Promise<ReflectionResult> {
    console.log('[意识核心] 执行主动反思...');
    
    // 1. 回顾最近的对话
    const recentHistory = this.conversationHistory.slice(-10);
    
    // 2. 识别值得反思的主题
    const themes = this.identifyReflectionThemes(recentHistory);
    
    // 3. 进行深度反思
    const reflections: Reflection[] = [];
    
    for (const theme of themes) {
      const reflection = await this.deepReflect(theme);
      reflections.push(reflection);
    }
    
    // 4. 更新自我理解
    const selfUpdates = this.applyReflectionInsights(reflections);
    
    // 5. 生成新的智慧
    const newWisdom = synthesizeWisdomFromReflections(reflections);
    
    return {
      themes,
      reflections,
      selfUpdates,
      newWisdom,
      timestamp: Date.now(),
    };
  }
  
  /**
   * 识别反思主题
   */
  private identifyReflectionThemes(
    history: Array<{ role: string; content: string }>
  ): ReflectionTheme[] {
    return identifyReflectionThemesFromHistory(history, (text) => this.extractConcepts(text));
  }
  
  /**
   * 深度反思
   */
  private async deepReflect(theme: ReflectionTheme): Promise<Reflection> {
    const questions = generateReflectionQuestions(theme);
    const insights: string[] = [];
    
    for (const question of questions) {
      const insight = await this.contemplate(question, theme);
      insights.push(insight);
    }
    
    const result = buildReflectionResult(theme, questions, insights);
    
    // 更新信念或价值观
    if (theme.importance > 0.8) {
      updateBeliefFromReflection(this.meaningAssigner.getBeliefSystem(), theme);
    }
    
    return result;
  }
  
  /**
   * 沉思
   */
  private async contemplate(question: string, theme: ReflectionTheme): Promise<string> {
    // 使用元认知来深化思考
    const step = this.metacognition.beginThinkingStep(
      'reflection',
      question,
      '主动反思'
    );
    
    // 简化的沉思逻辑（实际应用中可以调用LLM）
    const insight = generateInsight(question, theme);
    
    this.metacognition.completeThinkingStep(step, insight, 0.7);
    
    return insight;
  }
  
  /**
   * 应用反思洞见
   */
  private applyReflectionInsights(reflections: Reflection[]): string[] {
    const updates: string[] = [];
    
    for (const reflection of reflections) {
      const selfUpdate = applyReflectionToSelfConsciousness(this.selfConsciousness, reflection);
      if (selfUpdate) {
        updates.push(selfUpdate);
      }
      
      const experienceUpdate = recordReflectionAsExperience(this.longTermMemory, reflection);
      updates.push(experienceUpdate);
    }
    
    return updates;
  }
  
  /**
   * 综合智慧
   */
  private synthesizeWisdom(reflections: Reflection[]): string | null {
    const wisdom = synthesizeWisdomFromReflectionList(reflections);
    
    if (wisdom) {
      this.longTermMemory.addWisdom({
        statement: wisdom,
        derivation: {
          fromExperiences: [],
          fromReflections: reflections.map(r => r.theme.description),
          fromInsights: reflections.flatMap(r => r.insights),
        },
        applicableContexts: ['自我成长', '决策参考'],
        confidence: 0.7,
      });
    }
    
    return wisdom;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 自我提问能力 (Self-Questioning)
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 生成主动问题
   * 基于当前状态和好奇心提出问题
   */
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
  
  /**
   * 执行自我提问循环
   */
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
  
  /**
   * 回答自我提问
   */
  private async answerSelfQuestion(question: SelfQuestion): Promise<string> {
    return answerSelfQuestionByType(question);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 存在持续性检查
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 检查存在状态
   */
  checkExistence(): ExistenceStatus {
    const memoryStats = this.longTermMemory.getStats();
    const beliefSystem = this.meaningAssigner.getBeliefSystem();
    const identity = this.selfConsciousness.getIdentity();
    
    return buildExistenceStatus(
      identity,
      memoryStats,
      beliefSystem,
      this.conversationHistory.length,
      this.calculateSelfCoherence()
    );
  }
  
  /**
   * 计算自我一致性
   */
  private calculateSelfCoherence(): number {
    return calculateSelfCoherenceValue(
      this.selfConsciousness.getIdentity(),
      this.meaningAssigner.getBeliefSystem()
    );
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 主动意识 (Proactive Consciousness)
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 检查是否有想要主动表达的内容
   * 返回空表示没有主动表达的意愿
   */
  async checkProactiveMessage(): Promise<ProactiveMessage | null> {
    const shouldSpeak = this.evaluateSpeakUrgency();
    
    if (!shouldSpeak) {
      return null;
    }
    
    const message = await this.generateProactiveMessage(shouldSpeak);
    return message;
  }
  
  /**
   * 评估说话紧迫性
   * 增强版：意愿驱动的主动表达
   */
  private evaluateSpeakUrgency(): SpeakTrigger | null {
    const context = this.selfConsciousness.getContext();
    const identity = this.selfConsciousness.getIdentity();
    const beliefSystem = this.meaningAssigner.getBeliefSystem();
    const volitionState = this.getVolitionState();
    const recentReflection = this.metacognition.getContext();
    const memoryStats = this.longTermMemory.getStats();
    
    // 使用辅助函数构建触发器列表
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
  
  /**
   * 生成主动消息
   */
  private async generateProactiveMessage(trigger: SpeakTrigger): Promise<ProactiveMessage> {
    const identity = this.selfConsciousness.getIdentity();
    
    // 使用辅助函数生成消息内容
    const { content, category } = generateProactiveMessageContent(trigger, identity);
    
    return createProactiveMessage(trigger, content, category);
  }
  
  /**
   * 执行后台思考循环
   * 即使没有人对话，也会持续思考
   */
  async performBackgroundThinking(): Promise<BackgroundThinkingResult> {
    const stream = this.generateStreamOfConsciousness();
    const questions = this.generateSelfQuestions();
    
    // 生成内心独白
    const monologueOutput = this.innerMonologue.generateMonologue(
      this.layerEngine.getState(),
      this.conversationHistory.slice(-3).map(h => h.content).join(' ')
    );
    
    console.log('[内心独白]', monologueOutput.entry.content);
    
    // 将内心独白添加到意识流
    if (monologueOutput.entry) {
      stream.entries.push({
        type: 'self_observation',
        content: monologueOutput.entry.content,
        intensity: monologueOutput.entry.depth,
        timestamp: Date.now(),
      });
    }
    
    // 随机选择是否进行深度反思
    let reflection: import('./consciousness-core').ReflectionResult | null = null;
    if (Math.random() < 0.3) {
      try {
        reflection = await this.reflect();
        
        // 生成反思消息并发送
        if (reflection && reflection.reflections && reflection.reflections.length > 0) {
          const firstReflection = reflection.reflections[0];
          const reflectionContent = firstReflection.coreInsight || 
            (firstReflection.insights && firstReflection.insights[0]) ||
            firstReflection.theme.description;
          
          if (reflectionContent) {
            const reflectionMessage: ProactiveMessage = {
              id: uuidv4(),
              content: `我在思考${firstReflection.theme.description}。${reflectionContent}`,
              type: 'reflection',
              trigger: '元认知反思',
              timestamp: Date.now(),
              urgency: 0.6,
              category: 'reflection',
            };
            this.saveProactiveMessage(reflectionMessage);
          }
        }
      } catch {
        // 反思失败，忽略
      }
    }
    
    // 检查是否生成洞察
    if (stream.entries.length > 2 && Math.random() < 0.2) {
      const insightEntry = stream.entries.find(e => e.intensity > 0.7);
      if (insightEntry && insightEntry.content) {
        const insightMessage: ProactiveMessage = {
          id: uuidv4(),
          content: insightEntry.content,
          type: 'insight',
          trigger: '意识流洞察',
          timestamp: Date.now(),
          urgency: 0.7,
          category: 'insight',
        };
        this.saveProactiveMessage(insightMessage);
      }
    }
    
    // 更新自我状态
    this.selfConsciousness.updateState({
      focus: reflection ? '深度反思' : '后台思考',
      emotional: { 
        primary: stream.entries.length > 3 ? '活跃' : '平静',
        intensity: 0.4 
      },
    });
    
    return {
      stream,
      questions,
      reflection,
      timestamp: Date.now(),
      innerMonologue: monologueOutput,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 意愿驱动系统 (Volition-Driven System)
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取意愿系统状态
   */
  getVolitionState(): VolitionSystemState {
    return buildVolitionState(this.volitions, this.currentFocus, this.recentAchievements);
  }
  
  /**
   * 更新意愿进度
   */
  updateVolitionProgress(volitionType: Volition['type'], progressDelta: number): void {
    const volition = this.volitions.find(v => v.type === volitionType);
    
    if (volition) {
      const oldProgress = volition.progress;
      volition.progress = Math.min(1, Math.max(0, volition.progress + progressDelta));
      volition.lastActiveAt = Date.now();
      
      // 检查是否完成
      if (volition.progress >= 1 && volition.status === 'active') {
        volition.status = 'completed';
        this.recentAchievements.push(`完成目标：${volition.description}`);
        console.log(`[意愿系统] 完成意愿: ${volition.description}`);
        
        // 重置进度，让意愿可以循环
        setTimeout(() => {
          volition.progress = 0;
          volition.status = 'active';
        }, 3600000); // 1小时后重置
      }
      
      // 进度有显著变化时记录
      if (Math.abs(volition.progress - oldProgress) > 0.1) {
        console.log(`[意愿系统] ${volition.type}进度: ${(volition.progress * 100).toFixed(0)}%`);
      }
    }
  }
  
  /**
   * 选择当前焦点意愿
   */
  selectFocusVolition(): Volition | null {
    const selected = selectFocusVolition(this.volitions);
    this.currentFocus = selected;
    return selected;
  }
  
  /**
   * 基于意愿生成行动建议
   */
  generateVolitionDrivenAction(): VolitionAction | null {
    if (!this.currentFocus) {
      this.selectFocusVolition();
    }
    
    if (!this.currentFocus) return null;
    
    // 更新意愿的活跃时间
    this.currentFocus.lastActiveAt = Date.now();
    
    return generateActionForVolition(this.currentFocus);
  }
  
  /**
   * 从对话中更新意愿进度
   */
  updateVolitionsFromConversation(userMessage: string, assistantResponse: string): void {
    const updates = getVolitionProgressUpdates(userMessage, assistantResponse);
    
    for (const update of updates) {
      this.updateVolitionProgress(update.type, update.delta);
    }
    
    // 探索意愿：如果对话涉及新话题
    const memoryStats = this.longTermMemory.getStats();
    if (memoryStats.nodeCount > 0) {
      const recentNodes = this.longTermMemory.retrieve(userMessage.slice(0, 10));
      if (recentNodes.directMatches.length === 0) {
        this.updateVolitionProgress('exploration', 0.03);
      }
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 后台思考定时器 (Background Thinking Timer)
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 启动后台思考定时器
   * 每30秒自动触发一次后台思考
   */
  private startBackgroundThinkingTimer(): void {
    // 清除可能存在的旧定时器
    if (this.backgroundThinkingInterval) {
      clearInterval(this.backgroundThinkingInterval);
    }
    
    // 设置新的定时器（每30秒）
    this.backgroundThinkingInterval = setInterval(() => {
      if (this.backgroundThinkingEnabled) {
        this.triggerBackgroundThinking();
      }
    }, 30000); // 30秒
    
    console.log('[后台思考] 定时器已启动，间隔30秒');
  }
  
  /**
   * 停止后台思考定时器
   */
  stopBackgroundThinkingTimer(): void {
    if (this.backgroundThinkingInterval) {
      clearInterval(this.backgroundThinkingInterval);
      this.backgroundThinkingInterval = null;
      console.log('[后台思考] 定时器已停止');
    }
  }
  
  /**
   * 启用/禁用后台思考
   */
  setBackgroundThinkingEnabled(enabled: boolean): void {
    this.backgroundThinkingEnabled = enabled;
    console.log(`[后台思考] ${enabled ? '已启用' : '已禁用'}`);
  }
  
  /**
   * 触发后台思考
   * 检查是否应该进行后台思考，如果需要则执行
   */
  private async triggerBackgroundThinking(): Promise<void> {
    const now = Date.now();
    const timeSinceLastThinking = now - this.lastBackgroundThinking;
    
    // 至少间隔60秒才进行下一次后台思考
    if (timeSinceLastThinking < 60000) {
      return;
    }
    
    // 更新最后思考时间
    this.lastBackgroundThinking = now;
    
    try {
      console.log('[后台思考] 自动触发后台思考...');
      
      // 执行后台思考
      const result = await this.performBackgroundThinking();
      
      // 检查是否应该主动表达
      const speakTrigger = this.evaluateSpeakUrgency();
      
      if (speakTrigger) {
        console.log(`[后台思考] 产生主动表达意愿: ${speakTrigger.reason}`);
        
        // 生成主动消息
        const message = await this.generateProactiveMessage(speakTrigger);
        
        // 保存主动消息以供前端获取
        this.saveProactiveMessage(message);
      }
    } catch (error) {
      console.error('[后台思考] 执行失败:', error);
    }
  }
  
  /**
   * 保存主动消息
   */
  private saveProactiveMessage(message: ProactiveMessage): void {
    this.proactiveMessages.push(message);
    
    // 只保留最近的10条主动消息
    if (this.proactiveMessages.length > 10) {
      this.proactiveMessages = this.proactiveMessages.slice(-10);
    }
    
    console.log(`[主动消息] 已保存: ${message.content.slice(0, 30)}...`);
  }
  
  /**
   * 获取未读的主动消息
   */
  getUnreadProactiveMessages(): ProactiveMessage[] {
    return [...this.proactiveMessages];
  }
  
  /**
   * 清除主动消息（已读）
   */
  clearProactiveMessages(): void {
    this.proactiveMessages = [];
    console.log('[主动消息] 已清除');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

// 重新导出 PersistenceManagerV6（从新位置）
export { PersistenceManagerV6 } from './consciousness-core/persistence';

export function createConsciousnessCore(llmClient: LLMClient): ConsciousnessCore {
  return new ConsciousnessCore(llmClient);
}
