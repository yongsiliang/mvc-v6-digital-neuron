/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经元 API - 获取用户状态
 * Neuron API - Get User State
 * 
 * GET /api/neuron/state
 * 
 * 返回用户的完整神经元网络状态
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getOrCreateUser, 
  loadNeurons, 
  loadConnections, 
  loadMemories,
  loadSelfModel,
} from '@/lib/neuron-v2/db-operations';
import { isValidUserId } from '@/lib/neuron-v2/auth';

export async function GET(request: NextRequest) {
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

    // 并行加载所有数据
    const [neurons, connections, memories, selfModel] = await Promise.all([
      loadNeurons(internalUserId),
      loadConnections(internalUserId),
      loadMemories(internalUserId),
      loadSelfModel(internalUserId),
    ]);

    // 返回完整状态
    return NextResponse.json({
      success: true,
      data: {
        neurons: neurons.map(n => ({
          id: n.id,
          label: n.label,
          functionalRole: n.functionalRole,
          activation: n.activation,
          connectionCount: 0, // 需要从连接计算
        })),
        connections: connections.map(c => ({
          id: c.id,
          from: c.from,
          to: c.to,
          strength: c.strength,
          type: c.type,
        })),
        memories: memories.map(m => ({
          id: m.id,
          content: m.content,
          type: m.type,
          importance: m.importance,
          createdAt: m.createdAt,
        })),
        selfModel: selfModel ? {
          coreTraits: selfModel.coreTraits,
          values: selfModel.values,
          beliefs: selfModel.beliefs,
        } : null,
        stats: {
          neuronCount: neurons.length,
          connectionCount: connections.length,
          memoryCount: memories.length,
        },
      },
    });
  } catch (error) {
    console.error('Failed to get neuron state:', error);
    return NextResponse.json(
      { error: 'Failed to get neuron state', details: String(error) },
      { status: 500 }
    );
  }
}
