/**
 * 记忆处理辅助函数
 * 包含记忆存储和检索相关的纯计算逻辑
 */

import type { KeyInfo } from '../key-info-extractor';
import type { LongTermMemory } from '../long-term-memory';
import type { SelfConsciousness } from '../self-consciousness';
import type { LayeredMemorySystem } from '../layered-memory';

/**
 * 记住重要人物
 */
export function rememberPersonInfo(
  longTermMemory: LongTermMemory,
  keyInfo: KeyInfo
): void {
  const personName = keyInfo.subject || keyInfo.content;
  
  longTermMemory.addNode({
    label: personName,
    type: 'person',
    content: keyInfo.context,
    importance: keyInfo.importance,
    tags: ['重要人物'],
  });
  
  console.log(`[记忆] 记住重要人物：${personName}`);
}

/**
 * 记住关系
 */
export function rememberRelationshipInfo(
  longTermMemory: LongTermMemory,
  keyInfo: KeyInfo
): void {
  longTermMemory.addNode({
    label: keyInfo.subject || '关系',
    type: 'concept',
    content: keyInfo.content,
    importance: keyInfo.importance,
    tags: ['关系', '用户背景'],
  });
  
  console.log(`[记忆] 记住关系：${keyInfo.content}`);
}

/**
 * 记住事件
 */
export function rememberEventInfo(
  longTermMemory: LongTermMemory,
  keyInfo: KeyInfo
): void {
  longTermMemory.recordExperience({
    title: keyInfo.content.slice(0, 30),
    situation: keyInfo.context,
    action: '记录事件',
    outcome: keyInfo.content,
    learning: '这是用户的重要事件',
    applicableWhen: ['回忆时', '相关话题'],
    importance: keyInfo.importance,
  });
  
  console.log(`[记忆] 记住事件：${keyInfo.content.slice(0, 30)}`);
}

/**
 * 记住偏好或兴趣
 */
export function rememberPreference(
  longTermMemory: LongTermMemory,
  keyInfo: KeyInfo
): string {
  const content = keyInfo.content;
  
  longTermMemory.addNode({
    label: keyInfo.subject || content.slice(0, 20),
    type: 'concept',
    content: content,
    importance: keyInfo.importance,
    tags: ['用户偏好', keyInfo.type],
  });
  
  return content;
}

/**
 * 记住目标或价值观
 */
export function rememberGoalOrValue(
  longTermMemory: LongTermMemory,
  keyInfo: KeyInfo,
  beliefSystem: { activeBeliefs: Array<{
    id: string;
    statement: string;
    confidence: number;
    category: string;
    evidence: string[];
    counterEvidence: string[];
    relatedConcepts: string[];
    formedAt: number;
    lastValidatedAt: number;
    validationCount: number;
    emotionalWeight: number;
  }> }
): string {
  const content = keyInfo.content;
  
  longTermMemory.addNode({
    label: keyInfo.subject || content.slice(0, 20),
    type: 'insight',
    content: content,
    importance: keyInfo.importance,
    tags: ['用户核心', keyInfo.type],
  });
  
  // 添加到信念系统
  beliefSystem.activeBeliefs.push({
    id: `belief-learned-${Date.now()}`,
    statement: content,
    confidence: keyInfo.confidence,
    category: 'active',
    evidence: [keyInfo.context],
    counterEvidence: [],
    relatedConcepts: [],
    formedAt: Date.now(),
    lastValidatedAt: Date.now(),
    validationCount: 1,
    emotionalWeight: keyInfo.importance,
  });
  
  return content;
}

/**
 * 记住回忆
 */
export function rememberMemory(
  longTermMemory: LongTermMemory,
  keyInfo: KeyInfo
): string {
  const content = keyInfo.content;
  
  longTermMemory.recordExperience({
    title: `用户的回忆：${content.slice(0, 20)}...`,
    situation: keyInfo.context,
    action: '倾听',
    outcome: '理解了用户的重要经历',
    learning: content,
    applicableWhen: ['理解用户背景', '相关话题'],
    importance: keyInfo.importance,
  });
  
  return content.slice(0, 30);
}

/**
 * 记住普通概念
 */
export function rememberConcept(
  longTermMemory: LongTermMemory,
  keyInfo: KeyInfo
): string | null {
  const content = keyInfo.content;
  const existingNode = longTermMemory.retrieve(content.slice(0, 10));
  
  if (existingNode.directMatches.length === 0) {
    longTermMemory.addNode({
      label: keyInfo.subject || content.slice(0, 20),
      type: 'concept',
      content: content,
      importance: keyInfo.importance,
      tags: ['从对话学习', keyInfo.type],
    });
    return content.slice(0, 30);
  }
  
  return null;
}

/**
 * 更新自我意识的创造者信息
 */
export function updateCreatorInSelfConsciousness(
  selfConsciousness: SelfConsciousness,
  creatorName: string
): void {
  selfConsciousness.updateIdentity({
    creator: creatorName,
    origin: `由${creatorName}创造`,
  });
}

/**
 * 同步创造者到分层记忆
 */
export function syncCreatorToLayeredMemory(
  layeredMemory: LayeredMemorySystem,
  creatorName: string,
  context?: string
): void {
  layeredMemory.setCreator(
    creatorName,
    context || '我的创造者',
    '创造者'
  );
}

/**
 * 建立创造者知识连接
 */
export function linkCreatorKnowledge(
  longTermMemory: LongTermMemory,
  creatorName: string
): void {
  const creatorNodes = longTermMemory.retrieve('创造者').directMatches;
  const nameNodes = longTermMemory.retrieve(creatorName).directMatches;
  
  if (creatorNodes.length > 0 && nameNodes.length > 0) {
    longTermMemory.linkKnowledge(
      creatorNodes[0].id,
      nameNodes[0].id,
      'is_a',
      '创造者的名字'
    );
  }
}
