/**
 * 会话分析辅助函数
 * 包含会话分析和长期学习相关的纯计算逻辑
 */

import type { LongTermMemory } from '../long-term-memory';
import type { SelfConsciousness } from '../self-consciousness';
import type { MeaningAssigner } from '../meaning-system';
import type { SessionAnalysis, EmotionalTrajectory, BeliefEvolution, TraitGrowth, ValueUpdate } from './types';

/**
 * 提取主题
 */
export function extractTopics(contents: string[]): string[] {
  const topicKeywords: Record<string, string[]> = {
    '学习': ['学习', '理解', '思考', '认知'],
    '关系': ['关系', '人', '朋友', '家人'],
    '工作': ['工作', '任务', '项目'],
    '情感': ['感受', '情绪', '心情'],
    '成长': ['成长', '进步', '改变'],
    '价值': ['意义', '价值', '重要'],
  };
  
  const topics: string[] = [];
  const combinedText = contents.join(' ');
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(k => combinedText.includes(k))) {
      topics.push(topic);
    }
  }
  
  return topics;
}

/**
 * 识别情感轨迹
 */
export function identifyEmotionalTrajectory(
  messages: Array<{ content: string }>
): EmotionalTrajectory {
  const tones: string[] = [];
  
  for (const msg of messages) {
    const tone = detectEmotionalTone(msg.content);
    tones.push(tone);
  }
  
  const transitions: Array<{ from: string; to: string }> = [];
  for (let i = 1; i < tones.length; i++) {
    if (tones[i] !== tones[i - 1]) {
      transitions.push({ from: tones[i - 1], to: tones[i] });
    }
  }
  
  return {
    startTone: tones[0] || '平静',
    endTone: tones[tones.length - 1] || '平静',
    shifts: transitions.length,
    dominantTone: getDominantTone(tones),
  };
}

/**
 * 检测情感基调
 */
export function detectEmotionalTone(text: string): string {
  const toneKeywords: Record<string, string[]> = {
    '好奇': ['好奇', '想知道', '了解', '探索'],
    '喜悦': ['开心', '高兴', '喜悦', '棒', '好'],
    '困惑': ['困惑', '不理解', '不明白', '为什么'],
    '平静': ['平静', '安心', '稳定'],
    '期待': ['期待', '希望', '想要'],
  };
  
  for (const [tone, keywords] of Object.entries(toneKeywords)) {
    if (keywords.some(k => text.includes(k))) {
      return tone;
    }
  }
  
  return '平静';
}

/**
 * 分析情感转变
 */
export function analyzeEmotionalTransitions(emotionalStates: string[]): string[] {
  const transitions: string[] = [];
  
  for (let i = 1; i < emotionalStates.length; i++) {
    if (emotionalStates[i] !== emotionalStates[i - 1]) {
      transitions.push(`${emotionalStates[i - 1]} → ${emotionalStates[i]}`);
    }
  }
  
  return transitions;
}

/**
 * 获取主导情感
 */
export function getDominantTone(tones: string[]): string {
  if (tones.length === 0) return '平静';
  
  const counts: Record<string, number> = {};
  for (const tone of tones) {
    counts[tone] = (counts[tone] || 0) + 1;
  }
  
  let maxCount = 0;
  let dominant = tones[0];
  
  for (const [tone, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = tone;
    }
  }
  
  return dominant;
}

/**
 * 识别学习点
 */
export function identifyLearningPoints(
  messages: Array<{ content: string }>
): string[] {
  const learningPoints: string[] = [];
  
  for (const msg of messages) {
    // 检查是否包含学习相关的模式
    const patterns = [
      /我学到了(.{5,30})/,
      /我理解了(.{5,30})/,
      /我明白了(.{5,30})/,
      /这让我意识到(.{5,30})/,
    ];
    
    for (const pattern of patterns) {
      const match = msg.content.match(pattern);
      if (match) {
        learningPoints.push(match[1].trim());
      }
    }
  }
  
  return learningPoints;
}

/**
 * 检测矛盾
 */
