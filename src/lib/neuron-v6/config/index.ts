/**
 * V6 系统配置模块
 *
 * 统一管理所有系统配置
 */

export {
  systemConfig,
  getSystemConfig,
  DEFAULT_SYSTEM_CONFIG,
  SystemConfigManager,
  // 类型
  type SystemConfig,
  type MemoryConfig,
  type SSMControllerConfig,
  type MetaLearningConfig,
  type ImplicitMetaLearningConfig,
  type AutoEvolutionConfig,
  type ProtectionConfig,
  type BackgroundConfig,
  type EmbeddingConfig,
  type TokenBudgetConfig,
  type VectorIndexConfig,
} from './system-config';
