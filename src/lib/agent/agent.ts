/**
 * ═══════════════════════════════════════════════════════════════════════
 * Agent - 主入口
 * 
 * 整合三层架构：
 * - 信息层：编码、存储、分发信息结构
 * - 智能层：LLM 理解、决策、记忆
 * - 行动层：执行操作、观察结果
 * 
 * 认知循环：
 * Perceive → Understand → Decide → Act → Observe → ...
 * ═══════════════════════════════════════════════════════════════════════
 */

import { CognitiveAgent, CognitiveState, CognitiveCycleResult } from '../intelligence/cognitive-agent';
import { ExecutorManager, ActionResult, resultToObservation } from '../action/executor';
import { MockExecutor, LoggingExecutor } from '../action/mock-executor';
import { ActionStructure, ObservationStructure } from '../info-field/structures';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** Agent 配置 */
export interface AgentConfig {
  /** 最大认知循环次数 */
  maxCycles?: number;
  /** 是否使用模拟执行器 */
  useMockExecutor?: boolean;
  /** 是否启用日志 */
  enableLogging?: boolean;
  /** 自定义请求头 */
  customHeaders?: Record<string, string>;
}

/** Agent 运行结果 */
export interface AgentRunResult {
  /** 是否成功完成 */
  success: boolean;
  /** 最终状态 */
  finalState: CognitiveState;
  /** 所有执行的行动 */
  allActions: Array<{
    action: ActionStructure;
    result?: ActionResult;
    observation?: ObservationStructure;
  }>;
  /** 最终输出 */
  output?: string;
  /** 错误信息 */
  error?: string;
  /** 运行统计 */
  stats: {
    totalCycles: number;
    totalActions: number;
    successActions: number;
    failedActions: number;
    durationMs: number;
  };
}

/** 认知循环事件 */
export interface CognitiveEvent {
  type: 'perceive' | 'understand' | 'decide' | 'act' | 'observe' | 'complete' | 'error';
  data: unknown;
  timestamp: number;
}

/** 事件监听器 */
export type EventListener = (event: CognitiveEvent) => void;

// ─────────────────────────────────────────────────────────────────────
// Agent 主类
// ─────────────────────────────────────────────────────────────────────

/**
 * 认知智能 Agent
 * 
 * 整合信息层、智能层、行动层，执行认知循环
 */
export class Agent {
  private cognitive: CognitiveAgent;
  private executor: ExecutorManager;
  private config: Required<AgentConfig>;
  private eventListeners: Set<EventListener> = new Set();
  private loggingExecutor?: LoggingExecutor;
  
