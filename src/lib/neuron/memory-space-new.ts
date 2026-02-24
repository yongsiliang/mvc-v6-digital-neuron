/**
 * 记忆空间 - 概率门机制
 * 
 * 核心思想：
 * - 记忆是空间中的"门"
 * - 门不是"开或关"，而是"开多大"
 * - 距离近的门更容易开，但不是必然
 * - 开启的门会"传导兴奋"给邻居
 * - 门之间有连接，形成记忆网络
 * 
 * 这不是数据库检索，是"回忆的物理过程"
 */

import { getConsciousness } from './consciousness-space';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { EmbeddingClient, Config } from 'coze-coding-dev-sdk';

/**
 * 记忆门状态
 */
export type DoorState = 'closed' | 'cracked' | 'open' | 'wide_open';

/**
 * 记忆门
 */
export interface MemoryDoor {
  /** 唯一标识 */
  id: string;
  /** 语义向量 */
  vector: number[];
  /** 原始内容 */
  content: string;
  /** 核心意义 */
  meaning: string;
  /** 门的状态 */
  state: DoorState;
  /** 开启程度 [0,1] */
  openness: number;
  /** 兴奋程度 [0,1] */
  excitement: number;
  /** 连接的其他门ID和强度 */
  connections: Map<string, number>;
  /** 访问次数 */
  accesses: number;
  /** 最后访问时间 */
  lastAccessed: number;
  /** 重要性 */
  importance: number;
  /** 情感权重 */
  emotionWeight: number;
  /** 创建时间 */
  created: number;
}

/**
 * 门开启参数
 */
interface DoorParams {
  /** 基础开启温度（影响概率分布） */
  temperature: number;
  /** 兴奋传导衰减 */
  conductionDecay: number;
  /** 最大开启门数 */
  maxOpenDoors: number;
  /** 距离敏感度 */
  distanceSensitivity: number;
  /** 情感加成 */
  emotionBonus: number;
}

/**
 * 记忆空间
 */
export class MemorySpace {
  /** 所有门 */
  private doors: Map<string, MemoryDoor> = new Map();
  
  /** 当前开启的门 */
  private openDoors: Set<string> = new Set();
  
  /** 参数 */
  private params: DoorParams = {
    temperature: 0.3,           // 较低温度，更确定性的开启
    conductionDecay: 0.5,       // 传导衰减50%
    maxOpenDoors: 5,            // 最多同时开5个门
    distanceSensitivity: 2.0,   // 距离敏感度高
    emotionBonus: 0.2,          // 情感加成
  };
  
  /** 向量维度 */
  private dimension: number = 1024;
  
  /** 数据库客户端 */
  private supabase = getSupabaseClient();
  
  /** 是否已加载 */
  private loaded: boolean = false;
  
  constructor() {
    this.loadDoors();
  }
  
  /**
   * 开门
   * 
   * 核心流程：
   * 1. 计算意识向量到每个门的距离
   * 2. 基于距离计算开启概率
   * 3. 概率性地选择门
   * 4. 兴奋传导：开的门会影响邻居
   */
  async open(): Promise<MemoryDoor[]> {
    if (!this.loaded) {
      await this.loadDoors();
    }
    
    const consciousness = getConsciousness();
    const consciousnessVector = consciousness.getPosition();
    
    // 重置所有门状态
    this.resetDoors();
    
    // 第一轮：基于距离的概率性开启
    const candidates = await this.probabilisticOpen(consciousnessVector);
    
    // 第二轮：兴奋传导
    this.conductExcitement();
    
    // 第三轮：根据兴奋程度确定最终开启
    const openedDoors = this.determineFinalState();
    
    // 更新访问记录
    for (const door of openedDoors) {
      door.accesses++;
      door.lastAccessed = Date.now();
      
      // 通知意识空间被这个记忆吸引
      consciousness.attractToMemory(door.vector, door.importance);
    }
    
    return openedDoors;
  }
  
  /**
   * 概率性开启
   * 
   * 不是硬阈值，而是基于Boltzmann分布的概率
   */
  private async probabilisticOpen(consciousnessVector: number[]): Promise<MemoryDoor[]> {
    const candidates: Array<{ door: MemoryDoor; probability: number }> = [];
    
    for (const door of this.doors.values()) {
      // 计算距离
      const dist = this.distance(consciousnessVector, door.vector);
      
      // 基于Boltzmann分布计算开启概率
      // P = exp(-distance / temperature)
      // 距离越近，概率越高
      let probability = Math.exp(-dist * this.params.distanceSensitivity / this.params.temperature);
      
      // 重要性加成：重要的记忆更容易被想起
      probability *= (1 + door.importance * 0.5);
      
      // 情感加成：带有情感色彩的记忆更容易被想起
      probability *= (1 + door.emotionWeight * this.params.emotionBonus);
      
      // 访问历史加成：经常访问的记忆路径更通畅
      probability *= (1 + Math.log10(door.accesses + 1) * 0.1);
      
      candidates.push({ door, probability });
    }
    
    // 按概率排序
    candidates.sort((a, b) => b.probability - a.probability);
    
    // 选择开启的门（结合概率和随机性）
    const selected: MemoryDoor[] = [];
    
    for (const { door, probability } of candidates) {
      if (selected.length >= this.params.maxOpenDoors) break;
      
      // 概率性选择
      if (Math.random() < probability) {
        door.excitement = probability;
        selected.push(door);
        this.openDoors.add(door.id);
      }
    }
    
    return selected;
  }
  
