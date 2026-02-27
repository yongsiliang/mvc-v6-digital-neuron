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
    
    // ═══════════════════════════════════════════════════════════════
    // 构建可视化数据
    // ═══════════════════════════════════════════════════════════════
    
    // 从长期记忆提取节点
    const memoryNodes: Array<{
      id: string;
      label: string;
      content: string;
      type: 'core' | 'consolidated' | 'episodic';
      importance: number;
      tags: string[];
    }> = [];
    
    // 添加核心记忆
    for (const cm of coreMemories) {
      memoryNodes.push({
        id: `core-${cm.key}`,
        label: cm.key === 'creator' ? '创造者' : cm.key.replace('relationship_', ''),
        content: cm.value,
        type: 'core',
        importance: 1.0,
        tags: ['核心', cm.key === 'creator' ? '创造者' : '关系'],
      });
    }
    
    // 从 Hebbian 神经网络提取概念节点
    const hebbianNetwork = persistedState.hebbianNetwork;
    if (hebbianNetwork?.neurons && hebbianNetwork.neurons.length > 0) {
      for (const neuron of hebbianNetwork.neurons.slice(0, 15)) {
        memoryNodes.push({
          id: `neuron-${neuron.id}`,
          label: neuron.label,
          content: `概念: ${neuron.label} (激活度: ${neuron.activation.toFixed(2)})`,
          type: neuron.activation > 0.5 ? 'consolidated' : 'episodic',
          importance: Math.min(neuron.activation, 1.0),
          tags: ['概念', '神经网络'],
        });
      }
    }
    
    // 从情景记忆提取
    if (layeredMemoryState?.episodic && layeredMemoryState.episodic.length > 0) {
      for (let i = 0; i < Math.min(layeredMemoryState.episodic.length, 10); i++) {
        const ep = layeredMemoryState.episodic[i];
        memoryNodes.push({
          id: `ep-${i}`,
          label: ep.content?.slice(0, 15) || `情景${i + 1}`,
          content: ep.content || '',
          type: 'episodic',
          importance: ep.importance || 0.3,
          tags: ep.tags?.slice(0, 2) || ['记忆'],
        });
      }
    }
    
    // 从巩固记忆提取
    if (layeredMemoryState?.consolidated && layeredMemoryState.consolidated.length > 0) {
      for (let i = 0; i < Math.min(layeredMemoryState.consolidated.length, 10); i++) {
        const cons = layeredMemoryState.consolidated[i];
        memoryNodes.push({
          id: `cons-${i}`,
          label: cons.content?.slice(0, 15) || `巩固${i + 1}`,
          content: cons.content || '',
          type: 'consolidated',
          importance: cons.importance || 0.6,
          tags: cons.tags?.slice(0, 2) || ['巩固'],
        });
      }
    }
    
    // 从对话历史提取最近的记忆
    const recentMessages = persistedState.conversationHistory?.slice(-5) || [];
    for (let i = 0; i < recentMessages.length; i++) {
      const msg = recentMessages[i];
      if (msg.role === 'user' || msg.role === 'assistant') {
        memoryNodes.push({
          id: `msg-${i}`,
          label: msg.role === 'user' ? '用户说' : '紫回应',
          content: msg.content.slice(0, 100),
          type: 'episodic',
          importance: 0.4,
          tags: ['对话', msg.role],
        });
      }
    }
    
    // 构建连接关系
    const memoryEdges: Array<{
      id: string;
      source: string;
      target: string;
      strength: number;
    }> = [];
    
    // 从 Hebbian 突触提取连接
    if (hebbianNetwork?.synapses && hebbianNetwork.synapses.length > 0) {
      for (let i = 0; i < Math.min(hebbianNetwork.synapses.length, 15); i++) {
        const synapse = hebbianNetwork.synapses[i];
        const sourceNode = memoryNodes.find(n => n.id === `neuron-${synapse.from}`);
        const targetNode = memoryNodes.find(n => n.id === `neuron-${synapse.to}`);
        
        if (sourceNode && targetNode) {
          memoryEdges.push({
            id: `synapse-${i}`,
            source: sourceNode.id,
            target: targetNode.id,
            strength: Math.abs(synapse.weight),
          });
        }
      }
    }
    
    // 如果节点之间没有边，根据标签相似性创建一些关联
    if (memoryEdges.length === 0 && memoryNodes.length > 1) {
      for (let i = 0; i < memoryNodes.length - 1; i++) {
        const commonTags = memoryNodes[i].tags.filter(t => memoryNodes[i + 1].tags.includes(t));
        if (commonTags.length > 0) {
          memoryEdges.push({
            id: `auto-edge-${i}`,
            source: memoryNodes[i].id,
            target: memoryNodes[i + 1].id,
            strength: 0.3,
          });
        }
      }
    }
    
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
      // 新增：可视化数据
      visualization: {
        nodes: memoryNodes,
        edges: memoryEdges,
        stats: {
          totalNodes: memoryNodes.length,
          totalEdges: memoryEdges.length,
          coreCount: memoryNodes.filter(n => n.type === 'core').length,
          consolidatedCount: memoryNodes.filter(n => n.type === 'consolidated').length,
          episodicCount: memoryNodes.filter(n => n.type === 'episodic').length,
        },
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
