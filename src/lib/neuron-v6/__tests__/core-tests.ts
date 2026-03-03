/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 核心路径单元测试
 *
 * 轻量级测试框架，验证关键模块的基本功能
 * ═══════════════════════════════════════════════════════════════════════
 */

import { SystemConfigManager, DEFAULT_SYSTEM_CONFIG } from '../config';
import { VectorIndex, createDefaultVectorIndex } from '../memory/vector-index';
import type { VectorRecord } from '../memory/vector-index';

// ─────────────────────────────────────────────────────────────────────
// 测试工具
// ─────────────────────────────────────────────────────────────────────

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const testResults: TestResult[] = [];

function test(name: string, fn: () => void | Promise<void>): void {
  const startTime = Date.now();
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => {
          testResults.push({
            name,
            passed: true,
            duration: Date.now() - startTime,
          });
        })
        .catch((error) => {
          testResults.push({
            name,
            passed: false,
            error: error.message || String(error),
            duration: Date.now() - startTime,
          });
        });
    } else {
      testResults.push({
        name,
        passed: true,
        duration: Date.now() - startTime,
      });
    }
  } catch (error) {
    testResults.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}. Expected: ${expected}, Got: ${actual}`);
  }
}

function assertDeepEqual<T>(actual: T, expected: T, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}. Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// 配置中心测试
// ─────────────────────────────────────────────────────────────────────

test('SystemConfigManager: 单例模式', () => {
  const manager1 = SystemConfigManager.getInstance();
  const manager2 = SystemConfigManager.getInstance();
  assert(manager1 === manager2, 'SystemConfigManager应该是单例');
});

test('SystemConfigManager: 获取默认配置', () => {
  const manager = SystemConfigManager.getInstance();
  const config = manager.getConfig();

  // 验证关键配置存在
  assert(config.memory !== undefined, '应该有memory配置');
  assert(config.ssmController !== undefined, '应该有ssmController配置');
  assert(config.metaLearning !== undefined, '应该有metaLearning配置');
  assert(config.vectorIndex !== undefined, '应该有vectorIndex配置');
});

test('SystemConfigManager: 获取子配置', () => {
  const manager = SystemConfigManager.getInstance();

  const memoryConfig = manager.getMemoryConfig();
  assert(memoryConfig.workingMemoryCapacity > 0, 'workingMemoryCapacity应该大于0');
  assert(memoryConfig.maxEpisodicMemories > 0, 'maxEpisodicMemories应该大于0');

  const vectorConfig = manager.getVectorIndexConfig();
  assert(vectorConfig.dimension === 1536, 'dimension应该是1536');
  assert(vectorConfig.enabled === true, 'enabled应该是true');
});

test('SystemConfigManager: 更新配置', () => {
  const manager = SystemConfigManager.getInstance();

  manager.updateConfig('memory', {
    workingMemoryCapacity: 10,
  });

  const memoryConfig = manager.getMemoryConfig();
  assertEqual(memoryConfig.workingMemoryCapacity, 10, 'workingMemoryCapacity应该被更新为10');

  // 重置为默认
  manager.resetToDefaults();
});

test('DEFAULT_SYSTEM_CONFIG: 完整性检查', () => {
  // 验证所有必要配置字段存在
  assert(DEFAULT_SYSTEM_CONFIG.memory.workingMemoryCapacity === 7, '工作记忆容量应该是7');
  assert(DEFAULT_SYSTEM_CONFIG.ssmController.stateDimension === 64, 'SSM状态维度应该是64');
  assert(DEFAULT_SYSTEM_CONFIG.vectorIndex.dimension === 1536, '向量维度应该是1536');
  assert(DEFAULT_SYSTEM_CONFIG.protection.enabled === true, '保护系统应该默认启用');
});

// ─────────────────────────────────────────────────────────────────────
// 向量索引测试
// ─────────────────────────────────────────────────────────────────────

function createTestVector(id: string, values: number[], tags: string[] = []): VectorRecord {
  return {
    id,
    vector: new Float32Array(values),
    metadata: {
      content: `Test content for ${id}`,
      tags,
      importance: 0.8,
      createdAt: Date.now(),
    },
  };
}

test('VectorIndex: 添加和获取记录', () => {
  const index = createDefaultVectorIndex();
  const record = createTestVector('test-1', [1, 2, 3, 4, 5]);

  index.add(record);

  const retrieved = index.get('test-1');
  assert(retrieved !== undefined, '应该能获取到记录');
  assertEqual(retrieved!.id, 'test-1', 'ID应该匹配');
});

test('VectorIndex: 批量添加记录', () => {
  const index = createDefaultVectorIndex();
  const records = [
    createTestVector('batch-1', [1, 0, 0]),
    createTestVector('batch-2', [0, 1, 0]),
    createTestVector('batch-3', [0, 0, 1]),
  ];

  index.addBatch(records);

  const stats = index.getStats();
  assertEqual(stats.totalRecords, 3, '应该有3条记录');
});

test('VectorIndex: 删除记录', () => {
  const index = createDefaultVectorIndex();
  const record = createTestVector('delete-test', [1, 2, 3]);

  index.add(record);
  assert(index.get('delete-test') !== undefined, '记录应该存在');

  const deleted = index.delete('delete-test');
  assert(deleted === true, '删除应该成功');
  assert(index.get('delete-test') === undefined, '记录应该已被删除');
});

test('VectorIndex: 向量相似度搜索', () => {
  const index = createDefaultVectorIndex();

  // 添加测试向量
  index.addBatch([
    createTestVector('vec-1', [1, 0, 0, 0], ['type-a']),
    createTestVector('vec-2', [0.9, 0.1, 0, 0], ['type-a']),
    createTestVector('vec-3', [0, 1, 0, 0], ['type-b']),
    createTestVector('vec-4', [0, 0, 1, 0], ['type-c']),
  ]);

  // 搜索与 [1, 0, 0, 0] 最相似的向量
  const queryVector = new Float32Array([1, 0, 0, 0]);
  const results = index.search(queryVector, { topK: 2 });

  assert(results.length === 2, '应该返回2个结果');
  assert(results[0].id === 'vec-1', '最相似的应该是vec-1');
  assert(results[0].score > 0.9, '相似度应该很高');
});

test('VectorIndex: 标签过滤搜索', () => {
  const index = createDefaultVectorIndex();

  index.addBatch([
    createTestVector('tag-1', [1, 0, 0], ['important', 'work']),
    createTestVector('tag-2', [0, 1, 0], ['important', 'personal']),
    createTestVector('tag-3', [0, 0, 1], ['archive']),
  ]);

  const queryVector = new Float32Array([1, 0, 0]);
  const results = index.search(queryVector, {
    topK: 10,
    tagFilter: ['important'],
  });

  assert(results.length === 2, '应该只返回有important标签的记录');
  for (const result of results) {
    assert(result.metadata.tags.includes('important'), '结果应该有important标签');
  }
});

test('VectorIndex: 关键词搜索', () => {
  const index = createDefaultVectorIndex();

  index.addBatch([
    {
      id: 'kw-1',
      vector: new Float32Array([1, 0]),
      metadata: {
        content: 'This is about machine learning and AI',
        tags: [],
        importance: 0.8,
        createdAt: Date.now(),
      },
    },
    {
      id: 'kw-2',
      vector: new Float32Array([0, 1]),
      metadata: {
        content: 'Deep learning neural networks',
        tags: [],
        importance: 0.8,
        createdAt: Date.now(),
      },
    },
    {
      id: 'kw-3',
      vector: new Float32Array([0.5, 0.5]),
      metadata: {
        content: 'Cooking recipes for dinner',
        tags: [],
        importance: 0.8,
        createdAt: Date.now(),
      },
    },
  ]);

  const results = index.searchByKeywords(['learning', 'neural'], { topK: 5 });

  assert(results.length >= 2, '应该找到至少2个相关记录');
});

test('VectorIndex: 混合搜索', () => {
  const index = createDefaultVectorIndex();

  index.addBatch([
    {
      id: 'hybrid-1',
      vector: new Float32Array([1, 0, 0]),
      metadata: {
        content: 'Machine learning algorithms',
        tags: ['ai'],
        importance: 0.9,
        createdAt: Date.now(),
      },
    },
    {
      id: 'hybrid-2',
      vector: new Float32Array([0.8, 0.2, 0]),
      metadata: {
        content: 'Deep neural network architecture',
        tags: ['ai'],
        importance: 0.85,
        createdAt: Date.now(),
      },
    },
    {
      id: 'hybrid-3',
      vector: new Float32Array([0, 1, 0]),
      metadata: {
        content: 'Cooking recipes',
        tags: ['food'],
        importance: 0.7,
        createdAt: Date.now(),
      },
    },
  ]);

  const queryVector = new Float32Array([1, 0, 0]);
  const results = index.hybridSearch(
    queryVector,
    ['learning', 'neural'],
    { topK: 3 },
    { vector: 0.6, keyword: 0.4 },
  );

  assert(results.length >= 2, '应该返回至少2个结果');
  // AI相关的结果应该排在前面
  assert(results[0].id !== 'hybrid-3', '烹饪结果不应该排在最前面');
});

test('VectorIndex: 统计信息', () => {
  const index = createDefaultVectorIndex();

  index.addBatch([createTestVector('stats-1', [1, 0]), createTestVector('stats-2', [0, 1])]);

  const stats = index.getStats();

  assertEqual(stats.totalRecords, 2, '应该有2条记录');
  assertEqual(stats.dimension, 1536, '维度应该是1536');
  assert(stats.indexType === 'flat', '索引类型应该是flat');
});

test('VectorIndex: 清空索引', () => {
  const index = createDefaultVectorIndex();

  index.addBatch([createTestVector('clear-1', [1, 0]), createTestVector('clear-2', [0, 1])]);

  index.clear();

  const stats = index.getStats();
  assertEqual(stats.totalRecords, 0, '清空后应该没有记录');
  assertEqual(stats.invertedIndexSize, 0, '倒排索引应该被清空');
});

// ─────────────────────────────────────────────────────────────────────
// 输出测试结果
// ─────────────────────────────────────────────────────────────────────

function printResults(): void {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('V6 核心路径单元测试结果');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  for (const result of testResults) {
    const status = result.passed ? '✅' : '❌';
    const duration = `${result.duration}ms`;

    console.log(`${status} ${result.name} (${duration})`);

    if (result.passed) {
      passed++;
    } else {
      failed++;
      console.log(`   Error: ${result.error}`);
    }
  }

  console.log('\n───────────────────────────────────────────────────────────────');
  console.log(`总计: ${testResults.length} 测试`);
  console.log(`通过: ${passed}`);
  console.log(`失败: ${failed}`);
  console.log(`通过率: ${((passed / testResults.length) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // 退出码
  process.exit(failed > 0 ? 1 : 0);
}

// 等待所有异步测试完成
setTimeout(printResults, 1000);

export { testResults };
