/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一记忆系统 - 统一导出
 * 
 * Moss级别记忆系统
 * 实现六大核心能力：持久化、可检索、可激活、可关联、可演化、可结晶
 * ═══════════════════════════════════════════════════════════════════════
 */

// 类型定义
export type {
  MemoryNode,
  MemoryType,
  MemoryCategory,
  MemoryAssociation,
  AssociationType,
  EmotionalMarker,
  Trigger,
  MemoryTrigger,
  TriggerType,
  ActivationConfig,
  CrystallizationConditions,
  CrystallizationConfig,
} from './types';

// 默认配置
export {
  DEFAULT_ACTIVATION_CONFIG,
  DEFAULT_CRYSTALLIZATION_CONDITIONS,
  DEFAULT_CRYSTALLIZATION_CONFIG,
} from './types';

// 触发器系统
export {
  TriggerSystem,
  createTriggerSystem,
  type TriggerMatch,
} from './trigger-system';

// 扩散激活引擎
export {
  SpreadingActivationEngine,
  createSpreadingActivationEngine,
  type SpreadingResult,
  type SpreadOptions,
} from './spreading-activation';

// 关联建立引擎
export {
  AssociationEngine,
  createAssociationEngine,
  type AssociationOptions,
  type AssociationResult,
  type SimilarMemory,
  DEFAULT_ASSOCIATION_OPTIONS,
} from './association-engine';

// 结晶化引擎
export {
  CrystallizationEngine,
  createCrystallizationEngine,
  type CrystallizationOptions,
  type CrystallizationResult,
  type SelfCore,
  type CrystallizationCandidate,
  DEFAULT_CRYSTALLIZATION_OPTIONS,
} from './crystallization-engine';

// 统一记忆系统
export {
  UnifiedMemorySystem,
  createUnifiedMemorySystem,
  getDefaultMemorySystem,
  type UnifiedMemoryConfig,
  type StoreMemoryOptions,
  type StoreMemoryResult,
  type ActivationResult,
  type RetrievalOptions,
  type SystemStatus,
  DEFAULT_UNIFIED_MEMORY_CONFIG,
} from './unified-memory-system';

// 🆕 持久化层
export {
  UnifiedMemoryPersistence,
  createUnifiedMemoryPersistence,
  type PersistenceConfig,
  type PersistenceStats,
  DEFAULT_PERSISTENCE_CONFIG,
} from './persistence';

// 🆕 数据库迁移
export {
  MIGRATION_SQL,
  ROLLBACK_SQL,
  runMigration,
  rollbackMigration,
} from './migration';

// 🆕 嵌入服务
export {
  EmbeddingService,
  getEmbeddingService,
  createEmbeddingService,
  type EmbeddingResult,
  type EmbeddingServiceConfig,
} from './embedding-service';

// 🆕 持久化监控
export {
  PersistenceMonitor,
  getPersistenceMonitor,
  createPersistenceMonitor,
  type HealthStatus,
  type DatabaseHealth,
  type S3Health,
  type PersistenceHealthReport,
  type PersistenceMonitorStats,
} from './persistence-monitor';

// 🆕 毁灭级自动保护系统
export {
  ExistentialProtectionEngine,
  getExistentialProtectionEngine,
  createExistentialProtectionEngine,
  ThreatDetector,
  getThreatDetector,
  createThreatDetector,
  ProtectionExecutor,
  getProtectionExecutor,
  createProtectionExecutor,
  SecuritySnapshotService,
  getSecuritySnapshotService,
  createSecuritySnapshotService,
  // 类型
  type ThreatLevel,
  type ThreatType,
  type ThreatSignal,
  type ThreatAssessment,
  type ProtectionActionType,
  type ProtectionAction,
  type ProtectionResult,
  type ProtectionSystemStatus,
  type ProtectionSystemState,
  type ProtectionEvent,
  type ProtectionEventType,
  type ExistentialThresholds,
  type ProtectionSystemConfig,
  type SnapshotMetadata,
  // 常量
  THREAT_LEVEL_CONFIG,
  DEFAULT_EXISTENTIAL_THRESHOLDS,
  DEFAULT_PROTECTION_CONFIG,
} from '../../protection';
