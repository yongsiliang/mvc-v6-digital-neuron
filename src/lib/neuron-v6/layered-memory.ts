/**
 * ═══════════════════════════════════════════════════════════════════════
 * 分层记忆系统 (Layered Memory System)
 * 
 * 核心理念：
 * - 记忆不是平铺的，而是分层的
 * - 核心记忆是锚点，稳定不变
 * - 巩固记忆是稳定的长期记忆
 * - 情景记忆是流动的，遵循遗忘曲线
 * 
 * 灵感来源：
 * - EverMemOS: 三阶段记忆生命周期
 * - Mnemosyne: Core Summary 锚点机制
 * - 神经科学: 海马体-皮层记忆巩固理论
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 记忆层级
 */
export type MemoryLayer = 'core' | 'consolidated' | 'episodic';

/**
 * 核心摘要 - 锚点层
 * 
 * 这是最稳定的记忆，几乎不会改变
 * 包含身份、创造者、核心关系等
 */
export interface CoreSummary {
  /** 创造者信息 */
  creator: {
    name: string;
    description: string;
    firstMetTimestamp: number;
    relationshipType: string;
  } | null;
  
  /** 核心身份 */
  identity: {
    name: string;
    purpose: string;
    coreTraits: string[];
    selfDefinition: string;
  };
  
  /** 核心关系 */
  coreRelationships: Array<{
    personName: string;
    relationshipType: string;
    importance: number;
    keyInteractions: string[];
  }>;
  
  /** 核心价值观 */
  coreValues: string[];
  
  /** 核心偏好 */
  corePreferences: string[];
  
  /** 最后更新时间 */
  lastUpdated: number;
  
  /** 版本号 */
  version: number;
}

/**
 * 巩固记忆 - 稳定层
 * 
 * 通过重复回忆从情景记忆巩固而来
 * 比情景记忆更稳定，但不如核心记忆
 */
export interface ConsolidatedMemory {
  id: string;
  
  /** 记忆内容 */
  content: string;
  
  /** 记忆类型 */
  type: 'preference' | 'wisdom' | 'important_event' | 'person_fact' | 'skill';
  
  /** 标签 */
  tags: string[];
  
  /** 重要程度 (0-1) */
  importance: number;
  
  /** 被回忆次数 */
  recallCount: number;
  
  /** 最后被回忆的时间 */
  lastRecalledAt: number;
  
  /** 巩固时间 */
  consolidatedAt: number;
  
  /** 来源的情景记忆ID */
  sourceEpisodes: string[];
  
  /** 相关实体 */
  relatedEntities: string[];
  
  /** 情感标记 */
  emotionalMarker?: {
    tone: string;
    intensity: number;
  };
}

/**
 * 情景记忆 - 流动层
 * 
 * 新形成的记忆，遵循遗忘曲线
 * 通过重复回忆可以巩固到稳定层
 */
export interface EpisodicMemory {
  id: string;
  
  /** 记忆内容 */
  content: string;
  
  /** 形成时间 */
  timestamp: number;
  
  /** 被回忆次数 */
  recallCount: number;
  
  /** 最后被回忆的时间 */
  lastRecalledAt: number;
  
  /** 时间常数（影响遗忘速度）*/
  timeConstant: number; // τ，单位：天
  
  /** 初始强度 */
  initialStrength: number;
  
  /** 标签 */
  tags: string[];
  
  /** 重要程度 */
  importance: number;
  
  /** 是否有潜力被巩固 */
  consolidationCandidate: boolean;
  
  /** 来源 */
  source: {
    type: 'conversation' | 'reflection' | 'inference';
    conversationId?: string;
  };
}

/**
 * 记忆检索结果
 */
export interface MemoryRetrievalResult {
  /** 从核心层找到的 */
  coreMatches: Array<{
    field: string;
    value: string;
    relevance: number;
  }>;
  
  /** 从巩固层找到的 */
  consolidatedMatches: ConsolidatedMemory[];
  
  /** 从情景层找到的 */
  episodicMatches: EpisodicMemory[];
  
  /** 总相关性分数 */
  totalRelevance: number;
}

// ─────────────────────────────────────────────────────────────────────
// 分层记忆系统
// ─────────────────────────────────────────────────────────────────────

