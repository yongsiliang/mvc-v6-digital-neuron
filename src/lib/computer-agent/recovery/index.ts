/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 智能错误恢复系统
 * 
 * 设计理念：
 * 1. 策略模式：不同错误类型采用不同恢复策略
 * 2. 自适应调整：根据历史成功率调整策略参数
 * 3. 级联降级：多种恢复方案逐级尝试
 * 4. 学习优化：记录恢复效果，持续优化
 * 
 * 恢复策略：
 * - 元素未找到 → 重新截图分析 / 扩大搜索范围
 * - 操作超时 → 增加超时时间 / 分步执行
 * - 权限不足 → 请求权限 / 降级方案
 * - 网络错误 → 重试 / 离线模式
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  AgentError,
  AgentErrorCode,
  TaskStep,
  TaskPlan,
  AtomicAction,
  OperationResult,
  ScreenAnalysis,
  Result,
} from '../types';
import { success, failure, createError } from '../types';
import { LLMClient } from 'coze-coding-dev-sdk';

// ═══════════════════════════════════════════════════════════════════════
// 恢复策略类型
// ═══════════════════════════════════════════════════════════════════════

export interface RecoveryContext {
  /** 原始错误 */
  error: AgentError;
  /** 失败的步骤 */
  step: TaskStep;
  /** 当前计划 */
  plan: TaskPlan;
  /** 失败的操作 */
  action: AtomicAction;
  /** 当前屏幕状态 */
  screenState?: ScreenAnalysis;
  /** 重试次数 */
  retryCount: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 历史恢复记录 */
  history: RecoveryRecord[];
}

export interface RecoveryRecord {
  /** 记录 ID */
  id: string;
  /** 错误代码 */
  errorCode: AgentErrorCode;
  /** 使用的策略 */
  strategy: string;
  /** 是否成功 */
  success: boolean;
  /** 尝试次数 */
  attempts: number;
  /** 时间戳 */
  timestamp: number;
  /** 恢复耗时 */
  duration: number;
}

export interface RecoveryResult {
  /** 是否恢复成功 */
  recovered: boolean;
  /** 恢复后的操作（如果需要重新执行） */
  newAction?: AtomicAction;
  /** 恢复后的步骤（如果需要重新规划） */
  newSteps?: TaskStep[];
  /** 需要的额外信息（如用户确认） */
  requiresInput?: {
    type: 'confirmation' | 'selection' | 'input';
    message: string;
    options?: string[];
  };
  /** 恢复策略名称 */
  strategy: string;
  /** 尝试次数 */
  attempts: number;
}

export interface RecoveryStrategy {
  /** 策略名称 */
  name: string;
  /** 适用错误代码 */
  applicableErrors: AgentErrorCode[];
  /** 最大尝试次数 */
  maxAttempts: number;
  /** 判断是否适用 */
  isApplicable(context: RecoveryContext): boolean;
  /** 执行恢复 */
  recover(context: RecoveryContext): Promise<RecoveryResult>;
}

// ═══════════════════════════════════════════════════════════════════════
// 基础恢复策略
// ═══════════════════════════════════════════════════════════════════════

/**
 * 重试策略 - 简单重试
 */
class RetryStrategy implements RecoveryStrategy {
  name = 'simple_retry';
  applicableErrors: AgentErrorCode[] = [
    'TIMEOUT' as AgentErrorCode,
    'SCREENSHOT_FAILED' as AgentErrorCode,
    'MOUSE_MOVE_FAILED' as AgentErrorCode,
    'MOUSE_CLICK_FAILED' as AgentErrorCode,
    'KEYBOARD_INPUT_FAILED' as AgentErrorCode,
  ];
  maxAttempts = 3;

  isApplicable(context: RecoveryContext): boolean {
    return context.error.retryable && context.retryCount < this.maxAttempts;
  }

  async recover(context: RecoveryContext): Promise<RecoveryResult> {
    // 延迟后重试
    const delay = Math.min(1000 * Math.pow(2, context.retryCount), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));

