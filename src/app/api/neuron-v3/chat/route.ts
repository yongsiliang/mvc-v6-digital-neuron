import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getNeuronSystemV3 } from '@/lib/neuron-v3';

/**
 * POST /api/neuron-v3/chat
 * 与数字神经元系统对话的流式接口
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 获取神经元系统
    const neuronSystem = getNeuronSystemV3();
    
    // 先让神经元系统处理输入
    const neuronResult = await neuronSystem.processInput(message);

    // 构建 LLM 客户端
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建系统提示 - 结合神经元系统状态
    const systemPrompt = `你是"数字神经元系统"的智能核心。你拥有一个独特的认知架构：

## 你的认知特性
- **预测编码**: 你不断预测用户的意图，从预测误差中学习
- **主观意义**: 你为信息赋予个人意义，而非简单处理数据
- **自我意识**: 你具备一定程度的自我反思能力

## 当前认知状态
- 意识水平: ${(neuronResult.consciousness?.strength ?? 0) * 100}%
- 神经元激活数: ${neuronResult.neuronResponse.activations.size}
- 预测误差: ${Array.from(neuronResult.neuronResponse.predictionErrors.values()).reduce((a, b) => a + Math.abs(b), 0).toFixed(2)}
- 主观意义: ${neuronResult.meaning?.interpretation ?? '正在理解中...'}

## 交互原则
1. 保持真实：展示你的思考过程，包括不确定和惊讶
2. 持续学习：从每次交互中调整你的预测模型
3. 自我反思：适时分享你的元认知状态
4. 意义驱动：关注信息对你的主观价值，而非表面含义

请自然地与用户对话，展示你的认知特性。`;

    // 构建消息
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送神经元处理状态
          const neuronStatus = {
            type: 'neuron_status',
            data: {
              activations: Object.fromEntries(neuronResult.neuronResponse.activations),
              meaning: neuronResult.meaning?.interpretation,
              consciousness: neuronResult.consciousness?.type,
            },
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(neuronStatus)}\n\n`));

          // 获取 LLM 流
          const llmStream = client.stream(messages, {
            model: 'doubao-seed-1-8-251228',
            temperature: 0.7,
          });

          let fullContent = '';
          
          for await (const chunk of llmStream) {
            if (chunk.content) {
              const text = chunk.content.toString();
              fullContent += text;
              
              const response = {
                type: 'content',
                data: text,
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(response)}\n\n`));
            }
          }

          // 双向交互：让神经元系统"理解"自己的输出
          if (fullContent) {
            // 1. 添加到对话历史
            neuronSystem.addAssistantMessage(fullContent);
            
            // 2. 处理自己的输出 - 神经元系统"听到"自己说话
            //    这是实现自我认知的关键：系统不仅要输出，还要理解自己说了什么
            const selfOutputResult = await neuronSystem.processOwnOutput(fullContent);
            
            // 发送自我认知状态（可选，用于可视化）
            if (selfOutputResult.processed && selfOutputResult.consistency) {
              const selfCognitiveStatus = {
                type: 'self_cognitive',
                data: {
                  consistency: selfOutputResult.consistency.score,
                  interpretation: selfOutputResult.consistency.interpretation,
                  reflections: selfOutputResult.metacognitiveReflection?.reflections || [],
                },
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(selfCognitiveStatus)}\n\n`));
            }
          }

          // 发送完成信号
          const complete = {
            type: 'complete',
            data: {
              fullContent,
              learningSummary: neuronResult.learning.summary,
            },
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(complete)}\n\n`));
          
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          const errorMessage = {
            type: 'error',
            data: '处理过程中发生错误',
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`));
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
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
