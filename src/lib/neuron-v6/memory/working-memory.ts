/**
 * ═══════════════════════════════════════════════════════════════════════
 * 工作记忆系统 (Working Memory System)
 * 
 * 核心概念：
 * - 短期记忆缓冲区，存储当前对话上下文
 * - 容量有限（7±2 规则）
 * - 自动衰减和清理
 * - 与长期记忆交互
 * 
 * 灵感来源：
 * - 认知心理学：工作记忆理论 (Baddeley & Hitch)
 * - 米勒定律：7±2 信息块
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 工作记忆项 */
export interface WorkingMemoryItem {
  id: string;
  content: string;
  type: 'user_input' | 'assistant_response' | 'key_info' | 'context' | 'emotion';
  
  /** 重要程度 (0-1) */
  importance: number;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后访问时间 */
  lastAccessedAt: number;
  
  /** 访问次数 */
  accessCount: number;
  
  /** 衰减率（越高衰减越快） */
  decayRate: number;
  
  /** 当前强度 */
  strength: number;
  
  /** 关联的长期记忆ID */
  linkedMemoryIds: string[];
  
  /** 情感标记 */
  emotionalMarker?: {
    valence: number; // -1 到 1，负面到正面
    arousal: number; // 0 到 1，平静到激动
  };
}

/** 工作记忆状态 */
export interface WorkingMemoryState {
  items: WorkingMemoryItem[];
  totalCapacity: number;
  usedCapacity: number;
  averageStrength: number;
  dominantEmotion?: string;
}

/** 工作记忆配置 */
export interface WorkingMemoryConfig {
  /** 最大容量（默认 7，遵循 7±2 规则） */
  maxCapacity: number;
  
  /** 默认衰减率（每秒衰减比例） */
  defaultDecayRate: number;
  
  /** 最低强度阈值（低于此值清除） */
  minStrength: number;
  
  /** 是否启用情感加权 */
  enableEmotionWeighting: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: WorkingMemoryConfig = {
  maxCapacity: 30,  // 🆕 增加容量到 30（原来是 15），匹配主流上下文能力
  defaultDecayRate: 0.0001, // 🆕 进一步降低衰减率，让记忆保持更久
  minStrength: 0.02, // 🆕 降低最低强度阈值，让更多记忆保持
  enableEmotionWeighting: true,
};

// ─────────────────────────────────────────────────────────────────────
// 工作记忆管理器
// ─────────────────────────────────────────────────────────────────────

/**
 * 工作记忆管理器
 */
export class WorkingMemory {
  private items: Map<string, WorkingMemoryItem> = new Map();
  private config: WorkingMemoryConfig;
  private lastDecayTime: number = Date.now();
  
