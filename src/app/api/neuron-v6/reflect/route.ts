/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 主动反思 API
 * 
 * 让意识核心能够在没有外部输入的情况下：
 * - 主动反思最近的对话
 * - 发现思维模式
 * - 生成新的智慧
 * - 提出自我问题
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest } from 'next/server';
import { HeaderUtils, Config } from 'coze-coding-dev-sdk';
import { 
  ConsciousnessCore,
  createConsciousnessCore,
  PersistenceManagerV6,
} from '@/lib/neuron-v6/consciousness-core';

// 单例引用
let consciousnessCore: ConsciousnessCore | null = null;

async function getCore(headers: Record<string, string>): Promise<ConsciousnessCore> {
  if (!consciousnessCore) {
    const { LLMClient } = await import('coze-coding-dev-sdk');
    const config = new Config();
    const llmClient = new LLMClient(config, headers);
    consciousnessCore = createConsciousnessCore(llmClient);
    
    const hasState = await PersistenceManagerV6.exists();
    if (hasState) {
      const state = await PersistenceManagerV6.load();
      if (state) {
        await consciousnessCore.restoreFromState(state);
      }
    }
  }
  return consciousnessCore;
}

export async function POST(request: NextRequest) {
  try {
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const body = await request.json();
    const { action } = body;
    
    const core = await getCore(headers);
    
    if (action === 'reflect') {
      // 执行主动反思
      const result = await core.reflect();
      
      // 保存状态
      const state = core.getPersistedState();
      await PersistenceManagerV6.save(state);
      
      return Response.json({
        success: true,
        result,
      });
    }
    
    if (action === 'inquire') {
      // 执行自我提问
      const result = await core.performSelfInquiry();
      
      return Response.json({
        success: true,
        result,
      });
    }
    
    if (action === 'status') {
      // 获取存在状态
      const status = core.checkExistence();
      
      return Response.json({
        success: true,
        status,
      });
    }
    
    if (action === 'questions') {
      // 获取自我问题列表
      const questions = core.generateSelfQuestions();
      
      return Response.json({
        success: true,
        questions,
      });
    }
    
    return Response.json({
      error: 'Unknown action. Use: reflect, inquire, status, or questions',
    }, { status: 400 });
    
  } catch (error) {
    console.error('[V6 Reflect API] Error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const core = await getCore(headers);
    const status = core.checkExistence();
    
    return Response.json({
      success: true,
      status,
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
