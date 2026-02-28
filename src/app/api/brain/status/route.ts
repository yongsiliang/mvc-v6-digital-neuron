import { NextRequest, NextResponse } from 'next/server';
import { getSiliconBrain } from '@/lib/silicon-brain';

/**
 * 大脑状态API - 详细状态和监控
 * 
 * GET /api/brain/status - 获取完整状态
 * POST /api/brain/status - 执行操作（休息、导出等）
 */
export async function GET(request: NextRequest) {
  try {
    const brain = await getSiliconBrain();
    const { searchParams } = new URL(request.url);
    const detail = searchParams.get('detail') || 'summary';
    
    const stats = brain.getStats();
    
    if (detail === 'full') {
      // 完整状态
      const exported = await brain.exportState();
      
      return NextResponse.json({
        status: 'active',
        stats,
        exported,
        timestamp: Date.now(),
      });
    }
    
    // 摘要状态
    return NextResponse.json({
      status: 'active',
      interactions: stats.totalInteractions,
      signals: stats.totalSignals,
      learnings: stats.totalLearnings,
      synapses: stats.synapses.totalSynapses,
      consciousness: {
        peak: stats.consciousness.peakLevel.toFixed(3),
        average: stats.consciousness.averageLevel.toFixed(3),
      },
      language: {
        encodings: stats.language.encodings,
        decodings: stats.language.decodings,
      },
      uptime: Date.now() - stats.startTime,
      timestamp: Date.now(),
    });
    
  } catch (error) {
    console.error('Brain Status Error:', error);
    return NextResponse.json(
      { error: '获取大脑状态失败' },
      { status: 500 }
    );
  }
}

/**
 * 执行大脑操作
 * 
 * 操作类型：
 * - rest: 休息，重置疲劳
 * - export: 导出完整状态
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    const brain = await getSiliconBrain();
    
    switch (action) {
      case 'rest':
        brain.rest();
        return NextResponse.json({
          success: true,
          message: '大脑已休息，疲劳已重置',
        });
        
      case 'export':
        const exported = await brain.exportState();
        return NextResponse.json({
          success: true,
          data: exported,
        });
        
      default:
        return NextResponse.json(
          { error: '未知操作' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Brain Action Error:', error);
    return NextResponse.json(
      { error: '执行操作失败' },
      { status: 500 }
    );
  }
}
