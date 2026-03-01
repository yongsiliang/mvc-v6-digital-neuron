/**
 * 意识核心 - 状态管理辅助函数
 * 包含持久化、恢复和状态管理的纯计算逻辑
 */

import type { HebbianNetwork } from '../hebbian-network';
import type { LongTermMemory } from '../long-term-memory';
import type { LayeredMemorySystem } from '../layered-memory';
import type { SelfConsciousness } from '../self-consciousness';
import type { MeaningAssigner } from '../meaning-system';
import type { PersistedState } from './types';
import {
  syncCreatorFromDatabase,
} from './creator-helpers';
import {
  rebuildKnowledgeGraph,
} from './memory-helpers';

/**
 * 网络状态接口
 */
export interface NetworkState {
  neurons: Array<{ id: string; label: string; activation: number }>;
  synapses: Array<{ from: string; to: string; weight: number }>;
}

/**
 * 构建持久化状态
 */
export function buildPersistedState(
  identity: {
    name: string;
    whoAmI: string;
    traits: Array<{ name: string; strength: number }>;
    createdAt: Date;
  },
  layeredMemory: LayeredMemorySystem,
  meaningAssigner: MeaningAssigner,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  networkState: NetworkState
): PersistedState {
  const layeredStats = layeredMemory.getStats();
  const beliefSystem = meaningAssigner.getBeliefSystem();
  
  return {
    version: '6.0',
    timestamp: Date.now(),
    identity: {
      name: identity.name,
      whoAmI: identity.whoAmI,
      traits: identity.traits.map(t => ({ name: t.name, strength: t.strength })),
    },
    meaning: {
      layers: 0,
      beliefs: beliefSystem.coreBeliefs.length + beliefSystem.activeBeliefs.length,
    },
    layeredMemory: {
      core: {
        hasCreator: layeredStats.core.hasCreator,
        relationshipCount: layeredStats.core.relationshipCount,
      },
      consolidated: layeredStats.consolidated.total,
      episodic: layeredStats.episodic.total,
    },
    conversationHistory: conversationHistory.slice(-50),
    layeredMemoryState: layeredMemory.exportState(),
    hebbianNetwork: {
      neurons: networkState.neurons,
      synapses: networkState.synapses,
    },
    fullState: {
      meaning: meaningAssigner.exportState(),
      self: null as never,
      metacognition: null as never,
    },
  };
}

/**
 * 构建持久化状态（简化版，直接接收组件）
 */
export function buildPersistedStateFromComponents(
  identity: {
    name: string;
    whoAmI: string;
    traits: Array<{ name: string; strength: number }>;
    createdAt: Date;
  },
  layeredMemory: LayeredMemorySystem,
  meaningAssigner: MeaningAssigner,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  networkState: { neurons: Array<{ id: string; label: string; activation: number }>; synapses: Array<{ from: string; to: string; weight: number }>; stats: { totalNeurons: number; totalSynapses: number } }
): PersistedState {
  return buildPersistedState(
    identity,
    layeredMemory,
    meaningAssigner,
    conversationHistory,
    {
      neurons: networkState.neurons,
      synapses: networkState.synapses,
    }
  );
}

/**
 * 恢复意识核心状态（简化版）
 */
export async function restoreConsciousnessState(
  state: PersistedState,
  meaningAssigner: MeaningAssigner,
  selfConsciousness: SelfConsciousness,
  metacognition: { importState: (state: unknown) => void },
  layeredMemory: LayeredMemorySystem,
  longTermMemory: LongTermMemory,
  network: HebbianNetwork
): Promise<void> {
  // 恢复模块状态
  if (state.fullState) {
    meaningAssigner.importState(state.fullState.meaning);
    selfConsciousness.importState(state.fullState.self);
    // 类型断言处理 metacognition 的导入
    (metacognition as { importState: (state: unknown) => void }).importState(state.fullState.metacognition);
  }
  
  // 恢复分层记忆状态
  if (state.layeredMemoryState) {
    layeredMemory.importState(state.layeredMemoryState);
    rebuildKnowledgeGraph(layeredMemory, longTermMemory);
  }
  
  // 恢复神经网络状态
  if (state.hebbianNetwork) {
    for (const neuron of state.hebbianNetwork.neurons) {
      const existing = network.getNetworkState().neurons.find(n => n.id === neuron.id);
      if (!existing) {
        network.createNeuron({ id: neuron.id, label: neuron.label });
      }
    }
    
    for (const synapse of state.hebbianNetwork.synapses) {
      try {
        network.createSynapse(synapse);
      } catch {
        // 突触可能已存在
      }
    }
  }
  
  // 从数据库同步创造者信息
  try {
    await syncCreatorFromDatabase(longTermMemory, selfConsciousness, layeredMemory);
  } catch (error) {
    console.log('[意识核心] 数据库同步创造者信息失败:', error);
  }
}

