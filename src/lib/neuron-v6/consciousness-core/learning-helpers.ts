/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 长期学习辅助函数
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 提供长期学习的纯计算函数，不依赖类内部状态
 */

import type { EmotionalTrajectory } from './types';
import { detectEmotionalTone } from './reflection-helpers';

/**
 * 主题关键词列表
 */
const TOPIC_KEYWORDS = [
  '学习', '理解', '思考', '成长', '意义', '价值',
  '关系', '情感', '选择', '变化', '未来', '过去',
  '自我', '他人', '世界', '认知', '创造', '探索',
];

/**
 * 从内容中提取主题
 */
export function extractTopics(contents: string[]): string[] {
  const topics: string[] = [];
  
  for (const keyword of TOPIC_KEYWORDS) {
    if (contents.some(c => c.includes(keyword))) {
      topics.push(keyword);
    }
  }
  
  return [...new Set(topics)].slice(0, 5);
}

/**
 * 从文本中提取关键概念
 */
export function extractKeyConceptsFromText(text: string): string[] {
  // 使用简单的关键词提取
  const concepts: string[] = [];
  
  // 匹配引号中的内容
  const quotedMatches = text.match(/["「」『』]([^"「」『』]+)["「」『』]/g);
  if (quotedMatches) {
    concepts.push(...quotedMatches.map(m => m.replace(/["「」『』]/g, '')));
  }
  
  // 匹配"关于X"、"理解X"等模式
  const aboutMatches = text.match(/(?:关于|理解|学习|思考|探索)([\u4e00-\u9fa5]{2,6})/g);
  if (aboutMatches) {
    concepts.push(...aboutMatches.map(m => m.slice(2)));
  }
  
  return [...new Set(concepts)].slice(0, 10);
}

/**
 * 识别情感轨迹
 */
export function identifyEmotionalTrajectory(
  messages: Array<{ content: string }>
): EmotionalTrajectory {
  const tones = messages.map(m => detectEmotionalTone(m.content));
  
  // 简化的轨迹分析
  const startTone = tones[0] || '平静';
  const endTone = tones[tones.length - 1] || '平静';
  const shifts = tones.length > 1 
    ? tones.slice(1).filter((t, i) => t !== tones[i]).length
    : 0;
  
  return {
    startTone,
    endTone,
    shifts,
    dominantTone: getDominantTone(tones),
  };
}

/**
 * 获取主导情感
 */
export function getDominantTone(tones: string[]): string {
  const counts = new Map<string, number>();
  
  for (const tone of tones) {
    counts.set(tone, (counts.get(tone) || 0) + 1);
  }
  
  let dominant = '平静';
  let maxCount = 0;
  
  for (const [tone, count] of counts) {
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
  const points: string[] = [];
  
  const learningKeywords = ['学到', '理解', '意识到', '发现', '明白', '领悟'];
  
  for (const msg of messages) {
    // 检测学习相关的句子
    const hasLearningKeyword = learningKeywords.some(kw => msg.content.includes(kw));
    
    if (hasLearningKeyword) {
      const sentences = msg.content.split(/[。！？]/);
      for (const sentence of sentences) {
        if (learningKeywords.some(kw => sentence.includes(kw))) {
          points.push(sentence.trim());
        }
      }
    }
  }
  
  return [...new Set(points)].slice(0, 5);
}

/**
 * 生成会话摘要
 */
export function formSessionSummary(params: {
  messageCount: number;
  topics: string[];
  dominantTone: string;
  learningPoints: string[];
}): string {
  const { messageCount, topics, dominantTone, learningPoints } = params;
  
  let summary = `本次对话共 ${messageCount} 条消息。`;
  
  if (topics.length > 0) {
    summary += `主要讨论了${topics.join('、')}等话题。`;
  }
  
  summary += `整体情感基调为${dominantTone}。`;
  
  if (learningPoints.length > 0) {
    summary += `主要学习点：${learningPoints[0]}`;
  }
  
  return summary;
}

/**
 * 分析信念演化
 */
export function analyzeBeliefEvolution(params: {
  currentBeliefs: Array<{ statement: string; confidence: number }>;
  newExperiences: string[];
}): Array<{ belief: string; change: string; reason: string }> {
  const { currentBeliefs, newExperiences } = params;
  const evolution: Array<{ belief: string; change: string; reason: string }> = [];
  
  // 检查新经验是否与现有信念相关
  for (const belief of currentBeliefs) {
    for (const exp of newExperiences) {
      // 简单的关键词匹配
      const keywords = belief.statement.slice(0, 4);
      if (exp.includes(keywords)) {
        evolution.push({
          belief: belief.statement,
          change: 'reinforced',
          reason: `与"${exp.slice(0, 20)}..."相关`,
        });
      }
    }
  }
  
  return evolution;
}

/**
 * 计算目标进度
 */
export function assessGoalProgress(goal: string, experiences: string[]): number {
  // 简化计算：基于关键词匹配
  const goalKeywords = goal.split(/[，,、]/);
  let matchCount = 0;
  
  for (const exp of experiences) {
    for (const keyword of goalKeywords) {
      if (exp.includes(keyword.trim())) {
        matchCount++;
      }
    }
  }
  
  // 计算进度（最高1.0）
  return Math.min(1, matchCount * 0.1);
}

/**
 * 计算意识流一致性
 */
export function calculateStreamCoherence(streams: Array<{ content: string; intensity: number }>): number {
  if (streams.length < 2) return 1;
  
  // 检查各条目之间的情感一致性
  const tones = streams.map(s => detectEmotionalTone(s.content));
  const uniqueTones = new Set(tones);
  
  // 越少的独特情感类型，一致性越高
  const toneDiversity = uniqueTones.size / tones.length;
  
  // 检查强度变化
  const intensities = streams.map(s => s.intensity);
  const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
  const intensityVariance = intensities.reduce((sum, i) => sum + Math.pow(i - avgIntensity, 2), 0) / intensities.length;
  
  // 综合一致性分数
  const coherence = (1 - toneDiversity) * 0.6 + (1 - Math.min(1, intensityVariance)) * 0.4;
  
  return Math.max(0, Math.min(1, coherence));
}
