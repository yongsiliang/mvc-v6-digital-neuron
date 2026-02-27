/**
 * ═══════════════════════════════════════════════════════════════════════
 * Computer Agent 工具执行器
 *
 * 实现所有 Computer Agent 相关工具的执行逻辑：
 * - 屏幕操作：截图、分析、查找元素
 * - 鼠标操作：移动、点击、拖拽、滚动
 * - 键盘操作：输入、按键、快捷键
 * - 应用操作：启动、列出、聚焦、关闭
 * - 自动化任务：执行、状态查询、停止
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { ToolExecutor, ToolResult, ExecutionContext } from '../types';
import { getComputerAgent, MouseButton } from '../../computer-agent';

// ─────────────────────────────────────────────────────────────────────
// Computer Agent 执行器
// ─────────────────────────────────────────────────────────────────────

export function createComputerAgentExecutor(): ToolExecutor {
  return {
    definition: {
      name: 'computer-agent',
      displayName: '电脑代理',
      description: '控制电脑进行屏幕识别、鼠标键盘操作、应用管理等',
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

        // ═════════════════════════════════════════════════════════════════
        // 屏幕操作
        // ═════════════════════════════════════════════════════════════════

        if (toolName === 'screen_capture') {
          const region = params.region as { x: number; y: number; width: number; height: number } | undefined;
          const captureResult = await agent.captureScreen(region);
          if (captureResult.success) {
            result = {
              success: true,
              output: { screenshotPath: captureResult.value },
            };
          } else {
            result = { success: false, error: captureResult.error.message };
          }
        }
        
        else if (toolName === 'screen_analyze') {
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
            result = { success: false, error: screenResult.error.message };
          }
        }
        
        else if (toolName === 'screen_find_element') {
          const query = params.query as string;
          if (!query) {
            result = { success: false, error: '缺少 query 参数' };
          } else {
            const findResult = await agent.findElement(query);
            if (findResult.success) {
              result = {
                success: true,
                output: {
                  found: true,
                  element: {
                    type: findResult.value.type,
                    text: findResult.value.text,
                    bounds: findResult.value.bounds,
                    center: findResult.value.center,
                  },
                },
              };
            } else {
              result = { success: false, error: findResult.error.message };
            }
          }
        }

        // ═════════════════════════════════════════════════════════════════
        // 鼠标操作
        // ═════════════════════════════════════════════════════════════════

        else if (toolName === 'mouse_move') {
          const x = params.x as number;
          const y = params.y as number;
          if (typeof x !== 'number' || typeof y !== 'number') {
            result = { success: false, error: '缺少 x 或 y 参数' };
          } else {
            const moveResult = await agent.moveMouse(x, y);
            if (moveResult.success) {
              result = { success: true, output: { action: 'move', position: { x, y } } };
            } else {
              result = { success: false, error: moveResult.error.message };
            }
          }
        }
        
        else if (toolName === 'mouse_click') {
          const x = params.x as number | undefined;
          const y = params.y as number | undefined;
          const buttonStr = (params.button as string) || 'left';
          const button = buttonStr === 'right' ? MouseButton.RIGHT : 
                         buttonStr === 'middle' ? MouseButton.MIDDLE : MouseButton.LEFT;
          const doubleClick = params.doubleClick as boolean || false;
          
          const clickResult = await agent.click(x, y, button, doubleClick);
          if (clickResult.success) {
            result = {
              success: true,
              output: {
                action: doubleClick ? 'double_click' : 'click',
                position: x !== undefined && y !== undefined ? { x, y } : 'current',
                button,
              },
            };
          } else {
            result = { success: false, error: clickResult.error.message };
          }
        }
        
        else if (toolName === 'mouse_drag') {
          const fromX = params.fromX as number;
          const fromY = params.fromY as number;
          const toX = params.toX as number;
          const toY = params.toY as number;
          
          if ([fromX, fromY, toX, toY].some(v => typeof v !== 'number')) {
            result = { success: false, error: '缺少坐标参数 (fromX, fromY, toX, toY)' };
          } else {
            const dragResult = await agent.drag(fromX, fromY, toX, toY);
            if (dragResult.success) {
              result = {
                success: true,
                output: { action: 'drag', from: { x: fromX, y: fromY }, to: { x: toX, y: toY } },
              };
            } else {
              result = { success: false, error: dragResult.error.message };
            }
          }
        }
        
        else if (toolName === 'mouse_scroll') {
          const amount = params.amount as number || 100;
          const direction = (params.direction as 'up' | 'down' | 'left' | 'right') || 'down';
          
          const scrollResult = await agent.scroll(amount, direction);
          if (scrollResult.success) {
            result = { success: true, output: { action: 'scroll', amount, direction } };
          } else {
            result = { success: false, error: scrollResult.error.message };
          }
        }

        // ═════════════════════════════════════════════════════════════════
        // 键盘操作
        // ═════════════════════════════════════════════════════════════════

        else if (toolName === 'keyboard_type') {
          const text = params.text as string;
          if (!text) {
            result = { success: false, error: '缺少 text 参数' };
          } else {
            const interval = (params.interval as number) || 50;
            const typeResult = await agent.typeText(text, interval);
            if (typeResult.success) {
              result = { success: true, output: { action: 'type', textLength: text.length } };
            } else {
              result = { success: false, error: typeResult.error.message };
            }
          }
        }
        
        else if (toolName === 'keyboard_press') {
          const key = params.key as string;
          if (!key) {
            result = { success: false, error: '缺少 key 参数' };
          } else {
            const pressResult = await agent.pressKey(key);
            if (pressResult.success) {
              result = { success: true, output: { action: 'press', key } };
            } else {
              result = { success: false, error: pressResult.error.message };
            }
          }
        }
        
        else if (toolName === 'keyboard_hotkey') {
          const keys = params.keys as string;
          if (!keys) {
            result = { success: false, error: '缺少 keys 参数' };
          } else {
            const keyList = keys.split('+').map(k => k.trim());
            const hotkeyResult = await agent.hotkey(keyList);
            if (hotkeyResult.success) {
              result = { success: true, output: { action: 'hotkey', keys: keyList.join('+') } };
            } else {
              result = { success: false, error: hotkeyResult.error.message };
            }
          }
        }

        // ═════════════════════════════════════════════════════════════════
        // 应用操作
        // ═════════════════════════════════════════════════════════════════

        else if (toolName === 'app_launch') {
          const appName = params.name as string || params.appName as string;
          if (!appName) {
            result = { success: false, error: '缺少应用名称参数' };
          } else {
            const args = params.args as string[] | undefined;
            const launchResult = await agent.launchApp(appName, args);
            if (launchResult.success) {
              result = {
                success: true,
                output: { action: 'launch', app: appName, info: launchResult.value },
              };
            } else {
              result = { success: false, error: launchResult.error.message };
            }
          }
        }
        
        else if (toolName === 'app_list') {
          const listResult = await agent.listApps();
          if (listResult.success) {
            result = {
              success: true,
              output: { 
                action: 'list', 
                count: listResult.value.length,
                apps: listResult.value.slice(0, 20).map(a => ({ name: a.name, running: a.running })),
              },
            };
          } else {
            result = { success: false, error: listResult.error.message };
          }
        }
        
        else if (toolName === 'app_window_list') {
          const windowResult = await agent.listWindows();
          if (windowResult.success) {
            result = {
              success: true,
              output: {
                action: 'window_list',
                count: windowResult.value.length,
                windows: windowResult.value.slice(0, 20).map(w => ({ 
                  id: w.id, 
                  title: w.title, 
                  app: w.appName 
                })),
              },
            };
          } else {
            result = { success: false, error: windowResult.error.message };
          }
        }
        
        else if (toolName === 'app_window_focus') {
          const windowId = params.windowId as string | number;
          if (!windowId) {
            result = { success: false, error: '缺少 windowId 参数' };
          } else {
            const focusResult = await agent.focusWindow(windowId);
            if (focusResult.success) {
              result = { success: true, output: { action: 'focus', windowId } };
            } else {
              result = { success: false, error: focusResult.error.message };
            }
          }
        }
        
        else if (toolName === 'app_window_close') {
          const windowId = params.windowId as string | number;
          if (!windowId) {
            result = { success: false, error: '缺少 windowId 参数' };
          } else {
            const closeResult = await agent.closeWindow(windowId);
            if (closeResult.success) {
              result = { success: true, output: { action: 'close', windowId } };
            } else {
              result = { success: false, error: closeResult.error.message };
            }
          }
        }

        // ═════════════════════════════════════════════════════════════════
        // 自动化任务
        // ═════════════════════════════════════════════════════════════════

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
              result = { success: false, error: execResult.error.message };
            }
          }
        }
        
        else if (toolName === 'automation_status') {
          const status = agent.getStatus();
          result = {
            success: true,
            output: {
              isRunning: status.isRunning,
              currentTaskId: status.currentTask?.taskId,
              currentStep: status.currentTask?.currentStepIndex,
              totalSteps: status.currentTask?.plan.steps.length,
              logsCount: status.logs.length,
            },
          };
        }
        
        else if (toolName === 'automation_stop') {
          agent.stop();
          result = { success: true, output: { action: 'stopped' } };
        }

        // ═════════════════════════════════════════════════════════════════
        // 未知工具
        // ═════════════════════════════════════════════════════════════════

        else {
          result = { 
            success: false, 
            error: `未知的工具: ${toolName}` 
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
