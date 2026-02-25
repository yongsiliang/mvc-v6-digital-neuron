/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经元 API - 记忆操作
 * Neuron API - Memory Operations
 * 
 * POST /api/neuron/memory
 * 
 * 支持操作：
 * - remember: 记住新内容
 * - recall: 回忆相关内容
 * - forget: 忘记内容
 * 
 * 如果数据库不可用，使用内存存储
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { isValidUserId } from '@/lib/neuron-v2/auth';
import { v4 as uuidv4 } from 'uuid';

// 内存存储（当数据库不可用时使用）
const memoryStore = new Map<string, any[]>();

/**
 * 记忆类型
 */
type MemoryType = 
  | 'episodic'   // 事件记忆
  | 'semantic'   // 语义记忆
  | 'procedural' // 程序记忆
  | 'emotional'; // 情感记忆

interface RememberRequest {
  action: 'remember';
  content: string;
  type?: MemoryType;
  importance?: number;
  tags?: string[];
}

interface RecallRequest {
  action: 'recall';
  cue: string;
  limit?: number;
}

interface ForgetRequest {
  action: 'forget';
  memoryId: string;
}

type RequestBody = RememberRequest | RecallRequest | ForgetRequest;

/**
 * 获取用户的内存存储
 */
function getUserMemories(userId: string): any[] {
  if (!memoryStore.has(userId)) {
    memoryStore.set(userId, []);
  }
  return memoryStore.get(userId)!;
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

    // 解析请求
    const body: RequestBody = await request.json();

    // 尝试使用数据库
    let useDatabase = false;
    try {
      const { getOrCreateUser, saveMemory, loadMemories, deleteMemory } = 
        await import('@/lib/neuron-v2/db-operations');
      useDatabase = true;
    } catch {
      console.log('Database not available, using memory store');
    }

    switch (body.action) {
      case 'remember': {
        const memoryId = uuidv4();
        const now = new Date().toISOString();
        const memory = {
          id: memoryId,
          content: body.content,
          type: body.type || 'episodic',
          importance: body.importance ?? 0.5,
          tags: body.tags || [],
          createdAt: now,
        };

        if (useDatabase) {
          try {
            const { getOrCreateUser, saveMemory } = 
              await import('@/lib/neuron-v2/db-operations');
            const internalUserId = await getOrCreateUser(userId);
            await saveMemory(internalUserId, {
              id: memoryId,
              userId: internalUserId,
              content: body.content,
              type: body.type || 'episodic',
              importance: body.importance ?? 0.5,
              emotionalIntensity: 0,
              emotionalValence: 0,
              strength: 1,
              consolidated: false,
              relatedNeurons: [],
              relatedConnections: [],
              tags: body.tags || [],
              recallCount: 0,
              lastRecalledAt: null,
              createdAt: now,
            });
          } catch (dbError) {
            // 数据库操作失败，回退到内存存储
            console.log('Database operation failed, using memory store:', dbError);
            const memories = getUserMemories(userId);
            memories.push(memory);
          }
        } else {
          // 使用内存存储
          const memories = getUserMemories(userId);
          memories.push(memory);
        }

        return NextResponse.json({
          success: true,
          data: {
            memoryId,
            content: body.content,
            createdAt: now,
          },
        });
      }

      case 'recall': {
        let memories: any[] = [];
        
        if (useDatabase) {
          try {
            const { getOrCreateUser, loadMemories } = 
              await import('@/lib/neuron-v2/db-operations');
            const internalUserId = await getOrCreateUser(userId);
            memories = await loadMemories(internalUserId);
          } catch {
            memories = getUserMemories(userId);
          }
        } else {
          memories = getUserMemories(userId);
        }

        const cue = body.cue.toLowerCase();
        const limit = body.limit ?? 10;

        // 简单的关键词匹配
        const matched = memories
          .filter(m => 
            m.content.toLowerCase().includes(cue) ||
            (m.tags && m.tags.some((t: string) => t.toLowerCase().includes(cue)))
          )
          .slice(0, limit)
          .map(m => ({
            id: m.id,
            content: m.content,
            type: m.type,
            importance: m.importance,
            strength: m.strength || 1,
            createdAt: m.createdAt,
          }));

        return NextResponse.json({
          success: true,
          data: {
            cue: body.cue,
            matches: matched,
            count: matched.length,
          },
        });
      }

      case 'forget': {
        if (useDatabase) {
          try {
            const { getOrCreateUser, deleteMemory } = 
              await import('@/lib/neuron-v2/db-operations');
            const internalUserId = await getOrCreateUser(userId);
            await deleteMemory(internalUserId, body.memoryId);
          } catch {
            // 从内存存储中删除
            const memories = getUserMemories(userId);
            const index = memories.findIndex(m => m.id === body.memoryId);
            if (index >= 0) {
              memories.splice(index, 1);
            }
          }
        } else {
          const memories = getUserMemories(userId);
          const index = memories.findIndex(m => m.id === body.memoryId);
          if (index >= 0) {
            memories.splice(index, 1);
          }
        }
        
        return NextResponse.json({
          success: true,
          data: {
            memoryId: body.memoryId,
            forgotten: true,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Memory operation failed:', error);
    return NextResponse.json(
      { error: 'Memory operation failed', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET - 获取所有记忆
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('X-User-Id');
    
    if (!userId || !isValidUserId(userId)) {
      return NextResponse.json(
        { error: 'Invalid or missing user ID' },
        { status: 401 }
      );
    }

    let memories: any[] = [];
    
    // 尝试使用数据库
    try {
      const { getOrCreateUser, loadMemories } = 
        await import('@/lib/neuron-v2/db-operations');
      const internalUserId = await getOrCreateUser(userId);
      memories = await loadMemories(internalUserId);
    } catch {
      // 使用内存存储
      memories = getUserMemories(userId);
    }

    return NextResponse.json({
      success: true,
      data: {
        memories: memories.map(m => ({
          id: m.id,
          content: m.content,
          type: m.type,
          importance: m.importance,
          strength: m.strength || 1,
          recallCount: m.recallCount || 0,
          createdAt: m.createdAt,
        })),
        count: memories.length,
      },
    });
  } catch (error) {
    console.error('Failed to load memories:', error);
    return NextResponse.json(
      { error: 'Failed to load memories', details: String(error) },
      { status: 500 }
    );
  }
}
