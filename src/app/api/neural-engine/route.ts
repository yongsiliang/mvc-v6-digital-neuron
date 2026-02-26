/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经计算引擎 API
 * 
 * 提供真正的神经网络计算能力
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNeuralEngineAdapter, NeuralEngineAdapter } from '@/lib/neural-engine';

// ─────────────────────────────────────────────────────────────────────
// GET: 获取引擎状态
// ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'default-user';
    const adapter = getNeuralEngineAdapter(userId);

    // 如果未初始化，先初始化
    if (!adapter.getEngineStatus().initialized) {
      await adapter.initialize();
    }

    const status = adapter.getEngineStatus();

    return NextResponse.json({
      success: true,
      status: {
        ...status,
        backend: status.useGPU ? 'GPU (TensorFlow)' : 'CPU (TensorFlow)',
        realNeuralNetwork: status.enabled,
      },
    });
  } catch (error) {
    console.error('[NeuralEngine API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// POST: 处理输入
// ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'default-user';
    const body = await request.json();

    const adapter = getNeuralEngineAdapter(userId);

    // 如果未初始化，先初始化
    if (!adapter.getEngineStatus().initialized) {
      await adapter.initialize();
    }

    const { action, data } = body;

    switch (action) {
      case 'process': {
        // 处理输入向量
        const { inputVector, context } = data;
        const result = await adapter.processInput(inputVector, context);

        return NextResponse.json({
          success: true,
          result: {
            activations: Object.fromEntries(result.activations),
            predictionErrors: Object.fromEntries(result.predictionErrors),
            surprises: result.surprises,
            attention: Object.fromEntries(result.attention),
            consciousContent: result.consciousContent,
            learningResult: result.learningResult,
            processingTime: result.processingTime,
            metadata: {
              usedRealNeuralNetwork: result.usedRealNeuralNetwork,
              gpuEnabled: result.gpuEnabled,
              computeDevice: result.computeDevice,
            },
          },
        });
      }

      case 'reward': {
        // 应用奖励信号
        const { reward, neuronIds } = data;
        await adapter.applyReward(reward, neuronIds);

        return NextResponse.json({
          success: true,
          message: 'Reward applied successfully',
        });
      }

      case 'export': {
        // 导出权重
        const weights = await adapter.exportWeights();

        return NextResponse.json({
          success: true,
          weights,
        });
      }

      case 'import': {
        // 导入权重
        const { weights } = data;
        await adapter.importWeights(weights);

        return NextResponse.json({
          success: true,
          message: 'Weights imported successfully',
        });
      }

      case 'init-neurons': {
        // 初始化神经元
        const { neurons } = data;
        const result = await adapter.syncFromV3Neurons(neurons);

        return NextResponse.json({
          success: result.success,
          neuronCount: result.neuronCount,
          conceptCount: result.conceptCount,
          error: result.error,
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[NeuralEngine API] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
