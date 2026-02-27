/**
 * 本地工具执行器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createLocalExecutor } from '../executors/local';
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

describe('LocalExecutor', () => {
  let executor: ReturnType<typeof createLocalExecutor>;

  beforeEach(() => {
    executor = createLocalExecutor();
  });

  describe('基本功能', () => {
    it('应该能创建执行器实例', () => {
      expect(executor).toBeDefined();
      expect(executor.definition.name).toBe('local');
      expect(executor.definition.displayName).toBe('本地电脑操作');
    });

    it('应该能验证参数', () => {
      const validResult = executor.validateParams!({ _toolName: 'web_open' });
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = executor.validateParams!({});
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('缺少 _toolName 参数');
    });
  });

  describe('网页打开', () => {
    it('应该能打开网页', async () => {
      const result = await executor.execute(
        { _toolName: 'web_open', url: 'https://example.com' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(true);
      expect(result.toolName).toBe('web_open');
      expect(result.output).toHaveProperty('url', 'https://example.com');
    });

    it('缺少URL应该返回错误', async () => {
      const result = await executor.execute(
        { _toolName: 'web_open' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少 URL 参数');
    });
  });

  describe('应用列表', () => {
    it('应该能获取应用列表', async () => {
      const result = await executor.execute(
        { _toolName: 'app_list' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(true);
      expect(result.toolName).toBe('app_list');
      expect(result.output).toHaveProperty('apps');
      expect(result.output).toHaveProperty('platform');
    });
  });

  describe('窗口列表', () => {
    it('应该能获取窗口列表', async () => {
      const result = await executor.execute(
        { _toolName: 'app_window_list' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(true);
      expect(result.toolName).toBe('app_window_list');
      expect(result.output).toHaveProperty('windows');
      expect(result.output).toHaveProperty('platform');
    });
  });

  describe('系统通知', () => {
    it('应该能处理系统通知请求', async () => {
      const result = await executor.execute(
        { _toolName: 'sys_notify', title: '测试通知', message: '这是一条测试通知' },
        DEFAULT_CONTEXT
      );

      // 在无显示环境(Sandbox)中，通知可能失败，但应该返回正确的结构
      expect(result.toolName).toBe('sys_notify');
      if (result.success) {
        expect(result.output).toHaveProperty('title', '测试通知');
        expect(result.output).toHaveProperty('body', '这是一条测试通知');
      } else {
        // 预期：在无显示环境下可能失败
        expect(result.error).toBeDefined();
      }
    });

    it('缺少参数应该返回错误', async () => {
      const result = await executor.execute(
        { _toolName: 'sys_notify', title: '测试通知' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('缺少标题或消息内容');
    });
  });

  describe('未知工具', () => {
    it('应该处理未知工具', async () => {
      const result = await executor.execute(
        { _toolName: 'unknown_tool' },
        DEFAULT_CONTEXT
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('未知的本地工具');
    });
  });
});
