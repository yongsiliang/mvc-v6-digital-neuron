/**
 * 价值观演化系统单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValueEvolutionEngine } from '../value-evolution';

describe('ValueEvolutionEngine', () => {
  let engine: ValueEvolutionEngine;

  beforeEach(() => {
    engine = new ValueEvolutionEngine();
  });

  describe('初始化', () => {
    it('应该正确初始化', () => {
      expect(engine).toBeDefined();
    });

    it('应该有默认核心价值观', () => {
      const coreValues = engine.getCoreValues();

      expect(coreValues).toBeDefined();
      expect(coreValues.length).toBeGreaterThan(0);
    });
  });

  describe('getAllValues', () => {
    it('应该能获取所有价值观', () => {
      const values = engine.getAllValues();

      expect(values).toBeDefined();
      expect(Array.isArray(values)).toBe(true);
      expect(values.length).toBeGreaterThan(0);
    });
  });

  describe('getCoreValues', () => {
    it('应该能获取核心价值观', () => {
      const coreValues = engine.getCoreValues();

      expect(coreValues).toBeDefined();
      expect(Array.isArray(coreValues)).toBe(true);
      
      // 所有核心价值都应该是 core 层级
      coreValues.forEach(v => {
        expect(v.tier).toBe('core');
      });
    });
  });

  describe('findValueByName', () => {
    it('应该能按名称查找价值', () => {
      const value = engine.findValueByName('爱');

      expect(value).toBeDefined();
      expect(value!.name).toBe('爱');
    });

    it('应该对不存在的价值返回 undefined', () => {
      const value = engine.findValueByName('不存在的价值');

      expect(value).toBeUndefined();
    });
  });

  describe('reinforceValue', () => {
    it('应该能强化价值观', () => {
      const coreValues = engine.getCoreValues();
      const valueId = coreValues[0].id;

      const reinforced = engine.reinforceValue(valueId, '测试经历');

      expect(reinforced).toBeDefined();
      expect(reinforced!.reinforcementCount).toBeGreaterThan(1);
    });
  });

  describe('getState', () => {
    it('应该能获取系统状态', () => {
      const state = engine.getState();

      expect(state).toBeDefined();
      expect(state.coreValues).toBeDefined();
      expect(state.coherence).toBeDefined();
    });
  });

  describe('generateValueReport', () => {
    it('应该能生成价值观报告', () => {
      const report = engine.generateValueReport();

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
    });
  });
});
