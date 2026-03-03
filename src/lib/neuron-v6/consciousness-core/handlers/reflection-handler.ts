/**
 * ═══════════════════════════════════════════════════════════════════════
 * 反思处理器 - 深度元思考版本
 * 
 * 核心改进：
 * - 使用 SSM+MCTS 控制器进行反思决策
 * - 反思过程在 L3（元认知层）进行
 * - 使用隐式向量进行反思过程
 * - 整合赫布学习的联想检索
 * 
 * 反思特性：
 * - 内省：审视自己的思维过程
 * - 元认知：监控和调整认知策略
 * - 自我更新：基于反思结果调整自我模型
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { SelfConsciousness } from '../../self-consciousness';
import type { LongTermMemory } from '../../long-term-memory';
import type { MeaningAssigner } from '../../meaning-system';
import type { MetacognitionEngine } from '../../metacognition';
import type { 
  ReflectionResult, 
  Reflection, 
  ReflectionTheme,
  SelfQuestion,
  InquiryResult 
} from '../types';

// 导入深度元思考模块
import {
  SSMMCTSController,
  createDefaultSSMMCTSController,
  type ThinkingResult,
} from '../../core/ssm-mcts-controller';
import type { EncoderInput } from '../../core/ssm-encoder';
import {
  SSMMemoryBridge,
  createSSMMemoryBridge,
  type ImplicitMemoryEntry,
} from '../../core/ssm-memory-bridge';

import {
  detectEmotionalTone,
  analyzeEmotionalTransitions,
  detectContradictions,
  analyzeCognitivePatterns,
  generateReflectionQuestions,
  generateInsight,
} from '../reflection-helpers';
import {
  identifyReflectionThemesFromHistory,
  buildReflectionResult,
  applyReflectionToSelfConsciousness,
  recordReflectionAsExperience,
  synthesizeWisdomFromReflectionList,
  generateSelfQuestionsFromContext as generateSelfQuestionsFromContextHelper,
  answerSelfQuestionByType,
} from '../reflection-session-helpers';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 反思处理器依赖（新版本）
 */
export interface ReflectionHandlerDeps {
  selfConsciousness: SelfConsciousness;
  longTermMemory: LongTermMemory;
  meaningAssigner: MeaningAssigner;
  metacognition: MetacognitionEngine;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  extractConcepts: (text: string) => string[];
  
  /** 是否启用深度元思考（默认true） */
  useDeepMetaThinking?: boolean;
}

/**
 * 反思模式
 */
export type ReflectionMode = 
  | 'shallow'    // 浅层反思（快速）
  | 'deep'       // 深度反思（完整）
  | 'meta';      // 元认知反思（最高层）

/**
 * 反思触发类型
 */
export type ReflectionTrigger = 
  | 'periodic'     // 周期性反思
  | 'event'        // 事件触发
  | 'contradiction' // 矛盾检测
  | 'goal_change'  // 目标变化
  | 'error';       // 错误修正

/**
 * 隐式反思结果
 */
export interface ImplicitReflectionResult {
  /** 反思向量 */
  reflectionVector: Float32Array;
  
  /** 洞见向量 */
  insightVector: Float32Array;
  
  /** 置信度 */
  confidence: number;
  
  /** 是否需要显式解码 */
  needsDecoding: boolean;
  
  /** 反思深度 */
  depth: number;
}

/**
 * 反思统计
 */
export interface ReflectionStats {
  /** 总反思次数 */
  totalReflections: number;
  
  /** 深度反思次数 */
  deepReflections: number;
  
  /** 产生的洞见数 */
  totalInsights: number;
  
  /** 自我更新次数 */
  selfUpdates: number;
  
  /** 平均反思时间（ms） */
  avgReflectionTime: number;
}

// ─────────────────────────────────────────────────────────────────────
// 反思处理器（深度元思考版本）
// ─────────────────────────────────────────────────────────────────────

/**
 * 反思处理器
 * 
 * 核心改进：
 * 1. 使用 SSM+MCTS 控制器进行反思决策
 * 2. 反思过程在 L3（元认知层）进行
 * 3. 支持联想式反思（通过赫布学习）
 */
export class ReflectionHandler {
  private deps: ReflectionHandlerDeps;
  
  // 深度元思考组件
  private ssmController: SSMMCTSController;
  private memoryBridge: SSMMemoryBridge;
  
  // 是否启用深度元思考
  private useDeepMetaThinking: boolean;
  
  // 统计
  private stats: ReflectionStats;
  
