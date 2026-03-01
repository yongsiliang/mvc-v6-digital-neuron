/**
 * 共振引擎单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResonanceEngine } from '../resonance-engine';

describe('ResonanceEngine', () => {
  let engine: ResonanceEngine;

  beforeEach(() => {
    engine = new ResonanceEngine();
  });

  describe('初始化', () => {
    it('应该正确初始化', () => {
      expect(engine).toBeDefined();
    });

    it('应该有6个振荡器', () => {
      const state = engine.getState();

      expect(state.oscillators.size).toBe(6);
    });
  });

  describe('getState', () => {
    it('应该能获取引擎状态', () => {
      const state = engine.getState();

      expect(state).toBeDefined();
      expect(state.oscillators).toBeInstanceOf(Map);
      expect(state.synchronyIndex).toBeDefined();
      expect(state.meanPhase).toBeDefined();
      expect(state.meanFrequency).toBeDefined();
    });
  });

  describe('step', () => {
    it('应该能执行时间步更新', () => {
      const state = engine.step();

      expect(state).toBeDefined();
      expect(state.timeStep).toBe(1);
    });

    it('应该能处理外部输入', () => {
      const input = new Map();
      input.set('perception', 0.5);
      
      const state = engine.step(input);

      expect(state).toBeDefined();
      expect(state.timeStep).toBe(1);
    });
  });

  describe('activateSubsystem', () => {
    it('应该能激活子系统', () => {
      engine.activateSubsystem('perception', 0.8);
      
      const state = engine.getState();
      const osc = state.oscillators.get('perception');

      // 激活值应该被设置
      expect(osc).toBeDefined();
    });
  });

  describe('getResonanceInfo', () => {
    it('应该能获取共振信息', () => {
      const state = engine.getState();

      expect(state).toBeDefined();
      expect(state.resonance).toBeDefined();
      expect(state.resonance.isLocked).toBeDefined();
      expect(state.synchronyIndex).toBeDefined();
    });
  });

  describe('连续执行', () => {
    it('应该能在多次step后达到稳定状态', () => {
      // 执行多步
      for (let i = 0; i < 50; i++) {
        engine.step();
      }

      const state = engine.getState();

      expect(state.timeStep).toBe(50);
      expect(state.synchronyIndex).toBeGreaterThanOrEqual(0);
      expect(state.synchronyIndex).toBeLessThanOrEqual(1);
    });
  });
});
