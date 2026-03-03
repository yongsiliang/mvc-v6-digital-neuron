/**
 * ═══════════════════════════════════════════════════════════════════════
 * 超越传统记忆系统 - 基于神经科学的记忆算法
 * 
 * 核心理念：
 * 1. 记得更多 - 高密度压缩，联想网络扩展
 * 2. 记得更牢 - 艾宾浩斯曲线 + 情感加权 + 睡眠巩固
 * 3. 记得更久 - 间隔重复 + 主动复习 + 重构性回忆
 * 
 * 超越传统的算法：
 * - 遗忘曲线最优复习点计算
 * - 情感强度决定记忆深度
 * - 联想网络让记忆互相关联
 * - 睡眠模式整理和巩固
 * - 记忆竞争淘汰机制
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 超级记忆单元 */
export interface SuperMemory {
  id: string;
  
  /** 核心内容 */
  content: string;
  
  /** 记忆类型 */
  type: 'episodic' | 'semantic' | 'procedural' | 'emotional' | 'insight';
  
  // === 记忆强度系统 ===
  
  /** 初始强度 (0-1) - 由情感和重要性决定 */
  initialStrength: number;
  
  /** 当前强度 (0-1) - 动态变化 */
  currentStrength: number;
  
  /** 巩固级别 (1-10) - 每次成功回忆+1 */
  consolidationLevel: number;
  
  // === 艾宾浩斯遗忘曲线 ===
  
  /** 创建时间 */
  createdAt: number;
  
  /** 上次回忆时间 */
  lastRecalledAt: number;
  
  /** 回忆次数 */
  recallCount: number;
  
  /** 下次最优复习时间 */
  nextReviewAt: number;
  
  /** 复习历史 */
  reviewHistory: Array<{
    at: number;
    strength: number;
    success: boolean;  // 是否成功回忆
  }>;
  
  // === 情感加权 ===
  
  /** 情感标记 */
  emotionalMarker: {
    valence: number;    // -1 到 1：负面到正面
    arousal: number;    // 0 到 1：平静到激动
    dominance: number;  // 0 到 1：被动到主动
  };
  
  /** 情感强度加成 (0-1) */
  emotionalBoost: number;
  
  // === 联想网络 ===
  
  /** 关联记忆ID列表 */
  associations: Array<{
    targetId: string;
    type: 'semantic' | 'temporal' | 'causal' | 'emotional' | 'spatial';
    strength: number;
    formedAt: number;
  }>;
  
  /** 被激活的次数（通过联想） */
  activationCount: number;
  
  // === 元数据 ===
  
  /** 标签 */
  tags: string[];
  
  /** 重要性 (0-1) */
  importance: number;
  
  /** 来源 */
  source: {
    type: 'conversation' | 'reflection' | 'insight' | 'external';
    context?: string;
  };
}

/** 记忆系统的状态 */
export interface SuperMemoryState {
  /** 所有记忆 */
  memories: Map<string, SuperMemory>;
  
  /** 联想网络图 */
  associationGraph: Map<string, Set<string>>;
  
  /** 统计 */
  stats: {
    totalMemories: number;
    avgStrength: number;
    avgConsolidationLevel: number;
    dueForReview: number;
    associationCount: number;
  };
}

/** 系统配置 */
export interface SuperMemoryConfig {
  /** 最大记忆数量 */
  maxMemories: number;
  
  /** 艾宾浩斯曲线参数 */
  ebbinghaus: {
    baseInterval: number;      // 基础间隔（毫秒）
    growthFactor: number;      // 增长因子
    minStrength: number;       // 最小强度阈值
  };
  
  /** 情感权重 */
  emotionalWeight: number;
  
  /** 联想阈值 */
  associationThreshold: number;
}

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: SuperMemoryConfig = {
  maxMemories: 10000,
  ebbinghaus: {
    baseInterval: 1000 * 60 * 60,  // 1小时
    growthFactor: 2.5,              // 每次成功回忆，间隔 ×2.5
    minStrength: 0.1,
  },
  emotionalWeight: 0.4,
  associationThreshold: 0.3,
};