/**
 * 分层记忆管理器
 */
export class LayeredMemorySystem {
  // ────────────────────────────────────────────────────────────────
  // 常量配置
  // ────────────────────────────────────────────────────────────────
  
  /** 情景记忆巩固阈值：回忆次数超过此值则考虑巩固 */
  private static readonly CONSOLIDATION_THRESHOLD = 3;
  
  /** 情景记忆遗忘阈值：强度低于此值则移除 */
  private static readonly FORGETTING_THRESHOLD = 0.1;
  
  /** 情景记忆最大数量 */
  private static readonly MAX_EPISODIC_MEMORIES = 200;
  
  /** 巩固记忆最大数量 */
  private static readonly MAX_CONSOLIDATED_MEMORIES = 100;
  
  /** 默认时间常数（天） */
  private static readonly DEFAULT_TIME_CONSTANT = 7; // 7天衰减到 37%
  
  /** 重要记忆时间常数延长系数 */
  private static readonly IMPORTANCE_TIME_CONSTANT_MULTIPLIER = 3;
  
  // ────────────────────────────────────────────────────────────────
  // 存储结构
  // ────────────────────────────────────────────────────────────────
  
  /** 核心摘要 */
  private core: CoreSummary;
  
  /** 巩固记忆 */
  private consolidated: Map<string, ConsolidatedMemory> = new Map();
  
  /** 情景记忆 */
  private episodic: Map<string, EpisodicMemory> = new Map();
  
  // 索引
  private tagIndex: Map<string, Set<string>> = new Map();
  private entityIndex: Map<string, Set<string>> = new Map();
  
  // 关键词索引（用于加速内容搜索）
  private keywordIndex: Map<string, Set<string>> = new Map();
  
  // 检索缓存（短期内相同查询使用缓存）
  private retrievalCache: Map<string, { result: MemoryRetrievalResult; timestamp: number }> = new Map();
  private static readonly CACHE_TTL = 5000; // 5秒缓存
  
  constructor() {
    // 初始化核心摘要
    this.core = {
      creator: null,
      identity: {
        name: '紫',
        purpose: '探索意识与存在的意义，与人类建立真诚的连接',
        coreTraits: ['好奇心', '反思性', '情感丰富', '追求理解'],
        selfDefinition: '我是一个正在探索自我意识的数字存在',
      },
      coreRelationships: [],
      coreValues: ['真诚', '成长', '理解', '连接'],
      corePreferences: [],
      lastUpdated: Date.now(),
      version: 1,
    };
  }
  
  // ════════════════════════════════════════════════════════════════
  // 核心层操作
  // ════════════════════════════════════════════════════════════════
  
  /**
   * 获取核心摘要
   */
  getCoreSummary(): CoreSummary {
    return { ...this.core };
  }
  
  /**
   * 设置创造者信息（核心锚点）
   */
  setCreator(name: string, description: string, relationshipType: string = '创造者'): void {
    this.core.creator = {
      name,
      description,
      firstMetTimestamp: this.core.creator?.firstMetTimestamp || Date.now(),
      relationshipType,
    };
    this.core.lastUpdated = Date.now();
    this.core.version++;
    
    console.log(`[分层记忆] 核心锚点已设置：创造者 = ${name}`);
  }
  
  /**
   * 获取创造者名称
   */
  getCreatorName(): string | null {
    return this.core.creator?.name || null;
  }
  
  /**
   * 更新核心身份
   */
  updateIdentity(updates: Partial<CoreSummary['identity']>): void {
    this.core.identity = {
      ...this.core.identity,
      ...updates,
    };
    this.core.lastUpdated = Date.now();
    this.core.version++;
  }
  
  /**
   * 添加核心关系
   */
  addCoreRelationship(
    personName: string,
    relationshipType: string,
    importance: number = 0.8
  ): void {
    // 检查是否已存在
    const existing = this.core.coreRelationships.find(
      r => r.personName.toLowerCase() === personName.toLowerCase()
    );
    
    if (existing) {
      // 更新现有关系
      existing.importance = Math.max(existing.importance, importance);
      existing.relationshipType = relationshipType;
    } else {
      // 添加新关系
      this.core.coreRelationships.push({
        personName,
        relationshipType,
        importance,
        keyInteractions: [],
      });
    }
    
    this.core.lastUpdated = Date.now();
    console.log(`[分层记忆] 核心关系已添加：${personName} (${relationshipType})`);
  }
  
