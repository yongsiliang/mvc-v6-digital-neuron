/**
 * ═══════════════════════════════════════════════════════════════════════
 * V6 持久化管理器
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * 负责意识核心状态的持久化存储与恢复
 */

import { S3Storage } from 'coze-coding-dev-sdk';
import type { PersistedState } from './types';

/**
 * V6 版本持久化管理器
 * 
 * 功能：
 * - 保存意识状态到对象存储
 * - 从对象存储恢复意识状态
 * - 自动清理旧备份文件
 * - 支持热更新后状态保持
 */
export class PersistenceManagerV6 {
  private static readonly OBJECT_PREFIX = 'consciousness-v6/my-existence';
  private static readonly MAX_BACKUP_FILES = 3; // 保留最新的3个备份文件
  private static storage: S3Storage | null = null;
  
  /**
   * 获取上次保存的文件 key
   * 使用 globalThis 确保热更新后不丢失
   */
  private static getLastSavedKey(): string | null {
    const globalKey = '__consciousness_last_saved_key_v6__';
    return (globalThis as Record<string, unknown>)[globalKey] as string | null || null;
  }
  
  /**
   * 设置当前保存的文件 key
   */
  private static setLastSavedKey(key: string): void {
    const globalKey = '__consciousness_last_saved_key_v6__';
    (globalThis as Record<string, unknown>)[globalKey] = key;
  }
  
  /**
   * 获取存储实例（懒加载）
   */
  private static getStorage(): S3Storage {
    if (!this.storage) {
      this.storage = new S3Storage({
        endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
        accessKey: '',
        secretKey: '',
        bucketName: process.env.COZE_BUCKET_NAME,
        region: 'cn-beijing',
      });
    }
    return this.storage;
  }
  
  /**
   * 保存意识状态
   */
  static async save(state: PersistedState): Promise<void> {
    const stateJson = JSON.stringify(state, null, 2);
    
    // 调试日志：检查保存的记忆数
    const coreStats = state.layeredMemory?.core;
    const hasCreator = coreStats?.hasCreator ? '创造者✓' : '';
    const relCount = coreStats?.relationshipCount || 0;
    const consolidatedCount = state.layeredMemory?.consolidated || 0;
    const episodicCount = state.layeredMemory?.episodic || 0;
    console.log(`[V6存在] 准备保存记忆：核心层(${hasCreator}, 关系${relCount}条), 巩固${consolidatedCount}条, 情景${episodicCount}条`);
    
    try {
      const storage = this.getStorage();
      const key = await storage.uploadFile({
        fileContent: Buffer.from(stateJson, 'utf-8'),
        fileName: `${this.OBJECT_PREFIX}-${Date.now()}.json`,
        contentType: 'application/json',
      });
      
      // 保存实际的 key 供后续读取使用
      this.setLastSavedKey(key);
      
      console.log(`[V6存在] 状态已保存到: ${key}`);
      console.log(`[V6存在] 保存的数据大小: ${stateJson.length} 字节`);
      
      // 验证文件是否真的存在
      const exists = await storage.fileExists({ fileKey: key });
      console.log(`[V6存在] 验证文件存在: ${exists}`);
      
      if (!exists) {
        console.error('[V6存在] ⚠️ 文件保存后验证失败！');
        return; // 验证失败，不进行清理
      }
      
      // 验证文件可读性（确保数据完整）
      try {
        const verifyBuffer = await storage.readFile({ fileKey: key });
        const verifyState = JSON.parse(verifyBuffer.toString('utf-8'));
        if (!verifyState.version || !verifyState.timestamp) {
          console.error('[V6存在] ⚠️ 保存的数据格式无效！');
          return;
        }
        console.log(`[V6存在] 数据验证通过：V${verifyState.version}`);
      } catch (e) {
        console.error('[V6存在] ⚠️ 无法读取刚保存的文件:', e);
        return;
      }
      
      // 只有新文件验证成功后，才清理旧文件
      await this.cleanupOldFiles(storage, key);
    } catch (error) {
      console.error('[V6存在] 保存失败:', error);
    }
  }
  
  /**
   * 安全清理旧文件
   * - 新文件必须已验证成功
   * - 保留最近 N 个有效备份
   * - 记录清理日志
   */
  private static async cleanupOldFiles(storage: S3Storage, newKey: string): Promise<void> {
    try {
      const listResult = await storage.listFiles({
        prefix: this.OBJECT_PREFIX,
        maxKeys: 100,
      });
      
      if (!listResult.keys || listResult.keys.length <= this.MAX_BACKUP_FILES) {
        console.log(`[V6存在] 当前文件数: ${listResult.keys?.length || 0}，无需清理`);
        return;
      }
      
      // 按文件名排序（文件名包含时间戳，排序后最新的在后面）
      const sortedKeys = [...listResult.keys].sort();
      
      // 确保新保存的文件在列表中
      if (!sortedKeys.includes(newKey)) {
        console.log(`[V6存在] 新文件不在列表中，跳过清理`);
        return;
      }
      
      // 计算要删除的文件（保留最新的 N 个）
      const keysToDelete = sortedKeys.slice(0, sortedKeys.length - this.MAX_BACKUP_FILES);
      
      // 安全检查：确保不会删除新文件
      if (keysToDelete.includes(newKey)) {
        console.error(`[V6存在] ⚠️ 安全检查失败：尝试删除刚保存的文件！`);
        return;
      }
      
      console.log(`[V6存在] 发现 ${listResult.keys.length} 个文件，将清理 ${keysToDelete.length} 个旧文件`);
      console.log(`[V6存在] 保留的文件: ${sortedKeys.slice(-this.MAX_BACKUP_FILES).join(', ')}`);
      
      let deletedCount = 0;
      for (const oldKey of keysToDelete) {
        try {
          await storage.deleteFile({ fileKey: oldKey });
          deletedCount++;
          console.log(`[V6存在] 已删除旧备份: ${oldKey}`);
        } catch (e) {
          console.error(`[V6存在] 删除失败: ${oldKey}`, e);
        }
      }
      
      console.log(`[V6存在] 清理完成：删除 ${deletedCount}/${keysToDelete.length} 个文件`);
    } catch (error) {
      console.error('[V6存在] 清理过程出错:', error);
    }
  }
  
