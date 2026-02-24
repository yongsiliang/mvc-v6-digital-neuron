import { NextRequest } from 'next/server';
import { getDigitalNeuronSystem } from '@/lib/neuron';
import { getGameEngine, getPlayers } from '@/lib/neuron/latent-game';
import { getConversationContext } from '@/lib/neuron/conversation-context';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 流式聊天API - SSE协议
 * 
 * 特性：
 * - 持久化记忆（刷新页面不丢失）
 * - 对话上下文（模型知道之前聊了什么）
 * - 异步学习（不阻塞响应）
 * - 类脑分层记忆
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, sessionId } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: '消息内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sid = sessionId || 'default-session';
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

          // 2. 快速博弈（带意义记忆）
          send('neuron', { neuronId: 'latent-game', message: '博弈思考中...' });
          
          const engine = getGameEngine(headers);
          const gameResult = await engine.play(message, sid);
          
          // 【新增】发送意义共鸣信息
          if (gameResult.resonance && gameResult.resonance.activatedMemories.length > 0) {
            send('meaning-resonance', {
              activatedCount: gameResult.resonance.activatedMemories.length,
              dominantTheme: gameResult.resonance.dominantTheme,
              influenceWeight: gameResult.resonance.influenceWeight.toFixed(3),
              hints: gameResult.resonance.activatedMemories
                .slice(0, 3)
                .map((a: { memory: { meaningSummary: string; meaning_summary?: string } }) => 
                  a.memory.meaning_summary || a.memory.meaningSummary
                ),
            });
          }
          
          send('game-result', {
            winner: gameResult.winner.role,
            confidence: gameResult.winner.confidence.toFixed(2),
            reason: gameResult.evaluationReason,
          });

          // 3. 立即输出（带对话上下文）
          send('neuron', { neuronId: 'motor-language', message: `${gameResult.winner.role}输出中` });

          let fullResponse = '';
          for await (const chunk of engine.streamAnswer(message, gameResult, sid)) {
            fullResponse += chunk;
            send('response', { delta: chunk });
          }

          // 4. 完成
          send('done', { 
            fullResponse,
            winner: gameResult.winner.role,
            sessionId: sid,
          });

          controller.close();

          // 5. 后台异步：保存对话 + 学习
          engine.saveConversation(
            sid,
            message,
            fullResponse,
            gameResult.winner.role,
            gameResult.allThoughts
          ).catch(() => {});
          
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
 * GET - 获取博弈学习统计和对话统计
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId') || 'default-session';
    const action = url.searchParams.get('action');
    
    const engine = getGameEngine({});
    const conversationCtx = getConversationContext();
    
    // 清除会话历史
    if (action === 'clear') {
      await conversationCtx.clearSession(sessionId);
      return new Response(JSON.stringify({ 
        success: true, 
        message: '对话历史已清除' 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const [summary, convStats] = await Promise.all([
      engine.getStatsSummary(),
      conversationCtx.getStats(sessionId),
    ]);
    
    const supabase = getSupabaseClient();
    const [memoryCount, meaningMemoryCount] = await Promise.all([
      supabase.from('neuron_memories').select('*', { count: 'exact', head: true }),
      supabase.from('meaning_memories').select('*', { count: 'exact', head: true }),
    ]);
    
    return new Response(JSON.stringify({
      success: true,
      sessionId,
      memoryCount: memoryCount.count || 0,
      meaningMemoryCount: meaningMemoryCount.count || 0,
      conversation: convStats,
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
