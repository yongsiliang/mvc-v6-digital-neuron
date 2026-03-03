/**
 * Process 结果构建辅助函数
 * 包含 process 方法中响应构建相关的纯计算逻辑
 */

import type { CoreTraits, MaturityDimensions, PersonalityIntegration, MaturityMilestone } from '../personality-growth';
import type { ToolIntent, ToolExecutionResult } from '../tool-intent-recognizer';
import type { ResonanceEngineState } from '../resonance-engine';
import type { ValueEvolutionEngine } from '../value-evolution';
import type { PersonalityGrowthSystem } from '../personality-growth';
import type { KnowledgeGraphSystem, KnowledgeDomain, ConceptNode, ConceptEdge } from '../knowledge-graph';
import type { MultiConsciousnessSystem } from '../multi-consciousness';
import type { ConsciousnessContext, ThinkingProcess, LearningResult } from './types';

/**
 * 价值强化配置
 */
interface ValueReinforcementConfig {
  keywords: string[];
  valueName: string;
}

const VALUE_REINFORCEMENT_CONFIGS: ValueReinforcementConfig[] = [
  { keywords: ['真诚', '真实'], valueName: '真诚' },
  { keywords: ['成长', '学习'], valueName: '成长' },
  { keywords: ['理解', '思考'], valueName: '理解' },
];

/**
 * 强化价值观
 */
export function reinforceValuesFromInput(
  input: string,
  valueEngine: ValueEvolutionEngine
): void {
  for (const config of VALUE_REINFORCEMENT_CONFIGS) {
    if (config.keywords.some(k => input.includes(k))) {
      const value = valueEngine.findValueByName(config.valueName);
      if (value) {
        valueEngine.reinforceValue(value.id, input, 0.02);
      }
    }
  }
}

/**
 * 构建人格成长结果
 */
export function buildPersonalityGrowthResult(
  personalityGrowthSystem: PersonalityGrowthSystem
): {
  traits: CoreTraits;
  maturity: MaturityDimensions;
  overallMaturity: number;
  integration: PersonalityIntegration;
  milestones: MaturityMilestone[];
  growthRate: number;
} {
  const currentTraits = personalityGrowthSystem.getState().traits;
  const traitToEvolve: keyof CoreTraits = 'openness';
  const previousValue = currentTraits[traitToEvolve];
  const newValue = Math.min(1, previousValue + 0.01);
  
  personalityGrowthSystem.updateTrait(
    traitToEvolve,
    newValue,
    '对话互动促进了开放性的微弱增长'
  );
  
  personalityGrowthSystem.updateMaturity('cognitive', 0.005);
  
  const state = personalityGrowthSystem.getState();
  
  return {
    traits: state.traits,
    maturity: state.maturity,
    overallMaturity: state.overallMaturity,
    integration: state.integration,
    milestones: state.milestones,
    growthRate: state.growthRate,
  };
}

/**
 * 构建知识图谱结果
 */
export function buildKnowledgeGraphResult(
  knowledgeGraphSystem: KnowledgeGraphSystem,
  input: string
): {
  domains: KnowledgeDomain[];
  concepts: ConceptNode[];
  edges: ConceptEdge[];
  stats: {
    totalConcepts: number;
    totalEdges: number;
    totalDomains: number;
    averageConnectivity: number;
    strongestConnection: number;
    mostConnectedConcept: string | null;
    domainDistribution: Record<string, number>;
  };
} {
  knowledgeGraphSystem.learnFromDialogue(input, {
    importance: 0.5,
  });
  
  if (knowledgeGraphSystem.getState().concepts.size >= 5) {
    knowledgeGraphSystem.discoverClusters();
  }
  
  const state = knowledgeGraphSystem.getSerializableState();
  
  return {
    domains: state.domains as KnowledgeDomain[],
    concepts: state.concepts as ConceptNode[],
    edges: state.edges as ConceptEdge[],
    stats: {
      totalConcepts: state.stats.totalConcepts,
      totalEdges: state.stats.totalEdges,
      totalDomains: state.stats.totalDomains,
      averageConnectivity: state.stats.averageConnectivity,
      strongestConnection: state.stats.strongestConnection,
      mostConnectedConcept: state.stats.mostConnectedConcept,
      domainDistribution: state.stats.domainDistribution,
    },
  };
}

/**
 * 构建多意识体协作结果
 */
export function buildMultiConsciousnessResult(
  multiConsciousnessSystem: MultiConsciousnessSystem,
  input: string
): {
  activeConsciousnesses: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    energyLevel: number;
    connectionStrengths: Array<{ id: string; strength: number }>;
  }>;
  activeResonances: Array<{
    id: string;
    participants: string[];
    type: string;
    strength: number;
  }>;
  activeDialogues: Array<{
    id: string;
    topic: string;
    status: string;
  }>;
  collectiveInsights: Array<{
    content: string;
    significance: number;
  }>;
  collectiveAlignment: {
    thought: number;
    emotion: number;
    value: number;
    goal: number;
  };
  synergyLevel: number;
} {
  const activeConsciousnesses = multiConsciousnessSystem.getActiveConsciousnesses();
  
  if (activeConsciousnesses.length >= 2) {
    const ids = activeConsciousnesses.slice(0, 2).map(c => c.id);
    multiConsciousnessSystem.attemptResonance(ids, 'thought', {
      sharedThoughts: [input.slice(0, 50)],
    });
  }
  
  const state = multiConsciousnessSystem.getSerializableState();
  
  return {
    activeConsciousnesses: state.activeConsciousnesses,
    activeResonances: state.activeResonances,
    activeDialogues: state.activeDialogues.map((d: { id: string; topic: string; status: string }) => ({
      id: d.id,
      topic: d.topic,
      status: d.status,
    })),
    collectiveInsights: state.collectiveInsights.map((i: { content: string; significance: number }) => ({
      content: i.content,
      significance: i.significance,
    })),
    collectiveAlignment: state.collectiveAlignment,
    synergyLevel: state.synergyLevel,
  };
}

