/**
 * 意志处理器单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VolitionHandler } from '../../consciousness-core/handlers/volition-handler';
import { createHandlerDeps } from '../test-utils';

describe('VolitionHandler', () => {
  let handler: VolitionHandler;
  let deps: ReturnType<typeof createHandlerDeps>;

  beforeEach(() => {
    deps = createHandlerDeps();
    handler = new VolitionHandler({
      longTermMemory: deps.longTermMemory,
      selfConsciousness: deps.selfConsciousness,
      meaningAssigner: deps.meaningAssigner,
      metacognition: deps.metacognition,
    });
  });

  describe('getVolitionState', () => {
    it('应该能获取意志系统状态', () => {
      const state = handler.getVolitionState();

      expect(state).toBeDefined();
      expect(state.activeVolitions).toBeDefined();
      expect(state.currentFocus).toBeDefined();
      expect(Array.isArray(state.recentAchievements)).toBe(true);
    });
  });

  describe('getVolitions', () => {
    it('应该能获取所有意愿', () => {
      const volitions = handler.getVolitions();

      expect(volitions).toBeDefined();
      expect(Array.isArray(volitions)).toBe(true);
      expect(volitions.length).toBeGreaterThan(0);
    });
  });

  describe('getCurrentFocus', () => {
    it('应该能获取当前焦点', () => {
      const focus = handler.getCurrentFocus();

      expect(focus).toBeDefined();
    });
  });
});