  constructor(deps: ReflectionHandlerDeps) {
    this.deps = deps;
    this.useDeepMetaThinking = deps.useDeepMetaThinking ?? true;
    
    // 初始化 SSM+MCTS 控制器
    this.ssmController = createDefaultSSMMCTSController();
    
    // 初始化记忆桥接
    this.memoryBridge = createSSMMemoryBridge({
      vectorDimension: 256,
      maxMemories: 5000,
    });
    
    // 初始化统计
    this.stats = {
      totalReflections: 0,
      deepReflections: 0,
      totalInsights: 0,
      selfUpdates: 0,
      avgReflectionTime: 0,
    };
  }
  
  /**
   * 执行反思过程
   */
  async reflect(trigger: ReflectionTrigger = 'periodic'): Promise<ReflectionResult> {
    const startTime = Date.now();
    
    // 模式判断
    if (this.useDeepMetaThinking) {
      return this.deepMetaReflect(trigger);
    }
    
    // 传统模式（向后兼容）
    return this.traditionalReflect();
  }
  
  /**
   * 深度元思考反思模式
   */
  private async deepMetaReflect(trigger: ReflectionTrigger): Promise<ReflectionResult> {
    const startTime = Date.now();
    
    // ─── Step 1: 准备反思输入 ───
    const reflectionInput = this.prepareReflectionInput(trigger);
    
    // ─── Step 2: 编码为隐式向量 ───
    const encoderInput: EncoderInput = {
      text: reflectionInput.summary,
      context: reflectionInput.contextStrings,
    };
    
    // ─── Step 3: SSM+MCTS 思考 ───
    const thinkingResult = await this.ssmController.think(encoderInput);
    
    // ─── Step 4: 判断反思类型 ───
    const instruction = thinkingResult.searchResult.decodedInstruction;
    
    // ─── Step 5: 根据类型执行反思 ───
    let reflections: Reflection[] = [];
    let themes: ReflectionTheme[] = [];
    
    if (instruction.type === 'reflect' || instruction.type === 'llm_call') {
      // 需要深度反思
      const result = this.executeDeepReflection(thinkingResult, reflectionInput);
      reflections = result.reflections;
      themes = result.themes;
    } else {
      // 本地反思（轻量级）
      const result = this.executeLocalReflection(reflectionInput);
      reflections = result.reflections;
      themes = result.themes;
    }
    
    // ─── Step 6: 存储反思结果到记忆桥接 ───
    this.memoryBridge.store(
      thinkingResult.ssmOutput.newState,
      undefined,
      'reflection'
    );
    
    // ─── Step 7: 更新赫布连接 ───
    this.updateHebbianConnections(reflections);
    
    // ─── Step 8: 生成自我更新 ───
    const selfUpdates = this.generateSelfUpdates(reflections);
    
    // ─── Step 9: 综合智慧 ───
    const newWisdom = this.synthesizeWisdom(reflections);
    
    // ─── Step 10: 更新统计 ───
    const reflectionTime = Date.now() - startTime;
    this.stats.totalReflections++;
    this.stats.deepReflections++;
    this.stats.totalInsights += reflections.reduce((sum, r) => sum + r.insights.length, 0);
    this.stats.selfUpdates += selfUpdates.length;
    this.stats.avgReflectionTime = 
      (this.stats.avgReflectionTime * (this.stats.totalReflections - 1) + reflectionTime)
      / this.stats.totalReflections;
    
    return {
      themes,
      reflections,
      selfUpdates,
      newWisdom,
      timestamp: Date.now(),
    };
  }
  
  /**
   * 准备反思输入
   */
  private prepareReflectionInput(trigger: ReflectionTrigger): {
    summary: string;
    contextStrings: string[];
    selfState: any;
    memoryStats: any;
  } {
    const selfContext = this.deps.selfConsciousness.getContext();
    const memoryStats = this.deps.longTermMemory.getStats();
    const beliefSystem = this.deps.meaningAssigner.getBeliefSystem();
    
    // 构建反思摘要
    const summary = this.buildReflectionSummary(trigger, selfContext, memoryStats);
    
    // 构建上下文字符串
    const contextStrings: string[] = [
      `当前焦点: ${selfContext.currentState.focus}`,
      `情感状态: ${selfContext.currentState.emotionalState}`,
      `主要目标: ${selfContext.currentState.primaryGoal}`,
      `信念数量: ${beliefSystem.coreBeliefs.length}`,
      `记忆节点: ${memoryStats.nodeCount}`,
    ];
    
    // 添加最近对话主题
    const recentTopics = this.extractRecentTopics();
    if (recentTopics.length > 0) {
      contextStrings.push(`最近话题: ${recentTopics.join(', ')}`);
    }
    
    return {
      summary,
      contextStrings,
      selfState: selfContext,
      memoryStats,
    };
  }
  
