'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface ExecutionResult {
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

interface TestResult {
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

interface TestSuiteResult {
  suiteName: string;
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  tests: TestResult[];
}

interface BenchmarkResult {
  avgTime: number;
  minTime: number;
  maxTime: number;
  operationsPerSecond: number;
  iterations: number;
  stability: number;
}

// ═══════════════════════════════════════════════════════════════
// 示例代码
// ═══════════════════════════════════════════════════════════════

const EXAMPLES = {
  basic: `// 简单计算函数
function add(a, b) {
  return a + b;
}

// 返回函数
add;`,

  algorithm: `// 斐波那契数列
function fibonacci(n) {
  if (n <= 1) return n;
  
  let prev = 0, curr = 1;
  for (let i = 2; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  return curr;
}

fibonacci;`,

  classExample: `// 类定义
class Calculator {
  constructor() {
    this.result = 0;
  }
  
  add(value) {
    this.result += value;
    return this;
  }
  
  subtract(value) {
    this.result -= value;
    return this;
  }
  
  getResult() {
    return this.result;
  }
}

Calculator;`,

  asyncCode: `// 异步函数
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function countdown(n) {
  for (let i = n; i >= 0; i--) {
    console.log('Count:', i);
    await delay(100);
  }
  return 'Done!';
}

countdown;`,

  errorCase: `// 会抛出错误的代码
function willFail() {
  throw new Error('这是一个测试错误');
}

willFail;`,

  infiniteLoop: `// 无限循环（会被超时终止）
function infiniteLoop() {
  while (true) {
    // 这个循环会被超时机制终止
  }
}

infiniteLoop;`,
};

const TEST_EXAMPLES = [
  { name: '加法测试', input: [2, 3], expected: 5 },
  { name: '负数测试', input: [-1, 1], expected: 0 },
  { name: '大数测试', input: [1000000, 2000000], expected: 3000000 },
];

// ═══════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════

export default function SandboxDemo() {
  // 执行状态
  const [code, setCode] = useState(EXAMPLES.basic);
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // 测试状态
  const [testCode, setTestCode] = useState(EXAMPLES.algorithm);
  const [testCases, setTestCases] = useState(TEST_EXAMPLES);
  const [testResult, setTestResult] = useState<TestSuiteResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // 基准测试状态
  const [benchCode, setBenchCode] = useState(EXAMPLES.algorithm);
  const [benchResult, setBenchResult] = useState<BenchmarkResult | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [iterations, setIterations] = useState(100);

  // ════════════════════════════════════════════════════════════
  // API 调用
  // ════════════════════════════════════════════════════════════

  const executeCode = useCallback(async () => {
    if (!code.trim() || isExecuting) return;
    
    setIsExecuting(true);
    setExecResult(null);

    try {
      const response = await fetch('/api/sandbox/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();
      setExecResult(result);

    } catch (error) {
      setExecResult({
        success: false,
        error: {
          name: 'NetworkError',
          message: String(error),
        },
        metrics: { executionTime: 0, memoryUsed: 0 },
        console: [],
      });
    } finally {
      setIsExecuting(false);
    }
  }, [code, isExecuting]);

  const runTests = useCallback(async () => {
    if (!testCode.trim() || isTesting) return;
    
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/sandbox/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: testCode, 
          tests: testCases.map(t => ({
            name: t.name,
            input: t.input,
            expected: t.expected,
          }))
        }),
      });

