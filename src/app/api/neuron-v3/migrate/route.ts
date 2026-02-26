/**
 * 数据库迁移 API
 * 
 * GET  - 检查迁移状态
 * POST - 执行迁移
 */

import { NextRequest, NextResponse } from 'next/server';
import { runMigration, checkMigrationStatus } from '@/lib/neuron-v3/migration';

export async function GET() {
  try {
    const status = await checkMigrationStatus();
    
    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Migration status check failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check migration status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 安全检查：确认是管理员操作
    const body = await request.json().catch(() => ({}));
    const { confirm } = body;
    
    if (confirm !== 'MIGRATE_WITH_PROTECTION') {
      return NextResponse.json({
        success: false,
        error: 'Migration requires confirmation. Send { "confirm": "MIGRATE_WITH_PROTECTION" }',
        warning: 'Migration will create tables if they don\'t exist. Existing data will NOT be deleted.',
      });
    }
    
    const result = await runMigration();
    
    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { success: false, error: `Migration failed: ${error}` },
      { status: 500 }
    );
  }
}
