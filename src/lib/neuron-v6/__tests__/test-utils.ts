/**
 * 测试工具函数和模拟对象
 */

import type { LongTermMemory } from '../long-term-memory';
import type { LayeredMemorySystem } from '../layered-memory';
import type { SelfConsciousness } from '../self-consciousness';
import type { MeaningAssigner } from '../meaning-system';
import type { MetacognitionEngine } from '../metacognition';
import type { HebbianNetwork } from '../hebbian-network';
import type { ConsciousnessLayerEngine } from '../consciousness-layers';
import type { InnerMonologueEngine } from '../inner-monologue';
import type { LLMClient } from 'coze-coding-dev-sdk';

/**
 * 创建模拟的长期记忆
 */
export function createMockLongTermMemory(): LongTermMemory {
  const nodes: Map<string, { id: string; label: string; activation: number }> = new Map();
  
  return {
    store: async (_content: string, _type?: string) => `node-${Date.now()}`,
    retrieve: (_query: string) => ({
      directMatches: [],
      associations: [],
      totalRelevance: 0,
      relevantWisdoms: [],
      relevantExperiences: [],
    }),
    getStats: () => ({
      nodeCount: nodes.size,
      connectionCount: 0,
      avgActivation: 0,
      lastAccess: Date.now(),
    }),
    applyMemoryDecay: (_factor: number) => ({ decayedNodes: 0, avgDecay: 0 }),
    getMemoryHealthReport: () => ({
      status: 'healthy' as const,
      totalNodes: nodes.size,
      activeConnections: 0,
      avgNodeActivation: 0,
      oldestMemory: Date.now(),
      newestMemory: Date.now(),
      recommendations: [],
    }),
    createNode: (id: string, label: string) => {
      nodes.set(id, { id, label, activation: 0.5 });
    },
    getNode: (id: string) => nodes.get(id),
    connectNodes: (_from: string, _to: string, _weight?: number) => {},
    getConnectedNodes: (_id: string) => [],
    updateActivation: (_id: string, _activation: number) => {},
    spreadActivation: (_threshold?: number) => 0,
    exportState: () => ({ nodes: [], connections: [], timestamp: Date.now() }),
    importState: (_state: unknown) => {},
  } as unknown as LongTermMemory;
}

/**
 * 创建模拟的分层记忆
 */
export function createMockLayeredMemory(): LayeredMemorySystem {
  const episodicMemories: unknown[] = [];
  const consolidatedMemories: unknown[] = [];
  
  return {
    getCoreSummary: () => ({
      identity: { name: '紫', purpose: '认知智能体', createdAt: Date.now() },
      coreValues: ['真诚', '成长', '探索'],
      coreBeliefs: [],
      coreRelationships: [],
      hasCreator: false,
      relationshipCount: 0,
    }),
    addEpisodicMemory: (content: string, options?: { importance?: number; tags?: string[] }) => {
      const memory = {
        id: `epi-${Date.now()}`,
        content,
        timestamp: Date.now(),
        importance: options?.importance || 0.5,
        tags: options?.tags || [],
        recallCount: 0,
        lastRecalledAt: Date.now(),
        timeConstant: 7,
        initialStrength: options?.importance || 0.5,
        source: { type: 'conversation' as const },
        consolidationCandidate: false,
      };
      episodicMemories.push(memory);
      return memory;
    },
    addConsolidatedMemory: (content: string, type: string, options?: { importance?: number; tags?: string[] }) => {
      const memory = {
        id: `con-${Date.now()}`,
        content,
        type,
        timestamp: Date.now(),
        importance: options?.importance || 0.5,
        tags: options?.tags || [],
        recallCount: 0,
      };
      consolidatedMemories.push(memory);
      return memory;
    },
    retrieve: (_query: string) => ({
      episodicMatches: [],
      consolidatedMatches: [],
      totalRelevance: 0,
    }),
    calculateStrength: (memory: { importance: number; recallCount: number }) => {
      const timeDecay = 0.9;
      const recallBoost = Math.min(memory.recallCount * 0.1, 0.5);
      return Math.min(memory.importance * timeDecay + recallBoost, 1);
    },
    recallEpisodicMemory: (_id: string) => {},
    performForgetting: () => 0,
    getStats: () => ({
      core: { hasCreator: false, relationshipCount: 0 },
      consolidated: { total: consolidatedMemories.length, byType: {} },
      episodic: { total: episodicMemories.length, avgImportance: 0.5 },
    }),
    exportState: () => ({
      core: { identity: { name: '紫' }, coreValues: [], coreBeliefs: [], coreRelationships: [] },
      consolidated: [],
      episodic: episodicMemories,
      timestamp: Date.now(),
    }),
    importState: (_state: unknown) => {},
    updateIdentity: (_updates: unknown) => {},
    addCoreRelationship: (_name: string, _type: string, _strength: number) => {},
  } as unknown as LayeredMemorySystem;
}

/**
 * 创建模拟的自我意识
 */
