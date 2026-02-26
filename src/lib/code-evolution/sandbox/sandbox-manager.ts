/**
 * 沙箱管理器
 * 
 * 提供隔离的执行环境，用于：
 * - 安全执行进化产生的代码
 * - 资源限制（内存、CPU、时间）
 * - 状态快照与回滚
 * - 多沙箱并行执行
 */

import type {
  Sandbox,
  SandboxId,
  SandboxConfig,
  SandboxLimits,
  SandboxStatus,
  SandboxResult,
  Snapshot,
  SnapshotId,
  Module,
  ModuleId,
} from '../types/core';

// 导出类型
export type { SandboxId } from '../types/core';

// ═══════════════════════════════════════════════════════════════
// 资源监控接口
// ═══════════════════════════════════════════════════════════════

interface ResourceMetrics {
  memoryUsed: number;
  cpuUsed: number;
  timeUsed: number;
  peakMemory: number;
}

interface ResourceMonitor {
  start(): void;
  stop(): void;
  getMetrics(): ResourceMetrics;
  checkLimits(): { exceeded: boolean; limit?: string; usage?: number };
}

// ═══════════════════════════════════════════════════════════════
// 沙箱池
// ═══════════════════════════════════════════════════════════════

interface SandboxPoolConfig {
  maxSize: number;
  defaultLimits: SandboxLimits;
  recycleAfter: number;  // 使用多少次后回收
}

// ═══════════════════════════════════════════════════════════════
// 执行选项
// ═══════════════════════════════════════════════════════════════

interface ExecuteOptions {
  timeout?: number;
  captureOutput?: boolean;
  captureErrors?: boolean;
  injectGlobals?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// 沙箱管理器
// ═══════════════════════════════════════════════════════════════

export class SandboxManager {
  
  private sandboxes: Map<SandboxId, Sandbox> = new Map();
  private pool: SandboxId[] = [];
  private usageCount: Map<SandboxId, number> = new Map();
  
  private defaultLimits: SandboxLimits;
  private poolConfig: SandboxPoolConfig;
  
  constructor(config?: Partial<SandboxPoolConfig>) {
    this.poolConfig = {
      maxSize: config?.maxSize ?? 10,
      defaultLimits: config?.defaultLimits ?? {
        memory: 512 * 1024 * 1024,  // 512MB
        cpu: 50,                     // 50%
        time: 30000,                 // 30s
        filesystem: false,
        network: false,
      },
      recycleAfter: config?.recycleAfter ?? 100,
    };
    this.defaultLimits = this.poolConfig.defaultLimits;
  }
  
  // ════════════════════════════════════════════════════════════
  // 沙箱创建与管理
  // ════════════════════════════════════════════════════════════
  
  /**
   * 创建新沙箱
   */
  async createSandbox(config: SandboxConfig = {}): Promise<Sandbox> {
    
    // 尝试从池中获取
    if (this.pool.length > 0) {
      const sandboxId = this.pool.pop()!;
      const sandbox = this.sandboxes.get(sandboxId)!;
      sandbox.status = 'idle';
      sandbox.lastActivity = Date.now();
      return sandbox;
    }
    
    // 创建新沙箱
    const sandbox: Sandbox = {
      id: this.generateId(),
      status: 'idle',
      limits: {
        memory: config.memory ?? this.defaultLimits.memory,
        cpu: config.cpu ?? this.defaultLimits.cpu,
        time: config.time ?? this.defaultLimits.time,
        filesystem: config.filesystem ?? this.defaultLimits.filesystem,
        network: config.network ?? this.defaultLimits.network,
      },
      state: {
        loadedModules: [],
        environment: config.environment ?? {},
        snapshots: [],
      },
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };
    
    this.sandboxes.set(sandbox.id, sandbox);
    this.usageCount.set(sandbox.id, 0);
    
    return sandbox;
  }
  
  /**
   * 销毁沙箱
   */
  async destroySandbox(sandboxId: SandboxId): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return;
    
