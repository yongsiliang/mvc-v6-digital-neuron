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

/**
 * 重置共享核心实例
 * 用于开发环境中的热更新或手动重置
 */
export function resetSharedCore(): void {
  const store = getGlobalStore();
  store.sharedCore = null;
  store.isInitialized = false;
  store.initializationPromise = null;
  console.log('[SharedCore] 核心实例已重置');
}
