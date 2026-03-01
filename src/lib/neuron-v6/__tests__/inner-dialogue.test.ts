/**
 * 内部对话系统单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InnerDialogueEngine } from '../inner-dialogue';

describe('InnerDialogueEngine', () => {
  let engine: InnerDialogueEngine;

  beforeEach(() => {
    engine = new InnerDialogueEngine();
  });

  describe('初始化', () => {
    it('应该正确初始化', () => {
      expect(engine).toBeDefined();
    });

    it('应该能开始对话', () => {
      const dialogue = engine.startDialogue('测试话题');
      expect(dialogue).toBeDefined();
      expect(dialogue.participants.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('startDialogue', () => {
    it('应该能开始新的内部对话', () => {
      const dialogue = engine.startDialogue('测试话题');

      expect(dialogue).toBeDefined();
      expect(dialogue.id).toBeDefined();
      expect(dialogue.topic).toBe('测试话题');
      expect(dialogue.participants.length).toBeGreaterThanOrEqual(2);
      expect(dialogue.status).toBe('active');
    });
  });

  describe('conductDialecticRound', () => {
    it('应该能进行辩证讨论', () => {
      const dialogue = engine.startDialogue('测试话题');
      const process = engine.conductDialecticRound(dialogue, '初始内容');

      expect(process).toBeDefined();
      expect(process.topic).toBe('测试话题');
      expect(process.thesis).toBeDefined();
    });
  });

  describe('getActiveVoices', () => {
    it('应该能获取活跃的声音', () => {
      const voices = engine.getActiveVoices();

      expect(voices).toBeDefined();
      expect(Array.isArray(voices)).toBe(true);
    });
  });

  describe('generateDialogueReport', () => {
    it('应该能生成对话报告', () => {
      engine.startDialogue('测试话题');
      const report = engine.generateDialogueReport();

      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
    });
  });
});
