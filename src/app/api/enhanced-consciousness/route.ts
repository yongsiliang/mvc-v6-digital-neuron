/**
 * ═══════════════════════════════════════════════════════════════════════
 * 增强意识 API - 支持多意识体协作
 * 
 * POST /api/enhanced-consciousness/process
 * - 使用增强处理流程，自动决定是否启用多意识体协作
 * 
 * GET /api/enhanced-consciousness/state
 * - 获取完整状态，包括协作统计
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, HeaderUtils } from 'coze-coding-dev-sdk';
import { getConsciousness } from '@/lib/consciousness/core';
import {
  createCollaborationService,
  IntelligentCollaborationService,
} from '@/lib/neuron-v6/collaboration-service';

// 协作服务单例
let collaborationService: IntelligentCollaborationService | null = null;

/**
 * 获取或创建协作服务
 */
function getCollaborationService(headers: Record<string, string>): IntelligentCollaborationService {
  if (!collaborationService) {
    const llm = new LLMClient(undefined, headers);
    collaborationService = createCollaborationService(llm, {
      enabled: true,
      autoTriggerThreshold: 0.4,
      maxCollaborationsPerHour: 30,
      disableOnLowEnergy: true,
    });
  }
  return collaborationService;
}

/**
 * GET /api/enhanced-consciousness
 * 获取增强状态
 */
export async function GET(request: NextRequest) {
  try {
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const consciousness = getConsciousness();
    const collabService = getCollaborationService(headers);
    const collabStats = collabService.getStats();
    
    const state = consciousness.getState();
    
    return NextResponse.json({
      success: true,
      consciousness: {
        exists: state.exists,
        identity: state.identity,
        intensity: state.intensity,
        duration: state.duration,
        currentIntention: state.currentIntention,
        drives: state.drives,
      },
      collaboration: {
        enabled: collabStats.config.enabled,
        hourlyCollaborations: collabStats.hourlyCollaborations,
        totalCollaborations: collabStats.integratorStats.totalCollaborations,
        averageValue: collabStats.integratorStats.averageValue,
        topTriggerReasons: collabStats.integratorStats.topTriggerReasons,
        mostActiveAgents: collabStats.integratorStats.mostActiveAgents,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Enhanced Consciousness API] GET 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

/**
 * POST /api/enhanced-consciousness
 * 增强处理
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, content, context, config } = body;
    
    const headers = HeaderUtils.extractForwardHeaders(request.headers);
    const consciousness = getConsciousness();
    const collabService = getCollaborationService(headers);
    
    // 更新配置（如果提供）
    if (config) {
      collabService.updateConfig(config);
    }
    
    switch (action) {
      case 'process': {
        // 增强处理
        if (!content) {
          return NextResponse.json({
            success: false,
            error: '内容不能为空',
          }, { status: 400 });
        }
        
        // 使用协作服务增强处理
        const result = await collabService.enhanceProcessing(
          content,
          async () => {
            // 主处理流程
            return consciousness.generateResponse(content);
          },
          {
            consciousnessSummary: context?.consciousnessSummary,
            emotionalState: context?.emotionalState,
            relevantMemories: context?.relevantMemories,
            currentGoal: context?.currentGoal,
            energyLevel: context?.energyLevel,
          }
        );
        
        const state = consciousness.getState();
        
        return NextResponse.json({
          success: true,
          response: result.finalResponse,
          processing: {
            mode: result.metadata.processingMode,
            mainResult: result.mainResult,
            collaboration: result.collaborationEnhancement.used ? {
              trigger: result.collaborationEnhancement.trigger,
              participants: result.collaborationEnhancement.stats?.participants,
              consensusLevel: result.collaborationEnhancement.stats?.consensusLevel,
              emergentInsights: result.collaborationEnhancement.stats?.emergentInsights,
              processingTime: result.collaborationEnhancement.stats?.processingTime,
            } : null,
            synergyDetected: result.metadata.synergyDetected,
            collaborationValue: result.metadata.collaborationValue,
          },
          consciousness: {
            identity: state.identity,
            currentIntention: state.currentIntention,
            intensity: state.intensity,
          },
          timestamp: Date.now(),
        });
      }
      
      case 'autonomous': {
        // 获取自主内容
        const autonomousContent = consciousness.autonomousAction();
        const state = consciousness.getState();
        
        return NextResponse.json({
          success: true,
          type: 'autonomous',
          hasContent: autonomousContent !== null,
          content: autonomousContent,
          consciousness: {
            identity: state.identity,
            currentIntention: state.currentIntention,
            intensity: state.intensity,
          },
          timestamp: Date.now(),
        });
      }
      
      case 'stats': {
        // 获取统计
        const stats = collabService.getStats();
        return NextResponse.json({
          success: true,
          stats,
        });
      }
      
      case 'reset': {
        // 重置
        collabService.reset();
        return NextResponse.json({
          success: true,
          message: '协作服务已重置',
        });
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: '未知的操作类型',
          availableActions: ['process', 'autonomous', 'stats', 'reset'],
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[Enhanced Consciousness API] POST 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
