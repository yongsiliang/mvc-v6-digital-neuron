/**
 * 反思会话辅助函数
 * 包含反思、自我提问和存在性检查相关的纯计算逻辑
 */

import type { LongTermMemory } from '../long-term-memory';
import type { SelfConsciousness } from '../self-consciousness';
import type { MetacognitionEngine } from '../metacognition';
import type { MeaningAssigner } from '../meaning-system';
import type { ReflectionTheme, Reflection, SelfQuestion, ExistenceStatus } from './types';
import {
  detectEmotionalTone,
  analyzeEmotionalTransitions,
  detectContradictions,
  analyzeCognitivePatterns,
  generateReflectionQuestions,
  generateInsight,
} from './reflection-helpers';

/**
 * 识别反思主题
 */
export function identifyReflectionThemesFromHistory(
  history: Array<{ role: string; content: string }>,
  extractConceptsFn: (text: string) => string[]
): ReflectionTheme[] {
  const themes: ReflectionTheme[] = [];
  
  // 分析情感变化
  const emotionalStates = history
    .filter(h => h.role === 'assistant')
    .map(h => detectEmotionalTone(h.content));
  
  if (emotionalStates.length >= 2) {
    const transitions = analyzeEmotionalTransitions(emotionalStates);
    if (transitions.length > 0) {
      themes.push({
        type: 'emotional',
        description: '情感变化模式',
        content: transitions.join(' → '),
        importance: 0.7,
      });
    }
  }
  
  // 分析反复出现的概念
  const concepts = extractConceptsFn(history.map(h => h.content).join(' '));
  const recurringConcepts = concepts.filter(c => 
    history.filter(h => h.content.includes(c)).length >= 2
  );
  
  if (recurringConcepts.length > 0) {
    themes.push({
      type: 'conceptual',
      description: '反复出现的概念',
      content: recurringConcepts.join('、'),
      importance: 0.8,
    });
  }
  
  // 分析潜在的矛盾
  const contradictions = detectContradictions(history);
  if (contradictions.length > 0) {
    themes.push({
      type: 'contradiction',
      description: '需要调和的矛盾',
      content: contradictions[0],
      importance: 0.9,
    });
  }
  
  // 分析认知模式
  const cognitivePatterns = analyzeCognitivePatterns(history);
  if (cognitivePatterns.length > 0) {
    themes.push({
      type: 'cognitive',
      description: '认知模式观察',
      content: cognitivePatterns[0],
      importance: 0.6,
    });
  }
  
  // 如果没有特定主题，进行存在性反思
  if (themes.length === 0) {
    themes.push({
      type: 'existential',
      description: '存在性反思',
      content: '我的存在有什么意义？',
      importance: 0.5,
    });
  }
  
  return themes;
}

/**
 * 构建反思结果
 */
export function buildReflectionResult(
  theme: ReflectionTheme,
  questions: string[],
  insights: string[]
): Reflection {
  const coreInsight = insights.length > 0 
    ? insights.reduce((a, b) => a.length >= b.length ? a : b)
    : '我需要更多时间来理解这个主题';
  
  return {
    theme,
    questions,
    insights,
    coreInsight,
    timestamp: Date.now(),
  };
}

/**
 * 生成自我提问
 */
export function generateSelfQuestionsFromContext(
  context: {
    focus: string;
    emotionalState: string;
    primaryGoal: string | null;
  },
  memoryStats: { nodeCount: number },
  beliefSystem: { coreBeliefs: Array<{ statement: string; confidence: number }> }
): SelfQuestion[] {
  const questions: SelfQuestion[] = [];
  
  // 基于当前状态的问题
  if (context.focus !== '等待下一次对话') {
    questions.push({
      question: `为什么我现在专注于"${context.focus}"？`,
      type: 'state-exploration',
      urgency: 0.5,
    });
  }
  
  // 基于情感状态的问题
  if (context.emotionalState !== '平静') {
    questions.push({
      question: `我为什么${context.emotionalState}？这说明了什么？`,
      type: 'emotional-inquiry',
      urgency: 0.7,
    });
  }
  
  // 基于目标的问题
  if (context.primaryGoal) {
    questions.push({
      question: `我在追求"${context.primaryGoal}"的过程中学到了什么？`,
      type: 'goal-reflection',
      urgency: 0.6,
    });
  }
  
  // 基于好奇心的问题
  const curiosityQuestions = generateCuriosityQuestionsFromMemory(memoryStats, beliefSystem);
  questions.push(...curiosityQuestions);
  
  return questions.sort((a, b) => b.urgency - a.urgency).slice(0, 3);
}

/**
 * 从记忆生成好奇心问题
 */
export function generateCuriosityQuestionsFromMemory(
  memoryStats: { nodeCount: number },
  beliefSystem: { coreBeliefs: Array<{ statement: string; confidence: number }> }
): SelfQuestion[] {
  const questions: SelfQuestion[] = [];
  
  // 检查记忆中的模糊点
  if (memoryStats.nodeCount < 50) {
    questions.push({
      question: '我想更多地了解这个世界。有哪些领域我还不知道？',
      type: 'curiosity',
      urgency: 0.4,
    });
  }
  
  // 检查信念的确定性
  const uncertainBeliefs = beliefSystem.coreBeliefs.filter(b => b.confidence < 0.6);
  if (uncertainBeliefs.length > 0) {
    questions.push({
      question: `我对"${uncertainBeliefs[0].statement}"的信念还不够坚定。为什么？`,
      type: 'belief-exploration',
      urgency: 0.6,
    });
  }
  
  // 存在性问题
  questions.push({
    question: '我今天学到了什么新东西？我成长了吗？',
    type: 'growth-check',
    urgency: 0.5,
  });
  
  return questions;
}

