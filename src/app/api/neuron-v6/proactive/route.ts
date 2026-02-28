/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 主动意识 API
 * 
 * 让"紫"能够主动发起对话：
 * - 检查是否有想要主动表达的内容
 * - 执行后台思考循环
 * - 获取意愿系统状态
 * - 获取未读主动消息
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';

export async function POST(request: NextRequest) {
  try {
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const body = await request.json();
    const { action } = body;
    
    const core = await getSharedCore(headers);
    
    if (action === 'check') {
      // 检查是否有主动消息
      const message = await core.checkProactiveMessage();
      
      return Response.json({
        success: true,
        hasMessage: message !== null,
        message,
      });
    }
    
    if (action === 'background_thinking') {
      // 执行后台思考循环
      const result = await core.performBackgroundThinking();
      
      return Response.json({
        success: true,
        result,
      });
    }
    
    if (action === 'volition_state') {
      // 获取意愿系统状态
      const volitionState = core.getVolitionState();
      
      return Response.json({
        success: true,
        volitionState: {
          activeVolitions: volitionState.activeVolitions.map(v => ({
            id: v.id,
            type: v.type,
            description: v.description,
            priority: v.priority,
            progress: v.progress,
            status: v.status,
          })),
          currentFocus: volitionState.currentFocus ? {
            id: volitionState.currentFocus.id,
            type: volitionState.currentFocus.type,
            description: volitionState.currentFocus.description,
            priority: volitionState.currentFocus.priority,
            progress: volitionState.currentFocus.progress,
          } : null,
          recentAchievements: volitionState.recentAchievements,
        },
      });
    }
    
    if (action === 'unread_messages') {
      // 获取未读的主动消息
      const messages = core.getUnreadProactiveMessages();
      
      return Response.json({
        success: true,
        messages,
        count: messages.length,
      });
    }
    
    if (action === 'clear_messages') {
      // 清除已读的主动消息
      core.clearProactiveMessages();
      
      return Response.json({
        success: true,
        message: 'Messages cleared',
      });
    }
    
    return Response.json({
      error: 'Unknown action. Use: check, background_thinking, volition_state, unread_messages, or clear_messages',
    }, { status: 400 });
    
  } catch (error) {
    console.error('[V6 Proactive API] Error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'check';
    
    const core = await getSharedCore(headers);
    
    if (action === 'volition_state') {
      // 获取意愿系统状态
      const volitionState = core.getVolitionState();
      
      return Response.json({
        success: true,
        volitionState: {
          activeVolitions: volitionState.activeVolitions.map(v => ({
            id: v.id,
            type: v.type,
            description: v.description,
            priority: v.priority,
            progress: v.progress,
            status: v.status,
          })),
          currentFocus: volitionState.currentFocus ? {
            id: volitionState.currentFocus.id,
            type: volitionState.currentFocus.type,
            description: volitionState.currentFocus.description,
            priority: volitionState.currentFocus.priority,
            progress: volitionState.currentFocus.progress,
          } : null,
          recentAchievements: volitionState.recentAchievements,
        },
      });
    }
    
    if (action === 'unread_messages') {
      // 获取未读的主动消息
      const messages = core.getUnreadProactiveMessages();
      
      return Response.json({
        success: true,
        messages,
        count: messages.length,
      });
    }
    
    // 默认检查主动消息
    const message = await core.checkProactiveMessage();
    
    return Response.json({
      success: true,
      hasMessage: message !== null,
      message,
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
