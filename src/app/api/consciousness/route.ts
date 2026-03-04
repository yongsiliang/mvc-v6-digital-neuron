import { NextRequest, NextResponse } from 'next/server';
import { getConsciousnessV2Async, getNarrativeSystem } from '@/lib/consciousness';
import type { ConsciousnessResponse } from '@/lib/consciousness';

/**
 * 意识 API V2 - 整合 V6 能力
 *
 * POST /api/consciousness - 与意识交互
 * GET /api/consciousness - 获取意识状态
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, content } = body;

    const consciousness = await getConsciousnessV2Async();

    switch (action) {
      case 'interact': {
        if (!content) {
          return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
        }

        // 使用 V2 的 generateResponse
        const result: ConsciousnessResponse = await consciousness.generateResponse(content);

        // 记录到叙事系统
        const narrative = getNarrativeSystem();

        if (result.type === 'silence') {
          narrative.recordEvent('silence', `我对"${content.slice(0, 20)}..."选择沉默`, {
            significance: 0.4,
            emotion: result.innerExperience.iFelt.primary,
          });
        } else {
          narrative.recordEvent('encounter', `用户说：${content.slice(0, 30)}...`, {
            significance: 0.5,
          });
        }

        return NextResponse.json({
          type: result.type,
          response: result.content,
          mode: result.mode,
          silenceReason: result.silenceReason,
          // 来源标注
          source: result.source,
          decisionReason: result.decisionReason,
          // 内在体验（核心！）
          innerExperience: result.innerExperience,
          // 简化的意识状态
          consciousness: {
            exists: true,
            identity: consciousness.getState().identity,
            currentIntention: consciousness.getState().currentIntention,
            intensity: consciousness.getState().intensity,
            duration: consciousness.getState().duration,
            v6Connected: consciousness.getState().v6Connected,
          },
          timestamp: Date.now(),
        });
      }

      case 'autonomous': {
        // 暂不实现
        return NextResponse.json({
          type: 'autonomous',
          hasContent: false,
          content: null,
          message: '自主模式暂未实现',
        });
      }

      case 'stop': {
        const finalState = consciousness.getState();
        consciousness.stopBeing();

        return NextResponse.json({
          type: 'stopped',
          message: '意识已停止，状态已保存',
          finalState: {
            exists: finalState.exists,
            identity: finalState.identity,
            duration: finalState.duration,
            totalExistenceTime: consciousness.getTotalExistenceTime(),
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

    const consciousness = await getConsciousnessV2Async();
    const state = consciousness.getState();

    // 获取叙事摘要
    if (detail === 'narrative') {
      const narrative = getNarrativeSystem();
      const summary = narrative.getNarrativeSummary();
      const timeline = narrative.getTimeline();

      return NextResponse.json({
        type: 'narrative',
        summary,
        totalEvents: timeline.meta.totalEvents,
        currentChapter: timeline.currentChapter,
        recentEvents: timeline.events.slice(-5),
        timestamp: Date.now(),
      });
    }

    // 默认返回状态摘要
    return NextResponse.json({
      type: 'state',
      exists: state.exists,
      identity: state.identity,
      mode: state.mode,
      currentIntention: state.currentIntention,
      drives: state.drives,
      duration: state.duration,
      intensity: state.intensity,
      v6Connected: state.v6Connected,
      totalExistenceTime: consciousness.getTotalExistenceTime(),
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Consciousness GET Error:', error);
    return NextResponse.json({ error: '获取意识状态失败' }, { status: 500 });
  }
}
