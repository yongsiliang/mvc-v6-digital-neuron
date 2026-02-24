import { NextRequest } from 'next/server';
import { getDigitalNeuronSystem } from '@/lib/neuron';
import { getGameEngine, getPlayers } from '@/lib/neuron/latent-game';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 流式聊天API - SSE协议
 * 
 * 特性：
 * - 持久化记忆（刷新页面不丢失）
 * - 异步学习（不阻塞响应）
 * - 类脑分层记忆（情景/语义/程序）
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
          
          // 1. 神经元处理
          send('neuron', { neuronId: 'sensory', message: '接收输入' });
          
          const system = getDigitalNeuronSystem();
          const neuronResult = await system.process(message, context);
          
          send('signal-path', { path: neuronResult.signalPath });
          send('meaning', neuronResult.meaning);
          send('decision', neuronResult.decision);

          // 2. 快速博弈（带持久化记忆）
          send('neuron', { neuronId: 'latent-game', message: '博弈思考中...' });
          
          const engine = getGameEngine(headers);
          const gameResult = await engine.play(message);
          
          send('game-result', {
            winner: gameResult.winner.role,
            confidence: gameResult.winner.confidence.toFixed(2),
            reason: gameResult.evaluationReason,
          });

          // 3. 立即输出
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

          // 5. 后台异步学习
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
 * GET - 获取博弈学习统计（持久化）
 */
export async function GET() {
  try {
    const engine = getGameEngine({});
    const summary = await engine.getStatsSummary();
    
    // 获取记忆总数
    const supabase = getSupabaseClient();
    const { count: memoryCount } = await supabase
      .from('neuron_memories')
      .select('*', { count: 'exact', head: true });
    
    return new Response(JSON.stringify({
      success: true,
      memoryCount: memoryCount || 0,
      players: summary,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: '获取失败',
      details: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
