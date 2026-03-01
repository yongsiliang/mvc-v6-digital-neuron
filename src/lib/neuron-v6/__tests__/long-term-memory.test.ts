/**
 * 长期记忆系统单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LongTermMemory } from '../long-term-memory';

describe('LongTermMemory', () => {
  let memory: LongTermMemory;

  beforeEach(() => {
    memory = new LongTermMemory();
  });

  describe('addNode', () => {
    it('应该能添加知识节点', () => {
      const node = memory.addNode({
        label: '测试概念',
        type: 'concept',
        content: '这是一个测试概念',
        importance: 0.8,
        tags: ['测试'],
      });

      expect(node).toBeDefined();
      expect(node.id).toBeDefined();
      expect(node.label).toBe('测试概念');
      expect(node.type).toBe('concept');
      expect(node.importance).toBe(0.8);
    });

    it('应该为节点生成默认值', () => {
      const node = memory.addNode({
        label: '最小节点',
      });

      expect(node.id).toBeDefined();
      expect(node.type).toBe('concept');
      expect(node.importance).toBe(0.5);
      expect(node.accessCount).toBe(1);
    });
  });

  describe('linkKnowledge', () => {
    it('应该能连接两个知识节点', () => {
      const node1 = memory.addNode({ label: '节点1' });
      const node2 = memory.addNode({ label: '节点2' });

      const link = memory.linkKnowledge(node1.id, node2.id, 'relates_to');

      expect(link).toBeDefined();
      expect(link!.from).toBe(node1.id);
      expect(link!.to).toBe(node2.id);
      expect(link!.relation).toBe('relates_to');
    });

    it('应该返回 null 如果节点不存在', () => {
      const link = memory.linkKnowledge('non-existent', 'also-non-existent', 'relates_to');

      expect(link).toBeNull();
    });

    it('应该增强已存在的连接', () => {
      const node1 = memory.addNode({ label: '节点1' });
      const node2 = memory.addNode({ label: '节点2' });

      const link1 = memory.linkKnowledge(node1.id, node2.id, 'relates_to');
      const link2 = memory.linkKnowledge(node1.id, node2.id, 'relates_to');

      // 强度应该增加
      expect(link2!.strength).toBeGreaterThanOrEqual(link1!.strength);
      expect(link2!.validationCount).toBe(2);
    });
  });

  describe('recordExperience', () => {
    it('应该能记录经验', () => {
      const experience = memory.recordExperience({
        title: '学习测试',
        situation: '遇到了测试场景',
        action: '编写了测试代码',
        outcome: '测试通过了',
        learning: '测试很重要',
        importance: 0.7,
      });

      expect(experience).toBeDefined();
      expect(experience.id).toBeDefined();
      expect(experience.title).toBe('学习测试');
      expect(experience.learning).toBe('测试很重要');
    });
  });

  describe('addWisdom', () => {
    it('应该能添加智慧结晶', () => {
      const wisdom = memory.addWisdom({
        statement: '测试驱动开发能提高代码质量',
        applicableContexts: ['开发', '编程'],
        confidence: 0.85,
      });

      expect(wisdom).toBeDefined();
      expect(wisdom).not.toBeNull();
      expect(wisdom!.id).toBeDefined();
      expect(wisdom!.statement).toBe('测试驱动开发能提高代码质量');
      expect(wisdom!.confidence).toBe(0.85);
    });
  });

  describe('retrieve', () => {
    it('应该能检索相关记忆', () => {
      memory.addNode({
        label: '编程',
        content: '编程是创建软件的过程',
        tags: ['技能'],
      });

      const result = memory.retrieve('编程');

      expect(result).toBeDefined();
      expect(result.directMatches).toBeDefined();
      expect(Array.isArray(result.directMatches)).toBe(true);
    });

    it('应该返回包含相关经验的检索结果', () => {
      memory.recordExperience({
        title: '编程经验',
        situation: '编写代码',
        action: '测试驱动开发',
        outcome: '代码质量提升',
        learning: '测试很重要',
      });

      const result = memory.retrieve('编程');

      expect(result.relevantExperiences).toBeDefined();
      expect(Array.isArray(result.relevantExperiences)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('应该能返回记忆统计信息', () => {
      memory.addNode({ label: '概念1' });
      memory.addNode({ label: '概念2' });
      memory.recordExperience({ title: '经验1' });

      const stats = memory.getStats();

      expect(stats).toBeDefined();
      expect(stats.nodeCount).toBeGreaterThanOrEqual(2);
      expect(stats.experienceCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getMemoryHealthReport', () => {
    it('应该能生成记忆健康报告', () => {
      const report = memory.getMemoryHealthReport();

      expect(report).toBeDefined();
      expect(report.totalNodes).toBeDefined();
      expect(report.healthyNodes).toBeDefined();
      expect(report.averageImportance).toBeDefined();
    });
  });
});
