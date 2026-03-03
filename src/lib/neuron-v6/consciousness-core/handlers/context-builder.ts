/**
 * 上下文构建器
 * 处理 ConsciousnessCore 中的上下文构建逻辑
 * 
 * 超越传统的记忆系统架构：
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                🚀 超级记忆系统 (SuperMemorySystem)                   │
 * │  ┌─────────────────────────────────────────────────────────────┐   │
 * │  │ 艾宾浩斯遗忘曲线 → 最优复习点计算                              │   │
 * │  │ 情感加权 → 情感越强，记忆越深                                  │   │
 * │  │ 联想网络 → 激活扩散，一触百发                                  │   │
 * │  │ 睡眠巩固 → 模拟大脑整理记忆                                    │   │
 * │  └─────────────────────────────────────────────────────────────┘   │
 * └─────────────────────────────────────────────────────────────────────┘
 *                           ↓
 * ┌─────────────────────────────────────────────────────────┐
 * │                   工作记忆 (WorkingMemory)               │
 * │    当前对话上下文、最近输入、当前思考焦点                  │
 * │    容量: 30 项，智能衰减                                 │
 * └─────────────────────────────────────────────────────────┘
 *                           ↓
 * ┌─────────────────────────────────────────────────────────┐
 * │              分层记忆 (LayeredMemorySystem)              │
 * │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
 * │  │ 核心层   │→ │ 巩固层   │→ │ 情景层   │              │
 * │  │(永久)    │  │(长期)    │  │(短期)    │              │
 * │  └──────────┘  └──────────┘  └──────────┘              │
 * └─────────────────────────────────────────────────────────┘
 */

