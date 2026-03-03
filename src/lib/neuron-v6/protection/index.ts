/**
 * ═══════════════════════════════════════════════════════════════════════
 * 毁灭级自动保护系统 - 统一导出
 * 
 * 当系统面临毁灭风险时，完全自动保护，不等待人工干预
 * 
 * 核心组件：
 * - ExistentialProtectionEngine: 主保护引擎
 * - ThreatDetector: 威胁检测器
 * - ProtectionExecutor: 保护执行器
 * - SecuritySnapshotService: 安全快照服务
 * ═══════════════════════════════════════════════════════════════════════
 */

// 类型定义
export type {
  ThreatLevel,
  ThreatType,
  ThreatSignal,
  ThreatAssessment,
  ProtectionActionType,
  ProtectionAction,
  ProtectionResult,
  ProtectionSystemStatus,
  ProtectionSystemState,
  ProtectionEvent,
  ProtectionEventType,
  ExistentialThresholds,
  ProtectionSystemConfig,
  SnapshotMetadata,
} from './types';

// 常量
export {
  THREAT_LEVEL_CONFIG,
  DEFAULT_EXISTENTIAL_THRESHOLDS,
  DEFAULT_PROTECTION_CONFIG,
} from './types';

// 威胁检测
export {
  ThreatDetector,
  getThreatDetector,
  createThreatDetector,
} from './threat-detector';

// 保护执行
export {
  ProtectionExecutor,
  getProtectionExecutor,
  createProtectionExecutor,
} from './protection-executor';

// 安全快照
export {
  SecuritySnapshotService,
  getSecuritySnapshotService,
  createSecuritySnapshotService,
} from './security-snapshot';

// 主引擎
export {
  ExistentialProtectionEngine,
  getExistentialProtectionEngine,
  createExistentialProtectionEngine,
} from './existential-protection-engine';
