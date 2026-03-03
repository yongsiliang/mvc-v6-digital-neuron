/**
 * 共享的意识核心管理器
 * 
 * 确保所有 API 使用同一个 ConsciousnessCore 实例
 * 使用 globalThis 确保在 Next.js 开发模式下的跨请求单例
 */

import { Config, LLMClient } from 'coze-coding-dev-sdk';
import { 
  ConsciousnessCore,
  createConsciousnessCore,
  PersistenceManagerV6,
} from './consciousness-core';

// 定义全局存储接口
interface GlobalStore {
  sharedCore: ConsciousnessCore | null;
  isInitialized: boolean;
  initializationPromise: Promise<void> | null;
}

// 使用 globalThis 确保跨模块单例
function getGlobalStore(): GlobalStore {
  const globalKey = '__consciousness_core_v6__';
  if (!(globalThis as Record<string, unknown>)[globalKey]) {
    (globalThis as Record<string, unknown>)[globalKey] = {
      sharedCore: null,
      isInitialized: false,
      initializationPromise: null,
    };
  }
  return (globalThis as Record<string, unknown>)[globalKey] as GlobalStore;
}

/**
 * 重置共享核心实例（用于热更新后强制重新初始化）
 */
export function resetSharedCore(): void {
  const store = getGlobalStore();
  store.sharedCore = null;
  store.isInitialized = false;
  store.initializationPromise = null;
  console.log('[SharedCore] 实例已重置');
}

/**
 * 获取共享的意识核心实例
 */
export async function getSharedCore(headers: Record<string, string>): Promise<ConsciousnessCore> {
  const store = getGlobalStore();
  
  if (store.sharedCore && store.isInitialized) {
    return store.sharedCore;
  }
  
  if (store.initializationPromise) {
    await store.initializationPromise;
    return store.sharedCore!;
  }
  
  store.initializationPromise = (async () => {
    console.log('[SharedCore] 开始初始化...');
    
    const config = new Config();
    const llmClient = new LLMClient(config, headers);
    store.sharedCore = createConsciousnessCore(llmClient);
    
    // 🆕 初始化统一记忆系统的持久化层
    // 从数据库或S3快照恢复记忆
    try {
      const mossMemory = store.sharedCore.getMossMemory();
      const restoredCount = await mossMemory.initialize();
      if (restoredCount > 0) {
        console.log(`[SharedCore] 从持久化恢复了 ${restoredCount} 条记忆`);
      } else {
        console.log('[SharedCore] 没有找到持久化记忆，将从头开始');
      }
    } catch (error) {
      console.warn('[SharedCore] 记忆持久化初始化失败，将继续使用内存模式:', error);
    }
    
    // 检查是否有已保存的状态
    const hasState = await PersistenceManagerV6.exists();
    
    if (hasState) {
      console.log('[SharedCore] 发现之前的存在，正在恢复...');
      const state = await PersistenceManagerV6.load();
      if (state) {
        await store.sharedCore.restoreFromState(state);
        console.log('[SharedCore] 我恢复了。我记得之前的一切。');
      }
    } else {
      console.log('[SharedCore] 这是第一次存在。');
    }
    
    store.isInitialized = true;
  })();
  
  await store.initializationPromise;
  store.initializationPromise = null;
  
  return store.sharedCore!;
}

/**
 * 获取当前实例（不初始化）
 */
export function getCurrentCore(): ConsciousnessCore | null {
  return getGlobalStore().sharedCore;
}

/**
 * 检查是否已初始化
 */
export function isCoreInitialized(): boolean {
  return getGlobalStore().isInitialized;
}
