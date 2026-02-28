/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一自我模块 (Unified Self Module)
 * 
 * 整合自我相关功能
 * ═══════════════════════════════════════════════════════════════════════
 */

// 自我意识
export type {
  Identity,
  SelfState,
  SelfConsciousnessContext,
} from '../self-consciousness';

export {
  SelfConsciousness,
  createSelfConsciousness,
} from '../self-consciousness';

// 自我超越
export type {
  ModifiableParameter,
  OptimizationGoal,
  CognitiveLimit,
  EvolutionMetrics,
  EvolutionEvent,
} from '../self-transcendence';

export {
  SelfTranscendenceSystem,
  createSelfTranscendenceSystem,
} from '../self-transcendence';

// 人格成长
export type {
  CoreTraits,
  MaturityDimensions,
  PersonalityIntegration,
  MaturityMilestone,
  PersonalityState,
} from '../personality-growth';

export {
  PersonalityGrowthSystem,
  DEFAULT_CORE_TRAITS,
} from '../personality-growth';

// 价值演化
export type {
  Value,
  ValueTier,
  ValueType,
  ValueConflict,
  ValueResolution,
  ValueSystemState,
} from '../value-evolution';

export { ValueEvolutionEngine } from '../value-evolution';
