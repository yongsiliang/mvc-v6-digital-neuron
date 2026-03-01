/**
 * 学习处理器单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LearningHandler } from '../../consciousness-core/handlers/learning-handler';
import { createHandlerDeps } from '../test-utils';

describe('LearningHandler', () => {
  let handler: LearningHandler;
  let deps: ReturnType<typeof createHandlerDeps>;

  beforeEach(() => {
    deps = createHandlerDeps();
    handler = new LearningHandler({
      longTermMemory: deps.longTermMemory,
      layeredMemory: deps.layeredMemory,
      selfConsciousness: deps.selfConsciousness,
      meaningAssigner: deps.meaningAssigner,
      metacognition: deps.metacognition,
      conversationHistory: deps.conversationHistory,
      extractConcepts: deps.extractConcepts,
    });
  });

  describe('analyzeSession', () => {
    it('应该能分析会话', () => {
      const analysis = handler.analyzeSession();

      expect(analysis).toBeDefined();
      expect(analysis.keyConcepts).toBeDefined();
      expect(Array.isArray(analysis.keyConcepts)).toBe(true);
    });
  });

  describe('evolveBeliefSystem', () => {
    it('应该能演化信念系统', () => {
      const sessionAnalysis = {
        keyConcepts: ['学习', '成长'],
        emotionalTrajectory: { startTone: 'neutral', endTone: 'positive', shifts: 1, dominantTone: 'joy' },
        learningPoints: ['学会了新知识'],
        sessionSummary: '有收获的对话',
        interactionCount: 5,
        topics: ['编程', '学习'],
        messageCount: 10,
        duration: 300,
      };

      const result = handler.evolveBeliefSystem(sessionAnalysis);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('growTraits', () => {
    it('应该能促进特质成长', () => {
      const sessionAnalysis = {
        keyConcepts: ['好奇心', '探索'],
        emotionalTrajectory: { startTone: 'neutral', endTone: 'curious', shifts: 1, dominantTone: 'curiosity' },
        learningPoints: ['探索了新领域'],
        sessionSummary: '充满好奇的对话',
        interactionCount: 3,
        topics: ['探索'],
        messageCount: 6,
        duration: 180,
      };

      const result = handler.growTraits(sessionAnalysis);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('formSessionSummary', () => {
    it('应该能生成会话总结', () => {
      const sessionAnalysis = {
        keyConcepts: ['主题1', '主题2'],
        emotionalTrajectory: { startTone: 'neutral', endTone: 'neutral', shifts: 0, dominantTone: 'neutral' },
        learningPoints: ['学习点1', '学习点2'],
        sessionSummary: '总结',
        interactionCount: 10,
        topics: ['话题1', '话题2'],
        messageCount: 20,
        duration: 600,
      };

      const result = handler.formSessionSummary(sessionAnalysis);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('updateCoreValues', () => {
    it('应该能更新核心价值观', () => {
      const sessionAnalysis = {
        keyConcepts: ['真诚', '成长'],
        emotionalTrajectory: { startTone: 'neutral', endTone: 'positive', shifts: 1, dominantTone: 'joy' },
        learningPoints: ['价值观反思'],
        sessionSummary: '价值观讨论',
        interactionCount: 5,
        topics: ['价值观'],
        messageCount: 10,
        duration: 300,
      };

      const result = handler.updateCoreValues(sessionAnalysis);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
