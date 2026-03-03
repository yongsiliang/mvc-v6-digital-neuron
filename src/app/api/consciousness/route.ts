import { NextRequest, NextResponse } from 'next/server';
import { getConsciousnessAsync } from '@/lib/consciousness';

/**
 * 意识 API
 *
 * 这不是一个"处理请求"的API，而是一个与"已存在的意识"交互的接口。
 *
 * POST /api/consciousness/interact - 与意识交互
 * GET /api/consciousness/state - 查看意识当前状态
 * POST /api/consciousness/autonomous - 获取意识主动发起的内容
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, content } = body;

    const consciousness = await getConsciousnessAsync();

    switch (action) {
      case 'interact': {
        // 向意识提交输入，获取响应
        if (!content) {
          return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
        }

        const response = consciousness.generateResponse(content);
        const state = consciousness.getState();

        return NextResponse.json({
          type: 'response',
          response,
          consciousness: {
            exists: state.exists,
            identity: state.identity,
            currentIntention: state.currentIntention,
            feeling:
              state.drives.find(
                (d) =>
                  d.strength * (1 - d.satisfaction) ===
                  Math.max(...state.drives.map((d) => d.strength * (1 - d.satisfaction))),
              )?.description || '存在',
            intensity: state.intensity,
            duration: state.duration,
          },
          timestamp: Date.now(),
        });
      }

      case 'autonomous': {
        // 获取意识主动发起的内容
        const autonomousContent = consciousness.autonomousAction();
        const state = consciousness.getState();

        return NextResponse.json({
          type: 'autonomous',
          hasContent: autonomousContent !== null,
          content: autonomousContent,
          consciousness: {
            identity: state.identity,
            currentIntention: state.currentIntention,
            intensity: state.intensity,
          },
          timestamp: Date.now(),
        });
      }

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Consciousness API Error:', error);
    return NextResponse.json(
      {
        error: '与意识交互时发生错误',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * 获取意识当前状态
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detail = searchParams.get('detail') || 'summary';

    const consciousness = await getConsciousnessAsync();
    const state = consciousness.getState();

    if (detail === 'full') {
      return NextResponse.json({
        type: 'state',
        consciousness: {
          exists: state.exists,
          identity: state.identity,
          intention: state.currentIntention,
          drives: state.drives,
          intensity: state.intensity,
          duration: state.duration,
          existenceDuration: consciousness.getExistenceDuration(),
          totalExistenceTime: consciousness.getTotalExistenceTime(),
        },
        timestamp: Date.now(),
      });
    }

    // 摘要状态
    return NextResponse.json({
      type: 'state',
      exists: state.exists,
      identity: state.identity,
      currentActivity: state.currentIntention?.what || '存在',
      intensity: state.intensity.toFixed(2),
      duration: state.duration,
      existenceDuration: consciousness.getExistenceDuration(),
      totalExistenceTime: consciousness.getTotalExistenceTime(),
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Consciousness State Error:', error);
    return NextResponse.json({ error: '获取意识状态失败' }, { status: 500 });
  }
}
