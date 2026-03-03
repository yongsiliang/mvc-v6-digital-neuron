/**
 * ═══════════════════════════════════════════════════════════════════════
 * Neuron V6 模块索引
 * 
 * 重构后的模块结构：
 * - core/     核心处理模块（LLM Gateway, 上下文, 思考, 响应, 学习, 存储）
 * - memory/   记忆系统
 * - thinking/ 思考系统
 * - self/     自我系统
 * - wisdom/   智慧系统
 * - link-field-module/ 链接场系统
 * - consciousness-compiler/ 意识编译系统（V6新增）
 * 
 * 原则：
 * - 单一职责
 * - 清晰的模块边界
 * - 易于测试和维护
 * ═══════════════════════════════════════════════════════════════════════
 */

// 核心模块
export * from './core';

// 记忆模块
export * from './memory';

// 思考模块
export * from './thinking';

// 自我模块
export * from './self';

// 智慧模块
export * from './wisdom';

// 意识编译系统（V6新增）
export { 
  ConsciousnessCompiler, 
  createConsciousnessCompiler 
} from './consciousness-compiler';
export type { 
  CompilerConfig, 
  CompilationResult 
} from './consciousness-compiler';

// 其他独立模块
export { HebbianNetwork } from './hebbian-network';

export { EmotionEngine, createEmotionEngine } from './emotion-system';
export type { 
  EmotionState, 
  EmotionExperience, 
  EmotionDrivenBehavior,
  BasicEmotion,
  ComplexEmotion,
} from './emotion-system';

export { ConsciousnessLayerEngine, createConsciousnessLayerEngine } from './consciousness-layers';
export type { 
  ConsciousnessLevel, 
  ConsciousnessState,
  LayerProcessResult,
  SelfObservationResult,
} from './consciousness-layers';

export { MeaningAssigner, createMeaningAssigner } from './meaning-system';
export type { MeaningContext, Belief, Value as MeaningValue } from './meaning-system';

export { MetacognitionEngine, createMetacognitionEngine } from './metacognition';
export type { MetacognitiveContext } from './metacognition';

export { ToolIntentRecognizer, createToolIntentRecognizer } from './tool-intent-recognizer';
export type { ToolIntent, ToolExecutionResult } from './tool-intent-recognizer';

export { KnowledgeGraphSystem, createKnowledgeGraphSystem } from './knowledge-graph';
export type { KnowledgeDomain, ConceptNode, ConceptEdge, KnowledgeGraphState } from './knowledge-graph';

export { MultiConsciousnessSystem, createMultiConsciousnessSystem } from './multi-consciousness';
export type { 
  ConsciousnessIdentity, 
  ConsciousnessResonance,
  CollaborativeDialogue,
  CollectiveWisdomState,
} from './multi-consciousness';

// 保留原有的 consciousness-core 以兼容
export { ConsciousnessCore, createConsciousnessCore, PersistenceManagerV6 } from './consciousness-core';
export type { ProcessResult, PersistedState } from './consciousness-core';

// 共享核心
export { getSharedCore, resetSharedCore, isCoreInitialized, getCurrentCore } from './shared-core';
