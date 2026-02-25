/**
 * 神经递质系统
 * Neurotransmitter System
 * 
 * 核心概念：信息 = 神经递质
 * 
 * 神经递质是在神经元之间流动的信息载体。
 * 类比人脑中的神经递质（多巴胺、血清素、谷氨酸等），
 * 不同类型的递质携带不同类型的信号。
 * 
 * 工作流程：
 * 1. 输入文本 → 神经递质工厂 → 创建神经递质
 * 2. 神经递质 → 感觉神经元 → 被接收或忽略
 * 3. 神经元发放 → 产生新的神经递质 → 传递到下游
 */

import { EmbeddingClient } from 'coze-coding-dev-sdk';
import { getEmbeddingManager } from './embedding-manager';

/**
 * 神经递质类型
 * 
 * 类比真实神经递质的功能分化：
 * - 谷氨酸：兴奋性传递（主要信息载体）
 * - 多巴胺：奖励、动机信号
 * - 血清素：情绪调节
 * - GABA：抑制信号
 */
export enum NeurotransmitterType {
  // 输入型递质
  TEXT = 'text',             // 文本信息（类比谷氨酸）
  EMOTION = 'emotion',       // 情感信息（类比血清素）
  INTENT = 'intent',         // 意图信息（类比多巴胺）
  
  // 内部递质
  MEMORY = 'memory',         // 记忆信号
  ASSOCIATION = 'association', // 联想信号
  ATTENTION = 'attention',   // 注意力信号
  CONCEPT = 'concept',       // 概念激活信号
  
  // 输出型递质
  RESPONSE = 'response',     // 响应信号
  ACTION = 'action',         // 行动信号
  
  // 调节型递质
  REWARD = 'reward',         // 奖励信号（强化学习）
  INHIBIT = 'inhibit',       // 抑制信号
}

/**
 * 神经递质：在神经元之间流动的信息
 */
export interface Neurotransmitter {
  /** 唯一标识 */
  id: string;
  
  /** 类型 */
  type: NeurotransmitterType;
  
  /** 内容向量（核心语义表示） */
  vector: number[];
  
  /** 原始内容（如果有） */
  content?: string;
  
  /** 情感色彩 [-1, 1]：负面到正面 */
  valence: number;
  
  /** 激发强度 [0, 1] */
  intensity: number;
  
  /** 来源神经元ID */
  sourceNeuron: string;
  
  /** 目标神经元ID（广播则为空） */
  targetNeuron?: string;
  
  /** 创建时间 */
  timestamp: number;
  
  /** 代谢率：递质强度随时间衰减的速率 */
  decayRate: number;
  
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 神经递质池
 * 
 * 管理当前活跃的神经递质
 */
export class NeurotransmitterPool {
  private pool: Neurotransmitter[] = [];
  private maxSize: number = 1000;
  
  /**
   * 添加神经递质到池中
   */
  add(transmitter: Neurotransmitter): void {
    this.pool.push(transmitter);
    
    // 维护池大小
    if (this.pool.length > this.maxSize) {
      // 移除最旧和最弱的
      this.pool.sort((a, b) => {
        const scoreA = a.intensity * (1 - a.decayRate * (Date.now() - a.timestamp) / 1000);
        const scoreB = b.intensity * (1 - b.decayRate * (Date.now() - b.timestamp) / 1000);
        return scoreB - scoreA;
      });
      this.pool = this.pool.slice(0, this.maxSize);
    }
  }
  
  /**
   * 获取所有活跃的神经递质
   */
  getActive(): Neurotransmitter[] {
    const now = Date.now();
    return this.pool.filter(t => {
      const age = (now - t.timestamp) / 1000;
      const effectiveIntensity = t.intensity * Math.exp(-t.decayRate * age);
      return effectiveIntensity > 0.1; // 阈值
    });
  }
  
  /**
   * 获取特定类型的神经递质
   */
  getByType(type: NeurotransmitterType): Neurotransmitter[] {
    return this.getActive().filter(t => t.type === type);
  }
  
  /**
   * 获取发给特定神经元的递质
   */
  getForNeuron(neuronId: string): Neurotransmitter[] {
    return this.getActive().filter(t => 
      !t.targetNeuron || t.targetNeuron === neuronId
    );
  }
  
  /**
   * 清除过期递质
   */
  cleanup(): void {
    this.pool = this.getActive();
  }
  
  /**
   * 获取池状态
   */
  getStats(): { total: number; byType: Record<string, number> } {
    const active = this.getActive();
    const byType: Record<string, number> = {};
    
    for (const t of active) {
      byType[t.type] = (byType[t.type] || 0) + 1;
    }
    
    return { total: active.length, byType };
  }
}

/**
 * 神经递质工厂
 * 
 * 将原始信息转换为神经递质
 */
export class NeurotransmitterFactory {
  private embeddingManager = getEmbeddingManager();
  private pool: NeurotransmitterPool;
  private idCounter: number = 0;
  
