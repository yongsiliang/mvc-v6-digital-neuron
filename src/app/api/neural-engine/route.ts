/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经计算引擎 API
 * 
 * 提供真正的神经网络计算能力
 * 
 * 注意：TensorFlow.js 的原生模块只能在服务端使用
 * ═══════════════════════════════════════════════════════════════════════
 */

import { NextRequest, NextResponse } from 'next/server';

// 全局缓存（在热重载时保持状态）
declare global {
  // eslint-disable-next-line no-var
  var neuralEngineCache: Map<string, Awaited<ReturnType<typeof import('@/lib/neural-engine').getNeuralEngineAdapter>>> | undefined;
}

// 确保全局缓存存在
if (!globalThis.neuralEngineCache) {
  globalThis.neuralEngineCache = new Map();
}

// 动态导入 TensorFlow.js 相关模块（服务端专用）
async function getNeuralEngine() {
  // 使用动态导入来确保只在服务端加载
  const { getNeuralEngineAdapter } = await import('@/lib/neural-engine');
  
  // 返回一个使用全局缓存的包装函数
  return (userId: string) => {
    if (!globalThis.neuralEngineCache!.has(userId)) {
      globalThis.neuralEngineCache!.set(userId, getNeuralEngineAdapter(userId));
    }
    return globalThis.neuralEngineCache!.get(userId)!;
  };
}

// ─────────────────────────────────────────────────────────────────────
// GET: 获取引擎状态
// ─────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'default-user';
    const getAdapter = await getNeuralEngine();
    const adapter = getAdapter(userId);

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
        note: 'TensorFlow.js neural engine requires Node.js runtime',
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
    
    const getAdapter = await getNeuralEngine();
    const adapter = getAdapter(userId);

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
        
        // 确保神经元格式正确
        const formattedNeurons = (neurons || []).map((n: { id: string; label: string; role: string; level?: number }, i: number) => ({
          id: n.id || `neuron-${i}`,
          label: n.label || `Neuron ${i}`,
          role: n.role || 'semantic',
          meta: { level: n.level ?? 0 }
        }));
        
        const result = await adapter.syncFromV3Neurons(formattedNeurons);

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
        stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined,
      },
      { status: 500 }
    );
  }
}

// 强制使用 Node.js runtime（TensorFlow.js 需要）
export const runtime = 'nodejs';
