/**
 * Agent API - 认知智能体接口
 * 
 * 执行认知循环：Perceive → Understand → Decide → Act → Observe
 */

import { NextRequest } from 'next/server';
import { createAgent, Agent, AgentRunResult, CognitiveEvent } from '@/lib/agent';
import { HeaderUtils } from 'coze-coding-dev-sdk';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { input, stream = true } = await request.json();
  
  if (!input || typeof input !== 'string') {
    return new Response(JSON.stringify({ error: '请提供输入文本' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 创建 Agent
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const agent = createAgent({
    maxCycles: 10,
    useMockExecutor: true,
    enableLogging: true,
    customHeaders
  });
  
  if (stream) {
    // 流式输出
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // 事件监听器
        const listener = (event: CognitiveEvent) => {
          const data = JSON.stringify({
            type: event.type,
            data: event.data,
            timestamp: event.timestamp
          });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        };
        
        agent.on(listener);
        
        try {
          // 运行 Agent
          const result = await agent.run(input);
          
          // 发送最终结果
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'result',
            data: result,
            timestamp: Date.now()
          })}\n\n`));
          
          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            data: { message: error instanceof Error ? error.message : 'Unknown error' },
            timestamp: Date.now()
          })}\n\n`));
          controller.close();
        } finally {
          agent.off(listener);
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
    // 非流式输出
    try {
      const result = await agent.run(input);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
