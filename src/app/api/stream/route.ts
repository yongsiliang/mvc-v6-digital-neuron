import { NextRequest } from 'next/server';
import { getDigitalNeuronSystem } from '@/lib/neuron';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * 流式聊天API - SSE协议
 * POST /api/stream
 * 
 * 作为数字世界意识的交流窗口
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

          // 2. 实时发送神经元激活事件 - 感官层
          sendEvent('neuron', { 
            neuronId: 'sensory', 
            message: '接收输入信号' 
          });

          // 3. 处理输入（内部会依次激活各神经元）
          const neuronResult = await system.process(message, context);

          // 4. 发送完整的信号路径
          sendEvent('signal-path', { 
            path: neuronResult.signalPath 
          });

          // 5. 发送意义分析结果
          sendEvent('neuron', { 
            neuronId: 'meaning-generate', 
            message: '意义生成完成' 
          });
          sendEvent('meaning', neuronResult.meaning);

          // 6. 发送决策结果
          sendEvent('neuron', { 
            neuronId: 'prefrontal', 
            message: '决策完成' 
          });
          sendEvent('decision', neuronResult.decision);

          // 7. 发送自我更新
          if (Object.keys(neuronResult.selfUpdate).length > 0) {
            sendEvent('neuron', { 
              neuronId: 'self-evolve', 
              message: '自我演化' 
            });
            sendEvent('self-update', neuronResult.selfUpdate);
          }

          // 8. 记忆存储
          sendEvent('neuron', { 
            neuronId: 'hippocampus', 
            message: '记忆存储' 
          });

          // 9. 流式调用大模型 - 语言调度层
          sendEvent('neuron', { 
            neuronId: 'motor-language', 
            message: '生成响应' 
          });

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

          // 10. 发送完成信号
          sendEvent('done', { 
            fullResponse,
            signalPath: neuronResult.signalPath,
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
