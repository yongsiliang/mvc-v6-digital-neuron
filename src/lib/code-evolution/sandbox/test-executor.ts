/**
 * 测试执行器
 * 
 * 在沙箱中执行完整的测试套件，包括：
 * - 编译测试
 * - 单元测试
 * - 集成测试
 * - 性能测试
 * - 能力测试
 * - 边界测试
 * - 模糊测试
 * - 回归测试
 */

import type {
  SandboxManager,
  SandboxId,
} from './sandbox-manager';

import type {
  TestSuite,
  TestSuiteResult,
  TestCase,
  PerformanceTest,
  CapabilityTest,
  FuzzConfig,
  TestResult,
  TestContext,
  Module,
  PerformanceMetric,
  PerformanceRegression,
  FuzzCrash,
  UnitTestResult,
  IntegrationTestResult,
  PerformanceTestResult,
  CapabilityTestResult,
  BoundaryTestResult,
  FuzzTestResult,
  RegressionTestResult,
  InteractionError,
  EdgeCase,
  RegressionInfo,
} from '../types/core';

// ═══════════════════════════════════════════════════════════════
// 进化候选
// ═══════════════════════════════════════════════════════════════

export interface EvolutionCandidate {
  id: string;
  module: Module;
  code: string;
  fitness?: number;
}

// ═══════════════════════════════════════════════════════════════
// 测试执行器
// ═══════════════════════════════════════════════════════════════

export class TestExecutor {
  
  private sandboxManager: SandboxManager;
  
  constructor(sandboxManager: SandboxManager) {
    this.sandboxManager = sandboxManager;
  }
  
  // ════════════════════════════════════════════════════════════
  // 完整测试套件执行
  // ════════════════════════════════════════════════════════════
  
  /**
   * 执行完整测试套件
   */
  async executeTestSuite(
    candidate: EvolutionCandidate,
    testSuite: TestSuite
  ): Promise<TestSuiteResult> {
    
    // 创建沙箱
    const sandbox = await this.sandboxManager.createSandbox({
      memory: 1024 * 1024 * 1024,  // 1GB
      time: 60000,                  // 60s
    });
    
    try {
      // ─────────────────────────────────────────────────────
      // Phase 1: 编译测试
      // ─────────────────────────────────────────────────────
      const compileResult = await this.testCompilation(sandbox.id, candidate);
      if (!compileResult.success) {
        return { 
          passed: false, 
          phase: 'compilation', 
          error: compileResult.error 
        };
      }
      
      // ─────────────────────────────────────────────────────
      // Phase 2: 单元测试
      // ─────────────────────────────────────────────────────
      const unitResult = await this.runUnitTests(
        sandbox.id, 
        candidate, 
        testSuite.unit
      );
      if (!unitResult.allPassed) {
        return { 
          passed: false, 
          phase: 'unit', 
          unitTests: unitResult,
          failedTests: unitResult.failed 
        };
      }
      
      // ─────────────────────────────────────────────────────
      // Phase 3: 集成测试
      // ─────────────────────────────────────────────────────
      const integrationResult = await this.runIntegrationTests(
        sandbox.id,
        candidate,
        testSuite.integration
      );
      if (!integrationResult.allPassed) {
        return { 
          passed: false, 
          phase: 'integration',
          integrationTests: integrationResult,
          failedTests: integrationResult.failed 
        };
      }
      
      // ─────────────────────────────────────────────────────
      // Phase 4: 性能测试
      // ─────────────────────────────────────────────────────
      const performanceResult = await this.runPerformanceTests(
        sandbox.id,
        candidate,
        testSuite.performance
      );
      if (!performanceResult.meetsBaseline) {
        return {
          passed: false,
          phase: 'performance',
          performanceTests: performanceResult,
          regressions: performanceResult.regressions.map(r => ({
            test: r.test,
            oldBehavior: `baseline: ${r.baseline}ms`,
            newBehavior: `actual: ${r.actual}ms`,
            isBreaking: r.deviation > 0.2, // 20%以上偏差视为破坏性
          })),
        };
      }
      
      // ─────────────────────────────────────────────────────
      // Phase 5: 能力测试
      // ─────────────────────────────────────────────────────
      const capabilityResult = await this.runCapabilityTests(
        sandbox.id,
        candidate,
        testSuite.capability
      );
      if (!capabilityResult.preserved) {
        return {
          passed: false,
          phase: 'capability',
          capabilityTests: capabilityResult,
          failedTests: capabilityResult.lostCapabilities,
        };
      }
      
      // ─────────────────────────────────────────────────────
      // Phase 6: 边界测试
      // ─────────────────────────────────────────────────────
      const boundaryResult = await this.runBoundaryTests(
        sandbox.id,
        candidate,
        testSuite.boundary
      );
      
      // ─────────────────────────────────────────────────────
      // Phase 7: 模糊测试
      // ─────────────────────────────────────────────────────
      const fuzzResult = await this.runFuzzTests(
        sandbox.id,
        candidate,
        testSuite.fuzz
      );
      if (fuzzResult.crashes.length > 0) {
        return {
          passed: false,
          phase: 'fuzz',
          fuzzTests: fuzzResult,
          crashes: fuzzResult.crashes,
        };
      }
      
      // ─────────────────────────────────────────────────────
      // Phase 8: 回归测试
      // ─────────────────────────────────────────────────────
      const regressionResult = await this.runRegressionTests(
        sandbox.id,
        candidate,
        testSuite.regression
      );
      if (regressionResult.regressions.length > 0) {
        return {
          passed: false,
          phase: 'regression',
          regressionTests: regressionResult,
          regressions: regressionResult.regressions,
        };
      }
      
      // ─────────────────────────────────────────────────────
      // 全部通过
      // ─────────────────────────────────────────────────────
      return {
        passed: true,
        phase: 'regression',
        unitTests: unitResult,
        integrationTests: integrationResult,
        performanceTests: performanceResult,
        capabilityTests: capabilityResult,
        boundaryTests: boundaryResult,
        fuzzTests: fuzzResult,
        regressionTests: regressionResult,
      };
      
    } finally {
      await this.sandboxManager.destroySandbox(sandbox.id);
    }
  }
  
