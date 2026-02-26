/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经计算引擎 - 模块导出
 * ═══════════════════════════════════════════════════════════════════════
 */

// 核心引擎
export {
  NeuralEngine,
  getNeuralEngine,
  resetNeuralEngine,
} from './neural-engine';

export type {
  TensorNeuron,
  NeuralEngineConfig,
  NeuralNetworkState,
  NeuralProcessingResult,
  NeuralLayerConfig,
  NeuronRole,
} from './neural-engine';

// 张量 VSA
export {
  TensorVSA,
} from './tensor-vsa';

export type {
  TensorConcept,
  TensorReasoningResult,
  SemanticRelation,
  ConceptType,
} from './tensor-vsa';

// 注意力机制
export {
  MultiHeadAttention,
  PredictiveAttention,
} from './attention';

export type {
  AttentionConfig,
  AttentionOutput,
  SelfAttentionResult,
} from './attention';

// 学习层
export {
  HebbianLayer,
  RewardModulatedLayer,
  TDLearningLayer,
  STDPLearningLayer,
  CompositeLearningSystem,
} from './learning-layers';

export type {
  LearningConfig,
  LearningEvent,
  WeightUpdateResult,
} from './learning-layers';

// 集成适配器
export {
  NeuralEngineAdapter,
  getNeuralEngineAdapter,
  resetNeuralEngineAdapter,
} from './adapter';

export type {
  IntegrationConfig,
  SyncResult,
  EnhancedProcessingResult,
} from './adapter';

// 数据库操作
export {
  saveNeuron,
  loadNeurons,
  deleteNeuron,
  deleteAllNeurons,
  saveConcept,
  loadConcepts,
  deleteConcept,
  saveEngineState,
  loadEngineState,
  saveCompleteEngineState,
  clearAllEngineData,
} from './db-operations';

// Schema
export {
  neuralEngineNeurons,
  neuralEngineConcepts,
  neuralEngineState,
} from './schema';

export type {
  NeuralEngineNeuron,
  NewNeuralEngineNeuron,
  NeuralEngineConcept,
  NewNeuralEngineConcept,
  NeuralEngineStateRow,
  NewNeuralEngineState,
} from './schema';