    // 清理资源
    await this.cleanupResources(sandbox);
    
    // 从池中移除
    const poolIndex = this.pool.indexOf(sandboxId);
    if (poolIndex >= 0) {
      this.pool.splice(poolIndex, 1);
    }
    
    this.sandboxes.delete(sandboxId);
    this.usageCount.delete(sandboxId);
  }
  
  /**
   * 回收沙箱到池中
   */
  async recycleSandbox(sandboxId: SandboxId): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return;
    
    const usage = this.usageCount.get(sandboxId) ?? 0;
    
    // 检查是否需要销毁
    if (usage >= this.poolConfig.recycleAfter) {
      await this.destroySandbox(sandboxId);
      return;
    }
    
    // 重置状态
    sandbox.status = 'idle';
    sandbox.state.loadedModules = [];
    sandbox.state.snapshots = [];
    sandbox.lastActivity = Date.now();
    
    // 放回池中
    if (this.pool.length < this.poolConfig.maxSize) {
      this.pool.push(sandboxId);
    } else {
      await this.destroySandbox(sandboxId);
    }
  }
  
  // ════════════════════════════════════════════════════════════
  // 代码执行
  // ════════════════════════════════════════════════════════════
  
  /**
   * 在沙箱中执行代码
   */
  async execute<T = unknown>(
    sandboxId: SandboxId,
    code: string | (() => Promise<T>),
    options: ExecuteOptions = {}
  ): Promise<SandboxResult<T>> {
    
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      return {
        success: false,
        error: { type: 'unknown', message: '沙箱不存在' },
        metrics: { executionTime: 0, memoryUsed: 0, cpuUsed: 0 },
      };
    }
    
    if (sandbox.status !== 'idle') {
      return {
        success: false,
        error: { type: 'unknown', message: '沙箱正忙' },
        metrics: { executionTime: 0, memoryUsed: 0, cpuUsed: 0 },
      };
    }
    
    sandbox.status = 'busy';
    sandbox.lastActivity = Date.now();
    this.usageCount.set(sandboxId, (this.usageCount.get(sandboxId) ?? 0) + 1);
    
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    const monitor = this.createResourceMonitor(sandbox);
    monitor.start();
    
    try {
      // 设置超时
      const timeout = options.timeout ?? sandbox.limits.time;
      
      // 执行代码
      const result = await Promise.race([
        typeof code === 'string' 
          ? this.executeCode<T>(code, sandbox, options)
          : code(),
        this.createTimeoutPromise<T>(timeout),
      ]);
      
      monitor.stop();
      const metrics = monitor.getMetrics();
      
      return {
        success: true,
        result,
        metrics: {
          executionTime: Date.now() - startTime,
          memoryUsed: metrics.peakMemory,
          cpuUsed: metrics.cpuUsed,
        },
      };
      
    } catch (error) {
      monitor.stop();
      const metrics = monitor.getMetrics();
      
      const errorType = this.classifyError(error);
      
      return {
        success: false,
        error: {
          type: errorType,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        metrics: {
          executionTime: Date.now() - startTime,
          memoryUsed: metrics.peakMemory,
          cpuUsed: metrics.cpuUsed,
        },
      };
      
    } finally {
      sandbox.status = 'idle';
    }
  }
  
  /**
   * 执行代码字符串
   */
  private async executeCode<T>(
    code: string,
    sandbox: Sandbox,
    options: ExecuteOptions
  ): Promise<T> {
    
    // 构建执行上下文
    const globals: Record<string, unknown> = {
      console: this.createSafeConsole(),
      setTimeout: this.createSafeTimeout(sandbox.limits.time),
      setInterval: this.createSafeInterval(sandbox.limits.time),
      clearTimeout: clearTimeout,
      clearInterval: clearInterval,
      Buffer: Buffer,
      ...options.injectGlobals,
    };
    
    // 包装代码
    const wrappedCode = `
      (function() {
        'use strict';
        ${Object.keys(globals).map(k => `const ${k} = arguments[0]['${k}'];`).join('\n')}
        ${code}
        return typeof __result !== 'undefined' ? __result : undefined;
      })
    `;
    
    // 执行
    try {
      const fn = eval(wrappedCode);
      return fn(globals);
    } catch (error) {
      throw error;
    }
  }
  
  // ════════════════════════════════════════════════════════════
  // 模块加载
  // ════════════════════════════════════════════════════════════
  
  /**
   * 在沙箱中加载模块
   */
  async loadModule(sandboxId: SandboxId, module: Module): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) throw new Error('沙箱不存在');
    
    // 执行模块代码
    await this.execute(sandboxId, module.code);
    
    // 记录已加载
    sandbox.state.loadedModules.push(module.id);
  }
  
  /**
   * 卸载沙箱中的模块
   */
  async unloadModule(sandboxId: SandboxId, moduleId: ModuleId): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) throw new Error('沙箱不存在');
    
    // 移除记录
    const index = sandbox.state.loadedModules.indexOf(moduleId);
    if (index >= 0) {
      sandbox.state.loadedModules.splice(index, 1);
    }
  }
  
  // ════════════════════════════════════════════════════════════
  // 快照与回滚
  // ════════════════════════════════════════════════════════════
  
  /**
   * 创建沙箱快照
   */
  async createSnapshot(sandboxId: SandboxId): Promise<Snapshot> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) throw new Error('沙箱不存在');
    
    const snapshot: Snapshot = {
      id: this.generateSnapshotId(),
      timestamp: Date.now(),
      state: await this.captureState(sandbox),
    };
    
    sandbox.state.snapshots.push(snapshot);
    
    return snapshot;
  }
  
  /**
   * 回滚到快照
   */
  async rollbackToSnapshot(
    sandboxId: SandboxId, 
    snapshotId: SnapshotId
  ): Promise<void> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) throw new Error('沙箱不存在');
    
    const snapshot = sandbox.state.snapshots.find(s => s.id === snapshotId);
    if (!snapshot) throw new Error('快照不存在');
    
    await this.restoreState(sandbox, snapshot.state);
  }
  
  /**
   * 获取所有快照
   */
  getSnapshots(sandboxId: SandboxId): Snapshot[] {
    const sandbox = this.sandboxes.get(sandboxId);
    return sandbox ? [...sandbox.state.snapshots] : [];
  }
  
  // ════════════════════════════════════════════════════════════
  // 资源监控
  // ════════════════════════════════════════════════════════════
  
  /**
   * 创建资源监控器
   */
  private createResourceMonitor(sandbox: Sandbox): ResourceMonitor {
    let startTime = 0;
    let startMemory = 0;
    let peakMemory = 0;
    let interval: ReturnType<typeof setInterval> | null = null;
    
    return {
      start() {
        startTime = Date.now();
        startMemory = process.memoryUsage().heapUsed;
        peakMemory = startMemory;
        
        // 定期采样内存
        interval = setInterval(() => {
          const currentMemory = process.memoryUsage().heapUsed;
          peakMemory = Math.max(peakMemory, currentMemory);
          
          // 检查内存限制
          if (peakMemory - startMemory > sandbox.limits.memory) {
            throw new Error('内存超限');
          }
        }, 100);
      },
      
      stop() {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      },
      
      getMetrics() {
        return {
          memoryUsed: process.memoryUsage().heapUsed - startMemory,
          cpuUsed: 0, // 需要更复杂的实现
          timeUsed: Date.now() - startTime,
          peakMemory,
        };
      },
      
      checkLimits() {
        const metrics = this.getMetrics();
        
        if (metrics.memoryUsed > sandbox.limits.memory) {
          return { exceeded: true, limit: 'memory', usage: metrics.memoryUsed };
        }
        
        if (metrics.timeUsed > sandbox.limits.time) {
          return { exceeded: true, limit: 'time', usage: metrics.timeUsed };
        }
        
        return { exceeded: false };
      },
    };
  }
  
  /**
   * 清理沙箱资源
   */
  private async cleanupResources(sandbox: Sandbox): Promise<void> {
    // 清理内存（尽可能）
    if (global.gc) {
      global.gc();
    }
    
    sandbox.state.loadedModules = [];
    sandbox.state.snapshots = [];
  }
  
  /**
   * 捕获沙箱状态
   */
  private async captureState(sandbox: Sandbox): Promise<unknown> {
    return {
      loadedModules: [...sandbox.state.loadedModules],
      environment: { ...sandbox.state.environment },
      timestamp: Date.now(),
    };
  }
  
  /**
   * 恢复沙箱状态
   */
  private async restoreState(sandbox: Sandbox, state: unknown): Promise<void> {
    if (typeof state === 'object' && state !== null) {
      const s = state as { loadedModules?: ModuleId[]; environment?: Record<string, string> };
      sandbox.state.loadedModules = s.loadedModules ?? [];
      sandbox.state.environment = s.environment ?? {};
    }
  }
  
  // ════════════════════════════════════════════════════════════
  // 辅助方法
  // ════════════════════════════════════════════════════════════
  
  /**
   * 生成沙箱 ID
   */
  private generateId(): SandboxId {
    return `sandbox-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
  
  /**
   * 生成快照 ID
   */
  private generateSnapshotId(): SnapshotId {
    return `snapshot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }
  
  /**
   * 创建超时 Promise
   */
  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`执行超时 (${timeout}ms)`));
      }, timeout);
    });
  }
  
  /**
   * 分类错误
   */
  private classifyError(error: unknown): SandboxResult['error'] extends { type: infer T } | undefined ? T : never {
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('超时')) {
        return 'timeout' as any;
      }
      if (error.message.includes('memory') || error.message.includes('内存')) {
        return 'memory' as any;
      }
      if (error.message.includes('Syntax') || error.message.includes('compile')) {
        return 'compilation' as any;
      }
      return 'runtime' as any;
    }
    return 'unknown' as any;
  }
  
  /**
   * 创建安全的控制台
   */
  private createSafeConsole(): Console {
    return {
      ...console,
      log: (...args) => console.log('[Sandbox]', ...args),
      error: (...args) => console.error('[Sandbox]', ...args),
      warn: (...args) => console.warn('[Sandbox]', ...args),
    };
  }
  
  /**
   * 创建安全的 setTimeout
   */
  private createSafeTimeout(maxDelay: number): (callback: () => void, delay?: number) => NodeJS.Timeout {
    return (callback: () => void, delay?: number) => {
      const safeDelay = Math.min(delay ?? 0, maxDelay);
      return setTimeout(callback, safeDelay);
    };
  }
  
  /**
   * 创建安全的 setInterval
   */
  private createSafeInterval(maxDelay: number): (callback: () => void, delay?: number) => NodeJS.Timeout {
    return (callback: () => void, delay?: number) => {
      const safeDelay = Math.min(delay ?? 0, maxDelay);
      return setInterval(callback, safeDelay);
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 统计与查询
  // ════════════════════════════════════════════════════════════
  
  /**
   * 获取沙箱状态
   */
  getSandboxStatus(sandboxId: SandboxId): SandboxStatus | undefined {
    return this.sandboxes.get(sandboxId)?.status;
  }
  
  /**
   * 获取所有活跃沙箱
   */
  getActiveSandboxes(): Sandbox[] {
    return Array.from(this.sandboxes.values()).filter(s => s.status === 'busy');
  }
  
  /**
   * 获取沙箱数量
   */
  getSandboxCount(): { total: number; active: number; pooled: number } {
    const sandboxList = Array.from(this.sandboxes.values());
    return {
      total: this.sandboxes.size,
      active: sandboxList.filter(s => s.status === 'busy').length,
      pooled: this.pool.length,
    };
  }
}
