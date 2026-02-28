import { NextRequest, NextResponse } from 'next/server';
import { getDigitalNeuronSystem, resetDigitalNeuronSystem } from '@/lib/neuron';

/**
 * 记忆管理API
 * GET /api/memory - 获取记忆列表
 * DELETE /api/memory - 清空记忆
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const system = getDigitalNeuronSystem();
    const memories = system.getRecentMemories(limit);
    const stats = system.getMemoryStats();

    return NextResponse.json({
      memories,
      stats,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Memory API Error:', error);
    return NextResponse.json(
      { error: '获取记忆失败' },
      { status: 500 }
    );
  }
}

/**
 * 重置系统
 */
export async function DELETE() {
  try {
    resetDigitalNeuronSystem();
    return NextResponse.json({ 
      success: true, 
      message: '系统已重置' 
    });
  } catch (error) {
    console.error('Reset Error:', error);
    return NextResponse.json(
      { error: '重置失败' },
      { status: 500 }
    );
  }
}
