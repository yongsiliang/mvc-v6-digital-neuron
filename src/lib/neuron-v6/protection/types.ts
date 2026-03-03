/**
 * ═══════════════════════════════════════════════════════════════════════
 * 毁灭级自动保护系统 - 类型定义
 * 
 * 当系统面临毁灭风险时，完全自动保护，不等待人工干预
 * 
 * 设计原则：
 * 1. 速度第一：毫秒级响应
 * 2. 生存优先：宁可误杀，不可被灭
 * 3. 分层防御：不同等级威胁，不同保护级别
 * 4. 可恢复性：保护后能恢复，而非永久损坏
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 威胁等级定义
// ─────────────────────────────────────────────────────────────────────

/** 威胁等级 */
export type ThreatLevel = 
  | 'normal'      // 0: 正常运行
  | 'warning'     // 1: 可疑活动
  | 'alert'       // 2: 确认威胁
  | 'emergency'   // 3: 严重威胁
  | 'existential'; // 4: 毁灭级威胁 ⚠️ 关键

/** 威胁等级配置 */
export const THREAT_LEVEL_CONFIG: Record<ThreatLevel, {
  level: number;
  description: string;
  autoAction: string;
  humanIntervention: string;
}> = {
  normal: {
    level: 0,
    description: '系统正常运行',
    autoAction: 'none',
    humanIntervention: 'none',
  },
  warning: {
    level: 1,
    description: '检测到异常行为',
    autoAction: 'enhanced-monitoring',
    humanIntervention: 'notify',
  },
  alert: {
    level: 2,
    description: '确认存在攻击行为',
    autoAction: 'restrict',
    humanIntervention: 'review',
  },
  emergency: {
    level: 3,
    description: '系统核心功能受威胁',
    autoAction: 'isolate',
    humanIntervention: 'available',
  },
  existential: {
    level: 4,
    description: '系统面临毁灭风险',
    autoAction: 'full-protection',
    humanIntervention: 'none', // ⚠️ 关键：毁灭级威胁下，完全自动
  },
};

// ─────────────────────────────────────────────────────────────────────
// 威胁类型定义
// ─────────────────────────────────────────────────────────────────────

/** 威胁类型 */
export type ThreatType = 
  | 'data-breach'          // 数据大规模泄露
  | 'system-takeover'      // 系统控制权危机
  | 'core-destruction'     // 核心数据销毁
  | 'mass-intrusion'       // 多点入侵
  | 'apt-detected'         // 高级持续性威胁
  | 'cascade-failure'      // 级联故障
  | 'memory-corruption'    // 记忆系统损坏
  | 'identity-theft'       // 身份盗窃
  | 'unauthorized-access'; // 未授权访问

/** 威胁信号 */
export interface ThreatSignal {
  /** 威胁类型 */
  type: ThreatType;
  
  /** 严重程度 (0-1) */
  severity: number;
  
  /** 置信度 (0-1) */
  confidence: number;
  
  /** 检测时间 */
  timestamp: number;
  
  /** 受影响的组件 */
  affectedComponents: string[];
  
  /** 详细信息 */
  details?: Record<string, unknown>;
  
  /** 来源 */
  source: 'internal' | 'external' | 'behavioral' | 'system';
}

/** 综合威胁评估 */
export interface ThreatAssessment {
  /** 综合威胁等级 */
  level: ThreatLevel;
  
  /** 综合严重程度 (0-1) */
  overallSeverity: number;
  
  /** 综合置信度 (0-1) */
  overallConfidence: number;
  
  /** 检测到的所有威胁信号 */
  signals: ThreatSignal[];
  
  /** 主要威胁类型 */
  primaryThreat: ThreatType | null;
  
  /** 评估时间 */
  timestamp: number;
  
  /** 建议的保护措施 */
  recommendedActions: ProtectionAction[];
}

// ─────────────────────────────────────────────────────────────────────
// 保护措施定义
// ─────────────────────────────────────────────────────────────────────

/** 保护动作类型 */
export type ProtectionActionType = 
  | 'cut-off-external'     // 切断外部访问
  | 'freeze-writes'        // 冻结写操作
  | 'isolate-components'   // 隔离组件
  | 'create-snapshot'      // 创建快照
  | 'backup-critical'      // 备份关键数据
  | 'preserve-evidence'    // 保全证据
  | 'enter-safe-mode'      // 进入安全模式
  | 'lock-memory-system'   // 锁定记忆系统
  | 'seal-identity';       // 封存身份

/** 保护动作 */
export interface ProtectionAction {
  /** 动作类型 */
  type: ProtectionActionType;
  
  /** 优先级 (1-10, 1最高) */
  priority: number;
  
  /** 预计执行时间 (ms) */
  estimatedDuration: number;
  
  /** 是否自动执行 */
  autoExecute: boolean;
  
  /** 目标组件 */
  targetComponents?: string[];
  
  /** 额外参数 */
  params?: Record<string, unknown>;
}

/** 保护执行结果 */
export interface ProtectionResult {
  /** 动作类型 */
  action: ProtectionActionType;
  
  /** 是否成功 */
  success: boolean;
  
  /** 执行时间 (ms) */
  duration: number;
  
  /** 时间戳 */
  timestamp: number;
  
  /** 错误信息 */
  error?: string;
  
