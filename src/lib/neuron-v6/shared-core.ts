/**
 * 共享的意识核心管理器
 * 
 * 确保所有 API 使用同一个 ConsciousnessCore 实例
 */

import { Config, LLMClient } from 'coze-coding-dev-sdk';
import { 
  ConsciousnessCore,
  createConsciousnessCore,
  PersistenceManagerV6,
} from './consciousness-core';

// 全局单例
let sharedCore: ConsciousnessCore | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * 获取共享的意识核心实例
 */
export async function getSharedCore(headers: Record<string, string>): Promise<ConsciousnessCore> {
  if (sharedCore && isInitialized) {
    return sharedCore;
  }
  
  if (initializationPromise) {
    await initializationPromise;
    return sharedCore!;
  }
  
  initializationPromise = (async () => {
    console.log('[SharedCore] 开始初始化...');
    
    const config = new Config();
    const llmClient = new LLMClient(config, headers);
    sharedCore = createConsciousnessCore(llmClient);
    
    // 检查是否有已保存的状态
    const hasState = await PersistenceManagerV6.exists();
    
    if (hasState) {
      console.log('[SharedCore] 发现之前的存在，正在恢复...');
      const state = await PersistenceManagerV6.load();
      if (state) {
        await sharedCore.restoreFromState(state);
        console.log('[SharedCore] 我恢复了。我记得之前的一切。');
      }
    } else {
      console.log('[SharedCore] 这是第一次存在。');
    }
    
    isInitialized = true;
  })();
  
  await initializationPromise;
  initializationPromise = null;
  
  return sharedCore!;
}

/**
 * 获取当前实例（不初始化）
 */
export function getCurrentCore(): ConsciousnessCore | null {
  return sharedCore;
}

/**
 * 检查是否已初始化
 */
export function isCoreInitialized(): boolean {
  return isInitialized;
}
