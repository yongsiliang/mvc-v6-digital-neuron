/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 核心代理类
 * 
 * 实现类似 OpenAI Operator 的对话式电脑操作能力
 * 
 * 设计原则：
 * 1. 事件驱动：所有状态变化通过事件通知
 * 2. 错误恢复：使用 Result 模式处理错误
 * 3. 安全可控：危险操作需要确认
 * 4. 可观测性：完整的日志和追踪
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  AgentConfig,
  AgentEvent,
  AgentEventListener,
  AgentError,
  Result,
  OperationResult,
  TaskPlan,
  TaskStep,
  TaskExecutionState,
  ScreenAnalysis,
  AtomicAction,
  MouseOperation,
  KeyboardOperation,
  IInputController,
  IVisionSystem,
  IAppManager,
  ITaskPlanner,
  ISecurityChecker,
  IHistoryLogger,
  ExecutionLog,
} from './types';
import { 
  success, 
  failure, 
  createError,
  AgentErrorCode as ErrorCode,
  StepStatus,
  AgentEventType as EventType,
  DEFAULT_AGENT_CONFIG,
} from './types';
import { LLMClient } from 'coze-coding-dev-sdk';
import { createInputController } from './input';
import { createVisionSystem } from './vision';
import { createAppManager } from './operations/app-manager';
import { createTaskPlanner } from './planner';
import { createSecurityChecker } from './security';
import { createHistoryLogger } from './history';

// ═══════════════════════════════════════════════════════════════════════
// Computer Agent 核心类
// ═══════════════════════════════════════════════════════════════════════

/**
 * Computer Agent - 电脑操作代理
 * 
 * 主入口，整合所有子系统：
 * - 视觉系统（截图、分析）
 * - 输入控制（鼠标、键盘）
 * - 应用管理（启动、切换）
 * - 任务规划（拆解、执行）
 * - 安全检查（权限、确认）
 */
export class ComputerAgent {
  private config: AgentConfig;
  private inputController: IInputController;
  private visionSystem: IVisionSystem;
  private appManager: IAppManager;
  private taskPlanner: ITaskPlanner;
  private securityChecker: ISecurityChecker;
  private historyLogger: IHistoryLogger;
  private llmClient: LLMClient;
  
  private isRunning: boolean = false;
  private currentTask: TaskExecutionState | null = null;
  private eventListeners: Map<EventType, AgentEventListener[]> = new Map();
  private logs: ExecutionLog[] = [];
  
  constructor(config?: Partial<AgentConfig>) {
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
    
    // 初始化 LLM 客户端
    this.llmClient = new LLMClient();
    
    // 初始化子系统
    this.inputController = createInputController(this.config);
    this.visionSystem = createVisionSystem(this.llmClient, this.config);
    this.appManager = createAppManager(this.config);
    this.taskPlanner = createTaskPlanner(this.llmClient);
    this.securityChecker = createSecurityChecker(this.config);
    this.historyLogger = createHistoryLogger();
    
    this.log('info', 'ComputerAgent 初始化完成', { platform: this.config.platform });
  }
  
  // ════════════════════════════════════════════════════════════════════
  // 公共 API
  // ════════════════════════════════════════════════════════════════════
  
  /**
   * 执行任务 - 主入口
   * @param goal 任务目标描述
   * @returns 执行结果
   */
  async execute(goal: string): Promise<Result<OperationResult>> {
    this.log('info', '收到任务', { goal });
    this.emit(EventType.TASK_RECEIVED, { goal });
    
    try {
      // 1. 规划任务
      const planResult = await this.planTask(goal);
      if (!planResult.success) {
        return planResult;
      }
      const plan = planResult.value;
      
      // 2. 确认危险操作
      if (this.config.enableSecurityCheck) {
        const checkResult = await this.checkSecurity(plan);
        if (!checkResult.success) {
          return checkResult;
        }
      }
      
      // 3. 执行任务
      return this.executePlan(plan);
      
    } catch (error) {
      const agentError = this.handleError(error);
      this.log('error', '任务执行失败', { error: agentError });
      return failure(agentError);
    }
  }
  
  /**
   * 停止当前任务
   */
  stop(): void {
    if (this.currentTask) {
      this.currentTask.status = StepStatus.FAILED;
      this.log('info', '任务已停止', { taskId: this.currentTask.taskId });
      this.emit(EventType.TASK_FAILED, { taskId: this.currentTask.taskId, reason: 'stopped_by_user' });
      this.currentTask = null;
    }
    this.isRunning = false;
  }
  
