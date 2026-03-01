/**
 * 上下文构建辅助函数
 * 包含构建意识上下文相关的纯计算逻辑
 */

import type { SelfConsciousnessContext } from '../self-consciousness';
import type { MeaningContext, Belief, Value as MeaningValue } from '../meaning-system';
import type { LongTermMemory, MemoryRetrieval } from '../long-term-memory';
import type { MetacognitiveContext } from '../metacognition';
import { extractConceptsFromText } from './thinking-helpers';

/**
 * 意义赋予器接口
 */
export interface MeaningAssignerInterface {
  assignMeaning(concept: string, context: { content: string; conversationContext: string }): {
    conceptLabel: string;
    emotionalTone: { labels: string[] };
    valueJudgment: { importance: number };
    personalRelevance: { meaningToMe: string };
  };
  getMeaningContext(concepts: string[]): { meaningSummary: string };
  getBeliefSystem(): { coreBeliefs: Belief[]; activeBeliefs: Belief[] };
  getValueSystem(): { coreValues: MeaningValue[] };
}

/**
 * 上下文构建参数
 */
export interface BuildContextParams {
  input: string;
  longTermMemory: LongTermMemory;
  meaningAssigner: MeaningAssignerInterface;
  selfConsciousness: {
    getContext: () => SelfConsciousnessContext;
  };
  metacognition: {
    getContext: () => MetacognitiveContext;
  };
  conversationHistory: Array<{ role: string; content: string }>;
}

/**
 * 上下文构建结果
 */
export interface BuiltContext {
  identity: {
    name: string;
    whoAmI: string;
    traits: string[];
  };
  meaning: MeaningContext;
  self: SelfConsciousnessContext;
  memory: MemoryRetrieval | null;
  metacognition: MetacognitiveContext;
  coreBeliefs: Array<{ statement: string; confidence: number }>;
  coreValues: string[];
  summary: string;
}

/**
 * 提取概念
 */
export function extractConcepts(text: string): string[] {
  return extractConceptsFromText(text);
}

/**
 * 构建活跃意义
 */
export function buildActiveMeanings(
  concepts: string[],
  input: string,
  conversationContext: string,
  meaningAssigner: MeaningAssignerInterface
): MeaningContext {
  const activeMeanings: MeaningContext = {
    activeMeanings: [],
    relevantBeliefs: [],
    valueReminders: [],
    emotionalState: '平静',
    meaningSummary: '',
  };
  
  for (const concept of concepts) {
    const meaning = meaningAssigner.assignMeaning(concept, {
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
  
  activeMeanings.meaningSummary = meaningAssigner
    .getMeaningContext(concepts).meaningSummary;
  
  return activeMeanings;
}

/**
 * 生成上下文摘要
 */
export function generateContextSummary(
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
 * 构建完整上下文
 */
export function buildConsciousnessContext(params: BuildContextParams): BuiltContext {
  const {
    input,
    longTermMemory,
    meaningAssigner,
    selfConsciousness,
    metacognition,
    conversationHistory,
  } = params;
  
  // 1. 检索相关记忆
  const memory = longTermMemory.retrieve(input, {
    maxResults: 5,
    includeExperiences: true,
    includeWisdoms: true,
  });
  
  // 2. 提取关键概念并赋予意义
  const concepts = extractConcepts(input);
  const activeMeanings = buildActiveMeanings(
    concepts,
    input,
    conversationHistory.slice(-3).map(h => h.content).join(' '),
    meaningAssigner
  );
  
  // 3. 获取自我意识上下文
  const self = selfConsciousness.getContext();
  
  // 4. 获取元认知上下文
  const metaContext = metacognition.getContext();
  
  // 5. 获取核心信念和价值观
  const beliefSystem = meaningAssigner.getBeliefSystem();
  const valueSystem = meaningAssigner.getValueSystem();
  
  const coreBeliefs = beliefSystem.coreBeliefs.slice(0, 3).map((b: Belief) => ({
    statement: b.statement,
    confidence: b.confidence,
  }));
  
  const coreValues = valueSystem.coreValues.slice(0, 5).map((v: MeaningValue) => v.name);
  
  // 6. 生成摘要
  const summary = generateContextSummary(self, activeMeanings, memory);
  
  return {
    identity: {
      name: self.identity.name,
      whoAmI: self.identity.whoAmI,
      traits: self.identity.keyTraits,
    },
    meaning: activeMeanings,
    self,
    memory,
    metacognition: metaContext,
    coreBeliefs,
    coreValues,
    summary,
  };
}
