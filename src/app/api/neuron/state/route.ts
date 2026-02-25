/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经元 API - 获取用户状态
 * Neuron API - Get User State
 * 
 * GET /api/neuron/state
 * 
 * 返回用户的完整神经元网络状态
 * 如果数据库表不存在，返回初始空状态
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { isValidUserId } from '@/lib/neuron-v2/auth';

// 延迟加载数据库操作，避免在数据库未配置时出错
async function getDbOperations() {
  try {
    const { getOrCreateUser, loadNeurons, loadConnections, loadMemories, loadSelfModel } = 
      await import('@/lib/neuron-v2/db-operations');
    return { getOrCreateUser, loadNeurons, loadConnections, loadMemories, loadSelfModel };
  } catch (error) {
    console.error('Failed to load db operations:', error);
    return null;
  }
}

/**
 * 返回初始空状态
 */
function getEmptyState(userId: string) {
  return {
    success: true,
    data: {
      neurons: [],
      connections: [],
      memories: [],
      selfModel: null,
      stats: {
        neuronCount: 0,
        connectionCount: 0,
        memoryCount: 0,
      },
      userId,
      isNewUser: true,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    // 获取用户ID
    const userId = request.headers.get('X-User-Id');
    
    if (!userId || !isValidUserId(userId)) {
      return NextResponse.json(
        { error: 'Invalid or missing user ID. Please provide a valid UUID.' },
        { status: 401 }
      );
    }

    // 尝试获取数据库操作
    const dbOps = await getDbOperations();
    
    // 如果数据库操作不可用，返回空状态
    if (!dbOps) {
      console.log('Database not available, returning empty state');
      return NextResponse.json(getEmptyState(userId));
    }

    const { getOrCreateUser, loadNeurons, loadConnections, loadMemories, loadSelfModel } = dbOps;

    // 尝试确保用户存在并加载数据
    let internalUserId: string;
    try {
      internalUserId = await getOrCreateUser(userId);
    } catch (dbError) {
      console.error('Database error when creating/getting user:', dbError);
      // 数据库表可能不存在，返回空状态
      return NextResponse.json(getEmptyState(userId));
    }

    // 并行加载所有数据
    let neurons: any[] = [];
    let connections: any[] = [];
    let memories: any[] = [];
    let selfModel: any = null;

    try {
      [neurons, connections, memories, selfModel] = await Promise.all([
        loadNeurons(internalUserId).catch(() => []),
        loadConnections(internalUserId).catch(() => []),
        loadMemories(internalUserId).catch(() => []),
        loadSelfModel(internalUserId).catch(() => null),
      ]);
    } catch (loadError) {
      console.error('Error loading data:', loadError);
      // 即使加载失败，也返回空状态而不是错误
    }

    // 返回完整状态
    return NextResponse.json({
      success: true,
      data: {
        neurons: neurons.map(n => ({
          id: n.id,
          label: n.label,
          functionalRole: n.functionalRole,
          activation: n.activation,
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
        userId: internalUserId,
        isNewUser: neurons.length === 0,
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
