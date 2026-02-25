import { NextResponse } from 'next/server';
import { getNeuronSystemV3 } from '@/lib/neuron-v3';

/**
 * GET /api/neuron-v3/executive
 * 获取执行控制数据
 */
export async function GET() {
  try {
    const system = getNeuronSystemV3();
    const executiveData = system.getExecutiveData();
    
    return NextResponse.json({
      success: true,
      data: executiveData,
    });
  } catch (error) {
    console.error('Failed to get executive data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get executive data' },
      { status: 500 }
    );
  }
}
