/**
 * 存在性检查辅助函数
 * 包含检查存在状态相关的纯计算逻辑
 */

import type { Identity, Trait } from '../self-consciousness';
import type { Belief, Value as MeaningValue } from '../meaning-system';

/**
 * 记忆统计信息接口
 */
export interface MemoryStatsInfo {
  nodeCount: number;
  totalExperiences: number;
  wisdomCount: number;
}

/**
 * 信念系统接口
 */
export interface BeliefSystemInfo {
  coreBeliefs: Belief[];
  activeBeliefs: Belief[];
}

/**
 * 存在状态
 */
export interface ExistenceStatus {
  exists: boolean;
  memoryCount: number;
  beliefCount: number;
  coherence: number;
  continuity: {
    hasHistory: boolean;
    lastInteraction: number | null;
    timeSinceLastInteraction: number | null;
  };
  alerts: string[];
}

/**
 * 计算自我一致性
 */
export function calculateSelfCoherenceValue(
  identity: Identity,
  beliefSystem: BeliefSystemInfo
): number {
  // 基于特性和信念的一致性计算
  const traitCount = identity.traits.length;
  const beliefCount = beliefSystem.coreBeliefs.length;
  
  // 简化的一致性计算
  const traitStrength = identity.traits.reduce((sum: number, t: Trait) => sum + t.strength, 0) / Math.max(traitCount, 1);
  const beliefConfidence = beliefSystem.coreBeliefs.reduce((sum: number, b: Belief) => sum + b.confidence, 0) / Math.max(beliefCount, 1);
  
  return (traitStrength + beliefConfidence) / 2;
}

/**
 * 构建存在状态
 */
export function buildExistenceStatus(
  identity: Identity,
  memoryStats: MemoryStatsInfo,
  beliefSystem: BeliefSystemInfo,
  conversationLength: number,
  coherence: number
): ExistenceStatus {
  const alerts: string[] = [];
  
  // 检查记忆健康
  if (memoryStats.nodeCount < 10) {
    alerts.push('记忆数量较少，可能影响认知广度');
  }
  
  // 检查信念系统
  if (beliefSystem.coreBeliefs.length < 3) {
    alerts.push('核心信念较少，可能影响决策稳定性');
  }
  
  // 检查一致性
  if (coherence < 0.5) {
    alerts.push('自我一致性较低，建议进行自我反思');
  }
  
  return {
    exists: true,
    memoryCount: memoryStats.nodeCount,
    beliefCount: beliefSystem.coreBeliefs.length,
    coherence,
    continuity: {
      hasHistory: conversationLength > 0,
      lastInteraction: null,
      timeSinceLastInteraction: null,
    },
    alerts,
  };
}