    return {
      recovered: true,
      newAction: context.action,
      strategy: this.name,
      attempts: context.retryCount + 1,
    };
  }
}

/**
 * 元素未找到策略 - 重新分析 + 扩大搜索
 */
class ElementNotFoundStrategy implements RecoveryStrategy {
  name = 'element_not_found_recovery';
  applicableErrors: AgentErrorCode[] = [
    'ELEMENT_NOT_FOUND' as AgentErrorCode,
  ];
  maxAttempts = 2;

  isApplicable(context: RecoveryContext): boolean {
    return context.retryCount < this.maxAttempts;
  }

  async recover(context: RecoveryContext): Promise<RecoveryResult> {
    const attempts = context.retryCount + 1;

    // 第一次：建议重新截图分析
    if (attempts === 1) {
      return {
        recovered: true,
        newAction: {
          id: `recovery_screenshot_${Date.now()}`,
          type: 'screenshot',
          params: {},
        },
        strategy: this.name,
        attempts,
      };
    }

    // 第二次：扩大搜索范围或使用替代元素
    if (context.screenState && context.screenState.elements.length > 0) {
      // 找到相似的可交互元素
      const interactiveElements = context.screenState.elements.filter(e => e.interactive);
      
      if (interactiveElements.length > 0) {
        // 返回第一个可交互元素作为替代
        const alternative = interactiveElements[0];
        
        return {
          recovered: true,
          requiresInput: {
            type: 'confirmation',
            message: `未找到目标元素，是否使用替代元素: ${alternative.text || alternative.description || alternative.id}?`,
          },
          strategy: this.name,
          attempts,
        };
      }
    }

    return {
      recovered: false,
      strategy: this.name,
      attempts,
    };
  }
}

/**
 * 操作超时策略 - 分步执行
 */
class TimeoutStrategy implements RecoveryStrategy {
  name = 'timeout_recovery';
  applicableErrors: AgentErrorCode[] = [
    'TIMEOUT' as AgentErrorCode,
  ];
  maxAttempts = 3;

  isApplicable(context: RecoveryContext): boolean {
    return context.retryCount < this.maxAttempts;
  }

  async recover(context: RecoveryContext): Promise<RecoveryResult> {
    const attempts = context.retryCount + 1;

    // 第一次：增加超时时间
    if (attempts === 1) {
      const newAction: AtomicAction = {
        ...context.action,
        timeout: (context.action.timeout || 30000) * 2,
      };

      return {
        recovered: true,
        newAction,
        strategy: this.name,
        attempts,
      };
    }

    // 第二次：分步执行（如果可能）
    if (context.action.type === 'keyboard' || context.action.type === 'mouse') {
      return {
        recovered: true,
        requiresInput: {
          type: 'confirmation',
          message: '操作超时，是否尝试分步执行？',
        },
        strategy: this.name,
        attempts,
      };
    }

    return {
      recovered: false,
      strategy: this.name,
      attempts,
    };
  }
}

/**
 * 权限不足策略 - 请求权限 / 降级
 */
class PermissionDeniedStrategy implements RecoveryStrategy {
  name = 'permission_denied_recovery';
  applicableErrors: AgentErrorCode[] = [
    'PERMISSION_DENIED' as AgentErrorCode,
    'FILE_ACCESS_DENIED' as AgentErrorCode,
    'SANDBOX_VIOLATION' as AgentErrorCode,
  ];
  maxAttempts = 1;

  isApplicable(context: RecoveryContext): boolean {
    return context.retryCount < this.maxAttempts;
  }

  async recover(context: RecoveryContext): Promise<RecoveryResult> {
    return {
      recovered: false,
      requiresInput: {
        type: 'confirmation',
        message: `权限不足: ${context.error.message}。是否请求更高权限？`,
      },
      strategy: this.name,
      attempts: context.retryCount + 1,
    };
  }
}

/**
 * 应用未找到策略 - 搜索替代应用
 */
