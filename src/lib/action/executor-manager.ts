/**
 * ═══════════════════════════════════════════════════════════════════════
 * 行动层 - 执行器管理器
 * 
 * 统一管理所有执行器，实现自动选择：
 * - 根据意图类型选择合适的执行器
 * - 支持执行器注册和扩展
 * - 提供统一的执行接口
 * ═══════════════════════════════════════════════════════════════════════
 */

import { ActionStructure, IntentType } from '../info-field/structures';
import { ActionExecutor, ActionResult, ExecutorCapabilities } from './executor';
import { LightweightBrowserExecutor } from './browser-executor';
import { MultimodalExecutor } from './multimodal-executor';
import { FileExecutor } from './file-executor';
import { APIExecutor } from './api-executor';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface ExecutorInfo {
  type: string;
  capabilities: ExecutorCapabilities;
  instance: ActionExecutor;
}

export interface ExecutionPlan {
  actionId: string;
  executorType: string;
  confidence: number;
  reason: string;
}

// ─────────────────────────────────────────────────────────────────────
// 执行器管理器
// ─────────────────────────────────────────────────────────────────────

/**
 * 执行器管理器
 * 
 * 统一管理所有执行器，实现自动选择
 */
export class ExecutorManager {
  private executors: Map<string, ExecutorInfo> = new Map();
  private intentExecutorMap: Map<IntentType, string[]> = new Map();
  
  constructor() {
    // 注册默认执行器
    this.registerDefaultExecutors();
    
    // 注册意图映射
    this.registerIntentMappings();
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 执行器注册
  // ───────────────────────────────────────────────────────────────────
  
  private registerDefaultExecutors(): void {
    // 浏览器执行器
    this.register(new LightweightBrowserExecutor());
    
    // 多模态执行器
    this.register(new MultimodalExecutor());
    
    // 文件执行器
    this.register(new FileExecutor());
    
    // API 执行器
    this.register(new APIExecutor());
  }
  
  private registerIntentMappings(): void {
    // 浏览器意图 → 浏览器执行器
    this.intentExecutorMap.set('browser', ['browser']);
    this.intentExecutorMap.set('navigate', ['browser']);
    this.intentExecutorMap.set('search', ['browser', 'api']);
    this.intentExecutorMap.set('click', ['browser']);
    
    // 多模态意图 → 多模态执行器
    this.intentExecutorMap.set('vision', ['multimodal']);
    this.intentExecutorMap.set('image', ['multimodal']);
    this.intentExecutorMap.set('ocr', ['multimodal']);
    
    // 文件意图 → 文件执行器
    this.intentExecutorMap.set('file', ['file']);
    this.intentExecutorMap.set('read', ['file']);
    this.intentExecutorMap.set('write', ['file']);
    
    // API 意图 → API 执行器
    this.intentExecutorMap.set('api', ['api']);
    this.intentExecutorMap.set('request', ['api']);
    
    // 通用意图 → 所有执行器
    this.intentExecutorMap.set('general', ['browser', 'multimodal', 'file', 'api']);
    this.intentExecutorMap.set('unknown', ['browser', 'multimodal', 'file', 'api']);
  }
  
  /**
   * 注册执行器
   */
  register(executor: ActionExecutor): void {
    const capabilities = executor.getCapabilities();
    this.executors.set(executor.type, {
      type: executor.type,
      capabilities,
      instance: executor
    });
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 执行器选择
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 根据意图选择执行器
   */
  selectExecutor(intent: IntentType, action: ActionStructure): ExecutionPlan {
    // 1. 检查是否有明确的执行器类型
    if (action.executor) {
      const info = this.executors.get(action.executor);
      if (info) {
        return {
          actionId: action.id,
          executorType: action.executor,
          confidence: 1.0,
          reason: '用户明确指定执行器'
        };
      }
    }
    
    // 2. 检查意图映射
    const preferredTypes = this.intentExecutorMap.get(intent) || [];
    
    for (const type of preferredTypes) {
      const info = this.executors.get(type);
      if (info && info.instance.canExecute(action)) {
        return {
          actionId: action.id,
          executorType: type,
          confidence: 0.9,
          reason: `基于意图类型 "${intent}" 选择`
        };
      }
    }
    
    // 3. 检查所有执行器
    for (const [type, info] of this.executors) {
      if (info.instance.canExecute(action)) {
        return {
          actionId: action.id,
          executorType: type,
          confidence: 0.7,
          reason: `基于能力匹配选择`
        };
      }
    }
    
    // 4. 默认使用浏览器执行器
    return {
      actionId: action.id,
      executorType: 'browser',
      confidence: 0.5,
      reason: '默认选择'
    };
  }
  
  /**
   * 获取推荐的执行器列表
   */
  getRecommendedExecutors(intent: IntentType, action: ActionStructure): ExecutionPlan[] {
    const plans: ExecutionPlan[] = [];
    
    for (const [type, info] of this.executors) {
      if (info.instance.canExecute(action)) {
        plans.push({
          actionId: action.id,
          executorType: type,
          confidence: type === (this.intentExecutorMap.get(intent)?.[0] || '') ? 0.9 : 0.7,
          reason: `能力匹配`
        });
      }
    }
    
    return plans.sort((a, b) => b.confidence - a.confidence);
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 执行操作
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 执行行动
   */
  async execute(action: ActionStructure, intent?: IntentType): Promise<ActionResult> {
    // 选择执行器
    const plan = this.selectExecutor(intent || 'unknown', action);
    const info = this.executors.get(plan.executorType);
    
    if (!info) {
      return {
        actionId: action.id,
        status: 'failed',
        content: '',
        error: `找不到执行器: ${plan.executorType}`,
        completed: false
      };
    }
    
    // 执行
    const result = await info.instance.execute(action);
    
    // 添加执行器信息
    result.executor = {
      type: plan.executorType,
      name: info.capabilities.name,
      confidence: plan.confidence,
      reason: plan.reason
    };
    
    return result;
  }
  
  /**
   * 执行多个行动
   */
  async executeAll(actions: ActionStructure[], intent?: IntentType): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    
    for (const action of actions) {
      const result = await this.execute(action, intent);
      results.push(result);
      
      // 如果行动失败，可以选择停止或继续
      if (result.status === 'failed') {
        console.warn(`行动 ${action.id} 失败: ${result.error}`);
      }
    }
    
    return results;
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 信息获取
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 获取所有执行器信息
   */
  getExecutors(): ExecutorInfo[] {
    return Array.from(this.executors.values());
  }
  
  /**
   * 获取执行器能力
   */
  getCapabilities(type: string): ExecutorCapabilities | undefined {
    return this.executors.get(type)?.capabilities;
  }
  
  /**
   * 获取支持某行动的执行器
   */
  getExecutorsForAction(action: string): ExecutorInfo[] {
    const matched: ExecutorInfo[] = [];
    
    for (const info of this.executors.values()) {
      if (info.capabilities.supportedActions.includes(action)) {
        matched.push(info);
      }
    }
    
    return matched;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 单例导出
// ─────────────────────────────────────────────────────────────────────

let executorManager: ExecutorManager | null = null;

export function getExecutorManager(): ExecutorManager {
  if (!executorManager) {
    executorManager = new ExecutorManager();
  }
  return executorManager;
}
