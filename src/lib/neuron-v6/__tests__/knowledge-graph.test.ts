/**
 * 知识图谱系统单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeGraphSystem } from '../knowledge-graph';

describe('KnowledgeGraphSystem', () => {
  let graph: KnowledgeGraphSystem;

  beforeEach(() => {
    graph = new KnowledgeGraphSystem();
  });

  describe('初始化', () => {
    it('应该正确初始化', () => {
      expect(graph).toBeDefined();
    });

    it('应该有默认领域', () => {
      const state = graph.getState();

      expect(state.domains.size).toBeGreaterThan(0);
    });
  });

  describe('getState', () => {
    it('应该能获取图谱状态', () => {
      const state = graph.getState();

      expect(state).toBeDefined();
      expect(state.domains).toBeInstanceOf(Map);
      expect(state.concepts).toBeInstanceOf(Map);
      expect(state.edges).toBeInstanceOf(Map);
      expect(state.stats).toBeDefined();
    });
  });

  describe('addConcept', () => {
    it('应该能添加新概念', () => {
      const concept = graph.addConcept('测试概念', 'technology', {
        description: '这是一个测试概念',
        importance: 0.8,
      });

      expect(concept).toBeDefined();
      expect(concept.name).toBe('测试概念');
      expect(concept.importance).toBe(0.8);
    });

    it('应该能强化已存在的概念', () => {
      graph.addConcept('编程', 'technology');
      const reinforced = graph.addConcept('编程', 'technology');

      expect(reinforced.learningCount).toBeGreaterThan(1);
    });
  });

  describe('addEdge', () => {
    it('应该能添加概念关联', () => {
      graph.addConcept('概念A', 'technology');
      graph.addConcept('概念B', 'technology');

      const edge = graph.addEdge('概念A', '概念B', 'related_to');

      expect(edge).toBeDefined();
      expect(edge!.relation).toBe('related_to');
    });
  });
});
