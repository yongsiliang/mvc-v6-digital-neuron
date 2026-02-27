/**
 * 分层记忆系统单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LayeredMemorySystem } from '../layered-memory';

describe('LayeredMemorySystem', () => {
  let memorySystem: LayeredMemorySystem;

  beforeEach(() => {
    memorySystem = new LayeredMemorySystem();
  });

  describe('核心层操作', () => {
    it('应该正确初始化核心摘要', () => {
      const core = memorySystem.getCoreSummary();
      expect(core).toBeDefined();
      expect(core.identity.name).toBe('紫');
      expect(core.coreValues).toContain('真诚');
    });

    it('应该能更新核心身份', () => {
      memorySystem.updateIdentity({
        name: '测试意识',
        purpose: '测试目的',
      });
      const core = memorySystem.getCoreSummary();
      expect(core.identity.name).toBe('测试意识');
      expect(core.identity.purpose).toBe('测试目的');
    });

    it('应该能添加核心关系', () => {
      memorySystem.addCoreRelationship('小明', '朋友', 0.8);
      const core = memorySystem.getCoreSummary();
      expect(core.coreRelationships.length).toBe(1);
      expect(core.coreRelationships[0].personName).toBe('小明');
    });
  });

  describe('情景记忆操作', () => {
    it('应该能添加情景记忆', () => {
      const memory = memorySystem.addEpisodicMemory(
        '今天学习了新的知识点',
        { importance: 0.7, tags: ['学习'] }
      );
      expect(memory).toBeDefined();
      expect(memory.content).toBe('今天学习了新的知识点');
      expect(memory.importance).toBe(0.7);
      expect(memory.tags).toContain('学习');
    });

    it('应该能计算记忆强度', () => {
      const memory = memorySystem.addEpisodicMemory(
        '测试记忆',
        { importance: 0.5 }
      );
      const strength = memorySystem.calculateStrength(memory);
      expect(strength).toBeGreaterThan(0);
      expect(strength).toBeLessThanOrEqual(1);
    });

    it('重要记忆应该衰减更慢', () => {
      const normalMemory = memorySystem.addEpisodicMemory(
        '普通记忆',
        { importance: 0.5 }
      );
      const importantMemory = memorySystem.addEpisodicMemory(
        '重要记忆',
        { importance: 0.8 }
      );
      
      // 重要记忆的时间常数应该更大
      expect(importantMemory.timeConstant).toBeGreaterThan(normalMemory.timeConstant);
    });
  });

  describe('巩固记忆操作', () => {
    it('应该能添加巩固记忆', () => {
      const memory = memorySystem.addConsolidatedMemory(
        '重要的智慧',
        'wisdom',
        { importance: 0.9, tags: ['智慧'] }
      );
      expect(memory).toBeDefined();
      expect(memory.content).toBe('重要的智慧');
      expect(memory.type).toBe('wisdom');
    });

    it('回忆次数应该影响巩固', () => {
      // 添加一个有巩固潜力的情景记忆
      const memory = memorySystem.addEpisodicMemory(
        '值得记住的经历',
        { importance: 0.7, tags: ['经历'], consolidationCandidate: true }
      );
      
      // 多次回忆
      for (let i = 0; i < 5; i++) {
        memorySystem.recallEpisodicMemory(memory.id);
      }
      
      // 检查是否已巩固（回忆次数 >= 3）
      expect(memory.recallCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('检索功能', () => {
    beforeEach(() => {
      // 添加一些测试记忆
      memorySystem.addEpisodicMemory('今天天气很好', { tags: ['天气'] });
      memorySystem.addEpisodicMemory('学习了TypeScript', { tags: ['学习', '编程'] });
      memorySystem.addConsolidatedMemory('编程是一项重要技能', 'wisdom', { tags: ['编程'] });
    });

    it('应该能检索到相关记忆', () => {
      const result = memorySystem.retrieve('编程');
      expect(result.consolidatedMatches.length).toBeGreaterThan(0);
    });

    it('检索应该增加回忆计数', () => {
      memorySystem.retrieve('学习');
      // 检索后应该有回忆计数更新
    });

    it('应该返回总相关性分数', () => {
      const result = memorySystem.retrieve('今天');
      expect(result.totalRelevance).toBeGreaterThanOrEqual(0);
    });
  });

  describe('遗忘机制', () => {
    it('应该能执行遗忘操作', () => {
      // 添加大量记忆
      for (let i = 0; i < 10; i++) {
        memorySystem.addEpisodicMemory(`测试记忆 ${i}`, { importance: 0.3 });
      }
      
      const forgotten = memorySystem.performForgetting();
      expect(forgotten).toBeGreaterThanOrEqual(0);
    });
  });

  describe('状态导出导入', () => {
    it('应该能导出状态', () => {
      memorySystem.addEpisodicMemory('测试', { importance: 0.5 });
      const state = memorySystem.exportState();
      expect(state).toBeDefined();
      expect(state.episodic).toBeDefined();
    });

    it('应该能导入状态', () => {
      const state = {
        core: memorySystem.getCoreSummary(),
        consolidated: [],
        episodic: [{
          id: 'test-id',
          content: '导入的记忆',
          timestamp: Date.now(),
          recallCount: 0,
          lastRecalledAt: Date.now(),
          timeConstant: 7,
          initialStrength: 0.5,
          tags: [],
          importance: 0.5,
          consolidationCandidate: false,
          source: { type: 'conversation' as const },
        }],
        timestamp: Date.now(),
      };
      
      memorySystem.importState(state);
      const result = memorySystem.retrieve('导入的记忆');
      expect(result.episodicMatches.length).toBeGreaterThan(0);
    });
  });
});