  constructor(pool: NeurotransmitterPool) {
    this.pool = pool;
  }
  
  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `nt-${Date.now()}-${++this.idCounter}`;
  }
  
  /**
   * 从文本创建神经递质
   */
  async fromText(
    text: string,
    options?: {
      sourceNeuron?: string;
      intensity?: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Neurotransmitter> {
    // 1. 获取语义向量
    const vector = await this.embeddingManager.embed(text, 'text-standard');
    
    // 2. 分析情感色彩
    const valence = await this.analyzeValence(text);
    
    // 3. 分析意图
    const intent = this.analyzeIntent(text);
    
    // 4. 计算基础强度
    const intensity = options?.intensity ?? this.calculateIntensity(text);
    
    const transmitter: Neurotransmitter = {
      id: this.generateId(),
      type: NeurotransmitterType.TEXT,
      vector,
      content: text,
      valence,
      intensity,
      sourceNeuron: options?.sourceNeuron || 'INPUT',
      timestamp: Date.now(),
      decayRate: 0.02, // 文本递质衰减较快
      metadata: {
        intent,
        textLength: text.length,
        ...options?.metadata,
      },
    };
    
    this.pool.add(transmitter);
    return transmitter;
  }
  
  /**
   * 从情感创建神经递质
   */
  fromEmotion(
    emotion: {
      type: string;
      valence: number;
      arousal: number;
    },
    sourceNeuron: string
  ): Neurotransmitter {
    // 情感向量：基于情绪类型的简单编码
    const vector = this.emotionToVector(emotion);
    
    const transmitter: Neurotransmitter = {
      id: this.generateId(),
      type: NeurotransmitterType.EMOTION,
      vector,
      content: emotion.type,
      valence: emotion.valence,
      intensity: emotion.arousal,
      sourceNeuron,
      timestamp: Date.now(),
      decayRate: 0.05, // 情感递质衰减更快
    };
    
    this.pool.add(transmitter);
    return transmitter;
  }
  
  /**
   * 从记忆创建神经递质
   */
  fromMemory(
    memory: {
      id: string;
      vector: number[];
      content: string;
      emotionalWeight: number;
    },
    strength: number
  ): Neurotransmitter {
    const transmitter: Neurotransmitter = {
      id: this.generateId(),
      type: NeurotransmitterType.MEMORY,
      vector: memory.vector,
      content: memory.content,
      valence: memory.emotionalWeight,
      intensity: strength,
      sourceNeuron: memory.id,
      timestamp: Date.now(),
      decayRate: 0.01, // 记忆递质衰减较慢
    };
    
    this.pool.add(transmitter);
    return transmitter;
  }
  
  /**
   * 创建联想递质
   */
  createAssociation(
    sourceNeuron: string,
    targetNeuron: string,
    content: string,
    vector: number[],
    strength: number
  ): Neurotransmitter {
    const transmitter: Neurotransmitter = {
      id: this.generateId(),
      type: NeurotransmitterType.ASSOCIATION,
      vector,
      content,
      valence: 0,
      intensity: strength,
      sourceNeuron,
      targetNeuron,
      timestamp: Date.now(),
      decayRate: 0.03,
    };
    
    this.pool.add(transmitter);
    return transmitter;
  }
  
  /**
   * 创建响应递质
   */
  createResponse(
    sourceNeuron: string,
    content: string,
    vector: number[],
    style: {
      tone: string;
      formality: number;
      warmth: number;
    }
  ): Neurotransmitter {
    const transmitter: Neurotransmitter = {
      id: this.generateId(),
      type: NeurotransmitterType.RESPONSE,
      vector,
      content,
      valence: style.warmth > 0.5 ? 0.3 : 0,
      intensity: 0.8,
      sourceNeuron,
      timestamp: Date.now(),
      decayRate: 0.1, // 响应递质快速衰减
      metadata: { style },
    };
    
    this.pool.add(transmitter);
    return transmitter;
  }
  
  /**
   * 创建奖励递质（用于学习）
   */
  createReward(
    sourceNeuron: string,
    reward: number, // -1 to 1
    reason: string
  ): Neurotransmitter {
    const transmitter: Neurotransmitter = {
      id: this.generateId(),
      type: NeurotransmitterType.REWARD,
      vector: [reward], // 简单向量
      content: reason,
      valence: reward,
      intensity: Math.abs(reward),
      sourceNeuron,
      timestamp: Date.now(),
      decayRate: 0.1,
    };
    
    this.pool.add(transmitter);
    return transmitter;
  }
  
  /**
   * 聚合多个神经递质
   */
  aggregate(transmitters: Neurotransmitter[]): Neurotransmitter {
    if (transmitters.length === 0) {
      throw new Error('Cannot aggregate empty transmitter array');
    }
    
    if (transmitters.length === 1) {
      return transmitters[0];
    }
    
    // 加权平均向量
    const totalIntensity = transmitters.reduce((sum, t) => sum + t.intensity, 0);
    const dimension = transmitters[0].vector.length;
    const aggregatedVector: number[] = new Array(dimension).fill(0);
    
    for (const t of transmitters) {
      const weight = t.intensity / totalIntensity;
      for (let i = 0; i < dimension; i++) {
        aggregatedVector[i] += t.vector[i] * weight;
      }
    }
    
    // 归一化
    const norm = Math.sqrt(aggregatedVector.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < dimension; i++) {
        aggregatedVector[i] /= norm;
      }
    }
    
    // 加权平均情感
    const aggregatedValence = transmitters.reduce(
      (sum, t) => sum + t.valence * t.intensity, 0
    ) / totalIntensity;
    
    return {
      id: this.generateId(),
      type: NeurotransmitterType.ASSOCIATION, // 聚合结果通常是联想类型
      vector: aggregatedVector,
      content: transmitters.map(t => t.content).filter(Boolean).join(' | '),
      valence: aggregatedValence,
      intensity: Math.min(1, totalIntensity / transmitters.length),
      sourceNeuron: 'AGGREGATOR',
      timestamp: Date.now(),
      decayRate: 0.02,
      metadata: {
        aggregatedFrom: transmitters.map(t => t.id),
        count: transmitters.length,
      },
    };
  }
  
  // ==================== 私有方法 ====================
  
  /**
   * 分析情感色彩
   */
  private async analyzeValence(text: string): Promise<number> {
    // 简单的情感词典方法
    const positiveWords = ['开心', '快乐', '喜欢', '爱', '好', '棒', '谢谢', '感谢', '满意', '高兴'];
    const negativeWords = ['难过', '伤心', '讨厌', '恨', '差', '糟', '烦', '累', '压力', '担心'];
    
    let score = 0;
    for (const word of positiveWords) {
      if (text.includes(word)) score += 0.2;
    }
    for (const word of negativeWords) {
      if (text.includes(word)) score -= 0.2;
    }
    
    return Math.max(-1, Math.min(1, score));
  }
  
  /**
   * 分析意图
   */
  private analyzeIntent(text: string): string {
    // 简单的意图识别
    if (text.includes('?') || text.includes('？') || text.includes('吗')) {
      return 'question';
    }
    if (text.includes('帮我') || text.includes('请')) {
      return 'request';
    }
    if (text.includes('谢谢') || text.includes('感谢')) {
      return 'gratitude';
    }
    if (text.includes('不对') || text.includes('错误') || text.includes('问题')) {
      return 'complaint';
    }
    return 'statement';
  }
  
  /**
   * 计算强度
   */
  private calculateIntensity(text: string): number {
    // 基于文本特征的强度估算
    let intensity = 0.5;
    
    // 长度加成
    if (text.length > 100) intensity += 0.1;
    if (text.length > 300) intensity += 0.1;
    
    // 情感词加成
    const emotionWords = ['非常', '特别', '极其', '太', '超级'];
    for (const word of emotionWords) {
      if (text.includes(word)) intensity += 0.1;
    }
    
    // 感叹号加成
    const exclamations = (text.match(/[!！]/g) || []).length;
    intensity += Math.min(0.2, exclamations * 0.05);
    
    return Math.min(1, intensity);
  }
  
  /**
   * 情绪转向量
   */
  private emotionToVector(emotion: { type: string; valence: number; arousal: number }): number[] {
    // 简单的16维情绪编码
    const emotions = ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral', 'curious'];
    const vector: number[] = new Array(16).fill(0);
    
    // 前8维：情绪类型编码
    const emotionIndex = emotions.indexOf(emotion.type);
    if (emotionIndex >= 0) {
      vector[emotionIndex] = emotion.arousal;
    }
    
    // 后8维：情感属性
    vector[8] = emotion.valence;      // 效价
    vector[9] = emotion.arousal;       // 唤醒度
    vector[10] = Math.abs(emotion.valence); // 情感强度
    
    return vector;
  }
}

// ==================== 单例管理 ====================

let globalPool: NeurotransmitterPool | null = null;
let globalFactory: NeurotransmitterFactory | null = null;

/**
 * 获取全局神经递质池
 */
export function getNeurotransmitterPool(): NeurotransmitterPool {
  if (!globalPool) {
    globalPool = new NeurotransmitterPool();
  }
  return globalPool;
}

/**
 * 获取全局神经递质工厂
 */
export function getNeurotransmitterFactory(): NeurotransmitterFactory {
  if (!globalFactory) {
    globalFactory = new NeurotransmitterFactory(getNeurotransmitterPool());
  }
  return globalFactory;
}
