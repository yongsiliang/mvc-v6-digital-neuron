/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent 工具执行器
 *
 * 实现所有 Computer Agent 相关工具的执行逻辑：
 * - 屏幕操作：截图、分析
 * - 任务执行：执行高级任务描述
 * - 状态查询：获取当前状态
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { ToolExecutor, ToolResult, ExecutionContext } from '../types';
import { getComputerAgent } from '../../computer-agent';
import type { Result } from '../../computer-agent';

// ─────────────────────────────────────────────────────────────────────
// Computer Agent 执行器
// ─────────────────────────────────────────────────────────────────────

export function createComputerAgentExecutor(): ToolExecutor {
  return {
    definition: {
      name: 'computer-agent',
      displayName: '电脑代理',
      description: '控制电脑进行屏幕识别、任务执行等操作',
      category: 'automation',
      dangerLevel: 'moderate',
      requiresConfirmation: false,
      timeout: 60000,
      parameters: [],
    },

    async execute(
      params: Record<string, unknown>,
      context: ExecutionContext
    ): Promise<ToolResult> {
      const startTime = Date.now();
      const toolName = params._toolName as string;
      const agent = getComputerAgent();

      try {
        let result: { success: boolean; output?: unknown; error?: string };

        // 屏幕分析
        if (toolName === 'screen_analyze') {
          const screenResult = await agent.analyzeScreen();
          if (screenResult.success) {
            result = {
              success: true,
              output: {
                description: screenResult.value.description,
                activeWindow: screenResult.value.activeWindow,
                elementsCount: screenResult.value.elements.length,
                timestamp: screenResult.value.timestamp,
              },
            };
          } else {
            result = { success: false, error: screenResult.error?.message || '屏幕分析失败' };
          }
        }
        // 执行任务
        else if (toolName === 'automation_execute') {
          const goal = params.goal as string;
          if (!goal) {
            result = { success: false, error: '缺少 goal 参数' };
          } else {
            const execResult = await agent.execute(goal);
            if (execResult.success) {
              const taskResult = execResult.value.value as { taskId?: string; completedSteps?: number } | undefined;
              result = {
                success: true,
                output: {
                  taskId: taskResult?.taskId,
                  completedSteps: taskResult?.completedSteps,
                  duration: execResult.value.duration,
                },
              };
            } else {
              result = { success: false, error: execResult.error.message || '任务执行失败' };
            }
          }
        }
        // 状态查询
        else if (toolName === 'automation_status') {
          const status = agent.getStatus();
          result = {
            success: true,
            output: {
              isRunning: status.isRunning,
              currentTaskId: status.currentTask?.taskId,
              logsCount: status.logs.length,
            },
          };
        }
        // 停止任务
        else if (toolName === 'automation_stop') {
          agent.stop();
          result = {
            success: true,
            output: { action: 'stopped' },
          };
        }
        // 其他工具暂不支持
        else {
          result = { 
            success: false, 
            error: `工具 ${toolName} 暂未实现。当前支持的工具有：screen_analyze, automation_execute, automation_status, automation_stop` 
          };
        }

        return {
          callId: `computer-agent_${Date.now()}`,
          toolName,
          success: result.success,
          output: result.output,
          error: result.error,
          duration: Date.now() - startTime,
          timestamp: Date.now(),
        };
      } catch (error) {
        return {
          callId: `computer-agent_${Date.now()}`,
          toolName,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
          timestamp: Date.now(),
        };
      }
    },

    validateParams(params: Record<string, unknown>): { valid: boolean; errors: string[] } {
      const errors: string[] = [];
      if (!params._toolName) {
        errors.push('缺少 _toolName 参数');
      }
      return { valid: errors.length === 0, errors };
    },
  };
}
