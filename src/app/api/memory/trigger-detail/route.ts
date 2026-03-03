/**
 * 触发器索引详情 API
 */

import { NextResponse } from 'next/server';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';

export async function GET() {
  try {
    const core = await getSharedCore({});
    const mossMemory = core.getMossMemory();
    
    // 获取状态
    const status = mossMemory.getStatus();
    
    // 尝试直接获取触发器统计
    const triggerStats = mossMemory.getTriggerStats();
    
    return NextResponse.json({
      success: true,
      status,
      triggerStats,
    });
  } catch (error) {
    console.error('[触发器详情API] 执行失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const core = await getSharedCore({});
    const mossMemory = core.getMossMemory();
    
    // 存储测试记忆
    const result = await mossMemory.storeMemory({
      type: 'episodic',
      content: '神经网络是一种模拟人脑的计算模型',
      embedding: Array(1536).fill(0).map(() => Math.random() * 2 - 1),
      category: 'custom',
    });
    
    // 获取生成的触发器
    const triggers = result.triggers.map(t => ({
      id: t.id,
      type: t.type,
      pattern: t.pattern,
    }));
    
    // 测试搜索
    const testResult = mossMemory.detectTriggers('神经网络');
    
    return NextResponse.json({
      success: true,
      storedMemory: {
        id: result.node.id,
        content: result.node.content.substring(0, 50),
      },
      triggersCreated: triggers.length,
      triggers: triggers.slice(0, 20),
      testSearch: {
        query: '神经网络',
        hasTriggers: testResult.hasTriggers,
        matchedCount: testResult.matchedNodes.length,
        matchedNodes: testResult.matchedNodes,
      },
    });
  } catch (error) {
    console.error('[触发器详情API] 执行失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