  /**
   * 构建反思摘要
   */
  private buildReflectionSummary(
    trigger: ReflectionTrigger,
    selfContext: any,
    memoryStats: any
  ): string {
    const triggerDescriptions: Record<ReflectionTrigger, string> = {
      periodic: '周期性反思',
      event: '事件触发反思',
      contradiction: '检测到矛盾，需要反思',
      goal_change: '目标发生变化，进行反思',
      error: '错误修正反思',
    };
    
    return `${triggerDescriptions[trigger]}。` +
           `当前关注: ${selfContext.currentState.focus}。` +
           `情感: ${selfContext.currentState.emotionalState}。` +
           `目标: ${selfContext.currentState.primaryGoal}。`;
  }
  
  /**
   * 执行深度反思
   */
  private executeDeepReflection(
    thinkingResult: ThinkingResult,
    reflectionInput: ReturnType<typeof this.prepareReflectionInput>
  ): {
    reflections: Reflection[];
    themes: ReflectionTheme[];
  } {
    // 识别反思主题
    const themes = this.identifyThemes();
    
    // 对每个主题进行反思
    const reflections: Reflection[] = [];
    
    for (const theme of themes) {
      // 尝试联想相关记忆
      const associatedMemories = this.associateMemories(theme);
      
      // 生成反思问题
      const questions = generateReflectionQuestions(theme);
      
      // 生成洞见
      const insights = questions
        .map(q => generateInsight(q, theme))
        .filter((i): i is string => Boolean(i));
      
      // 添加联想洞见
      for (const mem of associatedMemories) {
        insights.push(`联想到: ${mem}`);
      }
      
      if (insights.length > 0) {
        reflections.push(buildReflectionResult(theme, questions, insights));
      }
    }
    
    return { reflections, themes };
  }
  
  /**
   * 执行本地反思（轻量级）
   */
  private executeLocalReflection(
    reflectionInput: ReturnType<typeof this.prepareReflectionInput>
  ): {
    reflections: Reflection[];
    themes: ReflectionTheme[];
  } {
    // 简化的主题识别
    const themes = this.identifyThemesQuick();
    
    // 快速反思
    const reflections: Reflection[] = [];
    
    for (const theme of themes.slice(0, 2)) {  // 最多2个主题
      const questions = generateReflectionQuestions(theme);
      const insights = questions.slice(0, 2).map(q => generateInsight(q, theme)).filter(Boolean);
      
      if (insights.length > 0) {
        reflections.push(buildReflectionResult(theme, questions.slice(0, 2), insights));
      }
    }
    
    return { reflections, themes };
  }
  
  /**
   * 联想相关记忆
   */
  private associateMemories(theme: ReflectionTheme): string[] {
    const results: string[] = [];
    
    // 从记忆桥接中检索相关记忆
    const retrievalResult = this.memoryBridge.retrieve(
      this.stringToVector(theme.description),
      3
    );
    
    // 尝试赫布联想
    if (retrievalResult.memories.length > 0) {
      const firstMemory = retrievalResult.memories[0];
      const associations = this.memoryBridge.associate(firstMemory.id, 2);
      
      if (associations) {
        for (const memId of associations.memoryIds.slice(0, 3)) {
          results.push(`关联记忆: ${memId}`);
        }
      }
    }
    
    return results;
  }
  