// ─────────────────────────────────────────────────────────────────────
// 艾宾浩斯遗忘曲线计算器
// ─────────────────────────────────────────────────────────────────────

/**
 * 艾宾浩斯遗忘曲线计算
 * 
 * 公式：R = e^(-t/S)
 * R = 保持率, t = 时间, S = 记忆强度
 */
export class EbbinghausCalculator {
  private config: SuperMemoryConfig['ebbinghaus'];
  
  constructor(config: SuperMemoryConfig['ebbinghaus']) {
    this.config = config;
  }
  
  /**
   * 计算当前保持率
   */
  calculateRetention(memory: SuperMemory): number {
    const now = Date.now();
    const timeSinceLastRecall = now - memory.lastRecalledAt;
    
    // 考虑巩固级别的加成
    const effectiveStrength = memory.currentStrength * (1 + memory.consolidationLevel * 0.1);
    
    // 遗忘曲线公式
    const retention = Math.exp(-timeSinceLastRecall / (effectiveStrength * 86400000 * 7)); // 以周为单位
    
    // 情感加成
    const emotionalBoost = 1 + memory.emotionalBoost * 0.5;
    
    return Math.min(1, retention * emotionalBoost);
  }
  
  /**
   * 计算下次最优复习时间
   * 
   * 基于间隔重复算法：
   * - 第一次复习：1小时后
   * - 第二次：1天后
   * - 第三次：3天后
   * - 第四次：1周后
   * - 之后：根据回忆成功率动态调整
   */
  calculateNextReview(memory: SuperMemory): number {
    const now = Date.now();
    const successCount = memory.reviewHistory.filter(r => r.success).length;
    
    // 基础间隔
    let interval: number;
    
    if (successCount === 0) {
      interval = this.config.baseInterval; // 1小时
    } else if (successCount === 1) {
      interval = this.config.baseInterval * 24; // 1天
    } else if (successCount === 2) {
      interval = this.config.baseInterval * 72; // 3天
    } else if (successCount === 3) {
      interval = this.config.baseInterval * 168; // 1周
    } else {
      // 动态计算：根据历史成功率
      const successRate = successCount / memory.reviewHistory.length;
      const lastInterval = memory.reviewHistory.length > 1 
        ? memory.reviewHistory[memory.reviewHistory.length - 1].at - memory.reviewHistory[memory.reviewHistory.length - 2].at
        : this.config.baseInterval * 168;
      
      interval = lastInterval * this.config.growthFactor * successRate;
    }
    
    // 情感加成：情感强度高的记忆可以延长复习间隔
    const emotionalFactor = 1 + memory.emotionalBoost * 0.3;
    interval *= emotionalFactor;
    
    return now + interval;
  }
  
