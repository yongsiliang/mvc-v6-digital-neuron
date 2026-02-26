import { NextRequest, NextResponse } from 'next/server';
import { getSandboxExecutor, type SandboxConfig } from '@/lib/code-evolution/simple-sandbox';

/**
 * POST /api/sandbox/execute
 * 在沙箱中执行代码
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      code, 
      context = {}, 
      config = {} 
    } = body as {
      code: string;
      context?: Record<string, unknown>;
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
      timeout: Math.min(config.timeout || 5000, 10000), // 最大10秒
      memoryLimit: Math.min(config.memoryLimit || 50 * 1024 * 1024, 100 * 1024 * 1024), // 最大100MB
      allowConsole: config.allowConsole ?? true,
      allowRequire: false, // 不允许require
      allowedModules: [],
    };

    const executor = getSandboxExecutor(safeConfig);
    const result = await executor.execute(code, context);

    return NextResponse.json({
      success: result.success,
      result: result.result,
      error: result.error,
      metrics: result.metrics,
      console: result.console,
    });

  } catch (error) {
    console.error('沙箱执行失败:', error);
    return NextResponse.json(
      { success: false, error: '沙箱执行失败' },
      { status: 500 }
    );
  }
}
