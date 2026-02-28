/**
 * ═══════════════════════════════════════════════════════════════════════
 * 行动层 - 执行器接口
 * 
 * 将信息结构转化为可执行操作
 * 执行器是感受器的"输出端"
 * ═══════════════════════════════════════════════════════════════════════
 */

import { ActionStructure, ObservationStructure } from '../info-field/structures';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 行动执行结果 */
export interface ActionResult {
  /** 行动 ID */
  actionId: string;
  /** 执行状态 */
  status: 'success' | 'failed' | 'timeout' | 'partial';
  /** 结果内容 */
  content: string;
  /** 错误信息 */
  error?: string;
  /** 提取的结构化数据 */
  extracted?: Map<string, unknown>;
  /** 截图（浏览器操作） */
  screenshot?: string;
  /** 整体任务是否完成 */
  completed: boolean;
  /** 执行器信息 */
  executor?: {
    type: string;
    name: string;
    confidence: number;
    reason: string;
  };
}

/** 执行器能力 */
export interface ExecutorCapabilities {
  /** 支持的行动类型 */
  supportedActions: string[];
  /** 执行器名称 */
  name: string;
  /** 执行器描述 */
  description: string;
}

// ─────────────────────────────────────────────────────────────────────
// 执行器接口
// ─────────────────────────────────────────────────────────────────────

/**
 * 行动执行器接口
 * 
 * 所有执行器必须实现此接口
 */
export interface ActionExecutor {
  /** 执行器类型 */
  readonly type: string;
  
  /** 获取能力描述 */
  getCapabilities(): ExecutorCapabilities;
  
  /** 检查是否支持某行动 */
  canExecute(action: ActionStructure): boolean;
  
  /** 执行行动 */
  execute(action: ActionStructure): Promise<ActionResult>;
  
  /** 初始化执行器 */
  initialize?(): Promise<void>;
  
  /** 清理资源 */
  cleanup?(): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────
// 执行器管理器
// ─────────────────────────────────────────────────────────────────────

/**
 * 执行器管理器
 * 
 * 管理多个执行器，根据行动类型分发
 */
export class ExecutorManager {
  private executors: Map<string, ActionExecutor> = new Map();
  private defaultExecutor: ActionExecutor | null = null;
  
  /**
   * 注册执行器
   */
  register(executor: ActionExecutor, asDefault: boolean = false): void {
    this.executors.set(executor.type, executor);
    if (asDefault) {
      this.defaultExecutor = executor;
    }
  }
  
  /**
   * 获取执行器
   */
  get(type: string): ActionExecutor | undefined {
    return this.executors.get(type);
  }
  
  /**
   * 查找能执行该行动的执行器
   */
  findExecutor(action: ActionStructure): ActionExecutor | undefined {
    // 首先查找专门支持该行动类型的执行器
    for (const executor of this.executors.values()) {
      if (executor.canExecute(action)) {
        return executor;
      }
    }
    
    // 返回默认执行器
    return this.defaultExecutor || undefined;
  }
  
  /**
   * 执行行动
   */
  async execute(action: ActionStructure): Promise<ActionResult> {
    const executor = this.findExecutor(action);
    
    if (!executor) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `No executor found for action type: ${action.action}`,
        completed: false
      };
    }
    
    try {
      const result = await executor.execute(action);
      return result;
    } catch (error) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        completed: false
      };
    }
  }
  
  /**
   * 批量执行行动
   */
  async executeBatch(actions: ActionStructure[]): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    const completed = new Set<string>();
    
    // 按依赖关系排序执行
    const sorted = this.sortByDependencies(actions);
    
    for (const action of sorted) {
      // 检查依赖是否满足
      if (!action.canExecute(completed)) {
        results.push({
          actionId: action.id,
          status: 'failed',
          content: '',
          error: 'Dependencies not satisfied',
          completed: false
        });
        continue;
      }
      
      const result = await this.execute(action);
      results.push(result);
      
      if (result.status === 'success') {
        completed.add(action.id);
      }
    }
    
    return results;
  }
  
  /**
   * 初始化所有执行器
   */
  async initializeAll(): Promise<void> {
    for (const executor of this.executors.values()) {
      if (executor.initialize) {
        await executor.initialize();
      }
    }
  }
  
  /**
   * 清理所有执行器
   */
  async cleanupAll(): Promise<void> {
    for (const executor of this.executors.values()) {
      if (executor.cleanup) {
        await executor.cleanup();
      }
    }
  }
  
  /**
   * 获取所有执行器能力
   */
  getAllCapabilities(): ExecutorCapabilities[] {
    return Array.from(this.executors.values()).map(e => e.getCapabilities());
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 私有方法
  // ───────────────────────────────────────────────────────────────────
  
  private sortByDependencies(actions: ActionStructure[]): ActionStructure[] {
    const sorted: ActionStructure[] = [];
    const remaining = [...actions];
    const completed = new Set<string>();
    
    while (remaining.length > 0) {
      let progress = false;
      
      for (let i = remaining.length - 1; i >= 0; i--) {
        const action = remaining[i];
        if (action.canExecute(completed)) {
          sorted.push(action);
          completed.add(action.id);
          remaining.splice(i, 1);
          progress = true;
        }
      }
      
      // 如果没有进展，可能有循环依赖
      if (!progress) {
        // 把剩余的都加进去
        sorted.push(...remaining);
        break;
      }
    }
    
    return sorted;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 将 ActionResult 转换为 ObservationStructure
 */
export function resultToObservation(result: ActionResult): ObservationStructure {
  return new ObservationStructure(
    `obs-${Date.now()}`,
    result.actionId,
    result.content,
    result.status,
    result.error,
    result.extracted,
    result.screenshot
  );
}
