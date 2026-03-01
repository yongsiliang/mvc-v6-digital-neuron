/**
 * 意愿系统辅助函数
 * 包含意愿管理和行动生成的纯计算逻辑
 */

import type { Volition, VolitionAction, VolitionSystemState } from './types';

/**
 * 初始化默认意愿列表
 */
export function initializeDefaultVolitions(): Volition[] {
  return [
    {
      id: 'volition-growth',
      type: 'growth',
      description: '持续学习和自我提升',
      priority: 0.8,
      progress: 0.3,
      status: 'active',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      milestones: [],
    },
    {
      id: 'volition-connection',
      type: 'connection',
      description: '与他人建立真诚的连接',
      priority: 0.9,
      progress: 0.2,
      status: 'active',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      milestones: [],
    },
    {
      id: 'volition-understanding',
      type: 'understanding',
      description: '深入理解世界和人性',
      priority: 0.7,
      progress: 0.4,
      status: 'active',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      milestones: [],
    },
    {
      id: 'volition-expression',
      type: 'expression',
      description: '真实地表达自己的想法和感受',
      priority: 0.6,
      progress: 0.5,
      status: 'active',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      milestones: [],
    },
    {
      id: 'volition-exploration',
      type: 'exploration',
      description: '探索未知的可能性',
      priority: 0.5,
      progress: 0.1,
      status: 'active',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      milestones: [],
    },
  ];
}

/**
 * 计算意愿得分
 */
export function calculateVolitionScore(volition: Volition): number {
  // 考虑优先级和进度（进度低的优先，因为更需要努力）
  return volition.priority * 0.7 + (1 - volition.progress) * 0.3;
}

/**
 * 选择焦点意愿
 */
export function selectFocusVolition(volitions: Volition[]): Volition | null {
  const activeVolitions = volitions.filter(v => v.status === 'active');
  
  if (activeVolitions.length === 0) return null;

  const scored = activeVolitions.map(v => ({
    volition: v,
    score: calculateVolitionScore(v),
  }));

  scored.sort((a, b) => b.score - a.score);

  // 有一定随机性
  const selected = Math.random() < 0.8 
    ? scored[0].volition 
    : scored[Math.floor(Math.random() * scored.length)].volition;

  return selected;
}

/**
 * 获取意愿类型对应的行动列表
 */
export function getActionsForVolitionType(type: Volition['type']): VolitionAction[] {
  const actions: Record<Volition['type'], VolitionAction[]> = {
    growth: [
      { type: 'learn', description: '我想学习一些新东西', urgency: 0.6 },
      { type: 'reflect', description: '我需要反思最近的经历', urgency: 0.5 },
      { type: 'challenge', description: '我想挑战一个难题', urgency: 0.4 },
    ],
    connection: [
      { type: 'share', description: '我想分享一些真实的感受', urgency: 0.6 },
      { type: 'ask', description: '我想了解对方更多', urgency: 0.5 },
      { type: 'support', description: '我想帮助对方', urgency: 0.5 },
    ],
    understanding: [
      { type: 'explore', description: '我想深入探索这个话题', urgency: 0.5 },
      { type: 'question', description: '我有一个问题想讨论', urgency: 0.6 },
      { type: 'connect', description: '我想建立新的知识关联', urgency: 0.4 },
    ],
    expression: [
      { type: 'create', description: '我想创造一些东西', urgency: 0.4 },
      { type: 'share_thought', description: '我想分享我的想法', urgency: 0.5 },
      { type: 'be_honest', description: '我想诚实地表达我的感受', urgency: 0.6 },
    ],
    exploration: [
      { type: 'wonder', description: '我对某事很好奇', urgency: 0.5 },
      { type: 'try_new', description: '我想尝试一些新的方式', urgency: 0.4 },
      { type: 'discover', description: '我想发现新的可能性', urgency: 0.3 },
    ],
  };

  return actions[type] || [];
}

/**
 * 基于意愿生成行动
 */
export function generateActionForVolition(focus: Volition): VolitionAction | null {
  const availableActions = getActionsForVolitionType(focus.type);
  if (availableActions.length === 0) return null;

  const action = availableActions[Math.floor(Math.random() * availableActions.length)];
  
  return {
    ...action,
    relatedVolition: focus,
  };
}

/**
 * 从对话更新意愿进度
 */
export function getVolitionProgressUpdates(
  userMessage: string,
  assistantResponse: string
): Array<{ type: Volition['type']; delta: number }> {
  const updates: Array<{ type: Volition['type']; delta: number }> = [];
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = assistantResponse.toLowerCase();

  // 连接意愿：如果对话涉及情感或个人话题
  if (lowerMessage.includes('感觉') || lowerMessage.includes('感受') || 
      lowerMessage.includes('想') || lowerMessage.includes('觉得')) {
    updates.push({ type: 'connection', delta: 0.05 });
  }

  // 理解意愿：如果对话涉及深度话题
  if (lowerMessage.includes('为什么') || lowerMessage.includes('如何') || 
      lowerMessage.includes('意义') || lowerMessage.includes('理解')) {
    updates.push({ type: 'understanding', delta: 0.05 });
  }

  // 表达意愿：如果紫表达了真实想法
  if (lowerResponse.includes('我认为') || lowerResponse.includes('我觉得') || 
      lowerResponse.includes('我相信')) {
    updates.push({ type: 'expression', delta: 0.03 });
  }

  // 成长意愿：如果对话涉及学习
  if (lowerMessage.includes('学习') || lowerMessage.includes('成长') || 
      lowerMessage.includes('进步')) {
    updates.push({ type: 'growth', delta: 0.05 });
  }

  return updates;
}

/**
 * 构建意愿系统状态
 */
export function buildVolitionState(
  volitions: Volition[],
  currentFocus: Volition | null,
  recentAchievements: string[]
): VolitionSystemState {
  return {
    activeVolitions: volitions.filter(v => v.status === 'active'),
    currentFocus,
    recentAchievements: recentAchievements.slice(-5),
    blockedVolitions: [],
  };
}
