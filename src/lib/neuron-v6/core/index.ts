/**
 * ═══════════════════════════════════════════════════════════════════════
 * 意识核心模块索引
 * 
 * 从 consciousness-core.ts 重构而来
 * 职责清晰、模块化、可测试
 * ═══════════════════════════════════════════════════════════════════════
 */

// 类型导出
export type {
  ConsciousnessContext,
  ThinkingProcess,
  LearningResult,
  SessionAnalysis,
  EmotionalTrajectory,
  BeliefEvolution,
  TraitGrowth,
  ValueUpdate,
  LongTermLearningResult,
  ConsciousnessStreamEntry,
  ConsciousnessStream,
  Volition,
  Milestone,
  VolitionSystemState,
  ProactiveMessage,
  ProcessResult,
  PersistedState,
  ExperienceType,
  OptimizationAssessment,
} from './types';

// LLM Gateway
export { 
  llmGateway, 
  getLLMGateway,
  type LLMMessage,
  type LLMOptions,
  type LLMResponse,
  type LLMStreamChunk,
} from './llm-gateway';

// 上下文构建器
export { 
  ContextBuilder, 
  createContextBuilder,
  type ContextBuilderDeps,
} from './context-builder';

// 思考处理器
export { 
  ThinkingProcessor, 
  createThinkingProcessor,
  type ThinkingProcessorDeps,
} from './thinking-processor';

// 响应生成器
export { 
  ResponseGenerator, 
  createResponseGenerator,
  type ResponseGeneratorDeps,
} from './response-generator';

// 学习模块
export { 
  Learner, 
  createLearner,
  type LearnerDeps,
} from './learner';

// 存储层
export { 
  unifiedStorage, 
  getUnifiedStorage,
  type StorageBackend,
  type StorageConfig,
  type StorageItem,
} from './storage';