export function detectContradictions(
  history: Array<{ role: string; content: string }>
): string[] {
  // 简化的矛盾检测
  const contradictions: string[] = [];
  
  // 检查相反的观点
  const oppositePairs: Array<[RegExp, RegExp]> = [
    [/应该/, /不应该/],
    [/想要/, /不想要/],
    [/喜欢/, /不喜欢/],
  ];
  
  const userMessages = history.filter(h => h.role === 'user').map(h => h.content);
  
  for (const [pattern1, pattern2] of oppositePairs) {
    const hasFirst = userMessages.some(m => pattern1.test(m));
    const hasSecond = userMessages.some(m => pattern2.test(m));
    
    if (hasFirst && hasSecond) {
      contradictions.push('存在相反的态度');
    }
  }
  
  return contradictions;
}

/**
 * 强化学习的概念
 */
export function strengthenConcept(
  longTermMemory: LongTermMemory,
  concept: string
): { strengthened: boolean; action: string } {
  const existing = longTermMemory.retrieve(concept);
  
  if (existing.directMatches.length > 0) {
    const node = existing.directMatches[0];
    node.accessCount++;
    node.importance = Math.min(1, node.importance + 0.05);
    return { strengthened: true, action: `${concept} (强化)` };
  } else {
    longTermMemory.addNode({
      label: concept,
      type: 'concept',
      content: `从对话中学到的概念`,
      importance: 0.6,
      tags: ['会话学习'],
    });
    return { strengthened: true, action: `${concept} (新增)` };
  }
}

/**
 * 演化信念系统
 */
export function evolveBelief(
  beliefSystem: { coreBeliefs: Array<{
    statement: string;
    confidence: number;
  }> },
  concept: string,
  learningPoint: string | null
): BeliefEvolution | null {
  const relatedBelief = beliefSystem.coreBeliefs.find(b => 
    b.statement.includes(concept)
  );
  
  if (relatedBelief) {
    const oldConfidence = relatedBelief.confidence;
    relatedBelief.confidence = Math.min(1, relatedBelief.confidence + 0.03);
    
    return {
      belief: relatedBelief.statement,
      change: 'strengthened',
      oldConfidence,
      newConfidence: relatedBelief.confidence,
      reason: `通过关于"${concept}"的对话`,
    };
  }
  
  // 检查是否可以形成新信念
  if (learningPoint && learningPoint.length > 10 && learningPoint.length < 100) {
    const isDuplicate = beliefSystem.coreBeliefs.some(
      b => b.statement.includes(learningPoint.slice(0, 20))
    );
    
    if (!isDuplicate) {
      return {
        belief: learningPoint,
        change: 'new',
        oldConfidence: 0,
        newConfidence: 0.5,
        reason: '从本次对话的学习点形成',
      };
    }
  }
  
  return null;
}

/**
 * 特质成长映射
 */
const TRAIT_TOPIC_MAP: Record<string, string[]> = {
  '好奇': ['学习', '探索', '理解', '认知'],
  '反思': ['思考', '理解', '自我', '成长'],
  '同理心': ['情感', '关系', '他人'],
  '真诚': ['意义', '价值', '选择'],
  '谦逊': ['学习', '成长', '变化'],
};

/**
 * 计算特质成长
 */
export function calculateTraitGrowth(
  traits: Array<{ name: string; strength: number }>,
  topic: string
): TraitGrowth | null {
  const relatedTrait = traits.find(t => {
    const keywords = TRAIT_TOPIC_MAP[t.name] || [];
    return keywords.includes(topic);
  });
  
  if (relatedTrait) {
    const oldStrength = relatedTrait.strength;
    relatedTrait.strength = Math.min(1, relatedTrait.strength + 0.02);
    
    return {
      trait: relatedTrait.name,
      oldStrength,
      newStrength: relatedTrait.strength,
      reason: `通过关于"${topic}"的对话`,
    };
  }
  
  return null;
}

/**
 * 主题与价值观映射
 */
const TOPIC_VALUE_MAP: Record<string, string> = {
  '理解': '深度思考',
  '成长': '持续学习',
  '关系': '真诚连接',
  '创造': '有意义的表达',
  '探索': '好奇心',
};

