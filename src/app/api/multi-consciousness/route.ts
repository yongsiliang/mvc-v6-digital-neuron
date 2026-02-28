/**
 * 多意识体协作 API
 * 
 * POST /api/multi-consciousness/process
 * - 使用多意识体协作处理输入
 * 
 * GET /api/multi-consciousness/state
 * - 获取当前系统状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, HeaderUtils } from 'coze-coding-dev-sdk';
import {
  createMultiAgentEngine,
  MultiAgentCollaborationEngine,
  CollaborationResult,
} from '@/lib/neuron-v6/multi-agent-engine';

// 单例引擎实例
let engineInstance: MultiAgentCollaborationEngine | null = null;

/**
 * 获取或创建引擎实例
 */
async function getEngine(headers: Record<string, string>): Promise<MultiAgentCollaborationEngine> {
  if (!engineInstance) {
    const llm = new LLMClient(undefined, headers);
    engineInstance = createMultiAgentEngine(llm);
  }
  return engineInstance;
}

/**
 * 重置引擎
 */
function resetEngine(): void {
  engineInstance = null;
}

/**
 * GET /api/multi-consciousness
 * 获取系统状态
 */
export async function GET(request: NextRequest) {
  try {
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const engine = await getEngine(headers);
    const state = engine.getState();
    
    return NextResponse.json({
      success: true,
      state: {
        activeConsciousnesses: state.activeConsciousnesses.map(c => ({
          id: c.id,
          name: c.name,
          role: c.role,
          status: c.status,
          energyLevel: c.energyLevel,
          expertise: c.expertise,
        })),
        activeResonances: state.activeResonances.map(r => ({
          id: r.id,
          participants: r.participants,
          type: r.type,
          strength: r.strength,
        })),
        activeDialogues: state.activeDialogues.map(d => ({
          id: d.id,
          topic: d.topic,
          status: d.status,
          consensusPoints: d.consensusPoints,
          emergentInsights: d.emergentInsights,
        })),
        collectiveInsights: state.collectiveInsights,
        collectiveAlignment: state.collectiveAlignment,
        synergyLevel: state.synergyLevel,
      },
    });
  } catch (error) {
    console.error('[Multi-Consciousness API] GET 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

/**
 * POST /api/multi-consciousness
 * 处理输入
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, action, reset } = body;
    
    // 重置引擎
    if (reset) {
      resetEngine();
    }
    
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const engine = await getEngine(headers);
    
    // 不同的操作
    switch (action) {
      case 'process':
        // 主处理逻辑
        if (!input) {
          return NextResponse.json({
            success: false,
            error: '输入不能为空',
          }, { status: 400 });
        }
        
        const result = await engine.process(input);
        
        return NextResponse.json({
          success: true,
          result: {
            synthesis: {
              finalOutput: result.synthesis.finalOutput,
              emergentInsights: result.synthesis.emergentInsights,
              contributorRoles: result.synthesis.contributorRoles,
              confidence: result.synthesis.confidence,
            },
            consensus: {
              round: result.consensus.round,
              consensusLevel: result.consensus.consensusLevel,
              innovationLevel: result.consensus.innovationLevel,
              converged: result.consensus.converged,
            },
            resonance: {
              activeCount: result.resonance.activeResonances.length,
              pairCount: result.resonance.agentPairs.length,
            },
            agentsUsed: result.agentsUsed,
            totalRounds: result.totalRounds,
            processingTime: result.processingTime,
          },
        });
        
      case 'state':
        // 获取状态
        const state = engine.getState();
        return NextResponse.json({
          success: true,
          state,
        });
        
      case 'reset':
        // 重置引擎
        resetEngine();
        return NextResponse.json({
          success: true,
          message: '引擎已重置',
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: '未知的操作类型',
          availableActions: ['process', 'state', 'reset'],
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[Multi-Consciousness API] POST 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
