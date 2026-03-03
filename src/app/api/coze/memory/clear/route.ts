/**
 * ═══════════════════════════════════════════════════════════════════════
 * Coze 记忆插件 - 清除记忆
 * 
 * POST /api/coze/memory/clear
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

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ success: false, error: '无效的 API Key' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { user_id, confirm } = body;

    if (!user_id || confirm !== true) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    const storage = getS3Storage();
    const memoryKey = `${MEMORY_PREFIX}/${user_id}/memories.json`;
    
    let count = 0;
    try {
      const buffer = await storage.readFile({ fileKey: memoryKey });
      const memories = JSON.parse(buffer.toString('utf-8'));
      count = memories.length;
      await storage.deleteFile({ fileKey: memoryKey });
    } catch {
      return NextResponse.json({
        success: true,
        data: { cleared: 0, message: '该用户暂无记忆' },
      });
    }

    return NextResponse.json({
      success: true,
      data: { cleared: count, message: `已清除 ${count} 条记忆` },
    });

  } catch (error) {
    console.error('[Coze记忆插件] 清除失败:', error);
    return NextResponse.json({ success: false, error: '清除失败' }, { status: 500 });
  }
}
