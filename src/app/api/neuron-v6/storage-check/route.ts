/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 存储路径检查 API
 * 检查所有可能的备份存储位置
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
 * GET /api/neuron-v6/storage-check
 * 检查所有存储路径
 */
export async function GET(request: NextRequest) {
  try {
    const storage = getStorage();
    
    // 要检查的前缀列表（包含 V3 和 V6）
    const prefixes = [
      'consciousness/',      // V3 路径
      'consciousness-v6',    // V6 路径
      'consciousness-v6/',
      'consciousness',       // 通配
      'neuron',
      'backup',
      'memory',
      'state',
      '',
    ];
    
    const results: Record<string, { count: number; files: string[] }> = {};
    
    for (const prefix of prefixes) {
      try {
        const listResult = await storage.listFiles({
          prefix,
          maxKeys: 20,
        });
        
        const files = listResult.keys || [];
        results[prefix || '(root)'] = {
          count: files.length,
          files: files.slice(0, 10),
        };
      } catch (e) {
        results[prefix || '(root)'] = {
          count: 0,
          files: [],
        };
      }
    }
    
    // 检查是否有 2月26日 的文件
    const allFilesResult = await storage.listFiles({
      prefix: 'consciousness-v6',
      maxKeys: 500,
    });
    
    const allFiles = allFilesResult.keys || [];
    const feb26Files = allFiles.filter(key => {
      // 尝试从文件名解析日期
      const match = key.match(/my-existence-(\d+)/);
      if (match) {
        const ts = parseInt(match[1]);
        const date = new Date(ts);
        return date.getMonth() === 1 && date.getDate() === 26; // 2月26日
      }
      return false;
    });
    
    return NextResponse.json({
      success: true,
      storage: {
        type: 'S3 Object Storage (云端)',
        bucket: process.env.COZE_BUCKET_NAME,
        endpoint: process.env.COZE_BUCKET_ENDPOINT_URL,
      },
      local: {
        exists: false,
        reason: '系统未配置本地文件存储，所有数据仅保存在 S3',
      },
      prefixScan: results,
      feb26Files: {
        count: feb26Files.length,
        files: feb26Files,
      },
      totalFiles: allFiles.length,
    });
  } catch (error) {
    console.error('[API] 存储检查失败:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