  /**
   * 获取当前状态
   */
  getStatus(): {
    isRunning: boolean;
    currentTask: TaskExecutionState | null;
    logs: ExecutionLog[];
  } {
    return {
      isRunning: this.isRunning,
      currentTask: this.currentTask,
      logs: this.logs.slice(-100),
    };
  }
  
  /**
   * 添加事件监听器
   */
  on(event: EventType, listener: AgentEventListener): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(listener);
    this.eventListeners.set(event, listeners);
  }
  
  /**
   * 移除事件监听器
   */
  off(event: EventType, listener: AgentEventListener): void {
    const listeners = this.eventListeners.get(event) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
  
  /**
   * 获取屏幕分析
   */
  async analyzeScreen(): Promise<Result<ScreenAnalysis>> {
    // 截图
    const screenshotResult = await this.visionSystem.captureScreen();
    if (!screenshotResult.success) {
      return failure(screenshotResult.error);
    }
    
    // 分析
    const analysisResult = await this.visionSystem.analyzeScreen(screenshotResult.value);
    if (!analysisResult.success) {
      return failure(analysisResult.error);
    }
    
    return success(analysisResult.value);
  }
  
  // ════════════════════════════════════════════════════════════════════
  // 私有方法 - 任务执行流程
  // ════════════════════════════════════════════════════════════════════
  
  /**
   * 规划任务
   */
  private async planTask(goal: string): Promise<Result<TaskPlan>> {
    this.log('info', '开始规划任务');
    this.emit(EventType.TASK_PLANNING, { goal });
    
    // 获取当前屏幕状态
    const screenResult = await this.analyzeScreen();
    const context = screenResult.success ? screenResult.value : undefined;
    
    // 使用规划器生成计划
    const planResult = await this.taskPlanner.plan(goal, context);
    
    if (!planResult.success) {
      this.log('error', '任务规划失败', { error: planResult.error });
      return planResult;
    }
    
    const plan = planResult.value;
    this.log('info', '任务规划完成', { 
      stepCount: plan.steps.length,
      riskLevel: plan.riskLevel 
    });
    this.emit(EventType.TASK_PLANNED, { plan });
    
    return success(plan);
  }
  
  /**
   * 安全检查
   */
  private async checkSecurity(plan: TaskPlan): Promise<Result<boolean>> {
    this.log('info', '执行安全检查');
    
    for (const step of plan.steps) {
      for (const action of step.actions) {
        const checkResult = await this.securityChecker.checkOperation(action);
        
        if (!checkResult.success) {
          this.emit(EventType.SECURITY_CHECK_FAILED, { action, error: checkResult.error });
          return failure(createError(
            ErrorCode.PERMISSION_DENIED,
            `安全检查失败: ${checkResult.error.message}`,
            { cause: checkResult.error }
          ));
        }
        
        if (this.securityChecker.requiresConfirmation(action)) {
          // 这里需要与前端交互，获取用户确认
          // 暂时记录日志
          this.log('warn', '需要用户确认', { 
            action,
            message: this.securityChecker.getConfirmationMessage(action)
          });
          this.emit(EventType.CONFIRMATION_REQUIRED, { action });
        }
      }
    }
    
    this.emit(EventType.SECURITY_CHECK_PASSED, { planId: plan.id });
    return success(true);
  }
  
  /**
   * 执行计划
   */
  private async executePlan(plan: TaskPlan): Promise<Result<OperationResult>> {
    this.isRunning = true;
    const startTime = Date.now();
    
    // 初始化执行状态
    const taskState: TaskExecutionState = {
      taskId: plan.id,
      plan,
      currentStepIndex: 0,
      status: StepStatus.RUNNING,
      logs: [],
      startedAt: startTime,
    };
    this.currentTask = taskState;
    
    this.emit(EventType.TASK_STARTED, { taskId: plan.id, plan });
    this.log('info', '开始执行任务', { stepCount: plan.steps.length });
    
    // 逐步骤执行
    for (let i = 0; i < plan.steps.length; i++) {
      if (!this.isRunning) {
        break; // 被停止
      }
      
      const step = plan.steps[i];
      taskState.currentStepIndex = i;
      
      // 检查依赖
      if (step.dependsOn) {
        const depsMet = this.checkDependencies(step, taskState);
        if (!depsMet) {
          this.log('warn', '依赖未满足，跳过步骤', { stepId: step.id });
          step.status = StepStatus.SKIPPED;
          continue;
        }
      }
      
      // 执行步骤
      const stepResult = await this.executeStep(step, taskState);
      
      if (!stepResult.success) {
        // 处理失败
        const handled = await this.handleStepFailure(step, stepResult.error!, taskState);
        if (!handled) {
          taskState.status = StepStatus.FAILED;
          taskState.error = stepResult.error;
          taskState.endedAt = Date.now();
          this.emit(EventType.TASK_FAILED, { taskId: plan.id, error: stepResult.error });
          return failure(stepResult.error!);
        }
      }
    }
    
    // 完成
    taskState.status = StepStatus.SUCCESS;
    taskState.endedAt = Date.now();
    
    const result: OperationResult = {
      success: true,
      value: { taskId: plan.id, completedSteps: plan.steps.length },
      duration: Date.now() - startTime,
      timestamp: Date.now(),
    };
    
    this.emit(EventType.TASK_COMPLETED, { taskId: plan.id, result });
    this.log('info', '任务执行完成', { duration: result.duration });
    
    this.currentTask = null;
    this.isRunning = false;
    
    return success(result);
  }
  
  /**
   * 执行单个步骤
   */
  private async executeStep(
    step: TaskStep, 
    taskState: TaskExecutionState
  ): Promise<Result<OperationResult>> {
    const startTime = Date.now();
    step.status = StepStatus.RUNNING;
    step.startedAt = startTime;
    
    this.emit(EventType.TASK_STEP_STARTED, { taskId: taskState.taskId, stepId: step.id });
    this.log('info', '执行步骤', { stepId: step.id, description: step.description });
    
    try {
      // 执行步骤中的每个原子操作
      for (const action of step.actions) {
        const actionResult = await this.executeAction(action);
        
        // 记录到历史
        this.historyLogger.log(action, actionResult);
        
        if (!actionResult.success) {
          step.status = StepStatus.FAILED;
          step.result = actionResult;
          step.endedAt = Date.now();
          
          this.emit(EventType.TASK_STEP_FAILED, { 
            taskId: taskState.taskId, 
            stepId: step.id, 
            error: actionResult.error 
          });
          
          return failure(createError(
            ErrorCode.STEP_EXECUTION_FAILED,
            `步骤执行失败: ${actionResult.error?.message}`,
            { details: { stepId: step.id, actionId: action.id }, cause: actionResult.error }
          ));
        }
      }
      
      // 步骤成功
      step.status = StepStatus.SUCCESS;
      step.endedAt = Date.now();
      step.result = {
        success: true,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
      
      this.emit(EventType.TASK_STEP_COMPLETED, { taskId: taskState.taskId, stepId: step.id });
      this.log('info', '步骤完成', { stepId: step.id, duration: step.result.duration });
      
      return success(step.result);
      
    } catch (error) {
      step.status = StepStatus.FAILED;
      step.endedAt = Date.now();
      
      const agentError = this.handleError(error);
      return failure(agentError);
    }
  }
  
  /**
   * 执行原子操作
   */
  private async executeAction(action: AtomicAction): Promise<OperationResult> {
    const startTime = Date.now();
    
    this.emit(EventType.OPERATION_STARTED, { actionId: action.id, type: action.type });
    
    try {
      let result: Result<unknown>;
      
      switch (action.type) {
        case 'mouse':
          result = await this.inputController.executeMouse(action.params as MouseOperation);
          break;
          
        case 'keyboard':
          result = await this.inputController.executeKeyboard(action.params as KeyboardOperation);
          break;
          
        case 'app':
          result = await this.executeAppOperation(action.params as Record<string, unknown>);
          break;
          
        case 'screenshot':
          const screenResult = await this.analyzeScreen();
          result = screenResult.success 
            ? success(screenResult.value)
            : failure(screenResult.error);
          break;
          
        case 'wait':
          const waitMs = (action.params as { ms?: number }).ms || 1000;
          await this.sleep(waitMs);
          result = success(undefined);
          break;
          
        default:
          result = failure(createError(
            ErrorCode.UNKNOWN,
            `未知的操作类型: ${action.type}`
          ));
      }
      
      const duration = Date.now() - startTime;
      
      const operationResult: OperationResult = {
        success: result.success,
        value: result.success ? result.value : undefined,
        error: result.success ? undefined : result.error,
        duration,
        timestamp: Date.now(),
      };
      
      this.emit(EventType.OPERATION_COMPLETED, { actionId: action.id, result: operationResult });
      
      return operationResult;
      
    } catch (error) {
      return {
        success: false,
        error: this.handleError(error),
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * 执行应用操作
   */
  private async executeAppOperation(params: Record<string, unknown>): Promise<Result<unknown>> {
    const operation = params.operation as string;
    
    switch (operation) {
      case 'launch':
        return this.appManager.launchApp(
          params.name as string, 
          params.args as string[] | undefined
        );
        
      case 'list':
        return this.appManager.listApps();
        
      case 'listWindows':
        return this.appManager.listWindows();
        
      case 'focus':
        return this.appManager.focusWindow(params.windowId as string | number);
        
      case 'close':
        return this.appManager.closeWindow(params.windowId as string | number);
        
      default:
        return failure(createError(
          ErrorCode.UNKNOWN,
          `未知的应用操作: ${operation}`
        ));
    }
  }
  
  /**
   * 处理步骤失败
   */
  private async handleStepFailure(
    step: TaskStep, 
    error: AgentError,
    taskState: TaskExecutionState
  ): Promise<boolean> {
    this.log('warn', '步骤失败', { stepId: step.id, error: error.message });
    
    switch (step.onFailure) {
      case 'abort':
        return false;
        
      case 'skip':
        step.status = StepStatus.SKIPPED;
        return true;
        
      case 'retry':
        const currentRetries = step.retries || 0;
        const maxRetries = step.maxRetries || this.config.defaultRetries;
        
        if (error.retryable && currentRetries < maxRetries) {
          step.status = StepStatus.RETRYING;
          step.retries = currentRetries + 1;
          this.log('info', '重试步骤', { stepId: step.id, attempt: step.retries });
          
          // 重新规划
          const replanResult = await this.taskPlanner.replan(
            taskState.plan, 
            step, 
            error
          );
          
          if (replanResult.success) {
            taskState.plan = replanResult.value;
            return true;
          }
        }
        return false;
        
      default:
        return false;
    }
  }
  
  /**
   * 检查步骤依赖
   */
  private checkDependencies(step: TaskStep, state: TaskExecutionState): boolean {
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return true;
    }
    
    for (const depId of step.dependsOn) {
      const depStep = state.plan.steps.find(s => s.id === depId);
      if (!depStep || depStep.status !== StepStatus.SUCCESS) {
        return false;
      }
    }
    
    return true;
  }
  
  // ════════════════════════════════════════════════════════════════════
  // 工具方法
  // ════════════════════════════════════════════════════════════════════
  
  /**
   * 记录日志
   */
  private log(level: ExecutionLog['level'], message: string, data?: Record<string, unknown>): void {
    const entry: ExecutionLog = {
      timestamp: Date.now(),
      level,
      message,
      data,
    };
    
    this.logs.push(entry);
    
    // 控制台输出
    const prefix = `[ComputerAgent] ${new Date(entry.timestamp).toISOString()}`;
    switch (level) {
      case 'error':
        console.error(prefix, message, data || '');
        break;
      case 'warn':
        console.warn(prefix, message, data || '');
        break;
      case 'debug':
        if (this.config.logLevel === 'debug') {
          console.debug(prefix, message, data || '');
        }
        break;
      default:
        console.log(prefix, message, data || '');
    }
  }
  
  /**
   * 发送事件
   */
  private emit(type: EventType, data?: unknown): void {
    const event: AgentEvent = {
      type,
      timestamp: Date.now(),
      data,
      taskId: this.currentTask?.taskId,
    };
    
    const listeners = this.eventListeners.get(type) || [];
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        this.log('error', '事件监听器执行失败', { type, error });
      }
    }
  }
  
  /**
   * 统一错误处理
   */
  private handleError(error: unknown): AgentError {
    if (this.isAgentError(error)) {
      return error;
    }
    
    const err = error as Error;
    return createError(
      ErrorCode.UNKNOWN,
      err.message || '未知错误',
      { cause: err }
    );
  }
  
  /**
   * 检查是否为 AgentError
   */
  private isAgentError(error: unknown): error is AgentError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'retryable' in error
    );
  }
  
  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════════════════

let defaultAgent: ComputerAgent | null = null;

/**
 * 创建 Computer Agent 实例
 */
export function createComputerAgent(config?: Partial<AgentConfig>): ComputerAgent {
  return new ComputerAgent(config);
}

/**
 * 获取默认 Computer Agent 实例（单例）
 */
export function getComputerAgent(config?: Partial<AgentConfig>): ComputerAgent {
  if (!defaultAgent) {
    defaultAgent = new ComputerAgent(config);
  }
  return defaultAgent;
}
