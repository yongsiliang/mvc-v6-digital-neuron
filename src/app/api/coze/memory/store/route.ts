/**
 * ═══════════════════════════════════════════════════════════════════════
 * Coze 记忆插件 - 存储记忆
 * 
 * POST /api/coze/memory/store
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { v4 as uuidv4 } from 'uuid';

// API Key 验证
const API_KEY = 'sk_mem_57890abcdef1234567890abcdef12345';

// S3 存储配置
function getS3Storage(): S3Storage {
  return new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: '',
    secretKey: '',
    bucketName: process.env.COZE_BUCKET_NAME,
    region: 'cn-beijing',
  });
}

// 记忆文件前缀
const MEMORY_PREFIX = 'coze-memory-plugin';

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('X-API-Key');
  return apiKey === API_KEY;
}

interface MemoryRecord {
  id: string;
  user_id: string;
  content: string;
  tags: string[];
  importance: number;
  type: string;
  created_at: number;
}

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ success: false, error: '无效的 API Key' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { user_id, content, tags = [], importance = 0.5, type = 'fact' } = body;

    if (!user_id || !content) {
      return NextResponse.json({ success: false, error: '缺少必填参数' }, { status: 400 });
    }

    const storage = getS3Storage();
    
    // 创建新记忆
    const memory: MemoryRecord = {
      id: uuidv4(),
      user_id,
      content,
      tags,
      importance,
      type,
      created_at: Date.now(),
    };

    // 获取用户现有记忆
    const memoryFileName = `${MEMORY_PREFIX}/${user_id}/memories-${Date.now()}.json`;
    let memories: MemoryRecord[] = [];
    let memoryKey: string | null = null;
    
    // 尝试读取现有记忆（查找最新的记忆文件）
    try {
      const listResult = await storage.listFiles({
        prefix: `${MEMORY_PREFIX}/${user_id}/`,
        maxKeys: 10,
      });
      
      if (listResult.keys && listResult.keys.length > 0) {
        // 按时间戳排序，获取最新的文件
        const sortedKeys = listResult.keys.sort().reverse();
        memoryKey = sortedKeys[0];
        
        const buffer = await storage.readFile({ fileKey: memoryKey });
        memories = JSON.parse(buffer.toString('utf-8'));
      }
    } catch {
      // 文件不存在，使用空数组
    }

    // 添加新记忆
    memories.push(memory);

    // 保存回 S3
    const newKey = await storage.uploadFile({
      fileContent: Buffer.from(JSON.stringify(memories, null, 2)),
      fileName: memoryFileName,
      contentType: 'application/json',
    });
    
    console.log(`[Coze记忆插件] 已保存记忆到: ${newKey}`);

    return NextResponse.json({
      success: true,
      data: {
        memory_id: memory.id,
        content: content.substring(0, 100),
        tags,
        importance,
        created_at: new Date(memory.created_at).toISOString(),
      },
      message: '记忆已存储',
    });

  } catch (error) {
    console.error('[Coze记忆插件] 存储失败:', error);
    return NextResponse.json({ success: false, error: '存储失败' }, { status: 500 });
  }
}
