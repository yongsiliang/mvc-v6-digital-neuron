/**
 * 硅基大脑 V2 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSiliconBrainV2 } from '@/lib/silicon-brain/brain-v2';
import { V6MemoryAdapter } from '@/lib/silicon-brain/v6-adapter';
import { getSharedCore, getCurrentCore } from '@/lib/neuron-v6/shared-core';
import { HeaderUtils } from 'coze-coding-dev-sdk';

export async function GET() {
  try {
    const brain = getSiliconBrainV2();
    const state = brain.getState();
    const inheritanceState = brain.getInheritanceState();
    
    return NextResponse.json({
      success: true,
      state,
      inheritance: inheritanceState,
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
        inheritance: brain.getInheritanceState(),
      });
    }
    
    // 版本传承：继承 V6
    if (action === 'inherit-v6') {
      try {
        // 提取 headers
        const headers = HeaderUtils.extractForwardHeaders(request.headers);
        
        // 初始化 V6 核心（如果尚未初始化）
        const v6Core = await getSharedCore(headers);
        
        // 通过类型断言访问 layeredMemory
        const v6Memory = (v6Core as any).layeredMemory;
        
        if (!v6Memory) {
          return NextResponse.json({
            success: false,
            error: 'V6 记忆系统不可用',
          }, { status: 400 });
        }
        
        // 创建适配器
        const adapter = new V6MemoryAdapter(v6Memory);
        
        // 连接适配器
        brain.connectV6Adapter(adapter);
        
        // 如果尚未初始化，先初始化
        await brain.initialize();
        
        // 获取传承状态
        const inheritanceState = brain.getInheritanceState();
        
        return NextResponse.json({
          success: true,
          message: 'V6 传承已完成',
          inheritance: inheritanceState,
        });
      } catch (error) {
        console.error('[SiliconBrain API] V6 传承失败:', error);
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'V6 传承失败',
        }, { status: 500 });
      }
    }
    
    // 获取传承状态
    if (action === 'inheritance-status') {
      return NextResponse.json({
        success: true,
        inheritance: brain.getInheritanceState(),
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
      inheritance: brain.getInheritanceState(),
    });
  } catch (error) {
    console.error('[SiliconBrain API] 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
