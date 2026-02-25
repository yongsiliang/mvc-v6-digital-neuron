import { NextResponse } from 'next/server';
import { getNeuronSystemV3 } from '@/lib/neuron-v3';

/**
 * GET /api/neuron-v3/background
 * 获取后台处理（系统1）的状态数据
 * 
 * 系统1特性：
 * - 快速、自动、无意识
 * - 基于模式匹配
 * - 输出直觉信号
 */
export async function GET() {
  try {
    const system = getNeuronSystemV3();
    
    // 获取后台处理器状态
    const backgroundStats = system.getBackgroundStats();
    
    // 获取最近的直觉信号
    const recentIntuitions = system.getRecentIntuitions(5);
    
    // 获取准备状态
    const readiness = system.getReadiness();

    return NextResponse.json({
      success: true,
      data: {
        stats: backgroundStats,
        recentIntuitions,
        readiness: {
          primedCount: readiness.primedNeurons.size,
          predictedNext: readiness.predictedNext,
          readinessLevel: readiness.readinessLevel,
          timestamp: readiness.timestamp,
        },
      },
    });
  } catch (error) {
    console.error('Failed to get background processing data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get background processing data' },
      { status: 500 }
    );
  }
}
