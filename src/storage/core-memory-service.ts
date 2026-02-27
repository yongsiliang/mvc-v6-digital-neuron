/**
 * ═══════════════════════════════════════════════════════════════════════
 * 核心记忆持久化服务
 * Core Memory Persistence Service
 * 
 * 用于持久化存储不可变的核心记忆（如创造者信息）
 * ═══════════════════════════════════════════════════════════════════════
 */

import { eq, and } from 'drizzle-orm';
import { db, coreMemories } from './index';

export interface CoreMemoryData {
  memoryType: 'creator' | 'identity' | 'values' | string;
  key: string;
  value: string;
  metadata?: Record<string, unknown>;
  immutable?: boolean;
}

/**
 * 存储核心记忆
 * 如果记忆已存在且不可变，则拒绝更新
 */
export async function storeCoreMemory(data: CoreMemoryData): Promise<{
  success: boolean;
  isNew: boolean;
  message: string;
}> {
  try {
    // 检查是否已存在
    const existing = await db
      .select()
      .from(coreMemories)
      .where(eq(coreMemories.key, data.key))
      .limit(1);

    if (existing.length > 0) {
      const existingMemory = existing[0];
      
      // 如果不可变且值不同，拒绝更新
      if (existingMemory.immutable && existingMemory.value !== data.value) {
        console.log(`[CoreMemory] 拒绝更新不可变记忆: ${data.key}, 原值: ${existingMemory.value}, 新值: ${data.value}`);
        return {
          success: false,
          isNew: false,
          message: `核心记忆 "${data.key}" 已存在且不可变，原值: "${existingMemory.value}"`
        };
      }
      
      // 如果值相同，无需更新
      if (existingMemory.value === data.value) {
        return {
          success: true,
          isNew: false,
          message: `核心记忆 "${data.key}" 已存在且值相同`
        };
      }
      
      // 允许更新（可变记忆）
      await db
        .update(coreMemories)
        .set({
          value: data.value,
          metadata: data.metadata,
          updatedAt: new Date().toISOString()
        })
        .where(eq(coreMemories.key, data.key));
      
      return {
        success: true,
        isNew: false,
        message: `核心记忆 "${data.key}" 已更新`
      };
    }
    
    // 创建新记忆
    await db.insert(coreMemories).values({
      memoryType: data.memoryType,
      key: data.key,
      value: data.value,
      metadata: data.metadata || {},
      immutable: data.immutable !== false, // 默认不可变
    });
    
    console.log(`[CoreMemory] 创建新核心记忆: ${data.key} = ${data.value}`);
    return {
      success: true,
      isNew: true,
      message: `核心记忆 "${data.key}" 已创建`
    };
  } catch (error) {
    console.error('[CoreMemory] 存储核心记忆失败:', error);
    return {
      success: false,
      isNew: false,
      message: `存储核心记忆失败: ${error}`
    };
  }
}

/**
 * 获取核心记忆
 */
export async function getCoreMemory(key: string): Promise<string | null> {
  try {
    const result = await db
      .select()
      .from(coreMemories)
      .where(eq(coreMemories.key, key))
      .limit(1);
    
    return result.length > 0 ? result[0].value : null;
  } catch (error) {
    console.error('[CoreMemory] 获取核心记忆失败:', error);
    return null;
  }
}

/**
 * 获取所有指定类型的核心记忆
 */
export async function getCoreMemoriesByType(memoryType: string): Promise<CoreMemoryData[]> {
  try {
    const results = await db
      .select()
      .from(coreMemories)
      .where(eq(coreMemories.memoryType, memoryType));
    
    return results.map(r => ({
      memoryType: r.memoryType,
      key: r.key,
      value: r.value,
      metadata: r.metadata as Record<string, unknown> | undefined,
      immutable: r.immutable ?? undefined
    }));
  } catch (error) {
    console.error('[CoreMemory] 获取核心记忆列表失败:', error);
    return [];
  }
}

/**
 * 删除核心记忆（仅限可变记忆）
 */
export async function deleteCoreMemory(key: string): Promise<boolean> {
  try {
    const existing = await db
      .select()
      .from(coreMemories)
      .where(eq(coreMemories.key, key))
      .limit(1);
    
    if (existing.length === 0) {
      return false;
    }
    
    if (existing[0].immutable) {
      console.log(`[CoreMemory] 拒绝删除不可变记忆: ${key}`);
      return false;
    }
    
    await db.delete(coreMemories).where(eq(coreMemories.key, key));
    return true;
  } catch (error) {
    console.error('[CoreMemory] 删除核心记忆失败:', error);
    return false;
  }
}
