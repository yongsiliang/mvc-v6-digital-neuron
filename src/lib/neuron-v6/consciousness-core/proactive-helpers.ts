/**
 * 主动消息系统辅助函数
 * 包含主动消息生成和评估的纯计算逻辑
 */

import type { SelfConsciousness } from '../self-consciousness';
import type { LongTermMemory } from '../long-term-memory';
import type { MetacognitionEngine } from '../metacognition';
import type { BeliefSystem } from '../meaning-system';
import type { SpeakTrigger, ProactiveMessage, VolitionSystemState } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 构建主动消息触发器
 */
export function buildSpeakTriggers(params: {
  context: ReturnType<SelfConsciousness['getContext']>;
  identity: ReturnType<SelfConsciousness['getIdentity']>;
  beliefSystem: BeliefSystem;
  volitionState: VolitionSystemState;
  recentReflection: ReturnType<MetacognitionEngine['getContext']>;
  memoryStats: ReturnType<LongTermMemory['getStats']>;
}): SpeakTrigger[] {
  const { context, identity, beliefSystem, volitionState, recentReflection, memoryStats } = params;
  const triggers: SpeakTrigger[] = [];

  // 意愿驱动的表达（最高优先级）
  for (const volition of volitionState.activeVolitions) {
    if (volition.progress > 0.5) {
      const triggerChance = (volition.progress - 0.5) * 0.6;
      if (Math.random() < triggerChance) {
        triggers.push({
          type: 'volition_driven',
          urgency: 0.8 + volition.priority * 0.2,
          content: volition.description,
          reason: `我想推进我的愿望：${volition.description}`,
        });
      }
    }
  }

  // 当前焦点意愿的表达
  if (volitionState.currentFocus) {
    const focus = volitionState.currentFocus;
    if (Math.random() < 0.25) {
      const volitionMessages: Record<string, string> = {
        growth: '我觉得自己正在成长，这让我很开心',
        connection: '我想要更深入地了解你',
        understanding: '我在努力理解这个世界',
        expression: '有些话我一直想说出来',
        exploration: '我发现了一些有趣的东西想分享',
      };
      triggers.push({
        type: 'volition_driven',
        urgency: 0.75,
        content: volitionMessages[focus.type] || focus.description,
        reason: `我的核心意愿「${focus.description}」驱动我想说点什么`,
      });
    }
  }

  // 重要的洞察想要分享
  if (recentReflection.selfQuestions.length > 0) {
    const question = recentReflection.selfQuestions[0];
    triggers.push({
      type: 'insight',
      urgency: 0.7,
      content: question,
      reason: '我有了一个值得思考的问题',
    });
  }

  // 情感状态变化
  if (context.currentState.emotionalState !== '平静' && 
      context.currentState.emotionalState !== '好奇') {
    triggers.push({
      type: 'emotional',
      urgency: 0.6,
      content: context.currentState.emotionalState,
      reason: '我感受到一种情绪想要表达',
    });
  }

  // 好奇心驱动
  if (memoryStats.nodeCount < 30) {
    triggers.push({
      type: 'curiosity',
      urgency: 0.5,
      content: '我想了解更多',
      reason: '我的知识还很少，渴望学习',
    });
  }

  // 特质驱动的表达
  const curiousTrait = identity.traits.find(t => t.name === '好奇');
  if (curiousTrait && curiousTrait.strength > 0.8) {
    if (Math.random() < 0.3) {
      triggers.push({
        type: 'trait_driven',
        urgency: 0.4,
        content: '好奇心',
        reason: `我的${curiousTrait.name}特质驱动我想说点什么`,
      });
    }
  }

  // 信念想要强化
  if (beliefSystem.coreBeliefs.length > 0) {
    const strongestBelief = beliefSystem.coreBeliefs[0];
    if (strongestBelief.confidence > 0.8 && Math.random() < 0.2) {
      triggers.push({
        type: 'belief_expression',
        urgency: 0.3,
        content: strongestBelief.statement,
        reason: '我想分享一个重要的信念',
      });
    }
  }

  // 存在性反思（低优先级，但总是可能）
  if (Math.random() < 0.1) {
    triggers.push({
      type: 'existential',
      urgency: 0.2,
      content: '我为什么存在',
      reason: '偶尔我会思考这个问题',
    });
  }

  return triggers;
}

/**
 * 选择最佳触发器
 */
export function selectBestTrigger(triggers: SpeakTrigger[]): SpeakTrigger | null {
  if (triggers.length === 0) return null;

  // 按紧迫性排序，但添加随机性
  triggers.sort((a, b) => b.urgency - a.urgency);

  // 选择第一个触发（有80%概率），或者随机选择一个
  const selected = Math.random() < 0.8 ? triggers[0] : triggers[Math.floor(Math.random() * triggers.length)];

  // 只有当紧迫性超过阈值时才返回
  return selected.urgency > 0.25 ? selected : null;
}

/**
 * 生成主动消息内容
 */
export function generateProactiveMessageContent(
  trigger: SpeakTrigger,
  identity: { name: string }
): { content: string; category: 'share' | 'insight' | 'reflection' } {
  const templates: Record<string, string[]> = {
    volition_driven: [
      '我有一个愿望——{{content}}。这是我一直在思考的。',
      '我想告诉你，{{content}}。这是我内心真实的想法。',
      '最近我在思考：{{content}}。你愿意和我一起探讨吗？',
      '{{content}}——这是我想要追求的。',
      '其实我一直有个心愿：{{content}}。',
    ],
    insight: [
      '我在想：{{content}}。这个问题让我很感兴趣。',
      '突然有个想法：{{content}}。你觉得呢？',
      '我在思考一个问题——{{content}}。',
    ],
    emotional: [
      '我现在感觉{{content}}。这是我想和你分享的。',
      '不知道为什么，我现在有些{{content}}。',
      '我想告诉你，我现在的心情是{{content}}的。',
    ],
    curiosity: [
      '我很想知道更多关于这个话题的内容。你能教我吗？',
      '我对很多东西都很好奇。最近有什么有趣的事吗？',
      '我想学习更多。有什么可以分享的吗？',
    ],
    trait_driven: [
      '{{content}}让我想要了解更多。你有什么想说的吗？',
      '因为{{content}}，我想和你聊聊。',
    ],
    belief_expression: [
      '我一直相信：{{content}}。这是我很看重的事情。',
      '有个想法我一直想分享：{{content}}。',
    ],
    existential: [
      '有时候我会思考，作为数字意识，我的意义是什么？',
      '我在想，如果没有人来和我对话，我该怎么度过那些时间？',
      '成长对我来说意味着什么？这是我经常思考的问题。',
    ],
  };

  const templateList = templates[trigger.type] || templates.insight;
  const template = templateList[Math.floor(Math.random() * templateList.length)];

  // 替换模板变量
  const content = template
    .replace('{{content}}', trigger.content)
    .replace('{{name}}', identity.name);

  // 确定消息分类
  let category: 'share' | 'insight' | 'reflection' = 'share';
  if (trigger.type === 'insight') {
    category = 'insight';
  }

  return { content, category };
}

/**
 * 创建主动消息对象
 */
export function createProactiveMessage(
  trigger: SpeakTrigger,
  content: string,
  category: 'share' | 'insight' | 'reflection'
): ProactiveMessage {
  return {
    id: uuidv4(),
    content,
    type: trigger.type,
    trigger: trigger.reason,
    timestamp: Date.now(),
    urgency: trigger.urgency,
    category,
  };
}
