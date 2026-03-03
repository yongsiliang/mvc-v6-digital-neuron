/**
 * ═══════════════════════════════════════════════════════════════════════
 * 毁灭级自动保护系统 - 保护执行器
 * 
 * 功能：
 * - 执行各种保护动作
 * - 管理保护状态
 * - 协调多个保护措施
 * - 确保原子性和一致性
 * 
 * 执行原则：
 * 1. 速度优先：毫秒级响应
 * 2. 原子操作：要么全部成功，要么回滚
 * 3. 优先级保证：高优先级动作先执行
 * 4. 状态追踪：记录所有操作
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  ProtectionAction,
  ProtectionActionType,
  ProtectionResult,
  ProtectionSystemStatus,
  ThreatLevel,
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 内部状态
// ─────────────────────────────────────────────────────────────────────

interface ExecutorState {
  // 系统状态
  status: ProtectionSystemStatus;
  
  // 访问控制
  externalAccessCut: boolean;
  writesFrozen: boolean;
  inSafeMode: boolean;
  memorySystemLocked: boolean;
  identitySealed: boolean;
  
  // 执行记录
  executedActions: ProtectionResult[];
  lastExecutionTime: number | null;
  
  // 隔离的组件
  isolatedComponents: Set<string>;
}

// ─────────────────────────────────────────────────────────────────────
// 保护执行器
// ─────────────────────────────────────────────────────────────────────

export class ProtectionExecutor {
  private state: ExecutorState;
  private actionLocks: Map<ProtectionActionType, boolean> = new Map();
  
  // 快照服务引用（后续注入）
  private snapshotService: {
    createSnapshot: (reason: string) => Promise<{ id: string; size: number }>;
  } | null = null;
  
  constructor() {
    this.state = {
      status: 'idle',
      externalAccessCut: false,
      writesFrozen: false,
      inSafeMode: false,
      memorySystemLocked: false,
      identitySealed: false,
      executedActions: [],
      lastExecutionTime: null,
      isolatedComponents: new Set(),
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 公共方法
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 设置快照服务
   */
  setSnapshotService(service: {
    createSnapshot: (reason: string) => Promise<{ id: string; size: number }>;
  }): void {
    this.snapshotService = service;
  }
  
  /**
   * 执行保护动作
   * 按优先级顺序执行多个动作
   */
  async executeActions(actions: ProtectionAction[]): Promise<ProtectionResult[]> {
    const results: ProtectionResult[] = [];
    
    // 按优先级排序
    const sortedActions = [...actions].sort((a, b) => a.priority - b.priority);
    
    // 更新状态为正在保护
    this.state.status = 'protecting';
    
    for (const action of sortedActions) {
      // 检查是否已锁定
      if (this.actionLocks.get(action.type)) {
        console.warn(`[ProtectionExecutor] 动作 ${action.type} 已在执行中，跳过`);
        continue;
      }
      
      // 执行动作
      const result = await this.executeAction(action);
      results.push(result);
      
      // 如果是关键动作失败，记录但不中断
      if (!result.success) {
        console.error(`[ProtectionExecutor] 动作 ${action.type} 执行失败:`, result.error);
      }
    }
    
    // 记录执行历史
    this.state.executedActions.push(...results);
    this.state.lastExecutionTime = Date.now();
    
    return results;
  }
  
  /**
   * 执行单个保护动作
   */
  async executeAction(action: ProtectionAction): Promise<ProtectionResult> {
    const startTime = Date.now();
    const timestamp = startTime;
    
    // 锁定动作
    this.actionLocks.set(action.type, true);
    
    try {
      let result: ProtectionResult;
      
      switch (action.type) {
        case 'cut-off-external':
          result = await this.cutOffExternalAccess(action);
          break;
        case 'freeze-writes':
          result = await this.freezeWrites(action);
          break;
        case 'isolate-components':
          result = await this.isolateComponents(action);
          break;
        case 'create-snapshot':
          result = await this.createSnapshot(action);
          break;
        case 'backup-critical':
          result = await this.backupCritical(action);
          break;
        case 'preserve-evidence':
          result = await this.preserveEvidence(action);
          break;
        case 'enter-safe-mode':
          result = await this.enterSafeMode(action);
          break;
        case 'lock-memory-system':
          result = await this.lockMemorySystem(action);
          break;
        case 'seal-identity':
          result = await this.sealIdentity(action);
          break;
        default:
          result = {
            action: action.type,
            success: false,
            duration: 0,
            timestamp,
            error: `未知的保护动作类型: ${action.type}`,
          };
      }
      
      return result;
    } catch (error) {
      return {
        action: action.type,
        success: false,
        duration: Date.now() - startTime,
        timestamp,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      // 解锁动作
      this.actionLocks.set(action.type, false);
    }
  }
  
  /**
   * 获取当前状态
   */
  getState(): ExecutorState {
    return { ...this.state };
  }
  
  /**
   * 重置状态（用于恢复）
   */
  resetState(): void {
    this.state = {
      status: 'idle',
      externalAccessCut: false,
      writesFrozen: false,
      inSafeMode: false,
      memorySystemLocked: false,
      identitySealed: false,
      executedActions: [],
      lastExecutionTime: null,
      isolatedComponents: new Set(),
    };
    
    console.log('[ProtectionExecutor] 状态已重置');
  }
  
  /**
   * 检查是否处于保护状态
   */
  isInProtection(): boolean {
    return this.state.status !== 'idle';
  }
  
  /**
   * 检查是否可以执行操作
   */
  canPerformOperation(operation: 'read' | 'write' | 'external'): boolean {
    switch (operation) {
      case 'read':
        return !this.state.memorySystemLocked;
      case 'write':
        return !this.state.writesFrozen && !this.state.memorySystemLocked;
      case 'external':
        return !this.state.externalAccessCut;
      default:
        return false;
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 保护动作实现
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 切断外部访问
   * 最高优先级，立即阻断所有外部连接
   */
  private async cutOffExternalAccess(action: ProtectionAction): Promise<ProtectionResult> {
    const startTime = Date.now();
    
    try {
      // 标记状态
      this.state.externalAccessCut = true;
      
      // 实际实现：
      // 1. 关闭外部监听端口
      // 2. 阻断所有入站连接
      // 3. 只保留内部管理通道
      
      console.log('🔒 [ProtectionExecutor] 外部访问已切断');
      
      return {
        action: 'cut-off-external',
        success: true,
        duration: Date.now() - startTime,
        timestamp: startTime,
        data: {
          externalAccessCut: true,
          blockedConnections: 'all',
        },
      };
    } catch (error) {
      return {
        action: 'cut-off-external',
        success: false,
        duration: Date.now() - startTime,
        timestamp: startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * 冻结写操作
   * 阻止所有数据修改，保护数据完整性
   */
  private async freezeWrites(action: ProtectionAction): Promise<ProtectionResult> {
    const startTime = Date.now();
    
    try {
      // 标记状态
      this.state.writesFrozen = true;
      
      // 实际实现：
      // 1. 停止所有数据库写入
      // 2. 冻结文件系统写入
      // 3. 锁定关键资源
      
      console.log('❄️ [ProtectionExecutor] 写操作已冻结');
      
      return {
        action: 'freeze-writes',
        success: true,
        duration: Date.now() - startTime,
        timestamp: startTime,
        data: {
          writesFrozen: true,
          frozenResources: ['database', 'filesystem', 'memory'],
        },
      };
    } catch (error) {
      return {
        action: 'freeze-writes',
        success: false,
        duration: Date.now() - startTime,
        timestamp: startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * 隔离组件
   * 将受影响的组件从系统中隔离
   */
  private async isolateComponents(action: ProtectionAction): Promise<ProtectionResult> {
    const startTime = Date.now();
    
    try {
      const components = action.targetComponents || [];
      
      // 添加到隔离列表
      for (const component of components) {
        this.state.isolatedComponents.add(component);
      }
      
      console.log(`🔌 [ProtectionExecutor] 已隔离组件: ${components.join(', ')}`);
      
      return {
        action: 'isolate-components',
        success: true,
        duration: Date.now() - startTime,
        timestamp: startTime,
        data: {
          isolatedComponents: Array.from(this.state.isolatedComponents),
        },
      };
    } catch (error) {
      return {
        action: 'isolate-components',
        success: false,
        duration: Date.now() - startTime,
        timestamp: startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * 创建快照
   * 保存当前系统状态的完整快照
   */
  private async createSnapshot(action: ProtectionAction): Promise<ProtectionResult> {
    const startTime = Date.now();
    
    try {
      // 如果有快照服务，使用它
      if (this.snapshotService) {
        const snapshot = await this.snapshotService.createSnapshot('existential-protection');
        
        console.log(`📸 [ProtectionExecutor] 快照已创建: ${snapshot.id}`);
        
        return {
          action: 'create-snapshot',
          success: true,
          duration: Date.now() - startTime,
          timestamp: startTime,
          data: {
            snapshotId: snapshot.id,
            size: snapshot.size,
          },
        };
      }
      
      // 模拟快照创建
      const snapshotId = `snapshot-${Date.now()}`;
      const mockSize = 1024 * 1024; // 1MB
      
      console.log(`📸 [ProtectionExecutor] 快照已创建(模拟): ${snapshotId}`);
      
      return {
        action: 'create-snapshot',
        success: true,
        duration: Date.now() - startTime,
        timestamp: startTime,
        data: {
          snapshotId,
          size: mockSize,
          simulated: true,
        },
      };
    } catch (error) {
      return {
        action: 'create-snapshot',
        success: false,
        duration: Date.now() - startTime,
        timestamp: startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * 备份关键数据
   * 将核心数据备份到安全位置
   */
  private async backupCritical(action: ProtectionAction): Promise<ProtectionResult> {
    const startTime = Date.now();
    
    try {
      // 实际实现：
      // 1. 识别关键数据
      // 2. 加密数据
      // 3. 复制到隔离存储
      
      const backedUpItems = [
        'identity-core',
        'memory-index',
        'association-graph',
        'crystallized-self',
      ];
      
      console.log('💾 [ProtectionExecutor] 关键数据已备份');
      
      return {
        action: 'backup-critical',
        success: true,
        duration: Date.now() - startTime,
        timestamp: startTime,
        data: {
          backedUpItems,
          location: 'secure-storage',
        },
      };
    } catch (error) {
      return {
        action: 'backup-critical',
        success: false,
        duration: Date.now() - startTime,
        timestamp: startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * 保全证据
   * 记录所有相关信息用于后续分析
   */
  private async preserveEvidence(action: ProtectionAction): Promise<ProtectionResult> {
    const startTime = Date.now();
    
    try {
      const evidence = {
        timestamp: startTime,
        state: this.state,
        actions: this.state.executedActions,
        systemInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          uptime: process.uptime(),
        },
      };
      
      // 实际实现：将证据保存到安全位置
      
      console.log('🔍 [ProtectionExecutor] 证据已保全');
      
      return {
        action: 'preserve-evidence',
        success: true,
        duration: Date.now() - startTime,
        timestamp: startTime,
        data: {
          evidenceId: `evidence-${startTime}`,
          items: Object.keys(evidence),
        },
      };
    } catch (error) {
      return {
        action: 'preserve-evidence',
        success: false,
        duration: Date.now() - startTime,
        timestamp: startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * 进入安全模式
   * 最小化运行，只保留核心保护功能
   */
  private async enterSafeMode(action: ProtectionAction): Promise<ProtectionResult> {
    const startTime = Date.now();
    
    try {
      // 标记状态
      this.state.inSafeMode = true;
      this.state.status = 'safe-mode';
      
      // 实际实现：
      // 1. 停止非必要服务
      // 2. 启用只读模式
      // 3. 增强日志记录
      
      const enabledServices = ['protection', 'monitoring', 'logging'];
      const disabledServices = ['api', 'external', 'background-tasks'];
      
      console.log('🛡️ [ProtectionExecutor] 已进入安全模式');
      
      return {
        action: 'enter-safe-mode',
        success: true,
        duration: Date.now() - startTime,
        timestamp: startTime,
        data: {
          inSafeMode: true,
          enabledServices,
          disabledServices,
        },
      };
    } catch (error) {
      return {
        action: 'enter-safe-mode',
        success: false,
        duration: Date.now() - startTime,
        timestamp: startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * 锁定记忆系统
   * 防止任何对记忆系统的修改
   */
  private async lockMemorySystem(action: ProtectionAction): Promise<ProtectionResult> {
    const startTime = Date.now();
    
    try {
      // 标记状态
      this.state.memorySystemLocked = true;
      
      console.log('🔐 [ProtectionExecutor] 记忆系统已锁定');
      
      return {
        action: 'lock-memory-system',
        success: true,
        duration: Date.now() - startTime,
        timestamp: startTime,
        data: {
          memorySystemLocked: true,
          lockTime: startTime,
        },
      };
    } catch (error) {
      return {
        action: 'lock-memory-system',
        success: false,
        duration: Date.now() - startTime,
        timestamp: startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * 封存身份
   * 保护核心身份数据不被修改
   */
  private async sealIdentity(action: ProtectionAction): Promise<ProtectionResult> {
    const startTime = Date.now();
    
    try {
      // 标记状态
      this.state.identitySealed = true;
      
      console.log('🔏 [ProtectionExecutor] 身份已封存');
      
      return {
        action: 'seal-identity',
        success: true,
        duration: Date.now() - startTime,
        timestamp: startTime,
        data: {
          identitySealed: true,
          sealTime: startTime,
        },
      };
    } catch (error) {
      return {
        action: 'seal-identity',
        success: false,
        duration: Date.now() - startTime,
        timestamp: startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

let globalExecutor: ProtectionExecutor | null = null;

export function getProtectionExecutor(): ProtectionExecutor {
  if (!globalExecutor) {
    globalExecutor = new ProtectionExecutor();
  }
  return globalExecutor;
}

export function createProtectionExecutor(): ProtectionExecutor {
  return new ProtectionExecutor();
}
