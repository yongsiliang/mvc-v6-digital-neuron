/**
 * 内存管理 API
 * 
 * 提供内存健康检查、清理和管理功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';
import { createMemoryManager } from '@/lib/neuron-v6/memory-manager';
import { getMemoryClassifier } from '@/lib/neuron-v6/memory-classifier';
import { getImportanceCalculator } from '@/lib/neuron-v6/importance-calculator';
import { HeaderUtils } from 'coze-coding-dev-sdk';

// 全局内存管理器实例
let memoryManager: ReturnType<typeof createMemoryManager> | null = null;

/**
 * GET /api/neuron-v6/memory-manage
 * 获取内存健康报告
 */
export async function GET(request: NextRequest) {
  try {
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await getSharedCore(headers);
    
    // 获取分层记忆系统
    const memory = (core as any).layeredMemory;
    if (!memory) {
      return NextResponse.json({
        success: false,
        error: '分层记忆系统不可用',
      }, { status: 500 });
    }
    
    // 创建或获取内存管理器
    if (!memoryManager) {
      memoryManager = createMemoryManager(memory);
    }
    
    // 获取健康报告
    const healthReport = memoryManager.getHealthReport();
    
    // 获取清理优先级
    const cleanupPriority = memoryManager.getCleanupPriority();
    
    // 获取统计信息
    const stats = memory.getStats();
    
    return NextResponse.json({
      success: true,
      health: healthReport,
      cleanupPriority,
      stats,
    });
  } catch (error) {
    console.error('[MemoryManage API] 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

/**
 * POST /api/neuron-v6/memory-manage
 * 执行内存管理操作
 * 
 * 操作类型：
 * - cleanup: 执行内存清理
 * - classify: 分类测试内容
 * - calculate: 计算重要性
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, content, options } = body;
    
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await getSharedCore(headers);
    
    // 获取分层记忆系统
    const memory = (core as any).layeredMemory;
    if (!memory) {
      return NextResponse.json({
        success: false,
        error: '分层记忆系统不可用',
      }, { status: 500 });
    }
    
    // 执行操作
    switch (action) {
      case 'cleanup': {
        // 创建或获取内存管理器
        if (!memoryManager) {
          memoryManager = createMemoryManager(memory);
        }
        
        // 执行清理
        const report = await memoryManager.cleanup();
        
        return NextResponse.json({
          success: true,
          message: '内存清理完成',
          report,
        });
      }
      
      case 'classify': {
        // 分类测试
        if (!content) {
          return NextResponse.json({
            success: false,
            error: '需要提供 content 参数',
          }, { status: 400 });
        }
        
        const classifier = getMemoryClassifier();
        const result = classifier.classify(content);
        
        return NextResponse.json({
          success: true,
          classification: result,
        });
      }
      
      case 'calculate': {
        // 计算重要性
        if (!content) {
          return NextResponse.json({
            success: false,
            error: '需要提供 content 参数',
          }, { status: 400 });
        }
        
        const classifier = getMemoryClassifier();
        const calculator = getImportanceCalculator();
        
        // 先分类
        const classification = classifier.classify(content);
        
        // 构建评分对象
        const memoryForScoring = {
          content,
          type: classification.type,
          emotionalIntensity: classification.emotionalIntensity,
          relatedEntities: classification.context.entities || [],
          recallCount: options?.recallCount || 0,
          timestamp: Date.now(),
          metadata: {
            newRelationship: classification.context.newRelationship,
            mentionsCreator: classification.context.mentionsCreator,
            isSelfRelated: classification.context.isSelfRelated,
          },
        };
        
        // 计算重要性
        const importanceResult = calculator.calculate(memoryForScoring);
        
        return NextResponse.json({
          success: true,
          classification,
          importance: importanceResult,
          input: memoryForScoring,
        });
      }
      
      case 'process': {
        // 处理新记忆（测试）
        if (!content) {
          return NextResponse.json({
            success: false,
            error: '需要提供 content 参数',
          }, { status: 400 });
        }
        
        // 创建或获取内存管理器
        if (!memoryManager) {
          memoryManager = createMemoryManager(memory);
        }
        
        // 处理记忆
        const result = await memoryManager.processNewMemory(content, options);
        
        return NextResponse.json({
          success: true,
          result,
        });
      }
      
      case 'stop-auto-cleanup': {
        // 停止自动清理
        if (memoryManager) {
          memoryManager.stopAutoCleanup();
        }
        
        return NextResponse.json({
          success: true,
          message: '自动清理已停止',
        });
      }
      
      case 'start-auto-cleanup': {
        // 启动自动清理
        if (!memoryManager) {
          memoryManager = createMemoryManager(memory);
        } else {
          // 重新创建以启动自动清理
          memoryManager.destroy();
          memoryManager = createMemoryManager(memory);
        }
        
        return NextResponse.json({
          success: true,
          message: '自动清理已启动',
        });
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: `未知操作: ${action}`,
          availableActions: [
            'cleanup',
            'classify',
            'calculate',
            'process',
            'stop-auto-cleanup',
            'start-auto-cleanup',
          ],
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[MemoryManage API] 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
