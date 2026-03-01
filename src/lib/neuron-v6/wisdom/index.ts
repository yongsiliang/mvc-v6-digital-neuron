/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一智慧模块 (Unified Wisdom Module)
 * 
 * 整合：
 * - wisdom-crystal.ts (智慧结晶存储)
 * - crystallization-engine.ts (结晶引擎)
 * 
 * 设计原则：
 * - 单一入口，职责清晰
 * - 减少模块数量，降低认知负担
 * ═══════════════════════════════════════════════════════════════════════
 */

// 从各个模块导出类型和功能
export type {
  WisdomCrystal,
  WisdomType,
  CrystalMemory,
  CrystallizationCandidate,
  CrystallizationResult,
  CrystallizationConfig,
} from '../wisdom-crystal';

export { 
  WisdomCrystalStore,
  createEmptyCrystal,
  DEFAULT_CRYSTALLIZATION_CONFIG,
} from '../wisdom-crystal';

export {
  CrystallizationEngine,
  createCrystallizationEngine,
} from '../crystallization-engine';
