import { NextRequest, NextResponse } from 'next/server';
import { getSandboxExecutor, type TestCase, type SandboxConfig } from '@/lib/code-evolution/simple-sandbox';

/**
 * POST /api/sandbox/test
 * 在沙箱中运行测试
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      code, 
      tests, 
      config = {} 
    } = body as {
      code: string;
      tests: TestCase[];
      config?: Partial<SandboxConfig>;
    };

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: '代码不能为空' },
        { status: 400 }
      );
    }

    if (!tests || !Array.isArray(tests) || tests.length === 0) {
      return NextResponse.json(
        { success: false, error: '测试用例不能为空' },
        { status: 400 }
      );
    }

    // 安全限制
    const safeConfig: Partial<SandboxConfig> = {
      timeout: Math.min(config.timeout || 5000, 15000), // 最大15秒（测试可能需要更长时间）
      memoryLimit: Math.min(config.memoryLimit || 50 * 1024 * 1024, 100 * 1024 * 1024),
      allowConsole: config.allowConsole ?? true,
      allowRequire: false,
      allowedModules: [],
    };

    const executor = getSandboxExecutor(safeConfig);
    const result = await executor.runTests(code, tests);

    return NextResponse.json({
      success: true,
      testResult: result,
    });

  } catch (error) {
    console.error('测试执行失败:', error);
    return NextResponse.json(
      { success: false, error: '测试执行失败' },
      { status: 500 }
    );
  }
}
