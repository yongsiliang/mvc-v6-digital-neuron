/**
 * 记忆空间
 * 
 * 包含多个子空间（记忆门）。
 * 每个门有自己的向量。
 * 
 * 意识向量到门向量的距离，决定门能不能开。
 */

import { Space, distance, within, createSpace } from './space';
import { getConsciousness } from './consciousness-space';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 记忆门 = 一个子空间
 */
export interface MemoryDoor extends Space {
  /** 门的内容 */
  content: string;
  /** 核心意义 */
  meaning: string;
  /** 创建时间 */
  created: number;
  /** 访问次数 */
  accesses: number;
}

/**
 * 记忆空间
 * 
 * 就是一个 Space，子空间是记忆门。
 */
export class MemorySpace implements Space {
  /** 向量 - 记忆空间的位置 */
  v: number[];
  
  /** 子空间 - 记忆门 */
  s: MemoryDoor[];
  
  /** 开门距离阈值 */
  openThreshold: number = 0.5;
  
  private supabase = getSupabaseClient();
  
  constructor() {
    this.v = [];
    this.s = [];
    this.loadDoors();
  }
  
  /**
   * 开门
   * 
   * 意识向量到门向量的距离，决定能不能开。
   */
  open(): MemoryDoor[] {
    const consciousness = getConsciousness();
    const consciousnessVector = consciousness.getPosition();
    
    // 找距离近的门
    return within(this, consciousnessVector, this.openThreshold) as MemoryDoor[];
  }
  
  /**
   * 创建新门
   */
  async createDoor(content: string, meaning: string, vector?: number[]): Promise<MemoryDoor> {
    const door: MemoryDoor = {
      v: vector || new Array(1024).fill(0).map(() => Math.random()),
      content,
      meaning,
      created: Date.now(),
      accesses: 0,
    };
    
    this.s.push(door);
    
    // 保存到数据库
    await this.saveDoor(door);
    
    return door;
  }
  
  /**
   * 记录访问
   */
  access(door: MemoryDoor): void {
    door.accesses++;
  }
  
  /**
   * 加载门
   */
  private async loadDoors(): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('memory_doors')
        .select('*')
        .limit(100);
      
      if (data) {
        this.s = data.map((row: any) => ({
          v: row.meaning_vector || [],
          content: row.content,
          meaning: row.meaning,
          created: new Date(row.created_at).getTime(),
          accesses: row.access_count || 0,
        }));
      }
    } catch {
      // 表不存在，从空开始
      this.s = [];
    }
  }
  
  /**
   * 保存门
   */
  private async saveDoor(door: MemoryDoor): Promise<void> {
    try {
      await this.supabase
        .from('memory_doors')
        .insert({
          content: door.content,
          meaning: door.meaning,
          meaning_vector: door.v,
          door_type: 'space',
          created_by: 'system',
        });
    } catch {
      // 忽略
    }
  }
}

// 单例
let memorySpaceInstance: MemorySpace | null = null;

export function getMemorySpace(): MemorySpace {
  if (!memorySpaceInstance) {
    memorySpaceInstance = new MemorySpace();
  }
  return memorySpaceInstance;
}
