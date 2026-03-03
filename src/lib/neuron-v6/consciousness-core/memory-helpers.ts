/**
 * 记忆处理辅助函数
 * 包含记忆存储和检索相关的纯计算逻辑
 * 
 * ⚠️ 重要：记忆必须同时存储到 longTermMemory 和 layeredMemory
 * - longTermMemory 用于检索和知识图谱
 * - layeredMemory 用于持久化存储
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
  keyInfo: KeyInfo,
  layeredMemory?: LayeredMemorySystem
): void {
  const personName = keyInfo.subject || keyInfo.content;
  
  // 存储到 longTermMemory（用于检索）
  longTermMemory.addNode({
    label: personName,
    type: 'person',
    content: keyInfo.context,
    importance: keyInfo.importance,
    tags: ['重要人物'],
  });
  
  // 同时存储到 layeredMemory（用于持久化）
  if (layeredMemory) {
    layeredMemory.addEpisodicMemory(
      `${personName}: ${keyInfo.context || '重要人物'}`,
      {
        importance: keyInfo.importance,
        tags: ['人物', '重要人物'],
        consolidationCandidate: keyInfo.importance > 0.7,
      }
    );
  }
  
  console.log(`[记忆] 记住重要人物：${personName}`);
}

/**
 * 记住关系
 */
export function rememberRelationshipInfo(
  longTermMemory: LongTermMemory,
  keyInfo: KeyInfo,
  layeredMemory?: LayeredMemorySystem
): void {
  // 存储到 longTermMemory
  longTermMemory.addNode({
    label: keyInfo.subject || '关系',
    type: 'concept',
    content: keyInfo.content,
    importance: keyInfo.importance,
    tags: ['关系', '用户背景'],
  });
  
  // 同时存储到 layeredMemory
  if (layeredMemory) {
    layeredMemory.addEpisodicMemory(
      `关系：${keyInfo.content}`,
      {
        importance: keyInfo.importance,
        tags: ['关系', '用户背景'],
        consolidationCandidate: true,
      }
    );
  }
  
  console.log(`[记忆] 记住关系：${keyInfo.content}`);
}

/**
 * 记住事件
 */
export function rememberEventInfo(
  longTermMemory: LongTermMemory,
  keyInfo: KeyInfo,
  layeredMemory?: LayeredMemorySystem
): void {
  const eventTitle = keyInfo.content.slice(0, 30);
  
  // 存储到 longTermMemory
  longTermMemory.recordExperience({
    title: eventTitle,
    situation: keyInfo.context,
    action: '记录事件',
    outcome: keyInfo.content,
    learning: '这是用户的重要事件',
    applicableWhen: ['回忆时', '相关话题'],
    importance: keyInfo.importance,
  });
  
  // 同时存储到 layeredMemory
  if (layeredMemory) {
    layeredMemory.addEpisodicMemory(
      `事件：${keyInfo.content}`,
      {
        importance: keyInfo.importance,
        tags: ['事件', '用户经历'],
        consolidationCandidate: keyInfo.importance > 0.6,
      }
    );
  }
  
  console.log(`[记忆] 记住事件：${eventTitle}`);
}

/**
 * 记住偏好或兴趣
 */
export function rememberPreference(
  longTermMemory: LongTermMemory,
  keyInfo: KeyInfo,
  layeredMemory?: LayeredMemorySystem
): string {
  const content = keyInfo.content;
  
  // 存储到 longTermMemory
  longTermMemory.addNode({
    label: keyInfo.subject || content.slice(0, 20),
    type: 'concept',
    content: content,
    importance: keyInfo.importance,
    tags: ['用户偏好', keyInfo.type],
  });
  
  // 同时存储到 layeredMemory
  if (layeredMemory) {
    layeredMemory.addCorePreference(content);
    layeredMemory.addEpisodicMemory(
      `偏好：${content}`,
      {
        importance: keyInfo.importance,
        tags: ['偏好', keyInfo.type],
        consolidationCandidate: true,
      }
    );
  }
  
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
  }> },
  layeredMemory?: LayeredMemorySystem
): void {
  const content = keyInfo.content;
  
  // 存储到 longTermMemory
  longTermMemory.addNode({
    label: keyInfo.subject || content.slice(0, 20),
    type: 'concept',
    content: content,
    importance: keyInfo.importance || 0.8,
    tags: ['用户目标', keyInfo.type],
  });
  
  // 同时存储到 layeredMemory
  if (layeredMemory) {
    layeredMemory.addCoreValue(content);
    layeredMemory.addEpisodicMemory(
      `价值观：${content}`,
      {
        importance: keyInfo.importance || 0.8,
        tags: ['价值观', '目标'],
        consolidationCandidate: true,
      }
    );
  }
}

