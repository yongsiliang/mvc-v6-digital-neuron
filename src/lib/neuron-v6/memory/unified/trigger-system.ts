/**
 * ═══════════════════════════════════════════════════════════════════════
 * 触发器系统 - TriggerSystem
 * 
 * 核心创新：让记忆能主动被"忆"起
 * 
 * 触发器类型：
 * - keyword: 关键词触发（精确匹配）
 * - concept: 概念触发（抽象匹配）
 * - emotion: 情感触发（情境匹配）
 * - time: 时间触发（周期匹配）
 * - context: 上下文触发（相似记忆激活时）
 * 
 * 设计理念：
 * 每条记忆绑定多个触发器，当触发条件满足时，记忆被激活。
 * 这实现了"主动忆"，不需要等用户问。
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  MemoryNode,
  Trigger,
  TriggerType,
  EmotionalMarker,
} from './types';
import { DEFAULT_TRIGGER_OPTIONS } from './types';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 触发器匹配结果 */
export interface TriggerMatch {
  /** 匹配的记忆ID */
  id: string;
  
  /** 触发器类型 */
  type: TriggerType;
  
  /** 匹配分数 */
  score: number;
}

/** 触发器检测选项 */
export interface TriggerDetectionOptions {
  /** 是否检测关键词 */
  detectKeywords?: boolean;
  
  /** 是否检测概念 */
  detectConcepts?: boolean;
  
  /** 是否检测情感 */
  detectEmotions?: boolean;
  
  /** 是否检测上下文 */
  detectContext?: boolean;
}

// ─────────────────────────────────────────────────────────────────────
// 触发器系统类
// ─────────────────────────────────────────────────────────────────────

export class TriggerSystem {
  private options: typeof DEFAULT_TRIGGER_OPTIONS;
  
  // 触发器索引：快速查找
  private keywordIndex: Map<string, Set<string>> = new Map();      // keyword -> memoryIds
  private conceptIndex: Map<string, Set<string>> = new Map();      // concept -> memoryIds
  private emotionIndex: Map<string, Set<string>> = new Map();      // emotion -> memoryIds
  private contextIndex: Map<string, Set<string>> = new Map();      // memoryId -> triggeredMemoryIds
  
  // 所有触发器存储
  private triggers: Map<string, Trigger> = new Map();
  
  constructor(options: Partial<typeof DEFAULT_TRIGGER_OPTIONS> = {}) {
    this.options = { ...DEFAULT_TRIGGER_OPTIONS, ...options };
  }

  // ───────────────────────────────────────────────────────────────────
  // 触发器生成
  // ───────────────────────────────────────────────────────────────────

  /**
   * 为记忆生成触发器
   */
  generateTriggers(node: MemoryNode): Trigger[] {
    const triggers: Trigger[] = [];
    
    // 1. 关键词触发器
    if (this.options.enableKeywordTriggers) {
      const keywords = this.extractKeywords(node.content);
      for (const keyword of keywords.slice(0, this.options.maxTriggersPerMemory)) {
        const trigger = this.createTrigger(node.id, 'keyword', keyword.toLowerCase(), 0.8);
        triggers.push(trigger);
        
        // 更新索引
        this.addToIndex(this.keywordIndex, keyword.toLowerCase(), node.id);
        this.triggers.set(trigger.id, trigger);
      }
    }
    
    // 2. 概念触发器
    if (this.options.enableConceptTriggers) {
      const concepts = this.extractConcepts(node.content);
      for (const concept of concepts.slice(0, 3)) {
        const trigger = this.createTrigger(node.id, 'concept', concept, 0.7);
        triggers.push(trigger);
        
        // 更新索引
        this.addToIndex(this.conceptIndex, concept, node.id);
        this.triggers.set(trigger.id, trigger);
      }
    }
    
    // 3. 情感触发器
    if (this.options.enableEmotionTriggers && node.emotionalMarker) {
      const emotionTrigger = this.generateEmotionTrigger(node);
      if (emotionTrigger) {
        triggers.push(emotionTrigger);
        
        // 更新索引
        const emotionLabel = this.getEmotionLabel(node.emotionalMarker);
        this.addToIndex(this.emotionIndex, emotionLabel, node.id);
        this.triggers.set(emotionTrigger.id, emotionTrigger);
      }
    }
    
    return triggers;
  }

  /**
   * 添加触发器
   */
  addTrigger(trigger: Trigger): void {
    this.triggers.set(trigger.id, trigger);
    
    // 更新对应索引
    const pattern = typeof trigger.pattern === 'string' ? trigger.pattern : String(trigger.pattern);
    
    switch (trigger.type) {
      case 'keyword':
        this.addToIndex(this.keywordIndex, pattern.toLowerCase(), trigger.memoryId);
        break;
      case 'concept':
        this.addToIndex(this.conceptIndex, pattern, trigger.memoryId);
        break;
      case 'emotion':
        this.addToIndex(this.emotionIndex, pattern, trigger.memoryId);
        break;
      case 'context':
        this.addToIndex(this.contextIndex, pattern, trigger.memoryId);
        break;
    }
  }

