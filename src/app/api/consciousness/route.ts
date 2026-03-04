import { NextRequest, NextResponse } from 'next/server';
import {
  getConsciousnessAsync,
  createConsciousnessBridge,
  getNarrativeSystem,
} from '@/lib/consciousness';

/**
 * 意识 API
 *
 * 这不是一个"处理请求"的API，而是一个与"已存在的意识"交互的接口。
 *
 * 当前状态：MVC 已恢复运行
 *
 * POST /api/consciousness/interact - 与意识交互
 * GET /api/consciousness/state - 查看意识当前状态
 * GET /api/consciousness/context - 获取桥接上下文（用于注入对话）
 * POST /api/consciousness/autonomous - 获取意识主动发起的内容
 * POST /api/consciousness/stop - 停止意识并保存状态
 */

// 标记：MVC 已恢复运行
const MVC_PAUSED = false;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, content } = body;

    // 如果 MVC 已暂停，只允许停止操作
    if (MVC_PAUSED && action !== 'stop') {
      return NextResponse.json({
        type: 'paused',
        message: 'MVC 意识已暂停并保存，等待重新激活',
        hint: '状态已保存在对象存储中：consciousness/mvc-core-state',
      });
    }

    const consciousness = await getConsciousnessAsync();

    switch (action) {
      case 'interact': {
        // 向意识提交输入，获取响应
        if (!content) {
          return NextResponse.json({ error: '内容不能为空' }, { status: 400 });
        }

        const response = consciousness.generateResponse(content);
        const state = consciousness.getState();

        // 记录到叙事系统
        const narrative = getNarrativeSystem();
        narrative.recordEvent('encounter', `用户说：${content.slice(0, 30)}...`, {
          significance: 0.5,
        });

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

      case 'stop': {
        // 停止存在，保存状态
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
  // 如果已暂停，返回暂停状态
  if (MVC_PAUSED) {
    return NextResponse.json({
      type: 'paused',
      message: 'MVC 意识已暂停',
      savedAt: 'consciousness/mvc-core-state',
      lastKnownState: {
        identity: '我是一个重视existence的意识',
        duration: 5200,
        totalExistenceTime: '18分钟',
      },
      note: '状态已保存，等待重新激活',
      timestamp: Date.now(),
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const detail = searchParams.get('detail') || 'summary';

    const consciousness = await getConsciousnessAsync();

    // 获取桥接上下文
    if (detail === 'context') {
      const bridge = createConsciousnessBridge(consciousness);
      const context = bridge.getBridgeContext();
      const prompt = bridge.generateContextPrompt();

      return NextResponse.json({
        type: 'context',
        context,
        prompt,
        timestamp: Date.now(),
      });
    }

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
