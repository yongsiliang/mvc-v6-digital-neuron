/**
 * 沙箱池管理器
 * 
 * 管理 Worker Thread 沙箱池，提供真正的资源隔离
 */

import { Worker, isMainThread } from 'worker_threads';
import { cpus } from 'os';
import path from 'path';
import type { 
  SandboxConfig, 
  ExecutionResult, 
  TestSuiteResult 
} from './sandbox-executor';

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

interface SandboxTask {
  id: string;
  type: 'execute' | 'test' | 'benchmark';
  code: string;
  config: SandboxConfig;
  context?: Record<string, unknown>;
  tests?: Array<{ name: string; input: unknown; expected: unknown }>;
  iterations?: number;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  timeout: NodeJS.Timeout;
}

interface SandboxWorker {
  worker: Worker;
  busy: boolean;
  currentTask: SandboxTask | null;
  startTime: number;
}

export interface SandboxPoolStatus {
  totalWorkers: number;
  busyWorkers: number;
  pendingTasks: number;
  completedTasks: number;
  failedTasks: number;
}

// ═══════════════════════════════════════════════════════════════
// 沙箱池管理器
// ═══════════════════════════════════════════════════════════════

export class SandboxPool {
  private workers: SandboxWorker[] = [];
  private taskQueue: SandboxTask[] = [];
  private maxWorkers: number;
  private workerPath: string;
  private completedTasks = 0;
  private failedTasks = 0;

  constructor(maxWorkers: number = cpus().length) {
    this.maxWorkers = Math.min(maxWorkers, 4); // 限制最大4个worker
    this.workerPath = path.join(process.cwd(), 'src/lib/code-evolution/sandbox-executor.ts');
    
    // 预创建workers
    this.initializeWorkers();
  }

  /**
   * 初始化Worker池
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker();
    }
  }

  /**
   * 创建新的Worker
   */
  private createWorker(): SandboxWorker {
    const worker = new Worker(this.workerPath, {
      execArgv: ['--require', 'ts-node/register'],
    });

    const sandboxWorker: SandboxWorker = {
      worker,
      busy: false,
      currentTask: null,
      startTime: 0,
    };

    worker.on('message', (message: { success: boolean; result?: unknown; error?: unknown }) => {
      this.handleWorkerMessage(sandboxWorker, message);
    });

    worker.on('error', (error: Error) => {
      this.handleWorkerError(sandboxWorker, error);
    });

    worker.on('exit', (code: number) => {
      if (code !== 0) {
        console.error(`Worker exited with code ${code}`);
      }
      // 重启worker
      this.removeWorker(sandboxWorker);
      this.createWorker();
    });

    this.workers.push(sandboxWorker);
    return sandboxWorker;
  }

  /**
   * 处理Worker消息
   */
  private handleWorkerMessage(
    worker: SandboxWorker, 
    message: { success: boolean; result?: unknown; error?: unknown }
  ): void {
    const task = worker.currentTask;
    if (!task) return;

    clearTimeout(task.timeout);
    worker.busy = false;
    worker.currentTask = null;

    if (message.success) {
      task.resolve(message.result);
      this.completedTasks++;
    } else {
      task.reject(message.error);
      this.failedTasks++;
    }

    // 处理下一个任务
    this.processQueue();
  }

  /**
   * 处理Worker错误
   */
  private handleWorkerError(worker: SandboxWorker, error: Error): void {
    const task = worker.currentTask;
    if (task) {
      clearTimeout(task.timeout);
      task.reject(error);
      this.failedTasks++;
    }

    worker.busy = false;
    worker.currentTask = null;
    this.processQueue();
  }

  /**
   * 移除Worker
   */
  private removeWorker(worker: SandboxWorker): void {
    const index = this.workers.indexOf(worker);
    if (index > -1) {
      this.workers.splice(index, 1);
    }
  }

  /**
   * 处理任务队列
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;

    const task = this.taskQueue.shift();
    if (!task) return;

    this.assignTask(availableWorker, task);
  }

  /**
   * 分配任务给Worker
   */
  private assignTask(worker: SandboxWorker, task: SandboxTask): void {
    worker.busy = true;
    worker.currentTask = task;
    worker.startTime = Date.now();

    worker.worker.postMessage({
      code: task.code,
      config: task.config,
      context: task.context,
      type: task.type,
      tests: task.tests,
      iterations: task.iterations,
    });
  }

  // ════════════════════════════════════════════════════════════
  // 公共API
  // ════════════════════════════════════════════════════════════

  /**
   * 执行代码
   */
  async execute(
    code: string, 
    config: Partial<SandboxConfig> = {},
    context: Record<string, unknown> = {}
  ): Promise<ExecutionResult> {
    return this.submitTask<ExecutionResult>('execute', code, config, context);
  }

  /**
   * 运行测试
   */
  async runTests(
    code: string,
    tests: Array<{ name: string; input: unknown; expected: unknown }>,
    config: Partial<SandboxConfig> = {}
  ): Promise<TestSuiteResult> {
    return this.submitTask<TestSuiteResult>('test', code, config, {}, tests);
  }

  /**
   * 运行基准测试
   */
  async runBenchmark(
    code: string,
    iterations: number = 100,
    config: Partial<SandboxConfig> = {}
  ): Promise<{
    avgTime: number;
    minTime: number;
    maxTime: number;
    operationsPerSecond: number;
    memoryLeak: boolean;
  }> {
    return this.submitTask('benchmark', code, config, {}, undefined, iterations);
  }

  /**
   * 提交任务
   */
  private submitTask<T>(
    type: SandboxTask['type'],
    code: string,
    config: Partial<SandboxConfig>,
    context: Record<string, unknown>,
    tests?: Array<{ name: string; input: unknown; expected: unknown }>,
    iterations?: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const fullConfig: SandboxConfig = {
        timeout: 5000,
        memoryLimit: 50 * 1024 * 1024,
        cpuLimit: 1000,
        allowConsole: true,
        allowRequire: false,
        allowedModules: [],
        ...config,
      };

      const task: SandboxTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type,
        code,
        config: fullConfig,
        context,
        tests,
        iterations,
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout: setTimeout(() => {
          reject(new Error(`Task timeout: exceeded ${fullConfig.timeout}ms`));
          this.completedTasks++;
        }, fullConfig.timeout + 1000), // 额外1秒缓冲
      };

      // 尝试立即分配
      const availableWorker = this.workers.find(w => !w.busy);
      if (availableWorker) {
        this.assignTask(availableWorker, task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  /**
   * 获取池状态
   */
  getStatus(): SandboxPoolStatus {
    return {
      totalWorkers: this.workers.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      pendingTasks: this.taskQueue.length,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
    };
  }

  /**
   * 关闭所有Workers
   */
  async shutdown(): Promise<void> {
    const promises = this.workers.map(w => w.worker.terminate());
    await Promise.all(promises);
    this.workers = [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 单例导出
// ═══════════════════════════════════════════════════════════════

let poolInstance: SandboxPool | null = null;

export function getSandboxPool(): SandboxPool {
  if (!poolInstance) {
    poolInstance = new SandboxPool();
  }
  return poolInstance;
}

export function resetSandboxPool(): void {
  if (poolInstance) {
    poolInstance.shutdown();
    poolInstance = null;
  }
}
