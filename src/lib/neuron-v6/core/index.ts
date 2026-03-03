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

// ═══════════════════════════════════════════════════════════════════════
// 元思考模块 (Meta-Thinking Module)
// 
// 核心理念：
// - 元思考在LLM外部实现（监控、规划、评估、修正）
// - 隐性黑盒特质（内部过程不可观察）
// 
// 阶段适配：
// - 阶段1：隐式MCTS（数字神经元1.0 → 贾维斯级）
// - 阶段2：DE-RL元控制器（贾维斯级）
// - 阶段3：NSIR + DNAS + 混沌调度（MOSS级）
// ═══════════════════════════════════════════════════════════════════════

// 隐式MCTS
export {
  ImplicitMCTSController,
  createImplicitMCTSController,
  ImplicitPolicyNetwork,
  ImplicitValueNetwork,
  type ImplicitVector,
  type ImplicitNode,
  type LLMInstruction,
  type MetaThinkingResult,
  type MetaControllerConfig,
} from './implicit-mcts';

// 隐式状态存储
export {
  ImplicitStateStorage,
  createImplicitStateStorage,
  type ImplicitStateRecord,
  type ImplicitStorageConfig,
} from './implicit-state-storage';

// DE-RL元控制器
export {
  DERLController,
  createDERLController,
  type PolicyGenome,
  type RewardSignal,
  type TaskContext,
  type DERLConfig,
} from './de-rl-controller';

// 元思考集成器
export {
  MetaThinkingIntegrator,
  createMetaThinkingIntegrator,
  createDefaultMetaThinkingIntegrator,
  createJarvisMetaThinkingIntegrator,
  createMossMetaThinkingIntegrator,
  type MetaThinkingStage,
  type MetaThinkingConfig,
  type MetaThinkingOutput,
  type MetaThinkingFeedback,
} from './meta-thinking-integrator';

// ═══════════════════════════════════════════════════════════════════════
// 深度元思考模块 (Deep Meta-Thinking Module)
// 
// 真正的隐性黑盒实现：
// - Level 1: 状态隐式（高维向量存储）
// - Level 2: 过程隐式（决策过程不可观察）
// - Level 3: 输出隐式（输出也是隐式向量）
// 
// 核心特性：
// - 4层深度抽象（L0感知 → L1浅层 → L2深层 → L3元认知）
// - 混沌混淆（每层注入噪声，防止逆向工程）
// - 黑盒边界（只有必须时才解码）
// ═══════════════════════════════════════════════════════════════════════

// 深度元思考核心
export {
  DeepMetaThinkingCore,
  ImplicitTransformLayer,
  ImplicitLLMCaller,
  createDeepMetaThinkingCore,
  createImplicitLLMCaller,
  type ImplicitDecision,
  type ImplicitExecution,
  type DeepMetaThinkingConfig,
} from './deep-meta-thinking';

// 深度元思考测试
export {
  runDeepMetaThinkingTests,
} from './deep-meta-thinking.test';

// ═══════════════════════════════════════════════════════════════════════
// SSM 状态空间模型模块 (State Space Model)
// 
// 核心理念：
// - 将无限历史压缩到固定维度状态
// - 实现长期依赖而无需增长上下文
// - 线性复杂度O(N) vs Transformer的O(N²)
// 
// 与深度元思考的关系：
// - SSM提供状态建模基础
// - 深度元思考提供决策框架
// - 两者结合实现高效认知
// ═══════════════════════════════════════════════════════════════════════

// SSM 核心层
export {
  SSMLayer,
  MultiLayerSSM,
  createSSMLayer,
  createMultiLayerSSM,
  createDefault4LayerSSM,
  type SSMConfig,
  type SSMState,
  type SSMOutput,
  type SelectiveParams,
  type MultiLayerSSMConfig,
} from './ssm-layer';

// SSM 编码器
export {
  SSMEncoder,
  createSSMEncoder,
  type SSMEncoderConfig,
  type EncoderInput,
  type EncoderOutput,
  type MultiModalEncoderInput,
} from './ssm-encoder';

// SSM 解码器
export {
  SSMDecoder,
  createSSMDecoder,
  type SSMDecoderConfig,
  type DecodedInstruction,
  type DecodedResponse,
  type LLMCallParams,
  type DecodingContext,
} from './ssm-decoder';

// SSM + MCTS 混合控制器
export {
  SSMMCTSController,
  createSSMMCTSController,
  createDefaultSSMMCTSController,
  type SSMMCTSConfig,
  type ImplicitMCTSNode,
  type SearchResult,
  type ThinkingResult,
} from './ssm-mcts-controller';

// SSM 记忆桥接
export {
  SSMMemoryBridge,
  createSSMMemoryBridge,
  type SSMMemoryBridgeConfig,
  type ImplicitMemoryEntry,
  type RetrievalResult as SSMRetrievalResult,
  type SyncResult,
} from './ssm-memory-bridge';

// ═══════════════════════════════════════════════════════════════════════
// 能量预算与深度决策模块 (Energy & Depth Module)
// 
// 来源：consciousness-compiler/scheduler
// 改进：融入深度元思考系统
// 
// 核心功能：
// - 能量预算：控制思考深度和LLM调用频率
// - 深度决策：根据输入复杂度动态调整
// ═══════════════════════════════════════════════════════════════════════

// 能量预算管理器
export {
  EnergyBudgetManager,
  createEnergyBudgetManager,
  createDefaultEnergyBudgetManager,
  TOKEN_BUDGET,
  type EnergyBudgetConfig,
  type EnergyState,
  type EnergyBudget,
  type LLMCallLevel,
} from './energy-budget';

// 深度决策器
export {
  DepthDecider,
  createDepthDecider,
  createDefaultDepthDecider,
  DEPTH_KEYWORDS,
  SIMPLE_KEYWORDS,
  type DepthDeciderConfig,
  type ComplexityScore,
  type DepthDecision,
} from './depth-decider';

// ═══════════════════════════════════════════════════════════════════════
// 赫布学习模块 (Hebbian Learning Module)
// 
// 来源：consciousness-compiler/learning/hebbian.ts
// 改进：融入记忆桥接系统
// 
// 核心功能：
// - STDP：时序依赖可塑性
// - 赫布学习：共同激活 → 连接增强
// - 联想检索：基于连接权重的记忆联想
// ═══════════════════════════════════════════════════════════════════════

// 赫布学习系统
export {
  HebbianLearning,
  createHebbianLearning,
  createDefaultHebbianLearning,
  computeSTDPSignal,
  hebbianUpdate,
  type HebbianConfig,
  type MemoryConnection,
  type LearningEvent,
  type LearningResult as HebbianLearningResult,
  type AssociativeResult,
} from './hebbian-learning';

// ═══════════════════════════════════════════════════════════════════════
// 隐式输出解码器 (Implicit Output Decoder)
// 
// Level 3 黑盒特性：
// - 输出保持隐式向量形式
// - 只有在"必须"时才解码为可读形式
// - 解码过程也是黑盒的一部分
// - 解码结果不可逆
// ═══════════════════════════════════════════════════════════════════════

// 隐式输出解码器
export {
  ImplicitOutputDecoder,
  createImplicitOutputDecoder,
  createDefaultPermit,
  type ImplicitOutput,
  type DecodePermit,
  type DecodedOutput,
  type ImplicitDecoderConfig,
} from './implicit-output-decoder';
