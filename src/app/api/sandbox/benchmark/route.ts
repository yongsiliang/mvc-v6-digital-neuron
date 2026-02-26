import { NextRequest, NextResponse } from 'next/server';
import { getSandboxExecutor, type SandboxConfig } from '@/lib/code-evolution/simple-sandbox';

/**
 * POST /api/sandbox/benchmark
 * 在沙箱中运行性能基准测试
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      code, 
      iterations = 100, 
      config = {} 
    } = body as {
      code: string;
      iterations?: number;
      config?: Partial<SandboxConfig>;
    };

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: '代码不能为空' },
        { status: 400 }
      );
    }

    // 安全限制
    const safeConfig: Partial<SandboxConfig> = {
      timeout: Math.min(config.timeout || 1000, 3000), // 单次执行最大3秒
      memoryLimit: Math.min(config.memoryLimit || 50 * 1024 * 1024, 100 * 1024 * 1024),
      allowConsole: false, // 基准测试禁用console
      allowRequire: false,
      allowedModules: [],
    };

    // 限制迭代次数
    const safeIterations = Math.min(Math.max(iterations, 10), 1000);

    const executor = getSandboxExecutor(safeConfig);
    const result = await executor.runBenchmark(code, safeIterations);

    return NextResponse.json({
      success: true,
      benchmark: result,
    });

  } catch (error) {
    console.error('基准测试失败:', error);
    return NextResponse.json(
      { success: false, error: '基准测试失败' },
      { status: 500 }
    );
  }
}
