import { NextRequest, NextResponse } from 'next/server';
import { getSystemInstance } from '@/lib/code-evolution/runtime';
import { HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * POST /api/code-evolution/code
 * 进化指定的代码
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetModule, currentCode, goal } = body;
    
    if (!targetModule || !currentCode || !goal) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const system = getSystemInstance();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    
    const result = await system.evolveCode(customHeaders, targetModule, currentCode, goal);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('代码进化失败:', error);
    return NextResponse.json(
      { success: false, error: '代码进化失败' },
      { status: 500 }
    );
  }
}
