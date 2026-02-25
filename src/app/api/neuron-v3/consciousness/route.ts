import { NextResponse } from 'next/server';
import { getNeuronSystemV3 } from '@/lib/neuron-v3';

/**
 * GET /api/neuron-v3/consciousness
 * 获取意识内容数据
 */
export async function GET() {
  try {
    const system = getNeuronSystemV3();
    const consciousnessState = system.getConsciousnessState();
    
    if (!consciousnessState) {
      return NextResponse.json({
        success: true,
        data: {
          currentContent: null,
          consciousnessLevel: 0,
          selfAwarenessIndex: 0,
          streamCoherence: 0,
          trail: [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: consciousnessState,
    });
  } catch (error) {
    console.error('Failed to get consciousness data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get consciousness data' },
      { status: 500 }
    );
  }
}
