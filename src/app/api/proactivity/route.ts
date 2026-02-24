/**
 * 主动性API
 * 
 * GET: 获取主动性状态
 * POST: 触发主动行为
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProactivitySystem, startProactivity } from '@/lib/neuron/proactivity';

// 确保主动性系统启动
startProactivity();

/**
 * GET - 获取主动性状态
 */
export async function GET() {
  const system = getProactivitySystem();
  
  return NextResponse.json({
    success: true,
    drives: system.getDrives(),
    curiosities: system.getCuriosities(),
    recentThoughts: system.getSpontaneousThoughts(10),
    pendingMessages: system.getPendingMessages(),
  });
}

/**
 * POST - 交互
 */
export async function POST(request: NextRequest) {
  const system = getProactivitySystem();
  const body = await request.json();
  
  const { action } = body;
  
  switch (action) {
    case 'learn':
      // 从用户输入学习好奇目标
      if (body.input) {
        system.learnFromUserInput(body.input);
        system.recordActivity();
      }
      return NextResponse.json({ success: true, message: '已学习' });
      
    case 'satisfy':
      // 满足某个驱动
      if (body.driveId) {
        system.satisfyDrive(body.driveId, body.amount || 0.3);
      }
      return NextResponse.json({ success: true, message: '已满足' });
      
    case 'get_messages':
      // 获取待发送消息
      const messages = system.getPendingMessages();
      return NextResponse.json({ success: true, messages });
      
    default:
      return NextResponse.json({ 
        success: false, 
        message: 'Unknown action' 
      }, { status: 400 });
  }
}
