/**
 * Agent API - 真实浏览器版本
 * 
 * 使用 ExecutorManager 自动选择执行器
 */

import { NextRequest } from 'next/server';
import { createAgent, Agent, CognitiveEvent } from '@/lib/agent';
import { LightweightBrowserExecutor, MockExecutor } from '@/lib/action';
import { getExecutorManager } from '@/lib/action/executor-manager';
import { HeaderUtils } from 'coze-coding-dev-sdk';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { input, stream = true, useRealBrowser = true } = await request.json();
  
  if (!input || typeof input !== 'string') {
    return new Response(JSON.stringify({ error: '请提供输入文本' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // 获取执行器管理器
  const executorManager = getExecutorManager();
  
  // 创建 Agent（自定义执行器）
  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  
  // 手动创建 Agent，注入自定义执行器
  const { CognitiveAgent } = await import('@/lib/intelligence/cognitive-agent');
  const cognitive = new CognitiveAgent(customHeaders);
  
  // 简化的 Agent 运行逻辑
  if (stream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (type: string, data: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`));
        };
        
        try {
          send('perceive', { input, phase: 'start' });
          
          // 启动认知循环
          let result = await cognitive.start(input);
          let cycleCount = 0;
          const maxCycles = 10;
          
          while (result.shouldContinue && cycleCount < maxCycles) {
            cycleCount++;
            
            // 执行行动
            for (const action of result.actions) {
              send('act', { 
                action: action.action, 
                target: action.target, 
                value: action.value,
                executor: action.executor
              });
              
              // 使用执行器管理器执行
              const actionResult = await executorManager.execute(action);
              
              send('observe', {
                status: actionResult.status,
                content: actionResult.content,
                extracted: actionResult.extracted ? Object.fromEntries(actionResult.extracted) : undefined,
                executor: actionResult.executor
              });
              
              if (actionResult.completed) {
                send('complete', { success: true, output: actionResult.content });
                controller.close();
                return;
              }
              
              // 观察结果触发新一轮循环
              const { ObservationStructure } = await import('@/lib/info-field/structures');
              const observation = new ObservationStructure(
                `obs-${Date.now()}`,
                action.id,
                actionResult.content,
                actionResult.status,
                actionResult.error,
                actionResult.extracted
              );
              
              result = await cognitive.observe(observation);
              break; // 一次处理一个行动
            }
            
            // 如果没有行动，继续循环
            if (result.actions.length === 0) {
              result = await cognitive.cycle();
            }
          }
          
          send('complete', { 
            success: result.state.completed, 
            output: result.thought || '任务处理完成',
            stats: {
              cycles: cycleCount,
              state: result.state
            }
          });
          
          controller.close();
        } catch (error) {
          send('error', { message: error instanceof Error ? error.message : 'Unknown error' });
          controller.close();
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } else {
    // 非流式
    try {
      let result = await cognitive.start(input);
      let cycleCount = 0;
      const maxCycles = 10;
      const allActions: unknown[] = [];
      
      while (result.shouldContinue && cycleCount < maxCycles) {
        cycleCount++;
        
        for (const action of result.actions) {
          const actionResult = await executorManager.execute(action);
          allActions.push({ action, result: actionResult });
          
          if (actionResult.completed) {
            return new Response(JSON.stringify({
              success: true,
              output: actionResult.content,
              actions: allActions,
              stats: { cycles: cycleCount }
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          const { ObservationStructure } = await import('@/lib/info-field/structures');
          const observation = new ObservationStructure(
            `obs-${Date.now()}`,
            action.id,
            actionResult.content,
            actionResult.status,
            actionResult.error,
            actionResult.extracted
          );
          
          result = await cognitive.observe(observation);
          break;
        }
        
        if (result.actions.length === 0) {
          result = await cognitive.cycle();
        }
      }
      
      return new Response(JSON.stringify({
        success: result.state.completed,
        output: result.thought,
        actions: allActions,
        stats: { cycles: cycleCount }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}
