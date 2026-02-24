import { NextRequest } from 'next/server';
import { getDigitalNeuronSystem } from '@/lib/neuron';
import { getGameEngine, getPlayers } from '@/lib/neuron/latent-game';
import { HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * 流式聊天API - SSE协议
 * 
 * 优化：异步学习，快速响应
 * 
 * 流程：
 * 1. 神经元处理
 * 2. 快速博弈（并行思考 + 快速评估）
 * 3. 立即输出结果
 * 4. [后台] 异步学习
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

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const send = (type: string, data: unknown) => {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`
          ));
        };

        try {
          const headers = HeaderUtils.extractForwardHeaders(request.headers);
          
          // 1. 神经元处理（快速）
          send('neuron', { neuronId: 'sensory', message: '接收输入' });
          
          const system = getDigitalNeuronSystem();
          const neuronResult = await system.process(message, context);
          
          send('signal-path', { path: neuronResult.signalPath });
          send('meaning', neuronResult.meaning);
          send('decision', neuronResult.decision);

          // 2. 快速博弈
          send('neuron', { neuronId: 'latent-game', message: '博弈思考中...' });
          
          const engine = getGameEngine(headers);
          const gameResult = await engine.play(message);
          
          send('game-result', {
            winner: gameResult.winner.role,
            confidence: gameResult.winner.confidence.toFixed(2),
            reason: gameResult.evaluationReason,
          });

          // 3. 立即输出（不等学习）
          send('neuron', { neuronId: 'motor-language', message: `${gameResult.winner.role}输出中` });

          let fullResponse = '';
          for await (const chunk of engine.streamAnswer(message, gameResult)) {
            fullResponse += chunk;
            send('response', { delta: chunk });
          }

          // 4. 完成
          send('done', { 
            fullResponse,
            winner: gameResult.winner.role,
          });

          controller.close();

          // 5. [后台异步] 学习 - 不阻塞用户
          engine.learnAsync(message, gameResult.allThoughts, gameResult.winner);

        } catch (error) {
          send('error', { message: error instanceof Error ? error.message : '处理失败' });
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
export async function GET() {
  try {
    const engine = getGameEngine({});
    const stats = engine.getStats();
    
    return new Response(JSON.stringify({
      success: true,
      summary: Object.entries(stats).map(([role, m]) => ({
        role,
        games: m.totalGames,
        wins: m.wins,
        winRate: m.totalGames > 0 ? (m.wins / m.totalGames).toFixed(2) : '0',
        wisdom: m.wisdomBonus.toFixed(3),
        learned: m.learnedAngles.length,
      }))
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch {
    return new Response(JSON.stringify({ error: '获取失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
