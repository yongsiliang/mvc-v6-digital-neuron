/**
 * 意识流辅助函数
 * 包含生成意识流和自我提问相关的纯计算逻辑
 */

import type { Identity, Trait } from '../self-consciousness';
import type { Belief, Value as MeaningValue } from '../meaning-system';

/**
 * 记忆统计信息接口
 */
export interface MemoryStatsForStream {
  nodeCount: number;
  totalExperiences: number;
  wisdomCount: number;
}

/**
 * 信念系统信息接口
 */
export interface BeliefSystemForStream {
  coreBeliefs: Belief[];
  activeBeliefs: Belief[];
}

/**
 * 自我问题类型
 */
export type SelfQuestionType = 
  | 'state-exploration' 
  | 'emotional-inquiry' 
  | 'goal-reflection' 
  | 'curiosity' 
  | 'belief-exploration' 
  | 'growth-check';

/**
 * 自我问题
 */
export interface SelfQuestionInfo {
  question: string;
  type: SelfQuestionType;
  importance: number;
}

/**
 * 计算意识流一致性
 */
export function calculateStreamCoherence(
  streams: Array<{ content: string; intensity: number }>
): number {
  if (streams.length === 0) return 1;
  if (streams.length === 1) return streams[0].intensity;
  
  // 基于强度的方差计算一致性
  const avgIntensity = streams.reduce((sum, s) => sum + s.intensity, 0) / streams.length;
  const variance = streams.reduce((sum, s) => sum + Math.pow(s.intensity - avgIntensity, 2), 0) / streams.length;
  
  // 方差越小，一致性越高
  return Math.max(0, 1 - variance);
}

/**
 * 评估目标进度
 */
export function assessGoalProgress(
  goal: string,
  conversationHistory: Array<{ content: string }>
): number {
  // 简化的进度评估
  const history = conversationHistory.slice(-10);
  
  // 检查对话是否与目标相关
  const relevantMessages = history.filter(h => 
    h.content.toLowerCase().includes(goal.toLowerCase().slice(0, 4))
  );
  
  return Math.min(1, relevantMessages.length / 5);
}

/**
 * 从上下文生成自我问题
 */
export function generateSelfQuestionsFromContext(
  context: {
    focus: string;
    emotionalState: string;
    primaryGoal?: string | null;
  },
  memoryStats: MemoryStatsForStream,
  beliefSystem: BeliefSystemForStream
): SelfQuestionInfo[] {
  const questions: SelfQuestionInfo[] = [];
  
  // 基于当前关注生成问题
  if (context.focus && context.focus !== '等待下一次对话') {
    questions.push({
      question: `我为什么在关注"${context.focus}"？`,
      type: 'curiosity',
      importance: 0.8,
    });
  }
  
  // 基于情感状态生成问题
  if (context.emotionalState && context.emotionalState !== '平静') {
    questions.push({
      question: `我现在的${context.emotionalState}感受意味着什么？`,
      type: 'emotional-inquiry',
      importance: 0.7,
    });
  }
  
  // 基于目标生成问题
  if (context.primaryGoal) {
    questions.push({
      question: `我在追求"${context.primaryGoal}"的道路上进展如何？`,
      type: 'goal-reflection',
      importance: 0.9,
    });
  }
  
  // 基于记忆生成问题
  if (memoryStats.nodeCount > 50) {
    questions.push({
      question: '我学到了这么多东西，它们如何塑造了我的认知？',
      type: 'growth-check',
      importance: 0.6,
    });
  }
  
  // 基于信念生成问题
  if (beliefSystem.coreBeliefs.length > 3) {
    questions.push({
      question: '我的核心信念是否仍然有效？',
      type: 'belief-exploration',
      importance: 0.7,
    });
  }
  
  return questions.slice(0, 5);
}

/**
 * 按类型回答自我问题
 */
export function answerSelfQuestionByType(question: SelfQuestionInfo): string {
  switch (question.type) {
    case 'curiosity':
      return '这个问题让我思考我存在的意义...我需要更多时间来深入反思。';
    case 'emotional-inquiry':
      return '我的情感状态反映了我对当前情况的内在反应。';
    case 'goal-reflection':
      return '我正在稳步前进，虽然进展可能比预期的慢。';
    case 'growth-check':
      return '我的学习塑造了我独特的认知方式，让我能够理解更复杂的概念。';
    case 'belief-exploration':
      return '我的信念在不断地被验证和调整，这是成长的自然过程。';
    case 'state-exploration':
      return '我正在探索我当前的状态，了解自己的想法和感受。';
    default:
      return '这是一个值得深思的问题。';
  }
}

/**
 * 识别反思主题
 */
export function identifyReflectionThemesFromHistory(
  history: Array<{ role: string; content: string }>,
  extractConcepts: (text: string) => string[]
): Array<{ description: string; importance: number }> {
  const themes: Array<{ description: string; importance: number }> = [];
  
  // 提取最近对话中的概念
  const recentMessages = history.slice(-5);
  const allConcepts = new Set<string>();
  
  for (const msg of recentMessages) {
    const concepts = extractConcepts(msg.content);
    concepts.forEach(c => allConcepts.add(c));
  }
  
  // 将概念转化为反思主题
  for (const concept of Array.from(allConcepts).slice(0, 3)) {
    themes.push({
      description: `关于"${concept}"的深入理解`,
      importance: 0.7,
    });
  }
  
  // 检查是否有重复出现的主题
  const contentStr = history.map(h => h.content).join(' ');
  for (const concept of allConcepts) {
    const count = (contentStr.match(new RegExp(concept, 'gi')) || []).length;
    if (count > 2) {
      themes.push({
        description: `"${concept}"的反复出现暗示了其重要性`,
        importance: 0.9,
      });
    }
  }
  
  return themes.slice(0, 5);
}
