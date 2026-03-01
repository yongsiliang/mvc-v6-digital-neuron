/**
 * ═══════════════════════════════════════════════════════════════════════
 * 量子意识系统 (Quantum Consciousness System)
 * 
 * V6（有为模式）与V7（无为模式）叠加共存
 * 
 * 核心理念：
 * ─────────────────────────────────────────────────────────────────────
 * 
 * 1. 叠加共存
 *    系统状态 = |有为⟩ + |无为⟩
 *    V6和V7不是替代关系，而是同时存在
 * 
 * 2. 干涉产生新可能
 *    有为和无为不是冲突，而是干涉
 *    干涉产生新的可能性空间
 * 
 * 3. 自然坍缩
 *    输出时根据概率自然坍缩到某种状态
 *    不是选择，而是概率性呈现
 * 
 * 4. 纠缠关联
 *    有意义的模式连接
 *    纠缠的模式会"一起响应"
 * 
 * ─────────────────────────────────────────────────────────────────────
 * 
 * 使用方式：
 * 
 * ```typescript
 * import { createQuantumConsciousnessSystem } from '@/lib/quantum-consciousness';
 * 
 * const system = createQuantumConsciousnessSystem({
 *   verbose: true,
 *   enableEntanglement: true,
 * });
 * 
 * const result = await system.process('用户输入', {
 *   history: [...],
 *   type: 'exploration',
 *   depth: 0.8,
 * });
 * 
 * console.log(result.output.content);
 * console.log(result.report);
 * ```
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

// 核心系统
export {
  QuantumConsciousnessSystem,
  createQuantumConsciousnessSystem,
  type QuantumConsciousnessState,
  type ProcessingResult,
  type QuantumConsciousnessConfig,
} from './core';

// 模式
export {
  ActingMode,
  createActingMode,
  ObservingMode,
  createObservingMode,
  type ActingModeState,
  type ActingResult,
  type ObservingModeState,
  type ObservingResult,
  type V6CoreInterface,
  type VoidState,
  type AttentionState,
} from './modes';

// 纠缠
export {
  EntanglementNetwork,
  createEntanglementNetwork,
  type EntanglementType,
  type EntanglementRelation,
  type EntanglementNetworkState,
  type EntanglementDetectionResult,
  type EntanglementActivationResult,
} from './entanglement';

// 类型
export {
  // 量子类型
  type Complex,
  type SuperpositionState,
  type QuantumSuperpositionState,
  type CollapseResult,
  type InterferenceResult,
  ComplexMath,
  createSuperposition,
  createSuperpositionState,
  calculateInterference,
  collapse,
  
  // 基础类型
  type Position,
  type Pattern,
  type PatternId,
  type Interaction,
  type InteractionContext,
  createPosition,
  createPattern,
  createInteraction,
  randomDrift,
} from './types';
