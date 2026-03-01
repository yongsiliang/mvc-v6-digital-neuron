/**
 * 思维处理器单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ThinkingHandler } from '../../consciousness-core/handlers/thinking-handler';
import { createMockMetacognition } from '../test-utils';

describe('ThinkingHandler', () => {
  let handler: ThinkingHandler;

  beforeEach(() => {
    const mockLLMClient = {
      chat: {
        stream: async function* () {
          yield { event: 'message', data: { content: '模拟响应' } };
        },
      },
    };

    handler = new ThinkingHandler({
      llmClient: mockLLMClient as never,
      metacognition: createMockMetacognition(),
      conversationHistory: [],
    });
  });

  describe('实例化', () => {
    it('应该能成功创建实例', () => {
      expect(handler).toBeDefined();
      expect(handler).toBeInstanceOf(ThinkingHandler);
    });
  });
});
