import { NextRequest, NextResponse } from 'next/server';
import { getNeuronSystemV3 } from '@/lib/neuron-v3';

/**
 * GET /api/neuron-v3/status
 * 获取系统状态
 */
export async function GET() {
  try {
    const system = getNeuronSystemV3();
    const state = system.getSystemState();
    
    return NextResponse.json({
      success: true,
      data: {
        stats: {
          neuronCount: state.neuronStats.count,
          predictionAccuracy: state.neuronStats.predictionAccuracy * 100,
          totalSurprise: state.neuronStats.totalSurprise,
          learningEvents: state.learningStats.totalLearningEvents,
          totalReward: state.learningStats.totalReward,
          totalPunishment: state.learningStats.totalPunishment,
          consciousnessLevel: state.consciousnessLevel * 100,
          selfAwarenessIndex: state.selfAwarenessIndex * 100,
        },
        initialized: true,
      },
    });
  } catch (error) {
    console.error('Failed to get system status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get system status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/neuron-v3/status
 * 处理输入并返回响应（流式）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, context } = body;

    if (!input) {
      return NextResponse.json(
        { success: false, error: 'Input is required' },
        { status: 400 }
      );
    }

    const system = getNeuronSystemV3();
    
    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 处理输入
          const result = await system.processInput(input, context);
          
          // 发送处理阶段
          const stages = [
            { stage: 'encoding', message: '正在编码输入向量...' },
            { stage: 'prediction', message: '神经元正在预测...' },
            { stage: 'comparison', message: '计算预测误差...' },
            { stage: 'learning', message: '基于反馈调整权重...' },
            { stage: 'meaning', message: '计算主观意义...' },
          ];

          for (const stage of stages) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(stage)}\n\n`));
            await new Promise(resolve => setTimeout(resolve, 300));
          }

          // 发送最终结果
          const response = {
            stage: 'complete',
            message: '处理完成',
            data: {
              activations: Object.fromEntries(result.neuronResponse.activations),
              predictionErrors: Object.fromEntries(result.neuronResponse.predictionErrors),
              meaning: result.meaning ? {
                vector: result.meaning.vector,
                selfRelevance: result.meaning.selfRelevance,
                sentiment: result.meaning.sentiment,
                interpretation: result.meaning.interpretation,
              } : null,
              consciousness: result.consciousness ? {
                type: result.consciousness.type,
                data: result.consciousness.data,
                source: result.consciousness.source,
              } : null,
              learning: {
                adjustedNeurons: result.learning.adjustedNeurons,
                newNeurons: result.learning.newNeurons.length,
                summary: result.learning.summary,
              },
            },
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(response)}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ stage: 'error', message: '处理失败' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Failed to process input:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process input' },
      { status: 500 }
    );
  }
}
