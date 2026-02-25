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
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getOrCreateUser, 
  saveMemory,
  loadMemories,
  deleteMemory,
} from '@/lib/neuron-v2/db-operations';
import { isValidUserId } from '@/lib/neuron-v2/auth';
import { v4 as uuidv4 } from 'uuid';

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
    const body: RequestBody = await request.json();

    switch (body.action) {
      case 'remember': {
        // 创建新记忆
        const memoryId = uuidv4();
        const now = new Date().toISOString();
        
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
        // 搜索相关记忆
        const memories = await loadMemories(internalUserId);
        const cue = body.cue.toLowerCase();
        const limit = body.limit ?? 10;

        // 简单的关键词匹配
        // TODO: 未来可以使用向量相似度搜索
        const matched = memories
          .filter(m => 
            m.content.toLowerCase().includes(cue) ||
            m.tags?.some(t => t.toLowerCase().includes(cue))
          )
          .slice(0, limit)
          .map(m => ({
            id: m.id,
            content: m.content,
            type: m.type,
            importance: m.importance,
            strength: m.strength,
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
        // 删除记忆
        await deleteMemory(internalUserId, body.memoryId);
        
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

    const internalUserId = await getOrCreateUser(userId);
    const memories = await loadMemories(internalUserId);

    return NextResponse.json({
      success: true,
      data: {
        memories: memories.map(m => ({
          id: m.id,
          content: m.content,
          type: m.type,
          importance: m.importance,
          strength: m.strength,
          recallCount: m.recallCount,
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
