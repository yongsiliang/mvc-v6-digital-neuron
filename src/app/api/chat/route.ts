import { NextRequest, NextResponse } from 'next/server';
import { getDigitalNeuronSystem } from '@/lib/neuron';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

/**
 * 聊天API - 集成数字神经元系统
 * POST /api/chat
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      );
    }

    // 1. 获取数字神经元系统实例
    const system = getDigitalNeuronSystem();

    // 2. 通过神经元系统处理输入
    const neuronResult = await system.process(message, context);

    // 3. 调用大模型生成响应
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);

    // 使用神经元生成的提示词
    const llmResponse = await llmClient.invoke(neuronResult.promptMessages, {
      model: 'doubao-seed-1-8-251228',
      temperature: 0.7,
    });

    // 4. 构建响应
    const response = {
      response: llmResponse.content,
      meaning: neuronResult.meaning,
      decision: neuronResult.decision,
      selfUpdate: neuronResult.selfUpdate,
      signalPath: neuronResult.signal,
      logs: neuronResult.logs.slice(-20), // 只返回最近20条日志
      timestamp: Date.now()
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
    const system = getDigitalNeuronSystem();
    const snapshot = system.getSnapshot();
    const memoryStats = system.getMemoryStats();

    return NextResponse.json({
      snapshot,
      memoryStats,
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
