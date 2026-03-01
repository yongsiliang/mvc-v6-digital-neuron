/**
 * 性能监控工具测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PerformanceMonitor, LRUCache, MemoryLimiter, SessionHistoryManager } from '../../utils';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    // 使用 getInstance 获取单例，并重置配置
    monitor = PerformanceMonitor.getInstance({ enabled: true, logLevel: 'none' });
    monitor.clear();
  });

  afterEach(() => {
    monitor.clear();
  });

  it('应该能开始和结束操作计时', () => {
    const operationId = monitor.startOperation('test-operation');
    expect(operationId).toBeTruthy();
    
    const result = monitor.endOperation(operationId);
    expect(result).not.toBeNull();
    expect(result?.operation).toBe('test-operation');
    expect(result?.duration).toBeGreaterThanOrEqual(0);
  });

  it('应该能测量异步函数', async () => {
    const result = await monitor.measure('async-test', async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'done';
    });

    expect(result).toBe('done');
    const stats = monitor.getStats('async-test');
    expect(stats?.callCount).toBe(1);
    expect(stats?.averageDuration).toBeGreaterThanOrEqual(10);
  });

  it('应该能测量同步函数', () => {
    const result = monitor.measureSync('sync-test', () => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) sum += i;
      return sum;
    });

    expect(result).toBe(499500);
    const stats = monitor.getStats('sync-test');
    expect(stats?.callCount).toBe(1);
  });

  it('应该能记录错误次数', async () => {
    try {
      await monitor.measure('error-test', async () => {
        throw new Error('test error');
      });
    } catch {
      // 预期错误
    }

    const stats = monitor.getStats('error-test');
    expect(stats?.errorCount).toBe(1);
  });

  it('应该能获取性能摘要', async () => {
    await monitor.measure('op1', async () => 'result');
    await monitor.measure('op2', async () => 'result');

    const summary = monitor.getSummary();
    expect(summary.totalOperations).toBe(2);
    expect(summary.topOperations.length).toBeGreaterThan(0);
  });

  it('应该能清除统计数据', async () => {
    await monitor.measure('test', async () => 'result');
    monitor.clear();

    const stats = monitor.getStats('test');
    expect(stats).toBeUndefined();
  });
});

describe('LRUCache', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache({ maxSize: 5, defaultTTL: 0, cleanupInterval: 0 });
  });

  afterEach(() => {
    cache.stopCleanupTimer();
    cache.clear();
  });

  it('应该能设置和获取缓存', () => {
    cache.set('key1', 100);
    expect(cache.get('key1')).toBe(100);
  });

  it('应该能正确处理 TTL 过期', () => {
    const ttlCache = new LRUCache({ maxSize: 5, defaultTTL: 100, cleanupInterval: 0 });
    ttlCache.set('key1', 100);

    // 立即获取应该成功
    expect(ttlCache.get('key1')).toBe(100);

    // 等待过期
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(ttlCache.get('key1')).toBeUndefined();
        ttlCache.stopCleanupTimer();
        resolve();
      }, 150);
    });
  });

  it('应该在超出最大大小时执行淘汰', () => {
    cache.set('key1', 1);
    cache.set('key2', 2);
    cache.set('key3', 3);
    cache.set('key4', 4);
    cache.set('key5', 5);

    // 添加第 6 个，应该触发淘汰
    cache.set('key6', 6);

    // 最久未访问的应该被淘汰
    expect(cache.has('key1')).toBe(false);
    expect(cache.get('key6')).toBe(6);
  });

  it('应该能删除缓存', () => {
    cache.set('key1', 100);
    expect(cache.delete('key1')).toBe(true);
    expect(cache.get('key1')).toBeUndefined();
  });

  it('应该能清空缓存', () => {
    cache.set('key1', 1);
    cache.set('key2', 2);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('应该能获取缓存统计', () => {
    cache.set('key1', 1);
    cache.get('key1');
    cache.get('key1');

    const stats = cache.getStats();
    expect(stats.size).toBe(1);
    expect(stats.totalAccess).toBe(2);
  });
});

describe('MemoryLimiter', () => {
  let limiter: MemoryLimiter;

  beforeEach(() => {
    limiter = new MemoryLimiter(1000); // 1000 bytes
  });

  it('应该能分配内存', () => {
    expect(limiter.allocate('item1', 500)).toBe(true);
    const usage = limiter.getUsage();
    expect(usage.used).toBe(500);
    expect(usage.percentage).toBe(50);
  });

  it('应该在内存不足时淘汰旧条目后分配', () => {
    limiter.allocate('item1', 800);
    // 请求 300 但只有 200 可用，会淘汰 item1 后再分配
    const result = limiter.allocate('item2', 300);
    // 由于 item1 被淘汰，item2 可以分配成功
    expect(result).toBe(true);
  });

  it('应该能在空间不足时拒绝分配过大的请求', () => {
    limiter.allocate('item1', 800);
    // 请求超过总限制的分配应失败
    const result = limiter.allocate('item2', 1500);
    expect(result).toBe(false);
  });

  it('应该在超出限制时淘汰旧条目', () => {
    limiter.allocate('item1', 500);
    limiter.allocate('item2', 500);
    // 现在 used = 1000

    // 分配新的，应该淘汰 item1
    const result = limiter.allocate('item3', 500);
    expect(result).toBe(true);
    
    const usage = limiter.getUsage();
    // item1 被淘汰，item2 + item3 = 1000
    expect(usage.used).toBe(1000);
  });

  it('应该能释放内存', () => {
    limiter.allocate('item1', 500);
    limiter.release('item1');
    
    const usage = limiter.getUsage();
    expect(usage.used).toBe(0);
  });

  it('应该能清空所有', () => {
    limiter.allocate('item1', 500);
    limiter.allocate('item2', 300);
    limiter.clear();
    
    const usage = limiter.getUsage();
    expect(usage.used).toBe(0);
  });
});

describe('SessionHistoryManager', () => {
  let manager: SessionHistoryManager<string>;

  beforeEach(() => {
    manager = new SessionHistoryManager(5);
  });

  it('应该能添加和获取条目', () => {
    manager.push('msg1');
    manager.push('msg2');

    const recent = manager.getRecent(2);
    expect(recent.length).toBe(2);
    expect(recent[0].data).toBe('msg1');
    expect(recent[1].data).toBe('msg2');
  });

  it('应该在超出限制时删除旧条目', () => {
    manager.push('msg1');
    manager.push('msg2');
    manager.push('msg3');
    manager.push('msg4');
    manager.push('msg5');
    manager.push('msg6');

    expect(manager.size).toBe(5);
    const all = manager.getAll();
    expect(all[0].data).toBe('msg2'); // msg1 被淘汰
    expect(all[4].data).toBe('msg6');
  });

  it('应该能清空历史', () => {
    manager.push('msg1');
    manager.push('msg2');
    manager.clear();

    expect(manager.size).toBe(0);
  });
});