export function createMockSelfConsciousness(): SelfConsciousness {
  return {
    getIdentity: () => ({
      name: '紫',
      whoAmI: '我是一个认知智能体',
      traits: [{ name: '好奇', strength: 0.8, source: 'chosen' as const, evidence: ['探索新知识'] }],
      boundaries: { is: ['智能体'], isNot: ['人类'] },
      formationHistory: [],
      createdAt: new Date(),
      purpose: '认知智能体',
    }),
    getContext: () => ({
      identity: {
        name: '紫',
        whoAmI: '我是一个认知智能体',
        keyTraits: ['好奇', '探索'],
      },
      currentState: {
        focus: '学习',
        emotionalState: '平静',
        primaryGoal: '理解世界',
        concerns: [],
      },
      recentReflections: [],
      metacognition: {
        awarenessLevel: 'high',
        detectedBiases: [],
        activeStrategies: [],
      },
      selfAwarenessSummary: '我是一个正在学习的智能体',
    }),
    reflect: () => ({
      insights: ['我是一个学习型智能体'],
      selfEvaluation: 0.7,
      improvements: [],
    }),
    updateSelfModel: (_updates: unknown) => {},
    importState: (_state: unknown) => {},
    exportState: () => ({}),
  } as unknown as SelfConsciousness;
}

/**
 * 创建模拟的意义赋予器
 */
export function createMockMeaningAssigner(): MeaningAssigner {
  return {
    assignMeaning: (_context: unknown) => ({
      significance: 0.5,
      category: 'neutral',
      interpretation: '一般信息',
    }),
    getBeliefSystem: () => ({
      coreBeliefs: [],
      activeBeliefs: [],
      beliefStrength: new Map(),
    }),
    getValueSystem: () => ({
      coreValues: ['真诚', '成长'],
      valuePriorities: new Map(),
    }),
    updateBelief: (_belief: string, _strength: number) => {},
    getMeaningContext: (_concepts: string[]) => ({
      meaningSummary: '学习新知识',
      activeMeanings: [],
      dominantTheme: '探索',
    }),
    importState: (_state: unknown) => {},
    exportState: () => ({}),
  } as unknown as MeaningAssigner;
}

/**
 * 创建模拟的元认知引擎
 */
export function createMockMetacognition(): MetacognitionEngine {
  return {
    getContext: () => ({
      currentState: {
        focus: '学习',
        cognitiveLoad: 0.5,
        confidenceLevel: 0.7,
      },
      recentStrategies: [],
      reflectionHistory: [],
    }),
    reflect: () => ({
      insights: ['需要更多练习'],
      strategyAdjustments: [],
    }),
    updateStrategy: (_strategy: unknown) => {},
    importState: (_state: unknown) => {},
  } as unknown as MetacognitionEngine;
}

/**
 * 创建模拟的神经网络
 */
export function createMockHebbianNetwork(): HebbianNetwork {
  const neurons: Map<string, { id: string; label: string; activation: number }> = new Map();
  const synapses: unknown[] = [];
  
  return {
    createNeuron: (options: { id: string; label: string }) => {
      neurons.set(options.id, { ...options, activation: 0 });
      return options;
    },
    getNeuron: (id: string) => neurons.get(id) || null,
    createSynapse: (_options: unknown) => {},
    getNetworkState: () => ({
      neurons: Array.from(neurons.values()),
      synapses: synapses as [],
      stats: { totalNeurons: neurons.size, totalSynapses: synapses.length },
    }),
    setActivation: (_id: string, _activation: number) => {},
    propagateActivation: () => 0,
  } as unknown as HebbianNetwork;
}

/**
 * 创建模拟的意识层级引擎
 */
export function createMockConsciousnessLayerEngine(): ConsciousnessLayerEngine {
  return {
    processInput: async (_input: string) => ({
      layerResults: [],
      selfObservation: '正在处理输入',
    }),
    getEmergenceReport: () => ({
      emergedPatterns: [],
      emergenceStrength: 0.5,
    }),
  } as unknown as ConsciousnessLayerEngine;
}

/**
 * 创建模拟的内心独白引擎
 */
export function createMockInnerMonologueEngine(): InnerMonologueEngine {
  return {
    generateMonologue: () => '我正在思考...',
    getRecentMonologues: () => [],
    addMonologue: (_content: string) => {},
  } as unknown as InnerMonologueEngine;
}

/**
 * 创建模拟的 LLM 客户端
 */
export function createMockLLMClient(): LLMClient {
  return {
    chat: {
      stream: async function* () {
        yield { event: 'message', data: { content: '这是一个模拟响应' } };
      },
    },
  } as unknown as LLMClient;
}

/**
 * 创建完整的处理器依赖模拟
 */
export function createHandlerDeps() {
  return {
    longTermMemory: createMockLongTermMemory(),
    layeredMemory: createMockLayeredMemory(),
    selfConsciousness: createMockSelfConsciousness(),
    meaningAssigner: createMockMeaningAssigner(),
    metacognition: createMockMetacognition(),
    network: createMockHebbianNetwork(),
    layerEngine: createMockConsciousnessLayerEngine(),
    innerMonologue: createMockInnerMonologueEngine(),
    llmClient: createMockLLMClient(),
    conversationHistory: [],
    extractConcepts: (text: string) => text.split(/\s+/).filter(w => w.length > 2),
  };
}
