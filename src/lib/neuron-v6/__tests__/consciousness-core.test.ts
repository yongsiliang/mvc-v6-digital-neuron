/**
 * 意识核心单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConsciousnessCore, createConsciousnessCore } from '../consciousness-core';

describe('ConsciousnessCore', () => {
  let core: ConsciousnessCore;

  beforeEach(() => {
    // 使用模拟的 LLMClient
    const mockLLMClient = {
      chat: {
        stream: async function* () {
          yield { event: 'message', data: { content: '模拟响应' } };
        },
      },
    };
    
    core = createConsciousnessCore(mockLLMClient as never);
  });

  afterEach(() => {
    core.stopBackgroundThinkingTimer();
  });

  describe('初始化', () => {
    it('应该正确初始化', () => {
      expect(core).toBeDefined();
    });

    it('应该有处理器实例', () => {
      expect(core).toBeDefined();
    });
  });

  describe('process', () => {
    it('应该能处理用户输入', async () => {
      const result = await core.process('你好');

      expect(result).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.thinking).toBeDefined();
      expect(result.response).toBeDefined();
      expect(result.learning).toBeDefined();
    });
  });

  describe('getVolitionState', () => {
    it('应该能获取意愿状态', () => {
      const state = core.getVolitionState();

      expect(state).toBeDefined();
      expect(state.activeVolitions).toBeDefined();
      expect(state.currentFocus).toBeDefined();
      expect(Array.isArray(state.recentAchievements)).toBe(true);
    });
  });
});
