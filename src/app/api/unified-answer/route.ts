/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一答案 API
 * 
 * POST /api/unified-answer
 * - 多意识体内部协作，对外只输出一个统一答案
 * 
 * 用户不会看到：
 * - 协作过程
 * - 意识体讨论
 * - 共识迭代
 * 
 * 用户只会看到：
 * - 一个统一答案
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, HeaderUtils } from 'coze-coding-dev-sdk';
import {
  createUnifiedAnswerService,
  UnifiedAnswerService,
  UnifiedResponse,
} from '@/lib/neuron-v6/unified-answer-service';

// 服务单例
let unifiedAnswerService: UnifiedAnswerService | null = null;

/**
 * 获取或创建统一答案服务
 */
function getUnifiedAnswerService(headers: Record<string, string>): UnifiedAnswerService {
  if (!unifiedAnswerService) {
    const llm = new LLMClient(undefined, headers);
    unifiedAnswerService = createUnifiedAnswerService(llm);
  }
  return unifiedAnswerService;
}

/**
 * POST /api/unified-answer
 * 
 * 请求体：
 * {
 *   "input": "用户的问题或输入"
 * }
 * 
 * 响应体：
 * {
 *   "success": true,
 *   "response": {
 *     "answer": "统一答案",
 *     "confidence": 0.85,
 *     "processingTime": 1234
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input } = body;
    
    if (!input || typeof input !== 'string') {
      return NextResponse.json({
        success: false,
        error: '输入不能为空',
      }, { status: 400 });
    }
    
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const service = getUnifiedAnswerService(headers);
    
    // 处理用户输入，得到统一答案
    const response = await service.process(input);
    
    // 用户只看到这个简洁的响应
    return NextResponse.json({
      success: true,
      response: {
        answer: response.answer,
        confidence: response.confidence,
        processingTime: response.processingTime,
      },
    });
    
  } catch (error) {
    console.error('[UnifiedAnswer API] 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '处理失败',
    }, { status: 500 });
  }
}

/**
 * GET /api/unified-answer
 * 获取服务状态
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    service: 'UnifiedAnswerService',
    description: '多意识体内部协作，对外只输出一个统一答案',
    endpoints: {
      'POST /api/unified-answer': {
        description: '处理用户输入',
        body: { input: 'string' },
        response: {
          success: 'boolean',
          response: {
            answer: 'string',
            confidence: 'number',
            processingTime: 'number',
          },
        },
      },
    },
  });
}
