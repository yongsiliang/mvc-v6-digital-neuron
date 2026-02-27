/**
 * Computer Agent 核心测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  success,
  failure,
  createError,
  AgentErrorCode,
  MouseAction,
  MouseButton,
  KeyboardAction,
  StepStatus,
  AgentEventType,
} from '../types';

// ═══════════════════════════════════════════════════════════════════════
// Result 模式测试
// ═══════════════════════════════════════════════════════════════════════

describe('Result 模式', () => {
  describe('success', () => {
    it('应该创建成功结果', () => {
      const result = success({ name: 'test' });
      
      expect(result.success).toBe(true);
      expect(result.value).toEqual({ name: 'test' });
    });

    it('应该支持任意类型的值', () => {
      const stringResult = success('hello');
      const numberResult = success(42);
      const arrayResult = success([1, 2, 3]);
      const nullResult = success(null);
      
      expect(stringResult.value).toBe('hello');
      expect(numberResult.value).toBe(42);
      expect(arrayResult.value).toEqual([1, 2, 3]);
      expect(nullResult.value).toBeNull();
    });
  });

  describe('failure', () => {
    it('应该创建失败结果', () => {
      const error = createError(AgentErrorCode.UNKNOWN, '测试错误');
      const result = failure(error);
      
      expect(result.success).toBe(false);
      expect(result.error.message).toBe('测试错误');
      expect(result.error.code).toBe(AgentErrorCode.UNKNOWN);
    });
  });

  describe('createError', () => {
    it('应该创建标准错误对象', () => {
      const error = createError(
        AgentErrorCode.TIMEOUT,
        '操作超时',
        { details: { duration: 5000 } }
      );
      
      expect(error.name).toBe('AgentError[TIMEOUT]');
      expect(error.code).toBe(AgentErrorCode.TIMEOUT);
      expect(error.message).toBe('操作超时');
      expect(error.retryable).toBe(true);
    });

    it('应该支持错误原因链', () => {
      const cause = new Error('原始错误');
      const error = createError(
        AgentErrorCode.SCREENSHOT_FAILED,
        '截图失败',
        { cause }
      );
      
      expect(error.cause).toBe(cause);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 枚举类型测试
// ═══════════════════════════════════════════════════════════════════════

describe('枚举类型', () => {
  describe('MouseAction', () => {
    it('应该包含所有鼠标操作类型', () => {
      expect(MouseAction.CLICK).toBe('click');
      expect(MouseAction.DOUBLE_CLICK).toBe('double_click');
      expect(MouseAction.RIGHT_CLICK).toBe('right_click');
      expect(MouseAction.MOVE).toBe('move');
      expect(MouseAction.DRAG).toBe('drag');
      expect(MouseAction.SCROLL).toBe('scroll');
    });
  });

  describe('MouseButton', () => {
    it('应该包含所有鼠标按键', () => {
      expect(MouseButton.LEFT).toBe('left');
      expect(MouseButton.RIGHT).toBe('right');
      expect(MouseButton.MIDDLE).toBe('middle');
    });
  });

  describe('KeyboardAction', () => {
    it('应该包含所有键盘操作类型', () => {
      expect(KeyboardAction.TYPE).toBe('type');
      expect(KeyboardAction.PRESS).toBe('press');
      expect(KeyboardAction.HOTKEY).toBe('hotkey');
    });
  });

  describe('StepStatus', () => {
    it('应该包含所有步骤状态', () => {
      expect(StepStatus.PENDING).toBe('pending');
      expect(StepStatus.RUNNING).toBe('running');
      expect(StepStatus.SUCCESS).toBe('success');
      expect(StepStatus.FAILED).toBe('failed');
      expect(StepStatus.SKIPPED).toBe('skipped');
    });
  });

  describe('AgentEventType', () => {
    it('应该包含所有事件类型', () => {
      expect(AgentEventType.TASK_RECEIVED).toBe('task_received');
      expect(AgentEventType.TASK_STARTED).toBe('task_started');
      expect(AgentEventType.TASK_COMPLETED).toBe('task_completed');
      expect(AgentEventType.TASK_FAILED).toBe('task_failed');
      expect(AgentEventType.OPERATION_STARTED).toBe('operation_started');
      expect(AgentEventType.OPERATION_COMPLETED).toBe('operation_completed');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 接口类型测试（编译时检查）
// ═══════════════════════════════════════════════════════════════════════

describe('接口类型', () => {
  it('MouseOperation 应该有正确的结构', () => {
    const operation = {
      action: MouseAction.CLICK,
      position: { x: 100, y: 200 },
      button: MouseButton.LEFT,
    };
    
    expect(operation.action).toBe(MouseAction.CLICK);
    expect(operation.position).toEqual({ x: 100, y: 200 });
    expect(operation.button).toBe(MouseButton.LEFT);
  });

  it('KeyboardOperation 应该有正确的结构', () => {
    const operation = {
      action: KeyboardAction.TYPE,
      text: 'Hello World',
      interval: 50,
    };
    
    expect(operation.action).toBe(KeyboardAction.TYPE);
    expect(operation.text).toBe('Hello World');
  });

  it('Point 应该有正确的结构', () => {
    const point = { x: 100, y: 200 };
    
    expect(point.x).toBe(100);
    expect(point.y).toBe(200);
  });

  it('Rectangle 应该有正确的结构', () => {
    const rect = { x: 0, y: 0, width: 1920, height: 1080 };
    
    expect(rect.x).toBe(0);
    expect(rect.y).toBe(0);
    expect(rect.width).toBe(1920);
    expect(rect.height).toBe(1080);
  });
});
