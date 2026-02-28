/**
 * ═══════════════════════════════════════════════════════════════════════
 * 图像分析 API
 * 
 * 快速图像理解服务
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import {
  MultimodalInputProcessor,
  ImageAnalysisResult,
} from '@/lib/neuron-v6/multimodal-input';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, description, detail } = body;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'imageUrl 是必需的' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const processor = new MultimodalInputProcessor({ verbose: true }, headers);

    // 处理图像
    const result = await processor.process({
      type: 'image',
      url: imageUrl,
      description,
      detail: detail || 'high',
    });

    return new Response(
      JSON.stringify({
        success: true,
        originalType: result.originalType,
        textContent: result.textContent,
        metadata: result.metadata,
        rawData: result.rawData,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : '图像分析失败',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * 支持的图像格式
 */
export async function GET() {
  return new Response(
    JSON.stringify({
      supportedFormats: ['JPEG', 'PNG', 'GIF', 'WebP'],
      inputMethods: ['URL', 'Base64 Data URI'],
      detailLevels: [
        { level: 'high', description: '详细分析，精度高，速度慢' },
        { level: 'low', description: '快速分析，精度低，速度快' },
      ],
      example: {
        imageUrl: 'https://example.com/image.jpg',
        description: '可选的图像描述',
        detail: 'high',
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
