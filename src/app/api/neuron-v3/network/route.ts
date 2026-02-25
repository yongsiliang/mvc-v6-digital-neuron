import { NextResponse } from 'next/server';
import { getNeuronSystemV3 } from '@/lib/neuron-v3';

/**
 * GET /api/neuron-v3/network
 * 获取网络拓扑数据
 */
export async function GET() {
  try {
    const system = getNeuronSystemV3();
    const networkData = system.getNetworkTopology();
    
    return NextResponse.json({
      success: true,
      data: networkData,
    });
  } catch (error) {
    console.error('Failed to get network topology:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get network topology' },
      { status: 500 }
    );
  }
}
