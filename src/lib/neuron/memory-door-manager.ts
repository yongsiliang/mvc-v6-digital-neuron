/**
 * 记忆门管理器
 * 
 * 解决瓶颈：记忆爆炸
 * 
 * 策略：
 * 1. 衰减机制 - 长期不访问的记忆门强度衰减
 * 2. 合并机制 - 相似的记忆门自动合并
 * 3. 清理机制 - 衰减到阈值的门被清理
 * 4. 重要度保护 - 重要记忆不会被轻易清理
 */

import { Space, distance, move } from './space';
import { HierarchicalIndex, getHierarchicalIndex } from './spatial-index';
import { getEmbeddingManager } from './embedding-manager';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 记忆门
 */
export interface MemoryDoorV2 extends Space {
  /** 向量 */
  v: number[];
  
  /** 内容 */
  content: string;
  
  /** 核心意义 */
  meaning: string;
  
  /** 强度（0-1） */
  strength: number;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后访问时间 */
  lastAccessedAt: number;
  
  /** 访问次数 */
  accessCount: number;
  
  /** 重要度标记 */
  isImportant: boolean;
  
  /** 来源 */
  source: 'user' | 'system' | 'learned';
  
  /** 关联的门ID */
  relatedDoors: string[];
}

/**
 * 衰减配置
 */
interface DecayConfig {
  /** 衰减率（每次衰减的强度损失） */
  decayRate: number;
  /** 清理阈值 */
  cleanupThreshold: number;
  /** 合并距离阈值 */
  mergeDistance: number;
  /** 最大门数量 */
  maxDoors: number;
  /** 衰减间隔（毫秒） */
  decayInterval: number;
}

const DEFAULT_CONFIG: DecayConfig = {
  decayRate: 0.01,
  cleanupThreshold: 0.1,
  mergeDistance: 0.3,
  maxDoors: 1000,
  decayInterval: 1000 * 60 * 60, // 1小时
};

/**
 * 记忆门管理器
 */
export class MemoryDoorManager {
  /** 所有门 */
  private doors: Map<string, MemoryDoorV2> = new Map();
  
  /** 空间索引 */
  private index: HierarchicalIndex;
  
  /** 配置 */
  private config: DecayConfig;
  
  /** 上次衰减时间 */
  private lastDecayTime: number = 0;
  
  /** 数据库客户端 */
  private supabase = getSupabaseClient();
  
  constructor(config: Partial<DecayConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.index = getHierarchicalIndex();
    this.loadFromDatabase();
  }
  
