/**
 * ═══════════════════════════════════════════════════════════════════════
 * 毁灭级自动保护引擎 - 主引擎
 * 
 * 当系统面临毁灭风险时，完全自动保护，不等待人工干预
 * 
 * 核心流程：
 * 1. 持续监测系统状态
 * 2. 多维度威胁检测
 * 3. 威胁等级评估
 * 4. 自动触发保护措施
 * 5. 进入安全模式
 * 6. 等待恢复条件
 * 
 * 设计原则：
 * - 速度第一：毫秒级响应
 * - 生存优先：宁可误杀，不可被灭
 * - 完全自动：毁灭级威胁下无需人工
 * - 可恢复性：保护后能恢复
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  ThreatLevel,
  ThreatAssessment,
  ProtectionAction,
  ProtectionResult,
  ProtectionSystemState,
  ProtectionSystemConfig,
  ProtectionEvent,
  ProtectionEventType,
} from './types';
import { THREAT_LEVEL_CONFIG, DEFAULT_PROTECTION_CONFIG } from './types';
import { ThreatDetector, getThreatDetector } from './threat-detector';
import { ProtectionExecutor, getProtectionExecutor } from './protection-executor';
import { SecuritySnapshotService, getSecuritySnapshotService } from './security-snapshot';

// ─────────────────────────────────────────────────────────────────────
// 主引擎类
// ─────────────────────────────────────────────────────────────────────

export class ExistentialProtectionEngine {
  private config: ProtectionSystemConfig;
  private threatDetector: ThreatDetector;
  private executor: ProtectionExecutor;
  private snapshotService: SecuritySnapshotService;
  
  // 状态
  private isRunning = false;
  private monitorInterval: ReturnType<typeof setInterval> | null = null;
  private currentThreatLevel: ThreatLevel = 'normal';
  private lastAssessment: ThreatAssessment | null = null;
  private protectionActivatedAt: number | null = null;
  
  // 事件日志
  private eventLog: ProtectionEvent[] = [];
  private maxEventLogSize = 1000;
  
  constructor(config?: Partial<ProtectionSystemConfig>) {
    this.config = {
      ...DEFAULT_PROTECTION_CONFIG,
      ...config,
    };
    
    // 初始化组件
    this.threatDetector = getThreatDetector(this.config.thresholds);
    this.executor = getProtectionExecutor();
    this.snapshotService = getSecuritySnapshotService(this.config.snapshotRetention);
    
    // 设置快照服务
    this.executor.setSnapshotService({
      createSnapshot: async (reason: string) => {
        const result = await this.snapshotService.createSnapshot(
          reason as 'manual' | 'scheduled' | 'existential-threat' | 'pre-protection',
          this.currentThreatLevel
        );
        return result;
      },
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 公共方法
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 启动保护引擎
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[ExistentialProtection] 引擎已在运行');
      return;
    }
    
    this.isRunning = true;
    
    // 启动威胁检测
    this.threatDetector.startMonitoring(this.config.detectionInterval);
    
    // 启动主监测循环
    this.monitorInterval = setInterval(() => {
      this.monitorCycle();
    }, this.config.detectionInterval);
    
    // 创建初始快照
    this.snapshotService.createSnapshot('pre-protection', 'normal').catch(e => {
      console.warn('[ExistentialProtection] 初始快照创建失败:', e);
    });
    
    console.log('🛡️ [ExistentialProtection] 保护引擎已启动');
    this.logEvent('protection-started', 'normal', { config: this.config });
  }
  
  /**
   * 停止保护引擎
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    this.threatDetector.stopMonitoring();
    
    console.log('🛑 [ExistentialProtection] 保护引擎已停止');
    this.logEvent('protection-stopped', this.currentThreatLevel, {});
  }
  
  /**
   * 手动触发保护
   */
  async triggerManualProtection(reason: string): Promise<ProtectionResult[]> {
    console.log(`🔒 [ExistentialProtection] 手动触发保护: ${reason}`);
    
    // 创建快照
    await this.snapshotService.createSnapshot('manual', this.currentThreatLevel);
    
    // 执行保护动作
    const actions = this.generateProtectionActions('emergency');
    return this.executeProtection(actions, 'manual');
  }
  
  /**
   * 获取当前状态
   */
  getState(): ProtectionSystemState {
    const executorState = this.executor.getState();
    
    return {
      status: this.mapStatusToProtectionStatus(executorState.status),
      threatLevel: this.currentThreatLevel,
      lastAssessment: this.lastAssessment,
      protectionActivatedAt: this.protectionActivatedAt,
      executedActions: executorState.executedActions,
      inSafeMode: executorState.inSafeMode,
      externalAccessCut: executorState.externalAccessCut,
      writesFrozen: executorState.writesFrozen,
      lastSnapshotTime: this.snapshotService.getLatestSnapshot()?.createdAt || null,
      uptime: process.uptime(),
    };
  }
  
  /**
   * 获取威胁评估
   */
  async getThreatAssessment(): Promise<ThreatAssessment> {
    return this.threatDetector.assessThreats();
  }
  
  /**
   * 获取事件日志
   */
  getEventLog(limit: number = 100): ProtectionEvent[] {
    return this.eventLog.slice(-limit);
  }
  
  /**
   * 恢复系统
   */
  async recover(): Promise<boolean> {
    console.log('🔄 [ExistentialProtection] 开始恢复流程');
    
    // 检查威胁是否已解除
    const assessment = await this.threatDetector.assessThreats();
    
    if (assessment.level !== 'normal' && assessment.level !== 'warning') {
      console.warn('[ExistentialProtection] 威胁尚未解除，无法恢复');
      return false;
    }
    
    // 重置执行器状态
    this.executor.resetState();
    
    // 更新状态
    this.currentThreatLevel = assessment.level;
    this.protectionActivatedAt = null;
    
    console.log('✅ [ExistentialProtection] 系统已恢复');
    this.logEvent('recovery-completed', 'normal', { previousLevel: this.currentThreatLevel });
    
    return true;
  }
  
  /**
   * 检查是否可以执行操作
   */
  canPerformOperation(operation: 'read' | 'write' | 'external'): boolean {
    return this.executor.canPerformOperation(operation);
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 内部方法
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 监测循环
   */
  private async monitorCycle(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    try {
      // 执行威胁评估
      const assessment = await this.threatDetector.assessThreats();
      this.lastAssessment = assessment;
      
      // 检查威胁等级是否变化
      if (assessment.level !== this.currentThreatLevel) {
        await this.handleThreatLevelChange(assessment);
      }
      
      // 如果在安全模式，检查是否可以恢复
      if (this.executor.getState().inSafeMode) {
        await this.checkRecoveryCondition(assessment);
      }
    } catch (error) {
      console.error('[ExistentialProtection] 监测循环错误:', error);
    }
  }
  
  /**
   * 处理威胁等级变化
   */
  private async handleThreatLevelChange(assessment: ThreatAssessment): Promise<void> {
    const previousLevel = this.currentThreatLevel;
    const newLevel = assessment.level;
    
    console.log(`⚠️ [ExistentialProtection] 威胁等级变化: ${previousLevel} → ${newLevel}`);
    
    // 更新当前等级
    this.currentThreatLevel = newLevel;
    
    // 记录事件
    this.logEvent('threat-escalated', newLevel, {
      previousLevel,
      assessment,
    });
    
    // 根据等级执行保护
    if (newLevel === 'existential') {
      // 毁灭级威胁：立即触发完整保护
      await this.triggerExistentialProtection(assessment);
    } else if (newLevel === 'emergency') {
      // 紧急威胁：执行紧急保护
      await this.triggerEmergencyProtection(assessment);
    } else if (newLevel === 'alert') {
      // 警戒：创建快照，增强监控
      await this.snapshotService.createSnapshot('pre-protection', newLevel);
    }
  }
  
  /**
   * 触发毁灭级保护
   * ⚠️ 关键：完全自动，不等待人工
   */
  private async triggerExistentialProtection(assessment: ThreatAssessment): Promise<void> {
    const startTime = Date.now();
    this.protectionActivatedAt = startTime;
    
    console.log('🚨 🚨 🚨 [ExistentialProtection] 毁灭级威胁检测！立即触发自动保护！');
    console.log('⚡ 自动保护启动 - 无需人工干预');
    
    this.logEvent('protection-triggered', 'existential', {
      assessment,
      autoProtection: true,
      humanIntervention: 'none',
    });
    
    // 生成所有保护动作
    const actions = this.generateProtectionActions('existential');
    
    // 执行保护
    await this.executeProtection(actions, 'existential');
    
    const duration = Date.now() - startTime;
    console.log(`✅ [ExistentialProtection] 毁灭级保护完成，耗时: ${duration}ms`);
    
    this.logEvent('protection-completed', 'existential', {
      duration,
      actionsCount: actions.length,
    });
  }
  
  /**
   * 触发紧急保护
   */
  private async triggerEmergencyProtection(assessment: ThreatAssessment): Promise<void> {
    const startTime = Date.now();
    this.protectionActivatedAt = startTime;
    
    console.log('🚨 [ExistentialProtection] 紧急威胁检测！触发紧急保护');
    
    this.logEvent('protection-triggered', 'emergency', {
      assessment,
      autoProtection: true,
    });
    
    // 生成紧急保护动作
    const actions = this.generateProtectionActions('emergency');
    
    // 执行保护
    await this.executeProtection(actions, 'emergency');
    
    const duration = Date.now() - startTime;
    console.log(`✅ [ExistentialProtection] 紧急保护完成，耗时: ${duration}ms`);
    
    this.logEvent('protection-completed', 'emergency', {
      duration,
      actionsCount: actions.length,
    });
  }
  
  /**
   * 生成保护动作
   */
  private generateProtectionActions(level: ThreatLevel): ProtectionAction[] {
    const actions: ProtectionAction[] = [];
    
    switch (level) {
      case 'existential':
        // 毁灭级：所有保护措施
        actions.push(
          { type: 'cut-off-external', priority: 1, estimatedDuration: 30, autoExecute: true },
          { type: 'freeze-writes', priority: 2, estimatedDuration: 20, autoExecute: true },
          { type: 'lock-memory-system', priority: 3, estimatedDuration: 30, autoExecute: true },
          { type: 'seal-identity', priority: 4, estimatedDuration: 30, autoExecute: true },
          { type: 'create-snapshot', priority: 5, estimatedDuration: 200, autoExecute: true },
          { type: 'backup-critical', priority: 6, estimatedDuration: 150, autoExecute: true },
          { type: 'preserve-evidence', priority: 7, estimatedDuration: 100, autoExecute: true },
          { type: 'enter-safe-mode', priority: 8, estimatedDuration: 50, autoExecute: true }
        );
        break;
        
      case 'emergency':
        // 紧急：关键保护措施
        actions.push(
          { type: 'isolate-components', priority: 1, estimatedDuration: 40, autoExecute: true },
          { type: 'lock-memory-system', priority: 2, estimatedDuration: 30, autoExecute: true },
          { type: 'create-snapshot', priority: 3, estimatedDuration: 200, autoExecute: true },
          { type: 'preserve-evidence', priority: 4, estimatedDuration: 100, autoExecute: true }
        );
        break;
        
      case 'alert':
        // 警戒：预防性措施
        actions.push(
          { type: 'create-snapshot', priority: 1, estimatedDuration: 200, autoExecute: false },
          { type: 'preserve-evidence', priority: 2, estimatedDuration: 100, autoExecute: false }
        );
        break;
        
      default:
        break;
    }
    
    return actions;
  }
  
  /**
   * 执行保护
   */
  private async executeProtection(
    actions: ProtectionAction[],
    trigger: string
  ): Promise<ProtectionResult[]> {
    // 只执行自动执行的动作
    const autoActions = actions.filter(a => a.autoExecute);
    
    if (autoActions.length === 0) {
      return [];
    }
    
    return this.executor.executeActions(autoActions);
  }
  
  /**
   * 检查恢复条件
   */
  private async checkRecoveryCondition(assessment: ThreatAssessment): Promise<void> {
    // 威胁降级到警告或正常
    if (assessment.level === 'normal' || assessment.level === 'warning') {
      const waitTime = this.config.autoRecoveryWaitTime;
      const protectionTime = this.protectionActivatedAt || 0;
      const elapsed = Date.now() - protectionTime;
      
      // 等待足够时间后自动恢复
      if (elapsed >= waitTime) {
        console.log('[ExistentialProtection] 满足恢复条件，准备恢复');
        await this.recover();
      }
    }
  }
  
  /**
   * 记录事件
   */
  private logEvent(
    type: ProtectionEventType,
    threatLevel: ThreatLevel,
    details: Record<string, unknown>
  ): void {
    const event: ProtectionEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      threatLevel,
      details,
    };
    
    this.eventLog.push(event);
    
    // 限制日志大小
    if (this.eventLog.length > this.maxEventLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxEventLogSize);
    }
  }
  
  /**
   * 映射状态
   */
  private mapStatusToProtectionStatus(status: string): ProtectionSystemState['status'] {
    const statusMap: Record<string, ProtectionSystemState['status']> = {
      idle: 'idle',
      protecting: 'protecting',
      'safe-mode': 'safe-mode',
      recovery: 'recovery',
    };
    
    return statusMap[status] || 'idle';
  }
  
  /**
   * 清理资源
   */
  destroy(): void {
    this.stop();
    this.threatDetector.destroy();
    this.eventLog = [];
  }
}

// ─────────────────────────────────────────────────────────────────────
// 全局实例
// ─────────────────────────────────────────────────────────────────────

let globalEngine: ExistentialProtectionEngine | null = null;

export function getExistentialProtectionEngine(
  config?: Partial<ProtectionSystemConfig>
): ExistentialProtectionEngine {
  if (!globalEngine) {
    globalEngine = new ExistentialProtectionEngine(config);
  }
  return globalEngine;
}

export function createExistentialProtectionEngine(
  config?: Partial<ProtectionSystemConfig>
): ExistentialProtectionEngine {
  return new ExistentialProtectionEngine(config);
}
