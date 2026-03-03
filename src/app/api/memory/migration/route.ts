/**
 * 统一记忆系统 - 数据库迁移 API
 * 
 * 功能：
 * - 执行数据库迁移创建统一记忆表
 * - 回滚迁移
 * - 检查迁移状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { runMigration, rollbackMigration } from '@/lib/neuron-v6/memory/unified';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action = 'migrate' } = body;

    if (action === 'migrate') {
      const result = await runMigration();
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: '迁移执行成功',
          details: result.message,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || '迁移执行失败',
        }, { status: 500 });
      }
    } else if (action === 'rollback') {
      const result = await rollbackMigration();
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: '回滚执行成功',
          details: result.message,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || '回滚执行失败',
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: '无效的操作类型，支持: migrate, rollback',
      }, { status: 400 });
    }
  } catch (error) {
    console.error('[迁移API] 执行失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 检查迁移状态 - 查询表是否存在
    const { db } = await import('@/storage/index');
    const { sql } = await import('drizzle-orm');
    
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('v6_unified_memories', 'v6_memory_associations', 'v6_memory_triggers')
      ORDER BY table_name
    `);
    
    const existingTables = result.rows.map((row: Record<string, unknown>) => row.table_name as string);
    
    const expectedTables = ['v6_memory_associations', 'v6_memory_triggers', 'v6_unified_memories'];
    const allTablesExist = expectedTables.every(t => existingTables.includes(t));
    
    return NextResponse.json({
      success: true,
      migrated: allTablesExist,
      existingTables,
      expectedTables,
      message: allTablesExist 
        ? '统一记忆系统表已创建' 
        : '需要执行迁移创建统一记忆系统表',
    });
  } catch (error) {
    console.error('[迁移API] 状态检查失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '状态检查失败',
    }, { status: 500 });
  }
}
