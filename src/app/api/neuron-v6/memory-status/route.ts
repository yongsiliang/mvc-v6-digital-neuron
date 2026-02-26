/**
 * V6 记忆状态查看 API
 * 
 * 用于检查持久化状态和记忆内容
 */

import { NextRequest } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { PersistenceManagerV6 } from '@/lib/neuron-v6/consciousness-core';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';

export async function GET(request: NextRequest) {
  try {
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await getSharedCore(headers);
    
    // 检查持久化状态
    const hasPersistedState = await PersistenceManagerV6.exists();
    
    // 获取持久化状态
    const persistedState = core.getPersistedState();
    
    // 从 fullState.memory 中提取创造者节点
    const memoryState = persistedState.fullState?.memory;
    const creatorNodes: Array<{ label: string; content: string; importance: number }> = [];
    
    console.log('[Memory Status] fullState exists:', !!persistedState.fullState);
    console.log('[Memory Status] memoryState exists:', !!memoryState);
    console.log('[Memory Status] nodes count:', memoryState?.knowledgeGraph?.nodes?.length || 0);
    
    if (memoryState?.knowledgeGraph?.nodes) {
      console.log('[Memory Status] All nodes:', memoryState.knowledgeGraph.nodes.map((n: { label: string }) => n.label));
      for (const node of memoryState.knowledgeGraph.nodes) {
        if (node.label === '创造者' || 
            node.label.toLowerCase().includes('创造者') ||
            node.content?.includes('创造者') ||
            node.tags?.some((t: string) => t.includes('创造者'))) {
          creatorNodes.push({
            label: node.label,
            content: node.content,
            importance: node.importance,
          });
        }
      }
    }
    
    // 从 identity.traits 中提取创造者特质
    const creatorTraits = persistedState.identity.traits.filter(
      (t: { name: string }) => t.name === '创造者' || t.name.toLowerCase().includes('创造者')
    );
    
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
      memory: {
        stats: persistedState.memory,
        creatorNodes: creatorNodes,
        creatorTraits: creatorTraits,
      },
      message: creatorNodes.length > 0 
        ? `创造者信息已存储: ${creatorNodes[0].content}`
        : '未找到创造者信息，请先告诉紫你的创造者信息',
    });
    
  } catch (error) {
    console.error('[Memory Status API] Error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