/**
 * 记住普通记忆
 */
export function rememberMemory(
  longTermMemory: LongTermMemory,
  keyInfo: KeyInfo,
  layeredMemory?: LayeredMemorySystem
): void {
  // 存储到 longTermMemory
  longTermMemory.addNode({
    label: keyInfo.subject || keyInfo.content.slice(0, 20),
    type: 'concept',
    content: keyInfo.content,
    importance: keyInfo.importance,
    tags: [keyInfo.type],
  });
  
  // 同时存储到 layeredMemory
  if (layeredMemory) {
    layeredMemory.addEpisodicMemory(
      keyInfo.content,
      {
        importance: keyInfo.importance,
        tags: [keyInfo.type],
        consolidationCandidate: keyInfo.importance > 0.6,
      }
    );
  }
  
  console.log(`[记忆] 记住：${keyInfo.content.slice(0, 30)}`);
}

/**
 * 记住概念
 */
export function rememberConcept(
  longTermMemory: LongTermMemory,
  concept: string,
  description: string,
  layeredMemory?: LayeredMemorySystem
): void {
  // 存储到 longTermMemory
  longTermMemory.addNode({
    label: concept,
    type: 'concept',
    content: description,
    importance: 0.5,
    tags: ['概念', '从对话学习'],
  });
  
  // 同时存储到 layeredMemory
  if (layeredMemory) {
    layeredMemory.addEpisodicMemory(
      `${concept}: ${description}`,
      {
        importance: 0.5,
        tags: ['概念'],
        consolidationCandidate: false,
      }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// 以下是原有的辅助函数（保持不变）
// ─────────────────────────────────────────────────────────────────────

/**
 * 从分层记忆重建知识图谱
 */
export function rebuildKnowledgeGraph(
  layeredMemory: LayeredMemorySystem,
  longTermMemory: LongTermMemory
): { coreCount: number; consolidatedCount: number } {
  console.log('[意识核心] 🔄 从分层记忆重建知识图谱...');
  
  // 获取核心层记忆
  const coreMemories = layeredMemory.getCoreMemories();
  
  // 为每个核心记忆在 longTermMemory 中创建节点
  for (const memory of coreMemories) {
    const existingNodes = longTermMemory.retrieve(memory.key, { maxResults: 1 });
    if (existingNodes.directMatches.length > 0) {
      continue;
    }
    createCoreMemoryNode(longTermMemory, memory);
  }
  
  // 获取巩固层的高价值记忆
  const consolidatedMemories = layeredMemory.getConsolidatedMemories({ limit: 20 });
  
  for (const memory of consolidatedMemories) {
    createConsolidatedMemoryNode(longTermMemory, memory);
  }
  
  console.log(`[意识核心] ✅ 知识图谱重建完成，核心节点: ${coreMemories.length}，高价值节点: ${consolidatedMemories.length}`);
  
  return {
    coreCount: coreMemories.length,
    consolidatedCount: consolidatedMemories.length,
  };
}

/**
 * 创建核心记忆节点
 */
function createCoreMemoryNode(
  longTermMemory: LongTermMemory,
  memory: { key: string; value: string; type: string }
): void {
  longTermMemory.addNode({
    label: memory.key,
    type: 'concept',
    content: memory.value,
    importance: 0.9,
    tags: ['核心记忆', memory.type],
  });
}

/**
 * 创建巩固记忆节点
 */
function createConsolidatedMemoryNode(
  longTermMemory: LongTermMemory,
  memory: { id: string; content: string; type: string; importance: number }
): void {
  longTermMemory.addNode({
    label: memory.content.slice(0, 30),
    type: 'concept',
    content: memory.content,
    importance: memory.importance,
    tags: ['巩固记忆', memory.type],
  });
}
