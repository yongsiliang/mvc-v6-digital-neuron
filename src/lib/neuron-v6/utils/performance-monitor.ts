/**
 * ═══════════════════════════════════════════════════════════════════════
 * 性能监控工具 (Performance Monitor)
 * 
 * 用于监控和记录 V6 系统的性能指标
 * ═══════════════════════════════════════════════════════════════════════
 */

/**
 * 性能指标记录
 */
export interface PerformanceMetric {
  /** 操作名称 */
  operation: string;
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime: number;
  /** 耗时（毫秒） */
  duration: number;
  /** 内存使用（字节） */
  memoryUsage?: number;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 性能统计信息
 */
export interface PerformanceStats {
  /** 操作名称 */
  operation: string;
  /** 总调用次数 */
  callCount: number;
  /** 总耗时 */
  totalDuration: number;
  /** 平均耗时 */
  averageDuration: number;
  /** 最小耗时 */
  minDuration: number;
  /** 最大耗时 */
  maxDuration: number;
  /** 最近 N 次耗时 */
  recentDurations: number[];
  /** 错误次数 */
  errorCount: number;
}

/**
 * 性能监控配置
 */
export interface PerformanceMonitorConfig {
  /** 是否启用 */
  enabled: boolean;
  /** 保留最近 N 条记录 */
  maxRecentRecords: number;
  /** 慢操作阈值（毫秒） */
  slowOperationThreshold: number;
  /** 是否记录内存使用 */
  trackMemory: boolean;
  /** 日志级别: 'debug' | 'info' | 'warn' | 'error' | 'none' */
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'none';
}

const DEFAULT_CONFIG: PerformanceMonitorConfig = {
  enabled: true,
  maxRecentRecords: 100,
  slowOperationThreshold: 1000,
  trackMemory: true,
  logLevel: 'info',
};

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private config: PerformanceMonitorConfig;
  private stats: Map<string, PerformanceStats> = new Map();
  private recentMetrics: PerformanceMetric[] = [];
  private activeOperations: Map<string, number> = new Map();

