/**
 * 硅基大脑 V2 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSiliconBrainV2 } from '@/lib/silicon-brain/brain-v2';

export async function GET() {
  try {
    const brain = getSiliconBrainV2();
    const state = brain.getState();
    
    return NextResponse.json({
      success: true,
      state,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, action } = body;
    
    const brain = getSiliconBrainV2();
    
    if (action === 'init') {
      await brain.initialize();
      return NextResponse.json({
        success: true,
        message: '硅基大脑初始化完成',
        state: brain.getState(),
      });
    }
    
    if (!input) {
      return NextResponse.json({
        success: false,
        message: '需要提供输入',
      }, { status: 400 });
    }
    
    const result = await brain.process(input);
    
    return NextResponse.json({
      success: true,
      ...result,
      state: brain.getState(),
    });
  } catch (error) {
    console.error('[SiliconBrain API] 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
