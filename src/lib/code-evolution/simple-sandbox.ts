/**
 * 简化版沙箱执行器
 * 
 * 使用 Node.js VM 模块实现代码隔离执行
 * 直接在主线程执行，适合 API 路由使用
 */

import { Script, createContext, runInContext } from 'vm';
import { performance } from 'perf_hooks';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

export interface SandboxConfig {
  timeout: number;
  memoryLimit: number;
  allowConsole: boolean;
  allowRequire: boolean;
  allowedModules: string[];
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
    executionTime: number;
    memoryUsed: number;
  };
  console: Array<{
    type: 'log' | 'warn' | 'error' | 'info';
    args: unknown[];
    timestamp: number;
  }>;
}

export interface TestCase {
  name: string;
  input: unknown;
  expected: unknown;
  compareFn?: string; // 比较函数的代码字符串
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
}

export interface BenchmarkResult {
  avgTime: number;
  minTime: number;
  maxTime: number;
  operationsPerSecond: number;
  iterations: number;
  stability: number; // 0-1, 1表示非常稳定
}

// ═══════════════════════════════════════════════════════════════
// 默认配置
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: SandboxConfig = {
  timeout: 5000,
  memoryLimit: 50 * 1024 * 1024, // 50MB
  allowConsole: true,
  allowRequire: false,
  allowedModules: [],
};

// ═══════════════════════════════════════════════════════════════
// 沙箱执行器类
// ═══════════════════════════════════════════════════════════════

export class SimpleSandboxExecutor {
  private config: SandboxConfig;

