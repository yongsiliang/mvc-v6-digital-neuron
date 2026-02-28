/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一记忆模块 (Unified Memory Module)
 * 
 * 整合记忆相关功能
 * ═══════════════════════════════════════════════════════════════════════
 */

// 分层记忆系统（核心）
export type {
  MemoryLayer,
  CoreSummary,
  ConsolidatedMemory,
  EpisodicMemory,
  MemoryRetrievalResult,
} from '../layered-memory';

export { LayeredMemorySystem } from '../layered-memory';

// 长期记忆
export type {
  KnowledgeNode,
  KnowledgeLink,
  RelationType,
  Experience,
  Wisdom,
  MemoryRetrieval,
} from '../long-term-memory';

export {
  LongTermMemory,
  createLongTermMemory,
} from '../long-term-memory';

// 记忆分类
export { MemoryClassifier } from '../memory-classifier';

// 记忆管理
export { MemoryManager } from '../memory-manager';

// 记忆监控
export { MemoryMonitor } from '../memory-monitor';