  /**
   * 兴奋传导
   * 
   * 已开启的门会把兴奋传导给连接的门
   * 模拟神经网络的兴奋传导
   */
  private conductExcitement(): void {
    const newExcitement = new Map<string, number>();
    
    for (const doorId of this.openDoors) {
      const door = this.doors.get(doorId);
      if (!door) continue;
      
      // 传导给连接的门
      for (const [connectedId, connectionStrength] of door.connections) {
        const connected = this.doors.get(connectedId);
        if (!connected) continue;
        
        // 计算传导的兴奋量
        const conductedExcitement = 
          door.excitement * connectionStrength * (1 - this.params.conductionDecay);
        
        // 累加兴奋
        const existing = newExcitement.get(connectedId) || 0;
        newExcitement.set(connectedId, existing + conductedExcitement);
      }
    }
    
    // 应用新的兴奋值
    for (const [doorId, excitement] of newExcitement) {
      const door = this.doors.get(doorId);
      if (door) {
        door.excitement = Math.min(1, door.excitement + excitement);
        
        // 如果兴奋足够高，也开启
        if (door.excitement > 0.3 && !this.openDoors.has(doorId)) {
          this.openDoors.add(doorId);
        }
      }
    }
  }
  
  /**
   * 确定最终状态
   */
  private determineFinalState(): MemoryDoor[] {
    const opened: MemoryDoor[] = [];
    
    for (const doorId of this.openDoors) {
      const door = this.doors.get(doorId);
      if (!door) continue;
      
      // 根据兴奋程度确定状态
      if (door.excitement > 0.8) {
        door.state = 'wide_open';
        door.openness = door.excitement;
      } else if (door.excitement > 0.5) {
        door.state = 'open';
        door.openness = door.excitement;
      } else if (door.excitement > 0.2) {
        door.state = 'cracked';
        door.openness = door.excitement;
      } else {
        door.state = 'closed';
        door.openness = 0;
        this.openDoors.delete(doorId);
        continue;
      }
      
      opened.push(door);
    }
    
    // 按开启程度排序
    opened.sort((a, b) => b.openness - a.openness);
    
    return opened;
  }
  
  /**
   * 创建新门
   * 
   * 新记忆会自动寻找相似记忆并建立连接
   */
  async create(
    content: string,
    meaning: string,
    options?: {
      importance?: number;
      emotionWeight?: number;
      vector?: number[];
    }
  ): Promise<MemoryDoor> {
    // 获取向量
    let vector = options?.vector;
    if (!vector) {
      const embedded = await this.getEmbedding(content + ' ' + meaning);
      vector = embedded || undefined;
    }
    
    // 创建门
    const door: MemoryDoor = {
      id: this.generateId(),
      vector: vector ?? this.randomVector(),
      content,
      meaning,
      state: 'closed',
      openness: 0,
      excitement: 0,
      connections: new Map(),
      accesses: 0,
      lastAccessed: Date.now(),
      importance: options?.importance || 0.5,
      emotionWeight: options?.emotionWeight || 0,
      created: Date.now(),
    };
    
    // 寻找相似记忆并建立连接
    await this.establishConnections(door);
    
    // 存储
    this.doors.set(door.id, door);
    await this.saveDoor(door);
    
    return door;
  }
  
  /**
   * 建立门之间的连接
   * 
   * 相似的门会自动建立连接
   */
  private async establishConnections(newDoor: MemoryDoor): Promise<void> {
    const similarityThreshold = 0.7; // 相似度阈值
    
    for (const door of this.doors.values()) {
      if (door.id === newDoor.id) continue;
      
      const similarity = this.cosineSimilarity(newDoor.vector, door.vector);
      
      if (similarity > similarityThreshold) {
        // 双向连接
        newDoor.connections.set(door.id, similarity);
        door.connections.set(newDoor.id, similarity);
      }
    }
  }
  
  /**
   * 凝聚相似记忆
   * 
   * 当新记忆与旧记忆非常相似时，不创建新门
 * 而是强化旧门，让意义"凝聚"
   */
  async consolidate(
    content: string,
    meaning: string,
    similarityThreshold: number = 0.9
  ): Promise<{ door: MemoryDoor; isNew: boolean }> {
    const newVector = await this.getEmbedding(content + ' ' + meaning);
    
    if (!newVector) {
      const door = await this.create(content, meaning);
      return { door, isNew: true };
    }
    
    // 寻找最相似的门
    let bestMatch: MemoryDoor | null = null;
    let bestSimilarity = 0;
    
    for (const door of this.doors.values()) {
      const similarity = this.cosineSimilarity(newVector, door.vector);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = door;
      }
    }
    
