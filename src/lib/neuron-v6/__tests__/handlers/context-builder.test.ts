/**
 * 上下文构建器单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContextBuilder } from '../../consciousness-core/handlers/context-builder';
import { createHandlerDeps } from '../test-utils';

describe('ContextBuilder', () => {
  let builder: ContextBuilder;
  let deps: ReturnType<typeof createHandlerDeps>;

  beforeEach(() => {
    deps = createHandlerDeps();
    builder = new ContextBuilder({
      longTermMemory: deps.longTermMemory,
      selfConsciousness: deps.selfConsciousness,
      meaningAssigner: deps.meaningAssigner,
      metacognition: deps.metacognition,
      conversationHistory: deps.conversationHistory,
    });
  });

  describe('buildContext', () => {
    it('应该能构建上下文', async () => {
      const context = await builder.buildContext('你好，今天天气怎么样？');

      expect(context).toBeDefined();
      expect(context.identity).toBeDefined();
      expect(context.memory).toBeDefined();
    });

    it('应该在无输入时也能构建上下文', async () => {
      const context = await builder.buildContext('');

      expect(context).toBeDefined();
      expect(context.identity).toBeDefined();
    });
  });
});
