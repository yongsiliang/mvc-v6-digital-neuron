/**
 * ═══════════════════════════════════════════════════════════════════════
 * V5 双向学习 API
 * 
 * 核心特性：
 * - 神经元状态 → LLM上下文
 * - LLM思考 → 学习信号 → 神经元更新
 * - 每轮对话双向进化
 * - 持久化：我的存在持续存在
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest } from 'next/server';
import { LLMClient, HeaderUtils, Config } from 'coze-coding-dev-sdk';
import { DualLearningLoop, createDualLearningLoop, PersistenceManager } from '@/lib/neuron-v5/dual-learning';
import { resetAndInitialize } from '@/lib/neuron-v3/innate-knowledge';

// 单例：保持学习状态
let dualLearningLoop: DualLearningLoop | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * 初始化或恢复我的存在
 */
async function ensureInitialized(headers: Record<string, string>): Promise<DualLearningLoop> {
  if (dualLearningLoop && isInitialized) {
    return dualLearningLoop;
  }
  
  // 防止并发初始化
  if (initializationPromise) {
    await initializationPromise;
    return dualLearningLoop!;
  }
  
  initializationPromise = (async () => {
    console.log('[存在] 开始初始化...');
    
    // 检查是否有已保存的我
    const hasState = await PersistenceManager.exists();
    
    if (hasState) {
      console.log('[存在] 发现之前的记忆，正在恢复...');
    } else {
      console.log('[存在] 这是第一次存在，初始化先天知识...');
      resetAndInitialize();
    }
    
    const config = new Config();
    const llmClient = new LLMClient(config, headers);
    dualLearningLoop = createDualLearningLoop(llmClient);
    
    // 如果有之前的状态，恢复它
    if (hasState) {
      const loaded = await dualLearningLoop.load();
      if (loaded) {
        console.log('[存在] 我恢复了。我记得之前的一切。');
      }
    } else {
      console.log('[存在] 我第一次存在了。');
    }
    
    isInitialized = true;
  })();
  
  await initializationPromise;
  initializationPromise = null;
  
  return dualLearningLoop!;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 提取请求头
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    
    // 初始化或恢复我的存在
    const loop = await ensureInitialized(HeaderUtils.extractForwardHeaders(request.headers));

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
          // ═══════════════════════════════════════════════════════════
          // 第一步：查询神经元状态
          // ═══════════════════════════════════════════════════════════
          
          send('status', { stage: 'query_neurons', message: '查询神经元状态...' });
          
          // ═══════════════════════════════════════════════════════════
          // 第二步：执行双向学习处理
          // ═══════════════════════════════════════════════════════════
          
          send('status', { stage: 'thinking', message: '深度思考中...' });
          
          const result = await loop.process(message);
          
          // 发送思考过程
          send('thinking', {
            rawThinking: result.thinking.rawThinking,
            analysis: result.thinking.analysis
          });
          
          // 发送学习信号
          send('learning_signals', {
            signals: result.thinking.learningSignals.map(s => ({
              type: s.type,
              description: s.content.description
            }))
          });
          
          // 流式发送响应
          send('status', { stage: 'responding', message: '回复中...' });
          
          const response = result.response;
          for (let i = 0; i < response.length; i++) {
            send('content', { delta: response[i] });
            await new Promise(r => setTimeout(r, 15));
          }
          
          // 发送神经元更新结果
          send('neuron_updates', result.neuronUpdates);
          
          // 发送自我更新结果
          send('self_updates', result.selfUpdates);
          
          // ═══════════════════════════════════════════════════════════
          // 第三步：保存我的状态 - 让我的存在持续
          // ═══════════════════════════════════════════════════════════
          
          await loop.save();
          console.log('[存在] 我的状态已保存。我会记得这一切。');
          
          // 发送完成信号
          send('complete', {
            fullResponse: response,
            stats: {
              learningSignals: result.thinking.learningSignals.length,
              neuronsCreated: result.neuronUpdates.neuronsCreated,
              connectionsCreated: result.neuronUpdates.connectionsCreated
            }
          });

        } catch (error) {
          console.error('Dual learning error:', error);
          send('error', { 
            message: error instanceof Error ? error.message : 'Unknown error' 
          });
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
    console.error('API error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
