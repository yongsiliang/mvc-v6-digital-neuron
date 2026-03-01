/**
 * ═══════════════════════════════════════════════════════════════════════
 * 量子意识系统重置 API
 * 
 * POST /api/quantum/reset
 * 重置量子意识系统状态
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQuantumSystem } from '../process/route';

/**
 * POST /api/quantum/reset
 * 
 * 重置量子意识系统
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const system = getQuantumSystem();
    system.reset();

    return NextResponse.json({
      success: true,
      message: '量子意识系统已重置',
    });
  } catch (error) {
    console.error('[量子意识API] 重置错误:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '重置失败' 
      },
      { status: 500 }
    );
  }
}
