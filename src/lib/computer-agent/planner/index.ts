/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent - 任务规划器
 * 
 * 将用户目标拆解为可执行的步骤序列
 * 使用 AI 进行智能规划
 * ═══════════════════════════════════════════════════════════════════════
 */

import { randomUUID } from 'crypto';
import { LLMClient } from 'coze-coding-dev-sdk';
import type {
  ITaskPlanner,
  TaskPlan,
  TaskStep,
  AtomicAction,
  ScreenAnalysis,
  Result,
  AgentError,
} from '../types';
import { success, failure, createError, AgentErrorCode, MouseAction, KeyboardAction, StepStatus } from '../types';

export function createTaskPlanner(llmClient: LLMClient): ITaskPlanner {
  return new TaskPlanner(llmClient);
}

class TaskPlanner implements ITaskPlanner {
  private llmClient: LLMClient;
  
  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }
  
  async plan(goal: string, context?: ScreenAnalysis): Promise<Result<TaskPlan, AgentError>> {
    try {
      // 构建上下文描述
      const contextDesc = context 
        ? `当前屏幕: ${context.description}\n活动窗口: ${context.activeWindow || '未知'}\n可见元素: ${context.elements.length} 个`
        : '屏幕状态未知';
      
      const systemPrompt = `你是一个任务规划专家。将用户目标拆解为精确的操作步骤。

可用的操作类型：
- mouse: 鼠标操作 { action: "click"|"move"|"drag"|"scroll", position: {x, y}, button: "left"|"right" }
- keyboard: 键盘操作 { action: "type"|"press"|"hotkey", text?: string, keys?: string[] }
- app: 应用操作 { operation: "launch"|"focus"|"close", name: string, windowId?: string }
- screenshot: 截屏分析 { }
- wait: 等待 { ms: number }

返回 JSON 格式：
{
  "steps": [
    {
      "description": "步骤描述",
      "actions": [
        { "type": "mouse", "params": { "action": "click", "position": { "x": 100, "y": 200 } } }
      ],
      "onFailure": "abort"|"skip"|"retry"
    }
  ],
  "riskLevel": "low"|"medium"|"high"
}

重要规则：
1. 每个步骤应该是一个原子操作或紧密相关的操作序列
2. 坐标应该基于屏幕分析结果合理推断
3. 对于不确定的位置，使用 "等待AI分析" 作为占位
4. 风险评估：删除文件、修改系统设置为 high；打开应用、输入文字为 low`;

      const response = await this.llmClient.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `目标: ${goal}\n\n${contextDesc}\n\n请制定操作计划。` }
      ], { temperature: 0.2 });
      
      const content = typeof response === 'string' ? response : (response as { content?: string }).content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        // 无法解析，返回默认计划
        return success(this.getDefaultPlan(goal));
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      const plan: TaskPlan = {
        id: `plan_${Date.now()}_${randomUUID().slice(0, 8)}`,
        goal,
        steps: parsed.steps.map((step: Record<string, unknown>, idx: number) => ({
          id: `step_${idx}`,
          description: step.description as string,
          actions: (step.actions as Record<string, unknown>[]).map((action, actionIdx) => ({
            id: `action_${idx}_${actionIdx}`,
            type: action.type as AtomicAction['type'],
            params: action.params as AtomicAction['params'],
          })),
          status: 'pending' as StepStatus,
          onFailure: (step.onFailure as TaskStep['onFailure']) || 'abort',
        })),
        createdAt: Date.now(),
        riskLevel: parsed.riskLevel || 'medium',
      };
      
      return success(plan);
      
    } catch (error) {
      // 规划失败，返回默认计划
      console.warn('[TaskPlanner] AI 规划失败，使用默认计划:', error);
      return success(this.getDefaultPlan(goal));
    }
  }
  
  async replan(
    currentPlan: TaskPlan,
    failedStep: TaskStep,
    error: AgentError
  ): Promise<Result<TaskPlan, AgentError>> {
    try {
      const response = await this.llmClient.invoke([
        { 
          role: 'system', 
          content: '你是任务重规划专家。根据失败原因调整计划。' 
        },
        { 
          role: 'user', 
          content: `原计划目标: ${currentPlan.goal}
失败步骤: ${failedStep.description}
失败原因: ${error.message}

请提供替代方案或跳过策略。返回调整后的步骤 JSON 数组。` 
        }
      ], { temperature: 0.2 });
      
      const content = typeof response === 'string' ? response : (response as { content?: string }).content || '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        return failure(createError(
          AgentErrorCode.TASK_PLANNING_FAILED,
          '重新规划失败'
        ));
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // 更新计划
      const newPlan: TaskPlan = {
        ...currentPlan,
        steps: parsed.map((step: Record<string, unknown>, idx: number) => ({
          id: `step_replan_${idx}`,
          description: step.description as string,
          actions: (step.actions as Record<string, unknown>[]).map((action: Record<string, unknown>, actionIdx: number) => ({
            id: `action_replan_${idx}_${actionIdx}`,
            type: action.type as AtomicAction['type'],
            params: action.params as AtomicAction['params'],
          })),
          status: 'pending' as StepStatus,
          onFailure: (step.onFailure as TaskStep['onFailure']) || 'abort',
        })),
      };
      
      return success(newPlan);
      
    } catch (err) {
      return failure(createError(
        AgentErrorCode.TASK_PLANNING_FAILED,
        `重新规划失败: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err instanceof Error ? err : undefined }
      ));
    }
  }
  
  /**
   * 获取默认计划（当 AI 不可用时）
   */
  private getDefaultPlan(goal: string): TaskPlan {
    // 简单的关键词匹配来生成基本计划
    const lowerGoal = goal.toLowerCase();
    
    const steps: TaskStep[] = [];
    
    // 检测打开应用意图
    const appMatch = lowerGoal.match(/打开|启动|运行|open|launch/);
    if (appMatch) {
      steps.push({
        id: 'step_0',
        description: '分析屏幕内容',
        actions: [{
          id: 'action_0_0',
          type: 'screenshot',
          params: {},
        }],
        status: StepStatus.PENDING,
        onFailure: 'abort',
      });
    }
    
    // 如果没有匹配到任何意图，创建一个截图分析步骤
    if (steps.length === 0) {
      steps.push({
        id: 'step_0',
        description: '分析当前屏幕状态',
        actions: [{
          id: 'action_0_0',
          type: 'screenshot',
          params: {},
        }],
        status: StepStatus.PENDING,
        onFailure: 'abort',
      });
    }
    
    return {
      id: `plan_${Date.now()}_default`,
      goal,
      steps,
      createdAt: Date.now(),
      riskLevel: 'low',
    };
  }
}
