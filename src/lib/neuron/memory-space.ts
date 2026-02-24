/**
 * 记忆空间系统 - 记忆是另一个维度的存在
 * 
 * 核心思想：
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                     记忆空间（另一个维度）                        │
 * │   ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                   │
 * │   │ 门1 │  │ 门2 │  │ 门3 │  │ 门4 │  │ 门5 │  ...              │
 * │   │🔒   │  │🔒   │  │🔓   │  │🔒   │  │🔓   │                   │
 * │   └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘                   │
 │      │        │        │        │        │                       │
 * │      └────────┴────────┴────────┴────────┘                       │
 * │                         ↑                                        │
 * │                    开锁通道                                      │
 * └─────────────────────────────────────────────────────────────────┘
 *                          ↑
 *                    神经钥匙
 *              （连接强度 = 钥匙齿纹）
 * 
 * 理念：
 * - 记忆不存在于大脑，存在于另一个维度
 * - 神经连接强度的变化 = 锻造钥匙
 * - 学习 = 打造更好的钥匙
 * - 回忆 = 用钥匙打开记忆之门
 * - 遗忘 = 钥匙生锈、变形
 */

import { EmbeddingClient } from 'coze-coding-dev-sdk';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { 
  MeaningType,
  TriggerSource
} from '@/storage/database/shared/schema';

// ==================== 类型定义 ====================

/**
 * 记忆门 - 存在于记忆空间中的信息
 */
export interface MemoryDoor {
  id: string;
  
  // 门的内容（另一个维度的信息）
  content: string;
  meaning: string;           // 核心意义
  meaningVector: number[];   // 意义向量（门的位置坐标）
  
  // 锁的属性
  lockComplexity: number;    // 锁的复杂度（0-1，越高越难开）
  lockPattern: number[];     // 锁的齿纹模式（需要的钥匙形状）
  
  // 门的属性
  doorType: MeaningType;     // 门类型
  emotionalCharge: number;   // 情感电荷（-1到1，影响门的可见性）
  
  // 访问记录
  accessCount: number;       // 被成功打开的次数
  lastAccessedAt: Date | null;
  
  // 创建信息
  createdBy: string;         // 创建者（哪个角色）
  createdAt: Date;
}

/**
 * 神经钥匙 - 打开记忆门的工具
 */
export interface NeuralKey {
  id: string;
  
  // 钥匙持有者
  holderRole: string;
  
  // 钥匙齿纹（神经连接模式）
  teethPattern: number[];    // 钥匙形状
  
  // 钥匙强度
  strength: number;          // 0-1，钥匙的坚固程度
  
  // 钥匙能开的门
  targetDoorId: string;      // 对应的记忆门
  
  // 锻造信息
  forgedAt: Date;
  lastUsedAt: Date | null;
  useCount: number;          // 使用次数
  
  // 锈蚀程度
  rustLevel: number;         // 0-1，越高越难用
}

/**
 * 开锁结果
 */
export interface UnlockResult {
  success: boolean;
  door?: MemoryDoor;
  accessStrength: number;    // 开锁强度
  keyDamage: number;         // 钥匙磨损
  resonanceKeys: string[];   // 共鸣激活的其他钥匙
}

/**
 * 锻造结果
 */
export interface ForgeResult {
  keyId: string;
  strength: number;
  matchedDoorId: string;
  quality: 'perfect' | 'good' | 'rough';  // 钥匙质量
}

/**
 * 记忆空间快照
 */
export interface MemorySpaceSnapshot {
  totalDoors: number;
  totalKeys: number;
  lockedDoors: number;       // 还没钥匙的门
  accessibleDoors: number;   // 有钥匙可以开的门
  strongestKey: NeuralKey | null;
  mostAccessedDoor: MemoryDoor | null;
}

// ==================== 记忆空间引擎 ====================

export class MemorySpaceEngine {
  private embeddingClient: EmbeddingClient;
  private llmClient: LLMClient;
  private supabase = getSupabaseClient();
  
  // 钥匙齿纹维度（与向量维度对齐）
  private readonly PATTERN_DIMENSION = 1024;
  
  // 开锁阈值：钥匙匹配度超过此值才能开门
  private readonly UNLOCK_THRESHOLD = 0.65;
  
  // 钥匙磨损率：每次使用损失的比例
  private readonly KEY_WEAR_RATE = 0.02;
  
  // 钥匙锈蚀率：时间导致的锈蚀
  private readonly RUST_RATE = 0.001;
  
