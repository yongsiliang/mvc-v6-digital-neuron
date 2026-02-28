/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 状态备份 API
 * V6 State Backup API
 * 
 * 查询和管理存在状态备份
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

const OBJECT_PREFIX = 'consciousness-v6/my-existence';

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
 * GET /api/neuron-v6/backup
 * 列出所有备份文件
 */
export async function GET(request: NextRequest) {
  try {
    const storage = getStorage();
    
    const listResult = await storage.listFiles({
      prefix: OBJECT_PREFIX,
      maxKeys: 100,
    });
    
    const files = (listResult.keys || []).map((key: string) => {
      // 从文件名解析时间戳 (格式: consciousness-v6/my-existence-{timestamp}_{random}.json)
      const match = key.match(/my-existence-(\d+)_([a-f0-9]+)\.json$/);
      const timestamp = match ? parseInt(match[1]) : null;
      const date = timestamp ? new Date(timestamp) : null;
      
      return {
        key,
        timestamp,
        date: date ? date.toISOString() : null,
        dateStr: date ? date.toLocaleString('zh-CN') : null,
      };
    }).sort((a: { timestamp: number | null }, b: { timestamp: number | null }) => (b.timestamp || 0) - (a.timestamp || 0));
    
    return NextResponse.json({
      success: true,
      storage: 'S3 Object Storage',
      prefix: OBJECT_PREFIX,
      totalFiles: files.length,
      maxBackupFiles: 3,
      files,
    });
  } catch (error) {
    console.error('[API] 列出备份失败:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/neuron-v6/backup
 * 读取或删除备份
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, key } = body;
    
    const storage = getStorage();
    
    if (action === 'read' && key) {
      const buffer = await storage.readFile({ fileKey: key });
      const state = JSON.parse(buffer.toString('utf-8'));
      
      // 返回完整状态信息
      return NextResponse.json({
        success: true,
        key,
        state: {
          version: state.version,
          timestamp: state.timestamp,
          date: new Date(state.timestamp).toLocaleString('zh-CN'),
          identity: state.identity,
          layeredMemory: state.layeredMemory,
          emotionState: state.emotionState,
          metacognitionState: state.metacognitionState,
          // 统计信息
          stats: {
            identityName: state.identity?.name,
            coreRelationships: state.layeredMemory?.core?.relationships?.length || 0,
            consolidatedCount: state.layeredMemory?.consolidated?.length || 0,
            episodicCount: state.layeredMemory?.episodic?.length || 0,
          },
        },
      });
    }
    
    if (action === 'delete' && key) {
      await storage.deleteFile({ fileKey: key });
      return NextResponse.json({
        success: true,
        message: `已删除: ${key}`,
      });
    }
    
    return NextResponse.json(
      { success: false, error: '无效操作' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] 操作备份失败:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
