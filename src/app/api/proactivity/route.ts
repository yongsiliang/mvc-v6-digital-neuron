/**
 * 主动性API
 * 
 * GET: 获取主动性状态
 * POST: 触发主动行为
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProactivitySystem, startProactivity } from '@/lib/neuron/proactivity';
import { getEmotionTracker } from '@/lib/neuron/emotion-tracker';
import { getRelationshipEvolution } from '@/lib/neuron/relationship-evolution';
import { getActiveLearningSystem } from '@/lib/neuron/active-learning';

// 确保主动性系统启动
startProactivity();

/**
 * GET - 获取主动性状态
 */
export async function GET() {
  const system = getProactivitySystem();
  const emotionTracker = getEmotionTracker();
  const relationship = getRelationshipEvolution();
  const learning = getActiveLearningSystem();
  
  // 获取情绪统计
  const emotionStats = emotionTracker.getStats();
  
  // 获取关系状态
  const relationshipState = relationship.getState();
  
  // 获取最近学习
  const learningHistory = learning.getLearningHistory(1);
  
  return NextResponse.json({
    success: true,
    drives: system.getDrives(),
    curiosities: system.getCuriosities(),
    recentThoughts: system.getSpontaneousThoughts(10),
    pendingMessages: system.getPendingMessages(),
    userProfile: system.getUserProfile(),
    emotionStats: {
      dominantEmotion: emotionStats.dominantEmotion,
      averageIntensity: emotionStats.averageIntensity,
      trend: emotionStats.trend,
    },
    relationship: {
      stage: relationshipState.stage,
      depth: relationshipState.depth,
      daysKnown: relationshipState.daysKnown,
      totalInteractions: relationshipState.totalInteractions,
      nextStageProgress: relationshipState.nextStageProgress,
    },
    recentLearning: learningHistory.length > 0 ? {
      topic: learningHistory[0].topic,
      summary: learningHistory[0].summary,
      keyFindings: learningHistory[0].keyFindings,
      timestamp: learningHistory[0].timestamp,
    } : undefined,
  });
}

/**
 * POST - 交互
 */
export async function POST(request: NextRequest) {
  const system = getProactivitySystem();
  const body = await request.json();
  
  const { action } = body;
  
  switch (action) {
    case 'learn':
      // 从用户输入学习好奇目标
      if (body.input) {
        system.learnFromUserInput(body.input);
        system.recordActivity();
      }
      return NextResponse.json({ success: true, message: '已学习' });
      
    case 'satisfy':
      // 满足某个驱动
      if (body.driveId) {
        system.satisfyDrive(body.driveId, body.amount || 0.3);
      }
      return NextResponse.json({ success: true, message: '已满足' });
      
    case 'get_messages':
      // 获取待发送消息
      const messages = system.getPendingMessages();
      return NextResponse.json({ success: true, messages });
      
    default:
      return NextResponse.json({ 
        success: false, 
        message: 'Unknown action' 
      }, { status: 400 });
  }
}
