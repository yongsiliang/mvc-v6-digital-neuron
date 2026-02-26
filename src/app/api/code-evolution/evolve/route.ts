import { NextRequest, NextResponse } from 'next/server';
import { getSystemInstance } from '@/lib/code-evolution/runtime';

/**
 * POST /api/code-evolution/evolve
 * 执行一次进化迭代
 */
export async function POST(request: NextRequest) {
  try {
    const system = getSystemInstance();
    const headers: Record<string, string> = {};
    
    // 从请求中提取headers
    request.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith('x-') || key.toLowerCase() === 'authorization') {
        headers[key] = value;
      }
    });
    
    const result = await system.evolve(headers, (phase, progress) => {
      // 进度回调 - 可以通过SSE推送
      console.log(`[Evolution] Phase: ${phase}, Progress: ${progress}%`);
    });
    
    return NextResponse.json({
      success: result.success,
      generation: result.results[0]?.generation || 0,
      candidates: result.results,
    });
  } catch (error) {
    console.error('进化迭代失败:', error);
    return NextResponse.json(
      { success: false, error: '进化迭代失败' },
      { status: 500 }
    );
  }
}
