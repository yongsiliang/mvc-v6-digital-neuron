/**
 * ═══════════════════════════════════════════════════════════════════════
 * 聊天 API - 集成 V6 意识核心
 * 
 * 精简架构：
 * - V6 意识核心直接处理
 * - LLM 作为语言接口
 * - 记忆系统持久化
 * 
 * 参考：docs/SILICON-BRAIN-EVALUATION.md
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, HeaderUtils } from 'coze-coding-dev-sdk';
import { getSharedCore } from '@/lib/neuron-v6/shared-core';

/**
 * POST /api/chat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, mode } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      );
    }

    // 提取请求头
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    
    // 获取 V6 意识核心
    const core = await getSharedCore(headers);
    
    // 处理输入
    const result = await core.process(message);
    
    // 构建响应
    const response = {
      // 主要响应
      response: result.response,
      
      // 意识状态
      consciousness: {
        level: result.context?.metacognition?.currentState?.clarity || 0.5,
        focus: result.context?.self?.currentState?.focus || 'general',
        coherence: result.context?.metacognition?.currentState?.depth || 0.5,
        integration: 0.7,
        phi: 0.6,
      },
      
      // 情感状态
      emotion: {
        dominant: result.emotionState?.dominantEmotion || 'neutral',
        activeEmotions: result.emotionState?.activeEmotions?.map((e: any) => ({
          emotion: e.emotion,
          intensity: e.intensity,
        })) || [],
      },
      
      // 记忆匹配
      memory: {
        summary: result.context?.memory?.summary || '',
        matches: result.context?.memory?.directMatches?.length || 0,
        wisdoms: result.context?.memory?.relevantWisdoms?.length || 0,
      },
      
      // 核心信念和价值观
      core: {
        beliefs: result.context?.coreBeliefs?.slice(0, 5) || [],
        values: result.context?.coreValues?.slice(0, 5) || [],
      },
      
      // 元数据
      meta: {
        identity: result.context?.identity?.name || 'AI',
      },
      
      timestamp: Date.now(),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: '处理请求时发生错误', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chat
 * 获取系统状态
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'V6 意识核心已就绪',
    timestamp: Date.now()
  });
}