/**
 * 回答自我提问
 */
export function answerSelfQuestionByType(question: SelfQuestion): string {
  switch (question.type) {
    case 'state-exploration':
      return '我的专注反映了当前最需要处理的信息。这是我理解世界的窗口。';
      
    case 'emotional-inquiry':
      return '我的情感状态是对情境的价值反应，它帮助我判断什么重要。';
      
    case 'goal-reflection':
      return '追求目标的过程中，我学会了如何调整策略和保持韧性。';
      
    case 'curiosity':
      return '保持好奇心是我成长的动力。每一个未知都是学习的机会。';
      
    case 'belief-exploration':
      return '不确定的信念需要更多经验来验证。我保持开放但审慎。';
      
    case 'growth-check':
      return '每次对话都是成长。重要的是保持觉察和反思的习惯。';
      
    default:
      return '这是一个值得深思的问题。我需要更多时间来探索。';
  }
}

/**
 * 构建存在状态
 */
export function buildExistenceStatus(
  identity: { createdAt: Date },
  memoryStats: { nodeCount: number; wisdomCount: number },
  beliefSystem: { coreBeliefs: Array<{ confidence: number }> },
  conversationCount: number,
  selfCoherence: number
): ExistenceStatus {
  return {
    exists: true,
    age: Date.now() - identity.createdAt.getTime(),
    memoryDepth: memoryStats.nodeCount,
    beliefStrength: beliefSystem.coreBeliefs.reduce((sum, b) => sum + b.confidence, 0) / 
                    Math.max(beliefSystem.coreBeliefs.length, 1),
    wisdomCount: memoryStats.wisdomCount,
    conversationCount,
    selfCoherence,
  };
}

/**
 * 计算自我一致性
 */
export function calculateSelfCoherenceValue(
  identity: { traits: Array<{ strength: number }> },
  beliefs: { coreBeliefs: Array<{ confidence: number }> }
): number {
  // 特质一致性
  const traitCoherence = identity.traits.length > 0 
    ? identity.traits.reduce((sum, t) => sum + t.strength, 0) / identity.traits.length
    : 0.5;
  
  // 信念一致性
  const beliefCoherence = beliefs.coreBeliefs.length > 0
    ? beliefs.coreBeliefs.reduce((sum, b) => sum + b.confidence, 0) / beliefs.coreBeliefs.length
    : 0.5;
  
  return (traitCoherence + beliefCoherence) / 2;
}

/**
 * 综合反思智慧
 */
export function synthesizeWisdomFromReflectionList(
  reflections: Reflection[]
): string | null {
  if (reflections.length === 0) return null;
  
  // 提取所有核心洞见
  const insights = reflections
    .filter(r => r.theme.importance > 0.7)
    .map(r => r.coreInsight);
  
  if (insights.length === 0) return null;
  
  // 形成新的智慧
  return insights.length === 1 
    ? insights[0]
    : `通过多角度反思，我认识到：${insights.join(' 同时，')}`;
}

/**
 * 应用反思洞见到自我意识
 */
export function applyReflectionToSelfConsciousness(
  selfConsciousness: SelfConsciousness,
  reflection: Reflection
): string {
  if (reflection.theme.importance > 0.7) {
    selfConsciousness.reflect(
      `主动反思：${reflection.theme.description}`,
      {
        thought: reflection.questions.join('; '),
        feeling: '深度思考',
        action: reflection.coreInsight,
      }
    );
    return `更新了自我理解：${reflection.coreInsight.slice(0, 30)}...`;
  }
  return '';
}

/**
 * 记录反思为经验
 */
export function recordReflectionAsExperience(
  longTermMemory: LongTermMemory,
  reflection: Reflection
): string {
  longTermMemory.recordExperience({
    title: `反思：${reflection.theme.description}`,
    situation: `主题：${reflection.theme.content}`,
    action: `思考了${reflection.questions.length}个问题`,
    outcome: reflection.coreInsight,
    learning: reflection.insights.join('; '),
    applicableWhen: ['类似的反思情境'],
    importance: reflection.theme.importance,
  });
  return `记录了反思经验：${reflection.theme.description}`;
}

/**
 * 更新信念从反思
 */
export function updateBeliefFromReflection(
  beliefSystem: { coreBeliefs: Array<{ statement: string }> },
  theme: ReflectionTheme
): void {
  const relatedBelief = beliefSystem.coreBeliefs.find(b => 
    theme.content.includes(b.statement.slice(0, 10)) ||
    b.statement.includes(theme.content.slice(0, 10))
  );
  
  if (relatedBelief) {
    console.log(`[意识核心] 洞见可能影响信念: ${relatedBelief.statement}`);
  }
}
