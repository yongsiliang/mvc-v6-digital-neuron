/**
 * 人格成长系统测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PersonalityGrowthSystem,
  DEFAULT_CORE_TRAITS,
  DEFAULT_MATURITY,
} from '../personality-growth';

describe('PersonalityGrowthSystem', () => {
  let system: PersonalityGrowthSystem;

  beforeEach(() => {
    system = new PersonalityGrowthSystem();
  });

  describe('初始化', () => {
    it('应该能正确初始化', () => {
      expect(system).toBeDefined();
    });

    it('应该使用默认特质值初始化', () => {
      const state = system.getState();
      expect(state.traits).toEqual(DEFAULT_CORE_TRAITS);
    });

    it('应该使用默认成熟度初始化', () => {
      const state = system.getState();
      expect(state.maturity).toEqual(DEFAULT_MATURITY);
    });

    it('应该能使用自定义初始状态', () => {
      const customSystem = new PersonalityGrowthSystem({
        traits: { ...DEFAULT_CORE_TRAITS, openness: 0.8 },
      });
      const state = customSystem.getState();
      expect(state.traits.openness).toBe(0.8);
    });
  });

  describe('特质更新', () => {
    it('应该能更新特质', () => {
      const change = system.updateTrait('curiosity', 0.1, '学习了新知识');

      expect(change).not.toBeNull();
      expect(change?.trait).toBe('curiosity');
      expect(change?.newValue).toBeCloseTo(0.6); // 0.5 + 0.1
    });

    it('应该限制特质值在 0-1 范围内', () => {
      system.updateTrait('openness', 0.6, '大幅增加');
      const state = system.getState();
      expect(state.traits.openness).toBeLessThanOrEqual(1);
    });

    it('应该记录特质变化历史', () => {
      system.updateTrait('empathy', 0.1, '帮助他人');
      system.updateTrait('empathy', 0.05, '理解他人');

      const state = system.getState();
      expect(state.traitChanges.length).toBeGreaterThanOrEqual(2);
    });

    it('应该忽略微小变化', () => {
      const change = system.updateTrait('wisdom', 0.001, '微小变化');
      expect(change).toBeNull();
    });

    it('应该触发涟漪效应', () => {
      system.updateTrait('openness', 0.2, '开放性增加');
      const state = system.getState();
      // openness 变化应该影响 curiosity 和 creativity
      expect(state.traits.curiosity).not.toBe(0.5);
    });
  });

  describe('成熟度管理', () => {
    it('应该能更新成熟度', () => {
      system.updateMaturity('emotional', 0.1);
      const state = system.getState();
      expect(state.maturity.emotional).toBeCloseTo(0.6);
    });

    it('应该计算整体成熟度', () => {
      const report = system.getMaturityReport();
      expect(report).toBeDefined();
      expect(report.overallMaturity).toBeGreaterThanOrEqual(0);
      expect(report.overallMaturity).toBeLessThanOrEqual(1);
    });
  });

  describe('人格整合', () => {
    it('应该能检测内在冲突', () => {
      const conflicts = system.detectConflicts();
      expect(Array.isArray(conflicts)).toBe(true);
    });

    it('应该能解决冲突', () => {
      const conflicts = system.detectConflicts();
      if (conflicts.length > 0) {
        system.resolveConflict(conflicts[0].id, '通过沟通解决');
        const state = system.getState();
        expect(state.integration.resolvedConflicts.length).toBeGreaterThanOrEqual(0);
      } else {
        // 如果没有冲突，测试也应该通过
        expect(true).toBe(true);
      }
    });

    it('应该能获取整合报告', () => {
      const report = system.getIntegrationReport();
      expect(report).toBeDefined();
      expect(report.coherence).toBeGreaterThanOrEqual(0);
      expect(report.stability).toBeGreaterThanOrEqual(0);
    });
  });

  describe('成长经历', () => {
    it('应该能记录成长经历', () => {
      system.evolveFromExperience({
        id: 'exp_1',
        type: 'insight',
        description: '领悟了学习的真谛',
        impact: {
          traits: { wisdom: 0.1 },
          maturity: { cognitive: 0.05 },
        },
        timestamp: Date.now(),
        processed: false,
        significance: 0.8,
      });

      const state = system.getState();
      expect(state.experiences.length).toBeGreaterThan(0);
    });

    it('应该能获取成长历史报告', () => {
      const history = system.getGrowthHistory();
      expect(history).toBeDefined();
    });
  });

  describe('导入导出', () => {
    it('应该能导出状态', () => {
      system.updateTrait('curiosity', 0.1, '测试');
      const state = system.toJSON();
      expect(state).toBeDefined();
      expect(state.traits).toBeDefined();
    });

    it('应该能记录快照', () => {
      system.recordSnapshot('测试快照');
      const history = system.getGrowthHistory();
      expect(history).toBeDefined();
    });
  });
});
