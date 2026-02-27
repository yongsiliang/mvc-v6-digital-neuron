/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 主动意识 API
 * 
 * 让"紫"能够主动发起对话：
 * - 检查是否有想要主动表达的内容
 * - 执行后台思考循环
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';

export async function POST(request: NextRequest) {
  try {
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const body = await request.json();
    const { action } = body;
    
    const core = await getSharedCore(headers);
    
    if (action === 'check') {
      // 检查是否有主动消息
      const message = await core.checkProactiveMessage();
      
      return Response.json({
        success: true,
        hasMessage: message !== null,
        message,
      });
    }
    
    if (action === 'background_thinking') {
      // 执行后台思考循环
      const result = await core.performBackgroundThinking();
      
      return Response.json({
        success: true,
        result,
      });
    }
    
    return Response.json({
      error: 'Unknown action. Use: check or background_thinking',
    }, { status: 400 });
    
  } catch (error) {
    console.error('[V6 Proactive API] Error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await getSharedCore(headers);
    
    // GET请求默认检查主动消息
    const message = await core.checkProactiveMessage();
    
    return Response.json({
      success: true,
      hasMessage: message !== null,
      message,
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