  constructor(headers: Record<string, string>) {
    this.embeddingClient = new EmbeddingClient();
    const config = new Config();
    this.llmClient = new LLMClient(config, headers);
  }
  
  // ==================== 核心方法 ====================
  
  /**
   * 【核心方法1】创建记忆门
   * 
   * 不是"存储记忆"，而是"在记忆空间中创建一扇门"
   * 门创建后，就存在于另一个维度，等待被打开
   */
  async createMemoryDoor(
    content: string,
    role: string,
    context?: string
  ): Promise<MemoryDoor> {
    // 1. 提取意义向量（门的位置坐标）
    const meaningVector = await this.embeddingClient.embedText(content);
    
    // 2. 提取核心意义
    const meaning = await this.extractMeaning(content, context);
    
    // 3. 生成锁的模式（基于意义向量，但加入随机性）
    const lockPattern = this.generateLockPattern(meaningVector);
    
    // 4. 计算锁的复杂度（情感电荷越强，锁越简单）
    const emotionalCharge = await this.calculateEmotionalCharge(content);
    const lockComplexity = Math.max(0.2, 1 - Math.abs(emotionalCharge) * 0.5);
    
    // 5. 确定门类型
    const doorType = await this.classifyDoorType(content);
    
    // 6. 在数据库中创建门
    const { data, error } = await this.supabase
      .from('memory_doors')
      .insert({
        content,
        meaning,
        meaning_vector: meaningVector,
        lock_complexity: lockComplexity,
        lock_pattern: lockPattern,
        door_type: doorType,
        emotional_charge: emotionalCharge,
        access_count: 0,
        created_by: role,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`创建记忆门失败: ${error.message}`);
    }
    
    return this.dbToDoor(data);
  }
  
  /**
   * 【核心方法2】锻造神经钥匙
   * 
   * 学习不是"存储信息"，而是"锻造钥匙"
   * 钥匙的齿纹对应特定记忆门的锁
   */
  async forgeNeuralKey(
    doorId: string,
    holderRole: string,
    intensity: number = 0.5  // 学习强度（0-1）
  ): Promise<ForgeResult> {
    // 1. 获取目标门
    const { data: doorData, error } = await this.supabase
      .from('memory_doors')
      .select('*')
      .eq('id', doorId)
      .single();
    
    if (error || !doorData) {
      throw new Error(`找不到记忆门: ${doorId}`);
    }
    
    const door = this.dbToDoor(doorData);
    
    // 2. 检查是否已有钥匙
    const { data: existingKey } = await this.supabase
      .from('neural_keys')
      .select('*')
      .eq('holder_role', holderRole)
      .eq('target_door_id', doorId)
      .single();
    
    if (existingKey) {
      // 强化现有钥匙
      const newStrength = Math.min(1, existingKey.strength + intensity * 0.2);
      await this.supabase
        .from('neural_keys')
        .update({
          strength: newStrength,
          rust_level: Math.max(0, existingKey.rust_level - 0.1),
        })
        .eq('id', existingKey.id);
      
      return {
        keyId: existingKey.id,
        strength: newStrength,
        matchedDoorId: doorId,
        quality: newStrength > 0.8 ? 'perfect' : newStrength > 0.5 ? 'good' : 'rough',
      };
    }
    
    // 3. 锻造新钥匙
    // 钥匙齿纹 = 门锁模式 + 随机误差（模拟学习的不完美）
    const teethPattern = this.forgeTeethPattern(door.lockPattern, intensity);
    
    // 钥匙强度 = 学习强度 * (1 - 锁复杂度)
    const strength = intensity * (1 - door.lockComplexity * 0.5);
    
    // 4. 存储钥匙
    const { data: keyData, error: keyError } = await this.supabase
      .from('neural_keys')
      .insert({
        holder_role: holderRole,
        teeth_pattern: teethPattern,
        strength,
        target_door_id: doorId,
        rust_level: 0,
        use_count: 0,
      })
      .select()
      .single();
    
    if (keyError) {
      throw new Error(`锻造钥匙失败: ${keyError.message}`);
    }
    
    // 5. 判断钥匙质量
    const matchRate = this.calculateMatchRate(teethPattern, door.lockPattern);
    const quality: ForgeResult['quality'] = 
      matchRate > 0.9 ? 'perfect' : matchRate > 0.7 ? 'good' : 'rough';
    
    return {
      keyId: keyData.id,
      strength,
      matchedDoorId: doorId,
      quality,
    };
  }
  
