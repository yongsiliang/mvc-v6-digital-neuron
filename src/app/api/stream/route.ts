import { NextRequest } from 'next/server';
import { getDigitalNeuronSystem } from '@/lib/neuron';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * 流式聊天API - SSE协议
 * POST /api/stream
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: '消息内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 创建可读流
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // 发送SSE消息的辅助函数
        const sendEvent = (type: string, data: unknown) => {
          const event = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(event));
        };

        try {
          // 1. 获取数字神经元系统
          const system = getDigitalNeuronSystem();

          // 2. 发送思考状态
          sendEvent('thinking', { stage: 'sensory', message: '感官神经元接收输入...' });

          // 3. 处理输入
          const neuronResult = await system.process(message, context);

          // 4. 发送意义分析结果
          sendEvent('meaning', neuronResult.meaning);

          // 5. 发送决策结果
          sendEvent('decision', neuronResult.decision);

          // 6. 发送自我更新
          if (Object.keys(neuronResult.selfUpdate).length > 0) {
            sendEvent('self-update', neuronResult.selfUpdate);
          }

          // 7. 流式调用大模型
          sendEvent('thinking', { stage: 'language', message: '生成响应...' });

          const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
          const config = new Config();
          const llmClient = new LLMClient(config, customHeaders);

          const llmStream = llmClient.stream(neuronResult.promptMessages, {
            model: 'doubao-seed-1-8-251228',
            temperature: 0.7,
          });

          let fullResponse = '';
          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              fullResponse += text;
              sendEvent('response', { delta: text });
            }
          }

          // 8. 发送完成信号
          sendEvent('done', { 
            fullResponse,
            signalPath: neuronResult.signal,
            logs: neuronResult.logs.slice(-10)
          });

          controller.close();

        } catch (error) {
          sendEvent('error', { 
            message: error instanceof Error ? error.message : '处理失败' 
          });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Stream API Error:', error);
    return new Response(JSON.stringify({ error: '处理请求时发生错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