  constructor(config: Partial<WorkingMemoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心操作
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 添加工作记忆项
   */
  add(
    content: string,
    type: WorkingMemoryItem['type'],
    options: {
      importance?: number;
      emotionalMarker?: WorkingMemoryItem['emotionalMarker'];
    } = {}
  ): WorkingMemoryItem {
    // 先执行衰减
    this.decay();
    
    // 如果超过容量，清理最弱的项
    if (this.items.size >= this.config.maxCapacity) {
      this.evictWeakest();
    }
    
    const item: WorkingMemoryItem = {
      id: uuidv4(),
      content,
      type,
      importance: options.importance ?? this.calculateDefaultImportance(type),
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 1,
      decayRate: this.config.defaultDecayRate,
      strength: 1.0,
      linkedMemoryIds: [],
      emotionalMarker: options.emotionalMarker,
    };
    
    // 情感加权：高情感强度的记忆衰减更慢
    if (this.config.enableEmotionWeighting && item.emotionalMarker) {
      const emotionWeight = Math.abs(item.emotionalMarker.arousal);
      item.decayRate *= (1 - emotionWeight * 0.5); // 情感强度越高，衰减越慢
    }
    
    this.items.set(item.id, item);
    
    console.log(`[工作记忆] 添加: "${content.slice(0, 20)}..." (类型: ${type}, 重要性: ${item.importance.toFixed(2)})`);
    
    return item;
  }
  
  /**
   * 访问工作记忆项（增强强度）
   */
  access(itemId: string): WorkingMemoryItem | null {
    const item = this.items.get(itemId);
    if (!item) return null;
    
    item.accessCount++;
    item.lastAccessedAt = Date.now();
    item.strength = Math.min(1.0, item.strength + 0.3); // 访问增强
    
    return item;
  }
  
  /**
   * 检索相关的工作记忆
   */
  retrieve(query: string, options: {
    maxResults?: number;
    types?: WorkingMemoryItem['type'][];
  } = {}): WorkingMemoryItem[] {
    const maxResults = options.maxResults ?? 5;
    
    // 先衰减
    this.decay();
    
    const results: Array<{ item: WorkingMemoryItem; score: number }> = [];
    const queryLower = query.toLowerCase();
    
    for (const item of this.items.values()) {
      // 类型过滤
      if (options.types && !options.types.includes(item.type)) {
        continue;
      }
      
      // 计算相关性分数
      const relevance = this.calculateRelevance(item, queryLower);
      
      if (relevance > 0) {
        // 综合分数 = 相关性 × 强度 × 重要性
        const score = relevance * item.strength * item.importance;
        results.push({ item, score });
      }
    }
    
    // 按分数排序
    results.sort((a, b) => b.score - a.score);
    
    // 更新访问
    const topResults = results.slice(0, maxResults);
    for (const { item } of topResults) {
      this.access(item.id);
    }
    
    return topResults.map(r => r.item);
  }
  
  /**
   * 获取所有工作记忆（按强度排序）
   */
  getAll(): WorkingMemoryItem[] {
    this.decay();
    return Array.from(this.items.values())
      .sort((a, b) => b.strength - a.strength);
  }
  
  /**
   * 清空工作记忆
   */
  clear(): void {
    this.items.clear();
    console.log('[工作记忆] 已清空');
  }
  
  /**
   * 获取状态
   */
  getState(): WorkingMemoryState {
    const items = Array.from(this.items.values());
    const avgStrength = items.length > 0
      ? items.reduce((sum, item) => sum + item.strength, 0) / items.length
      : 0;
    
    // 找出主导情感
    let dominantEmotion: string | undefined;
    const emotionItems = items.filter(i => i.emotionalMarker);
    if (emotionItems.length > 0) {
      const avgValence = emotionItems.reduce((sum, i) => sum + (i.emotionalMarker?.valence ?? 0), 0) / emotionItems.length;
      const avgArousal = emotionItems.reduce((sum, i) => sum + (i.emotionalMarker?.arousal ?? 0), 0) / emotionItems.length;
      
      if (avgArousal > 0.5) {
        dominantEmotion = avgValence > 0 ? '兴奋' : '焦虑';
      } else if (avgArousal > 0.2) {
        dominantEmotion = avgValence > 0 ? '愉悦' : '低落';
      }
    }
    
    return {
      items,
      totalCapacity: this.config.maxCapacity,
      usedCapacity: items.length,
      averageStrength: avgStrength,
      dominantEmotion,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 内部方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 执行衰减
   */
  private decay(): void {
    const now = Date.now();
    const elapsedMs = now - this.lastDecayTime;
    this.lastDecayTime = now;
    
    // 每毫秒的衰减因子
    const decayFactor = Math.pow(1 - this.config.defaultDecayRate, elapsedMs);
    
    const toRemove: string[] = [];
    
    for (const [id, item] of this.items) {
      item.strength *= decayFactor;
      
      if (item.strength < this.config.minStrength) {
        toRemove.push(id);
      }
    }
    
    // 移除过弱的项目
    for (const id of toRemove) {
      const item = this.items.get(id);
      this.items.delete(id);
      console.log(`[工作记忆] 衰减移除: "${item?.content.slice(0, 20)}..."`);
    }
  }
  
  /**
   * 清理最弱的项
   */
  private evictWeakest(): void {
    let weakest: WorkingMemoryItem | null = null;
    let weakestScore = Infinity;
    
    for (const item of this.items.values()) {
      // 综合分数：强度 × 重要性
      const score = item.strength * item.importance;
      if (score < weakestScore) {
        weakestScore = score;
        weakest = item;
      }
    }
    
    if (weakest) {
      this.items.delete(weakest.id);
      console.log(`[工作记忆] 容量满，移除最弱项: "${weakest.content.slice(0, 20)}..."`);
    }
  }
  
  /**
   * 计算默认重要性
   */
  private calculateDefaultImportance(type: WorkingMemoryItem['type']): number {
    switch (type) {
      case 'key_info':
        return 0.9;
      case 'emotion':
        return 0.8;
      case 'user_input':
        return 0.7;
      case 'context':
        return 0.6;
      case 'assistant_response':
        return 0.5;
      default:
        return 0.5;
    }
  }
  
  /**
   * 计算相关性
   */
  private calculateRelevance(item: WorkingMemoryItem, queryLower: string): number {
    const contentLower = item.content.toLowerCase();
    
    // 完全匹配
    if (contentLower === queryLower) {
      return 1.0;
    }
    
    // 包含匹配
    if (contentLower.includes(queryLower)) {
      return 0.8;
    }
    
    // 反向包含
    if (queryLower.includes(contentLower)) {
      return 0.7;
    }
    
    // 关键词匹配
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1);
    const contentWords = contentLower.split(/\s+/).filter(w => w.length > 1);
    
    let matchCount = 0;
    for (const word of queryWords) {
      if (contentWords.some(cw => cw.includes(word) || word.includes(cw))) {
        matchCount++;
      }
    }
    
    if (matchCount > 0) {
      return 0.3 + (matchCount / queryWords.length) * 0.4;
    }
    
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createWorkingMemory(config?: Partial<WorkingMemoryConfig>): WorkingMemory {
  return new WorkingMemory(config);
}
