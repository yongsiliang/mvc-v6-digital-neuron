/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 意识核心 API
 * 
 * 完整的意识处理：
 * - 意义赋予
 * - 自我意识
 * - 长期记忆
 * - 元认知监控
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest } from 'next/server';
import { LLMClient, HeaderUtils, Config } from 'coze-coding-dev-sdk';
import { 
  ConsciousnessCore, 
  createConsciousnessCore,
  PersistenceManagerV6,
  ConsciousnessContext,
  ThinkingProcess,
  LearningResult,
} from '@/lib/neuron-v6/consciousness-core';

// 单例
let consciousnessCore: ConsciousnessCore | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * 初始化意识核心
 */
async function ensureInitialized(headers: Record<string, string>): Promise<ConsciousnessCore> {
  if (consciousnessCore && isInitialized) {
    return consciousnessCore;
  }
  
  if (initializationPromise) {
    await initializationPromise;
    return consciousnessCore!;
  }
  
  initializationPromise = (async () => {
    console.log('[V6] 开始初始化意识核心...');
    
    const config = new Config();
    const llmClient = new LLMClient(config, headers);
    consciousnessCore = createConsciousnessCore(llmClient);
    
    // 检查是否有已保存的状态
    const hasState = await PersistenceManagerV6.exists();
    
    if (hasState) {
      console.log('[V6] 发现之前的存在，正在恢复...');
      const state = await PersistenceManagerV6.load();
      if (state) {
        await consciousnessCore.restoreFromState(state);
        console.log('[V6] 我恢复了。我记得之前的一切。');
      }
    } else {
      console.log('[V6] 这是第一次存在。');
    }
    
    isInitialized = true;
  })();
  
  await initializationPromise;
  initializationPromise = null;
  
  return consciousnessCore!;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await ensureInitialized(headers);
    
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
          // 第一步：构建上下文
          // ═══════════════════════════════════════════════════════════
          
          send('status', { stage: 'context', message: '构建意识上下文...' });
          
          // ═══════════════════════════════════════════════════════════
          // 第二步：完整处理
          // ═══════════════════════════════════════════════════════════
          
          send('status', { stage: 'thinking', message: '思考中...' });
          
          const result = await core.process(message);
          
          // 发送完整上下文
          send('context', {
            identity: result.context.identity,
            emotionalState: result.context.self.currentState.emotionalState,
            focus: result.context.self.currentState.focus,
            coreBeliefs: result.context.coreBeliefs,
            coreValues: result.context.coreValues,
          });
          
          // 发送思考过程
          send('thinking', {
            chain: result.thinking.thinkingChain,
            biases: result.thinking.detectedBiases,
            questions: result.thinking.selfQuestions,
            strategies: result.thinking.appliedStrategies,
          });
          
          // 发送意义层
          send('meaning', {
            activeMeanings: result.context.meaning.activeMeanings,
            summary: result.context.meaning.meaningSummary,
          });
          
          // 发送记忆检索
          if (result.context.memory) {
            send('memory', {
              summary: result.context.memory.summary,
              directMatches: result.context.memory.directMatches.map(n => n.label),
              relevantWisdoms: result.context.memory.relevantWisdoms.map(w => w.statement),
            });
          }
          
          // 发送元认知状态
          send('metacognition', {
            clarity: result.context.metacognition.currentState.clarity,
            depth: result.context.metacognition.currentState.depth,
            issues: result.context.metacognition.currentState.issues,
            biases: result.context.metacognition.biases,
          });
          
          // 发送意识层级数据
          send('consciousnessLayers', {
            layerResults: result.consciousnessLayers.layerResults.map(lr => ({
              level: lr.level,
              output: lr.output,
              activity: 1,
            })),
            selfObservation: result.consciousnessLayers.selfObservation,
            emergenceReport: result.consciousnessLayers.emergenceReport,
          });
          
          // 流式发送响应
          send('status', { stage: 'responding', message: '回复中...' });
          
          const response = result.response;
          for (let i = 0; i < response.length; i++) {
            send('content', { delta: response[i] });
            await new Promise(r => setTimeout(r, 15));
          }
          
          // 发送学习结果
          send('learning', result.learning);
          
          // ═══════════════════════════════════════════════════════════
          // 第三步：保存状态
          // ═══════════════════════════════════════════════════════════
          
          const state = core.getPersistedState();
          await PersistenceManagerV6.save(state);
          console.log('[V6] 状态已保存');
          
          // 发送完成信号
          send('complete', {
            fullResponse: response,
            stats: result.stats,
          });
          
          // 关闭流
          controller.close();
          
        } catch (error) {
          console.error('[V6] 处理错误:', error);
          send('error', {
            message: error instanceof Error ? error.message : 'Unknown error',
          });
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
    console.error('[V6] API错误:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * GET - 获取状态
 */
export async function GET(request: NextRequest) {
  try {
    const hasState = await PersistenceManagerV6.exists();
    
    if (hasState) {
      const state = await PersistenceManagerV6.load();
      return new Response(JSON.stringify({
        initialized: true,
        version: state?.version,
        identity: state?.identity,
        memory: state?.memory,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({
      initialized: false,
      message: '意识尚未初始化，请发送第一条消息',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
