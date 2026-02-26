/**
 * 沙箱执行引擎
 * 
 * 使用 Node.js VM 模块实现代码隔离执行
 * 使用 Worker Threads 实现资源限制
 */

import { parentPort, workerData } from 'worker_threads';
import { Script, createContext } from 'vm';
import { performance } from 'perf_hooks';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

export interface SandboxConfig {
  timeout: number;          // 执行超时（毫秒）
  memoryLimit: number;      // 内存限制（字节）
  cpuLimit: number;         // CPU时间限制（毫秒）
  allowConsole: boolean;    // 是否允许console
  allowRequire: boolean;    // 是否允许require
  allowedModules: string[]; // 允许的模块列表
}

export interface ExecutionResult {
  success: boolean;
  result?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metrics: {
    executionTime: number;  // 执行时间（毫秒）
    memoryUsed: number;     // 内存使用（字节）
    operationsCount: number; // 操作计数
  };
  console: Array<{
    type: 'log' | 'warn' | 'error' | 'info';
    args: unknown[];
    timestamp: number;
  }>;
}

export interface TestResult {
  passed: boolean;
  testName: string;
  duration: number;
  error?: string;
  assertions: Array<{
    passed: boolean;
    message: string;
    expected?: unknown;
    actual?: unknown;
  }>;
}

