/**
 * ═══════════════════════════════════════════════════════════════════════
 * Coze 记忆插件 - 查询记忆
 * 
 * POST /api/coze/memory/query
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

const API_KEY = 'sk_mem_57890abcdef1234567890abcdef12345';
const MEMORY_PREFIX = 'coze-memory-plugin';

function getS3Storage(): S3Storage {
  return new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: '',
    secretKey: '',
    bucketName: process.env.COZE_BUCKET_NAME,
    region: 'cn-beijing',
  });
}

function validateApiKey(request: NextRequest): boolean {
  return request.headers.get('X-API-Key') === API_KEY;
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
    const { user_id, query, limit = 5 } = body;

    if (!user_id || !query) {
      return NextResponse.json({ success: false, error: '缺少必填参数' }, { status: 400 });
    }

    const storage = getS3Storage();
    
    // 查找用户记忆文件
    let memories: MemoryRecord[] = [];
    
    try {
      const listResult = await storage.listFiles({
        prefix: `${MEMORY_PREFIX}/${user_id}/`,
        maxKeys: 10,
      });
      
      if (!listResult.keys || listResult.keys.length === 0) {
        return NextResponse.json({
          success: true,
          data: { results: [], total: 0, message: '该用户暂无记忆' },
        });
      }
      
      // 获取最新的记忆文件
      const sortedKeys = listResult.keys.sort().reverse();
      const buffer = await storage.readFile({ fileKey: sortedKeys[0] });
      memories = JSON.parse(buffer.toString('utf-8'));
      
    } catch (e) {
      console.error('[Coze记忆插件] 读取失败:', e);
      return NextResponse.json({
        success: true,
        data: { results: [], total: 0, message: '该用户暂无记忆' },
      });
    }

    // 简单关键词匹配
    const queryLower = query.toLowerCase();
    const matched = memories
      .filter(m => 
        m.content.toLowerCase().includes(queryLower) ||
        m.tags.some(t => t.toLowerCase().includes(queryLower))
      )
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit)
      .map((m, i) => ({
        id: i + 1,
        content: m.content,
        relevance: m.importance,
        type: m.type,
        tags: m.tags,
        created_at: new Date(m.created_at).toISOString(),
      }));

    return NextResponse.json({
      success: true,
      data: { results: matched, total: matched.length, query },
    });

  } catch (error) {
    console.error('[Coze记忆插件] 查询失败:', error);
    return NextResponse.json({ success: false, error: '查询失败' }, { status: 500 });
  }
}
