/**
 * 统一记忆系统 - 持久化测试 API
 * 
 * 功能：
 * - 存储测试记忆
 * - 检索记忆
 * - 查看持久化状态
 * - 手动触发快照
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';
import type { MemoryCategory } from '@/lib/neuron-v6/memory/unified/types';

/**
 * GET - 获取记忆系统状态
 */
export async function GET() {
  try {
    const core = await getSharedCore({});
    const mossMemory = core.getMossMemory();
    const status = mossMemory.getStatus();
    const selfCore = mossMemory.getSelfCore();
    
    return NextResponse.json({
      success: true,
      memoryStatus: status,
      selfCore: {
        coreMemoryCount: selfCore.count,
        themes: selfCore.themes,
        values: selfCore.values.slice(0, 5),
        avgConsolidationLevel: selfCore.avgConsolidationLevel,
      },
    });
  } catch (error) {
    console.error('[记忆测试API] 获取状态失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

/**
 * POST - 存储测试记忆或触发操作
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, content, type = 'episodic', metadata } = body;
    
    const core = await getSharedCore({});
    const mossMemory = core.getMossMemory();
    
    switch (action) {
      case 'store': {
        if (!content) {
          return NextResponse.json({
            success: false,
            error: 'content 是必需的',
          }, { status: 400 });
        }
        
        // 存储记忆
        const result = await mossMemory.storeMemory({
          type,
          content,
          embedding: generateMockEmbedding(), // 使用模拟嵌入
          category: 'custom' as MemoryCategory,
          emotionalMarker: {
            valence: 0.7,
            arousal: 0.5,
            dominance: 0.5,
          },
          metadata: {
            ...metadata,
            source: 'test-api',
            timestamp: Date.now(),
          },
        });
        
        return NextResponse.json({
          success: true,
          message: '记忆已存储',
          memoryId: result.node.id,
          triggers: result.triggers.length,
          triggeredRecall: result.triggeredRecall,
        });
      }
      
      case 'activate': {
        const { query } = body;
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'query 是必需的',
          }, { status: 400 });
        }
        
        const result = await mossMemory.activateMemories({
          query,
          queryEmbedding: generateMockEmbedding(),
          limit: 10,
          enableTriggerDetection: true,
        });
        
        return NextResponse.json({
          success: true,
          activatedCount: result.activatedMemories.length,
          topNodes: result.activatedMemories.slice(0, 5).map(item => ({
            id: item.node.id,
            content: item.node.content.substring(0, 100),
            activation: item.activation,
            source: item.source,
          })),
        });
      }
      
      case 'snapshot': {
        // 手动触发快照 - 需要访问持久化层
        const status = mossMemory.getStatus();
        return NextResponse.json({
          success: true,
          message: '快照功能需要通过持久化层调用',
          hint: '记忆会自动保存到数据库，快照每5分钟自动创建',
          currentStats: status,
        });
      }
      
      case 'crystallize': {
        const candidates = mossMemory.getCrystallizationCandidates(5);
        
        if (candidates.length === 0) {
          return NextResponse.json({
            success: true,
            message: '没有符合结晶条件的记忆',
          });
        }
        
        // 结晶第一个候选
        const first = candidates[0];
        const success = mossMemory.crystallizeMemory(first.node.id);
        
        return NextResponse.json({
          success,
          message: success ? '记忆已结晶' : '结晶失败',
          crystallizedMemory: {
            id: first.node.id,
            content: first.node.content.substring(0, 100),
            score: first.score,
          },
          remainingCandidates: candidates.length - 1,
        });
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: '无效的操作。支持: store, activate, snapshot, crystallize',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[记忆测试API] 操作失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

/**
 * 生成模拟嵌入向量（用于测试）
 * 实际使用时应该调用嵌入模型
 */
function generateMockEmbedding(): number[] {
  const embedding: number[] = [];
  for (let i = 0; i < 1536; i++) {
    embedding.push(Math.random() * 2 - 1);
  }
  return embedding;
}
