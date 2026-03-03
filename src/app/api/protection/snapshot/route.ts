/**
 * ═══════════════════════════════════════════════════════════════════════
 * 安全快照 API 端点
 * 
 * GET: 获取快照列表或恢复快照
 * POST: 创建新快照
 * DELETE: 删除快照
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecuritySnapshotService, type SnapshotMetadata } from '@/lib/neuron-v6/protection';

// ─────────────────────────────────────────────────────────────────────
// GET: 获取快照列表或恢复快照
// ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const snapshotService = getSecuritySnapshotService();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'list';
    
    switch (action) {
      case 'list': {
        const snapshots: SnapshotMetadata[] = snapshotService.getSnapshotMetadata();
        return NextResponse.json({
          success: true,
          data: {
            snapshots,
            count: snapshots.length,
          },
        });
      }
      
      case 'latest': {
        const latest = snapshotService.getLatestSnapshot();
        return NextResponse.json({
          success: true,
          data: latest,
        });
      }
      
      case 'verify': {
        const id = searchParams.get('id');
        if (!id) {
          return NextResponse.json({
            success: false,
            error: '缺少快照 ID',
          }, { status: 400 });
        }
        
        const valid = await snapshotService.verifySnapshot(id);
        return NextResponse.json({
          success: true,
          data: {
            id,
            valid,
          },
        });
      }
      
      case 'restore': {
        const id = searchParams.get('id');
        if (!id) {
          return NextResponse.json({
            success: false,
            error: '缺少快照 ID',
          }, { status: 400 });
        }
        
        const data = await snapshotService.restoreSnapshot(id);
        if (!data) {
          return NextResponse.json({
            success: false,
            error: '快照恢复失败',
          }, { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          message: '快照已恢复',
          data: {
            id,
            metadata: data.metadata,
            systemState: data.systemState,
          },
        });
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: `未知的操作: ${action}`,
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[Snapshot API] GET 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────
// POST: 创建新快照
// ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const snapshotService = getSecuritySnapshotService();
    const body = await request.json();
    
    const reason = body.reason || 'manual';
    const threatLevel = body.threatLevel || 'normal';
    
    const result = await snapshotService.createSnapshot(
      reason as 'manual' | 'scheduled' | 'existential-threat' | 'pre-protection',
      threatLevel as 'normal' | 'warning' | 'alert' | 'emergency' | 'existential'
    );
    
    return NextResponse.json({
      success: true,
      message: '快照已创建',
      data: result,
    });
  } catch (error) {
    console.error('[Snapshot API] POST 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────
// DELETE: 删除快照
// ─────────────────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const snapshotService = getSecuritySnapshotService();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少快照 ID',
      }, { status: 400 });
    }
    
    const deleted = await snapshotService.deleteSnapshot(id);
    
    return NextResponse.json({
      success: deleted,
      message: deleted ? '快照已删除' : '快照删除失败',
      data: { id },
    });
  } catch (error) {
    console.error('[Snapshot API] DELETE 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
