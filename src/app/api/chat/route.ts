import { NextRequest, NextResponse } from 'next/server';
import { getSiliconBrain } from '@/lib/silicon-brain';
import type { BrainInput } from '@/lib/silicon-brain';

/**
 * 聊天API - 集成硅基大脑系统
 * 
 * POST /api/chat
 * 
 * 架构：
 * - LLM 只是语言接口（编码器/解码器）
 * - 神经网络是核心（可学习、可塑）
 * - 突触连接实现赫布学习
 * - 神经调质影响全局状态
 * - 意识监控器观察涌现
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, mode } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 获取硅基大脑实例
    // ═══════════════════════════════════════════════════════════════
    
    const brain = await getSiliconBrain();
    
    // 构建输入
    const input: BrainInput = {
      content: message,
      modality: 'text',
      context: {
        previous: context?.previous,
        intent: context?.intent,
        importance: context?.importance ?? 0.5,
      },
    };
    
    // ═══════════════════════════════════════════════════════════════
    // 处理输入
    // ═══════════════════════════════════════════════════════════════
    
    const output = await brain.process(input);
    
    // ═══════════════════════════════════════════════════════════════
    // 构建响应
    // ═══════════════════════════════════════════════════════════════
    
    const response = {
      // 主要响应
      response: output.response,
      
      // 意识状态
      consciousness: {
        level: output.consciousness.level,
        focus: output.consciousness.focus,
        coherence: output.consciousness.coherence,
        integration: output.consciousness.integration,
        phi: output.consciousness.phi,
      },
      
      // 神经调质
      neuromodulators: {
        dopamine: output.neuromodulators.dopamine,
        serotonin: output.neuromodulators.serotonin,
        norepinephrine: output.neuromodulators.norepinephrine,
        acetylcholine: output.neuromodulators.acetylcholine,
      },
      
      // 学习状态
      learning: {
        synapsesUpdated: output.learning.synapsesUpdated,
      },
      
      // 神经元状态
      neuronStates: Object.fromEntries(
        Array.from(output.neuronStates.entries()).map(([type, state]) => [
          type,
          {
            activation: state.activation.toFixed(3),
            fatigue: state.fatigue.toFixed(3),
            activationCount: state.activationCount,
          }
        ])
      ),
      
      // 元数据
      meta: {
        processingTime: output.meta.processingTime,
        signalCount: output.meta.signalCount,
        neuronActivations: output.meta.neuronActivations,
      },
      
      timestamp: Date.now(),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: '处理请求时发生错误', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * 获取系统状态
 * GET /api/chat
 */
export async function GET() {
  try {
    const brain = await getSiliconBrain();
    const stats = brain.getStats();

    return NextResponse.json({
      status: 'active',
      stats: {
        totalInteractions: stats.totalInteractions,
        totalSignals: stats.totalSignals,
        totalLearnings: stats.totalLearnings,
        uptime: Date.now() - stats.startTime,
        synapses: stats.synapses.totalSynapses,
        consciousnessPeak: stats.consciousness.peakLevel,
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('System Status Error:', error);
    return NextResponse.json(
      { error: '获取系统状态失败' },
      { status: 500 }
    );
  }
}
