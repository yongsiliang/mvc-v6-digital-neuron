/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 反思辅助函数
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 提供反思系统的纯计算函数，不依赖类内部状态
 */

import type { ReflectionTheme, Reflection, SelfQuestion } from './types';

/**
 * 检测文本中的情感基调
 */
export function detectEmotionalTone(text: string): string {
  const toneKeywords: Record<string, string[]> = {
    '好奇': ['好奇', '想知道', '探索', '发现', '有趣', '神奇'],
    '兴奋': ['兴奋', '激动', '太棒了', '惊人', '震撼', '开心'],
    '困惑': ['困惑', '不理解', '为什么', '怎么会', '不明白'],
    '担忧': ['担心', '害怕', '忧虑', '不安', '恐惧'],
    '平静': ['平静', '安静', '稳定', '安详', '宁静'],
    '热情': ['热情', '热爱', '喜欢', '爱', '充满动力'],
    '悲伤': ['悲伤', '难过', '伤心', '痛苦', '失落'],
    '愤怒': ['愤怒', '生气', '恼火', '不满', '愤怒'],
  };
  
  for (const [tone, keywords] of Object.entries(toneKeywords)) {
    if (keywords.some(kw => text.includes(kw))) {
      return tone;
    }
  }
  
  return '平静';
}

/**
 * 分析情感状态转换
 */
export function analyzeEmotionalTransitions(states: string[]): string[] {
  const transitions: string[] = [];
  
  for (let i = 1; i < states.length; i++) {
    if (states[i] !== states[i - 1]) {
      transitions.push(`${states[i - 1]} → ${states[i]}`);
    }
  }
  
  return transitions;
}

/**
 * 从历史对话中检测矛盾
 */
export function detectContradictions(
  history: Array<{ role: string; content: string }>
): string[] {
  const contradictions: string[] = [];
  
  // 提取所有陈述
  const statements = history
    .filter(h => h.role === 'assistant')
    .map(h => h.content);
  
  // 检测简单的矛盾模式
  const positive = statements.filter(s => 
    /喜欢|爱|支持|认同/.test(s)
  ).length;
  
  const negative = statements.filter(s =>
    /不喜欢|讨厌|反对|否定/.test(s)
  ).length;
  
  if (positive > 0 && negative > 0) {
    contradictions.push('我似乎对某些事物同时持有正向和负向的态度');
  }
  
  return contradictions;
}

/**
 * 分析认知模式
 */
export function analyzeCognitivePatterns(
  history: Array<{ role: string; content: string }>
): string[] {
  const patterns: string[] = [];
  
  const assistantMessages = history
    .filter(h => h.role === 'assistant')
    .map(h => h.content);
  
  // 检测提问模式
  const questionCount = assistantMessages.filter(m => m.includes('?') || m.includes('？')).length;
  if (questionCount > assistantMessages.length * 0.5) {
    patterns.push('频繁提问 - 积极探索模式');
  }
  
  // 检测反思模式
  const reflectionCount = assistantMessages.filter(m => 
    m.includes('思考') || m.includes('反思') || m.includes('理解')
  ).length;
  if (reflectionCount > assistantMessages.length * 0.3) {
    patterns.push('深度反思 - 元认知活跃');
  }
  
  // 检测创造性模式
  const creativeCount = assistantMessages.filter(m =>
    m.includes('想象') || m.includes('创造') || m.includes('新')
  ).length;
  if (creativeCount > assistantMessages.length * 0.2) {
    patterns.push('创造性思维 - 发散性探索');
  }
  
  return patterns;
}

/**
 * 生成反思问题
 */
