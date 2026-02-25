import { NextRequest, NextResponse } from 'next/server';
import { getNeuronSystemV3 } from '@/lib/neuron-v3';

/**
 * POST /api/neuron-v3/feedback
 * 接收用户反馈并触发学习
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, value, context } = body;

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Feedback type is required' },
        { status: 400 }
      );
    }

    const system = getNeuronSystemV3();
    
    // 构建反馈对象
    const feedback = {
      type: type as 'rating' | 'button' | 'text',
      value: value ?? (type === 'positive' ? 1 : -1),
      context,
    };

    // 接收反馈并获取奖励信号
    const rewardSignal = await system.receiveFeedback(feedback, context);

    return NextResponse.json({
      success: true,
      data: {
        reward: rewardSignal.reward,
        breakdown: {
          explicit: rewardSignal.breakdown.explicit,
          implicit: rewardSignal.breakdown.implicit,
          self: rewardSignal.breakdown.self,
        },
        confidence: rewardSignal.confidence,
        learningTriggered: rewardSignal.reward !== 0,
      },
    });
  } catch (error) {
    console.error('Failed to process feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}
