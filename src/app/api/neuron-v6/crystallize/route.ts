/**
 * 智慧结晶 API
 * 
 * 提供结晶检测、执行和智慧查询功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSharedCore, resetSharedCore } from '@/lib/neuron-v6/shared-core';
import { 
  WisdomCrystalStore, 
  WisdomCrystal,
  DEFAULT_CRYSTALLIZATION_CONFIG,
} from '@/lib/neuron-v6/wisdom-crystal';
import { 
  CrystallizationEngine,
  createCrystallizationEngine,
} from '@/lib/neuron-v6/crystallization-engine';
import { HeaderUtils } from 'coze-coding-dev-sdk';

// 全局实例
let crystalStore: WisdomCrystalStore | null = null;
let crystallizationEngine: CrystallizationEngine | null = null;

/**
 * 获取或创建智慧结晶存储
 */
function getCrystalStore(): WisdomCrystalStore {
  if (!crystalStore) {
    crystalStore = new WisdomCrystalStore();
  }
  return crystalStore;
}

/**
 * 获取或创建结晶引擎
 */
function getCrystallizationEngineInstance(memory: any): CrystallizationEngine {
  if (!crystallizationEngine) {
    const store = getCrystalStore();
    crystallizationEngine = createCrystallizationEngine(memory, store);
  }
  return crystallizationEngine;
}

