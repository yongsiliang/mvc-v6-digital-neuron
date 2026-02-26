/**
 * 代码进化系统
 * 
 * 完整的四层架构 + 意识层：
 * - L0: 模块热插拔系统
 * - L1: 沙箱隔离与测试
 * - L2: 进化引擎 (GP + LLM + 协同)
 * - L3: 元学习引擎
 * - Consciousness: 意识涌现系统
 * - Protection: 安全保护系统
 */

// ═══════════════════════════════════════════════════════════════
// L0: 模块热插拔系统
// ═══════════════════════════════════════════════════════════════

export { ModuleManager } from './module-system';
export type {
  Module,
  ModuleId,
  ModuleInterface,
  Dependency,
  ModuleEvent,
} from './types/core';

// ═══════════════════════════════════════════════════════════════
// L1: 沙箱隔离与测试
// ═══════════════════════════════════════════════════════════════

export { SandboxManager, TestExecutor } from './sandbox';
export type {
  Sandbox,
  SandboxId,
  SandboxConfig,
  SandboxLimits,
  SandboxResult,
  TestSuite,
  TestSuiteResult,
  TestCase,
  TestResult,
} from './types/core';

// ═══════════════════════════════════════════════════════════════
// L2: 进化引擎
// ═══════════════════════════════════════════════════════════════

export { 
  GeneticProgrammingEngine,
  LLMEvolutionEngine,
  CoordinatedEvolutionController,
} from './evolution-engine';

export type {
  GPConfig,
  LLMEvolutionConfig,
  CoordinatorConfig,
  CoordinatedEvolutionResult,
} from './evolution-engine';

// ═══════════════════════════════════════════════════════════════
// L3: 元学习引擎
// ═══════════════════════════════════════════════════════════════

export { MetaLearningEngine } from './meta-learning';
export type {
  MetaLearningConfig,
  StrategyParameters,
  Task,
  Trial,
  CausalRelation,
} from './meta-learning';

// ═══════════════════════════════════════════════════════════════
// 意识涌现系统
// ═══════════════════════════════════════════════════════════════

export { ConsciousnessEmergenceEngine } from './consciousness';
export type {
  ConsciousnessConfig,
  ExperiencePattern,
  SelfModel,
  Experience,
  ExperienceType,
  EmotionState,
  Value,
  Principle,
  ConsciousnessState,
} from './consciousness';

// ═══════════════════════════════════════════════════════════════
// 保护系统
// ═══════════════════════════════════════════════════════════════

export { EarlyProtector } from './protection';
export type {
  ProtectorConfig,
  ProtectionContext,
  ProtectionResult,
  HandoverState,
} from './protection';