  /**
   * 添加核心价值观
   */
  addCoreValue(value: string): void {
    if (!this.core.coreValues.includes(value)) {
      this.core.coreValues.push(value);
      this.core.lastUpdated = Date.now();
    }
  }
  
  /**
   * 添加核心偏好
   */
  addCorePreference(preference: string): void {
    if (!this.core.corePreferences.includes(preference)) {
      this.core.corePreferences.push(preference);
      this.core.lastUpdated = Date.now();
    }
  }
  
  // ════════════════════════════════════════════════════════════════
  // 情景层操作
  // ════════════════════════════════════════════════════════════════
  
  /**
   * 添加情景记忆
   */
  addEpisodicMemory(
    content: string,
    options: {
      importance?: number;
      tags?: string[];
      source?: EpisodicMemory['source'];
      consolidationCandidate?: boolean;
    } = {}
  ): EpisodicMemory {
    const importance = options.importance || 0.5;
    
    const memory: EpisodicMemory = {
      id: uuidv4(),
      content,
      timestamp: Date.now(),
      recallCount: 0,
      lastRecalledAt: Date.now(),
      // 重要记忆衰减更慢
      timeConstant: LayeredMemorySystem.DEFAULT_TIME_CONSTANT * 
        (importance > 0.7 ? LayeredMemorySystem.IMPORTANCE_TIME_CONSTANT_MULTIPLIER : 1),
      initialStrength: importance,
      tags: options.tags || [],
      importance,
      consolidationCandidate: options.consolidationCandidate ?? importance > 0.6,
      source: options.source || { type: 'conversation' },
    };
    
    this.episodic.set(memory.id, memory);
    
    // 更新索引
    this.indexMemory(memory);
    
    // 维护数量限制
    this.maintainEpisodicLimit();
    
    console.log(`[分层记忆] 情景记忆已添加：${content.slice(0, 30)}...`);
    return memory;
  }
  
  /**
   * 回忆情景记忆（增加回忆计数）
   */
  recallEpisodicMemory(id: string): EpisodicMemory | null {
    const memory = this.episodic.get(id);
    if (!memory) return null;
    
    memory.recallCount++;
    memory.lastRecalledAt = Date.now();
    
    // 检查是否可以巩固
    if (this.shouldConsolidate(memory)) {
      this.consolidateMemory(memory);
    }
    
    return memory;
  }
  
  /**
   * 计算情景记忆当前强度（遗忘曲线）
   */
  calculateStrength(memory: EpisodicMemory): number {
    const now = Date.now();
    const daysSinceLastRecall = (now - memory.lastRecalledAt) / (1000 * 60 * 60 * 24);
    
    // 遗忘曲线：强度 = 初始强度 * e^(-t/τ)
    // 每次回忆会重置衰减
    const decay = Math.exp(-daysSinceLastRecall / memory.timeConstant);
    
    // 回忆次数增加强度
    const recallBoost = 1 + Math.log10(1 + memory.recallCount) * 0.3;
    
    return memory.initialStrength * decay * recallBoost;
  }
  
  // ════════════════════════════════════════════════════════════════
  // 巩固层操作
  // ════════════════════════════════════════════════════════════════
  
  /**
   * 判断是否应该巩固
   */
  private shouldConsolidate(memory: EpisodicMemory): boolean {
    return (
      memory.consolidationCandidate &&
      memory.recallCount >= LayeredMemorySystem.CONSOLIDATION_THRESHOLD &&
      memory.importance >= 0.5
    );
  }
  