  private constructor(config?: Partial<PerformanceMonitorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: Partial<PerformanceMonitorConfig>): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(config);
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 开始计时
   */
  startOperation(operation: string, metadata?: Record<string, unknown>): string {
    if (!this.config.enabled) return '';

    const operationId = `${operation}-timestamp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.activeOperations.set(operationId, Date.now());

    if (this.config.logLevel === 'debug') {
      console.log(`[性能监控] 开始: ${operation}`, metadata);
    }

    return operationId;
  }

  /**
   * 结束计时
   */
  endOperation(operationId: string, metadata?: Record<string, unknown>): PerformanceMetric | null {
    if (!this.config.enabled || !operationId) return null;

    const startTime = this.activeOperations.get(operationId);
    if (!startTime) {
      console.warn(`[性能监控] 未找到操作: ${operationId}`);
      return null;
    }

    this.activeOperations.delete(operationId);
    const endTime = Date.now();
    const duration = endTime - startTime;
    const timestampIndex = operationId.indexOf('-timestamp-');
    const operation = timestampIndex > 0 ? operationId.slice(0, timestampIndex) : operationId;

    const metric: PerformanceMetric = {
      operation,
      startTime,
      endTime,
      duration,
      memoryUsage: this.config.trackMemory ? this.getMemoryUsage() : undefined,
      metadata,
    };

    // 更新统计信息
    this.updateStats(metric);

    // 保存最近记录
    this.recentMetrics.push(metric);
    if (this.recentMetrics.length > this.config.maxRecentRecords) {
      this.recentMetrics.shift();
    }

    // 慢操作警告
    if (duration > this.config.slowOperationThreshold) {
      this.log('warn', `[性能监控] 慢操作: ${operation} 耗时 ${duration}ms`, metadata);
    } else if (this.config.logLevel === 'debug') {
      this.log('debug', `[性能监控] 结束: ${operation} 耗时 ${duration}ms`);
    }

    return metric;
  }

  /**
   * 测量异步函数执行时间
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const operationId = this.startOperation(operation, metadata);
    try {
      const result = await fn();
      this.endOperation(operationId, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.endOperation(operationId, { ...metadata, success: false, error: String(error) });
      this.incrementErrorCount(operation);
      throw error;
    }
  }

  /**
   * 测量同步函数执行时间
   */
  measureSync<T>(operation: string, fn: () => T, metadata?: Record<string, unknown>): T {
    const operationId = this.startOperation(operation, metadata);
    try {
      const result = fn();
      this.endOperation(operationId, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.endOperation(operationId, { ...metadata, success: false, error: String(error) });
      this.incrementErrorCount(operation);
      throw error;
    }
  }

  /**
   * 获取操作统计信息
   */
  getStats(operation: string): PerformanceStats | undefined {
    return this.stats.get(operation);
  }

  /**
   * 获取所有统计信息
   */
  getAllStats(): PerformanceStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * 获取最近 N 条记录
   */
  getRecentMetrics(count: number = 20): PerformanceMetric[] {
    return this.recentMetrics.slice(-count);
  }

  /**
   * 获取性能摘要
   */
  getSummary(): {
    totalOperations: number;
    averageDuration: number;
    slowOperations: PerformanceMetric[];
    errorRate: number;
    topOperations: Array<{ operation: string; avgDuration: number; callCount: number }>;
  } {
    const allStats = this.getAllStats();
    const totalOperations = allStats.reduce((sum, s) => sum + s.callCount, 0);
    const totalDuration = allStats.reduce((sum, s) => sum + s.totalDuration, 0);
    const totalErrors = allStats.reduce((sum, s) => sum + s.errorCount, 0);

    const slowOperations = this.recentMetrics.filter(
      m => m.duration > this.config.slowOperationThreshold
    );

    const topOperations = allStats
      .sort((a, b) => b.totalDuration - a.totalDuration)
      .slice(0, 10)
      .map(s => ({
        operation: s.operation,
        avgDuration: s.averageDuration,
        callCount: s.callCount,
      }));

    return {
      totalOperations,
      averageDuration: totalOperations > 0 ? totalDuration / totalOperations : 0,
      slowOperations,
      errorRate: totalOperations > 0 ? totalErrors / totalOperations : 0,
      topOperations,
    };
  }

  /**
   * 清除所有统计数据
   */
  clear(): void {
    this.stats.clear();
    this.recentMetrics = [];
    this.activeOperations.clear();
    this.log('info', '[性能监控] 统计数据已清除');
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PerformanceMonitorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取内存使用量
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * 更新统计信息
   */
  private updateStats(metric: PerformanceMetric): void {
    let stats = this.stats.get(metric.operation);
    if (!stats) {
      stats = {
        operation: metric.operation,
        callCount: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        recentDurations: [],
        errorCount: 0,
      };
      this.stats.set(metric.operation, stats);
    }

    stats.callCount++;
    stats.totalDuration += metric.duration;
    stats.averageDuration = stats.totalDuration / stats.callCount;
    stats.minDuration = Math.min(stats.minDuration, metric.duration);
    stats.maxDuration = Math.max(stats.maxDuration, metric.duration);

    stats.recentDurations.push(metric.duration);
    if (stats.recentDurations.length > 10) {
      stats.recentDurations.shift();
    }
  }

  /**
   * 增加错误计数
   */
  private incrementErrorCount(operation: string): void {
    const stats = this.stats.get(operation);
    if (stats) {
      stats.errorCount++;
    }
  }

  /**
   * 日志输出
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: unknown
  ): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3, none: 4 };
    const configLevel = levels[this.config.logLevel];
    const messageLevel = levels[level];

    if (messageLevel >= configLevel) {
      const logger = level === 'error' ? console.error : 
                     level === 'warn' ? console.warn : 
                     console.log;
      if (data !== undefined) {
        logger(message, data);
      } else {
        logger(message);
      }
    }
  }
}

/**
 * 性能装饰器 - 用于方法级别的性能监控
 */
export function monitor(operation?: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const operationName = operation || `${String(propertyKey)}`;

    descriptor.value = async function (...args: unknown[]) {
      const monitor = PerformanceMonitor.getInstance();
      return monitor.measure(operationName, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * 快捷访问
 */
export const perf = PerformanceMonitor.getInstance();