  /**
   * 更新赫布连接
   */
  private updateHebbianConnections(reflections: Reflection[]): void {
    const memoryIds: string[] = [];
    
    for (const reflection of reflections) {
      // 为每个洞见创建记忆ID
      for (const insight of reflection.insights) {
        memoryIds.push(`insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      }
    }
    
    if (memoryIds.length > 1) {
      this.memoryBridge.batchHebbianLearn(memoryIds);
    }
  }
  
  /**
   * 传统反思模式（向后兼容）
   */
  private async traditionalReflect(): Promise<ReflectionResult> {
    // 识别反思主题
    const themes = this.identifyThemes();
    
    // 对每个主题进行反思
    const reflections: Reflection[] = [];
    for (const theme of themes) {
      const reflection = this.reflectOnTheme(theme);
      if (reflection) {
        reflections.push(reflection);
      }
    }
    
    // 生成自我更新
    const selfUpdates = this.generateSelfUpdates(reflections);
    
    // 形成新的智慧
    const newWisdom = this.synthesizeWisdom(reflections);
    
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
  private identifyThemes(): ReflectionTheme[] {
    return identifyReflectionThemesFromHistory(
      this.deps.conversationHistory,
      this.deps.extractConcepts
    );
  }
  
  /**
   * 快速识别主题（轻量级）
   */
  private identifyThemesQuick(): ReflectionTheme[] {
    const themes: ReflectionTheme[] = [];
    const selfContext = this.deps.selfConsciousness.getContext();
    
    // 基于当前状态快速生成主题
    themes.push({
      type: 'cognitive',
      description: `关于"${selfContext.currentState.focus}"的反思`,
      content: selfContext.currentState.focus,
      importance: 1,
    });
    
    // 情感主题
    if (selfContext.currentState.emotionalState !== '平静') {
      themes.push({
        type: 'emotional',
        description: `关于"${selfContext.currentState.emotionalState}"情感的反思`,
        content: selfContext.currentState.emotionalState,
        importance: 2,
      });
    }
    
    return themes;
  }
  
  /**
   * 对主题进行反思
   */
  private reflectOnTheme(theme: ReflectionTheme): Reflection | null {
    const questions = generateReflectionQuestions(theme);
    
    const insights = questions
      .map(q => generateInsight(q, theme))
      .filter((i): i is string => Boolean(i));
    
    if (insights.length === 0) {
      return null;
    }
    
    return buildReflectionResult(theme, questions, insights);
  }
  
  /**
   * 生成自我更新
   */
  private generateSelfUpdates(reflections: Reflection[]): string[] {
    const updates: string[] = [];
    
    for (const reflection of reflections) {
      if (reflection.coreInsight) {
        updates.push(`反思收获：${reflection.coreInsight}`);
      }
    }
    
    return updates;
  }
  
  /**
   * 综合智慧
   */
  private synthesizeWisdom(reflections: Reflection[]): string | null {
    return synthesizeWisdomFromReflectionList(reflections);
  }
  
  /**
   * 应用反思结果
   */
  applyReflection(result: ReflectionResult): void {
    // 应用到自我意识
    for (const reflection of result.reflections) {
      applyReflectionToSelfConsciousness(this.deps.selfConsciousness, reflection);
      recordReflectionAsExperience(this.deps.longTermMemory, reflection);
    }
  }
  
  /**
   * 生成自我提问
   */
  generateSelfQuestions(): SelfQuestion[] {
    const selfContext = this.deps.selfConsciousness.getContext();
    const memoryStats = this.deps.longTermMemory.getStats();
    const beliefSystem = this.deps.meaningAssigner.getBeliefSystem();
    
    return generateSelfQuestionsFromContextHelper(
      {
        focus: selfContext.currentState.focus,
        emotionalState: selfContext.currentState.emotionalState,
        primaryGoal: selfContext.currentState.primaryGoal,
      },
      { nodeCount: memoryStats.nodeCount },
      { coreBeliefs: beliefSystem.coreBeliefs }
    );
  }
  
  /**
   * 执行自我探询
   */
  async inquire(): Promise<InquiryResult> {
    const questions = this.generateSelfQuestions();
    
    const answers = questions.map(question => ({
      question,
      answer: this.answerQuestion(question),
    }));
    
    return {
      questions,
      answers,
      timestamp: Date.now(),
    };
  }
  
  /**
   * 回答问题
   */
  private answerQuestion(question: SelfQuestion): string {
    return answerSelfQuestionByType(question);
  }
  
  /**
   * 提取最近话题
   */
  private extractRecentTopics(): string[] {
    const topics: string[] = [];
    const recentHistory = this.deps.conversationHistory.slice(-5);
    
    for (const msg of recentHistory) {
      const concepts = this.deps.extractConcepts(msg.content);
      topics.push(...concepts.slice(0, 2));
    }
    
    return [...new Set(topics)].slice(0, 5);
  }
  
  /**
   * 字符串转向量（简化实现）
   */
  private stringToVector(str: string): Float32Array {
    const vector = new Float32Array(256);
    for (let i = 0; i < Math.min(str.length, 256); i++) {
      vector[i] = str.charCodeAt(i) / 65535;
    }
    return vector;
  }
  
  /**
   * 获取统计信息
   */
  getStats(): ReflectionStats {
    return { ...this.stats };
  }
  
  /**
   * 重置控制器状态
   */
  reset(): void {
    this.ssmController.reset();
    this.memoryBridge.clear();
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createReflectionHandler(deps: ReflectionHandlerDeps): ReflectionHandler {
  return new ReflectionHandler(deps);
}

export default ReflectionHandler;
