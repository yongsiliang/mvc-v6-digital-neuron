/**
 * 持久化健康检查 API
 * 
 * 功能：
 * - GET: 获取持久化系统健康报告
 */

import { NextResponse } from 'next/server';
import { getPersistenceMonitor } from '@/lib/neuron-v6/memory/unified/persistence-monitor';

export async function GET() {
  try {
    const monitor = getPersistenceMonitor();
    
    // 执行健康检查
    const healthReport = await monitor.performHealthCheck();
    
    return NextResponse.json({
      success: true,
      health: healthReport,
    });
  } catch (error) {
    console.error('[健康检查API] 执行失败:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      health: {
        overall: 'unhealthy',
        timestamp: Date.now(),
        database: {
          status: 'unhealthy',
          latencyMs: null,
          connectionCount: null,
          lastCheckTime: Date.now(),
          errorMessage: error instanceof Error ? error.message : '未知错误',
        },
        s3: {
          status: 'unhealthy',
          latencyMs: null,
          bucketAccessible: false,
          lastCheckTime: Date.now(),
          errorMessage: '无法执行健康检查',
        },
        stats: {
          totalSaves: 0,
          totalLoads: 0,
          dbWrites: 0,
          s3Backups: 0,
          failures: 0,
          avgLatencyMs: 0,
          lastSaveTime: null,
          pendingWrites: 0,
        } as const,
        recommendations: ['系统初始化失败，请检查配置'],
      },
    }, { status: 500 });
  }
}