  constructor(config: AgentConfig = {}) {
    this.config = {
      maxCycles: config.maxCycles ?? 20,
      useMockExecutor: config.useMockExecutor ?? true,
      enableLogging: config.enableLogging ?? true,
      customHeaders: config.customHeaders ?? {}
    };
    
    // 初始化智能层
    this.cognitive = new CognitiveAgent(this.config.customHeaders);
    
    // 初始化行动层
    this.executor = new ExecutorManager();
    
    if (this.config.useMockExecutor) {
      const mockExecutor = new MockExecutor();
      
      if (this.config.enableLogging) {
        this.loggingExecutor = new LoggingExecutor(mockExecutor);
        this.executor.register(this.loggingExecutor, true);
      } else {
        this.executor.register(mockExecutor, true);
      }
    }
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 核心方法
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 运行 Agent
   * 
   * 执行完整的认知循环，直到任务完成或达到最大循环次数
   */
  async run(input: string): Promise<AgentRunResult> {
    const startTime = Date.now();
    const allActions: AgentRunResult['allActions'] = [];
    let totalSuccess = 0;
    let totalFailed = 0;
    
    try {
      // 启动认知循环
      let result = await this.cognitive.start(input);
      this.emit('perceive', { input, phase: 'start' });
      
      // 执行认知循环
      while (result.shouldContinue && result.state.cycleCount < this.config.maxCycles) {
        // 执行决策产生的行动
        for (const action of result.actions) {
          this.emit('act', { action });
          
          // 执行行动
          const actionResult = await this.executor.execute(action);
          allActions.push({ action, result: actionResult });
          
          if (actionResult.status === 'success') {
            totalSuccess++;
          } else {
            totalFailed++;
          }
          
          // 如果任务完成，退出循环
          if (actionResult.completed) {
            this.emit('complete', { action, result: actionResult });
            return this.createResult(
              true,
              result.state,
              allActions,
              actionResult.content,
              startTime,
              totalSuccess,
              totalFailed
            );
          }
          
          // 将观察结果反馈给智能层
          const observation = resultToObservation(actionResult);
          allActions[allActions.length - 1].observation = observation;
          this.emit('observe', { observation });
          
          // 触发新一轮认知循环
          result = await this.cognitive.observe(observation);
        }
        
        // 如果没有行动，继续下一轮认知循环
        if (result.actions.length === 0) {
          result = await this.cognitive.cycle();
        }
      }
      
      // 循环结束
      const success = result.state.completed;
      const output = result.thought || '任务处理完成';
      
      this.emit('complete', { success, output });
      
      return this.createResult(
        success,
        result.state,
        allActions,
        output,
        startTime,
        totalSuccess,
        totalFailed
      );
      
    } catch (error) {
      this.emit('error', { error });
      
      return this.createResult(
        false,
        this.cognitive.getState(),
        allActions,
        undefined,
        startTime,
        totalSuccess,
        totalFailed,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
  
  /**
   * 执行单个认知循环
   * 
   * 用于需要更细粒度控制的场景
   */
  async step(input?: string): Promise<CognitiveCycleResult> {
    if (input) {
      return this.cognitive.start(input);
    }
    return this.cognitive.cycle();
  }
  
  /**
   * 执行单个行动
   */
  async executeAction(action: ActionStructure): Promise<ActionResult> {
    this.emit('act', { action });
    return this.executor.execute(action);
  }
  
  /**
   * 重置 Agent
   */
  reset(): void {
    this.cognitive.reset();
    if (this.loggingExecutor) {
      this.loggingExecutor.clearLogs();
    }
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 事件系统
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 添加事件监听器
   */
  on(listener: EventListener): void {
    this.eventListeners.add(listener);
  }
  
  /**
   * 移除事件监听器
   */
  off(listener: EventListener): void {
    this.eventListeners.delete(listener);
  }
  
  /**
   * 发射事件
   */
  private emit(type: CognitiveEvent['type'], data: unknown): void {
    const event: CognitiveEvent = {
      type,
      data,
      timestamp: Date.now()
    };
    
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (e) {
        console.error('Event listener error:', e);
      }
    }
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 工具方法
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 获取认知状态
   */
  getState(): CognitiveState {
    return this.cognitive.getState();
  }
  
  /**
   * 获取执行器能力
   */
  getCapabilities() {
    return this.executor.getAllCapabilities();
  }
  
  /**
   * 获取执行日志
   */
  getExecutionLogs() {
    return this.loggingExecutor?.getLogs() ?? [];
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 私有方法
  // ───────────────────────────────────────────────────────────────────
  
  private createResult(
    success: boolean,
    finalState: CognitiveState,
    allActions: AgentRunResult['allActions'],
    output?: string,
    startTime?: number,
    successActions?: number,
    failedActions?: number,
    error?: string
  ): AgentRunResult {
    return {
      success,
      finalState,
      allActions,
      output,
      error,
      stats: {
        totalCycles: finalState.cycleCount,
        totalActions: allActions.length,
        successActions: successActions ?? 0,
        failedActions: failedActions ?? 0,
        durationMs: startTime ? Date.now() - startTime : 0
      }
    };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建 Agent 实例
 */
export function createAgent(config?: AgentConfig): Agent {
  return new Agent(config);
}
