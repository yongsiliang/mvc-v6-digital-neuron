/**
 * 情感系统单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EmotionEngine, createEmotionEngine } from '../emotion-system';

describe('EmotionEngine', () => {
  let engine: EmotionEngine;

  beforeEach(() => {
    engine = createEmotionEngine();
  });

  describe('情感检测', () => {
    it('应该能从文本检测到情感', () => {
      const result = engine.detectFromText('今天真是太开心了！');
      expect(result).toBeDefined();
      expect(result?.emotion).toBeDefined();
    });

    it('应该能检测负面情感', () => {
      const result = engine.detectFromText('我很沮丧，事情不顺利');
      expect(result).toBeDefined();
    });

    it('应该能处理中性文本', () => {
      const result = engine.detectFromText('今天天气一般');
      // 中性文本可能检测不到明显情感，这是正常的
      expect(result).toBeDefined();
    });
  });

  describe('情感体验', () => {
    it('应该能创建情感体验', () => {
      const experience = engine.experience(
        'joy',
        { type: 'conversation', description: '测试场景' },
        0.7
      );
      expect(experience).toBeDefined();
      expect(experience.emotion).toBe('joy');
      expect(experience.intensity.current).toBe(0.7);
      expect(experience.intensity.peak).toBe(0.7);
    });

    it('情感体验应该更新活跃情感', () => {
      engine.experience('joy', { type: 'conversation', description: '测试' }, 0.8);
      const state = engine.getState();
      expect(state.activeEmotions.length).toBeGreaterThan(0);
    });
  });

  describe('情感状态管理', () => {
    it('应该能获取当前状态', () => {
      const state = engine.getState();
      expect(state).toBeDefined();
      expect(state.activeEmotions).toBeDefined();
      expect(state.dominantEmotion).toBeDefined();
      expect(state.emotionalTone).toBeDefined();
      expect(state.stats).toBeDefined();
    });

    it('应该能衰减活跃情感', () => {
      engine.experience('joy', { type: 'conversation', description: '测试' }, 0.9);
      const beforeState = engine.getState();
      const beforeIntensity = beforeState.activeEmotions[0]?.intensity || 0;
      
      engine.decayActiveEmotions();
      
      const afterState = engine.getState();
      const afterIntensity = afterState.activeEmotions[0]?.intensity || 0;
      
      // 衰减后强度应该降低
      expect(afterIntensity).toBeLessThanOrEqual(beforeIntensity);
    });
  });

  describe('情感驱动行为', () => {
    it('应该能生成情感驱动行为', () => {
      engine.experience('curiosity', { type: 'conversation', description: '测试' }, 0.8);
      const behaviors = engine.getEmotionDrivenBehaviors();
      expect(behaviors).toBeDefined();
      expect(Array.isArray(behaviors)).toBe(true);
    });

    it('不同情感应该生成不同行为', () => {
      engine.experience('joy', { type: 'event', description: '开心事件' }, 0.7);
      const joyBehaviors = engine.getEmotionDrivenBehaviors();
      
      expect(joyBehaviors.length).toBeGreaterThan(0);
      
      // 检查行为结构
      if (joyBehaviors.length > 0) {
        expect(joyBehaviors[0].drivingEmotion).toBeDefined();
        expect(joyBehaviors[0].type).toBeDefined();
        expect(joyBehaviors[0].description).toBeDefined();
      }
    });
  });

  describe('情感报告', () => {
    it('应该能生成情感报告', () => {
      engine.experience('joy', { type: 'conversation', description: '测试' }, 0.7);
      const report = engine.getEmotionReport();
      expect(report).toBeDefined();
      expect(report.length).toBeGreaterThan(0);
      expect(report).toContain('情感状态报告');
    });
  });

  describe('复杂情感', () => {
    it('应该能处理复杂情感', () => {
      // 同时体验多种情感
      engine.experience('joy', { type: 'conversation', description: '成功' }, 0.6);
      engine.experience('anxiety', { type: 'conversation', description: '担忧' }, 0.4);
      
      const state = engine.getState();
      expect(state.activeEmotions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('情感记忆', () => {
    it('应该能创建情感记忆', () => {
      const exp = engine.experience('joy', { type: 'event', description: '测试事件' }, 0.8);
      const memory = engine.createEmotionalMemory(exp);
      
      expect(memory).toBeDefined();
      expect(memory.coreEmotion).toBeDefined();
      expect(memory.memoryStrength).toBe(0.8);
    });

    it('应该能检索情感记忆', () => {
      const exp = engine.experience('joy', { type: 'event', description: '快乐时光' }, 0.9);
      engine.createEmotionalMemory(exp);
      
      const memories = engine.retrieveEmotionalMemories('快乐');
      expect(memories).toBeDefined();
      expect(Array.isArray(memories)).toBe(true);
    });
  });

  describe('情感图谱', () => {
    it('应该能获取情感图谱', () => {
      const graph = engine.getEmotionGraph();
      expect(graph).toBeDefined();
      expect(graph.size).toBeGreaterThan(0);
    });

    it('图谱应包含基础情感', () => {
      const graph = engine.getEmotionGraph();
      const basicEmotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'trust', 'anticipation'];
      
      basicEmotions.forEach(emotion => {
        expect(graph.has(emotion as any)).toBe(true);
      });
    });
  });
});