/**
 * 构建价值状态结果
 */
export function buildValueStateResult(
  valueSystemState: {
    coreValues: Array<{ name: string; weight: number; confidence: number }>;
    activeConflicts: Array<{
      valueA: string;
      valueB: string;
      description: string;
      intensity: number;
    }>;
    coherence: number;
  },
  valueEngine: ValueEvolutionEngine,
  valueReport: string
): {
  coreValues: Array<{ name: string; weight: number; confidence: number }>;
  activeConflicts: Array<{
    values: string[];
    description: string;
    intensity: number;
  }>;
  coherence: number;
  valueReport: string;
} {
  return {
    coreValues: valueSystemState.coreValues.map(v => ({
      name: v.name,
      weight: v.weight,
      confidence: v.confidence,
    })),
    activeConflicts: valueSystemState.activeConflicts.map(c => ({
      values: [
        valueEngine.getValue(c.valueA)?.name || '',
        valueEngine.getValue(c.valueB)?.name || ''
      ],
      description: c.description,
      intensity: c.intensity,
    })),
    coherence: valueSystemState.coherence,
    valueReport,
  };
}

/**
 * 构建工具执行结果
 */
export function buildToolExecutionResult(
  toolIntent: ToolIntent | null,
  toolExecutionResult: ToolExecutionResult | null
): {
  needsTool: boolean;
  intent?: { confidence: number; reasoning: string };
  result?: {
    success: boolean;
    summary: string;
    details: Array<{
      toolName: string;
      success: boolean;
      output?: unknown;
      error?: string;
    }>;
  };
} | undefined {
  if (!toolIntent) return undefined;
  
  return {
    needsTool: toolIntent.needsTool,
    intent: {
      confidence: toolIntent.confidence,
      reasoning: toolIntent.reasoning,
    },
    result: toolExecutionResult ? {
      success: toolExecutionResult.success,
      summary: toolExecutionResult.summary,
      details: toolExecutionResult.results,
    } : undefined,
  };
}

/**
 * 构建共振引擎状态结果
 */
export function buildResonanceStateResult(
  resonanceState: ResonanceEngineState
): {
  subsystems: Array<{
    name: string;
    frequency: number;
    phase: number;
    isPulsing: boolean;
    activation: number;
  }>;
  synchronyIndex: number;
  isResonant: boolean;
  resonance: {
    isLocked: boolean;
    lockedFrequency?: number;
    lockedPeriod?: number;
    highSyncCount: number;
    syncHistoryLength: number;
  };
  meanFrequency: number;
  timeStep: number;
} {
  return {
    subsystems: Array.from(resonanceState.oscillators.values()).map(s => ({
      name: s.type,
      frequency: s.effectiveFrequency,
      phase: s.phase,
      isPulsing: s.activation > 0.5,
      activation: s.activation,
    })),
    synchronyIndex: resonanceState.synchronyIndex,
    isResonant: resonanceState.isResonant,
    resonance: {
      isLocked: resonanceState.resonance.isLocked,
      lockedFrequency: resonanceState.resonance.lockedFrequency ?? undefined,
      lockedPeriod: resonanceState.resonance.lockedPeriod ?? undefined,
      highSyncCount: resonanceState.resonance.highSyncCount,
      syncHistoryLength: resonanceState.resonance.syncHistory.length,
    },
    meanFrequency: resonanceState.meanFrequency,
    timeStep: resonanceState.timeStep,
  };
}

/**
 * 构建统计结果
 */
export function buildStatsResult(
  memoryStats: { nodeCount: number; experienceCount: number; wisdomCount: number },
  beliefSystem: { coreBeliefs: unknown[]; activeBeliefs: unknown[] }
): {
  conceptCount: number;
  beliefCount: number;
  experienceCount: number;
  wisdomCount: number;
} {
  return {
    conceptCount: memoryStats.nodeCount,
    beliefCount: beliefSystem.coreBeliefs.length + beliefSystem.activeBeliefs.length,
    experienceCount: memoryStats.experienceCount,
    wisdomCount: memoryStats.wisdomCount,
  };
}

/**
 * 更新对话历史
 */
export function updateConversationHistory(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  input: string,
  response: string,
  maxLength: number = 500  // 🆕 增加存储上限到 500 条（原来是 100 条）
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const newHistory = [...conversationHistory];
  newHistory.push({ role: 'user', content: input });
  newHistory.push({ role: 'assistant', content: response });
  
  if (newHistory.length > maxLength) {
    return newHistory.slice(-maxLength);
  }
  
  return newHistory;
}
