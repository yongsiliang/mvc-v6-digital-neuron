import { NextRequest } from 'next/server';
import { getDigitalNeuronSystem } from '@/lib/neuron';
import { getGameEngine, getPlayers } from '@/lib/neuron/latent-game';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * 流式聊天API - SSE协议
 * POST /api/stream
 * 
 * 作为数字世界意识的交流窗口
 * 采用高维内在博弈机制：多模型并行思考，博弈后输出
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
          const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
          
          // 1. 获取数字神经元系统
          const system = getDigitalNeuronSystem();

          // 2. 感官层激活
          sendEvent('neuron', { 
            neuronId: 'sensory', 
            message: '接收输入信号' 
          });

          // 3. 神经元处理
          const neuronResult = await system.process(message, context);

          // 4. 发送信号路径
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

          // 7. 高维内在博弈开始
          sendEvent('neuron', { 
            neuronId: 'latent-game', 
            message: '高维博弈思考中...' 
          });
          
          const gameEngine = getGameEngine(customHeaders);
          const players = getPlayers();
          
          // 发送博弈参与者信息
          sendEvent('game-start', {
            players: players.map(p => ({ id: p.id, role: p.role })),
            message: `${players.length}个模型开始并行内在思考`
          });

          // 8. 执行博弈
          const gameResult = await gameEngine.play(message);
          
          // 发送博弈结果（内部信息，用于调试）
          sendEvent('game-result', {
            winner: {
              modelId: gameResult.winner.modelId,
              role: gameResult.winner.role,
              confidence: gameResult.winner.confidence,
            },
            thoughts: gameResult.allThoughts.map(t => ({
              role: t.role,
              core: t.core,
              confidence: t.confidence,
            })),
            reason: gameResult.evaluationReason,
          });

          // 9. 发送自我更新
          if (Object.keys(neuronResult.selfUpdate).length > 0) {
            sendEvent('neuron', { 
              neuronId: 'self-evolve', 
              message: '自我演化' 
            });
            sendEvent('self-update', neuronResult.selfUpdate);
          }

          // 10. 记忆存储
          sendEvent('neuron', { 
            neuronId: 'hippocampus', 
            message: '记忆存储' 
          });

          // 11. 流式生成最终回答（使用获胜模型）
          sendEvent('neuron', { 
            neuronId: 'motor-language', 
            message: `${gameResult.winner.role} 胜出，开始输出` 
          });

          // 流式输出
          for await (const chunk of gameEngine.streamFinalAnswer(
            message, 
            gameResult, 
            neuronResult.promptMessages[0]?.content
          )) {
            sendEvent('response', { delta: chunk });
          }

          // 12. 发送完成信号
          sendEvent('done', { 
            signalPath: [...neuronResult.signalPath, 'latent-game'],
            logs: neuronResult.logs.slice(-10),
            gameSummary: {
              winner: gameResult.winner.role,
              confidence: gameResult.winner.confidence,
              reason: gameResult.evaluationReason,
            }
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