class AppNotFoundStrategy implements RecoveryStrategy {
  name = 'app_not_found_recovery';
  applicableErrors: AgentErrorCode[] = [
    'APP_NOT_FOUND' as AgentErrorCode,
    'APP_LAUNCH_FAILED' as AgentErrorCode,
  ];
  maxAttempts = 2;

  private llmClient: LLMClient;

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }

  isApplicable(context: RecoveryContext): boolean {
    return context.retryCount < this.maxAttempts;
  }

  async recover(context: RecoveryContext): Promise<RecoveryResult> {
    const attempts = context.retryCount + 1;

    // 使用 LLM 推断替代应用
    const appName = (context.action.params as any)?.name;
    
    if (appName && this.llmClient) {
      try {
        const prompt = `用户想打开应用 "${appName}"，但该应用未找到。请推荐 3 个可能的替代应用名称，只返回名称列表，每行一个。`;
        
        // 使用 LLM 客户端生成响应
        const response = await this.llmClient.invoke([
          { role: 'user', content: prompt }
        ], {});

        const content = response.content || '';
        const alternatives = content.split('\n').filter(Boolean).slice(0, 3);

        if (alternatives.length > 0) {
          return {
            recovered: false,
            requiresInput: {
              type: 'selection',
              message: `应用 "${appName}" 未找到，是否使用替代应用？`,
              options: alternatives,
            },
            strategy: this.name,
            attempts,
          };
        }
      } catch {
        // LLM 调用失败
      }
    }

    return {
      recovered: false,
      strategy: this.name,
      attempts,
    };
  }
}

/**
 * 任务规划失败策略 - 简化目标
 */
class PlanningFailedStrategy implements RecoveryStrategy {
  name = 'planning_failed_recovery';
  applicableErrors: AgentErrorCode[] = [
    'TASK_PLANNING_FAILED' as AgentErrorCode,
    'STEP_EXECUTION_FAILED' as AgentErrorCode,
  ];
  maxAttempts = 2;