  /**
   * 计算记忆强度衰减
   */
  calculateDecay(memory: SuperMemory, deltaTime: number): number {
    // 基础衰减
    const decayRate = 0.00001; // 每毫秒衰减率
    
    // 巩固级别减缓衰减
    const consolidationFactor = 1 / (1 + memory.consolidationLevel * 0.2);
    
    // 情感强度减缓衰减
    const emotionalFactor = 1 / (1 + memory.emotionalBoost * 0.3);
    
    const effectiveDecay = decayRate * consolidationFactor * emotionalFactor;
    
    return memory.currentStrength * Math.exp(-effectiveDecay * deltaTime);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 情感权重计算器
// ─────────────────────────────────────────────────────────────────────

/**
 * 情感加权系统
 * 
 * 原理：情感激活杏仁核，增强海马体记忆编码
 * 公式：MemoryDepth = BaseDepth × (1 + EmotionalWeight × EmotionalIntensity)
 */
export class EmotionalWeightCalculator {
  private weight: number;
  
  constructor(weight: number) {
    this.weight = weight;
  }
  
  /**
   * 计算情感加成
   */
  calculateBoost(marker: SuperMemory['emotionalMarker']): number {
    // PAD模型：愉悦度 × 激活度 × 支配度
    // 高唤醒 + 高效价 = 最强记忆
    // 高唤醒 + 低效价 = 创伤性记忆（也很强）
    
    const arousalFactor = marker.arousal;  // 激活度直接贡献
    const valenceFactor = Math.abs(marker.valence);  // 无论正负，极端情感都强
    const dominanceFactor = marker.dominance * 0.3;  // 支配度适度贡献
    
    // 情感强度 = 激活度 × (愉悦度绝对值 + 支配度)
    const emotionalIntensity = arousalFactor * (valenceFactor + dominanceFactor);
    
    // 最终加成
    return Math.min(1, emotionalIntensity * this.weight);
  }
  
  /**
   * 从文本分析情感
   */
  analyzeEmotion(text: string): SuperMemory['emotionalMarker'] {
    const marker: SuperMemory['emotionalMarker'] = {
      valence: 0,
      arousal: 0,
      dominance: 0.5,
    };
    
    // 正面情感词
    const positiveWords = ['开心', '高兴', '喜欢', '爱', '幸福', '激动', '惊喜', '感谢', '太棒', '美好'];
    // 负面情感词
    const negativeWords = ['难过', '伤心', '讨厌', '恨', '痛苦', '焦虑', '担心', '害怕', '失望', '糟糕'];
    // 高唤醒词
    const highArousalWords = ['激动', '愤怒', '惊喜', '恐惧', '兴奋', '狂喜', '暴怒', '极度'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    let arousalCount = 0;
    
    for (const word of positiveWords) {
      if (text.includes(word)) positiveCount++;
    }
    
    for (const word of negativeWords) {
      if (text.includes(word)) negativeCount++;
    }
    
    for (const word of highArousalWords) {
      if (text.includes(word)) arousalCount++;
    }
    
    // 计算效价（-1到1）
    marker.valence = Math.max(-1, Math.min(1, (positiveCount - negativeCount) * 0.3));
    
    // 计算激活度（0到1）
    marker.arousal = Math.min(1, (positiveCount + negativeCount + arousalCount) * 0.2);
    
    // 支配度默认0.5，可以根据语境调整
    
    return marker;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 联想网络系统
// ─────────────────────────────────────────────────────────────────────

/**
 * 联想网络
 * 
 * 原理：记忆不是孤立的，通过联想形成网络
 * 激活一个记忆会扩散到相关记忆
 */
export class AssociationNetwork {
  private graph: Map<string, Set<string>>;
  private memories: Map<string, SuperMemory>;
  private threshold: number;
  
  constructor(memories: Map<string, SuperMemory>, threshold: number) {
    this.graph = new Map();
    this.memories = memories;
    this.threshold = threshold;
  }
  
  /**
   * 自动建立联想
   * 
   * 类型：
   * - semantic: 语义相关（关键词重叠）
   * - temporal: 时间相关（同时发生）
   * - causal: 因果关系
   * - emotional: 情感相似
   * - spatial: 空间相关
   */
  autoAssociate(memory: SuperMemory): void {
    const associations: SuperMemory['associations'] = [];
    
    for (const [otherId, other] of this.memories) {
      if (otherId === memory.id) continue;
      
      // 1. 语义相似度
      const semanticSimilarity = this.calculateSemanticSimilarity(memory, other);
      if (semanticSimilarity > this.threshold) {
        associations.push({
          targetId: otherId,
          type: 'semantic',
          strength: semanticSimilarity,
          formedAt: Date.now(),
        });
      }
      
      // 2. 时间相关性（24小时内）
      const timeDiff = Math.abs(memory.createdAt - other.createdAt);
      if (timeDiff < 86400000) { // 24小时
        const temporalStrength = 1 - (timeDiff / 86400000);
        if (temporalStrength > this.threshold) {
          associations.push({
            targetId: otherId,
            type: 'temporal',
            strength: temporalStrength,
            formedAt: Date.now(),
          });
        }
      }
      
      // 3. 情感相似性
      const emotionalSimilarity = this.calculateEmotionalSimilarity(memory, other);
      if (emotionalSimilarity > this.threshold) {
        associations.push({
          targetId: otherId,
          type: 'emotional',
          strength: emotionalSimilarity,
          formedAt: Date.now(),
        });
      }
    }
    
    // 排序，只保留最强的关联
    associations.sort((a, b) => b.strength - a.strength);
    memory.associations = associations.slice(0, 10);
    
    // 更新图
    for (const assoc of memory.associations) {
      if (!this.graph.has(memory.id)) {
        this.graph.set(memory.id, new Set());
      }
      this.graph.get(memory.id)!.add(assoc.targetId);
    }
  }
  
  /**
   * 激活扩散
   * 
   * 从一个记忆出发，激活相关的记忆
   * 返回按激活强度排序的记忆列表
   */
  spreadActivation(
    sourceId: string,
    options: {
      maxDepth?: number;
      decayRate?: number;
      minActivation?: number;
    } = {}
  ): Array<{ memory: SuperMemory; activation: number }> {
    const maxDepth = options.maxDepth ?? 3;
    const decayRate = options.decayRate ?? 0.5;
    const minActivation = options.minActivation ?? 0.1;
    
    const activated = new Map<string, number>();
    const queue: Array<{ id: string; depth: number; activation: number }> = [
      { id: sourceId, depth: 0, activation: 1.0 }
    ];
    
    while (queue.length > 0) {
      const { id, depth, activation } = queue.shift()!;
      
      if (depth > maxDepth) continue;
      if (activation < minActivation) continue;
      
      const memory = this.memories.get(id);
      if (!memory) continue;
      
      // 记录激活
      if (!activated.has(id) || activated.get(id)! < activation) {
        activated.set(id, activation);
      }
      
      // 扩散到关联记忆
      for (const assoc of memory.associations) {
        const newActivation = activation * assoc.strength * decayRate;
        queue.push({
          id: assoc.targetId,
          depth: depth + 1,
          activation: newActivation,
        });
      }
    }
    
    // 转换并排序
    const result: Array<{ memory: SuperMemory; activation: number }> = [];
    for (const [id, activation] of activated) {
      const memory = this.memories.get(id);
      if (memory) {
        result.push({ memory, activation });
        memory.activationCount++;
      }
    }
    
    result.sort((a, b) => b.activation - a.activation);
    return result;
  }
  
  /**
   * 计算语义相似度
   */
  private calculateSemanticSimilarity(a: SuperMemory, b: SuperMemory): number {
    const aTags = new Set(a.tags);
    const bTags = new Set(b.tags);
    
    // Jaccard 相似度
    const intersection = new Set([...aTags].filter(x => bTags.has(x)));
    const union = new Set([...aTags, ...bTags]);
    
    if (union.size === 0) return 0;
    
    return intersection.size / union.size;
  }
  
  /**
   * 计算情感相似度
   */
  private calculateEmotionalSimilarity(a: SuperMemory, b: SuperMemory): number {
    const markerA = a.emotionalMarker;
    const markerB = b.emotionalMarker;
    
    // 欧氏距离的倒数
    const distance = Math.sqrt(
      Math.pow(markerA.valence - markerB.valence, 2) +
      Math.pow(markerA.arousal - markerB.arousal, 2) +
      Math.pow(markerA.dominance - markerB.dominance, 2)
    );
    
    // 归一化到 0-1
    return Math.max(0, 1 - distance / Math.sqrt(3));
  }
  
  getGraph(): Map<string, Set<string>> {
    return this.graph;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 睡眠巩固系统
// ─────────────────────────────────────────────────────────────────────

/**
 * 睡眠巩固
 * 
 * 模拟人类睡眠时的记忆整理：
 * 1. 重放重要记忆
 * 2. 清理弱记忆
 * 3. 加强联想
 * 4. 整合新记忆到长期存储
 */
export class SleepConsolidation {
  private memories: Map<string, SuperMemory>;
  
  constructor(memories: Map<string, SuperMemory>) {
    this.memories = memories;
  }
  
  /**
   * 执行睡眠巩固
   */
  consolidate(): {
    replayed: number;
    forgotten: number;
    strengthened: number;
  } {
    const stats = { replayed: 0, forgotten: 0, strengthened: 0 };
    const toRemove: string[] = [];
    
    for (const [id, memory] of this.memories) {
      // 1. 检查是否应该遗忘
      if (memory.currentStrength < 0.05 && memory.recallCount === 0) {
        toRemove.push(id);
        stats.forgotten++;
        continue;
      }
      
      // 2. 重放高重要性记忆（模拟REM睡眠）
      if (memory.importance > 0.7 || memory.emotionalBoost > 0.5) {
        // 每次重放相当于一次回忆
        memory.recallCount++;
        memory.lastRecalledAt = Date.now();
        memory.currentStrength = Math.min(1, memory.currentStrength * 1.1);
        stats.replayed++;
      }
      
      // 3. 加强联想（模拟突触强化）
      for (const assoc of memory.associations) {
        assoc.strength = Math.min(1, assoc.strength * 1.05);
      }
      
      // 4. 整合到长期存储
      if (memory.consolidationLevel < 5 && memory.recallCount >= 3) {
        memory.consolidationLevel++;
        stats.strengthened++;
      }
    }
    
    // 清理被遗忘的记忆
    for (const id of toRemove) {
      this.memories.delete(id);
    }
    
    return stats;
  }
  
  /**
   * 记忆竞争
   * 
   * 有限的"神经元"空间，让记忆竞争存活
   */
  compete(maxMemories: number): number {
    if (this.memories.size <= maxMemories) return 0;
    
    // 计算每个记忆的"生存分数"
    const scored: Array<{ id: string; score: number }> = [];
    
    for (const [id, memory] of this.memories) {
      const score = this.calculateSurvivalScore(memory);
      scored.push({ id, score });
    }
    
    // 排序
    scored.sort((a, b) => b.score - a.score);
    
    // 淘汰排名靠后的
    const toRemove = scored.slice(maxMemories);
    for (const { id } of toRemove) {
      this.memories.delete(id);
    }
    
    return toRemove.length;
  }
  
  /**
   * 计算生存分数
   */
  private calculateSurvivalScore(memory: SuperMemory): number {
    // 综合评分 = 强度 × 重要性 × 情感加成 × 巩固级别 × 激活次数
    return (
      memory.currentStrength * 0.3 +
      memory.importance * 0.25 +
      memory.emotionalBoost * 0.15 +
      (memory.consolidationLevel / 10) * 0.15 +
      Math.log10(memory.activationCount + 1) * 0.05 +
      Math.log10(memory.recallCount + 1) * 0.1
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// 超级记忆系统
// ─────────────────────────────────────────────────────────────────────

/**
 * 超级记忆系统
 * 
 * 整合所有超越传统的算法
 */
export class SuperMemorySystem {
  private memories: Map<string, SuperMemory>;
  private config: SuperMemoryConfig;
  private ebbinghaus: EbbinghausCalculator;
  private emotionalCalculator: EmotionalWeightCalculator;
  private associationNetwork: AssociationNetwork;
  private sleepConsolidation: SleepConsolidation;
  
  constructor(config: Partial<SuperMemoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memories = new Map();
    
    this.ebbinghaus = new EbbinghausCalculator(this.config.ebbinghaus);
    this.emotionalCalculator = new EmotionalWeightCalculator(this.config.emotionalWeight);
    this.associationNetwork = new AssociationNetwork(this.memories, this.config.associationThreshold);
    this.sleepConsolidation = new SleepConsolidation(this.memories);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心操作
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 创建新记忆
   */
  createMemory(
    content: string,
    options: {
      type?: SuperMemory['type'];
      tags?: string[];
      importance?: number;
      emotionalMarker?: SuperMemory['emotionalMarker'];
      source?: SuperMemory['source'];
    } = {}
  ): SuperMemory {
    // 分析情感
    const emotionalMarker = options.emotionalMarker || 
      this.emotionalCalculator.analyzeEmotion(content);
    
    // 计算情感加成
    const emotionalBoost = this.emotionalCalculator.calculateBoost(emotionalMarker);
    
    // 计算初始强度 = 重要性 × (1 + 情感加成)
    const importance = options.importance ?? 0.5;
    const initialStrength = Math.min(1, importance * (1 + emotionalBoost * 0.5));
    
    const memory: SuperMemory = {
      id: uuidv4(),
      content,
      type: options.type || 'episodic',
      initialStrength,
      currentStrength: initialStrength,
      consolidationLevel: 0,
      createdAt: Date.now(),
      lastRecalledAt: Date.now(),
      recallCount: 0,
      nextReviewAt: Date.now() + this.config.ebbinghaus.baseInterval, // 初始设为1小时后
      reviewHistory: [],
      emotionalMarker,
      emotionalBoost,
      associations: [],
      activationCount: 0,
      tags: options.tags || [],
      importance,
      source: options.source || { type: 'conversation' },
    };
    
    this.memories.set(memory.id, memory);
    
    // 自动建立联想
    this.associationNetwork.autoAssociate(memory);
    
    console.log(`[超级记忆] 创建记忆: "${content.slice(0, 30)}..." (强度: ${initialStrength.toFixed(2)}, 情感加成: ${emotionalBoost.toFixed(2)})`);
    
    return memory;
  }
  
  /**
   * 回忆记忆
   * 
   * 这不只是检索，而是"回忆"——会触发：
   * 1. 强度增强
   * 2. 巩固级别提升
   * 3. 联想激活扩散
   */
  recall(query: string, options: {
    maxResults?: number;
    spreadActivation?: boolean;
  } = {}): Array<{ memory: SuperMemory; relevance: number; activation?: number }> {
    const maxResults = options.maxResults ?? 10;
    const results: Array<{ memory: SuperMemory; relevance: number; activation?: number }> = [];
    
    const queryLower = query.toLowerCase();
    
    for (const memory of this.memories.values()) {
      // 计算相关性
      const relevance = this.calculateRelevance(memory, queryLower);
      
      if (relevance > 0.1) {
        // 应用艾宾浩斯保持率
        const retention = this.ebbinghaus.calculateRetention(memory);
        const effectiveRelevance = relevance * retention * memory.currentStrength;
        
        results.push({ memory, relevance: effectiveRelevance });
      }
    }
    
    // 排序
    results.sort((a, b) => b.relevance - a.relevance);
    const topResults = results.slice(0, maxResults);
    
    // 触发回忆效果
    for (const { memory } of topResults) {
      this.triggerRecall(memory, true);
    }
    
    // 联想激活扩散
    if (options.spreadActivation && topResults.length > 0) {
      const activated = this.associationNetwork.spreadActivation(topResults[0].memory.id);
      
      // 合并激活结果
      for (const { memory, activation } of activated.slice(1, 5)) {
        if (!topResults.find(r => r.memory.id === memory.id)) {
          topResults.push({ memory, relevance: activation * 0.5, activation });
        }
      }
    }
    
    return topResults;
  }
  
  /**
   * 触发回忆效果
   */
  private triggerRecall(memory: SuperMemory, success: boolean): void {
    memory.recallCount++;
    memory.lastRecalledAt = Date.now();
    
    // 回忆成功则增强
    if (success) {
      memory.currentStrength = Math.min(1, memory.currentStrength * 1.1 + 0.05);
      
      // 提升巩固级别
      if (memory.recallCount % 3 === 0 && memory.consolidationLevel < 10) {
        memory.consolidationLevel++;
      }
    }
    
    // 记录复习历史
    memory.reviewHistory.push({
      at: Date.now(),
      strength: memory.currentStrength,
      success,
    });
    
    // 更新下次复习时间
    memory.nextReviewAt = this.ebbinghaus.calculateNextReview(memory);
  }
  
  /**
   * 执行睡眠巩固
   */
  performSleepConsolidation(): {
    replayed: number;
    forgotten: number;
    strengthened: number;
    competed: number;
  } {
    console.log('[睡眠巩固] 开始执行...');
    
    const result = this.sleepConsolidation.consolidate();
    const competed = this.sleepConsolidation.compete(this.config.maxMemories);
    
    console.log(`[睡眠巩固] 完成: 重放${result.replayed}, 遗忘${result.forgotten}, 强化${result.strengthened}, 竞争淘汰${competed}`);
    
    return { ...result, competed };
  }
  
  /**
   * 获取需要复习的记忆
   */
  getDueForReview(): SuperMemory[] {
    const now = Date.now();
    const due: SuperMemory[] = [];
    
    for (const memory of this.memories.values()) {
      if (memory.nextReviewAt <= now) {
        due.push(memory);
      }
    }
    
    // 按紧急程度排序
    due.sort((a, b) => a.nextReviewAt - b.nextReviewAt);
    
    return due;
  }
  
  /**
   * 应用时间衰减
   */
  applyTimeDecay(): void {
    const now = Date.now();
    
    for (const memory of this.memories.values()) {
      const deltaTime = now - memory.lastRecalledAt;
      memory.currentStrength = this.ebbinghaus.calculateDecay(memory, deltaTime);
    }
  }
  
  /**
   * 计算相关性
   */
  private calculateRelevance(memory: SuperMemory, query: string): number {
    const contentLower = memory.content.toLowerCase();
    
    // 完全匹配
    if (contentLower === query) return 1.0;
    
    // 包含匹配
    if (contentLower.includes(query)) return 0.8;
    
    // 标签匹配
    for (const tag of memory.tags) {
      if (query.includes(tag.toLowerCase())) return 0.6;
    }
    
    // 关键词重叠
    const queryWords = query.split(/\s+/);
    let matchCount = 0;
    for (const word of queryWords) {
      if (word.length < 2) continue;
      if (contentLower.includes(word)) matchCount++;
    }
    
    return matchCount / queryWords.length * 0.5;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态管理
  // ══════════════════════════════════════════════════════════════════
  
  getState(): SuperMemoryState {
    const memories = Array.from(this.memories.values());
    const avgStrength = memories.length > 0
      ? memories.reduce((sum, m) => sum + m.currentStrength, 0) / memories.length
      : 0;
    const avgConsolidationLevel = memories.length > 0
      ? memories.reduce((sum, m) => sum + m.consolidationLevel, 0) / memories.length
      : 0;
    const dueForReview = this.getDueForReview().length;
    const associationCount = memories.reduce((sum, m) => sum + m.associations.length, 0);
    
    return {
      memories: this.memories,
      associationGraph: this.associationNetwork.getGraph(),
      stats: {
        totalMemories: this.memories.size,
        avgStrength,
        avgConsolidationLevel,
        dueForReview,
        associationCount,
      },
    };
  }
  
  exportState(): SuperMemory[] {
    return Array.from(this.memories.values());
  }
  
  importState(memories: SuperMemory[]): void {
    this.memories.clear();
    for (const memory of memories) {
      this.memories.set(memory.id, memory);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createSuperMemorySystem(
  config?: Partial<SuperMemoryConfig>
): SuperMemorySystem {
  return new SuperMemorySystem(config);
}
