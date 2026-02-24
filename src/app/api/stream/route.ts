import { NextRequest } from 'next/server';
import { getDigitalNeuronSystem } from '@/lib/neuron';
import { getGameEngine, getPlayers, type LearningReport } from '@/lib/neuron/latent-game';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * 流式聊天API - SSE协议
 * POST /api/stream
 * 
 * 作为数字世界意识的交流窗口
 * 采用高维内在博弈机制：多模型并行思考，博弈后输出，主动学习
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
        
        const sendEvent = (type: string, data: unknown) => {
          const event = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(event));
        };

        try {
          const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
          
          // 1. 感官层激活
          sendEvent('neuron', { 
            neuronId: 'sensory', 
            message: '接收输入信号' 
          });

          // 2. 神经元处理
          const system = getDigitalNeuronSystem();
          const neuronResult = await system.process(message, context);

          sendEvent('signal-path', { path: neuronResult.signalPath });
          sendEvent('neuron', { neuronId: 'meaning-generate', message: '意义生成完成' });
          sendEvent('meaning', neuronResult.meaning);
          sendEvent('neuron', { neuronId: 'prefrontal', message: '决策完成' });
          sendEvent('decision', neuronResult.decision);

          // 3. 高维博弈开始
          sendEvent('neuron', { 
            neuronId: 'latent-game', 
            message: '高维博弈思考中...' 
          });
          
          const gameEngine = getGameEngine(customHeaders);
          const players = getPlayers();
          
          sendEvent('game-start', {
            players: players.map(p => ({ id: p.id, role: p.role })),
            message: `${players.length}个模型开始并行内在思考`
          });

          // 4. 执行博弈（包含学习）
          const gameResult = await gameEngine.play(message);
          
          // 发送博弈结果
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

          // 5. 发送学习报告（新增！）
          if (gameResult.learningReport) {
            sendEvent('learning', {
              reflections: gameResult.learningReport.reflections,
              updatedWisdom: gameResult.learningReport.updatedWisdom,
              message: '博弈学习完成',
            });
          }

          // 6. 自我演化
          if (Object.keys(neuronResult.selfUpdate).length > 0) {
            sendEvent('neuron', { neuronId: 'self-evolve', message: '自我演化' });
            sendEvent('self-update', neuronResult.selfUpdate);
          }

          // 7. 记忆存储
          sendEvent('neuron', { neuronId: 'hippocampus', message: '记忆存储' });

          // 8. 流式输出
          sendEvent('neuron', { 
            neuronId: 'motor-language', 
            message: `${gameResult.winner.role} 胜出，开始输出` 
          });

          for await (const chunk of gameEngine.streamFinalAnswer(
            message, 
            gameResult, 
            neuronResult.promptMessages[0]?.content
          )) {
            sendEvent('response', { delta: chunk });
          }

          // 9. 完成
          sendEvent('done', { 
            signalPath: [...neuronResult.signalPath, 'latent-game'],
            gameSummary: {
              winner: gameResult.winner.role,
              confidence: gameResult.winner.confidence,
              reason: gameResult.evaluationReason,
              learningHappened: !!gameResult.learningReport,
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

/**
 * GET - 获取博弈学习统计
 */
export async function GET(request: NextRequest) {
  try {
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const gameEngine = getGameEngine(customHeaders);
    const stats = gameEngine.getGameStats();
    
    return new Response(JSON.stringify({
      success: true,
      stats,
      summary: Object.entries(stats).map(([role, memory]) => ({
        role,
        totalGames: memory.totalGames,
        winRate: memory.totalGames > 0 ? memory.wins / memory.totalGames : 0,
        wisdomBonus: memory.wisdomBonus,
        learnedAnglesCount: memory.learnedAngles.length,
      }))
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '获取统计失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
