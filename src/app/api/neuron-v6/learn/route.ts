/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 长期学习 API
 * 
 * 执行跨会话的长期学习：
 * - 知识沉淀
 * - 信念演化
 * - 特质成长
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { PersistenceManagerV6 } from '@/lib/neuron-v6/consciousness-core';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';

export async function POST(request: NextRequest) {
  try {
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await getSharedCore(headers);
    
    // 执行长期学习
    const result = await core.performLongTermLearning();
    
    // 保存更新后的状态
    const state = core.getPersistedState();
    await PersistenceManagerV6.save(state);
    
    return Response.json({
      success: true,
      result,
      message: '长期学习完成，状态已保存',
    });
    
  } catch (error) {
    console.error('[V6 Learn API] Error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