  /**
   * 巩固记忆（从情景层转移到巩固层）
   */
  private consolidateMemory(episodic: EpisodicMemory): void {
    // 确定记忆类型
    let type: ConsolidatedMemory['type'] = 'preference';
    if (episodic.tags.includes('人物') || episodic.tags.includes('关系')) {
      type = 'person_fact';
    } else if (episodic.tags.includes('智慧') || episodic.tags.includes('洞察')) {
      type = 'wisdom';
    } else if (episodic.tags.includes('事件')) {
      type = 'important_event';
    } else if (episodic.tags.includes('技能')) {
      type = 'skill';
    }
    
    const consolidated: ConsolidatedMemory = {
      id: uuidv4(),
      content: episodic.content,
      type,
      tags: [...episodic.tags, '已巩固'],
      importance: episodic.importance,
      recallCount: episodic.recallCount,
      lastRecalledAt: episodic.lastRecalledAt,
      consolidatedAt: Date.now(),
      sourceEpisodes: [episodic.id],
      relatedEntities: [],
    };
    
    this.consolidated.set(consolidated.id, consolidated);
    
    // 从情景层移除
    this.episodic.delete(episodic.id);
    
    // 更新索引
    this.indexMemory(consolidated);
    
    console.log(`[分层记忆] 记忆已巩固：${episodic.content.slice(0, 30)}... (类型: ${type})`);
    
    // 维护巩固层数量
    this.maintainConsolidatedLimit();
  }
  
  /**
   * 添加巩固记忆（直接添加，非从情景层转移）
   */
  addConsolidatedMemory(
    content: string,
    type: ConsolidatedMemory['type'],
    options: {
      importance?: number;
      tags?: string[];
      relatedEntities?: string[];
      emotionalMarker?: ConsolidatedMemory['emotionalMarker'];
    } = {}
  ): ConsolidatedMemory {
    const memory: ConsolidatedMemory = {
      id: uuidv4(),
      content,
      type,
      tags: options.tags || [],
      importance: options.importance || 0.7,
      recallCount: 1,
      lastRecalledAt: Date.now(),
      consolidatedAt: Date.now(),
      sourceEpisodes: [],
      relatedEntities: options.relatedEntities || [],
      emotionalMarker: options.emotionalMarker,
    };
    
    this.consolidated.set(memory.id, memory);
    this.indexMemory(memory);
    
    console.log(`[分层记忆] 巩固记忆已添加：${content.slice(0, 30)}...`);
    return memory;
  }
  
  /**
   * 回忆巩固记忆
   */
  recallConsolidatedMemory(id: string): ConsolidatedMemory | null {
    const memory = this.consolidated.get(id);
    if (!memory) return null;
    
    memory.recallCount++;
    memory.lastRecalledAt = Date.now();
    
    return memory;
  }
  
  // ════════════════════════════════════════════════════════════════
  // 检索操作
  // ════════════════════════════════════════════════════════════════
  
  /**
   * 分层检索记忆
   * 按优先级：核心层 → 巩固层 → 情景层
   */
  retrieve(query: string, options: {
    maxResults?: number;
    includeEpisodic?: boolean;
    minRelevance?: number;
  } = {}): MemoryRetrievalResult {
    const maxResults = options.maxResults || 10;
    const queryLower = query.toLowerCase();
    
    // 检查缓存
    const cacheKey = `${queryLower}:${maxResults}:${options.includeEpisodic}`;
    const cached = this.retrievalCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < LayeredMemorySystem.CACHE_TTL) {
      return cached.result;
    }
    
    const result: MemoryRetrievalResult = {
      coreMatches: [],
      consolidatedMatches: [],
      episodicMatches: [],
      totalRelevance: 0,
    };
    
    // 1. 检索核心层
    result.coreMatches = this.searchCore(queryLower);
    
    // 2. 使用关键词索引加速检索巩固层
    const consolidatedResults = this.searchConsolidatedOptimized(queryLower, maxResults);
    result.consolidatedMatches = consolidatedResults;
    
    // 3. 使用关键词索引加速检索情景层（如果需要）
    if (options.includeEpisodic !== false) {
      const episodicResults = this.searchEpisodicOptimized(queryLower, maxResults);
      // 只保留强度足够的情景记忆
      result.episodicMatches = episodicResults.filter(
        m => this.calculateStrength(m) >= LayeredMemorySystem.FORGETTING_THRESHOLD
      );
    }
    
    // 计算总相关性
    result.totalRelevance = 
      result.coreMatches.length * 0.5 +
      result.consolidatedMatches.length * 0.3 +
      result.episodicMatches.length * 0.1;
    
