/**
 * 元认知引擎单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MetacognitionEngine, createMetacognitionEngine } from '../metacognition';

describe('MetacognitionEngine', () => {
  let engine: MetacognitionEngine;

  beforeEach(() => {
    engine = createMetacognitionEngine();
  });

  describe('思考链管理', () => {
    it('应该能开始思考步骤', () => {
      const stepId = engine.beginThinkingStep(
        'analysis',
        '测试输入',
        '分析测试数据'
      );
      
      expect(stepId).toBeDefined();
      expect(typeof stepId).toBe('string');
    });

    it('应该能完成思考步骤', () => {
      const stepId = engine.beginThinkingStep(
        'inference',
        '推理输入',
        '进行推理分析'
      );
      
      // 应该不会抛出错误
      expect(() => {
        engine.completeThinkingStep(stepId, '推理结果', 0.85);
      }).not.toThrow();
    });

    it('应该支持不同类型的思考步骤', () => {
      const types = ['perception', 'analysis', 'inference', 'evaluation', 'decision', 'reflection'];
      
      types.forEach(type => {
        const stepId = engine.beginThinkingStep(type as any, `${type}输入`, `${type}描述`);
        expect(stepId).toBeDefined();
      });
    });
  });

  describe('反思功能', () => {
    it('应该能执行反思', () => {
      // 先添加一些思考步骤
      engine.beginThinkingStep('analysis', '问题分析', '分析当前情况');
      engine.beginThinkingStep('inference', '推理', '得出初步结论');
      
      const reflection = engine.reflect();
      
      expect(reflection).toBeDefined();
      expect(reflection.triggerThinking).toBeDefined();
      expect(reflection.observation).toBeDefined();
      expect(reflection.learning).toBeDefined();
      expect(reflection.improvement).toBeDefined();
    });

    it('反思应该包含观察内容', () => {
      engine.beginThinkingStep('evaluation', '评估', '评估方案可行性');
      
      const reflection = engine.reflect();
      
      expect(reflection.observation.howIWasThinking).toBeDefined();
      expect(reflection.observation.whatWorked).toBeDefined();
      expect(reflection.observation.whatDidNotWork).toBeDefined();
    });
  });

  describe('元认知上下文', () => {
    it('应该能获取元认知上下文', () => {
      const context = engine.getContext();
      
      expect(context).toBeDefined();
      expect(context.currentState).toBeDefined();
      expect(context.biases).toBeDefined();
      expect(context.activeStrategies).toBeDefined();
      expect(context.reminders).toBeDefined();
      expect(context.selfQuestions).toBeDefined();
    });

    it('上下文应包含清晰度、深度和负荷', () => {
      const context = engine.getContext();
      
      expect(context.currentState.clarity).toBeGreaterThanOrEqual(0);
      expect(context.currentState.clarity).toBeLessThanOrEqual(1);
      expect(context.currentState.depth).toBeGreaterThanOrEqual(0);
      expect(context.currentState.depth).toBeLessThanOrEqual(1);
      expect(context.currentState.load).toBeGreaterThanOrEqual(0);
      expect(context.currentState.load).toBeLessThanOrEqual(1);
    });
  });

  describe('状态导入导出', () => {
    it('应该能导出状态', () => {
      engine.beginThinkingStep('analysis', '测试', '测试导出');
      
      const state = engine.exportState();
      
      expect(state).toBeDefined();
      expect(state.strategies).toBeDefined();
      expect(Array.isArray(state.strategies)).toBe(true);
      expect(state.reflections).toBeDefined();
      expect(Array.isArray(state.reflections)).toBe(true);
    });

    it('应该能导入状态', () => {
      const initialState = engine.exportState();
      
      // 创建新引擎并导入状态
      const newEngine = createMetacognitionEngine();
      
      expect(() => {
        newEngine.importState(initialState);
      }).not.toThrow();
    });
  });
});
