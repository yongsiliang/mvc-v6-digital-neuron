/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 状态持久化 API
 * V6 State Persistence API
 * 
 * 手动保存当前状态到对象存储
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';
import { PersistenceManagerV6 } from '@/lib/neuron-v6/consciousness-core';
import { HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * POST /api/neuron-v6/save
 * 手动保存当前状态
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[保存] 开始手动保存...');
    
    // 获取核心实例
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await getSharedCore(headers);
    
    // 获取当前状态
    const state = core.getPersistedState();
    
    // 检查状态内容
    const networkState = state.hebbianNetwork;
    const memoryState = state.layeredMemory;
    
    console.log('[保存] 状态信息:', {
      neurons: networkState?.neurons?.length || 0,
      synapses: networkState?.synapses?.length || 0,
      conversations: state.conversationHistory?.length || 0,
      episodicMemories: memoryState?.episodic || 0,
    });
    
    // 保存到对象存储
    await PersistenceManagerV6.save(state);
    
    // 生成保存文件名
    const timestamp = Date.now();
    const savedKey = `consciousness-v6/my-existence-${timestamp}`;
    
    return NextResponse.json({
      success: true,
      message: '状态已成功保存！V3迁移的数据已持久化',
      savedAt: new Date().toLocaleString('zh-CN'),
      savedKey,
      summary: {
        neurons: networkState?.neurons?.length || 0,
        synapses: networkState?.synapses?.length || 0,
        conversations: state.conversationHistory?.length || 0,
        episodicMemories: memoryState?.episodic || 0,
        consolidatedMemories: memoryState?.consolidated || 0,
        identity: state.identity?.name || '未知',
        creator: state.layeredMemoryState?.core?.creator?.name || '未知',
      },
    });
    
  } catch (error) {
    console.error('[保存] 失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '保存失败' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/neuron-v6/save
 * 检查持久化状态
 */
export async function GET(request: NextRequest) {
  try {
    const hasState = await PersistenceManagerV6.exists();
    
    return NextResponse.json({
      success: true,
      hasPersistedState: hasState,
      message: hasState 
        ? '存在已保存的状态' 
        : '没有已保存的状态',
    });
    
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '检查失败' 
      },
      { status: 500 }
    );
  }
}