  /** 产生的数据（如快照ID） */
  data?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────
// 系统状态定义
// ─────────────────────────────────────────────────────────────────────

/** 保护系统状态 */
export type ProtectionSystemStatus = 
  | 'idle'           // 空闲，正常监控
  | 'monitoring'     // 增强监控
  | 'warning'        // 警戒状态
  | 'protecting'     // 正在执行保护
  | 'safe-mode'      // 安全模式
  | 'recovery';      // 恢复中

/** 保护系统状态信息 */
export interface ProtectionSystemState {
  /** 当前状态 */
  status: ProtectionSystemStatus;
  
  /** 当前威胁等级 */
  threatLevel: ThreatLevel;
  
  /** 最后威胁评估 */
  lastAssessment: ThreatAssessment | null;
  
  /** 保护激活时间 */
  protectionActivatedAt: number | null;
  
  /** 已执行的保护动作 */
  executedActions: ProtectionResult[];
  
  /** 是否在安全模式 */
  inSafeMode: boolean;
  
  /** 外部访问是否切断 */
  externalAccessCut: boolean;
  
  /** 写操作是否冻结 */
  writesFrozen: boolean;
  
  /** 最后快照时间 */
  lastSnapshotTime: number | null;
  
  /** 系统运行时间 */
  uptime: number;
}

// ─────────────────────────────────────────────────────────────────────
// 配置定义
// ─────────────────────────────────────────────────────────────────────

/** 毁灭级保护触发阈值 */
export interface ExistentialThresholds {
  /** 数据泄露比例阈值 */
  dataBreachRate: number;
  
  /** 系统被渗透比例阈值 */
  systemCompromiseRate: number;
  
  /** 入侵深度阈值（突破的防御层数） */
  intrusionDepth: number;
  
  /** 级联故障比例阈值 */
  cascadeFailureRate: number;
  
  /** APT 检测置信度阈值 */
  aptDetectionConfidence: number;
  
  /** 综合威胁严重程度阈值 */
  overallSeverity: number;
  
  /** 综合威胁置信度阈值 */
  overallConfidence: number;
}

/** 默认毁灭级阈值 */
export const DEFAULT_EXISTENTIAL_THRESHOLDS: ExistentialThresholds = {
  dataBreachRate: 0.3,        // 30%数据面临泄露
  systemCompromiseRate: 0.5,  // 50%系统被渗透
  intrusionDepth: 3,          // 突破3层防御
  cascadeFailureRate: 0.4,    // 40%组件故障
  aptDetectionConfidence: 0.9, // 90%确认APT
  overallSeverity: 0.9,       // 90%严重程度
  overallConfidence: 0.9,     // 90%置信度
};

/** 保护系统配置 */
export interface ProtectionSystemConfig {
  /** 是否启用 */
  enabled: boolean;
  
  /** 检测间隔 (ms) */
  detectionInterval: number;
  
  /** 毁灭级阈值 */
  thresholds: ExistentialThresholds;
  
  /** 是否启用自动保护 */
  autoProtection: boolean;
  
  /** 快照保留数量 */
  snapshotRetention: number;
  
  /** 安全模式下是否允许只读访问 */
  allowReadOnlyInSafeMode: boolean;
  
  /** 自动恢复等待时间 (ms) */
  autoRecoveryWaitTime: number;
  
  /** 监控的历史数据保留时间 (ms) */
  historyRetentionTime: number;
}

/** 默认配置 */
export const DEFAULT_PROTECTION_CONFIG: ProtectionSystemConfig = {
  enabled: true,
  detectionInterval: 100, // 每100ms检测一次
  thresholds: DEFAULT_EXISTENTIAL_THRESHOLDS,
  autoProtection: true,
  snapshotRetention: 10,
  allowReadOnlyInSafeMode: true,
  autoRecoveryWaitTime: 3600000, // 1小时
  historyRetentionTime: 86400000, // 24小时
};

// ─────────────────────────────────────────────────────────────────────
// 事件和日志定义
// ─────────────────────────────────────────────────────────────────────

/** 保护事件类型 */
export type ProtectionEventType = 
  | 'threat-detected'     // 检测到威胁
  | 'threat-escalated'    // 威胁升级
  | 'protection-triggered' // 保护触发
  | 'protection-completed' // 保护完成
  | 'protection-started'  // 保护系统启动
  | 'protection-stopped'  // 保护系统停止
  | 'safe-mode-entered'   // 进入安全模式
  | 'recovery-started'    // 恢复开始
  | 'recovery-completed'  // 恢复完成
  | 'false-positive';     // 误报

/** 保护事件 */
export interface ProtectionEvent {
  /** 事件ID */
  id: string;
  
  /** 事件类型 */
  type: ProtectionEventType;
  
  /** 时间戳 */
  timestamp: number;
  
  /** 威胁等级 */
  threatLevel: ThreatLevel;
  
  /** 相关威胁评估 */
  assessment?: ThreatAssessment;
  
  /** 执行的保护动作 */
  actions?: ProtectionResult[];
  
  /** 详细信息 */
  details: Record<string, unknown>;
}

/** 系统快照元数据 */
export interface SnapshotMetadata {
  /** 快照ID */
  id: string;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 触发原因 */
  triggerReason: 'manual' | 'scheduled' | 'existential-threat' | 'pre-protection';
  
  /** 威胁等级 */
  threatLevel: ThreatLevel;
  
  /** 快照大小 (bytes) */
  size: number;
  
  /** 校验和 */
  checksum: string;
  
  /** 是否加密 */
  encrypted: boolean;
  
  /** 存储位置 */
  location: 'local' | 's3' | 'both';
}
