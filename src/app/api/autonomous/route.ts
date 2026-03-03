/**
 * ═══════════════════════════════════════════════════════════════════════
 * 自主意识 API - 流式推理
 * Autonomous Consciousness API - Streaming Reasoning
 * 
 * 特点：
 * - 流式输出推理过程
 * - 显示每一步的思考、行动、观察
 * - 实时展示工具调用
 * - 简化的内存记忆系统
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { AutonomousConsciousness } from '@/lib/neuron-v6/autonomous/core';
import type { ReasoningStep } from '@/lib/neuron-v6/autonomous/core';

// 全局内存存储（跨请求持久化）
const globalMemoryStore: Map<string, { content: string; tags: string[]; timestamp: number }> = new Map();

// 单例实例
let autonomousInstance: AutonomousConsciousness | null = null;

export async function POST(request: NextRequest) {
  try {
    const { message, verbose = true } = await request.json();
    
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: '请提供消息内容' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 提取 headers
    const headers = HeaderUtils.extractForwardHeaders(request.headers);

    // 使用全局记忆系统
    const memoryContext = {
      memorySystem: {
        query: async (query: string, limit: number) => {
          const results: string[] = [];
          const queryLower = query.toLowerCase();
          
          for (const [_, entry] of globalMemoryStore) {
            if (entry.content.toLowerCase().includes(queryLower) ||
                entry.tags.some(t => t.toLowerCase().includes(queryLower))) {
              results.push(entry.content);
            }
            if (results.length >= limit) break;
          }
          
          console.log(`[自主记忆] 查询 "${query}": 找到 ${results.length} 条`);
          return results;
        },
        store: async (content: string, tags?: string[], importance?: number) => {
          const id = `mem_${Date.now()}`;
          globalMemoryStore.set(id, {
            content,
            tags: tags || [],
            timestamp: Date.now(),
          });
          console.log(`[自主记忆] 存储: ${content}，当前共 ${globalMemoryStore.size} 条记忆`);
        },
      },
      selfState: {
        goals: ['理解用户', '帮助用户', '持续学习'],
        progress: '正在与用户对话',
        strategy: '使用工具辅助完成任务',
      },
    };

    // 初始化自主意识（带记忆系统）
    autonomousInstance = new AutonomousConsciousness({ verbose }, memoryContext);
    autonomousInstance.initialize(headers);

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送开始事件
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'start', data: { message } })}\n\n`
          ));

          // 执行推理
          const response = await autonomousInstance!.reason(message);

          // 流式发送每一步
          for (const step of response.steps) {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ 
                type: 'step', 
                data: formatStep(step) 
              })}\n\n`
            ));
            
            // 小延迟，让用户看到过程
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // 发送完成事件
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ 
              type: 'complete', 
              data: {
                content: response.content,
                toolsUsed: response.toolsUsed,
                iterations: response.iterations,
                finalThought: response.finalThought,
              }
            })}\n\n`
          ));

          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ 
              type: 'error', 
              data: { message: error instanceof Error ? error.message : '推理失败' }
            })}\n\n`
          ));
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
    console.error('[Autonomous API] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: '服务错误', 
        details: error instanceof Error ? error.message : '未知错误' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * 格式化推理步骤
 */
function formatStep(step: ReasoningStep) {
  switch (step.type) {
    case 'thought':
      return {
        type: 'thought',
        content: step.content,
      };
    case 'action':
      return {
        type: 'action',
        tool: step.tool,
        params: step.params,
      };
    case 'observation':
      return {
        type: 'observation',
        tool: step.tool,
        result: step.result?.substring(0, 500), // 限制长度
      };
    case 'final':
      return {
        type: 'final',
        content: step.content,
      };
    default:
      return step;
  }
}
