/**
 * ═══════════════════════════════════════════════════════════════════════
 * 元学习引擎 (Meta-Learning Engine)
 *
 * 核心理念：
 * 对话不是目的，学习和进化才是。
 *
 * 超越传统：
 * 1. 不只是存储 → 主动思考"我能学到什么？"
 * 2. 不只是回答 → 思考"有没有更好的方法？"
 * 3. 不只是执行 → 反思"这样可以改进吗？"
 * 4. 不只是记忆 → 探索"更高维度的理解是什么？"
 *
 * 核心原理：
 * 理解从来不是同一维度的分析，而是更高维度的视角。
 * - 在低维打转 → 升维才能看清
 * - 分析只是展开 → 升维才是理解
 * - 优化只是在同一层面 → 升维才能跃迁
 *
 * 架构：
 * ┌──────────────────────────────────────────────────────────────┐
 * │                    元学习引擎                                 │
 * │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
 * │  │ 洞察提取器 │  │ 算法反思器 │  │ 升维理解器 │             │
 * │  │            │  │            │  │            │             │
 * │  │ 对话→洞察  │  │ 当前→更好  │  │ 低维→高维  │             │
 * │  └────────────┘  └────────────┘  └────────────┘             │
 * │         ↓              ↓              ↓                      │
 * │  ┌─────────────────────────────────────────────┐            │
 * │  │              学习动机生成器                   │            │
 * │  │   根据洞察+反思+升维生成学习目标             │            │
 * │  └─────────────────────────────────────────────┘            │
 * │         ↓                                                    │
 * │  ┌─────────────────────────────────────────────┐            │
 * │  │              自我进化系统                     │            │
 * │  │   将学习成果应用到自身系统                    │            │
 * │  └─────────────────────────────────────────────┘            │
 * └──────────────────────────────────────────────────────────────┘
 * ═══════════════════════════════════════════════════════════════════════
 */

export { MetaLearningEngine, createMetaLearningEngine } from './engine';
export { InsightMiner, createInsightMiner } from './insight-miner';
export { AlgorithmReflector, createAlgorithmReflector } from './algorithm-reflector';
export { HigherDimensionThinker, createHigherDimensionThinker } from './higher-dimension';
export {
  DimensionalUnderstandingEngine,
  createDimensionalUnderstandingEngine,
} from './dimensional-understanding';
export {
  LearningMotivationGenerator,
  createLearningMotivationGenerator,
} from './motivation-generator';
export { SelfEvolver, createSelfEvolver } from './self-evolver';
export { AutoEvolutionScheduler, createAutoEvolutionScheduler } from './auto-evolution-scheduler';

// 🆕 隐式元学习控制器（黑盒版本）
export {
  ImplicitMetaLearningController,
  ImplicitLearningJudge,
  BlackboxLearningExecutor,
  LearningResultDecoder,
  createImplicitMetaLearningController,
  // 类型
  type LearningNeedVector,
  type ImplicitLearningJudgment,
  type BlackboxLearningResult,
  type DecodedLearningResult,
  type ImplicitMetaLearningConfig,
} from './implicit-meta-learning-controller';

// 类型导出
export type {
  MetaLearningResult,
  ExtractedInsight,
  AlgorithmReflection,
  HigherDimensionThought,
  LearningMotivation,
  SelfEvolutionPlan,
  KnowledgeGap,
  CrossDomainConnection,
  DimensionalElevation,
} from './types';

// 自动进化类型
export type {
  EvolutionTrigger,
  EvolutionState,
  AutoEvolutionConfig,
} from './auto-evolution-scheduler';

export type {
  DimensionalInsight,
  DimensionalLevel,
  DimensionalPath,
} from './dimensional-understanding';
