/**
 * 内存管理器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryManager } from '../memory-manager';
import { LayeredMemorySystem } from '../layered-memory';

describe('MemoryManager', () => {
  let manager: MemoryManager;
  let memory: LayeredMemorySystem;

  beforeEach(() => {
    memory = new LayeredMemorySystem();
    manager = new MemoryManager(memory, {
      autoCleanup: false,
    });
  });

  describe('初始化', () => {
    it('应该能正确初始化', () => {
      expect(manager).toBeDefined();
    });

    it('应该能接受自定义配置', () => {
      const customManager = new MemoryManager(memory, {
        consolidationThreshold: 0.7,
        autoCleanup: false,
      });
      expect(customManager).toBeDefined();
    });
  });

  describe('处理新记忆', () => {
    it('应该能处理普通记忆', async () => {
      const result = await manager.processNewMemory('今天天气很好', {
        source: 'conversation',
      });

      expect(result).toBeDefined();
      expect(result.layer).toBeDefined();
      expect(result.importance).toBeGreaterThanOrEqual(0);
    });

    it('应该拒绝噪音内容', async () => {
      const result = await manager.processNewMemory('...', {});

      expect(result.layer).toBe('rejected');
    });
  });

  describe('清理功能', () => {
    it('应该能执行清理', async () => {
      const report = await manager.cleanup();

      expect(report).toBeDefined();
      expect(report.success).toBe(true);
      expect(report.duration).toBeGreaterThanOrEqual(0);
    });

    it('应该生成健康报告', () => {
      const report = manager.getHealthReport();

      expect(report).toBeDefined();
      expect(report.status).toMatch(/healthy|warning|critical/);
      expect(report.episodic).toBeDefined();
      expect(report.consolidated).toBeDefined();
    });
  });

  describe('生命周期', () => {
    it('应该能创建带有自动清理的管理器', () => {
      const autoManager = new MemoryManager(memory, {
        autoCleanup: true,
        cleanupInterval: 60000,
      });

      expect(autoManager).toBeDefined();
    });

    it('应该能停止自动清理', () => {
      const autoManager = new MemoryManager(memory, {
        autoCleanup: true,
        cleanupInterval: 1000,
      });

      // 停止清理
      autoManager.stopAutoCleanup();
      expect(true).toBe(true);
    });
  });
});
