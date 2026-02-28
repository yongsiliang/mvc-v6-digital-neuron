/**
 * ═══════════════════════════════════════════════════════════════════════
 * 自动保存服务
 * Auto Save Service
 * 
 * 在关键操作后自动保存状态，使用防抖机制避免频繁写入
 * ═══════════════════════════════════════════════════════════════════════
 */

import { ConsciousnessCore, PersistenceManagerV6 } from './consciousness-core';

// 防抖延迟（毫秒）
const DEBOUNCE_DELAY = 3000;

// 最大重试次数
const MAX_RETRIES = 3;

// 全局状态
let saveTimeout: NodeJS.Timeout | null = null;
let isSaving = false;
let pendingSave = false;
let lastSaveTime = 0;
let saveCount = 0;

// 保存队列（用于确保顺序）
const saveQueue: Array<{
  core: ConsciousnessCore;
  reason: string;
}> = [];

/**
 * 调度自动保存（防抖）
 */
export function scheduleAutoSave(core: ConsciousnessCore, reason: string): void {
  // 清除之前的定时器
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // 添加到队列
  saveQueue.push({ core, reason });
  
  // 设置新的定时器
  saveTimeout = setTimeout(() => {
    executeAutoSave();
  }, DEBOUNCE_DELAY);
  
  console.log(`[自动保存] 已调度保存，原因: ${reason}`);
}

/**
 * 立即保存（跳过防抖）
 */
export async function saveImmediately(core: ConsciousnessCore, reason: string): Promise<void> {
  saveQueue.push({ core, reason });
  await executeAutoSave();
}

/**
 * 执行自动保存
 */
async function executeAutoSave(): Promise<void> {
  if (isSaving) {
    pendingSave = true;
    console.log('[自动保存] 已有保存任务进行中，将稍后重试');
    return;
  }
  
  isSaving = true;
  
  try {
    // 获取最后一个保存任务
    const task = saveQueue.pop();
    if (!task) {
      isSaving = false;
      return;
    }
    
    const { core, reason } = task;
    
    console.log(`[自动保存] 开始保存，原因: ${reason}`);
    const startTime = Date.now();
    
    // 获取状态
    const state = core.getPersistedState();
    
    // 保存到对象存储
    await PersistenceManagerV6.save(state);
    
    const duration = Date.now() - startTime;
    lastSaveTime = Date.now();
    saveCount++;
    
    console.log(`[自动保存] 保存成功，耗时 ${duration}ms，累计保存 ${saveCount} 次`);
    
    // 清空队列
    saveQueue.length = 0;
    
    // 如果有待处理的保存，重新调度
    if (pendingSave) {
      pendingSave = false;
      saveTimeout = setTimeout(() => {
        executeAutoSave();
      }, 1000);
    }
    
  } catch (error) {
    console.error('[自动保存] 保存失败:', error);
    
    // 重试逻辑
    const retryCount = (saveQueue[0] as unknown as { retries?: number })?.retries || 0;
    if (retryCount < MAX_RETRIES) {
      console.log(`[自动保存] 将在 5 秒后重试 (${retryCount + 1}/${MAX_RETRIES})`);
      setTimeout(() => {
        if (saveQueue.length > 0) {
          (saveQueue[0] as unknown as { retries: number }).retries = retryCount + 1;
          executeAutoSave();
        }
      }, 5000);
    } else {
      console.error('[自动保存] 达到最大重试次数，放弃保存');
      saveQueue.length = 0;
    }
  } finally {
    isSaving = false;
  }
}

/**
 * 获取保存统计
 */
export function getSaveStats(): {
  lastSaveTime: number;
  lastSaveTimeStr: string | null;
  saveCount: number;
  isSaving: boolean;
  pendingSave: boolean;
} {
  return {
    lastSaveTime,
    lastSaveTimeStr: lastSaveTime > 0 ? new Date(lastSaveTime).toLocaleString('zh-CN') : null,
    saveCount,
    isSaving,
    pendingSave,
  };
}

/**
 * 关闭时强制保存
 */
export async function flushAndSave(core: ConsciousnessCore): Promise<void> {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // 清空队列，只保留最后一个
  saveQueue.length = 0;
  saveQueue.push({ core, reason: '系统关闭' });
  
  await executeAutoSave();
}
