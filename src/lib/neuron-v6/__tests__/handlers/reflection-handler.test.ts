/**
 * 反思处理器单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReflectionHandler } from '../../consciousness-core/handlers/reflection-handler';
import { createHandlerDeps } from '../test-utils';

describe('ReflectionHandler', () => {
  let handler: ReflectionHandler;
  let deps: ReturnType<typeof createHandlerDeps>;

  beforeEach(() => {
    deps = createHandlerDeps();
    handler = new ReflectionHandler({
      selfConsciousness: deps.selfConsciousness,
      longTermMemory: deps.longTermMemory,
      meaningAssigner: deps.meaningAssigner,
      metacognition: deps.metacognition,
      conversationHistory: deps.conversationHistory,
      extractConcepts: deps.extractConcepts,
    });
  });

  describe('reflect', () => {
    it('应该能执行反思', async () => {
      const result = await handler.reflect();

      expect(result).toBeDefined();
      expect(result.timestamp).toBeDefined();
      // 反思结果可能包含不同的字段，检查基本结构
      expect(typeof result).toBe('object');
    });
  });
});
