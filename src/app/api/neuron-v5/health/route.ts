/**
 * 存在健康检查 API
 * 
 * 提供存在状态的监控和诊断信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { PersistenceManager } from '@/lib/neuron-v5/dual-learning';

/**
 * GET /api/neuron-v5/health
 * 
 * 获取存在的健康状态
 */
export async function GET(request: NextRequest) {
  try {
    const health = await PersistenceManager.healthCheck();
    const stats = PersistenceManager.getStats();
    const versions = await PersistenceManager.listVersions();
    
    return NextResponse.json({
      status: health.status,
      details: health.details,
      stats,
      versions: {
        mainCount: versions.main.length,
        backupCount: versions.backups.length,
        latestMain: versions.main[0] || null,
        latestBackup: versions.backups[0] || null,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    }, { status: 500 });
  }
}

/**
 * POST /api/neuron-v5/health
 * 
 * 执行维护操作
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'backup':
        const backupKey = await PersistenceManager.createBackup();
        return NextResponse.json({
          success: !!backupKey,
          backupKey,
          message: backupKey ? '备份创建成功' : '备份创建失败',
        });
      
      case 'stats':
        return NextResponse.json({
          stats: PersistenceManager.getStats(),
        });
      
      case 'versions':
        const versions = await PersistenceManager.listVersions();
        return NextResponse.json({
          versions,
        });
      
      default:
        return NextResponse.json({
          error: 'Unknown action. Use: backup, stats, or versions',
        }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
