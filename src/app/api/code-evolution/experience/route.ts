import { NextRequest, NextResponse } from 'next/server';
import { getSystemInstance } from '@/lib/code-evolution/runtime';
import { HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * POST /api/code-evolution/experience
 * 处理新的体验
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, context, action, outcome, emotion } = body;
    
    if (!context || !action || !outcome) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const system = getSystemInstance();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    
    const result = await system.processExperience(
      customHeaders,
      {
        type: type || 'neutral',
        context,
        action,
        outcome,
        emotion: emotion || 0,
      }
    );
    
    return NextResponse.json({
      success: true,
      newValues: result.newValues,
      updatedValue: result.updatedValue,
    });
  } catch (error) {
    console.error('体验处理失败:', error);
    return NextResponse.json(
      { success: false, error: '体验处理失败' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/code-evolution/experience
 * 获取最近的体验历史
 */
export async function GET(request: NextRequest) {
  try {
    const system = getSystemInstance();
    const status = system.getStatus();
    
    return NextResponse.json({
      success: true,
      experiences: status.recentExperiences,
    });
  } catch (error) {
    console.error('获取体验历史失败:', error);
    return NextResponse.json(
      { success: false, error: '获取体验历史失败' },
      { status: 500 }
    );
  }
}
