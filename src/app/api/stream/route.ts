import { NextRequest } from 'next/server';
import { getDigitalNeuronSystem } from '@/lib/neuron';
import { LatentGameEngine } from '@/lib/neuron/latent-game';
import { getConversationContext } from '@/lib/neuron/conversation-context';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { MemoryIntegrationService } from '@/lib/neuron-v2/memory-integration';
import { getUserIdFromRequest, isValidUserId } from '@/lib/neuron-v2/auth';

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
    const { message, context, sessionId, userId: clientUserId } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: '消息内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取用户ID（优先从请求体，其次从请求头）
    const userId = clientUserId || getUserIdFromRequest(request);
    const validUserId = userId && isValidUserId(userId) ? userId : null;

    const sid = sessionId || 'default-session';
    
    // 初始化记忆集成服务
    const memoryService = new MemoryIntegrationService({
      maxRelevantMemories: 5,
      importanceThreshold: 0.3,
    });
    
    if (validUserId) {
      memoryService.setUserId(validUserId);
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
          
          // ==================== 记忆回忆 ====================
          // 在对话开始前，回忆相关记忆
          let memoryContext = null;
          if (validUserId) {
            try {
              memoryContext = await memoryService.recallRelevantMemories(message);
              // 发送记忆上下文给前端
              if (memoryContext.relevantMemories.length > 0) {
                send('memory-context', {
                  count: memoryContext.relevantMemories.length,
                  topics: memoryContext.topics,
                  emotionalContext: memoryContext.emotionalContext,
                  preview: memoryContext.relevantMemories.slice(0, 2).map(m => ({
                    summary: m.keyPoints?.slice(0, 2) || [],
                    importance: m.importance,
                  })),
                });
              }
            } catch (err) {
              console.error('Memory recall error:', err);
            }
          }
          
          // ==================== 神经元工作流 ====================
          
          // 1. 感官层：接收输入
          send('neuron', { neuronId: 'sensory', message: '接收输入信号' });
          await new Promise(r => setTimeout(r, 150)); // 短暂延迟让前端能看到
          
          const system = getDigitalNeuronSystem();
          
          // 2. 意义核心层
          send('neuron', { neuronId: 'meaning-anchor', message: '计算自我关联' });
          await new Promise(r => setTimeout(r, 100));
          
          send('neuron', { neuronId: 'memory-associate', message: memoryContext 
            ? `检索到 ${memoryContext.relevantMemories.length} 条相关记忆` 
            : '检索相关记忆' });
          await new Promise(r => setTimeout(r, 100));
          
          send('neuron', { neuronId: 'meaning-generate', message: '生成主观意义' });
          
          // 构建增强的上下文（包含记忆）
          const enhancedContext = memoryContext && memoryContext.relevantMemories.length > 0
            ? {
                ...context,
                memoryContext: `相关记忆:\n${memoryContext.relevantMemories
                  .slice(0, 3)
                  .map((m, i) => `${i + 1}. ${m.content.slice(0, 200)}...`)
                  .join('\n')}`,
              }
            : context;
          
          const neuronResult = await system.process(message, enhancedContext);
          
          send('meaning', neuronResult.meaning);
          send('decision', neuronResult.decision);

          // 3. 决策层
          send('neuron', { neuronId: 'prefrontal', message: '思考与决策' });
          await new Promise(r => setTimeout(r, 100));
          
          send('neuron', { neuronId: 'cingulate', message: '反思与纠错' });
          await new Promise(r => setTimeout(r, 100));
          
          send('neuron', { neuronId: 'self-evolve', message: '动态更新自我' });

          // 4. 记忆层
          send('neuron', { neuronId: 'hippocampus', message: '记忆存储' });
          
          // 5. 高维博弈
          send('neuron', { neuronId: 'latent-game', message: '博弈思考中...' });
          
          const engine = new LatentGameEngine(headers);
          const gameResult = await engine.play(message, sid);
          
          // 发送意识空间状态
          if (gameResult.consciousnessState) {
            send('consciousness', {
              trail: gameResult.consciousnessState.trail.length,
            });
          }
          
          // 发送打开的记忆门
          if (gameResult.openDoors && gameResult.openDoors.length > 0) {
            send('open-doors', {
              count: gameResult.openDoors.length,
              meanings: gameResult.openDoors.slice(0, 3).map(d => d.meaning),
            });
          }
          
          send('game-result', {
            winner: gameResult.winner.neuronId,
            confidence: gameResult.winner.confidence.toFixed(2),
            reason: gameResult.evaluationReason,
          });

          // 7. 输出层
          send('neuron', { neuronId: 'motor-language', message: '生成响应' });

          let fullResponse = '';
          for await (const chunk of engine.streamAnswer(message, gameResult, sid)) {
            fullResponse += chunk;
            send('response', { delta: chunk });
          }

          // 8. 完成
          send('done', { 
            fullResponse,
            winner: gameResult.winner.neuronId,
            sessionId: sid,
            styleInfo: gameResult.styleInfo,
          });

          controller.close();

          // 9. 后台异步：保存对话 + 学习 + 记忆
          engine.saveConversation(
            sid,
            message,
            fullResponse,
            gameResult.winner.neuronId,
            gameResult.allThoughts
          ).catch(() => {});
          
          engine.learnAsync(message, gameResult.allThoughts, gameResult.winner);
          
          // 10. 保存对话记忆（异步）
          if (validUserId) {
            (async () => {
              try {
                // 保存用户消息记忆
                await memoryService.rememberConversation('user', message, {
                  topics: memoryContext?.topics,
                });
                
                // 保存助手回复记忆
                await memoryService.rememberConversation('assistant', fullResponse, {
                  topics: memoryContext?.topics,
                });
              } catch (err) {
                console.error('Failed to save conversation memory:', err);
              }
            })();
          }

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
    
    const engine = new LatentGameEngine({});
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