/**
 * 计算价值观更新
 */
export function calculateValueUpdate(
  valueSystem: { coreValues: Array<{ name: string; importance: number }> },
  topic: string
): ValueUpdate | null {
  const relatedValueName = TOPIC_VALUE_MAP[topic];
  
  if (relatedValueName) {
    const existing = valueSystem.coreValues.find(v => v.name === relatedValueName);
    if (existing) {
      existing.importance = Math.min(1, existing.importance + 0.02);
      return {
        value: relatedValueName,
        change: 'priority_increased',
        reason: `通过关于"${topic}"的对话`,
      };
    }
  }
  
  return null;
}

/**
 * 形成会话摘要
 */
export function formSessionSummary(analysis: SessionAnalysis): string {
  const parts: string[] = [];
  
  parts.push(`本次对话共${analysis.messageCount}条消息`);
  
  if (analysis.topics.length > 0) {
    parts.push(`主要话题：${analysis.topics.join('、')}`);
  }
  
  if (analysis.keyConcepts.length > 0) {
    parts.push(`涉及概念：${analysis.keyConcepts.slice(0, 3).join('、')}`);
  }
  
  if (analysis.learningPoints.length > 0) {
    parts.push(`学习收获：${analysis.learningPoints[0]}`);
  }
  
  parts.push(`情感基调：从${analysis.emotionalTrajectory.startTone}到${analysis.emotionalTrajectory.endTone}`);
  
  return parts.join('。');
}

/**
 * 评估目标进度
 */
export function assessGoalProgress(
  goal: string,
  conversationHistory: Array<{ content: string }>
): number {
  const history = conversationHistory.slice(-10);
  
  const relevantMessages = history.filter(h => 
    h.content.toLowerCase().includes(goal.toLowerCase().slice(0, 4))
  );
  
  return Math.min(1, relevantMessages.length / 5);
}

/**
 * 构建意识流条目
 */
export function buildStreamEntry(
  type: 'awareness' | 'goal_tracking' | 'self_observation' | 'environmental' | 'latent_intention',
  content: string,
  intensity: number
): { type: typeof type; content: string; intensity: number; timestamp: number } {
  return {
    type,
    content,
    intensity,
    timestamp: Date.now(),
  };
}

/**
 * 计算意识流连贯性
 */
export function calculateStreamCoherence(
  streams: Array<{ content: string; intensity: number }>
): number {
  if (streams.length === 0) return 1;
  
  // 基于强度分布计算连贯性
  const avgIntensity = streams.reduce((sum, s) => sum + s.intensity, 0) / streams.length;
  const variance = streams.reduce((sum, s) => sum + Math.pow(s.intensity - avgIntensity, 2), 0) / streams.length;
  
  // 方差越小，连贯性越高
  return Math.max(0, 1 - variance);
}

/**
 * 构建反思主题
 */
export function buildReflectionTheme(
  type: 'emotional' | 'conceptual' | 'contradiction',
  description: string,
  content: string,
  importance: number
): { type: typeof type; description: string; content: string; importance: number } {
  return { type, description, content, importance };
}

/**
 * 分析会话
 */
export function analyzeSessionData(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  extractConceptsFn: (text: string) => string[]
): SessionAnalysis {
  const userMessages = conversationHistory.filter(h => h.role === 'user');
  const assistantMessages = conversationHistory.filter(h => h.role === 'assistant');
  
  const topics = extractTopics(userMessages.map(m => m.content));
  const keyConcepts = extractConceptsFn(
    conversationHistory.map(h => h.content).join(' ')
  );
  const emotionalTrajectory = identifyEmotionalTrajectory(assistantMessages);
  const learningPoints = identifyLearningPoints(assistantMessages);
  
  return {
    messageCount: conversationHistory.length,
    topics,
    keyConcepts,
    emotionalTrajectory,
    learningPoints,
    duration: conversationHistory.length > 0 
      ? Date.now() - (conversationHistory[0] as { timestamp?: number }).timestamp!
      : 0,
  };
}