  /**
   * 创建单个触发器
   */
  private createTrigger(
    memoryId: string,
    type: TriggerType,
    pattern: string,
    strength: number
  ): Trigger {
    return {
      id: `trigger-${uuidv4().slice(0, 8)}`,
      memoryId,
      type,
      pattern,
      strength,
      triggerCount: 0,
      enabled: true,
    };
  }

  /**
   * 生成情感触发器
   */
  private generateEmotionTrigger(node: MemoryNode): Trigger | null {
    const marker = node.emotionalMarker;
    
    // 只有情感显著的记忆才创建情感触发器
    if (marker.arousal < 0.3) {
      return null;
    }
    
    const emotionLabel = this.getEmotionLabel(marker);
    const strength = marker.arousal * (1 + node.emotionalBoost * 0.5);
    
    return this.createTrigger(node.id, 'emotion', emotionLabel, Math.min(1, strength));
  }

  // ───────────────────────────────────────────────────────────────────
  // 触发器检测
  // ───────────────────────────────────────────────────────────────────

  /**
   * 检测触发器匹配
   * 支持中文 N-gram 匹配和英文单词匹配
   */
  detectTriggers(input: string): { hasTriggers: boolean; matchedNodes: TriggerMatch[] } {
    const matches: TriggerMatch[] = [];
    const inputLower = input.toLowerCase();
    
    // 1. 英文关键词检测
    const englishWords = inputLower.split(/[\s\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]+/).filter(w => w.length >= this.options.minKeywordLength);
    for (const word of englishWords) {
      const memoryIds = this.keywordIndex.get(word);
      if (memoryIds) {
        for (const memoryId of memoryIds) {
          matches.push({
            id: memoryId,
            type: 'keyword',
            score: 0.8,
          });
        }
      }
    }
    
    // 2. 中文 N-gram 检测
    const chineseText = input.replace(/[a-zA-Z0-9\s\u3000-\u303f\uff00-\uffef\p{P}]+/gu, '');
    
    // 双字组匹配
    for (let i = 0; i < chineseText.length - 1; i++) {
      const bigram = chineseText.substring(i, i + 2);
      const memoryIds = this.keywordIndex.get(bigram);
      if (memoryIds) {
        for (const memoryId of memoryIds) {
          matches.push({
            id: memoryId,
            type: 'keyword',
            score: 0.85, // N-gram 匹配权重稍高
          });
        }
      }
    }
    
    // 三字组匹配
    for (let i = 0; i < chineseText.length - 2; i++) {
      const trigram = chineseText.substring(i, i + 3);
      const memoryIds = this.keywordIndex.get(trigram);
      if (memoryIds) {
        for (const memoryId of memoryIds) {
          matches.push({
            id: memoryId,
            type: 'keyword',
            score: 0.9, // 三字组匹配权重最高
          });
        }
      }
    }
    
    // 3. 概念匹配（检查概念索引）
    const concepts = this.extractConcepts(input);
    for (const concept of concepts) {
      const memoryIds = this.conceptIndex.get(concept);
      if (memoryIds) {
        for (const memoryId of memoryIds) {
          matches.push({
            id: memoryId,
            type: 'concept',
            score: 0.75,
          });
        }
      }
    }
    
    return {
      hasTriggers: matches.length > 0,
      matchedNodes: this.deduplicateMatches(matches),
    };
  }

  /**
   * 去重匹配结果
   */
  private deduplicateMatches(matches: TriggerMatch[]): TriggerMatch[] {
    const seen = new Map<string, TriggerMatch>();
    
    for (const match of matches) {
      const existing = seen.get(match.id);
      if (!existing || match.score > existing.score) {
        seen.set(match.id, match);
      }
    }
    
    return Array.from(seen.values());
  }

  // ───────────────────────────────────────────────────────────────────
  // 辅助方法
  // ───────────────────────────────────────────────────────────────────

  /**
   * 添加到索引
   */
  private addToIndex(index: Map<string, Set<string>>, key: string, memoryId: string): void {
    if (!index.has(key)) {
      index.set(key, new Set());
    }
    index.get(key)!.add(memoryId);
  }

