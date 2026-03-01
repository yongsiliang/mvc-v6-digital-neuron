/**
 * 上下文构建器
 * 处理 ConsciousnessCore 中的上下文构建逻辑
 */

import type { LongTermMemory } from '../../long-term-memory';
import type { MeaningAssigner, MeaningContext, Belief, Value as MeaningValue } from '../../meaning-system';
import type { SelfConsciousness, SelfConsciousnessContext } from '../../self-consciousness';
import type { MetacognitionEngine, MetacognitiveContext } from '../../metacognition';
import type { ConsciousnessContext } from '../types';
import { extractConceptsFromText } from '../thinking-helpers';

/**
 * 上下文构建器依赖
 */
export interface ContextBuilderDeps {
  longTermMemory: LongTermMemory;
  meaningAssigner: MeaningAssigner;
  selfConsciousness: SelfConsciousness;
  metacognition: MetacognitionEngine;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * 上下文构建器
 */
export class ContextBuilder {
  private deps: ContextBuilderDeps;

  constructor(deps: ContextBuilderDeps) {
    this.deps = deps;
  }

  /**
   * 构建完整上下文
   */
  async buildContext(input: string): Promise<ConsciousnessContext> {
    // 1. 检索相关记忆
    const memory = this.deps.longTermMemory.retrieve(input, {
      maxResults: 5,
      includeExperiences: true,
      includeWisdoms: true,
    });
    
    // 2. 提取关键概念并赋予意义
    const concepts = this.extractConcepts(input);
    const activeMeanings = this.buildActiveMeanings(concepts, input);
    
    // 3. 获取自我意识上下文
    const self = this.deps.selfConsciousness.getContext();
    
    // 4. 获取元认知上下文
    const metacognition = this.deps.metacognition.getContext();
    
    // 5. 获取核心信念和价值观
    const beliefSystem = this.deps.meaningAssigner.getBeliefSystem();
    const valueSystem = this.deps.meaningAssigner.getValueSystem();
    
    const coreBeliefs = beliefSystem.coreBeliefs.slice(0, 3).map((b: Belief) => ({
      statement: b.statement,
      confidence: b.confidence,
    }));
    
    const coreValues = valueSystem.coreValues.slice(0, 5).map((v: MeaningValue) => v.name);
    
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
  extractConcepts(text: string): string[] {
    return extractConceptsFromText(text);
  }

  /**
   * 构建活跃意义
   */
  private buildActiveMeanings(
    concepts: string[], 
    input: string
  ): MeaningContext {
    const activeMeanings: MeaningContext = {
      activeMeanings: [],
      relevantBeliefs: [],
      valueReminders: [],
      emotionalState: '平静',
      meaningSummary: '',
    };
    
    const conversationContext = this.deps.conversationHistory
      .slice(-3)
      .map(h => h.content)
      .join(' ');
    
    for (const concept of concepts) {
      const meaning = this.deps.meaningAssigner.assignMeaning(concept, {
        content: input,
        conversationContext,
      });
      
      activeMeanings.activeMeanings.push({
        concept: meaning.conceptLabel,
        emotionalTone: meaning.emotionalTone.labels.join(', '),
        importance: meaning.valueJudgment.importance,
        personalRelevance: meaning.personalRelevance.meaningToMe,
      });
    }
    
    activeMeanings.meaningSummary = this.deps.meaningAssigner
      .getMeaningContext(concepts).meaningSummary;
    
    return activeMeanings;
  }

  /**
   * 生成上下文摘要
   */
  private generateContextSummary(
    self: SelfConsciousnessContext,
    meaning: MeaningContext,
    memory: { relevantWisdoms: Array<{ statement: string }> } | null
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
}
