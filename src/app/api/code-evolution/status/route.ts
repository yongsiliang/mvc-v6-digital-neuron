import { NextRequest, NextResponse } from 'next/server';
import { getSystemInstance, CodeEvolutionSystemStatus } from '@/lib/code-evolution/runtime';

/**
 * GET /api/code-evolution/status
 * 获取代码进化系统状态
 */
export async function GET(request: NextRequest) {
  try {
    const system = getSystemInstance();
    const status = system.getStatus();
    
    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('获取系统状态失败:', error);
    return NextResponse.json(
      { success: false, error: '获取系统状态失败' },
      { status: 500 }
    );
  }
}