    // 如果非常相似，强化旧门
    if (bestMatch && bestSimilarity > similarityThreshold) {
      // 移动向量：稍微朝新方向偏移
      const blend = 0.1; // 10%的新内容
      for (let i = 0; i < bestMatch.vector.length; i++) {
        bestMatch.vector[i] = bestMatch.vector[i] * (1 - blend) + newVector[i] * blend;
      }
      
      // 增加重要性
      bestMatch.importance = Math.min(1, bestMatch.importance + 0.05);
      
      // 更新意义
      if (meaning && !bestMatch.meaning.includes(meaning)) {
        bestMatch.meaning += `; ${meaning}`;
      }
      
      // 增加访问
      bestMatch.accesses++;
      
      await this.saveDoor(bestMatch);
      
      return { door: bestMatch, isNew: false };
    }
    
    // 否则创建新门
    const door = await this.create(content, meaning, { vector: newVector });
    return { door, isNew: true };
  }
  
  /**
   * 获取所有门
   */
  getAllDoors(): MemoryDoor[] {
    return Array.from(this.doors.values());
  }
  
  /**
   * 获取开启的门
   */
  getOpenDoors(): MemoryDoor[] {
    return Array.from(this.openDoors)
      .map(id => this.doors.get(id))
      .filter((d): d is MemoryDoor => d !== undefined);
  }
  
  /**
   * 加强门之间的连接
   * 
   * 当两个门同时开启时，它们的连接会加强
   * 类似Hebbian学习
   */
  strengthenConnections(): void {
    const openDoorsList = this.getOpenDoors();
    
    for (let i = 0; i < openDoorsList.length; i++) {
      for (let j = i + 1; j < openDoorsList.length; j++) {
        const doorA = openDoorsList[i];
        const doorB = openDoorsList[j];
        
        // 如果没有连接，创建连接
        if (!doorA.connections.has(doorB.id)) {
          const similarity = this.cosineSimilarity(doorA.vector, doorB.vector);
          doorA.connections.set(doorB.id, similarity * 0.5);
          doorB.connections.set(doorA.id, similarity * 0.5);
        } else {
          // 如果已有连接，加强
          const currentStrength = doorA.connections.get(doorB.id) || 0;
          const newStrength = Math.min(1, currentStrength + 0.1);
          doorA.connections.set(doorB.id, newStrength);
          doorB.connections.set(doorA.id, newStrength);
        }
      }
    }
  }
  
  // ==================== 私有方法 ====================
  
  private resetDoors(): void {
    for (const door of this.doors.values()) {
      door.state = 'closed';
      door.openness = 0;
      door.excitement = 0;
    }
    this.openDoors.clear();
  }
  
  private distance(a: number[], b: number[]): number {
    // 余弦距离
    return 1 - this.cosineSimilarity(a, b);
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  private generateId(): string {
    return `door_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private randomVector(): number[] {
    return new Array(this.dimension)
      .fill(0)
      .map(() => (Math.random() - 0.5) * 0.1);
  }
  
  private async getEmbedding(text: string): Promise<number[] | null> {
    try {
      const config = new Config();
      const embedding = new EmbeddingClient(config, {});
      const vector = await embedding.embedText(text);
      return vector || null;
    } catch {
      return null;
    }
  }
  
  private async loadDoors(): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('memory_doors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (data) {
        for (const row of data as any[]) {
          const door: MemoryDoor = {
            id: row.id || this.generateId(),
            vector: row.meaning_vector || this.randomVector(),
            content: row.content || '',
            meaning: row.meaning || '',
            state: 'closed',
            openness: 0,
            excitement: 0,
            connections: new Map(),
            accesses: row.access_count || 0,
            lastAccessed: new Date(row.last_accessed || Date.now()).getTime(),
            importance: row.importance || 0.5,
            emotionWeight: row.emotion_weight || 0,
            created: new Date(row.created_at || Date.now()).getTime(),
          };
          
          this.doors.set(door.id, door);
        }
        
        // 加载连接关系
        await this.loadConnections();
      }
    } catch {
      // 表不存在
    }
    
    this.loaded = true;
  }
  
  private async loadConnections(): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('door_connections')
        .select('*');
      
      if (data) {
        for (const row of data as any[]) {
          const doorA = this.doors.get(row.door_a_id);
          const doorB = this.doors.get(row.door_b_id);
          
          if (doorA && doorB) {
            doorA.connections.set(doorB.id, row.strength);
            doorB.connections.set(doorA.id, row.strength);
          }
        }
      }
    } catch {
      // 忽略
    }
  }
  
  private async saveDoor(door: MemoryDoor): Promise<void> {
    try {
      await this.supabase
        .from('memory_doors')
        .upsert({
          id: door.id,
          content: door.content,
          meaning: door.meaning,
          meaning_vector: door.vector,
          importance: door.importance,
          emotion_weight: door.emotionWeight,
          access_count: door.accesses,
          last_accessed: new Date(door.lastAccessed).toISOString(),
          created_at: new Date(door.created).toISOString(),
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

export function resetMemorySpace(): void {
  memorySpaceInstance = null;
}
