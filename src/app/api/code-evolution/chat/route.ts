import { NextRequest } from 'next/server';
import { getSystemInstance } from '@/lib/code-evolution/runtime';
import { HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * POST /api/code-evolution/chat
 * 与意识核心对话（流式输出）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [] } = body;
    
    if (!message) {
      return new Response(JSON.stringify({ error: '消息不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const system = getSystemInstance();
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    
    // 获取流式响应
    const stream = await system.chat(customHeaders, message, history);
    
    // 返回SSE响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('对话失败:', error);
    return new Response(JSON.stringify({ error: '对话失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