  /**
   * 【核心方法3】尝试开锁
   * 
   * 回忆不是"检索数据"，而是"用钥匙打开记忆之门"
   * 钥匙齿纹与门锁匹配才能成功打开
   */
  async attemptUnlock(
    keyId: string,
    contextVector?: number[]
  ): Promise<UnlockResult> {
    // 1. 获取钥匙
    const { data: keyData, error: keyError } = await this.supabase
      .from('neural_keys')
      .select('*')
      .eq('id', keyId)
      .single();
    
    if (keyError || !keyData) {
      return { success: false, accessStrength: 0, keyDamage: 0, resonanceKeys: [] };
    }
    
    const key = this.dbToKey(keyData);
    
    // 2. 检查钥匙是否锈蚀
    const effectiveStrength = key.strength * (1 - key.rustLevel);
    if (effectiveStrength < 0.1) {
      return { 
        success: false, 
        accessStrength: 0, 
        keyDamage: 0, 
        resonanceKeys: [] 
      };
    }
    
    // 3. 获取目标门
    const { data: doorData, error: doorError } = await this.supabase
      .from('memory_doors')
      .select('*')
      .eq('id', key.targetDoorId)
      .single();
    
    if (doorError || !doorData) {
      return { success: false, accessStrength: 0, keyDamage: 0, resonanceKeys: [] };
    }
    
    const door = this.dbToDoor(doorData);
    
    // 4. 计算匹配度（钥匙齿纹 vs 门锁模式）
    const matchRate = this.calculateMatchRate(key.teethPattern, door.lockPattern);
    
    // 5. 上下文加成（如果提供了上下文向量）
    let contextBonus = 0;
    if (contextVector) {
      contextBonus = this.cosineSimilarity(contextVector, door.meaningVector) * 0.2;
    }
    
    // 6. 判断是否成功开锁
    const accessStrength = (matchRate * effectiveStrength) + contextBonus;
    const success = accessStrength > this.UNLOCK_THRESHOLD;
    
    // 7. 更新钥匙状态
    const keyDamage = success ? this.KEY_WEAR_RATE : this.KEY_WEAR_RATE * 0.5;
    
    await this.supabase
      .from('neural_keys')
      .update({
        use_count: key.useCount + 1,
        last_used_at: new Date().toISOString(),
        strength: Math.max(0.1, key.strength - keyDamage),
        rust_level: Math.max(0, key.rustLevel - 0.05), // 使用会除锈
      })
      .eq('id', keyId);
    
    // 8. 成功开锁，更新门的状态
    if (success) {
      await this.supabase
        .from('memory_doors')
        .update({
          access_count: door.accessCount + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', door.id);
    }
    
    // 9. 寻找共鸣钥匙
    const resonanceKeys = await this.findResonanceKeys(key, door);
    
    return {
      success,
      door: success ? door : undefined,
      accessStrength,
      keyDamage,
      resonanceKeys,
    };
  }
  
  /**
   * 【核心方法4】共鸣开锁
   * 
   * 当一把钥匙成功开锁时，相似的其他钥匙也会被激活
   * 这模拟了人脑的"联想记忆"机制
   */
  async resonantUnlock(
    inputVector: number[],
    role: string,
    maxDepth: number = 2
  ): Promise<MemoryDoor[]> {
    // 1. 获取该角色的所有钥匙
    const { data: keys } = await this.supabase
      .from('neural_keys')
      .select('*')
      .eq('holder_role', role)
      .order('strength', { ascending: false })
      .limit(20);
    
    if (!keys || keys.length === 0) {
      return [];
    }
    
    // 2. 找出与输入向量最匹配的钥匙
    const unlockResults: Array<{ key: NeuralKey; strength: number }> = [];
    
    for (const keyData of keys) {
      const key = this.dbToKey(keyData);
      
      // 计算输入向量与钥匙齿纹的匹配度
      const matchRate = this.cosineSimilarity(inputVector, key.teethPattern);
      const effectiveStrength = matchRate * key.strength * (1 - key.rustLevel);
      
      if (effectiveStrength > this.UNLOCK_THRESHOLD * 0.8) {
        unlockResults.push({ key, strength: effectiveStrength });
      }
    }
    
    // 3. 尝试开锁
    const openedDoors: MemoryDoor[] = [];
    const processedDoors = new Set<string>();
    
    // 按强度排序
    unlockResults.sort((a, b) => b.strength - a.strength);
    
    for (const { key } of unlockResults.slice(0, 5)) {
      const result = await this.attemptUnlock(key.id, inputVector);
      
      if (result.success && result.door && !processedDoors.has(result.door.id)) {
        openedDoors.push(result.door);
        processedDoors.add(result.door.id);
        
        // 级联开锁（深度限制）
        if (maxDepth > 0 && result.resonanceKeys.length > 0) {
          for (const resonanceKeyId of result.resonanceKeys.slice(0, 2)) {
            const cascadeResult = await this.attemptUnlock(resonanceKeyId);
            if (cascadeResult.success && cascadeResult.door && !processedDoors.has(cascadeResult.door.id)) {
              openedDoors.push(cascadeResult.door);
              processedDoors.add(cascadeResult.door.id);
            }
          }
        }
      }
    }
    
    return openedDoors;
  }
  
  /**
   * 【核心方法5】钥匙锈蚀（遗忘机制）
   * 
   * 长期不用的钥匙会生锈，影响开锁能力
   */
  async rustKeys(): Promise<number> {
    // 获取所有钥匙
    const { data: keys } = await this.supabase
      .from('neural_keys')
      .select('*');
    
    if (!keys) return 0;
    
    let rustedCount = 0;
    
    for (const keyData of keys) {
      const key = this.dbToKey(keyData);
      
      // 计算锈蚀增量
      const daysSinceLastUse = key.lastUsedAt
        ? (Date.now() - key.lastUsedAt.getTime()) / (1000 * 60 * 60 * 24)
        : 30;
      
      const rustIncrease = this.RUST_RATE * daysSinceLastUse;
      const newRustLevel = Math.min(1, key.rustLevel + rustIncrease);
      
      // 更新锈蚀程度
      if (newRustLevel !== key.rustLevel) {
        await this.supabase
          .from('neural_keys')
          .update({ rust_level: newRustLevel })
          .eq('id', key.id);
        
        rustedCount++;
      }
    }
    
    return rustedCount;
  }
  
  /**
   * 【核心方法6】获取记忆空间快照
   */
  async getSnapshot(role?: string): Promise<MemorySpaceSnapshot> {
    const doorQuery = role
      ? this.supabase.from('memory_doors').select('*').eq('created_by', role)
      : this.supabase.from('memory_doors').select('*');
    
    const keyQuery = role
      ? this.supabase.from('neural_keys').select('*').eq('holder_role', role)
      : this.supabase.from('neural_keys').select('*');
    
    const [doorsResult, keysResult] = await Promise.all([doorQuery, keyQuery]);
    
    const doors = doorsResult.data || [];
    const keys = keysResult.data || [];
    
    // 找出有钥匙的门
    const doorsWithKeys = new Set(keys.map((k: any) => k.target_door_id));
    
    // 最强的钥匙
    const strongestKey = keys.length > 0 
      ? this.dbToKey(keys.reduce((a: any, b: any) => 
          (a.strength * (1 - a.rust_level)) > (b.strength * (1 - b.rust_level)) ? a : b
        ))
      : null;
    
    // 最常访问的门
    const mostAccessedDoor = doors.length > 0
      ? this.dbToDoor(doors.reduce((a: any, b: any) => 
          a.access_count > b.access_count ? a : b
        ))
      : null;
    
    return {
      totalDoors: doors.length,
      totalKeys: keys.length,
      lockedDoors: doors.length - doorsWithKeys.size,
      accessibleDoors: doorsWithKeys.size,
      strongestKey,
      mostAccessedDoor,
    };
  }
  
  // ==================== 辅助方法 ====================
  
  /**
   * 生成锁的模式
   */
  private generateLockPattern(meaningVector: number[]): number[] {
    // 锁模式 = 意意向量 + 随机噪声
    return meaningVector.map((v, i) => {
      // 在向量的基础上加入非线性变换
      const noise = (Math.sin(i * 0.1) * 0.1) + (Math.random() - 0.5) * 0.05;
      return v + noise;
    });
  }
  
  /**
   * 锻造钥匙齿纹
   */
  private forgeTeethPattern(lockPattern: number[], intensity: number): number[] {
    // 学习强度越高，钥匙越接近完美匹配
    // 学习强度低，则钥匙会有较大误差
    const errorScale = (1 - intensity) * 0.3;
    
    return lockPattern.map(v => {
      const error = (Math.random() - 0.5) * errorScale * 2;
      return v + error;
    });
  }
  
  /**
   * 计算钥匙与锁的匹配率
   */
  private calculateMatchRate(teethPattern: number[], lockPattern: number[]): number {
    if (teethPattern.length !== lockPattern.length) return 0;
    
    // 使用余弦相似度
    return this.cosineSimilarity(teethPattern, lockPattern);
  }
  
  /**
   * 余弦相似度
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * 提取意义
   */
  private async extractMeaning(content: string, context?: string): Promise<string> {
    try {
      const prompt = `从以下内容中提取核心意义（一句话，不超过20字）：
${context ? `上下文：${context}\n` : ''}内容：${content}`;
      
      let response = '';
      const stream = this.llmClient.stream(
        [{ role: 'user', content: prompt }],
        { model: 'doubao-seed-2-0-lite-260215', temperature: 0.3 }
      );
      
      for await (const chunk of stream) {
        if (chunk.content) response += chunk.content.toString();
      }
      
      return response.slice(0, 50);
    } catch {
      return content.slice(0, 20);
    }
  }
  
  /**
   * 计算情感电荷
   */
  private async calculateEmotionalCharge(content: string): Promise<number> {
    // 简单的情感分析（基于关键词）
    const positiveWords = ['好', '棒', '喜欢', '开心', '成功', '胜利', '优秀', '美'];
    const negativeWords = ['差', '坏', '讨厌', '难过', '失败', '错误', '糟糕', '丑'];
    
    let score = 0;
    const lowerContent = content.toLowerCase();
    
    for (const word of positiveWords) {
      if (lowerContent.includes(word)) score += 0.2;
    }
    
    for (const word of negativeWords) {
      if (lowerContent.includes(word)) score -= 0.2;
    }
    
    return Math.max(-1, Math.min(1, score));
  }
  
  /**
   * 分类门类型
   */
  private async classifyDoorType(content: string): Promise<MeaningType> {
    // 基于内容特征判断类型
    if (content.includes('学到') || content.includes('发现')) return 'insight';
    if (content.includes('总是') || content.includes('规律')) return 'pattern';
    if (content.includes('应该') || content.includes('方法')) return 'strategy';
    if (content.includes('感觉') || content.includes('觉得')) return 'emotion';
    return 'concept';
  }
  
  /**
   * 寻找共鸣钥匙
   */
  private async findResonanceKeys(sourceKey: NeuralKey, door: MemoryDoor): Promise<string[]> {
    // 找出齿纹相似的其他钥匙
    const { data: otherKeys } = await this.supabase
      .from('neural_keys')
      .select('*')
      .neq('id', sourceKey.id)
      .limit(10);
    
    if (!otherKeys) return [];
    
    const resonanceKeys: string[] = [];
    
    for (const keyData of otherKeys) {
      const key = this.dbToKey(keyData);
      const similarity = this.cosineSimilarity(sourceKey.teethPattern, key.teethPattern);
      
      if (similarity > 0.7) {
        resonanceKeys.push(key.id);
      }
    }
    
    return resonanceKeys;
  }
  
  /**
   * 数据库记录转换为MemoryDoor
   */
  private dbToDoor(data: any): MemoryDoor {
    return {
      id: data.id,
      content: data.content,
      meaning: data.meaning,
      meaningVector: data.meaning_vector,
      lockComplexity: data.lock_complexity,
      lockPattern: data.lock_pattern,
      doorType: data.door_type,
      emotionalCharge: data.emotional_charge,
      accessCount: data.access_count,
      lastAccessedAt: data.last_accessed_at ? new Date(data.last_accessed_at) : null,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
    };
  }
  
  /**
   * 数据库记录转换为NeuralKey
   */
  private dbToKey(data: any): NeuralKey {
    return {
      id: data.id,
      holderRole: data.holder_role,
      teethPattern: data.teeth_pattern,
      strength: data.strength,
      targetDoorId: data.target_door_id,
      forgedAt: new Date(data.forged_at || data.created_at),
      lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : null,
      useCount: data.use_count,
      rustLevel: data.rust_level,
    };
  }
}

// 单例管理
let globalMemorySpace: MemorySpaceEngine | null = null;

export function getMemorySpaceEngine(headers: Record<string, string>): MemorySpaceEngine {
  if (!globalMemorySpace) {
    globalMemorySpace = new MemorySpaceEngine(headers);
  }
  return globalMemorySpace;
}