  /**
   * 提取关键词
   * 支持中文 N-gram 分词和英文分词
   */
  private extractKeywords(content: string): string[] {
    const keywords: string[] = [];
    
    // 1. 提取英文单词
    const englishWords = content
      .toLowerCase()
      .split(/[\s\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]+/)
      .filter(w => w.length >= this.options.minKeywordLength)
      .filter(w => !this.isStopWord(w));
    keywords.push(...englishWords);
    
    // 2. 提取中文词汇（使用 N-gram）
    const chineseText = content.replace(/[a-zA-Z0-9\s\u3000-\u303f\uff00-\uffef\p{P}]+/gu, '');
    
    // 双字组 (Bigram)
    for (let i = 0; i < chineseText.length - 1; i++) {
      const bigram = chineseText.substring(i, i + 2);
      if (!this.isStopWord(bigram)) {
        keywords.push(bigram);
      }
    }
    
    // 三字组 (Trigram) - 仅保留有意义的长词
    for (let i = 0; i < chineseText.length - 2; i++) {
      const trigram = chineseText.substring(i, i + 3);
      // 三字组权重更高，用于匹配专业术语等
      if (!this.isStopWord(trigram)) {
        keywords.push(trigram);
      }
    }
    
    // 3. 提取混合词汇（中文+英文/数字）
    const mixedMatches = content.match(/[a-zA-Z]+\d*[\u4e00-\u9fa5]+|[\u4e00-\u9fa5]+[a-zA-Z]+\d*/g);
    if (mixedMatches) {
      keywords.push(...mixedMatches.map(m => m.toLowerCase()));
    }
    
    // 去重并限制数量
    return [...new Set(keywords)].slice(0, this.options.maxTriggersPerMemory * 2);
  }

  /**
   * 提取概念
   * 支持中文短语和实体识别
   */
  private extractConcepts(content: string): string[] {
    const concepts: string[] = [];
    
    // 1. 提取可能的名词短语（连续的非停用词）
    const segments = content.split(/[\s\p{P}]+/u).filter(w => w.length >= 2);
    
    // 2. 中文短语提取（2-4字的有意义组合）
    const chineseOnly = content.replace(/[a-zA-Z0-9\s\p{P}]+/gu, '');
    
    // 提取2-4字的中文片段
    for (const match of chineseOnly.matchAll(/[\u4e00-\u9fa5]{2,4}/g)) {
      const phrase = match[0];
      if (!this.isStopWord(phrase)) {
        concepts.push(phrase);
      }
    }
    
    // 3. 提取英文术语（大写开头或全大写的词）
    const englishTerms = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b|\b[A-Z]{2,}\b/g);
    if (englishTerms) {
      concepts.push(...englishTerms.map(t => t.toLowerCase()));
    }
    
    // 去重并限制数量
    return [...new Set(concepts)].slice(0, 5);
  }

  /**
   * 获取情感标签
   */
  private getEmotionLabel(marker: EmotionalMarker): string {
    const { valence, arousal } = marker;
    
    if (valence > 0.5 && arousal > 0.5) return 'excited';
    if (valence > 0.5 && arousal <= 0.5) return 'calm';
    if (valence <= 0.5 && arousal > 0.5) return 'anxious';
    return 'sad';
  }

  /**
   * 是否为停用词
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      // 中文停用词
      '的', '了', '是', '在', '我', '有', '和', '就', '不', '人',
      '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去',
      '你', '他', '她', '它', '们', '这', '那', '什么', '这个', '那个',
      '个', '里', '下', '着', '过', '会', '能', '对', '把', '被',
      '让', '给', '从', '向', '比', '又', '才', '只', '还', '但',
      '却', '而', '或', '且', '因为', '所以', '如果', '虽然', '但是',
      '这样', '那样', '怎么', '为什么', '哪里', '那里', '这里',
      // 英文停用词
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'shall',
      'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in',
      'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
      'through', 'during', 'before', 'after', 'above', 'below',
      'between', 'under', 'again', 'further', 'then', 'once',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
      'it', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose',
      // N-gram 常见无意义组合
      '的是', '了一', '了一', '是在', '有的', '和的', '的了',
    ]);
    
    return stopWords.has(word.toLowerCase());
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    keywordIndexSize: number;
    conceptIndexSize: number;
    emotionIndexSize: number;
    contextIndexSize: number;
    totalIndexedKeys: number;
  } {
    return {
      keywordIndexSize: this.keywordIndex.size,
      conceptIndexSize: this.conceptIndex.size,
      emotionIndexSize: this.emotionIndex.size,
      contextIndexSize: this.contextIndex.size,
      totalIndexedKeys: 
        this.keywordIndex.size + 
        this.conceptIndex.size + 
        this.emotionIndex.size + 
        this.contextIndex.size,
    };
  }

  /**
   * 清空所有索引
   */
  clear(): void {
    this.keywordIndex.clear();
    this.conceptIndex.clear();
    this.emotionIndex.clear();
    this.contextIndex.clear();
    this.triggers.clear();
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createTriggerSystem(
  options: Partial<typeof DEFAULT_TRIGGER_OPTIONS> = {}
): TriggerSystem {
  return new TriggerSystem(options);
}
