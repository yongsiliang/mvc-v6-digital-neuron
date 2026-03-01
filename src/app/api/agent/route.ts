/**
 * ═══════════════════════════════════════════════════════════════════════
 * Agent API 端点
 * Agent API Endpoint
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMClient } from 'coze-coding-dev-sdk';
import { 
  createAgentExecutor, 
  toolRegistry,
  type AgentStep
} from '@/lib/agent/executor';

// 流式响应编码器
const encoder = new TextEncoder();

/**
 * POST /api/agent
 * 执行Agent任务
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, stream = false } = body;

    if (!input) {
      return NextResponse.json(
        { error: '缺少输入参数' },
        { status: 400 }
      );
    }

    // 初始化LLM客户端
    const llmClient = new LLMClient();

    if (stream) {
      // 流式响应
      const stream = new ReadableStream({
        async start(controller) {
          const agent = createAgentExecutor({
            llmClient,
            onStep: (step: AgentStep) => {
              const data = JSON.stringify({ type: 'step', step });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          });

          try {
            const result = await agent.execute(input);
            const finalData = JSON.stringify({ type: 'complete', result });
            controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
          } catch (error) {
            const errorData = JSON.stringify({ 
              type: 'error', 
              error: error instanceof Error ? error.message : '执行失败' 
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } else {
      // 非流式响应
      const agent = createAgentExecutor({ llmClient });
      const result = await agent.execute(input);

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('[Agent API] 执行失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '执行失败' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent
 * 获取可用工具列表
 */
export async function GET() {
  const tools = toolRegistry.getAllTools();
  const categories = toolRegistry.getToolsByCategory();

  return NextResponse.json({
    tools,
    categories,
    count: tools.length
  });
}