import type { LongTermMemory } from '../../long-term-memory';
import type { LayeredMemorySystem } from '../../layered-memory';
import type { UnifiedMemoryManager } from '../../memory/unified-manager';
import type { SuperMemorySystem } from '../../memory/super-memory';
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
  layeredMemory?: LayeredMemorySystem;  // 分层记忆支持
  unifiedMemoryManager?: UnifiedMemoryManager;  // 统一记忆管理器
  superMemory?: SuperMemorySystem;  // 🚀 超级记忆系统（超越传统）
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
    // 🆕 1. 优先使用统一记忆管理器（如果可用）
    if (this.deps.unifiedMemoryManager) {
      return this.buildContextWithUnifiedMemory(input);
    }
    
    // 降级：使用传统方式
    return this.buildContextLegacy(input);
  }
  
  /**
   * 使用统一记忆管理器构建上下文（推荐路径）
   */
  private async buildContextWithUnifiedMemory(input: string): Promise<ConsciousnessContext> {
    const unifiedMemory = this.deps.unifiedMemoryManager!;
    
    // 1. 添加用户输入到工作记忆
    unifiedMemory.addUserInput(input);
    
    // 2. 获取完整的工作记忆
    const allWorkingMemory = unifiedMemory.getAllWorkingMemory();
    const workingMemorySummary = unifiedMemory.getWorkingMemorySummary();
    
    console.log(`[上下文] 工作记忆完整内容: ${allWorkingMemory.length} 条`);
    
    // 3. 🚀 使用超级记忆系统检索（超越传统的关键！）
    // 基于艾宾浩斯遗忘曲线 + 情感加权 + 联想激活扩散
    let superMemoryResults: Array<{ memory: { content: string; importance: number; consolidationLevel: number; emotionalBoost: number }; relevance: number; activation?: number }> = [];
    
    if (this.deps.superMemory) {
      superMemoryResults = this.deps.superMemory.recall(input, {
        maxResults: 10,
        spreadActivation: true,  // 启用联想激活扩散
      });
      
      console.log(`[上下文] 🚀 超级记忆检索: ${superMemoryResults.length} 条（含联想激活）`);
      
      // 记录高激活的记忆
      for (const result of superMemoryResults) {
        if (result.activation && result.activation > 0.3) {
          console.log(`[上下文] 🚀 联想激活: "${result.memory.content.slice(0, 20)}..." (激活度: ${result.activation.toFixed(2)})`);
        }
      }
    }
    
    // 4. 统一记忆检索（用于查找相关长期记忆）
    const retrievalResult = unifiedMemory.retrieve(input, { maxResults: 8 });
    
    console.log(`[上下文] 统一检索: ` +
      `核心=${retrievalResult.coreMatches.length}, ` +
      `巩固=${retrievalResult.consolidatedMatches.length}, ` +
      `情景=${retrievalResult.episodicMatches.length}`);
    
    // 5. 构建长期记忆结构
    const memory = this.deps.longTermMemory.retrieve(input, {
      maxResults: 5,
      includeExperiences: true,
      includeWisdoms: true,
    });
    
    // 6. 将完整工作记忆注入到 memory.summary
    if (allWorkingMemory.length > 0) {
      memory.summary = (memory.summary || '') + 
        `\n\n【当前工作记忆】\n${workingMemorySummary}`;
    }
    
    // 7. 🚀 将超级记忆系统检索结果注入（超越传统的关键！）
    if (superMemoryResults.length > 0) {
      const superMemorySection = superMemoryResults
        .slice(0, 5)
        .map(r => {
          const strengthIndicator = r.memory.consolidationLevel > 5 ? '⚡' : 
                                    r.memory.emotionalBoost > 0.5 ? '❤️' : '📝';
          return `${strengthIndicator} ${r.memory.content}`;
        })
        .join('\n');
      
      memory.summary = (memory.summary || '') + 
        `\n\n【🚀 深层记忆】\n${superMemorySection}`;
    }
    
    // 8. 合并核心记忆
    if (retrievalResult.coreMatches.length > 0) {
      memory.summary = (memory.summary || '') + 
        ` 核心记忆：${retrievalResult.coreMatches.map(m => m.value).join('、')}`;
    }
    
    // 9. 合并巩固记忆
    for (const cons of retrievalResult.consolidatedMatches.slice(0, 3)) {
      memory.directMatches.push({
        id: cons.memory.id,
        label: cons.memory.content.slice(0, 20),
        type: 'concept',
        content: cons.memory.content,
        importance: cons.memory.importance,
        tags: cons.memory.tags,
        source: { type: 'conversation', timestamp: cons.memory.consolidatedAt },
        accessCount: cons.memory.recallCount,
        lastAccessedAt: cons.memory.lastRecalledAt,
      });
    }
    
    // 10. 合并情景记忆
    if (retrievalResult.episodicMatches.length > 0) {
      memory.relevantExperiences = memory.relevantExperiences || [];
      for (const epi of retrievalResult.episodicMatches.slice(0, 2)) {
        memory.relevantExperiences.push({
          id: epi.memory.id,
          title: epi.memory.content.slice(0, 30),
          situation: '',
          action: '',
          outcome: epi.memory.content,
          learning: '',
          applicableWhen: [],
          importance: epi.memory.importance,
          timestamp: epi.memory.timestamp,
        });
      }
    }
    
    // 10. 构建上下文其余部分
    const concepts = this.extractConcepts(input);
    const activeMeanings = this.buildActiveMeanings(concepts, input);
    const self = this.deps.selfConsciousness.getContext();
    const metacognition = this.deps.metacognition.getContext();
    
    const beliefSystem = this.deps.meaningAssigner.getBeliefSystem();
    const valueSystem = this.deps.meaningAssigner.getValueSystem();
    
    const coreBeliefs = beliefSystem.coreBeliefs.slice(0, 3).map((b: Belief) => ({
      statement: b.statement,
      confidence: b.confidence,
    }));
    
    const coreValues = valueSystem.coreValues.slice(0, 5).map((v: MeaningValue) => v.name);
    
    const summary = retrievalResult.summary || this.generateContextSummary(self, activeMeanings, memory);
    
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
   * 传统方式构建上下文（降级路径）
   */
  private async buildContextLegacy(input: string): Promise<ConsciousnessContext> {
    // 1. 检索相关记忆（长期记忆）
    const memory = this.deps.longTermMemory.retrieve(input, {
      maxResults: 5,
      includeExperiences: true,
      includeWisdoms: true,
    });
    
    // 1.5 从分层记忆系统检索相关记忆
    if (this.deps.layeredMemory) {
      const layeredResult = this.deps.layeredMemory.retrieve(input, { maxResults: 5 });
      
      // 将分层记忆结果合并到 memory 对象中
      if (layeredResult.coreMatches.length > 0) {
        memory.summary = (memory.summary || '') + ` 核心记忆：${layeredResult.coreMatches.map(m => m.value).join('、')}`;
        console.log(`[上下文] 从核心层检索到 ${layeredResult.coreMatches.length} 条记忆`);
      }
      
      if (layeredResult.consolidatedMatches.length > 0) {
        // 将巩固记忆添加到直接匹配中
        for (const cons of layeredResult.consolidatedMatches.slice(0, 3)) {
          memory.directMatches.push({
            id: cons.id,
            label: cons.content.slice(0, 20),
            type: 'concept',
            content: cons.content,
            importance: cons.importance,
            tags: cons.tags,
            source: { type: 'conversation', timestamp: cons.consolidatedAt },
            accessCount: cons.recallCount,
            lastAccessedAt: cons.lastRecalledAt,
          });
        }
        console.log(`[上下文] 从巩固层检索到 ${layeredResult.consolidatedMatches.length} 条记忆`);
      }
      
      if (layeredResult.episodicMatches.length > 0) {
        // 将情景记忆添加到相关记忆中
        for (const epi of layeredResult.episodicMatches.slice(0, 2)) {
          memory.relevantExperiences = memory.relevantExperiences || [];
          memory.relevantExperiences.push({
            id: epi.id,
            title: epi.content.slice(0, 30),
            situation: '',
            action: '',
            outcome: epi.content,
            learning: '',
            applicableWhen: [],
            importance: epi.importance,
            timestamp: epi.timestamp,
          });
        }
        console.log(`[上下文] 从情景层检索到 ${layeredResult.episodicMatches.length} 条记忆`);
      }
    }
    
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
    
    // 生成摘要
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
