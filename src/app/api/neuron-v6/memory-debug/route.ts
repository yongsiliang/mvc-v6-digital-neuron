/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 内存状态调试 API
 * 检查当前运行时的分层记忆状态
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';
import { HeaderUtils } from 'coze-coding-dev-sdk';

export async function GET(request: NextRequest) {
  try {
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await getSharedCore(headers);
    
    // 获取持久化状态
    const state = core.getPersistedState();
    
    // 详细检查分层记忆状态
    const layeredMemoryState = state.layeredMemoryState;
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      
      // 统计信息
      stats: state.layeredMemory,
      
      // 分层记忆状态是否存在
      hasLayeredMemoryState: !!layeredMemoryState,
      
      // 核心层详情
      core: layeredMemoryState?.core ? {
        creator: layeredMemoryState.core.creator,
        identity: layeredMemoryState.core.identity,
        coreRelationships: layeredMemoryState.core.coreRelationships,
        coreValues: layeredMemoryState.core.coreValues,
        corePreferences: layeredMemoryState.core.corePreferences,
        version: layeredMemoryState.core.version,
      } : null,
      
      // 记忆数量
      consolidatedCount: layeredMemoryState?.consolidated?.length || 0,
      episodicCount: layeredMemoryState?.episodic?.length || 0,
      
      // 完整的分层记忆状态（用于调试）
      layeredMemoryState,
      
      // 身份信息
      identity: state.identity,
    });
  } catch (error) {
    console.error('[API] 获取内存状态失败:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
