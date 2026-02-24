/**
 * 意义记忆系统 - 将记忆深度融入算法核心
 * 
 * 核心理念：
 * ┌─────────────────────────────────────────────────────────┐
 * │   传统记忆：存储 → 检索 → 使用（被动）                    │
 * │                                                         │
 * │   意义记忆：                                             │
 * │   输入 → 提取意义 → 形成网络 → 共鸣激活 → 影响决策        │
 * │                      ↑                      │          │
 * │                      └──── 持续演化 ←────────┘          │
 * └─────────────────────────────────────────────────────────┘
 * 
 * 记忆不是"被查询"，而是"主动参与思考"
 */

import { EmbeddingClient } from 'coze-coding-dev-sdk';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { 
  MeaningMemory, 
  MeaningConnection,
  MeaningType,
  ConnectionType,
  TriggerSource
} from '@/storage/database/shared/schema';

/**
 * 意义提取结果
 */
export interface ExtractedMeaning {
  summary: string;        // 核心意义
  type: MeaningType;      // 意义类型
  emotionalWeight: number; // 情感权重
  vector: number[];       // 意义向量
}

/**
 * 激活结果
 */
export interface ActivationResult {
  memory: MeaningMemory;
  strength: number;       // 激活强度
  source: TriggerSource;  // 激活源
}

/**
 * 意义共鸣结果
 */
export interface ResonanceResult {
  activatedMemories: ActivationResult[];
  dominantTheme: string;   // 主导主题
  influenceWeight: number; // 影响权重
}

/**
 * 决策影响
 */
export interface DecisionInfluence {
  hints: string[];        // 给模型的提示
  patterns: string[];     // 发现的模式
  emotional: string;      // 情感倾向
  confidence: number;     // 信心加成
}

/**
 * 意义记忆引擎
 */
export class MeaningMemoryEngine {
  private embeddingClient: EmbeddingClient;
  private llmClient: LLMClient;
  private supabase = getSupabaseClient();
  
  // 激活阈值：相似度超过此值才会激活
  private readonly ACTIVATION_THRESHOLD = 0.65;
  
  // 最大激活数量：一次最多激活多少记忆
  private readonly MAX_ACTIVATIONS = 5;
  
  // 共鸣衰减：每次传递损失的比例
  private readonly RESONANCE_DECAY = 0.3;
  
  constructor(headers: Record<string, string>) {
    this.embeddingClient = new EmbeddingClient();
    const config = new Config();
    this.llmClient = new LLMClient(config, headers);
  }
  
  /**
   * 【核心方法1】提取意义
   * 
   * 从输入中提取"意义"而非原始内容
   * 人脑记住的不是数据，而是意义
   */
  async extractMeaning(
    content: string,
    role: string,
    context?: string
  ): Promise<ExtractedMeaning> {
    // 1. 用LLM提取核心意义
    const prompt = `从以下内容中提取"意义"（不是总结，而是核心洞见）：
内容：${content}
${context ? `上下文：${context}` : ''}

JSON格式输出：
{
  "summary": "核心意义（一句话，不超过30字）",
  "type": "insight|pattern|strategy|emotion|concept",
  "emotionalWeight": -1到1的数字（负面到正面）
}`;

    let meaning: { summary: string; type: MeaningType; emotionalWeight: number };
    
    try {
      let response = '';
      const stream = this.llmClient.stream(
        [{ role: 'user', content: prompt }],
        { model: 'doubao-seed-2-0-lite-260215', temperature: 0.3 }
      );
      
      for await (const chunk of stream) {
        if (chunk.content) response += chunk.content.toString();
      }
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      meaning = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        summary: content.slice(0, 30),
        type: 'concept' as MeaningType,
        emotionalWeight: 0,
      };
    } catch {
      meaning = {
        summary: content.slice(0, 30),
        type: 'concept' as MeaningType,
        emotionalWeight: 0,
      };
    }
    
    // 2. 用Embedding生成意义向量
    const vector = await this.embeddingClient.embedText(meaning.summary);
    
