/**
 * ═══════════════════════════════════════════════════════════════════════
 * 量子意识系统 - 类型索引
 * ═══════════════════════════════════════════════════════════════════════
 */

// 基础类型
export type {
  Position,
  PatternId,
  Pattern,
  PatternTopology,
  PatternTemporal,
  PatternRelations,
  InteractionType,
  InteractionContext,
  Interaction,
} from './base';

export {
  randomDrift,
  createPosition,
  createPattern,
  createInteraction,
} from './base';

// 量子类型
export type {
  Complex,
  SuperpositionState,
  QuantumSuperpositionState,
  InterferenceType,
  InterferenceResult,
  CollapseResult,
  EntanglementCorrelation,
  EntanglementMap,
} from './quantum';

export {
  ComplexMath,
  createSuperposition,
  createSuperpositionState,
  calculateInterference,
  collapse,
  createEntanglementMap,
  entangle,
  applyEntanglement,
} from './quantum';
