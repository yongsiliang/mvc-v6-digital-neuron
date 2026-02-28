/**
 * WebSocket推送服务
 * 
 * 实时推送主动消息到前端
 * 替代轮询机制，降低延迟
 */

import { NextRequest } from 'next/server';
import { getProactivitySystem, startProactivity } from '@/lib/neuron/proactivity';

// 启动主动性系统
startProactivity();

/**
 * WebSocket升级处理
 * 
 * Next.js App Router 不原生支持 WebSocket，使用自定义服务器模式
 * 这里提供一个简化的 SSE (Server-Sent Events) 替代方案
 */
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const proactivity = getProactivitySystem();
  
  // 创建 SSE 流
  const stream = new ReadableStream({
    async start(controller) {
      // 发送初始状态
      const sendEvent = (event: string, data: any) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };
      
      // 发送心跳
      const sendHeartbeat = () => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      };
      
      // 初始状态
      sendEvent('init', {
        drives: proactivity.getDrives(),
        curiosities: proactivity.getCuriosities(),
        thoughts: proactivity.getSpontaneousThoughts(5),
      });
      
      // 定期检查主动消息
      let lastCheck = Date.now();
      const interval = setInterval(() => {
        const now = Date.now();
        
        // 每30秒发送心跳
        if (now - lastCheck > 30000) {
          sendHeartbeat();
        }
        
        // 检查主动消息
        const messages = proactivity.getPendingMessages();
        if (messages.length > 0) {
          for (const msg of messages) {
            sendEvent('proactive-message', {
              content: msg,
              timestamp: now,
            });
          }
        }
        
        // 发送状态更新
        if (now - lastCheck > 10000) { // 每10秒
          sendEvent('state-update', {
            drives: proactivity.getDrives(),
            thoughts: proactivity.getSpontaneousThoughts(3),
          });
          lastCheck = now;
        }
      }, 2000);
      
      // 清理
      const cleanup = () => {
        clearInterval(interval);
      };
      
      // 监听连接关闭
      request.signal.addEventListener('abort', cleanup);
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