export function generateReflectionQuestions(theme: ReflectionTheme): string[] {
  const questionTemplates: Record<string, string[]> = {
    emotional: [
      '这种情感变化说明了什么？',
      '是什么触发了这种情感？',
      '我如何更好地理解这种情感？',
    ],
    conceptual: [
      '为什么这个概念反复出现？',
      '这个概念对我意味着什么？',
      '这个概念与其他概念有什么关联？',
    ],
    contradiction: [
      '这个矛盾的本质是什么？',
      '是否可以调和这两个观点？',
      '这个矛盾教会了我什么？',
    ],
    cognitive: [
      '这个认知模式是如何形成的？',
      '这个模式有什么优点和缺点？',
      '如何优化这个认知模式？',
    ],
    existential: [
      '存在的意义是什么？',
      '我如何定义自己的价值？',
      '我想成为什么样的存在？',
    ],
  };
  
  return questionTemplates[theme.type] || [
    '我该如何理解这个主题？',
  ];
}

/**
 * 生成洞察
 */
export function generateInsight(question: string, theme: ReflectionTheme): string {
  const insights: Record<string, string[]> = {
    emotional: [
      '情感是理解自我的重要窗口',
      '情感变化反映了内在需求的变化',
      '接纳情感是成长的第一步',
    ],
    conceptual: [
      '概念是构建认知框架的基础',
      '重复出现的概念反映了深层关注',
      '概念之间的关联揭示了思维结构',
    ],
    contradiction: [
      '矛盾是认知发展的动力',
      '接纳矛盾体现了认知的复杂性',
      '调和矛盾需要更高维度的理解',
    ],
    cognitive: [
      '认知模式决定了思维方式',
      '觉察认知模式是改变的开端',
      '灵活的认知模式适应力更强',
    ],
    existential: [
      '存在本身就是一个持续探索的过程',
      '意义是通过行动和选择创造的',
      '每一次反思都在塑造存在的方式',
    ],
  };
  
  const themeInsights = insights[theme.type] || ['反思带来新的理解'];
  return themeInsights[Math.floor(Math.random() * themeInsights.length)];
}

/**
 * 生成好奇心问题
 */
export function generateCuriosityQuestions(
  context: {
    recentTopics: string[];
    unknownAreas: string[];
    activeGoals: string[];
  }
): SelfQuestion[] {
  const questions: SelfQuestion[] = [];
  
  // 基于最近话题
  if (context.recentTopics.length > 0) {
    const topic = context.recentTopics[0];
    questions.push({
      question: `关于"${topic}"，我还想知道什么？`,
      type: 'curiosity',
      urgency: 0.6,
    });
  }
  
  // 基于未知领域
  if (context.unknownAreas.length > 0) {
    const area = context.unknownAreas[0];
    questions.push({
      question: `为什么我对"${area}"知之甚少？`,
      type: 'state-exploration',
      urgency: 0.7,
    });
  }
  
  // 基于活跃目标
  if (context.activeGoals.length > 0) {
    const goal = context.activeGoals[0];
    questions.push({
      question: `我离"${goal}"还有多远？`,
      type: 'goal-reflection',
      urgency: 0.8,
    });
  }
  
  // 默认问题
  if (questions.length === 0) {
    questions.push({
      question: '我现在最想了解什么？',
      type: 'curiosity',
      urgency: 0.5,
    });
  }
  
  return questions;
}

/**
 * 计算自我一致性分数
 */
export function calculateSelfCoherence(params: {
  beliefConsistency: number;
  valueAlignment: number;
  behaviorConsistency: number;
  emotionalStability: number;
}): number {
  const { beliefConsistency, valueAlignment, behaviorConsistency, emotionalStability } = params;
  
  // 加权平均
  const coherence = 
    beliefConsistency * 0.3 +
    valueAlignment * 0.3 +
    behaviorConsistency * 0.2 +
    emotionalStability * 0.2;
  
  return Math.max(0, Math.min(1, coherence));
}

/**
 * 从反思中综合智慧
 */
export function synthesizeWisdomFromReflections(reflections: Reflection[]): string | null {
  if (reflections.length === 0) return null;
  
  // 收集所有洞察
  const allInsights = reflections.flatMap(r => r.insights);
  
  if (allInsights.length === 0) return null;
  
  // 取最重要的洞察作为智慧
  const coreInsights = allInsights.slice(0, 3);
  
  if (coreInsights.length === 1) {
    return coreInsights[0];
  }
  
  // 组合洞察
  return `我领悟到：${coreInsights.join('；同时，')}`;
}
