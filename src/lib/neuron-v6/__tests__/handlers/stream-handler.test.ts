/**
 * 意识流处理器单元测试
 * 
 * 注：由于 ConsciousnessStreamHandler 依赖复杂的记忆和元认知功能，
 * 这里主要测试基本的实例化和简单方法
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ConsciousnessStreamHandler', () => {
  it('应该能导入模块', async () => {
    const { ConsciousnessStreamHandler } = await import('../../consciousness-core/handlers/stream-handler');
    expect(ConsciousnessStreamHandler).toBeDefined();
  });

  it('应该能创建实例', async () => {
    const { ConsciousnessStreamHandler } = await import('../../consciousness-core/handlers/stream-handler');
    
    const mockDeps = {
      selfConsciousness: {
        getIdentity: () => ({ name: '紫' }),
        getContext: () => ({ currentState: { focus: '学习' } }),
      },
      longTermMemory: {
        getStats: () => ({ nodeCount: 0 }),
        recordExperience: vi.fn(),
      },
      meaningAssigner: {
        getBeliefSystem: () => ({ coreBeliefs: [] }),
      },
      metacognition: {
        getContext: () => ({ biases: [] }),
      },
      network: {
        getNetworkState: () => ({ neurons: [], synapses: [] }),
      },
      layerEngine: {},
      innerMonologue: {},
      conversationHistory: [],
    };

    const handler = new ConsciousnessStreamHandler(mockDeps as never);
    expect(handler).toBeDefined();
  });
});
