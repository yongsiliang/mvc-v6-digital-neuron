/**
 * ═══════════════════════════════════════════════════════════════════════
 * 上下文构建器 (Context Builder)
 * 
 * 职责：
 * - 构建完整的意识上下文
 * - 检索相关记忆
 * - 提取关键概念
 * - 生成上下文摘要
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { ConsciousnessContext } from './types';
import type { MeaningAssigner, MeaningContext } from '../meaning-system';
import type { SelfConsciousness, SelfConsciousnessContext } from '../self-consciousness';
import type { LongTermMemory, MemoryRetrieval } from '../long-term-memory';
import type { MetacognitionEngine, MetacognitiveContext } from '../metacognition';
import type { LayeredMemorySystem } from '../layered-memory';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface ContextBuilderDeps {
  meaningAssigner: MeaningAssigner;
  selfConsciousness: SelfConsciousness;
  longTermMemory: LongTermMemory;
  metacognition: MetacognitionEngine;
  layeredMemory: LayeredMemorySystem;
}

// ─────────────────────────────────────────────────────────────────────
// 上下文构建器
// ─────────────────────────────────────────────────────────────────────

export class ContextBuilder {
  private deps: ContextBuilderDeps;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  
  constructor(deps: ContextBuilderDeps) {
    this.deps = deps;
  }
  
  /**
   * 更新对话历史
   */
  updateHistory(role: 'user' | 'assistant', content: string): void {
    this.conversationHistory.push({ role, content });
    if (this.conversationHistory.length > 100) {
      this.conversationHistory = this.conversationHistory.slice(-100);
    }
  }
  
  /**
   * 获取对话历史
   */
  getHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.conversationHistory];
  }
  
  /**
   * 构建完整上下文
   */
  async build(input: string): Promise<ConsciousnessContext> {
    // 1. 检索相关记忆
    const memory = this.deps.longTermMemory.retrieve(input, {
      maxResults: 5,
      includeExperiences: true,
      includeWisdoms: true,
    });
    
    // 2. 提取关键概念并赋予意义
    const concepts = this.extractConcepts(input);
    const activeMeanings = await this.buildMeaningContext(concepts, input);
    
    // 3. 获取自我意识上下文
    const self = this.deps.selfConsciousness.getContext();
    
    // 4. 获取元认知上下文
    const metacognition = this.deps.metacognition.getContext();
    
    // 5. 获取核心信念和价值观
    const beliefSystem = this.deps.meaningAssigner.getBeliefSystem();
    const valueSystem = this.deps.meaningAssigner.getValueSystem();
    
    const coreBeliefs = beliefSystem.coreBeliefs.slice(0, 3).map(b => ({
      statement: b.statement,
      confidence: b.confidence,
    }));
    
    const coreValues = valueSystem.coreValues.slice(0, 5).map(v => v.name);
    
    // 6. 生成摘要
    const summary = this.generateSummary(self, activeMeanings, memory);
    
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
  
  // ══════════════════════════════════════════════════════════════════
  // 私有方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 提取概念
   */
  private extractConcepts(text: string): string[] {
    const concepts: string[] = [];
    
    // 重要词汇模式
    const importantPatterns = [
      /学习/g, /理解/g, /思考/g, /感受/g, /关系/g,
      /成长/g, /变化/g, /选择/g, /意义/g, /价值/g,
      /真诚/g, /信任/g, /连接/g, /探索/g, /发现/g,
    ];
    
    for (const pattern of importantPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        concepts.push(...matches);
      }
    }
    
    // 去重
    return [...new Set(concepts)].slice(0, 5);
  }
  
  /**
   * 构建意义上下文
   */
  private async buildMeaningContext(
    concepts: string[], 
    input: string
  ): Promise<MeaningContext> {
    const activeMeanings: MeaningContext = {
      activeMeanings: [],
      relevantBeliefs: [],
      valueReminders: [],
      emotionalState: '平静',
      meaningSummary: '',
    };
    
    for (const concept of concepts) {
      const meaning = this.deps.meaningAssigner.assignMeaning(concept, {
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
    
    activeMeanings.meaningSummary = this.deps.meaningAssigner
      .getMeaningContext(concepts).meaningSummary;
    
    return activeMeanings;
  }
  
  /**
   * 生成上下文摘要
   */
  private generateSummary(
    self: SelfConsciousnessContext,
    meaning: MeaningContext,
    memory: MemoryRetrieval | null
  ): string {
    const parts: string[] = [];
    
    // 自我状态
    parts.push(`我是${self.identity.name}，${self.identity.whoAmI}`);
    parts.push(`当前状态：${self.currentState.emotionalState}`);
    
    // 记忆相关
    if (memory && memory.summary) {
      parts.push(`相关记忆：${memory.summary.slice(0, 100)}`);
    }
    
    // 意义
    if (meaning.meaningSummary) {
      parts.push(`意义：${meaning.meaningSummary.slice(0, 100)}`);
    }
    
    return parts.join('。');
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createContextBuilder(deps: ContextBuilderDeps): ContextBuilder {
  return new ContextBuilder(deps);
}
