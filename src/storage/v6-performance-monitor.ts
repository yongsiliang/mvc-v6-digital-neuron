/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 性能监控器
 * V6 Performance Monitor
 * 
 * 提供实时性能监控和指标记录
 * ═══════════════════════════════════════════════════════════════════════
 */

import { recordPerformanceMetric, getPerformanceStats } from './v6-memory-service';

// ═══════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════

export interface PerformanceTimer {
  end: () => number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  metrics: {
    avgResponseTime: number;
    memoryUsage: number;
    errorRate: number;
  };
  recommendations: string[];
}

// ═══════════════════════════════════════════════════════════════════════
// 性能计时器
// ═══════════════════════════════════════════════════════════════════════

let currentSessionId: string | undefined;

/**
 * 设置当前会话ID
 */
export function setSessionId(sessionId: string): void {
  currentSessionId = sessionId;
}

/**
 * 开始计时
 */
export function startTimer(metricName: string): PerformanceTimer {
  const startTime = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - startTime;
      
      // 异步记录（不阻塞主流程）
      recordPerformanceMetric({
        metricType: 'response_time',
        metricName,
        value: duration,
        unit: 'ms',
        sessionId: currentSessionId,
      }).catch(err => console.error('[Performance] 记录失败:', err));
      
      return duration;
    },
  };
}

/**
 * 记录 API 调用
 */
export function recordApiCall(apiName: string, success: boolean): void {
  recordPerformanceMetric({
    metricType: 'api_call',
    metricName: apiName,
    value: success ? 1 : 0,
    unit: 'count',
    metadata: { success },
    sessionId: currentSessionId,
  }).catch(err => console.error('[Performance] 记录失败:', err));
}

/**
 * 记录内存使用
 */
export function recordMemoryUsage(): void {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const mem = process.memoryUsage();
    
    recordPerformanceMetric({
      metricType: 'memory_usage',
      metricName: 'heap_used',
      value: mem.heapUsed / 1024 / 1024,
      unit: 'mb',
      sessionId: currentSessionId,
    }).catch(err => console.error('[Performance] 记录失败:', err));
    
    recordPerformanceMetric({
      metricType: 'memory_usage',
      metricName: 'heap_total',
      value: mem.heapTotal / 1024 / 1024,
      unit: 'mb',
      sessionId: currentSessionId,
    }).catch(err => console.error('[Performance] 记录失败:', err));
  }
}

/**
 * 记录错误
 */
export function recordError(errorType: string, errorMessage: string): void {
  recordPerformanceMetric({
    metricType: 'error',
    metricName: errorType,
    value: 1,
    unit: 'count',
    metadata: { message: errorMessage },
    sessionId: currentSessionId,
  }).catch(err => console.error('[Performance] 记录失败:', err));
}

// ═══════════════════════════════════════════════════════════════════════
// 性能装饰器
// ═══════════════════════════════════════════════════════════════════════

/**
 * 函数性能监控装饰器
 */
export function monitored<T extends (...args: unknown[]) => Promise<unknown>>(
  metricName: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    const timer = startTimer(metricName);
    try {
      const result = await fn(...args);
      timer.end();
      recordApiCall(metricName, true);
      return result;
    } catch (error) {
      timer.end();
      recordApiCall(metricName, false);
      recordError('function_error', `${metricName}: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
  }) as T;
}

// ═══════════════════════════════════════════════════════════════════════
// 系统健康检查
// ═══════════════════════════════════════════════════════════════════════

/**
 * 获取系统健康状态
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  const [responseTimeStats, errorStats] = await Promise.all([
    getPerformanceStats('response_time', { hours: 1 }),
    getPerformanceStats('error', { hours: 1 }),
  ]);
  
  const avgResponseTime = responseTimeStats.avg;
  const errorRate = errorStats.count;
  
  let status: SystemHealth['status'] = 'healthy';
  const recommendations: string[] = [];
  
  // 判断状态
  if (avgResponseTime > 5000 || errorRate > 10) {
    status = 'critical';
    if (avgResponseTime > 5000) {
      recommendations.push('响应时间过长，建议检查 API 调用链路');
    }
    if (errorRate > 10) {
      recommendations.push('错误率过高，建议检查日志排查问题');
    }
  } else if (avgResponseTime > 2000 || errorRate > 5) {
    status = 'degraded';
    if (avgResponseTime > 2000) {
      recommendations.push('响应时间略有延迟，可优化处理逻辑');
    }
    if (errorRate > 5) {
      recommendations.push('存在少量错误，建议关注');
    }
  }
  
  // 记录当前内存使用
  recordMemoryUsage();
  
  // 获取内存统计
  const memoryStats = await getPerformanceStats('memory_usage', { hours: 1 });
  
  return {
    status,
    metrics: {
      avgResponseTime,
      memoryUsage: memoryStats.avg,
      errorRate,
    },
    recommendations,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 定时监控
// ═══════════════════════════════════════════════════════════════════════

let monitorInterval: NodeJS.Timeout | null = null;

/**
 * 启动定时监控
 */
export function startPeriodicMonitoring(intervalMs: number = 60000): void {
  if (monitorInterval) {
    console.log('[Performance] 监控已在运行');
    return;
  }
  
  console.log(`[Performance] 启动定时监控，间隔: ${intervalMs}ms`);
  
  // 立即记录一次
  recordMemoryUsage();
  
  // 定时记录
  monitorInterval = setInterval(() => {
    recordMemoryUsage();
  }, intervalMs);
}

/**
 * 停止定时监控
 */
export function stopPeriodicMonitoring(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log('[Performance] 已停止定时监控');
  }
}
