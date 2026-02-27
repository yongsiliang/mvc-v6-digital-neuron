/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 核心摘要 API
 * V6 Core Summary API
 * 
 * 管理核心身份信息的持久化
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  saveCoreSummary,
  getLatestCoreSummary,
  addCoreRelationship,
  getCoreRelationships,
  CoreSummaryData,
  CoreRelationshipData,
} from '@/storage/v6-memory-service';

/**
 * GET /api/neuron-v6/db/core
 * 获取核心摘要和关系
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include') || 'all';

    const result: {
      summary?: CoreSummaryData | null;
      relationships?: CoreRelationshipData[];
    } = {};

    if (include === 'all' || include === 'summary') {
      result.summary = await getLatestCoreSummary();
    }

    if (include === 'all' || include === 'relationships') {
      result.relationships = await getCoreRelationships();
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] 获取核心数据失败:', error);
    return NextResponse.json(
      { success: false, error: '获取核心数据失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/neuron-v6/db/core
 * 保存核心摘要或添加关系
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json(
        { success: false, error: '缺少 action 或 data 参数' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'saveSummary': {
        const result = await saveCoreSummary(data as CoreSummaryData);
        return NextResponse.json({
          success: result.success,
          id: result.id,
          message: result.success ? '核心摘要已保存' : '保存失败',
        });
      }

      case 'addRelationship': {
        const result = await addCoreRelationship(data as CoreRelationshipData);
        return NextResponse.json({
          success: result.success,
          id: result.id,
          message: result.success ? '关系已添加' : '添加失败',
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `未知操作: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[API] 保存核心数据失败:', error);
    return NextResponse.json(
      { success: false, error: '保存核心数据失败' },
      { status: 500 }
    );
  }
}
