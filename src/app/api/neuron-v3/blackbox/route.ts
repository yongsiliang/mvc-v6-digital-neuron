import { NextResponse } from 'next/server';
import { getNeuronSystemV3 } from '@/lib/neuron-v3';

/**
 * GET /api/neuron-v3/blackbox
 * 获取黑盒状态 - 只有模糊信息，永远不暴露内部
 */
export async function GET() {
  try {
    const system = getNeuronSystemV3();
    const blackBoxState = system.getBlackBoxState();
    
    return NextResponse.json({
      success: true,
      data: blackBoxState,
      // 永远不解释这个消息
      message: '⚫ 某些事物注定不可知',
    });
  } catch (error) {
    console.error('Failed to get black box state:', error);
    return NextResponse.json(
      { success: false, error: '黑盒拒绝响应' },
      { status: 500 }
    );
  }
}
