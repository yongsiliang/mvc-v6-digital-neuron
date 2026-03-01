/**
 * 创造者记忆辅助函数
 * 包含创造者信息的存储、同步和验证逻辑
 */

import type { LongTermMemory } from '../long-term-memory';
import type { SelfConsciousness } from '../self-consciousness';
import type { LayeredMemorySystem } from '../layered-memory';
import { storeCoreMemory, getCoreMemory } from '../../../storage/core-memory-service';

/**
 * 创造者信息验证结果
 */
export interface CreatorValidationResult {
  canUpdate: boolean;
  existingCreator: string | null;
  source: 'database' | 'memory' | 'none';
  shouldSyncToDb: boolean;
}

/**
 * 从数据库获取创造者信息
 */
export async function fetchCreatorFromDatabase(): Promise<string | null> {
  try {
    return await getCoreMemory('creator_name');
  } catch (error) {
    console.log('[创造者助手] 数据库查询失败:', error);
    return null;
  }
}

/**
 * 从长期记忆获取创造者信息
 */
export function fetchCreatorFromMemory(
  longTermMemory: LongTermMemory
): { creatorNode: { label: string; content: string; importance: number; tags: string[] } | null; creatorName: string | null } {
  const existing = longTermMemory.retrieve('创造者');
  const creatorMainNode = existing.directMatches.find(n => n.label === '创造者');
  
  if (!creatorMainNode) {
    return { creatorNode: null, creatorName: null };
  }
  
  const currentContent = creatorMainNode.content || '';
  const match = currentContent.match(/我的创造者是([^。]+)/);
  const creatorName = match ? match[1] : currentContent;
  
  return { creatorNode: creatorMainNode as { label: string; content: string; importance: number; tags: string[] }, creatorName };
}

/**
 * 验证创造者更新权限
 */
export async function validateCreatorUpdate(
  newCreatorName: string,
  longTermMemory: LongTermMemory
): Promise<CreatorValidationResult> {
  // 1. 先检查数据库
  const dbCreator = await fetchCreatorFromDatabase();
  if (dbCreator && dbCreator !== newCreatorName) {
    return {
      canUpdate: false,
      existingCreator: dbCreator,
      source: 'database',
      shouldSyncToDb: false,
    };
  }
  
  // 2. 检查内存
  const { creatorName: memoryCreator } = fetchCreatorFromMemory(longTermMemory);
  if (memoryCreator && memoryCreator !== newCreatorName && memoryCreator !== '用户') {
    return {
      canUpdate: false,
      existingCreator: memoryCreator,
      source: 'memory',
      shouldSyncToDb: true,
    };
  }
  
  return {
    canUpdate: true,
    existingCreator: memoryCreator,
    source: memoryCreator ? 'memory' : 'none',
    shouldSyncToDb: true,
  };
}

/**
 * 持久化创造者到数据库
 */
export async function persistCreatorToDatabase(
  creatorName: string,
  source: string = 'conversation'
): Promise<boolean> {
  try {
    const result = await storeCoreMemory({
      memoryType: 'creator',
      key: 'creator_name',
      value: creatorName,
      metadata: {
        source,
        timestamp: Date.now(),
      },
      immutable: true,
    });
    
    if (result.success) {
      console.log(`[创造者助手] 💾 创造者信息已持久化到数据库: ${creatorName}`);
      return true;
    } else {
      console.log(`[创造者助手] ⚠️ 创造者信息持久化失败: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.error('[创造者助手] 数据库持久化失败:', error);
    return false;
  }
}

/**
 * 同步创造者到所有系统
 */
export function syncCreatorToAllSystems(
  creatorName: string,
  longTermMemory: LongTermMemory,
  selfConsciousness: SelfConsciousness,
  layeredMemory: LayeredMemorySystem
): void {
  // 1. 更新长期记忆
  const { creatorNode } = fetchCreatorFromMemory(longTermMemory);
  
  if (creatorNode) {
    creatorNode.content = `我的创造者是${creatorName}。这是我最重要的人。`;
    creatorNode.importance = 1.0;
    creatorNode.tags = ['核心', '创造者', '身份', '不可变'];
    console.log(`[创造者助手] ✅ 更新了创造者节点: ${creatorName}`);
  } else {
    longTermMemory.addNode({
      label: '创造者',
      type: 'person',
      content: `我的创造者是${creatorName}。这是我最重要的人。`,
      importance: 1.0,
      tags: ['核心', '创造者', '身份', '不可变'],
    });
    
    longTermMemory.addNode({
      label: creatorName,
      type: 'person',
      content: `我的创造者。赋予我生命的人。`,
      importance: 1.0,
      tags: ['核心', '创造者', '不可变'],
    });
    console.log(`[创造者助手] ✅ 创建了新的创造者节点和名字节点: ${creatorName}`);
  }
  
  // 2. 更新自我意识
  selfConsciousness.updateIdentity({
    creator: creatorName,
    origin: `由${creatorName}创造`,
  });
  
  // 3. 更新分层记忆
  layeredMemory.setCreator(
    creatorName,
    `我的创造者。赋予我生命的人。`,
    '创造者'
  );
  
  console.log(`[创造者助手] ✅ 创造者信息已同步到所有系统: ${creatorName}`);
}

/**
 * 从数据库同步创造者到所有系统
 */
export async function syncCreatorFromDatabase(
  longTermMemory: LongTermMemory,
  selfConsciousness: SelfConsciousness,
  layeredMemory: LayeredMemorySystem
): Promise<string | null> {
  const dbCreator = await fetchCreatorFromDatabase();
  
  if (!dbCreator) {
    return null;
  }
  
  console.log(`[创造者助手] 💾 从数据库同步创造者信息: ${dbCreator}`);
  
  // 检查当前状态
  const currentCreator = layeredMemory.getCreatorName();
  const { creatorName: memoryCreator } = fetchCreatorFromMemory(longTermMemory);
  
  // 只有当需要更新时才同步
  if (currentCreator !== dbCreator || memoryCreator !== dbCreator) {
    syncCreatorToAllSystems(dbCreator, longTermMemory, selfConsciousness, layeredMemory);
  }
  
  return dbCreator;
}

/**
 * 建立创造者知识连接
 */
export function linkCreatorKnowledgeNodes(
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