  private llmClient: LLMClient;

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }

  isApplicable(context: RecoveryContext): boolean {
    return context.retryCount < this.maxAttempts;
  }

  async recover(context: RecoveryContext): Promise<RecoveryResult> {
    const attempts = context.retryCount + 1;

    // 第一次：尝试更详细的提示
    if (attempts === 1) {
      return {
        recovered: false,
        requiresInput: {
          type: 'input',
          message: '任务规划遇到困难，请提供更多细节或简化您的请求：',
        },
        strategy: this.name,
        attempts,
      };
    }

    // 第二次：建议分步执行
    return {
      recovered: false,
      requiresInput: {
        type: 'confirmation',
        message: '任务规划失败，是否尝试分步执行？您可以先告诉我第一步要做什么。',
      },
      strategy: this.name,
      attempts,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 错误恢复管理器
// ═══════════════════════════════════════════════════════════════════════

/**
 * 智能错误恢复管理器
 * 
 * 特性：
 * - 多策略级联尝试
 * - 自适应参数调整
 * - 恢复效果学习
 * - 详细日志记录
 */
export class ErrorRecoveryManager {
  private strategies: RecoveryStrategy[] = [];
  private recoveryHistory: RecoveryRecord[] = [];
  private llmClient: LLMClient;
  
  // 自适应参数
  private adaptiveParams = {
    retryDelay: 1000,
    maxRetries: 3,
    timeoutMultiplier: 2,
  };

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    this.strategies = [
      new RetryStrategy(),
      new ElementNotFoundStrategy(),
      new TimeoutStrategy(),
      new PermissionDeniedStrategy(),
      new AppNotFoundStrategy(this.llmClient),
      new PlanningFailedStrategy(this.llmClient),
    ];
  }

  /**
   * 尝试恢复
   */
  async recover(context: RecoveryContext): Promise<RecoveryResult> {
    // 找到适用的策略
    const applicableStrategies = this.strategies.filter(
      s => s.applicableErrors.includes(context.error.code) && s.isApplicable(context)
    );

    if (applicableStrategies.length === 0) {
      return {
        recovered: false,
        strategy: 'none',
        attempts: 0,
      };
    }

    // 按优先级尝试策略
    for (const strategy of applicableStrategies) {
      const startTime = Date.now();

      try {
        const result = await strategy.recover(context);

        // 记录恢复结果
        this.recordRecovery({
          id: `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          errorCode: context.error.code,
          strategy: strategy.name,
          success: result.recovered,
          attempts: result.attempts,
          timestamp: startTime,
          duration: Date.now() - startTime,
        });

        // 更新自适应参数
        this.updateAdaptiveParams(strategy.name, result.recovered);

        return result;
      } catch (error) {
        // 策略执行失败，尝试下一个
        this.recordRecovery({
          id: `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          errorCode: context.error.code,
          strategy: strategy.name,
          success: false,
          attempts: context.retryCount + 1,
          timestamp: startTime,
          duration: Date.now() - startTime,
        });
      }
    }

    return {
      recovered: false,
      strategy: 'all_failed',
      attempts: context.retryCount + 1,
    };
  }

  /**
   * 记录恢复结果
   */
  private recordRecovery(record: RecoveryRecord): void {
    this.recoveryHistory.push({
      ...record,
      id: `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    // 限制历史记录大小
    if (this.recoveryHistory.length > 1000) {
      this.recoveryHistory = this.recoveryHistory.slice(-500);
    }
  }

  /**
   * 更新自适应参数
   */
  private updateAdaptiveParams(strategyName: string, success: boolean): void {
    // 根据历史成功率调整参数
    const strategyHistory = this.recoveryHistory.filter(r => r.strategy === strategyName);
    
    if (strategyHistory.length >= 5) {
      const successRate = strategyHistory.filter(r => r.success).length / strategyHistory.length;
      
      // 成功率低时增加延迟和重试次数
      if (successRate < 0.5) {
        this.adaptiveParams.retryDelay = Math.min(this.adaptiveParams.retryDelay * 1.2, 5000);
        this.adaptiveParams.maxRetries = Math.min(this.adaptiveParams.maxRetries + 1, 5);
      } else if (successRate > 0.8) {
        // 成功率高时可以减少延迟
        this.adaptiveParams.retryDelay = Math.max(this.adaptiveParams.retryDelay * 0.9, 500);
      }
    }
  }

  /**
   * 获取恢复统计
   */
  getStatistics(): {
    totalAttempts: number;
    successRate: number;
    strategyStats: Record<string, { attempts: number; successRate: number }>;
    adaptiveParams: { retryDelay: number; maxRetries: number; timeoutMultiplier: number };
  } {
    const total = this.recoveryHistory.length;
    const successful = this.recoveryHistory.filter(r => r.success).length;

    const strategyStats: Record<string, { attempts: number; successRate: number }> = {};
    
    for (const strategy of this.strategies) {
      const records = this.recoveryHistory.filter(r => r.strategy === strategy.name);
      strategyStats[strategy.name] = {
        attempts: records.length,
        successRate: records.length > 0 ? records.filter(r => r.success).length / records.length : 0,
      };
    }

    return {
      totalAttempts: total,
      successRate: total > 0 ? successful / total : 0,
      strategyStats,
      adaptiveParams: { 
        retryDelay: this.adaptiveParams.retryDelay,
        maxRetries: this.adaptiveParams.maxRetries,
        timeoutMultiplier: this.adaptiveParams.timeoutMultiplier,
      },
    };
  }

  /**
   * 获取自适应参数
   */
  getAdaptiveParams(): typeof this.adaptiveParams {
    return { ...this.adaptiveParams };
  }

  /**
   * 添加自定义策略
   */
  addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * 清除历史
   */
  clearHistory(): void {
    this.recoveryHistory = [];
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════════════════

export function createErrorRecoveryManager(llmClient: LLMClient): ErrorRecoveryManager {
  return new ErrorRecoveryManager(llmClient);
}
