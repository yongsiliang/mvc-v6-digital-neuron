import { NextRequest } from 'next/server';
import { getCognitiveLoop } from '@/lib/neuron-v3/cognitive-loop';
import { HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * ═══════════════════════════════════════════════════════════════════════
 * V4 认知闭环 API
 * 
 * 核心改进：
 * 1. 理解 → 决策 → 生成 → 反思 → 学习 的完整闭环
 * 2. LLM参与反思，而非一次性生成
 * 3. 异常检测和意图修正
 * 4. 可迭代改进
 * ═══════════════════════════════════════════════════════════════════════
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [], userId } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 提取请求头
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    
    // 创建认知闭环处理器
    const cognitiveLoop = getCognitiveLoop(headers);

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (type: string, data: unknown) => {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`
          ));
        };

        try {
          // 发送处理开始信号
          send('status', { stage: 'understanding', message: '正在理解...' });

          // ═══════════════════════════════════════════════════════════
          // 执行认知闭环处理
          // ═══════════════════════════════════════════════════════════
          
          const result = await cognitiveLoop.process(message, {
            history,
            userId
          });

          // 发送理解结果
          send('understanding', {
            rawInput: result.understanding.rawInput,
            correctedInput: result.understanding.correctedInput,
            intent: result.understanding.intent,
            confidence: result.understanding.confidence,
            reasoning: result.understanding.reasoning,
            wasCorrected: result.wasCorrected
          });

          // 流式发送响应
          send('status', { stage: 'generating', message: '正在回复...' });
          
          // 逐字发送响应（模拟流式效果）
          const response = result.response;
          for (let i = 0; i < response.length; i++) {
            send('content', { delta: response[i] });
            // 添加小延迟以产生流式效果
            await new Promise(r => setTimeout(r, 20));
          }

          // 发送反思结果（如果有）
          if (result.reflection) {
            send('reflection', {
              scores: result.reflection.scores,
              issues: result.reflection.issues,
              learningPoints: result.reflection.learningPoints
            });
          }

          // 发送学习摘要
          send('learning', {
            summary: result.learningSummary,
            iterations: result.iterations
          });

          // 发送完成信号
          send('complete', {
            fullResponse: response,
            metadata: {
              wasCorrected: result.wasCorrected,
              iterations: result.iterations,
              understandingConfidence: result.understanding.confidence
            }
          });

          controller.close();

        } catch (error) {
          console.error('Cognitive loop error:', error);
          send('error', { message: '处理过程中发生错误' });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
