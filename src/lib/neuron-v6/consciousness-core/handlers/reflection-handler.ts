/**
 * 反思处理器
 * 处理 ConsciousnessCore 中的反思相关逻辑
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

/**
 * 反思处理器依赖
 */
export interface ReflectionHandlerDeps {
  selfConsciousness: SelfConsciousness;
  longTermMemory: LongTermMemory;
  meaningAssigner: MeaningAssigner;
  metacognition: MetacognitionEngine;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  extractConcepts: (text: string) => string[];
}

/**
 * 反思处理器
 */
export class ReflectionHandler {
  private deps: ReflectionHandlerDeps;

  constructor(deps: ReflectionHandlerDeps) {
    this.deps = deps;
  }

  /**
   * 执行反思过程
   */
  async reflect(): Promise<ReflectionResult> {
    // 1. 识别反思主题
    const themes = this.identifyThemes();
    
    // 2. 对每个主题进行反思
    const reflections: Reflection[] = [];
    for (const theme of themes) {
      const reflection = this.reflectOnTheme(theme);
      if (reflection) {
        reflections.push(reflection);
      }
    }
    
    // 3. 生成自我更新
    const selfUpdates = this.generateSelfUpdates(reflections);
    
    // 4. 形成新的智慧
    const newWisdom = this.synthesizeWisdom(reflections);
    
    // 5. 构建结果
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
    // 从历史中识别主题
    return identifyReflectionThemesFromHistory(
      this.deps.conversationHistory,
      this.deps.extractConcepts
    );
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
}
