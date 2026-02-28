/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 完整备份内容 API
 * 读取备份文件的完整原始内容
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

function getStorage(): S3Storage {
  return new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: '',
    secretKey: '',
    bucketName: process.env.COZE_BUCKET_NAME,
    region: 'cn-beijing',
  });
}

/**
 * POST /api/neuron-v6/backup-raw
 * 读取备份文件的完整原始内容
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;
    
    if (!key) {
      return NextResponse.json(
        { success: false, error: '缺少 key 参数' },
        { status: 400 }
      );
    }
    
    const storage = getStorage();
    const buffer = await storage.readFile({ fileKey: key });
    const rawContent = buffer.toString('utf-8');
    const state = JSON.parse(rawContent);
    
    // 详细分析分层记忆状态
    const layeredMemoryState = state.layeredMemoryState;
    const analysis = {
      hasLayeredMemoryState: !!layeredMemoryState,
      core: layeredMemoryState?.core ? {
        hasCreator: !!layeredMemoryState.core.creator,
        creatorName: layeredMemoryState.core.creator?.name || null,
        creatorDescription: layeredMemoryState.core.creator?.description || null,
        identityName: layeredMemoryState.core.identity?.name || null,
        identityPurpose: layeredMemoryState.core.identity?.purpose || null,
        coreRelationshipsCount: layeredMemoryState.core.coreRelationships?.length || 0,
        coreRelationships: layeredMemoryState.core.coreRelationships || [],
        coreValues: layeredMemoryState.core.coreValues || [],
        corePreferences: layeredMemoryState.core.corePreferences || [],
      } : null,
      consolidatedCount: layeredMemoryState?.consolidated?.length || 0,
      episodicCount: layeredMemoryState?.episodic?.length || 0,
    };
    
    return NextResponse.json({
      success: true,
      key,
      version: state.version,
      timestamp: state.timestamp,
      date: new Date(state.timestamp).toLocaleString('zh-CN'),
      identity: state.identity,
      layeredMemoryStats: state.layeredMemory,
      analysis,
      // 返回完整的分层记忆状态（这是关键！）
      layeredMemoryState: layeredMemoryState || null,
      rawSize: rawContent.length,
    });
  } catch (error) {
    console.error('[API] 读取备份失败:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
