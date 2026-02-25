/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经元 API - 保存状态
 * Neuron API - Save State
 * 
 * POST /api/neuron/save
 * 
 * 保存用户的完整神经元网络状态
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getOrCreateUser, 
  saveNeuron,
  saveConnection,
  saveMemory,
  saveSelfModel,
} from '@/lib/neuron-v2/db-operations';
import { isValidUserId } from '@/lib/neuron-v2/auth';
import type { SavedNeuron, SavedConnection, SavedMemory } from '@/lib/neuron-v2/persistence';

interface SaveStateRequest {
  neurons: SavedNeuron[];
  connections: SavedConnection[];
  memories: SavedMemory[];
  selfModel?: any;
}

export async function POST(request: NextRequest) {
  try {
    // 获取用户ID
    const userId = request.headers.get('X-User-Id');
    
    if (!userId || !isValidUserId(userId)) {
      return NextResponse.json(
        { error: 'Invalid or missing user ID' },
        { status: 401 }
      );
    }

    // 确保用户存在
    const internalUserId = await getOrCreateUser(userId);

    // 解析请求
    const body: SaveStateRequest = await request.json();

    // 保存神经元
    if (body.neurons?.length > 0) {
      await Promise.all(
        body.neurons.map(n => saveNeuron(internalUserId, n))
      );
    }

    // 保存连接
    if (body.connections?.length > 0) {
      await Promise.all(
        body.connections.map(c => saveConnection(internalUserId, c))
      );
    }

    // 保存记忆
    if (body.memories?.length > 0) {
      await Promise.all(
        body.memories.map(m => saveMemory(internalUserId, m))
      );
    }

    // 保存自我模型
    if (body.selfModel) {
      await saveSelfModel(internalUserId, body.selfModel);
    }

    return NextResponse.json({
      success: true,
      data: {
        savedAt: new Date().toISOString(),
        stats: {
          neurons: body.neurons?.length || 0,
          connections: body.connections?.length || 0,
          memories: body.memories?.length || 0,
        },
      },
    });
  } catch (error) {
    console.error('Failed to save neuron state:', error);
    return NextResponse.json(
      { error: 'Failed to save neuron state', details: String(error) },
      { status: 500 }
    );
  }
}
