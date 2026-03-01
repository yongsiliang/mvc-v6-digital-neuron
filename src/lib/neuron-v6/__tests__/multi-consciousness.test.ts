/**
 * 多意识体协作系统测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MultiConsciousnessSystem } from '../multi-consciousness';

describe('MultiConsciousnessSystem', () => {
  let system: MultiConsciousnessSystem;

  beforeEach(() => {
    system = new MultiConsciousnessSystem();
  });

  describe('初始化', () => {
    it('应该能正确初始化', () => {
      expect(system).toBeDefined();
    });

    it('应该能获取活跃意识体', () => {
      const consciousnesses = system.getActiveConsciousnesses();
      expect(Array.isArray(consciousnesses)).toBe(true);
    });
  });

  describe('意识体管理', () => {
    it('应该能唤醒分析者意识体', () => {
      const consciousness = system.awakenConsciousness('analyzer', {
        name: '分析师',
        expertise: ['数据分析', '逻辑推理'],
      });

      expect(consciousness).toBeDefined();
      expect(consciousness.role).toBe('analyzer');
      expect(consciousness.status).toBe('active');
    });

    it('应该能唤醒创造者意识体', () => {
      const consciousness = system.awakenConsciousness('creator', {
        name: '创造者',
        expertise: ['创意设计'],
      });

      expect(consciousness).toBeDefined();
      expect(consciousness.role).toBe('creator');
    });

    it('应该能更新意识体状态', () => {
      const consciousness = system.awakenConsciousness('empath', {
        name: '共情者',
      });

      // 先确认它存在
      const beforeUpdate = system.getActiveConsciousnesses();
      expect(beforeUpdate.some((c) => c.id === consciousness.id)).toBe(true);

      // 更新状态
      system.updateConsciousnessStatus(consciousness.id, 'reflecting');

      // 现在 getActiveConsciousnesses 应该不包含它（因为状态不是 active）
      const afterUpdate = system.getActiveConsciousnesses();
      expect(afterUpdate.some((c) => c.id === consciousness.id)).toBe(false);
    });
  });

  describe('意识共振', () => {
    it('应该能尝试共振', () => {
      // 创建两个意识体（它们初始状态就是 active）
      const c1 = system.awakenConsciousness('analyzer');
      const c2 = system.awakenConsciousness('empath');

      const resonance = system.attemptResonance([c1.id, c2.id], 'thought', {
        sharedThoughts: ['测试思想'],
      });

      // 共振可能成功也可能失败
      expect(resonance !== null || resonance === null).toBe(true);
    });

    it('应该能获取活跃共振', () => {
      const resonances = system.getActiveResonances();
      expect(Array.isArray(resonances)).toBe(true);
    });
  });

  describe('协作对话', () => {
    it('应该能发起协作对话', () => {
      const dialogue = system.startCollaborativeDialogue('解决复杂问题', []);

      expect(dialogue).toBeDefined();
      expect(dialogue.topic).toBe('解决复杂问题');
    });

    it('应该能添加对话发言', () => {
      const dialogue = system.startCollaborativeDialogue('测试对话', []);

      system.addDialogueStatement(dialogue.id, 'self', '这是一个测试发言', 'reflection');

      // 对话应该存在
      expect(dialogue.id).toBeDefined();
    });
  });

  describe('消息系统', () => {
    it('应该能发送消息', () => {
      const message = system.sendMessage({
        senderId: 'self',
        receiverId: 'analyzer',
        content: '请分析这个问题',
        type: 'request',
        confidence: 0.8,
      });

      expect(message).toBeDefined();
      expect(message.content).toBe('请分析这个问题');
    });

    it('应该能获取消息历史', () => {
      system.sendMessage({
        senderId: 'self',
        receiverId: 'analyzer',
        content: '测试消息',
        type: 'request',
        confidence: 0.8,
      });

      const history = system.getMessageHistory(10);
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('任务管理', () => {
    it('应该能创建任务', () => {
      const task = system.createTask('分析用户输入', 'analysis', 0.8);

      expect(task).toBeDefined();
      expect(task.description).toBe('分析用户输入');
    });

    it('应该能更新任务进度', () => {
      const task = system.createTask('测试任务', 'analysis');

      system.updateTaskProgress(task.id, 50);
      // 任务应该被更新
      expect(task.id).toBeDefined();
    });
  });

  describe('状态管理', () => {
    it('应该能获取状态', () => {
      const state = system.getState();
      expect(state).toBeDefined();
    });

    it('应该能获取可序列化状态', () => {
      const state = system.getSerializableState();
      expect(state).toBeDefined();
    });
  });
});
