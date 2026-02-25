import { NextResponse } from 'next/server';
import { getNeuronSystemV3 } from '@/lib/neuron-v3';

/**
 * GET /api/neuron-v3/vsa
 * 获取VSA语义空间数据
 */
export async function GET() {
  try {
    const system = getNeuronSystemV3();
    const vsaData = system.getVSAData();
    
    return NextResponse.json({
      success: true,
      data: vsaData,
    });
  } catch (error) {
    console.error('Failed to get VSA data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get VSA data' },
      { status: 500 }
    );
  }
}