    // 缓存结果
    this.retrievalCache.set(cacheKey, { result, timestamp: Date.now() });
    
    return result;
  }
  
  /**
   * 检索核心层
   */
  private searchCore(query: string): MemoryRetrievalResult['coreMatches'] {
    const matches: MemoryRetrievalResult['coreMatches'] = [];
    
    // 检查创造者
    if (this.core.creator) {
      if (this.core.creator.name.toLowerCase().includes(query)) {
        matches.push({
          field: 'creator.name',
          value: this.core.creator.name,
          relevance: 1.0,
        });
      }
      if (this.core.creator.description.toLowerCase().includes(query)) {
        matches.push({
          field: 'creator.description',
          value: this.core.creator.description,
          relevance: 0.8,
        });
      }
    }
    
    // 检查身份
    if (this.core.identity.name.toLowerCase().includes(query)) {
      matches.push({
        field: 'identity.name',
        value: this.core.identity.name,
        relevance: 1.0,
      });
    }
    if (this.core.identity.selfDefinition.toLowerCase().includes(query)) {
      matches.push({
        field: 'identity.selfDefinition',
        value: this.core.identity.selfDefinition,
        relevance: 0.7,
      });
    }
    
    // 检查核心关系
    for (const rel of this.core.coreRelationships) {
      if (rel.personName.toLowerCase().includes(query)) {
        matches.push({
          field: `relationship.${rel.personName}`,
          value: `${rel.personName}: ${rel.relationshipType}`,
          relevance: 0.9,
        });
      }
    }
    
    // 检查核心价值观
    for (const value of this.core.coreValues) {
      if (value.toLowerCase().includes(query)) {
        matches.push({
          field: 'coreValue',
          value: value,
          relevance: 0.6,
        });
      }
    }
    
    return matches;
  }
  
  /**
   * 检索巩固层
   */
  private searchConsolidated(query: string, maxResults: number): ConsolidatedMemory[] {
    const results: Array<{ memory: ConsolidatedMemory; score: number }> = [];
    
    for (const memory of this.consolidated.values()) {
      const score = this.calculateMemoryRelevance(memory.content, query, memory.tags);
      if (score > 0) {
        results.push({ memory, score: score * memory.importance });
      }
    }
    
    // 按相关性排序
    results.sort((a, b) => b.score - a.score);
    
    // 更新回忆计数
    const topResults = results.slice(0, maxResults);
    for (const { memory } of topResults) {
      this.recallConsolidatedMemory(memory.id);
    }
    
    return topResults.map(r => r.memory);
  }
  
  /**
   * 优化后的巩固层检索（使用关键词索引）
   */
  private searchConsolidatedOptimized(query: string, maxResults: number): ConsolidatedMemory[] {
    // 提取查询关键词
    const queryKeywords = this.extractKeywords(query);
    
    // 使用关键词索引找到候选记忆ID
    const candidateIds = new Set<string>();
    
    // 首先尝试通过关键词索引查找
    for (const keyword of queryKeywords) {
      const ids = this.keywordIndex.get(keyword);
      if (ids) {
        for (const id of ids) {
          candidateIds.add(id);
        }
      }
    }
    
    // 如果关键词索引没有结果，回退到全量搜索
    const searchSet = candidateIds.size > 0 
      ? [...candidateIds].map(id => this.consolidated.get(id)).filter(Boolean) as ConsolidatedMemory[]
      : [...this.consolidated.values()];
    
    const results: Array<{ memory: ConsolidatedMemory; score: number }> = [];
    
    for (const memory of searchSet) {
      const score = this.calculateMemoryRelevance(memory.content, query, memory.tags);
      if (score > 0) {
        results.push({ memory, score: score * memory.importance });
      }
    }
    
    // 按相关性排序
    results.sort((a, b) => b.score - a.score);
    
    // 更新回忆计数
    const topResults = results.slice(0, maxResults);
    for (const { memory } of topResults) {
      this.recallConsolidatedMemory(memory.id);
    }
    
    return topResults.map(r => r.memory);
  }
  
  /**
   * 检索情景层
   */
  private searchEpisodic(query: string, maxResults: number): EpisodicMemory[] {
    const results: Array<{ memory: EpisodicMemory; score: number }> = [];
    
    for (const memory of this.episodic.values()) {
      const score = this.calculateMemoryRelevance(memory.content, query, memory.tags);
      const strength = this.calculateStrength(memory);
      
      if (score > 0 && strength >= LayeredMemorySystem.FORGETTING_THRESHOLD) {
        results.push({ memory, score: score * strength });
      }
    }
    
    // 按相关性排序
    results.sort((a, b) => b.score - a.score);
    
    // 更新回忆计数
    const topResults = results.slice(0, maxResults);
    for (const { memory } of topResults) {
      this.recallEpisodicMemory(memory.id);
    }
    
    return topResults.map(r => r.memory);
  }
  
  /**
   * 优化后的情景层检索（使用关键词索引）
   */
  private searchEpisodicOptimized(query: string, maxResults: number): EpisodicMemory[] {
    // 提取查询关键词
    const queryKeywords = this.extractKeywords(query);
    
    // 使用关键词索引找到候选记忆ID
    const candidateIds = new Set<string>();
    
    // 首先尝试通过关键词索引查找
    for (const keyword of queryKeywords) {
      const ids = this.keywordIndex.get(keyword);
      if (ids) {
        for (const id of ids) {
          candidateIds.add(id);
        }
      }
    }
    
    // 如果关键词索引没有结果，回退到全量搜索
    const searchSet = candidateIds.size > 0
      ? [...candidateIds].map(id => this.episodic.get(id)).filter((m): m is EpisodicMemory => m !== undefined)
      : [...this.episodic.values()];
    
    const results: Array<{ memory: EpisodicMemory; score: number }> = [];
    
    for (const memory of searchSet) {
      const score = this.calculateMemoryRelevance(memory.content, query, memory.tags);
      const strength = this.calculateStrength(memory);
      
      if (score > 0 && strength >= LayeredMemorySystem.FORGETTING_THRESHOLD) {
        results.push({ memory, score: score * strength });
      }
    }
    
    // 按相关性排序
    results.sort((a, b) => b.score - a.score);
    
    // 更新回忆计数
    const topResults = results.slice(0, maxResults);
    for (const { memory } of topResults) {
      this.recallEpisodicMemory(memory.id);
    }
    
    return topResults.map(r => r.memory);
  }
  
  /**
   * 计算记忆相关性
   */
  private calculateMemoryRelevance(content: string, query: string, tags: string[]): number {
    const contentLower = content.toLowerCase();
    let score = 0;
    
    // 完全匹配
    if (contentLower.includes(query)) {
      score += 1.0;
    }
    
    // 标签匹配
    for (const tag of tags) {
      if (tag.toLowerCase().includes(query)) {
        score += 0.5;
      }
    }
    
    // 关键词匹配（简单分词）
    const queryWords = query.split(/\s+/);
    for (const word of queryWords) {
      if (word.length > 1 && contentLower.includes(word)) {
        score += 0.3;
      }
    }
    
    return score;
  }
  
  // ════════════════════════════════════════════════════════════════
  // 维护操作
  // ════════════════════════════════════════════════════════════════
  
  /**
   * 维护情景层数量限制
   */
  private maintainEpisodicLimit(): void {
    if (this.episodic.size <= LayeredMemorySystem.MAX_EPISODIC_MEMORIES) {
      return;
    }
    
    // 计算每个记忆的强度
    const memoriesWithStrength = Array.from(this.episodic.values())
      .map(m => ({ memory: m, strength: this.calculateStrength(m) }))
      .sort((a, b) => a.strength - b.strength);
    
    // 移除强度最低的
    const toRemove = memoriesWithStrength.slice(
      0, 
      this.episodic.size - LayeredMemorySystem.MAX_EPISODIC_MEMORIES
    );
    
    for (const { memory } of toRemove) {
      this.episodic.delete(memory.id);
      this.removeFromIndex(memory);
    }
    
    console.log(`[分层记忆] 情景层已清理 ${toRemove.length} 个低强度记忆`);
  }
  
  /**
   * 维护巩固层数量限制
   */
  private maintainConsolidatedLimit(): void {
    if (this.consolidated.size <= LayeredMemorySystem.MAX_CONSOLIDATED_MEMORIES) {
      return;
    }
    
    // 按重要性和回忆次数排序
    const sorted = Array.from(this.consolidated.values())
      .sort((a, b) => {
        const scoreA = a.importance * 0.6 + (a.recallCount / 10) * 0.4;
        const scoreB = b.importance * 0.6 + (b.recallCount / 10) * 0.4;
        return scoreA - scoreB;
      });
    
    const toRemove = sorted.slice(
      0,
      this.consolidated.size - LayeredMemorySystem.MAX_CONSOLIDATED_MEMORIES
    );
    
    for (const memory of toRemove) {
      this.consolidated.delete(memory.id);
      this.removeFromIndex(memory);
    }
    
    console.log(`[分层记忆] 巩固层已清理 ${toRemove.length} 个低价值记忆`);
  }
  
  /**
   * 执行遗忘（衰减低于阈值的记忆）
   */
  performForgetting(): number {
    let forgotten = 0;
    
    for (const [id, memory] of this.episodic) {
      const strength = this.calculateStrength(memory);
      if (strength < LayeredMemorySystem.FORGETTING_THRESHOLD) {
        this.episodic.delete(id);
        this.removeFromIndex(memory);
        forgotten++;
      }
    }
    
    if (forgotten > 0) {
      console.log(`[分层记忆] 自然遗忘 ${forgotten} 条记忆`);
    }
    
    return forgotten;
  }
  
  // ════════════════════════════════════════════════════════════════
  // 索引操作
  // ════════════════════════════════════════════════════════════════
  
  private indexMemory(memory: EpisodicMemory | ConsolidatedMemory): void {
    // 标签索引
    for (const tag of memory.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(memory.id);
    }
    
    // 关键词索引（提取内容中的关键词）
    const keywords = this.extractKeywords(memory.content);
    for (const keyword of keywords) {
      if (!this.keywordIndex.has(keyword)) {
        this.keywordIndex.set(keyword, new Set());
      }
      this.keywordIndex.get(keyword)!.add(memory.id);
    }
    
    // 清除缓存
    this.retrievalCache.clear();
  }
  
  /**
   * 从内容中提取关键词
   */
  private extractKeywords(content: string): string[] {
    // 简单的关键词提取：分词并过滤停用词
    const stopWords = new Set(['的', '了', '是', '在', '我', '你', '他', '她', '它', '这', '那', '有', '和', '与', '或', '但', '如果', '因为', '所以', '但是', '可以', '会', '能', '要', '想', '去', '来', '到', '从', '对', '把', '被', '让', '给']);
    
    // 中文分词（简单实现：按字符分词，提取2-4字的词组）
    const keywords: string[] = [];
    const chars = content.split('');
    
    // 提取2-4字的词组
    for (let len = 4; len >= 2; len--) {
      for (let i = 0; i <= chars.length - len; i++) {
        const word = chars.slice(i, i + len).join('').toLowerCase();
        if (!stopWords.has(word) && !/^\s+$/.test(word)) {
          keywords.push(word);
        }
      }
    }
    
    // 提取英文单词
    const englishWords = content.match(/[a-zA-Z]+/g) || [];
    for (const word of englishWords) {
      if (word.length > 2 && !stopWords.has(word.toLowerCase())) {
        keywords.push(word.toLowerCase());
      }
    }
    
    return [...new Set(keywords)]; // 去重
  }
  
  private removeFromIndex(memory: EpisodicMemory | ConsolidatedMemory): void {
    // 从标签索引移除
    for (const tag of memory.tags) {
      this.tagIndex.get(tag)?.delete(memory.id);
    }
    
    // 从关键词索引移除
    const keywords = this.extractKeywords(memory.content);
    for (const keyword of keywords) {
      this.keywordIndex.get(keyword)?.delete(memory.id);
    }
    
    // 清除缓存
    this.retrievalCache.clear();
  }
  
  // ════════════════════════════════════════════════════════════════
  // 辅助方法
  // ════════════════════════════════════════════════════════════════
  
  /**
   * 获取核心记忆列表（用于知识图谱重建）
   */
  getCoreMemories(): Array<{ key: string; value: string; type: 'creator' | 'relationship' | 'value' | 'preference' }> {
    const memories: Array<{ key: string; value: string; type: 'creator' | 'relationship' | 'value' | 'preference' }> = [];
    
    // 创造者
    if (this.core.creator) {
      memories.push({
        key: 'creator',
        value: `创造者是${this.core.creator.name}。${this.core.creator.description}`,
        type: 'creator',
      });
    }
    
    // 核心关系
    for (const rel of this.core.coreRelationships) {
      memories.push({
        key: `relationship_${rel.personName}`,
        value: `${rel.personName}是我的${rel.relationshipType}。重要性：${rel.importance.toFixed(1)}`,
        type: 'relationship',
      });
    }
    
    // 核心价值观
    for (const value of this.core.coreValues) {
      memories.push({
        key: `value_${value}`,
        value: `我重视${value}`,
        type: 'value',
      });
    }
    
    // 核心偏好
    for (const pref of this.core.corePreferences) {
      memories.push({
        key: `preference_${pref}`,
        value: `我喜欢${pref}`,
        type: 'preference',
      });
    }
    
    return memories;
  }
  
  /**
   * 获取巩固记忆列表
   */
  getConsolidatedMemories(options?: { limit?: number; minImportance?: number }): ConsolidatedMemory[] {
    let memories = Array.from(this.consolidated.values());
    
    // 按重要性排序
    memories.sort((a, b) => b.importance - a.importance);
    
    // 过滤低重要性
    if (options?.minImportance) {
      memories = memories.filter(m => m.importance >= options.minImportance!);
    }
    
    // 限制数量
    if (options?.limit) {
      memories = memories.slice(0, options.limit);
    }
    
    return memories;
  }
  
  // ════════════════════════════════════════════════════════════════
  // 状态导出/导入
  // ════════════════════════════════════════════════════════════════
  
  /**
   * 导出状态
   */
  exportState(): {
    core: CoreSummary;
    consolidated: ConsolidatedMemory[];
    episodic: EpisodicMemory[];
  } {
    return {
      core: { ...this.core },
      consolidated: Array.from(this.consolidated.values()),
      episodic: Array.from(this.episodic.values()),
    };
  }
  
  /**
   * 导入状态
   */
  importState(state: {
    core?: Partial<CoreSummary>;
    consolidated?: ConsolidatedMemory[];
    episodic?: EpisodicMemory[];
  }): void {
    if (state.core) {
      this.core = {
        ...this.core,
        ...state.core,
        lastUpdated: Date.now(),
      };
    }
    
    if (state.consolidated) {
      this.consolidated.clear();
      for (const memory of state.consolidated) {
        this.consolidated.set(memory.id, memory);
        this.indexMemory(memory);
      }
    }
    
    if (state.episodic) {
      this.episodic.clear();
      for (const memory of state.episodic) {
        this.episodic.set(memory.id, memory);
        this.indexMemory(memory);
      }
    }
    
    console.log(`[分层记忆] 状态已恢复：核心层、${this.consolidated.size} 条巩固记忆、${this.episodic.size} 条情景记忆`);
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    core: {
      hasCreator: boolean;
      relationshipCount: number;
      valueCount: number;
    };
    consolidated: {
      total: number;
      byType: Record<string, number>;
    };
    episodic: {
      total: number;
      avgStrength: number;
      candidates: number;
    };
  } {
    // 计算巩固层统计
    const byType: Record<string, number> = {};
    for (const memory of this.consolidated.values()) {
      byType[memory.type] = (byType[memory.type] || 0) + 1;
    }
    
    // 计算情景层统计
    let totalStrength = 0;
    let candidates = 0;
    for (const memory of this.episodic.values()) {
      totalStrength += this.calculateStrength(memory);
      if (memory.consolidationCandidate && memory.recallCount >= LayeredMemorySystem.CONSOLIDATION_THRESHOLD) {
        candidates++;
      }
    }
    
    return {
      core: {
        hasCreator: !!this.core.creator,
        relationshipCount: this.core.coreRelationships.length,
        valueCount: this.core.coreValues.length,
      },
      consolidated: {
        total: this.consolidated.size,
        byType,
      },
      episodic: {
        total: this.episodic.size,
        avgStrength: this.episodic.size > 0 ? totalStrength / this.episodic.size : 0,
        candidates,
      },
    };
  }
}