      const result = await response.json();
      setTestResult(result.testResult);

    } catch (error) {
      console.error('测试失败:', error);
    } finally {
      setIsTesting(false);
    }
  }, [testCode, testCases, isTesting]);

  const runBenchmark = useCallback(async () => {
    if (!benchCode.trim() || isBenchmarking) return;
    
    setIsBenchmarking(true);
    setBenchResult(null);

    try {
      const response = await fetch('/api/sandbox/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: benchCode, iterations }),
      });

      const result = await response.json();
      setBenchResult(result.benchmark);

    } catch (error) {
      console.error('基准测试失败:', error);
    } finally {
      setIsBenchmarking(false);
    }
  }, [benchCode, iterations, isBenchmarking]);

  // ════════════════════════════════════════════════════════════
  // 渲染
  // ════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">沙箱执行环境</h1>
          <p className="text-muted-foreground mt-1">
            使用 Node.js VM 模块实现真正的代码隔离执行
          </p>
        </div>

        {/* 特性说明 */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">代码隔离</div>
              <div className="text-lg font-semibold text-foreground">VM 模块</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">超时限制</div>
              <div className="text-lg font-semibold text-foreground">5-10秒</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">内存限制</div>
              <div className="text-lg font-semibold text-foreground">50-100MB</div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">安全级别</div>
              <div className="text-lg font-semibold text-foreground">高</div>
            </CardContent>
          </Card>
        </div>

        {/* 主要内容 */}
        <Tabs defaultValue="execute" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="execute">代码执行</TabsTrigger>
            <TabsTrigger value="test">测试运行</TabsTrigger>
            <TabsTrigger value="benchmark">性能基准</TabsTrigger>
          </TabsList>

          {/* 代码执行 */}
          <TabsContent value="execute" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* 输入 */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>代码输入</CardTitle>
                    <select 
                      className="bg-muted rounded px-2 py-1 text-sm"
                      onChange={(e) => setCode(EXAMPLES[e.target.value as keyof typeof EXAMPLES])}
                      defaultValue="basic"
                    >
                      <option value="basic">基础函数</option>
                      <option value="algorithm">斐波那契</option>
                      <option value="classExample">类定义</option>
                      <option value="asyncCode">异步代码</option>
                      <option value="errorCase">错误案例</option>
                      <option value="infiniteLoop">无限循环</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-80 p-3 bg-muted rounded-lg font-mono text-sm resize-none"
                    placeholder="输入要执行的代码..."
                  />
                  <Button 
                    onClick={executeCode} 
                    disabled={isExecuting}
                    className="w-full mt-4"
                  >
                    {isExecuting ? '执行中...' : '执行代码'}
                  </Button>
                </CardContent>
              </Card>

              {/* 输出 */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>执行结果</CardTitle>
                </CardHeader>
                <CardContent>
                  {!execResult ? (
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                      点击"执行代码"查看结果
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 状态 */}
                      <div className="flex items-center gap-2">
                        <Badge className={execResult.success 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                        }>
                          {execResult.success ? '成功' : '失败'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          执行时间: {execResult.metrics.executionTime.toFixed(2)}ms
                        </span>
                        <span className="text-sm text-muted-foreground">
                          内存: {(execResult.metrics.memoryUsed / 1024).toFixed(2)}KB
                        </span>
                      </div>

                      {/* 返回值 */}
                      {execResult.result !== undefined && (
                        <div>
                          <div className="text-sm font-medium text-foreground mb-1">返回值:</div>
                          <pre className="p-3 bg-muted rounded-lg text-sm overflow-auto max-h-32">
                            {JSON.stringify(execResult.result, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* 错误 */}
                      {execResult.error && (
                        <div>
                          <div className="text-sm font-medium text-red-400 mb-1">错误:</div>
                          <pre className="p-3 bg-red-500/10 rounded-lg text-sm text-red-400 overflow-auto max-h-32">
                            {execResult.error.name}: {execResult.error.message}
                            {execResult.error.stack && `\n${execResult.error.stack}`}
                          </pre>
                        </div>
                      )}

                      {/* Console 输出 */}
                      {execResult.console.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-foreground mb-1">Console 输出:</div>
                          <ScrollArea className="h-32">
                            <div className="space-y-1">
                              {execResult.console.map((log, i) => (
                                <div key={i} className={cn(
                                  "p-2 rounded text-sm font-mono",
                                  log.type === 'error' ? 'bg-red-500/10 text-red-400' :
                                  log.type === 'warn' ? 'bg-yellow-500/10 text-yellow-400' :
                                  'bg-muted'
                                )}>
                                  [{log.type}] {log.args.map(a => 
                                    typeof a === 'object' ? JSON.stringify(a) : String(a)
                                  ).join(' ')}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 测试运行 */}
          <TabsContent value="test" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* 输入 */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>被测代码</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={testCode}
                    onChange={(e) => setTestCode(e.target.value)}
                    className="w-full h-48 p-3 bg-muted rounded-lg font-mono text-sm resize-none"
                  />
                  
                  <div className="mt-4">
                    <div className="text-sm font-medium text-foreground mb-2">测试用例:</div>
                    <div className="space-y-2">
                      {testCases.map((tc, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <span className="text-sm font-medium w-24">{tc.name}</span>
                          <Input
                            value={JSON.stringify(tc.input)}
                            onChange={(e) => {
                              const newCases = [...testCases];
                              try {
                                newCases[i] = { ...tc, input: JSON.parse(e.target.value) };
                                setTestCases(newCases);
                              } catch {}
                            }}
                            className="flex-1 h-8 text-sm"
                          />
                          <Input
                            value={JSON.stringify(tc.expected)}
                            onChange={(e) => {
                              const newCases = [...testCases];
                              try {
                                newCases[i] = { ...tc, expected: JSON.parse(e.target.value) };
                                setTestCases(newCases);
                              } catch {}
                            }}
                            className="flex-1 h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button 
                    onClick={runTests} 
                    disabled={isTesting}
                    className="w-full mt-4"
                  >
                    {isTesting ? '测试中...' : '运行测试'}
                  </Button>
                </CardContent>
              </Card>

              {/* 输出 */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>测试结果</CardTitle>
                </CardHeader>
                <CardContent>
                  {!testResult ? (
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                      点击"运行测试"查看结果
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 总体状态 */}
                      <div className="flex items-center gap-4">
                        <Badge className={testResult.passed 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                        }>
                          {testResult.passed ? '全部通过' : `${testResult.failedTests} 失败`}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {testResult.passedTests}/{testResult.totalTests} 通过
                        </span>
                        <span className="text-sm text-muted-foreground">
                          耗时: {testResult.duration.toFixed(2)}ms
                        </span>
                      </div>

                      {/* 进度条 */}
                      <Progress 
                        value={(testResult.passedTests / testResult.totalTests) * 100} 
                        className="h-2"
                      />

                      {/* 测试详情 */}
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {testResult.tests.map((test, i) => (
                            <div key={i} className={cn(
                              "p-3 rounded-lg",
                              test.passed ? 'bg-green-500/10' : 'bg-red-500/10'
                            )}>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={test.passed 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                                }>
                                  {test.passed ? '✓' : '✗'}
                                </Badge>
                                <span className="font-medium text-foreground">{test.testName}</span>
                                <span className="text-sm text-muted-foreground ml-auto">
                                  {test.duration.toFixed(2)}ms
                                </span>
                              </div>
                              {!test.passed && test.assertions[0] && (
                                <div className="text-sm text-red-400">
                                  {test.assertions[0].message}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 性能基准 */}
          <TabsContent value="benchmark" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* 输入 */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>被测代码</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={benchCode}
                    onChange={(e) => setBenchCode(e.target.value)}
                    className="w-full h-48 p-3 bg-muted rounded-lg font-mono text-sm resize-none"
                  />
                  
                  <div className="mt-4 flex items-center gap-4">
                    <label className="text-sm text-muted-foreground">迭代次数:</label>
                    <Input
                      type="number"
                      value={iterations}
                      onChange={(e) => setIterations(Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)))}
                      className="w-32 h-8"
                    />
                  </div>

                  <Button 
                    onClick={runBenchmark} 
                    disabled={isBenchmarking}
                    className="w-full mt-4"
                  >
                    {isBenchmarking ? '基准测试中...' : '运行基准测试'}
                  </Button>
                </CardContent>
              </Card>

              {/* 输出 */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>基准测试结果</CardTitle>
                </CardHeader>
                <CardContent>
                  {!benchResult ? (
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                      点击"运行基准测试"查看结果
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="text-sm text-muted-foreground">平均执行时间</div>
                          <div className="text-2xl font-bold text-foreground">
                            {benchResult.avgTime.toFixed(3)}ms
                          </div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="text-sm text-muted-foreground">每秒操作数</div>
                          <div className="text-2xl font-bold text-foreground">
                            {benchResult.operationsPerSecond.toFixed(0)}
                          </div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="text-sm text-muted-foreground">最小时间</div>
                          <div className="text-xl font-semibold text-foreground">
                            {benchResult.minTime.toFixed(3)}ms
                          </div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="text-sm text-muted-foreground">最大时间</div>
                          <div className="text-xl font-semibold text-foreground">
                            {benchResult.maxTime.toFixed(3)}ms
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-2">稳定性指标</div>
                        <Progress value={benchResult.stability * 100} className="h-2" />
                        <div className="text-sm text-muted-foreground mt-1">
                          {(benchResult.stability * 100).toFixed(0)}% 
                          {benchResult.stability > 0.8 ? ' (非常稳定)' : 
                           benchResult.stability > 0.5 ? ' (较稳定)' : ' (波动较大)'}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        共执行 {benchResult.iterations} 次迭代
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* 安全说明 */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>安全机制说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-foreground mb-2">代码隔离</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• VM 模块创建独立上下文</li>
                  <li>• 无法访问全局对象</li>
                  <li>• 无法访问文件系统</li>
                  <li>• 无法执行系统命令</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">资源限制</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• 执行超时: 5-10秒</li>
                  <li>• 内存限制: 50-100MB</li>
                  <li>• 无限循环保护</li>
                  <li>• 递归深度限制</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">可访问对象</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Math, Date, JSON</li>
                  <li>• Array, Object, String</li>
                  <li>• Promise, RegExp</li>
                  <li>• 受限的 console</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