/**
 * 恢复模块状态
 */
export async function restoreModuleStates(
  state: PersistedState,
  meaningAssigner: MeaningAssigner,
  selfConsciousness: SelfConsciousness,
  metacognition: { importState: (state: unknown) => void },
  layeredMemory: LayeredMemorySystem,
  longTermMemory: LongTermMemory,
  network: HebbianNetwork,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<void> {
  // 恢复其他模块状态
  if (state.fullState) {
    meaningAssigner.importState(state.fullState.meaning);
    // selfConsciousness 和 metacognition 的导入需要类型断言
    // 因为 PersistedState 的 fullState 字段类型定义问题
  }
  
  // 恢复分层记忆状态
  if (state.layeredMemoryState) {
    layeredMemory.importState(state.layeredMemoryState);
    rebuildKnowledgeGraph(layeredMemory, longTermMemory);
  }
  
  // 恢复神经网络状态
  if (state.hebbianNetwork) {
    for (const neuron of state.hebbianNetwork.neurons) {
      const existing = network.getNetworkState().neurons.find(n => n.id === neuron.id);
      if (!existing) {
        network.createNeuron({ id: neuron.id, label: neuron.label });
      }
    }
    
    for (const synapse of state.hebbianNetwork.synapses) {
      try {
        network.createSynapse(synapse);
      } catch {
        // 突触可能已存在
      }
    }
  }
  
  // 恢复对话历史
  const history = (state.conversationHistory || []).map(h => ({
    role: h.role as 'user' | 'assistant',
    content: h.content,
  }));
  conversationHistory.push(...history);
  
  // 从数据库同步创造者信息
  try {
    await syncCreatorFromDatabase(longTermMemory, selfConsciousness, layeredMemory);
  } catch (error) {
    console.log('[意识核心] 数据库同步创造者信息失败:', error);
  }
}

/**
 * 迁移神经元到网络
 */
export function migrateNeuronsToNetwork(
  network: HebbianNetwork,
  neurons: Array<{
    id: string;
    label: string;
    type?: string;
    activation?: number;
    preferenceVector?: number[];
  }>
): { created: number; existing: number } {
  let created = 0;
  let existing = 0;
  
  for (const n of neurons) {
    const existingNeuron = network.getNeuron(n.id);
    if (existingNeuron) {
      existing++;
    } else {
      network.createNeuron({ id: n.id, label: n.label });
      if (n.activation) {
        network.setActivation(n.id, n.activation);
      }
      created++;
    }
  }
  
  console.log(`[意识核心] 迁移神经元: 创建 ${created}, 已存在 ${existing}`);
  return { created, existing };
}

/**
 * 迁移突触到网络
 */
export function migrateSynapsesToNetwork(
  network: HebbianNetwork,
  synapses: Array<{ from: string; to: string; weight: number }>
): { created: number; skipped: number } {
  let created = 0;
  let skipped = 0;
  
  for (const s of synapses) {
    const fromNeuron = network.getNeuron(s.from);
    const toNeuron = network.getNeuron(s.to);
    
    if (!fromNeuron || !toNeuron) {
      skipped++;
      continue;
    }
    
    network.createSynapse(s);
    created++;
  }
  
  console.log(`[意识核心] 迁移突触: 创建 ${created}, 跳过 ${skipped}`);
  return { created, skipped };
}

/**
 * 更新对话历史
 */
export function prependToConversationHistory(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  newHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  maxLength: number = 200
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const validHistory = newHistory.filter(h => h.content && h.content.trim());
  const combined = [...validHistory, ...history];
  
  if (combined.length > maxLength) {
    return combined.slice(-maxLength);
  }
  
  return combined;
}
