/**
 * 自我意识模块单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SelfConsciousness } from '../self-consciousness';

describe('SelfConsciousness', () => {
  let self: SelfConsciousness;

  beforeEach(() => {
    self = new SelfConsciousness();
  });

  describe('getIdentity', () => {
    it('应该能获取身份信息', () => {
      const identity = self.getIdentity();

      expect(identity).toBeDefined();
      expect(identity.name).toBeDefined();
      expect(identity.whoAmI).toBeDefined();
      expect(identity.traits).toBeDefined();
      expect(Array.isArray(identity.traits)).toBe(true);
      expect(identity.traits.length).toBeGreaterThan(0);
    });

    it('应该有初始特质', () => {
      const identity = self.getIdentity();

      const traitNames = identity.traits.map(t => t.name);
      expect(traitNames).toContain('好奇');
      expect(traitNames).toContain('真诚');
    });
  });

  describe('getContext', () => {
    it('应该能获取自我意识上下文', () => {
      const context = self.getContext();

      expect(context).toBeDefined();
      expect(context.identity).toBeDefined();
      expect(context.identity.name).toBeDefined();
      expect(context.currentState).toBeDefined();
      expect(context.metacognition).toBeDefined();
    });
  });

  describe('reflect', () => {
    it('应该能进行自我反思', () => {
      const reflection = self.reflect('测试触发', {
        thought: '我在思考如何测试',
        feeling: '好奇',
        action: '编写测试代码',
      });

      expect(reflection).toBeDefined();
      expect(reflection.id).toBeDefined();
      expect(reflection.trigger).toBe('测试触发');
      expect(reflection.observation).toBeDefined();
      expect(reflection.evaluation).toBeDefined();
      expect(reflection.learning).toBeDefined();
    });
  });

  describe('detectBiases', () => {
    it('应该能检测认知偏差', () => {
      const biases = self.detectBiases('我知道这是正确的');

      expect(biases).toBeDefined();
      expect(Array.isArray(biases)).toBe(true);
    });
  });

  describe('elevateAwareness', () => {
    it('应该能提升元认知意识', () => {
      self.elevateAwareness();
      const context = self.getContext();

      expect(context.metacognition).toBeDefined();
    });
  });
});