export interface TestSuiteResult {
  suiteName: string;
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  tests: TestResult[];
  coverage?: {
    lines: number;
    branches: number;
    functions: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// 默认配置
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: SandboxConfig = {
  timeout: 5000,
  memoryLimit: 50 * 1024 * 1024, // 50MB
  cpuLimit: 1000,
  allowConsole: true,
  allowRequire: false,
  allowedModules: [],
};

// ═══════════════════════════════════════════════════════════════
// 沙箱执行器
// ═══════════════════════════════════════════════════════════════

export class SandboxExecutor {
  private config: SandboxConfig;
  private consoleOutput: ExecutionResult['console'] = [];
  private operationsCount = 0;
  private startTime = 0;
  private memoryCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<SandboxConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 执行代码
   */
  async execute(code: string, context: Record<string, unknown> = {}): Promise<ExecutionResult> {
    this.consoleOutput = [];
    this.operationsCount = 0;
    this.startTime = performance.now();

    let memoryBefore = 0;
    let memoryAfter = 0;
    
    try {
      // 获取执行前内存
      if (process.memoryUsage) {
        memoryBefore = process.memoryUsage().heapUsed;
      }

      // 创建沙箱上下文
      const sandbox = this.createSandbox(context);

      // 设置内存监控
      this.setupMemoryMonitor();

      // 编译脚本
      const script = new Script(code, {
        filename: 'sandbox.js',
      });

      // 执行脚本（带超时）
      const result = await this.executeWithTimeout(script, sandbox);

      // 清理内存监控
      this.cleanupMemoryMonitor();

      // 获取执行后内存
      if (process.memoryUsage) {
        memoryAfter = process.memoryUsage().heapUsed;
      }

      const executionTime = performance.now() - this.startTime;

      return {
        success: true,
        result,
        metrics: {
          executionTime,
          memoryUsed: Math.max(0, memoryAfter - memoryBefore),
          operationsCount: this.operationsCount,
        },
        console: this.consoleOutput,
      };

    } catch (error) {
      this.cleanupMemoryMonitor();

      const err = error as Error;
      const executionTime = performance.now() - this.startTime;

      return {
        success: false,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
        metrics: {
          executionTime,
          memoryUsed: 0,
          operationsCount: this.operationsCount,
        },
        console: this.consoleOutput,
      };
    }
  }

  /**
   * 执行测试用例
   */
  async runTests(code: string, tests: Array<{
    name: string;
    input: unknown;
    expected: unknown;
    compareFn?: (actual: unknown, expected: unknown) => boolean;
  }>): Promise<TestSuiteResult> {
    
    const suiteStartTime = performance.now();
    const testResults: TestResult[] = [];
    let passedTests = 0;

    // 先执行代码，获取导出
    const execResult = await this.execute(code);
    
    if (!execResult.success) {
      return {
        suiteName: 'Sandbox Tests',
        passed: false,
        totalTests: tests.length,
        passedTests: 0,
        failedTests: tests.length,
        duration: performance.now() - suiteStartTime,
        tests: tests.map(t => ({
          passed: false,
          testName: t.name,
          duration: 0,
          error: '代码执行失败: ' + (execResult.error?.message || '未知错误'),
          assertions: [],
        })),
      };
    }

    // 运行每个测试
    for (const test of tests) {
      const testStartTime = performance.now();
      
      try {
        // 执行测试函数
        const testCode = `
          (function(__exports, __input) {
            try {
              const result = typeof __exports === 'function' 
                ? __exports(__input) 
                : __exports;
              return { success: true, result };
            } catch (e) {
              return { success: false, error: e.message };
            }
          })
        `;
        
        const testFnResult = await this.execute(testCode);
        
        if (!testFnResult.success || !testFnResult.result) {
          throw new Error(testFnResult.error?.message || '测试函数创建失败');
        }

        // 在沙箱中调用测试函数
        const callCode = `(${testCode})(${JSON.stringify(execResult.result)}, ${JSON.stringify(test.input)})`;
        const callResult = await this.execute(callCode);
        
        const testDuration = performance.now() - testStartTime;
        
        if (!callResult.success) {
          testResults.push({
            passed: false,
            testName: test.name,
            duration: testDuration,
            error: callResult.error?.message,
            assertions: [{
              passed: false,
              message: '测试执行失败',
            }],
          });
          continue;
        }

        const actualResult = (callResult.result as { result?: unknown })?.result;
        const compareFn = test.compareFn || ((a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b));
        const passed = compareFn(actualResult, test.expected);

        if (passed) {
          passedTests++;
        }

        testResults.push({
          passed,
          testName: test.name,
          duration: testDuration,
          error: passed ? undefined : '断言失败',
          assertions: [{
            passed,
            message: `期望 ${JSON.stringify(test.expected)}，实际 ${JSON.stringify(actualResult)}`,
            expected: test.expected,
            actual: actualResult,
          }],
        });

      } catch (error) {
        const err = error as Error;
        testResults.push({
          passed: false,
          testName: test.name,
          duration: performance.now() - testStartTime,
          error: err.message,
          assertions: [{
            passed: false,
            message: err.message,
          }],
        });
      }
    }

    const suiteDuration = performance.now() - suiteStartTime;

    return {
      suiteName: 'Sandbox Tests',
      passed: passedTests === tests.length,
      totalTests: tests.length,
      passedTests,
      failedTests: tests.length - passedTests,
      duration: suiteDuration,
      tests: testResults,
    };
  }

  /**
   * 运行性能基准测试
   */
  async runBenchmark(code: string, iterations: number = 100): Promise<{
    avgTime: number;
    minTime: number;
    maxTime: number;
    operationsPerSecond: number;
    memoryLeak: boolean;
  }> {
    
    const times: number[] = [];
    let initialMemory = 0;
    let finalMemory = 0;

    if (process.memoryUsage) {
      initialMemory = process.memoryUsage().heapUsed;
    }

    for (let i = 0; i < iterations; i++) {
      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }

      const result = await this.execute(code);
      
      if (!result.success) {
        throw new Error(`基准测试失败: ${result.error?.message}`);
      }

      times.push(result.metrics.executionTime);
    }

    if (process.memoryUsage) {
      finalMemory = process.memoryUsage().heapUsed;
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    return {
      avgTime,
      minTime,
      maxTime,
      operationsPerSecond: 1000 / avgTime,
      memoryLeak: (finalMemory - initialMemory) > 1024 * 1024, // 1MB阈值
    };
  }

  // ════════════════════════════════════════════════════════════
  // 私有方法
  // ════════════════════════════════════════════════════════════

  /**
   * 创建沙箱上下文
   */
  private createSandbox(userContext: Record<string, unknown>): Record<string, unknown> {
    const self = this;

    // 基础全局对象（安全版本）
    const sandboxGlobal: Record<string, unknown> = {
      // 数学和基础对象
      Math: Math,
      Date: Date,
      JSON: JSON,
      Array: Array,
      Object: Object,
      String: String,
      Number: Number,
      Boolean: Boolean,
      Error: Error,
      TypeError: TypeError,
      RangeError: RangeError,
      RegExp: RegExp,
      
      // 安全的console
      console: this.config.allowConsole ? {
        log: (...args: unknown[]) => self.captureConsole('log', args),
        warn: (...args: unknown[]) => self.captureConsole('warn', args),
        error: (...args: unknown[]) => self.captureConsole('error', args),
        info: (...args: unknown[]) => self.captureConsole('info', args),
      } : undefined,

      // 计时器（带限制）
      setTimeout: (fn: () => void, delay: number) => {
        self.operationsCount++;
        if (delay > self.config.timeout) {
          throw new Error(`setTimeout delay ${delay} exceeds timeout limit ${self.config.timeout}`);
        }
        return setTimeout(fn, Math.min(delay, self.config.timeout));
      },
      clearTimeout: clearTimeout,
      setInterval: (fn: () => void, delay: number) => {
        self.operationsCount++;
        if (delay > self.config.timeout) {
          throw new Error(`setInterval delay ${delay} exceeds timeout limit`);
        }
        return setInterval(fn, Math.min(delay, self.config.timeout));
      },
      clearInterval: clearInterval,

      // Promise
      Promise: Promise,

      // 用户上下文
      ...userContext,

      // 模块系统（如果允许）
      require: this.config.allowRequire 
        ? this.createSafeRequire() 
        : undefined,

      // 防止访问全局对象
      global: undefined,
      globalThis: undefined,
      process: undefined,
      __dirname: undefined,
      __filename: undefined,
      exports: {},
      module: { exports: {} },
    };

    // 创建VM上下文
    createContext(sandboxGlobal);
    
    return sandboxGlobal;
  }

  /**
   * 创建安全的require函数
   */
  private createSafeRequire(): ((module: string) => unknown) | undefined {
    const allowed = this.config.allowedModules;
    
    return (moduleName: string) => {
      if (!allowed.includes(moduleName)) {
        throw new Error(`Module "${moduleName}" is not allowed. Allowed modules: ${allowed.join(', ')}`);
      }
      
      try {
        // 只允许内置模块
        return require(moduleName);
      } catch {
        throw new Error(`Cannot find module "${moduleName}"`);
      }
    };
  }

  /**
   * 带超时执行
   */
  private async executeWithTimeout(script: Script, sandbox: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Execution timeout: exceeded ${this.config.timeout}ms`));
      }, this.config.timeout);

      try {
        // 使用 script.runInContext 执行
        const result = script.runInContext(sandbox, {
          timeout: this.config.timeout,
          displayErrors: true,
        });

        clearTimeout(timeoutId);

        // 处理 Promise
        if (result instanceof Promise) {
          result
            .then((res) => resolve(res))
            .catch((err) => reject(err));
        } else {
          resolve(result);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * 设置内存监控
   */
  private setupMemoryMonitor(): void {
    if (!process.memoryUsage) return;

    this.memoryCheckInterval = setInterval(() => {
      const memory = process.memoryUsage();
      
      if (memory.heapUsed > this.config.memoryLimit) {
        this.cleanupMemoryMonitor();
        throw new Error(`Memory limit exceeded: ${memory.heapUsed} > ${this.config.memoryLimit}`);
      }
    }, 100);
  }

  /**
   * 清理内存监控
   */
  private cleanupMemoryMonitor(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  /**
   * 捕获console输出
   */
  private captureConsole(type: ExecutionResult['console'][0]['type'], args: unknown[]): void {
    this.consoleOutput.push({
      type,
      args,
      timestamp: Date.now(),
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// Worker Thread 入口
// ═══════════════════════════════════════════════════════════════

// 检查是否在 Worker Thread 中运行
if (parentPort && workerData) {
  const { code, config, context, type, tests } = workerData as {
    code: string;
    config: SandboxConfig;
    context?: Record<string, unknown>;
    type: 'execute' | 'test' | 'benchmark';
    tests?: Array<{ name: string; input: unknown; expected: unknown }>;
    iterations?: number;
  };

  const executor = new SandboxExecutor(config);

  (async () => {
    try {
      let result: ExecutionResult | TestSuiteResult | object;

      switch (type) {
        case 'test':
          result = await executor.runTests(code, tests || []);
          break;
        case 'benchmark':
          result = await executor.runBenchmark(code, workerData.iterations);
          break;
        default:
          result = await executor.execute(code, context);
      }

      parentPort?.postMessage({ success: true, result });
    } catch (error) {
      const err = error as Error;
      parentPort?.postMessage({ 
        success: false, 
        error: { name: err.name, message: err.message } 
      });
    }
  })();
}
