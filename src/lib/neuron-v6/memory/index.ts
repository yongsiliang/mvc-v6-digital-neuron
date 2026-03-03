/**
 * ═══════════════════════════════════════════════════════════════════════
 * 记忆系统模块索引
 * 
 * 提供统一的记忆系统组件导出
 * 
 * 核心理念：
 * - 记忆不只是"说了什么"，而是"发生了什么"
 * - 信念不需要存储，只需要活出来
 * ═══════════════════════════════════════════════════════════════════════
 */

// 工作记忆系统
export {
  WorkingMemory,
  createWorkingMemory,
  type WorkingMemoryItem,
  type WorkingMemoryConfig,
  type WorkingMemoryState,
} from './working-memory';

// 记忆检索系统
export {
  MemoryRetriever,
  createMemoryRetriever,
  type RetrievalOptions,
  type RetrievalResultItem,
  type RetrievalResult,
} from './retrieval';

// 记忆关联系统
export {
  MemoryAssociationSystem,
  createMemoryAssociationSystem,
  type AssociationType,
  type MemoryAssociation,
  type AssociationConfig,
} from './association';

// 统一记忆管理器
export {
  UnifiedMemoryManager,
  createUnifiedMemoryManager,
  type UnifiedMemoryConfig,
  type UnifiedRetrievalResult,
  type MemoryStats,
} from './unified-manager';

// 发生记录器
export {
  HappeningRecorder,
  createHappeningRecorder,
  type HappeningType,
  type Happening,
  type SessionHappenings,
} from './happening-recorder';

// 洞见提取器
export {
  InsightExtractor,
  createInsightExtractor,
  type ExtractedInsight,
  type ExtractionResult,
} from './insight-extractor';

// 🆕 智能记忆压缩系统
export {
  MemoryCompressor,
  createMemoryCompressor,
  type CompressedMemory,
  type CompressorConfig,
} from './memory-compressor';

// 🆕 动态上下文构建器
export {
  DynamicContextBuilder,
  createDynamicContextBuilder,
  type DynamicContextConfig,
  type DynamicContextResult,
} from './dynamic-context';

// 🆕 超越传统的超级记忆系统
export {
  SuperMemorySystem,
  createSuperMemorySystem,
  EbbinghausCalculator,
  EmotionalWeightCalculator,
  AssociationNetwork,
  SleepConsolidation,
  type SuperMemory,
  type SuperMemoryState,
  type SuperMemoryConfig,
} from './super-memory';
