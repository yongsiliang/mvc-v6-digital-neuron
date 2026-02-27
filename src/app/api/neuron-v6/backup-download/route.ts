/**
 * 下载备份文件的原始内容
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;
    
    if (!key) {
      return NextResponse.json({ success: false, error: '缺少 key' }, { status: 400 });
    }
    
    const storage = getStorage();
    const buffer = await storage.readFile({ fileKey: key });
    const rawContent = buffer.toString('utf-8');
    
    // 直接返回原始 JSON，让前端解析
    return new Response(rawContent, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