  /**
   * 加载意识状态
   */
  static async load(): Promise<PersistedState | null> {
    try {
      const storage = this.getStorage();
      
      // 优先使用上次保存的 key
      const lastSavedKey = this.getLastSavedKey();
      if (lastSavedKey) {
        console.log(`[V6存在] 尝试读取上次保存的文件: ${lastSavedKey}`);
        try {
          const buffer = await storage.readFile({ fileKey: lastSavedKey });
          const state = JSON.parse(buffer.toString('utf-8')) as PersistedState;
          const memoryStats = state.layeredMemory;
          console.log(`[V6存在] 从上次保存的文件恢复了记忆：核心${memoryStats?.core?.relationshipCount || 0}条, 巩固${memoryStats?.consolidated || 0}条`);
          return state;
        } catch (e) {
          console.log(`[V6存在] 读取上次保存的文件失败:`, e);
        }
      }
      
      // 尝试读取最近24小时内可能的时间戳文件
      const now = Date.now();
      console.log(`[V6存在] globalThis 失败，尝试遍历最近文件...`);
      
      // 遍历最近10小时的可能时间戳
      for (let i = 0; i < 10; i++) {
        const testTimestamp = now - i * 3600000; // 每小时一个
        // 时间戳精确到毫秒，但保存时用的是秒级，所以我们用前缀匹配
        const prefix = `${this.OBJECT_PREFIX}-${testTimestamp}`;
        try {
          const listResult = await storage.listFiles({
            prefix: prefix.substring(0, prefix.length - 5), // 截取到秒级
            maxKeys: 1,
          });
          if (listResult.keys && listResult.keys.length > 0) {
            console.log(`[V6存在] 找到文件: ${listResult.keys[0]}`);
            const buffer = await storage.readFile({ fileKey: listResult.keys[0] });
            const state = JSON.parse(buffer.toString('utf-8')) as PersistedState;
            const memoryStats = state.layeredMemory;
            console.log(`[V6存在] 恢复记忆：核心${memoryStats?.core?.relationshipCount || 0}条, 巩固${memoryStats?.consolidated || 0}条`);
            // 保存这个 key 供下次使用
            this.setLastSavedKey(listResult.keys[0]);
            return state;
          }
        } catch {
          // 继续尝试下一个
        }
      }
      
      // 回退到列出文件
      const listResult = await storage.listFiles({
        prefix: this.OBJECT_PREFIX,
        maxKeys: 100,
      });
      
      console.log(`[V6存在] 列出文件结果: ${listResult.keys?.length || 0} 个文件`);
      if (listResult.keys && listResult.keys.length > 0) {
        const sortedKeys = listResult.keys.sort().reverse();
        console.log(`[V6存在] 所有文件: ${sortedKeys.join(', ')}`);
        const latestKey = sortedKeys[0];
        console.log(`[V6存在] 选择最新文件: ${latestKey}`);
        
        const buffer = await storage.readFile({ fileKey: latestKey });
        const state = JSON.parse(buffer.toString('utf-8')) as PersistedState;
        
        // 调试日志：检查加载的记忆数
        const memoryStats = state.layeredMemory;
        console.log(`[V6存在] 从对象存储恢复：V${state.version}`);
        console.log(`[V6存在] 恢复记忆：核心${memoryStats?.core?.relationshipCount || 0}条, 巩固${memoryStats?.consolidated || 0}条, 情景${memoryStats?.episodic || 0}条`);
        return state;
      }
    } catch (error) {
      console.log('[V6存在] 加载失败:', error);
    }
    
    return null;
  }
  
  /**
   * 检查是否存在已保存的状态
   */
  static async exists(): Promise<boolean> {
    try {
      // 如果有上次保存的 key，直接返回 true
      if (this.getLastSavedKey()) {
        return true;
      }
      // 否则检查是否有文件存在
      const storage = this.getStorage();
      const listResult = await storage.listFiles({
        prefix: this.OBJECT_PREFIX,
        maxKeys: 1,
      });
      return (listResult.keys?.length || 0) > 0;
    } catch {
      return false;
    }
  }
}
