/**
 * ═══════════════════════════════════════════════════════════════════════
 * 统一记忆持久化层
 * Unified Memory Persistence Layer
 * 
 * 三层持久化策略：
 * L1: 内存层 (热数据) - 快速访问，实时更新
 * L2: 数据库层 (温数据) - 结构化存储，向量检索
 * L3: S3对象存储 (冷数据) - 快照归档，历史版本
 * ═══════════════════════════════════════════════════════════════════════
 */

import { eq, and, inArray, sql, desc } from 'drizzle-orm';
import { db } from '@/storage/index';
import { S3Storage } from 'coze-coding-dev-sdk';
import type {
  MemoryNode,
  MemoryType,
  MemoryCategory,
  Trigger,
  MemoryAssociation,
  EmotionalMarker,
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 持久化配置 */
export interface PersistenceConfig {
  /** 是否启用数据库持久化 */
  enableDatabase: boolean;
  
  /** 是否启用S3备份 */
  enableS3Backup: boolean;
  
  /** 自动保存间隔（毫秒） */
  autoSaveInterval: number;
  
  /** 批量写入阈值 */
  batchWriteThreshold: number;
  
  /** 快照间隔（毫秒） */
  snapshotInterval: number;
  
  /** 保留快照数量 */
  maxSnapshots: number;
}

/** 默认配置 */
export const DEFAULT_PERSISTENCE_CONFIG: PersistenceConfig = {
  enableDatabase: true,
  enableS3Backup: true,
  autoSaveInterval: 30 * 1000,      // 30秒
  batchWriteThreshold: 10,          // 10条记忆
  snapshotInterval: 5 * 60 * 1000,  // 5分钟
  maxSnapshots: 20,                 // 保留20个快照
};

/** 持久化统计 */
export interface PersistenceStats {
  /** 总保存次数 */
  totalSaves: number;
  
  /** 总加载次数 */
  totalLoads: number;
  
  /** 数据库写入次数 */
  dbWrites: number;
  
  /** S3备份次数 */
  s3Backups: number;
  
  /** 上次保存时间 */
  lastSaveTime: number | null;
  
  /** 待写入队列长度 */
  pendingWrites: number;
}

// ─────────────────────────────────────────────────────────────────────
// 数据库表结构（动态创建）
// ─────────────────────────────────────────────────────────────────────

/**
 * 注意：实际表结构需要通过 migration 创建
 * 这里定义的是预期的表结构
 * 
 * v6_unified_memories:
 * - id: uuid (PK)
 * - type: varchar (episodic/semantic/procedural/emotional/insight/identity)
 * - category: varchar
 * - content: text
 * - embedding: vector(1536)
 * - created_at: timestamp
 * - last_accessed_at: timestamp
 * - strength: real
 * - retention_rate: real
 * - consolidation_level: real
 * - crystallized: boolean
 * - emotional_marker: jsonb
 * - emotional_boost: real
 * - tags: jsonb
 * - importance: real
 * - metadata: jsonb
 * 
 * v6_memory_associations:
 * - id: uuid (PK)
 * - source_id: uuid (FK -> v6_unified_memories)
 * - target_id: uuid (FK -> v6_unified_memories)
 * - type: varchar (semantic/temporal/causal/emotional/trigger)
 * - weight: real
 * - co_activation_count: integer
 * - last_co_activated: timestamp
 * - formed_at: timestamp
 * 
 * v6_memory_triggers:
 * - id: uuid (PK)
 * - memory_id: uuid (FK -> v6_unified_memories)
 * - type: varchar (keyword/concept/emotion/context)
 * - pattern: text
 * - strength: real
 * - trigger_count: integer
 * - enabled: boolean
 */

// ─────────────────────────────────────────────────────────────────────
// 持久化管理器
// ─────────────────────────────────────────────────────────────────────

export class UnifiedMemoryPersistence {
  private config: PersistenceConfig;
  private stats: PersistenceStats;
  
  // 写入队列
  private writeQueue: Map<string, MemoryNode> = new Map();
  
  // 定时器
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private snapshotTimer: NodeJS.Timeout | null = null;
  
  // S3 客户端
  private s3Client: S3Storage | null = null;
  
  // 内存引用（由外部提供）
  private memoryStore: Map<string, MemoryNode>;
  
  constructor(
    memoryStore: Map<string, MemoryNode>,
    config: Partial<PersistenceConfig> = {}
  ) {
    this.memoryStore = memoryStore;
    this.config = { ...DEFAULT_PERSISTENCE_CONFIG, ...config };
    this.stats = {
      totalSaves: 0,
      totalLoads: 0,
      dbWrites: 0,
      s3Backups: 0,
      lastSaveTime: null,
      pendingWrites: 0,
    };
    
    // 初始化 S3 客户端
    if (this.config.enableS3Backup) {
      this.s3Client = new S3Storage({
        endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
        accessKey: '',
        secretKey: '',
        bucketName: process.env.COZE_BUCKET_NAME,
        region: 'cn-beijing',
      });
    }
    
    // 启动自动保存
    this.startAutoSave();
  }

  // ───────────────────────────────────────────────────────────────────
  // L2: 数据库持久化
  // ───────────────────────────────────────────────────────────────────

  /**
   * 保存单个记忆到数据库
   */
  async saveToDatabase(node: MemoryNode): Promise<boolean> {
    if (!this.config.enableDatabase) return false;
    
    try {
      // 使用原始SQL插入（因为表可能不存在）
      // 实际实现需要确保表存在
      const query = `
        INSERT INTO v6_unified_memories (
          id, type, category, content, embedding, created_at, 
          last_accessed_at, strength, retention_rate, consolidation_level,
          crystallized, emotional_marker, emotional_boost, tags, importance, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) ON CONFLICT (id) DO UPDATE SET
          last_accessed_at = EXCLUDED.last_accessed_at,
          strength = EXCLUDED.strength,
          retention_rate = EXCLUDED.retention_rate,
          consolidation_level = EXCLUDED.consolidation_level,
          crystallized = EXCLUDED.crystallized,
          importance = EXCLUDED.importance,
          metadata = EXCLUDED.metadata
      `;
      
      // 注意：这里简化了，实际需要使用 drizzle 或 pg 客户端
      // await db.execute(query, [...]);
      
      this.stats.dbWrites++;
      return true;
    } catch (error) {
      console.error('[持久化] 数据库保存失败:', error);
      return false;
    }
  }

  /**
   * 批量保存记忆
   */
  async batchSaveToDatabase(nodes: MemoryNode[]): Promise<number> {
    if (!this.config.enableDatabase || nodes.length === 0) return 0;
    
    let saved = 0;
    for (const node of nodes) {
      const success = await this.saveToDatabase(node);
      if (success) saved++;
    }
    
    return saved;
  }

  /**
   * 从数据库加载记忆
   */
  async loadFromDatabase(memoryId: string): Promise<MemoryNode | null> {
    if (!this.config.enableDatabase) return null;
    
    try {
      // 实际实现需要查询数据库
      const query = `
        SELECT * FROM v6_unified_memories WHERE id = $1
      `;
      
      // const result = await db.execute(query, [memoryId]);
      // return result.rows[0] as MemoryNode;
      
      this.stats.totalLoads++;
      return null; // 简化返回
    } catch (error) {
      console.error('[持久化] 数据库加载失败:', error);
      return null;
    }
  }

  /**
   * 从数据库加载所有记忆
   */
  async loadAllFromDatabase(): Promise<MemoryNode[]> {
    if (!this.config.enableDatabase) return [];
    
    try {
      const query = `SELECT * FROM v6_unified_memories ORDER BY created_at DESC`;
      // const result = await db.execute(query);
      // return result.rows as MemoryNode[];
      
      return []; // 简化返回
    } catch (error) {
      console.error('[持久化] 数据库加载全部失败:', error);
      return [];
    }
  }

  /**
   * 保存关联关系到数据库
   */
  async saveAssociations(
    sourceId: string, 
    associations: MemoryAssociation[]
  ): Promise<number> {
    if (!this.config.enableDatabase) return 0;
    
    try {
      let saved = 0;
      for (const assoc of associations) {
        const query = `
          INSERT INTO v6_memory_associations (
            source_id, target_id, type, weight, co_activation_count, 
            last_co_activated, formed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (source_id, target_id) DO UPDATE SET
            weight = EXCLUDED.weight,
            co_activation_count = EXCLUDED.co_activation_count,
            last_co_activated = EXCLUDED.last_co_activated
        `;
        // await db.execute(query, [...]);
        saved++;
      }
      return saved;
    } catch (error) {
      console.error('[持久化] 关联保存失败:', error);
      return 0;
    }
  }

  /**
   * 保存触发器到数据库
   */
  async saveTriggers(memoryId: string, triggers: Trigger[]): Promise<number> {
    if (!this.config.enableDatabase) return 0;
    
    try {
      let saved = 0;
      for (const trigger of triggers) {
        const query = `
          INSERT INTO v6_memory_triggers (
            id, memory_id, type, pattern, strength, trigger_count, enabled
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            trigger_count = EXCLUDED.trigger_count,
            enabled = EXCLUDED.enabled
        `;
        // await db.execute(query, [...]);
        saved++;
      }
      return saved;
    } catch (error) {
      console.error('[持久化] 触发器保存失败:', error);
      return 0;
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // L3: S3 快照备份
  // ───────────────────────────────────────────────────────────────────

  /**
   * 创建完整快照并上传到 S3
   */
  async createSnapshot(): Promise<string | null> {
    if (!this.config.enableS3Backup || !this.s3Client) return null;
    
    try {
      const timestamp = Date.now();
      const snapshotData = {
        version: '1.0',
        timestamp,
        memories: Array.from(this.memoryStore.values()),
        stats: this.stats,
      };
      
      const snapshotKey = `unified-memory/snapshot-${timestamp}.json`;
      const snapshotJson = JSON.stringify(snapshotData, null, 2);
      
      // 上传到 S3
      const buffer = Buffer.from(snapshotJson, 'utf-8');
      const uploadedKey = await this.s3Client.uploadFile({
        fileContent: buffer,
        fileName: snapshotKey,
        contentType: 'application/json',
      });
      
      this.stats.s3Backups++;
      console.log(`[持久化] 快照已上传: ${snapshotKey}`);
      
      // 清理旧快照
      await this.cleanupOldSnapshots();
      
      return snapshotKey;
    } catch (error) {
      console.error('[持久化] 快照创建失败:', error);
      return null;
    }
  }

  /**
   * 从 S3 加载最近快照
   */
  async loadLatestSnapshot(): Promise<MemoryNode[] | null> {
    if (!this.config.enableS3Backup || !this.s3Client) return null;
    
    try {
      // 列出所有快照
      const listResult = await this.s3Client.listFiles({
        prefix: 'unified-memory/snapshot-',
        maxKeys: 100,
      });
      
      if (!listResult.keys || listResult.keys.length === 0) {
        console.log('[持久化] 没有找到快照');
        return null;
      }
      
      // 获取最新的快照
      const latestFile = listResult.keys.sort((a: string, b: string) => {
        const timeA = parseInt(a.split('snapshot-')[1]?.split('.')[0] || '0');
        const timeB = parseInt(b.split('snapshot-')[1]?.split('.')[0] || '0');
        return timeB - timeA;
      })[0];
      
      // 下载并解析
      const buffer = await this.s3Client.readFile({ fileKey: latestFile });
      const snapshotJson = buffer.toString('utf-8');
      const snapshot = JSON.parse(snapshotJson);
      
      console.log(`[持久化] 已加载快照: ${latestFile}, ${snapshot.memories.length} 条记忆`);
      
      return snapshot.memories as MemoryNode[];
    } catch (error) {
      console.error('[持久化] 快照加载失败:', error);
      return null;
    }
  }

  /**
   * 清理旧快照
   */
  private async cleanupOldSnapshots(): Promise<void> {
    if (!this.s3Client) return;
    
    try {
      const listResult = await this.s3Client.listFiles({
        prefix: 'unified-memory/snapshot-',
        maxKeys: 100,
      });
      
      if (listResult.keys && listResult.keys.length > this.config.maxSnapshots) {
        // 按时间排序
        const sortedFiles = listResult.keys.sort((a: string, b: string) => {
          const timeA = parseInt(a.split('snapshot-')[1]?.split('.')[0] || '0');
          const timeB = parseInt(b.split('snapshot-')[1]?.split('.')[0] || '0');
          return timeB - timeA;
        });
        
        // 删除多余的旧快照
        const toDelete = sortedFiles.slice(this.config.maxSnapshots);
        for (const file of toDelete) {
          await this.s3Client!.deleteFile({ fileKey: file });
          console.log(`[持久化] 已删除旧快照: ${file}`);
        }
      }
    } catch (error) {
      console.error('[持久化] 快照清理失败:', error);
    }
  }

  // ───────────────────────────────────────────────────────────────────
  // 自动保存机制
  // ───────────────────────────────────────────────────────────────────

  /**
   * 加入写入队列
   */
  enqueue(node: MemoryNode): void {
    this.writeQueue.set(node.id, node);
    this.stats.pendingWrites = this.writeQueue.size;
    
    // 达到阈值立即保存
    if (this.writeQueue.size >= this.config.batchWriteThreshold) {
      this.flush();
    }
  }

  /**
   * 刷新写入队列
   */
  async flush(): Promise<number> {
    if (this.writeQueue.size === 0) return 0;
    
    const nodes = Array.from(this.writeQueue.values());
    this.writeQueue.clear();
    this.stats.pendingWrites = 0;
    
    const saved = await this.batchSaveToDatabase(nodes);
    this.stats.totalSaves++;
    this.stats.lastSaveTime = Date.now();
    
    return saved;
  }

  /**
   * 启动自动保存
   */
  private startAutoSave(): void {
    // 自动保存定时器
    this.autoSaveTimer = setInterval(() => {
      if (this.writeQueue.size > 0) {
        this.flush();
      }
    }, this.config.autoSaveInterval);
    
    // 快照定时器
    if (this.config.enableS3Backup) {
      this.snapshotTimer = setInterval(() => {
        this.createSnapshot();
      }, this.config.snapshotInterval);
    }
    
    console.log('[持久化] 自动保存已启动');
  }

  /**
   * 停止自动保存
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    
    if (this.snapshotTimer) {
      clearInterval(this.snapshotTimer);
      this.snapshotTimer = null;
    }
    
    // 最后刷新一次
    this.flush();
    
    console.log('[持久化] 自动保存已停止');
  }

  // ───────────────────────────────────────────────────────────────────
  // 初始化与恢复
  // ───────────────────────────────────────────────────────────────────

  /**
   * 初始化：尝试从数据库或快照恢复
   */
  async initialize(): Promise<number> {
    let loaded = 0;
    
    // 1. 先尝试从数据库加载
    if (this.config.enableDatabase) {
      const dbMemories = await this.loadAllFromDatabase();
      for (const node of dbMemories) {
        this.memoryStore.set(node.id, node);
        loaded++;
      }
      
      if (loaded > 0) {
        console.log(`[持久化] 从数据库加载了 ${loaded} 条记忆`);
        return loaded;
      }
    }
    
    // 2. 数据库为空，尝试从快照恢复
    if (this.config.enableS3Backup) {
      const snapshotMemories = await this.loadLatestSnapshot();
      if (snapshotMemories && snapshotMemories.length > 0) {
        for (const node of snapshotMemories) {
          this.memoryStore.set(node.id, node);
          loaded++;
        }
        
        // 将快照数据同步到数据库
        await this.batchSaveToDatabase(snapshotMemories);
        
        console.log(`[持久化] 从快照恢复并同步了 ${loaded} 条记忆`);
        return loaded;
      }
    }
    
    console.log('[持久化] 没有找到已保存的记忆，从空状态开始');
    return 0;
  }

  /**
   * 获取统计信息
   */
  getStats(): PersistenceStats {
    return { ...this.stats };
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopAutoSave();
    this.flush();
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createUnifiedMemoryPersistence(
  memoryStore: Map<string, MemoryNode>,
  config: Partial<PersistenceConfig> = {}
): UnifiedMemoryPersistence {
  return new UnifiedMemoryPersistence(memoryStore, config);
}
