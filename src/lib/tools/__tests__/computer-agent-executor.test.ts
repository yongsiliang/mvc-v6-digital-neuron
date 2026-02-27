/**
 * Computer Agent 工具执行器测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createComputerAgentExecutor } from '../executors/computer-agent';
import type { ExecutionContext, SecurityPolicy } from '../types';

const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  allowedPaths: ['/tmp', '/workspace'],
  blockedPaths: [],
  allowedCommands: [],
  blockedCommands: [],
  allowedDomains: [],
  maxFileSize: 10 * 1024 * 1024,
  commandTimeout: 30000,
  allowDelete: false,
  allowSystemModification: false,
};

const DEFAULT_CONTEXT: ExecutionContext = {
  workingDirectory: '/tmp',
  securityPolicy: DEFAULT_SECURITY_POLICY,
};

describe('ComputerAgentExecutor', () => {
  let executor: ReturnType<typeof createComputerAgentExecutor>;

  beforeEach(() => {
    executor = createComputerAgentExecutor();
  });

  describe('基本功能', () => {
    it('应该能创建执行器实例', () => {
      expect(executor).toBeDefined();
      expect(executor.definition.name).toBe('computer-agent');
      expect(executor.definition.displayName).toBe('电脑代理');
      expect(executor.definition.category).toBe('automation');
    });

    it('应该能验证参数', () => {
      const validResult = executor.validateParams!({ _toolName: 'screen_analyze' });
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = executor.validateParams!({});
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('缺少 _toolName 参数');
    });

    it('应该有适当的超时设置', () => {
      expect(executor.definition.timeout).toBe(60000);
    });
  });

  describe('参数验证', () => {
    it('automation_execute 应该需要 goal 参数', async () => {
      const result = await executor.execute(
        { _toolName: 'automation_execute' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少 goal 参数');
    });

    it('keyboard_type 应该需要 text 参数', async () => {
      const result = await executor.execute(
        { _toolName: 'keyboard_type' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少 text 参数');
    });

    it('keyboard_press 应该需要 key 参数', async () => {
      const result = await executor.execute(
        { _toolName: 'keyboard_press' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少 key 参数');
    });

    it('keyboard_hotkey 应该需要 keys 参数', async () => {
      const result = await executor.execute(
        { _toolName: 'keyboard_hotkey' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少 keys 参数');
    });

    it('mouse_move 应该需要 x 和 y 参数', async () => {
      const result = await executor.execute(
        { _toolName: 'mouse_move' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少 x 或 y 参数');
    });

    it('mouse_drag 应该需要完整坐标参数', async () => {
      const result = await executor.execute(
        { _toolName: 'mouse_drag', fromX: 0, fromY: 0 },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少坐标参数');
    });

    it('screen_find_element 应该需要 query 参数', async () => {
      const result = await executor.execute(
        { _toolName: 'screen_find_element' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少 query 参数');
    });

    it('app_launch 应该需要应用名称参数', async () => {
      const result = await executor.execute(
        { _toolName: 'app_launch' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少应用名称参数');
    });

    it('app_window_focus 应该需要 windowId 参数', async () => {
      const result = await executor.execute(
        { _toolName: 'app_window_focus' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少 windowId 参数');
    });

    it('app_window_close 应该需要 windowId 参数', async () => {
      const result = await executor.execute(
        { _toolName: 'app_window_close' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少 windowId 参数');
    });
  });

  describe('返回值格式', () => {
    it('应该返回正确的时间戳和耗时', async () => {
      const result = await executor.execute(
        { _toolName: 'automation_status' },
        DEFAULT_CONTEXT
      );

      expect(result).toHaveProperty('callId');
      expect(result).toHaveProperty('toolName');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('duration');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('automation_stop 应该返回成功', async () => {
      const result = await executor.execute(
        { _toolName: 'automation_stop' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('action', 'stopped');
    });
  });

  describe('未知工具处理', () => {
    it('应该拒绝未知工具', async () => {
      const result = await executor.execute(
        { _toolName: 'unknown_tool' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('未知的工具');
    });
  });
});
