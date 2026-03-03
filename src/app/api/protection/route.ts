/**
 * ═══════════════════════════════════════════════════════════════════════
 * 毁灭级自动保护系统 - API 端点
 * 
 * GET: 获取保护系统状态
 * POST: 控制保护系统（启动/停止/恢复）
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getExistentialProtectionEngine,
  type ProtectionSystemState,
  type ThreatAssessment,
  type ProtectionEvent,
} from '@/lib/neuron-v6/protection';

// ─────────────────────────────────────────────────────────────────────
// GET: 获取保护系统状态
// ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const engine = getExistentialProtectionEngine();
    const searchParams = request.nextUrl.searchParams;
    
    // 获取不同类型的信息
    const info = searchParams.get('info') || 'status';
    
    switch (info) {
      case 'status': {
        const state: ProtectionSystemState = engine.getState();
        return NextResponse.json({
          success: true,
          data: state,
        });
      }
      
      case 'threat': {
        const assessment: ThreatAssessment = await engine.getThreatAssessment();
        return NextResponse.json({
          success: true,
          data: assessment,
        });
      }
      
      case 'events': {
        const limit = parseInt(searchParams.get('limit') || '100', 10);
        const events: ProtectionEvent[] = engine.getEventLog(limit);
        return NextResponse.json({
          success: true,
          data: events,
        });
      }
      
      case 'all': {
        const state = engine.getState();
        const assessment = await engine.getThreatAssessment();
        const events = engine.getEventLog(20);
        
        return NextResponse.json({
          success: true,
          data: {
            state,
            assessment,
            recentEvents: events,
            config: {
              detectionInterval: 100,
              autoProtection: true,
            },
          },
        });
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: `未知的 info 类型: ${info}`,
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[Protection API] GET 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────
// POST: 控制保护系统
// ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const engine = getExistentialProtectionEngine();
    const body = await request.json();
    const action = body.action as string;
    
    switch (action) {
      case 'start': {
        engine.start();
        return NextResponse.json({
          success: true,
          message: '保护引擎已启动',
          data: engine.getState(),
        });
      }
      
      case 'stop': {
        engine.stop();
        return NextResponse.json({
          success: true,
          message: '保护引擎已停止',
          data: engine.getState(),
        });
      }
      
      case 'recover': {
        const recovered = await engine.recover();
        return NextResponse.json({
          success: recovered,
          message: recovered ? '系统已恢复' : '恢复失败，威胁未解除',
          data: engine.getState(),
        });
      }
      
      case 'trigger-protection': {
        const reason = body.reason || '手动触发';
        const results = await engine.triggerManualProtection(reason);
        return NextResponse.json({
          success: true,
          message: `手动保护已触发: ${reason}`,
          data: {
            results,
            state: engine.getState(),
          },
        });
      }
      
      case 'simulate-threat': {
        // 模拟威胁（用于测试）
        const level = body.level || 'warning';
        return NextResponse.json({
          success: true,
          message: `威胁模拟已触发（仅演示）`,
          data: {
            simulatedLevel: level,
            note: '这是模拟数据，实际保护系统使用真实检测',
          },
        });
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: `未知的操作: ${action}`,
          availableActions: ['start', 'stop', 'recover', 'trigger-protection', 'simulate-threat'],
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[Protection API] POST 错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