  /**
   * 创建门
   */
  async create(
    content: string,
    meaning: string,
    options: {
      isImportant?: boolean;
      source?: 'user' | 'system' | 'learned';
    } = {}
  ): Promise<MemoryDoorV2> {
    // 获取嵌入
    const embeddingManager = getEmbeddingManager();
    const vector = await embeddingManager.embed(content, 'text-standard');
    
    const door: MemoryDoorV2 = {
      v: vector,
      content,
      meaning,
      strength: 1.0,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
      isImportant: options.isImportant || false,
      source: options.source || 'user',
      relatedDoors: [],
    };
    
    // 检查是否需要合并
    const similarDoor = this.findSimilarDoor(vector, this.config.mergeDistance);
    
    if (similarDoor) {
      // 合并到已有门
      this.mergeDoors(similarDoor, door);
      return similarDoor;
    }
    
    // 添加新门
    const id = `door-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.doors.set(id, door);
    this.index.add(id, vector, { meaning, id });
    
    // 检查是否需要清理
    if (this.doors.size > this.config.maxDoors) {
      await this.cleanup();
    }
    
    // 保存到数据库
    await this.saveDoor(id, door);
    
    return door;
  }
  
  /**
   * 访问门
   */
  access(id: string): MemoryDoorV2 | undefined {
    const door = this.doors.get(id);
    if (!door) return undefined;
    
    door.lastAccessedAt = Date.now();
    door.accessCount++;
    
    // 访问会增强强度
    door.strength = Math.min(1.0, door.strength + 0.05);
    
    this.index.recordAccess(id);
    
    return door;
  }
  
  /**
   * 查找最近的门
   */
  findNearest(vector: number[], topK: number = 5): Array<{ door: MemoryDoorV2; distance: number }> {
    const results = this.index.searchApprox(vector, topK);
    
    return results.map(r => ({
      door: this.doors.get(r.item.id)!,
      distance: r.distance,
    })).filter(r => r.door);
  }
  
  /**
   * 查找范围内的门
   */
  findWithin(vector: number[], threshold: number): Array<{ door: MemoryDoorV2; distance: number }> {
    const results = this.index.searchRange(vector, threshold);
    
    return results.map(r => ({
      door: this.doors.get(r.item.id)!,
      distance: r.distance,
    })).filter(r => r.door);
  }
  
  /**
   * 衰减
   * 
   * 定期调用，衰减长期不访问的门
   */
  async decay(): Promise<void> {
    const now = Date.now();
    
    // 检查是否需要衰减
    if (now - this.lastDecayTime < this.config.decayInterval) {
      return;
    }
    
    this.lastDecayTime = now;
    
    const toRemove: string[] = [];
    
    for (const [id, door] of this.doors) {
      // 重要记忆不衰减
      if (door.isImportant) continue;
      
      // 计算衰减因子
      const timeSinceAccess = now - door.lastAccessedAt;
      const daysSinceAccess = timeSinceAccess / (1000 * 60 * 60 * 24);
      
      // 衰减强度
      door.strength -= this.config.decayRate * (1 + daysSinceAccess * 0.1);
      door.strength = Math.max(0, door.strength);
      
      // 标记清理
      if (door.strength < this.config.cleanupThreshold) {
        toRemove.push(id);
      }
    }
    
    // 清理
    for (const id of toRemove) {
      await this.removeDoor(id);
    }
  }
  
  /**
   * 合并相似的门
   */
  async merge(): Promise<number> {
    let mergeCount = 0;
    const processed = new Set<string>();
    
    for (const [id1, door1] of this.doors) {
      if (processed.has(id1)) continue;
      
      for (const [id2, door2] of this.doors) {
        if (id1 === id2 || processed.has(id2)) continue;
        
        const d = distance(door1.v, door2.v);
        
        if (d < this.config.mergeDistance) {
          // 合并 door2 到 door1
          this.mergeDoors(door1, door2);
          await this.removeDoor(id2);
          processed.add(id2);
          mergeCount++;
        }
      }
      
      processed.add(id1);
    }
    
    // 重建索引
    if (mergeCount > 0) {
      this.rebuildIndex();
    }
    
    return mergeCount;
  }
  
  /**
   * 清理低强度门
   */
  async cleanup(): Promise<number> {
    let cleanupCount = 0;
    
    // 按强度排序
    const sorted = Array.from(this.doors.entries())
      .sort((a, b) => a[1].strength - b[1].strength);
    
    // 清理到目标数量
    const targetCount = Math.floor(this.config.maxDoors * 0.8);
    const toRemove = sorted.slice(0, this.doors.size - targetCount);
    
    for (const [id, door] of toRemove) {
      // 不清理重要记忆
      if (door.isImportant) continue;
      
      await this.removeDoor(id);
      cleanupCount++;
    }
    
    return cleanupCount;
  }
  
  /**
   * 标记重要
   */
  markImportant(id: string, important: boolean = true): boolean {
    const door = this.doors.get(id);
    if (!door) return false;
    
    door.isImportant = important;
    return true;
  }
  
  /**
   * 获取统计
   */
  getStats(): {
    totalDoors: number;
    avgStrength: number;
    avgAccessCount: number;
    importantCount: number;
    bySource: Record<string, number>;
  } {
    const doors = Array.from(this.doors.values());
    
    const avgStrength = doors.reduce((sum, d) => sum + d.strength, 0) / Math.max(1, doors.length);
    const avgAccessCount = doors.reduce((sum, d) => sum + d.accessCount, 0) / Math.max(1, doors.length);
    const importantCount = doors.filter(d => d.isImportant).length;
    
    const bySource: Record<string, number> = {};
    for (const door of doors) {
      bySource[door.source] = (bySource[door.source] || 0) + 1;
    }
    
    return {
      totalDoors: doors.length,
      avgStrength,
      avgAccessCount,
      importantCount,
      bySource,
    };
  }
  
  /**
   * 获取所有门
   */
  getAllDoors(): MemoryDoorV2[] {
    return Array.from(this.doors.values());
  }
  
  /**
   * 获取指定门
   */
  getDoor(id: string): MemoryDoorV2 | undefined {
    return this.doors.get(id);
  }
  
  // ==================== 私有方法 ====================
  
  /**
   * 查找相似门
   */
  private findSimilarDoor(vector: number[], threshold: number): MemoryDoorV2 | undefined {
    const results = this.index.searchRange(vector, threshold);
    if (results.length === 0) return undefined;
    
    return this.doors.get(results[0].item.id);
  }
  
  /**
   * 合并两个门
   */
  private mergeDoors(target: MemoryDoorV2, source: MemoryDoorV2): void {
    // 向量加权平均
    const weight = target.accessCount / (target.accessCount + source.accessCount + 1);
    target.v = target.v.map((v, i) => v * weight + source.v[i] * (1 - weight));
    
    // 合并内容
    if (source.content && !target.content.includes(source.content)) {
      target.content += `；${source.content}`;
    }
    
    // 更新统计
    target.accessCount += source.accessCount;
    target.strength = Math.min(1.0, target.strength + source.strength * 0.5);
    target.lastAccessedAt = Math.max(target.lastAccessedAt, source.lastAccessedAt);
    
    // 合并关联
    target.relatedDoors.push(...source.relatedDoors);
  }
  
  /**
   * 移除门
   */
  private async removeDoor(id: string): Promise<void> {
    const door = this.doors.get(id);
    if (!door) return;
    
    this.doors.delete(id);
    this.index.remove(id);
    
    // 从数据库删除
    try {
      await this.supabase
        .from('memory_doors')
        .delete()
        .eq('id', id);
    } catch {
      // 忽略
    }
  }
  
  /**
   * 重建索引
   */
  private rebuildIndex(): void {
    this.index.clear();
    
    for (const [id, door] of this.doors) {
      this.index.add(id, door.v, { meaning: door.meaning, id });
    }
  }
  
  /**
   * 保存门到数据库
   */
  private async saveDoor(id: string, door: MemoryDoorV2): Promise<void> {
    try {
      await this.supabase
        .from('memory_doors')
        .upsert({
          id,
          content: door.content,
          meaning: door.meaning,
          meaning_vector: door.v,
          strength: door.strength,
          is_important: door.isImportant,
          source: door.source,
          access_count: door.accessCount,
          created_at: new Date(door.createdAt).toISOString(),
          last_accessed_at: new Date(door.lastAccessedAt).toISOString(),
        });
    } catch {
      // 忽略
    }
  }
  
  /**
   * 从数据库加载
   */
  private async loadFromDatabase(): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('memory_doors')
        .select('*')
        .order('strength', { ascending: false })
        .limit(this.config.maxDoors);
      
      if (data) {
        for (const row of data) {
          const door: MemoryDoorV2 = {
            v: row.meaning_vector || [],
            content: row.content,
            meaning: row.meaning,
            strength: row.strength || 1.0,
            createdAt: new Date(row.created_at).getTime(),
            lastAccessedAt: new Date(row.last_accessed_at || row.created_at).getTime(),
            accessCount: row.access_count || 0,
            isImportant: row.is_important || false,
            source: row.source || 'user',
            relatedDoors: [],
          };
          
          this.doors.set(row.id, door);
          this.index.add(row.id, door.v, { meaning: door.meaning, id: row.id });
        }
      }
    } catch {
      // 表不存在或查询失败
    }
  }
}

// 单例
let managerInstance: MemoryDoorManager | null = null;

export function getMemoryDoorManager(): MemoryDoorManager {
  if (!managerInstance) {
    managerInstance = new MemoryDoorManager();
  }
  return managerInstance;
}
