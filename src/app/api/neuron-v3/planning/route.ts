import { NextResponse } from 'next/server';
import { getNeuronSystemV3 } from '@/lib/neuron-v3';

/**
 * GET /api/neuron-v3/planning
 * 获取计划/目标数据
 */
export async function GET() {
  try {
    const system = getNeuronSystemV3();
    const planningData = system.getPlanningData();
    
    return NextResponse.json({
      success: true,
      data: planningData,
    });
  } catch (error) {
    console.error('Failed to get planning data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get planning data' },
      { status: 500 }
    );
  }
}
