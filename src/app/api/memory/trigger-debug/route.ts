/**
 * 触发器系统调试 API
 * 
 * 用于检查触发器索引状态和匹配结果
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSharedCore, resetSharedCore } from '@/lib/neuron-v6/shared-core';

export async function GET() {
  try {
    const core = await getSharedCore({});
    const mossMemory = core.getMossMemory();
    
    // 获取触发器系统统计
    const status = mossMemory.getStatus();
    
    return NextResponse.json({
      success: true,
      totalMemories: status.totalMemories,
      triggerCount: status.triggerCount,
    });
  } catch (error) {
    console.error('[触发器调试API] 执行失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, reset } = body;
    
    // 如果请求重置
    if (reset) {
      resetSharedCore();
      return NextResponse.json({
        success: true,
        message: '核心实例已重置',
      });
    }
    
    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'query 是必需的',
      }, { status: 400 });
    }
    
    const core = await getSharedCore({});
    const mossMemory = core.getMossMemory();
    
    // 先存储一条记忆用于测试
    await mossMemory.storeMemory({
      type: 'episodic',
      content: '今天学习了人工智能的知识，包括深度学习和神经网络',
      embedding: generateMockEmbedding(),
      category: 'custom',
    });
    
    // 检查状态
    const status = mossMemory.getStatus();
    
    // 直接检测触发器
    const triggerResult = mossMemory.detectTriggers(query);
    
    // 尝试激活
    const result = await mossMemory.activateMemories({
      query,
      queryEmbedding: generateMockEmbedding(),
      limit: 10,
      enableTriggerDetection: true,
    });
    
    return NextResponse.json({
      success: true,
      query,
      totalMemories: status.totalMemories,
      triggerCount: status.triggerCount,
      triggerDetection: {
        hasTriggers: triggerResult.hasTriggers,
        matchedCount: triggerResult.matchedNodes.length,
        matchedNodes: triggerResult.matchedNodes.slice(0, 10),
      },
      activatedCount: result.activatedMemories.length,
      activatedMemories: result.activatedMemories.slice(0, 5).map(item => ({
        id: item.node.id,
        content: item.node.content.substring(0, 50),
        activation: item.activation,
        source: item.source,
      })),
    });
  } catch (error) {
    console.error('[触发器调试API] 执行失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

/**
 * 生成模拟嵌入向量
 */
function generateMockEmbedding(): number[] {
  const embedding: number[] = [];
  for (let i = 0; i < 1536; i++) {
    embedding.push(Math.random() * 2 - 1);
  }
  return embedding;
}