    return {
      summary: meaning.summary,
      type: meaning.type,
      emotionalWeight: meaning.emotionalWeight,
      vector,
    };
  }
  
  /**
   * 【核心方法2】存储意义记忆
   * 
   * 将意义存入网络，并自动建立关联
   */
  async storeMeaning(
    meaning: ExtractedMeaning,
    role: string,
    rawContent: string
  ): Promise<MeaningMemory> {
    // 存储记忆
    const { data, error } = await this.supabase
      .from('meaning_memories')
      .insert({
        meaning_vector: meaning.vector,
        vector_dimension: meaning.vector.length,
        raw_content: rawContent,
        meaning_summary: meaning.summary,
        role,
        meaning_type: meaning.type,
        activation_level: 1.0, // 新记忆初始激活度高
        resonance_count: 0,
        connected_memory_ids: [],
        emotional_weight: meaning.emotionalWeight,
        last_activated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error || !data) {
      throw new Error(`存储意义失败: ${error?.message}`);
    }
    
    const memory = data as MeaningMemory;
    
    // 建立与其他记忆的连接（后台执行）
    this.buildConnections(memory).catch(() => {});
    
    return memory;
  }
  
  /**
   * 【核心方法3】共鸣激活
   * 
   * 当新输入到来，激活相关的记忆
   * 记忆不是被查询，而是被"共鸣唤醒"
   */
  async resonate(input: string, role: string): Promise<ResonanceResult> {
    // 1. 获取输入的意义向量
    const inputVector = await this.embeddingClient.embedText(input);
    
    // 2. 查找可共鸣的记忆
    const { data: memories } = await this.supabase
      .from('meaning_memories')
      .select('*')
      .eq('role', role)
      .order('resonance_count', { ascending: false })
      .limit(50);
    
    if (!memories || memories.length === 0) {
      return {
        activatedMemories: [],
        dominantTheme: '',
        influenceWeight: 0,
      };
    }
    
    // 3. 计算共鸣强度并激活
    const activations: ActivationResult[] = [];
    
    for (const memory of memories) {
      const memData = memory as any;
      const memVector = memData.meaning_vector as number[];
      
      if (!memVector || memVector.length === 0) continue;
      
      const similarity = this.cosineSimilarity(inputVector, memVector);
      
      if (similarity > this.ACTIVATION_THRESHOLD) {
        const activationStrength = similarity * (memData.activation_level || 0.5);
        
        activations.push({
          memory: memory as MeaningMemory,
          strength: activationStrength,
          source: 'input',
        });
        
        // 记录激活
        this.recordActivation(memData.id, 'input', input, activationStrength).catch(() => {});
      }
    }
    
    // 4. 按强度排序，取前N个
    activations.sort((a, b) => b.strength - a.strength);
    const topActivations = activations.slice(0, this.MAX_ACTIVATIONS);
    
    // 5. 级联激活：激活的记忆再激活它们的连接记忆
    const cascadeActivations = await this.cascadeActivate(topActivations);
    topActivations.push(...cascadeActivations);
    
    // 6. 计算主导主题和影响权重
    const dominantTheme = this.extractDominantTheme(topActivations.map(a => a.memory));
    const influenceWeight = Math.min(0.3, topActivations.reduce((sum, a) => sum + a.strength, 0) / 10);
    
    return {
      activatedMemories: topActivations,
      dominantTheme,
      influenceWeight,
    };
  }
  
  /**
   * 【核心方法4】影响决策
   * 
   * 被激活的记忆主动影响模型的思考
   * 记忆不是被查询，而是成为思考的一部分
   */
  influenceDecision(resonance: ResonanceResult): DecisionInfluence {
    const { activatedMemories, dominantTheme, influenceWeight } = resonance;
    
    if (activatedMemories.length === 0) {
      return {
        hints: [],
        patterns: [],
        emotional: 'neutral',
        confidence: 0,
      };
    }
    
    // Supabase返回snake_case字段，需要转换
    type SupabaseMemory = MeaningMemory & {
      meaning_summary: string;
      meaning_type: MeaningType;
      emotional_weight: number;
    };
    
    // 提取提示（给模型的思考提示）
    const hints = activatedMemories
      .slice(0, 3)
      .map(a => (a.memory as SupabaseMemory).meaning_summary || a.memory.meaningSummary);
    
    // 提取模式
    const patterns = activatedMemories
      .filter(a => (a.memory as SupabaseMemory).meaning_type === 'pattern' || a.memory.meaningType === 'pattern')
      .map(a => (a.memory as SupabaseMemory).meaning_summary || a.memory.meaningSummary);
    
    // 计算情感倾向
    const avgEmotion = activatedMemories.reduce((sum, a) => 
      sum + ((a.memory as SupabaseMemory).emotional_weight ?? a.memory.emotionalWeight ?? 0), 0) / activatedMemories.length;
    
    const emotional = avgEmotion > 0.3 ? 'positive' : avgEmotion < -0.3 ? 'negative' : 'neutral';
    
    return {
      hints,
      patterns,
      emotional,
      confidence: influenceWeight,
    };
  }
  
  /**
   * 【核心方法5】演化记忆
   * 
   * 记忆不是静止的，会随着使用而演化
   * - 被激活的记忆会加强
   * - 长期不被激活的记忆会衰减
   * - 新的记忆会与旧记忆融合
   */
  async evolve(role: string): Promise<void> {
    // 1. 衰减所有记忆的激活度
    const { data: memories } = await this.supabase
      .from('meaning_memories')
      .select('id, activation_level, resonance_count')
      .eq('role', role);
    
    if (!memories) return;
    
    for (const memory of memories) {
      const memData = memory as any;
      // 衰减公式：新激活度 = 旧激活度 * 0.95
      const newLevel = Math.max(0.1, (memData.activation_level || 0.5) * 0.95);
      
      await this.supabase
        .from('meaning_memories')
        .update({ activation_level: newLevel })
        .eq('id', memData.id);
    }
    
    // 2. 清理弱记忆（激活度太低且没被激活过的）
    await this.supabase
      .from('meaning_memories')
      .delete()
      .eq('role', role)
      .lt('activation_level', 0.15)
      .eq('resonance_count', 0);
  }
  
  /**
   * 构建记忆连接
   */
  private async buildConnections(memory: MeaningMemory): Promise<void> {
    // Supabase返回snake_case字段
    type SupabaseMemory = MeaningMemory & {
      meaning_vector: number[];
      meaning_type: MeaningType;
    };
    
    const { data: others } = await this.supabase
      .from('meaning_memories')
      .select('*')
      .neq('id', memory.id)
      .limit(100);
    
    if (!others) return;
    
    const connections: Array<{ targetId: string; strength: number; type: ConnectionType }> = [];
    
    const memVector = (memory as SupabaseMemory).meaning_vector || memory.meaningVector;
    
    for (const other of others) {
      const otherData = other as SupabaseMemory;
      const otherVector = otherData.meaning_vector;
      
      if (!otherVector) continue;
      
      const similarity = this.cosineSimilarity(
        memVector as number[],
        otherVector
      );
      
      if (similarity > 0.5) {
        // 确定连接类型
        const type: ConnectionType = similarity > 0.8 ? 'similar' : 
          ((memory as SupabaseMemory).meaning_type || memory.meaningType) === otherData.meaning_type ? 'complementary' : 'contrastive';
        
        connections.push({
          targetId: (otherData as any).id,
          strength: similarity,
          type,
        });
        
        // 存储连接
        await this.supabase
          .from('meaning_connections')
          .insert({
            source_memory_id: memory.id,
            target_memory_id: otherData.id,
            connection_strength: similarity,
            connection_type: type,
          });
      }
    }
    
    // 更新记忆的连接列表
    if (connections.length > 0) {
      const connectedIds = connections.slice(0, 20).map(c => c.targetId);
      await this.supabase
        .from('meaning_memories')
        .update({ connected_memory_ids: connectedIds })
        .eq('id', memory.id);
    }
  }
  
  /**
   * 级联激活
   */
  private async cascadeActivate(
    primaryActivations: ActivationResult[]
  ): Promise<ActivationResult[]> {
    // Supabase返回snake_case字段
    type SupabaseMemory = MeaningMemory & {
      meaning_summary: string;
      connected_memory_ids: string[];
    };
    
    const cascade: ActivationResult[] = [];
    
    for (const activation of primaryActivations) {
      const connectedIds = (activation.memory as SupabaseMemory).connected_memory_ids || 
        activation.memory.connectedMemoryIds || [];
      
      if (connectedIds.length === 0) continue;
      
      // 获取连接的记忆
      const { data: connected } = await this.supabase
        .from('meaning_memories')
        .select('*')
        .in('id', connectedIds.slice(0, 3));
      
      if (!connected) continue;
      
      for (const mem of connected) {
        const strength = activation.strength * (1 - this.RESONANCE_DECAY);
        
        if (strength > 0.3) {
          cascade.push({
            memory: mem as MeaningMemory,
            strength,
            source: 'resonance',
          });
          
          // 记录级联激活
          this.recordActivation(
            (mem as any).id, 
            'resonance', 
            `来自${(activation.memory as SupabaseMemory).meaning_summary || activation.memory.meaningSummary}`, 
            strength
          ).catch(() => {});
        }
      }
    }
    
    return cascade;
  }
  
  /**
   * 记录激活
   */
  private async recordActivation(
    memoryId: string,
    source: TriggerSource,
    content: string,
    strength: number
  ): Promise<void> {
    // 更新记忆的激活信息
    await this.supabase
      .from('meaning_memories')
      .update({
        resonance_count: this.supabase.rpc('increment_resonance', { mem_id: memoryId }),
        activation_level: Math.min(1, strength + 0.1),
        last_activated_at: new Date().toISOString(),
      })
      .eq('id', memoryId);
    
    // 记录激活事件
    await this.supabase
      .from('activation_records')
      .insert({
        trigger_source: source,
        trigger_content: content.slice(0, 100),
        activated_memory_id: memoryId,
        activation_strength: strength,
      });
  }
  
  /**
   * 提取主导主题
   */
  private extractDominantTheme(memories: MeaningMemory[]): string {
    if (memories.length === 0) return '';
    
    // Supabase返回snake_case字段
    type SupabaseMemory = MeaningMemory & {
      meaning_type: MeaningType;
    };
    
    // 找出最频繁的意义类型
    const typeCounts = new Map<MeaningType, number>();
    for (const m of memories) {
      const memType = (m as SupabaseMemory).meaning_type || m.meaningType;
      const count = typeCounts.get(memType as MeaningType) || 0;
      typeCounts.set(memType as MeaningType, count + 1);
    }
    
    let maxType: MeaningType = 'insight';
    let maxCount = 0;
    for (const [type, count] of typeCounts) {
      if (count > maxCount) {
        maxCount = count;
        maxType = type;
      }
    }
    
    return maxType;
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
   * 获取记忆统计
   */
  async getStats(role: string): Promise<{
    total: number;
    byType: Record<MeaningType, number>;
    avgActivation: number;
    totalResonance: number;
  }> {
    const { data: memories } = await this.supabase
      .from('meaning_memories')
      .select('*')
      .eq('role', role);
    
    if (!memories) {
      return {
        total: 0,
        byType: { insight: 0, pattern: 0, strategy: 0, emotion: 0, concept: 0 },
        avgActivation: 0,
        totalResonance: 0,
      };
    }
    
    const byType: Record<MeaningType, number> = {
      insight: 0,
      pattern: 0,
      strategy: 0,
      emotion: 0,
      concept: 0,
    };
    
    let totalActivation = 0;
    let totalResonance = 0;
    
    for (const m of memories) {
      const memData = m as any;
      const type = memData.meaning_type as MeaningType;
      if (byType[type] !== undefined) {
        byType[type]++;
      }
      totalActivation += memData.activation_level || 0;
      totalResonance += memData.resonance_count || 0;
    }
    
    return {
      total: memories.length,
      byType,
      avgActivation: memories.length > 0 ? totalActivation / memories.length : 0,
      totalResonance,
    };
  }
}

// 单例管理
let globalEngine: MeaningMemoryEngine | null = null;

export function getMeaningMemoryEngine(headers: Record<string, string>): MeaningMemoryEngine {
  if (!globalEngine) {
    globalEngine = new MeaningMemoryEngine(headers);
  }
  return globalEngine;
}