  // ════════════════════════════════════════════════════════════
  // 编译测试
  // ════════════════════════════════════════════════════════════
  
  private async testCompilation(
    sandboxId: SandboxId,
    candidate: EvolutionCandidate
  ): Promise<{ success: boolean; error?: string }> {
    
    try {
      // 尝试编译/解析代码
      const result = await this.sandboxManager.execute(
        sandboxId,
        candidate.code,
        { timeout: 5000 }
      );
      
      if (!result.success) {
        return {
          success: false,
          error: result.error?.message ?? '编译失败',
        };
      }
      
      return { success: true };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  // ════════════════════════════════════════════════════════════
  // 单元测试
  // ════════════════════════════════════════════════════════════
  
  private async runUnitTests(
    sandboxId: SandboxId,
    candidate: EvolutionCandidate,
    tests: TestCase[]
  ): Promise<UnitTestResult & { allPassed: boolean }> {
    
    const passed: string[] = [];
    const failed: string[] = [];
    const skipped: string[] = [];
    let totalCoverage = 0;
    
    for (const test of tests) {
      try {
        const result = await this.runSingleTest(sandboxId, candidate, test);
        
        if (result.passed) {
          passed.push(test.id);
          totalCoverage += result.metrics?.coverage ?? 0;
        } else {
          failed.push(test.id);
        }
        
      } catch (error) {
        failed.push(test.id);
      }
    }
    
    const allPassed = failed.length === 0;
    const coverage = tests.length > 0 ? totalCoverage / tests.length : 0;
    
    return {
      total: tests.length,
      passed: passed.length,
      failed,
      skipped,
      coverage,
      allPassed,
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 集成测试
  // ════════════════════════════════════════════════════════════
  
  private async runIntegrationTests(
    sandboxId: SandboxId,
    candidate: EvolutionCandidate,
    tests: TestCase[]
  ): Promise<IntegrationTestResult & { allPassed: boolean }> {
    
    const passed: string[] = [];
    const failed: string[] = [];
    const interactionErrors: InteractionError[] = [];
    
    for (const test of tests) {
      try {
        const result = await this.runSingleTest(sandboxId, candidate, test);
        
        if (result.passed) {
          passed.push(test.id);
        } else {
          failed.push(test.id);
          
          // 分析交互错误
          if (result.error?.message?.includes('dependency')) {
            interactionErrors.push({
              fromModule: candidate.module.id,
              toModule: 'unknown',
              error: result.error.message,
              context: test.name,
            });
          }
        }
        
      } catch (error) {
        failed.push(test.id);
      }
    }
    
    return {
      total: tests.length,
      passed: passed.length,
      failed,
      interactionErrors,
      allPassed: failed.length === 0,
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 性能测试
  // ════════════════════════════════════════════════════════════
  
  private async runPerformanceTests(
    sandboxId: SandboxId,
    candidate: EvolutionCandidate,
    tests: PerformanceTest[]
  ): Promise<PerformanceTestResult> {
    
    const metrics: PerformanceMetric[] = [];
    const regressions: PerformanceRegression[] = [];
    
    for (const test of tests) {
      const runs: number[] = [];
      
      // 预热
      for (let i = 0; i < test.warmupIterations; i++) {
        await this.runSingleTest(sandboxId, candidate, test);
      }
      
      // 正式运行
      for (let i = 0; i < test.iterations; i++) {
        const result = await this.runSingleTest(sandboxId, candidate, test);
        runs.push(result.duration);
      }
      
      // 统计
      const avgTime = runs.reduce((a, b) => a + b, 0) / runs.length;
      const sortedRuns = [...runs].sort((a, b) => a - b);
      const p99Index = Math.floor(runs.length * 0.99);
      const p99Time = sortedRuns[p99Index] ?? avgTime;
      
      metrics.push({
        name: test.name,
        averageTime: avgTime,
        p99Time,
        baseline: test.baseline,
        deviation: test.baseline > 0 ? (avgTime - test.baseline) / test.baseline : 0,
      });
      
      // 检查退化
      if (avgTime > test.baseline * (1 + test.tolerance)) {
        regressions.push({
          test: test.name,
          baseline: test.baseline,
          actual: avgTime,
          deviation: (avgTime - test.baseline) / test.baseline,
        });
      }
    }
    
    return {
      metrics,
      regressions,
      meetsBaseline: regressions.length === 0,
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 能力测试
  // ════════════════════════════════════════════════════════════
  
  private async runCapabilityTests(
    sandboxId: SandboxId,
    candidate: EvolutionCandidate,
    tests: CapabilityTest[]
  ): Promise<CapabilityTestResult> {
    
    const preserved: string[] = [];
    const lost: string[] = [];
    const enhanced: string[] = [];
    
    for (const test of tests) {
      try {
        const verifyResult = await test.verify(candidate.module);
        
        if (verifyResult.preserved) {
          preserved.push(test.capability);
          
          if (verifyResult.enhanced) {
            enhanced.push(test.capability);
          }
        } else {
          lost.push(test.capability);
        }
        
      } catch (error) {
        // 验证失败视为能力丢失
        lost.push(test.capability);
      }
    }
    
    return {
      preserved: lost.length === 0,
      preservedCapabilities: preserved,
      lostCapabilities: lost,
      enhancedCapabilities: enhanced,
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 边界测试
  // ════════════════════════════════════════════════════════════
  
  private async runBoundaryTests(
    sandboxId: SandboxId,
    candidate: EvolutionCandidate,
    tests: TestCase[]
  ): Promise<BoundaryTestResult> {
    
    const passed: string[] = [];
    const edgeCasesFound: EdgeCase[] = [];
    
    for (const test of tests) {
      try {
        const result = await this.runSingleTest(sandboxId, candidate, test);
        
        if (result.passed) {
          passed.push(test.id);
        } else {
          // 发现边界情况
          edgeCasesFound.push({
            input: test.input,
            expectedBehavior: test.description,
            actualBehavior: result.error?.message ?? 'failed',
            isIssue: !result.passed,
          });
        }
        
      } catch (error) {
        edgeCasesFound.push({
          input: test.input,
          expectedBehavior: test.description,
          actualBehavior: error instanceof Error ? error.message : String(error),
          isIssue: true,
        });
      }
    }
    
    return {
      total: tests.length,
      passed: passed.length,
      edgeCasesFound,
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 模糊测试
  // ════════════════════════════════════════════════════════════
  
  private async runFuzzTests(
    sandboxId: SandboxId,
    candidate: EvolutionCandidate,
    config: FuzzConfig
  ): Promise<FuzzTestResult> {
    
    if (!config.enabled) {
      return {
        totalExecutions: 0,
        crashes: [],
        coverage: 0,
        interestingInputs: [],
      };
    }
    
    const crashes: FuzzCrash[] = [];
    const interestingInputs: unknown[] = [];
    let totalCoverage = 0;
    const generator = new SmartFuzzGenerator(config);
    
    for (let i = 0; i < config.iterations; i++) {
      const input = generator.generate();
      
      try {
        const result = await this.sandboxManager.execute(
          sandboxId,
          async () => {
            // 执行模块处理
            const module = candidate.module;
            // 假设模块有 process 方法
            return input;
          },
          { timeout: config.timeoutPerInput }
        );
        
        if (!result.success) {
          crashes.push({
            input,
            error: result.error?.message ?? 'unknown error',
            stackTrace: result.error?.stack ?? '',
          });
          
          // 学习这个崩溃
          generator.learnFromCrash(input, new Error(result.error?.message));
        } else {
          // 更新覆盖率（简化）
          totalCoverage += 0.001;
          
          // 检查是否是"有趣的"输入
          if (this.isInterestingInput(input, result.result)) {
            interestingInputs.push(input);
          }
        }
        
      } catch (error) {
        crashes.push({
          input,
          error: error instanceof Error ? error.message : String(error),
          stackTrace: error instanceof Error ? error.stack ?? '' : '',
        });
      }
    }
    
    return {
      totalExecutions: config.iterations,
      crashes,
      coverage: Math.min(totalCoverage, 1),
      interestingInputs,
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 回归测试
  // ════════════════════════════════════════════════════════════
  
  private async runRegressionTests(
    sandboxId: SandboxId,
    candidate: EvolutionCandidate,
    tests: TestCase[]
  ): Promise<RegressionTestResult> {
    
    const passed: string[] = [];
    const regressions: RegressionInfo[] = [];
    
    for (const test of tests) {
      try {
        const result = await this.runSingleTest(sandboxId, candidate, test);
        
        if (result.passed) {
          passed.push(test.id);
        } else {
          // 检查是否是回归
          regressions.push({
            test: test.id,
            oldBehavior: test.description,
            newBehavior: result.error?.message ?? 'failed',
            isBreaking: test.priority === 'critical',
          });
        }
        
      } catch (error) {
        regressions.push({
          test: test.id,
          oldBehavior: test.description,
          newBehavior: error instanceof Error ? error.message : String(error),
          isBreaking: test.priority === 'critical',
        });
      }
    }
    
    return {
      total: tests.length,
      passed: passed.length,
      regressions,
    };
  }
  
  // ════════════════════════════════════════════════════════════
  // 单个测试执行
  // ════════════════════════════════════════════════════════════
  
  private async runSingleTest(
    sandboxId: SandboxId,
    candidate: EvolutionCandidate,
    test: TestCase
  ): Promise<TestResult> {
    
    const startTime = Date.now();
    
    try {
      // 执行测试
      const result = await this.sandboxManager.execute(
        sandboxId,
        async () => {
          // 构建测试上下文
          const context: TestContext = {
            module: candidate.module,
            sandbox: { id: sandboxId } as any,
            startTime,
            resources: { memoryUsed: 0, cpuUsed: 0 },
          };
          
          // 执行验证
          return test.validate(test.input, context);
        },
        { timeout: test.timeout }
      );
      
      const duration = Date.now() - startTime;
      
      return {
        passed: result.success && result.result === true,
        testCase: test,
        duration,
        output: result.result,
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        passed: false,
        testCase: test,
        duration,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
  
  /**
   * 判断输入是否"有趣"
   */
  private isInterestingInput(input: unknown, output: unknown): boolean {
    // 简化实现：输出非空且不是错误
    return output !== null && output !== undefined;
  }
}

// ═══════════════════════════════════════════════════════════════
// 智能模糊测试生成器
// ═══════════════════════════════════════════════════════════════

class SmartFuzzGenerator {
  
  private config: FuzzConfig;
  private crashPatterns: Array<{ input: unknown; error: string }> = [];
  
  constructor(config: FuzzConfig) {
    this.config = config;
  }
  
  /**
   * 生成模糊测试输入
   */
  generate(): unknown {
    // 从配置的生成器中选择
    for (const generator of this.config.inputGenerators) {
      if (generator.type === 'random') {
        return this.generateRandom(generator.config);
      }
      if (generator.type === 'mutation' && generator.seeds.length > 0) {
        return this.generateMutation(generator.seeds, generator.mutators);
      }
      if (generator.type === 'grammar') {
        return this.generateFromGrammar(generator.grammar);
      }
    }
    
    // 默认：随机生成
    return this.generateRandom({ type: 'any' });
  }
  
  /**
   * 从崩溃中学习
   */
  learnFromCrash(input: unknown, error: Error): void {
    this.crashPatterns.push({
      input,
      error: error.message,
    });
  }
  
  private generateRandom(config: { type: string; constraints?: Record<string, unknown> }): unknown {
    switch (config.type) {
      case 'string':
        return this.randomString();
      case 'number':
        return this.randomNumber();
      case 'boolean':
        return Math.random() > 0.5;
      case 'array':
        return this.randomArray();
      case 'object':
        return this.randomObject();
      default:
        return this.randomAny();
    }
  }
  
  private generateMutation(seeds: unknown[], mutators: Array<{ name: string; apply: (i: unknown) => unknown }>): unknown {
    const seed = seeds[Math.floor(Math.random() * seeds.length)];
    
    if (mutators.length > 0) {
      const mutator = mutators[Math.floor(Math.random() * mutators.length)];
      return mutator.apply(seed);
    }
    
    return seed;
  }
  
  private generateFromGrammar(grammar: { startSymbol: string; productions: Map<string, unknown[]> }): unknown {
    // 简化实现
    return this.randomString();
  }
  
  private randomString(): string {
    const length = Math.floor(Math.random() * 100) + 1;
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 \t\n';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
  
  private randomNumber(): number {
    const type = Math.floor(Math.random() * 4);
    switch (type) {
      case 0: return Math.random();
      case 1: return Math.floor(Math.random() * 1000) - 500;
      case 2: return Math.random() * Number.MAX_SAFE_INTEGER;
      case 3: return -Math.random() * Number.MAX_SAFE_INTEGER;
      default: return 0;
    }
  }
  
  private randomArray(): unknown[] {
    const length = Math.floor(Math.random() * 10);
    return Array.from({ length }, () => this.randomAny());
  }
  
  private randomObject(): Record<string, unknown> {
    const keys = Math.floor(Math.random() * 5) + 1;
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < keys; i++) {
      obj[`key${i}`] = this.randomAny();
    }
    return obj;
  }
  
  private randomAny(): unknown {
    const type = Math.floor(Math.random() * 6);
    switch (type) {
      case 0: return null;
      case 1: return undefined;
      case 2: return this.randomString();
      case 3: return this.randomNumber();
      case 4: return this.randomArray();
      case 5: return this.randomObject();
      default: return null;
    }
  }
}
