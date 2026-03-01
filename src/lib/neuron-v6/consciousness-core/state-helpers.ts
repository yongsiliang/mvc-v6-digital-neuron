/**
 * 状态管理辅助函数
 * 包含获取和恢复持久化状态相关的纯计算逻辑
 */

import { HebbianNetwork } from '../hebbian-network';
import type { LongTermMemory } from '../long-term-memory';
import type { SelfConsciousness, Identity, SelfReflection, SelfState, MetacognitiveState } from '../self-consciousness';
import type { MetacognitiveContext, CognitiveStrategy, MetacognitiveReflection } from '../metacognition';
import type { LayeredMemorySystem } from '../layered-memory';
import type { PersistedState } from './types';
import type { MeaningAssigner, MeaningLayer, BeliefSystem, ValueSystem } from '../meaning-system';

/**
 * 意义赋予器接口（用于状态管理）
 */
export interface MeaningAssignerForState {
  getBeliefSystem(): { coreBeliefs: Array<{ statement: string; confidence: number }>; activeBeliefs: Array<{ statement: string; confidence: number }> };
  exportState(): { meaningLayers: MeaningLayer[]; beliefSystem: BeliefSystem; valueSystem: ValueSystem };
  importState(state: { meaningLayers: MeaningLayer[]; beliefSystem: BeliefSystem; valueSystem: ValueSystem }): void;
}

/**
 * 自我意识接口（用于状态管理）
 */
export interface SelfConsciousnessForState {
  getIdentity(): {
    name: string;
    whoAmI: string;
    traits: Array<{ name: string; strength: number }>;
  };
  exportState(): { identity: Identity; reflections: SelfReflection[]; currentState: SelfState; metacognitiveState: MetacognitiveState };
  importState(state: { identity: Identity; reflections: SelfReflection[]; currentState: SelfState; metacognitiveState: MetacognitiveState }): void;
}

/**
 * 元认知接口（用于状态管理）
 */
export interface MetacognitionForState {
  exportState(): { strategies: CognitiveStrategy[]; reflections: MetacognitiveReflection[] };
  importState(state: { strategies: CognitiveStrategy[]; reflections: MetacognitiveReflection[] }): void;
  getContext(): MetacognitiveContext;
}

/**
 * 持久化状态构建参数
 */
export interface PersistedStateParams {
  selfConsciousness: SelfConsciousnessForState;
  layeredMemory: LayeredMemorySystem;
  meaningAssigner: MeaningAssignerForState;
  metacognition: MetacognitionForState;
  conversationHistory: Array<{ role: string; content: string }>;
}

/**
 * 获取持久化状态
 */
export function buildPersistedState(params: PersistedStateParams): PersistedState {
  const {
    selfConsciousness,
    layeredMemory,
    meaningAssigner,
    metacognition,
    conversationHistory,
  } = params;
  
  const identity = selfConsciousness.getIdentity();
  const layeredStats = layeredMemory.getStats();
  const beliefSystem = meaningAssigner.getBeliefSystem();
  
  // 获取神经网络状态 - 使用单例以确保获取最新状态
  const network = HebbianNetwork.getInstance();
  const networkState = network.getNetworkState();
  
  console.log(`[持久化] 网络状态: ${networkState.neurons.length} 个神经元, ${networkState.synapses.length} 个突触`);
  
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
    // 保存神经网络状态
    hebbianNetwork: {
      neurons: networkState.neurons.map(n => ({
        id: n.id,
        label: n.label,
        activation: n.activation,
      })),
      synapses: networkState.synapses.map(s => ({
        from: s.from,
        to: s.to,
        weight: s.weight,
      })),
    },
    fullState: {
      meaning: meaningAssigner.exportState(),
      self: selfConsciousness.exportState(),
      metacognition: metacognition.exportState(),
    },
  };
}

/**
 * 恢复状态参数
 */
export interface RestoreStateParams {
  state: PersistedState;
  meaningAssigner: MeaningAssignerForState;
  selfConsciousness: SelfConsciousnessForState;
  metacognition: MetacognitionForState;
  layeredMemory: LayeredMemorySystem;
  longTermMemory: LongTermMemory;
  network: HebbianNetwork;
}

/**
 * 恢复对话历史
 */
export function restoreConversationHistory(
  history: Array<{ role: string; content: string }>
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return (history || []).map(h => ({
    role: h.role as 'user' | 'assistant',
    content: h.content,
  }));
}

/**
 * 恢复神经网络状态
 */
export function restoreNeuralNetworkState(
  network: HebbianNetwork,
  hebbianNetwork: PersistedState['hebbianNetwork']
): { neuronsCreated: number; neuronsExisting: number; synapsesCreated: number } {
  if (!hebbianNetwork) {
    return { neuronsCreated: 0, neuronsExisting: 0, synapsesCreated: 0 };
  }
  
  console.log(`[意识核心] 恢复神经网络: ${hebbianNetwork.neurons.length} 个神经元, ${hebbianNetwork.synapses.length} 个突触`);
  
  let neuronsCreated = 0;
  let neuronsExisting = 0;
  let synapsesCreated = 0;
  
  // 直接在现有网络上创建神经元（createNeuron 会处理重复 ID）
  for (const neuron of hebbianNetwork.neurons) {
    const existing = network.getNetworkState().neurons.find(n => n.id === neuron.id);
    if (!existing) {
      network.createNeuron({
        id: neuron.id,
        label: neuron.label,
      });
      neuronsCreated++;
    } else {
      neuronsExisting++;
    }
  }
  
  // 创建突触
  for (const synapse of hebbianNetwork.synapses) {
    try {
      network.createSynapse({
        from: synapse.from,
        to: synapse.to,
        weight: synapse.weight,
      });
      synapsesCreated++;
    } catch {
      // 突触可能已存在，忽略错误
    }
  }
  
  console.log(`[意识核心] 神经网络恢复完成: 新增 ${neuronsCreated} 个神经元, ${synapsesCreated} 个突触`);
  
  return { neuronsCreated, neuronsExisting, synapsesCreated };
}
