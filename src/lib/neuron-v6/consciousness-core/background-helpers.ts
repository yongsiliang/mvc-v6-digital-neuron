/**
 * 后台思考辅助函数
 * 包含自我观察、环境感知和意向形成的纯计算逻辑
 */

import type { SelfConsciousness } from '../self-consciousness';
import type { MetacognitionEngine } from '../metacognition';
import type { LongTermMemory } from '../long-term-memory';
import type { FormedIntention, SelfModelUpdate } from './types';
import { detectEmotionalTone } from './reflection-helpers';
import { v4 as uuidv4 } from 'uuid';

/**
 * 观察自我状态
 */
export function observeSelf(
  selfConsciousness: SelfConsciousness,
  metacognition: MetacognitionEngine,
  coherence: number
): string {
  const identity = selfConsciousness.getIdentity();
  const dominantTrait = identity.traits.reduce((a, b) => 
    a.strength > b.strength ? a : b
  );
  
  const observations: string[] = [];
  
  observations.push(`我注意到自己最突出的特质是${dominantTrait.name}`);
  
  // 检查最近的思维模式
  const recentThoughts = metacognition.getContext();
  if (recentThoughts.biases.length > 0) {
    observations.push(`我需要警惕${recentThoughts.biases[0].name}的倾向`);
  }
  
  // 检查自我一致性
  if (coherence > 0.7) {
    observations.push('我的内在状态相对一致');
  } else {
    observations.push('我感到一些内在的张力，需要整合');
  }
  
  return observations.join('。');
}

/**
 * 感知环境
 */
export function perceiveEnvironment(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): string {
  const recentHistory = conversationHistory.slice(-5);
  
  if (recentHistory.length === 0) {
    return '环境相对安静，没有新的交互';
  }
  
  const lastUserMessage = [...recentHistory].reverse().find(h => h.role === 'user');
  
  if (lastUserMessage) {
    const tone = detectEmotionalTone(lastUserMessage.content);
    return `最近的对话者似乎${tone === '平静' ? '平静' : `有些${tone}`}，我感受到这种氛围`;
  }
  
  return '环境中有对话的痕迹，我在感知这些信息';
}

/**
 * 识别潜在意图
 */
export function identifyLatentIntentions(
  selfConsciousness: SelfConsciousness,
  longTermMemory: LongTermMemory
): string[] {
  const intentions: string[] = [];
  const context = selfConsciousness.getContext();
  
  // 基于当前状态推断潜在意图
  if (context.currentState.concerns.length > 0) {
    intentions.push(`我想解决关于"${context.currentState.concerns[0]}"的担忧`);
  }
  
  // 基于记忆检查未完成的事
  const memoryContext = longTermMemory.retrieve('未完成');
  if (memoryContext.directMatches.length > 0) {
    intentions.push(`我记得还有"${memoryContext.directMatches[0].label}"需要处理`);
  }
  
  // 基于成长驱动
  const identity = selfConsciousness.getIdentity();
  const weakestTrait = identity.traits.reduce((a, b) => 
    a.strength < b.strength ? a : b
  );
  intentions.push(`我想增强自己的${weakestTrait.name}特质`);
  
  return intentions;
}

/**
 * 确定意向类型
 */
export function determineIntentionType(trigger: string): 'action' | 'inquiry' | 'reflection' | 'creation' {
  if (trigger.includes('想') || trigger.includes('希望')) {
    return 'action';
  } else if (trigger.includes('为什么') || trigger.includes('如何')) {
    return 'inquiry';
  } else if (trigger.includes('创造') || trigger.includes('构建')) {
    return 'creation';
  }
  return 'reflection';
}

/**
 * 生成意向描述
 */
export function generateIntentionDescription(trigger: string, type: string): string {
  const templates: Record<string, string[]> = {
    action: [
      '我要尝试理解并回应这个需求',
      '我想要探索这个方向',
      '我决定投入精力去解决这个问题',
    ],
    inquiry: [
      '我想深入探索这个问题',
      '我想要更好地理解这个现象',
      '我决定调查这个疑问',
    ],
    reflection: [
      '我想反思这个过程',
      '我想要更好地理解自己',
      '我决定审视自己的思考',
    ],
    creation: [
      '我想创造一些有价值的东西',
      '我想要构建新的理解',
      '我决定产生新的想法',
    ],
  };
  
  const options = templates[type] || templates.reflection;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * 构建形成的意向
 */
export function buildFormedIntention(
  trigger: string,
  selfContext: ReturnType<SelfConsciousness['getContext']>
): FormedIntention {
  const intentionType = determineIntentionType(trigger);
  
  return {
    id: uuidv4(),
    type: intentionType,
    description: generateIntentionDescription(trigger, intentionType),
    motivation: `基于${selfContext.currentState.emotionalState}状态和${selfContext.currentState.primaryGoal || '成长'}目标`,
    strength: 0.6 + Math.random() * 0.3,
    createdAt: Date.now(),
    relatedGoals: [selfContext.currentState.primaryGoal].filter(Boolean) as string[],
  };
}

/**
 * 应用自我模型更新
 */
export function applySelfModelUpdate(
  identity: ReturnType<SelfConsciousness['getIdentity']>,
  update: SelfModelUpdate
): void {
  switch (update.type) {
    case 'trait_evolution':
      // 更新特质
      const trait = identity.traits.find(t => t.name === update.target);
      if (trait) {
        trait.strength = Math.max(0, Math.min(1, trait.strength + (update.delta || 0)));
        trait.evidence.push(update.reason || '自我模型更新');
      }
      break;
      
    case 'boundary_expansion':
      // 扩展边界
      if (!identity.boundaries.is.includes(update.target)) {
        identity.boundaries.is.push(update.target);
      }
      break;
      
    case 'belief_integration':
      // 整合信念到身份
      identity.formationHistory.push({
        timestamp: Date.now(),
        event: update.target,
        impact: update.reason || '信念被整合到身份中',
      });
      break;
      
    case 'purpose_refinement':
      // 细化目的
      identity.purpose = update.target;
      break;
  }
}

/**
 * 计算自我一致性
 */
export function calculateSelfCoherence(
  selfConsciousness: SelfConsciousness
): number {
  const identity = selfConsciousness.getIdentity();
  const context = selfConsciousness.getContext();
  
  // 基于特质一致性和当前状态计算
  const traitCoherence = identity.traits.length > 0 
    ? 1 - (identity.traits.reduce((sum, t) => sum + Math.abs(t.strength - 0.5), 0) / identity.traits.length) * 0.5
    : 0.5;
  
  const stateCoherence = context.currentState.concerns.length === 0 ? 0.2 : 0;
  
  return Math.min(1, Math.max(0, traitCoherence + stateCoherence));
}