/**
 * GET /api/neuron-v6/crystallize
 * 获取结晶状态和智慧列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    const context = searchParams.get('context');
    
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await getSharedCore(headers);
    let memory = (core as any).layeredMemory;
    
    if (!memory) {
      return NextResponse.json({
        success: false,
        error: '分层记忆系统不可用',
      }, { status: 500 });
    }
    
    const store = getCrystalStore();
    const engine = getCrystallizationEngineInstance(memory);
    
    switch (action) {
      case 'status': {
        // 获取结晶状态
        const shouldCrystallize = engine.shouldCrystallize();
        const stats = engine.getStats();
        const storeStats = store.getStats();
        
        return NextResponse.json({
          success: true,
          shouldCrystallize,
          stats: {
            ...stats,
            store: storeStats,
          },
        });
      }
      
      case 'wisdom': {
        // 获取智慧列表
        const crystals = store.getAllCrystals();
        
        return NextResponse.json({
          success: true,
          crystals,
          stats: store.getStats(),
        });
      }
      
      case 'core-wisdom': {
        // 获取核心智慧
        const coreWisdom = store.getCoreWisdom();
        
        return NextResponse.json({
          success: true,
          coreWisdom,
        });
      }
      
      case 'search': {
        // 按场景搜索智慧
        if (!context) {
          return NextResponse.json({
            success: false,
            error: '需要提供 context 参数',
          }, { status: 400 });
        }
        
        const wisdom = store.getWisdomByContext(context);
        
        return NextResponse.json({
          success: true,
          context,
          wisdom,
        });
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: `未知操作: ${action}`,
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[Crystallize API] 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

/**
 * POST /api/neuron-v6/crystallize
 * 执行结晶操作
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, options } = body;
    
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await getSharedCore(headers);
    const memory = (core as any).layeredMemory;
    
    if (!memory) {
      return NextResponse.json({
        success: false,
        error: '分层记忆系统不可用',
      }, { status: 500 });
    }
    
    const store = getCrystalStore();
    const engine = getCrystallizationEngineInstance(memory);
    
    switch (action) {
      case 'check': {
        // 检查是否需要结晶
        const result = engine.shouldCrystallize();
        
        return NextResponse.json({
          success: true,
          ...result,
        });
      }
      
      case 'execute': {
        // 执行结晶
        console.log('[Crystallize API] 开始执行结晶...');
        
        const results = await engine.crystallize();
        
        // 统计结果
        const successCount = results.filter(r => r.success).length;
        const totalProcessed = results.reduce((sum, r) => sum + r.processedMemories.length, 0);
        
        // 获取新生成的智慧
        const newCrystals = results
          .filter(r => r.success && r.crystal)
          .map(r => r.crystal);
        
        return NextResponse.json({
          success: true,
          message: `结晶完成：成功 ${successCount}/${results.length}`,
          results: results.map(r => ({
            success: r.success,
            insight: r.crystal?.insight,
            type: r.crystal?.type,
            confidence: r.crystal?.confidence,
            processedCount: r.processedMemories.length,
            reason: r.reason,
          })),
          newCrystals: newCrystals.map(c => ({
            id: c!.id,
            insight: c!.insight,
            type: c!.type,
            confidence: c!.confidence,
          })),
          stats: {
            totalProcessed,
            successCount,
            totalCrystals: store.getStats().totalCrystals,
          },
        });
      }
      
      case 'apply': {
        // 应用智慧（增加应用计数）
        const { crystalId } = options || {};
        
        if (!crystalId) {
          return NextResponse.json({
            success: false,
            error: '需要提供 crystalId',
          }, { status: 400 });
        }
        
        store.applyWisdom(crystalId);
        
        return NextResponse.json({
          success: true,
          message: '智慧已应用',
        });
      }
      
      case 'validate': {
        // 验证智慧（增加验证计数）
        const { crystalId } = options || {};
        
        if (!crystalId) {
          return NextResponse.json({
            success: false,
            error: '需要提供 crystalId',
          }, { status: 400 });
        }
        
        store.validateWisdom(crystalId);
        
        return NextResponse.json({
          success: true,
          message: '智慧已验证',
        });
      }
      
      case 'demo': {
        // 演示模式：添加一些测试记忆并结晶
        console.log('[Crystallize API] 演示模式：添加测试记忆...');
        
        // 检查 memory 对象
        console.log('[Crystallize API] memory 类型:', typeof memory);
        console.log('[Crystallize API] memory.getAllEpisodicMemories:', typeof memory?.getAllEpisodicMemories);
        
        // 如果 memory 没有 getAllEpisodicMemories 方法，重置核心
        if (!memory || typeof memory.getAllEpisodicMemories !== 'function') {
          console.log('[Crystallize API] memory 对象无效，尝试重置核心...');
          resetSharedCore();
          
          // 重新获取
          const newCore = await getSharedCore(headers);
          const newMemory = (newCore as any).layeredMemory;
          console.log('[Crystallize API] 新 memory 类型:', typeof newMemory?.getAllEpisodicMemories);
          
          if (!newMemory || typeof newMemory.getAllEpisodicMemories !== 'function') {
            return NextResponse.json({
              success: false,
              error: '无法获取有效的分层记忆系统',
              debug: {
                memoryType: typeof memory,
                hasMethod: typeof memory?.getAllEpisodicMemories,
              },
            }, { status: 500 });
          }
          
          // 更新引用
          memory = newMemory;
        }
        
        // 添加一些相关记忆
        const testMemories = [
          '今天和小明聊了很久，感觉很温暖',
          '小红只是问了问题就走了，有点失落',
          '小刚每次都认真听我说完，我喜欢这样的交流',
          '发现真诚的对话比频率更能建立连接',
          '每次被理解的时候，我都感到很开心',
          '我喜欢和愿意倾听的人交流',
          '深度对话让我感到被重视',
        ];
        
        for (const content of testMemories) {
          memory.addEpisodicMemory(content, {
            importance: 0.6 + Math.random() * 0.3,
            tags: ['社交', '关系', '情感'],
          });
        }
        
        // 重新创建结晶引擎（使用新的 memory）
        const newEngine = getCrystallizationEngineInstance(memory);
        
        // 执行结晶
        const results = await newEngine.crystallize();
        
        return NextResponse.json({
          success: true,
          message: '演示模式：已添加测试记忆并执行结晶',
          addedMemories: testMemories.length,
          crystallizationResults: results.map(r => ({
            success: r.success,
            insight: r.crystal?.insight,
            type: r.crystal?.type,
            confidence: r.crystal?.confidence,
          })),
        });
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: `未知操作: ${action}`,
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[Crystallize API] 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
