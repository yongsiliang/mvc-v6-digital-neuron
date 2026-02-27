/**
 * V6 记忆状态查看 API
 * 
 * 用于检查持久化状态和记忆内容
 */

import { NextRequest } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { PersistenceManagerV6 } from '@/lib/neuron-v6/consciousness-core';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';
import { getCoreMemory } from '@/storage/core-memory-service';

export async function GET(request: NextRequest) {
  try {
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await getSharedCore(headers);
    
    // 检查持久化状态
    const hasPersistedState = await PersistenceManagerV6.exists();
    
    // 获取持久化状态
    const persistedState = core.getPersistedState();
    
    // ═══════════════════════════════════════════════════════════════
    // 优先从数据库核心记忆表读取创造者信息
    // ═══════════════════════════════════════════════════════════════
    let dbCreatorName: string | null = null;
    try {
      dbCreatorName = await getCoreMemory('creator_name');
      console.log('[Memory Status] 数据库中的创造者:', dbCreatorName);
    } catch (error) {
      console.log('[Memory Status] 数据库读取失败:', error);
    }
    
    // 从分层记忆状态中提取核心记忆
    const layeredMemoryState = persistedState.layeredMemoryState;
    const coreMemories: Array<{ key: string; value: string }> = [];
    
    console.log('[Memory Status] layeredMemoryState exists:', !!layeredMemoryState);
    
    // 提取创造者信息
    if (layeredMemoryState?.core?.creator) {
      coreMemories.push({
        key: 'creator',
        value: `创造者是${layeredMemoryState.core.creator.name}。${layeredMemoryState.core.creator.description}`,
      });
    }
    
    // 提取核心关系
    if (layeredMemoryState?.core?.coreRelationships) {
      for (const rel of layeredMemoryState.core.coreRelationships) {
        coreMemories.push({
          key: `relationship_${rel.personName}`,
          value: `${rel.personName}是我的${rel.relationshipType}`,
        });
      }
    }
    
    // 确定创造者信息
    const creatorMemory = coreMemories.find(m => m.key === 'creator');
    const creatorName = dbCreatorName || (creatorMemory ? extractCreatorName(creatorMemory.value) : null);
    
    return Response.json({
      success: true,
      persistence: {
        hasState: hasPersistedState,
        version: persistedState.version,
        lastSaved: new Date(persistedState.timestamp).toISOString(),
      },
      identity: {
        name: persistedState.identity.name,
        whoAmI: persistedState.identity.whoAmI,
        traits: persistedState.identity.traits.slice(0, 10),
      },
      layeredMemory: {
        stats: persistedState.layeredMemory,
        coreMemories: coreMemories,
        consolidatedCount: layeredMemoryState?.consolidated?.length || 0,
        episodicCount: layeredMemoryState?.episodic?.length || 0,
      },
      database: {
        creatorName: dbCreatorName,
      },
      message: creatorName 
        ? `创造者信息已存储: ${creatorName}`
        : '未找到创造者信息，请先告诉紫你的创造者信息',
    });
    
  } catch (error) {
    console.error('[Memory Status API] Error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * 从内容中提取创造者名字
 */
function extractCreatorName(content: string): string | null {
  if (!content) return null;
  const match = content.match(/我的创造者是([^。]+)/);
  return match ? match[1] : null;
}