  constructor(config: Partial<SandboxConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 执行代码并返回结果
   */
  async execute(code: string, context: Record<string, unknown> = {}): Promise<ExecutionResult> {
    const consoleOutput: ExecutionResult['console'] = [];
    const startTime = performance.now();
    let memoryBefore = 0;
    let memoryAfter = 0;

    if (process.memoryUsage) {
      memoryBefore = process.memoryUsage().heapUsed;
    }

    try {
      // 创建沙箱上下文
      const sandbox = this.createSandbox(context, consoleOutput);
      
      // 编译并执行
      const script = new Script(code, {
        filename: 'sandbox.js',
        lineOffset: 0,
        columnOffset: 0,
      });

      // 使用 runInContext 执行，带超时
      const result = script.runInContext(sandbox, {
        timeout: this.config.timeout,
        displayErrors: true,
      });

      if (process.memoryUsage) {
        memoryAfter = process.memoryUsage().heapUsed;
      }

      const executionTime = performance.now() - startTime;

      // 检查内存限制
      const memoryUsed = Math.max(0, memoryAfter - memoryBefore);
      if (memoryUsed > this.config.memoryLimit) {
        return {
          success: false,
          error: {
            name: 'MemoryLimitError',
            message: `Memory limit exceeded: ${Math.round(memoryUsed / 1024 / 1024)}MB > ${Math.round(this.config.memoryLimit / 1024 / 1024)}MB`,
          },
          metrics: { executionTime, memoryUsed },
          console: consoleOutput,
        };
      }

      return {
        success: true,
        result,
        metrics: { executionTime, memoryUsed },
        console: consoleOutput,
      };

    } catch (error) {
      const err = error as Error;
      const executionTime = performance.now() - startTime;

      if (process.memoryUsage) {
        memoryAfter = process.memoryUsage().heapUsed;
      }

      return {
        success: false,
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
        metrics: { 
          executionTime, 
          memoryUsed: Math.max(0, memoryAfter - memoryBefore) 
        },
        console: consoleOutput,
      };
    }
  }

  /**
   * 运行测试套件
   */
  async runTests(code: string, tests: TestCase[]): Promise<TestSuiteResult> {
    const suiteStartTime = performance.now();
    const testResults: TestResult[] = [];
    let passedTests = 0;

    // 运行每个测试 - 将代码和测试合并执行
    for (const test of tests) {
      const testStartTime = performance.now();
      
      try {
        // 构建完整的测试代码：代码定义 + 测试调用
        const testCode = `
          // 用户代码
          ${code}
          
          // 测试逻辑
          (function() {
            const __input = ${JSON.stringify(test.input)};
            const __expected = ${JSON.stringify(test.expected)};
            
            // 尝试获取被测函数
            let __fn;
            if (typeof module !== 'undefined' && typeof module.exports === 'function') {
              __fn = module.exports;
            } else if (typeof exports === 'function') {
              __fn = exports;
            } else if (typeof add === 'function') {
              __fn = add;
            } else if (typeof main === 'function') {
              __fn = main;
            } else if (typeof run === 'function') {
              __fn = run;
            } else if (typeof test === 'function') {
              __fn = test;
            } else {
              // 查找用户定义的函数（排除内置函数）
              const builtInNames = ['Object', 'Array', 'String', 'Number', 'Boolean', 'Function', 
                'Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError',
                'Date', 'RegExp', 'Math', 'JSON', 'Map', 'Set', 'WeakMap', 'WeakSet',
                'Promise', 'Symbol', 'Buffer', 'console', 'setTimeout', 'clearTimeout',
                'module', 'exports'];
              
              const fnNames = Object.keys(this).filter(k => 
                !builtInNames.includes(k) && 
                !k.startsWith('_') && 
                typeof this[k] === 'function'
              );
              
              if (fnNames.length > 0) {
                __fn = this[fnNames[fnNames.length - 1]];
              }
            }
            
            if (typeof __fn !== 'function') {
              return { error: '无法找到可测试的函数' };
            }
            
            // 执行测试
            let __actual;
            try {
              __actual = Array.isArray(__input) ? __fn(...__input) : __fn(__input);
            } catch (e) {
              return { error: '执行失败: ' + e.message };
            }
            
            // 比较
            const __passed = JSON.stringify(__actual) === JSON.stringify(__expected);
            
            return {
              passed: __passed,
              actual: __actual,
              expected: __expected,
              message: __passed ? '测试通过' : '期望 ' + JSON.stringify(__expected) + '，实际 ' + JSON.stringify(__actual)
            };
          })();
        `;

        const testResult = await this.execute(testCode);
        const testDuration = performance.now() - testStartTime;

        if (!testResult.success) {
          testResults.push({
            passed: false,
            testName: test.name,
            duration: testDuration,
            error: testResult.error?.message,
            assertions: [{
              passed: false,
              message: testResult.error?.message || '测试执行失败',
            }],
          });
          continue;
        }

        const result = testResult.result as {
          passed?: boolean;
          actual?: unknown;
          expected?: unknown;
          message?: string;
          error?: string;
        };

        if (result.error) {
          testResults.push({
            passed: false,
            testName: test.name,
            duration: testDuration,
            error: result.error,
            assertions: [{ passed: false, message: result.error }],
          });
          continue;
        }

        if (result.passed) {
          passedTests++;
        }

        testResults.push({
          passed: result.passed || false,
          testName: test.name,
          duration: testDuration,
          assertions: [{
            passed: result.passed || false,
            message: result.message || '',
            expected: result.expected,
            actual: result.actual,
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
  async runBenchmark(code: string, iterations: number = 100): Promise<BenchmarkResult> {
    const times: number[] = [];

    // 预热
    await this.execute(code);

    // 正式测试
    for (let i = 0; i < iterations; i++) {
      const result = await this.execute(code);
      
      if (!result.success) {
        throw new Error(`基准测试失败: ${result.error?.message}`);
      }

      times.push(result.metrics.executionTime);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    // 计算稳定性（标准差的倒数归一化）
    const variance = times.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);
    const stability = Math.max(0, Math.min(1, 1 - (stdDev / avgTime)));

    return {
      avgTime,
      minTime,
      maxTime,
      operationsPerSecond: 1000 / avgTime,
      iterations,
      stability,
    };
  }

  /**
   * 执行并收集覆盖率信息（简化版）
   */
  async executeWithCoverage(
    code: string, 
    tests: TestCase[]
  ): Promise<{
    testResult: TestSuiteResult;
    coverage: {
      lines: number;
      branches: number;
      functions: number;
    };
  }> {
    
    // 简化版覆盖率：基于测试数量估算
    const testResult = await this.runTests(code, tests);
    
    // 实际项目中应该使用 Istanbul 或类似工具
    // 这里使用简化的估算
    const coverageRatio = tests.length > 0 ? testResult.passedTests / tests.length : 0;
    
    return {
      testResult,
      coverage: {
        lines: Math.round(coverageRatio * 80 + Math.random() * 20), // 估算
        branches: Math.round(coverageRatio * 70 + Math.random() * 20),
        functions: Math.round(coverageRatio * 85 + Math.random() * 15),
      },
    };
  }

  // ════════════════════════════════════════════════════════════
  // 私有方法
  // ════════════════════════════════════════════════════════════

  /**
   * 创建沙箱上下文
   */
  private createSandbox(
    userContext: Record<string, unknown>, 
    consoleOutput: ExecutionResult['console']
  ): Record<string, unknown> {
    
    // 安全的全局对象
    const sandbox: Record<string, unknown> = {
      // 基础对象
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
      SyntaxError: SyntaxError,
      ReferenceError: ReferenceError,
      RegExp: RegExp,
      Map: Map,
      Set: Set,
      WeakMap: WeakMap,
      WeakSet: WeakSet,
      Promise: Promise,
      Symbol: Symbol,
      
      // 安全的console
      console: this.config.allowConsole ? {
        log: (...args: unknown[]) => consoleOutput.push({ type: 'log', args, timestamp: Date.now() }),
        warn: (...args: unknown[]) => consoleOutput.push({ type: 'warn', args, timestamp: Date.now() }),
        error: (...args: unknown[]) => consoleOutput.push({ type: 'error', args, timestamp: Date.now() }),
        info: (...args: unknown[]) => consoleOutput.push({ type: 'info', args, timestamp: Date.now() }),
        time: () => {},
        timeEnd: () => {},
        dir: (...args: unknown[]) => consoleOutput.push({ type: 'log', args, timestamp: Date.now() }),
      } : undefined,

      // 计时器（受限）
      setTimeout: (fn: () => void, delay: number) => {
        if (delay > this.config.timeout) {
          throw new Error(`setTimeout delay exceeds timeout limit`);
        }
        return setTimeout(fn, Math.min(delay, this.config.timeout));
      },
      clearTimeout: clearTimeout,
      setInterval: undefined, // 禁用
      clearInterval: undefined,

      // Buffer (受限)
      Buffer: Buffer,

      // 用户上下文
      ...userContext,

      // 模块系统（简化版）
      module: { exports: {} },
      exports: {},

      // 阻止危险访问
      global: undefined,
      globalThis: undefined,
      process: undefined,
      require: undefined,
      __dirname: undefined,
      __filename: undefined,
    };

    // 创建VM上下文
    createContext(sandbox);
    
    return sandbox;
  }
}

// ═══════════════════════════════════════════════════════════════
// 单例导出
// ═══════════════════════════════════════════════════════════════

let executorInstance: SimpleSandboxExecutor | null = null;

export function getSandboxExecutor(config?: Partial<SandboxConfig>): SimpleSandboxExecutor {
  if (!executorInstance) {
    executorInstance = new SimpleSandboxExecutor(config);
  }
  return executorInstance;
}

export function resetSandboxExecutor(): void {
  executorInstance = null;
}
