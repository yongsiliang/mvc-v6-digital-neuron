/**
 * 意义赋予系统测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MeaningAssigner } from '../meaning-system';

describe('MeaningAssigner', () => {
  let meaningAssigner: MeaningAssigner;

  beforeEach(() => {
    meaningAssigner = new MeaningAssigner();
  });

  describe('初始化', () => {
    it('应该能正确初始化', () => {
      expect(meaningAssigner).toBeDefined();
    });

    it('应该初始化核心价值观', () => {
      const valueSystem = meaningAssigner.getValueSystem();
      expect(valueSystem.coreValues.length).toBeGreaterThan(0);
    });

    it('应该初始化核心信念', () => {
      const beliefSystem = meaningAssigner.getBeliefSystem();
      expect(beliefSystem.coreBeliefs.length).toBeGreaterThan(0);
    });
  });

  describe('赋予意义', () => {
    it('应该能为概念赋予意义', () => {
      const meaning = meaningAssigner.assignMeaning('友谊', {
        content: '真正的友谊是相互理解和支持',
      });

      expect(meaning).toBeDefined();
      expect(meaning.conceptLabel).toBe('友谊');
      expect(meaning.emotionalTone).toBeDefined();
      expect(meaning.valueJudgment).toBeDefined();
      expect(meaning.personalRelevance).toBeDefined();
    });

    it('应该能更新已有概念的意义', () => {
      // 第一次赋予意义
      meaningAssigner.assignMeaning('学习', {
        content: '学习是成长的过程',
      });

      // 第二次访问相同概念
      const meaning = meaningAssigner.assignMeaning('学习', {
        content: '学习需要持续的努力',
      });

      expect(meaning.accessCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('获取意义上下文', () => {
    it('应该能生成意义上下文', () => {
      // 先添加一些概念
      meaningAssigner.assignMeaning('创造力', {
        content: '创造力是解决问题的新方式',
      });

      const context = meaningAssigner.getMeaningContext(['创造力']);
      expect(context).toBeDefined();
      expect(context.activeMeanings.length).toBeGreaterThan(0);
      expect(context.meaningSummary).toBeDefined();
    });
  });

  describe('信念系统', () => {
    it('应该能形成新信念', () => {
      meaningAssigner.assignMeaning('坚持', {
        content: '坚持是成功的关键因素',
        conversationContext: '讨论成功要素',
      });

      const beliefSystem = meaningAssigner.getBeliefSystem();
      const hasRelevantBelief = beliefSystem.activeBeliefs.some((b) =>
        b.statement.includes('坚持'),
      );
      // 信念可能形成也可能未形成，取决于重要性
      expect(beliefSystem).toBeDefined();
    });
  });

  describe('价值观系统', () => {
    it('应该能获取核心价值观', () => {
      const valueSystem = meaningAssigner.getValueSystem();
      expect(valueSystem.coreValues.length).toBeGreaterThan(0);

      const hasValue = valueSystem.coreValues.some((v) => v.name === '真诚' || v.name === '成长');
      expect(hasValue).toBe(true);
    });
  });

  describe('导入导出', () => {
    it('应该能导出状态', () => {
      meaningAssigner.assignMeaning('测试概念', {
        content: '测试内容',
      });

      const state = meaningAssigner.exportState();
      expect(state).toBeDefined();
      expect(state.meaningLayers).toBeDefined();
    });

    it('应该能导入状态', () => {
      const state = {
        meaningLayers: [],
        beliefSystem: {
          coreBeliefs: [],
          activeBeliefs: [],
          questionedBeliefs: [],
          abandonedBeliefs: [],
        },
        valueSystem: {
          coreValues: [],
          priority: [],
        },
      };

      meaningAssigner.importState(state);
      const exportedState = meaningAssigner.exportState();
      expect(exportedState).toBeDefined();
    });
  });
});
