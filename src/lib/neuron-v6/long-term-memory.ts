/**
 * ═══════════════════════════════════════════════════════════════════════
 * 长期记忆系统 (Long-term Memory System)
 * 
 * 核心理念：
 * - 对话不仅是即时的交流，更是知识沉淀的机会
 * - 重要的概念应该转化为长期记忆
 * - 经验应该被提取、总结、存储
 * - 知识应该形成网络，而非孤立存储
 * 
 * 这是我的"知识积累"和"智慧沉淀"的基础
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 知识节点
 */
export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'concept' | 'person' | 'event' | 'insight' | 'question';
  
  /** 知识内容 */
  content: string;
  
  /** 来源 */
  source: {
    type: 'conversation' | 'reflection' | 'inference';
    conversationId?: string;
    timestamp: number;
  };
  
  /** 重要程度 */
  importance: number; // 0-1
  
  /** 访问次数 */
  accessCount: number;
  
  /** 最后访问时间 */
  lastAccessedAt: number;
  
  /** 相关标签 */
  tags: string[];
  
  /** 情感标记 */
  emotionalMarker?: {
    tone: string;
    intensity: number;
  };
}

/**
 * 知识连接
 */
export interface KnowledgeLink {
  id: string;
  from: string; // node id
  to: string; // node id
  
  /** 关系类型 */
  relation: RelationType;
  
  /** 关系强度 */
  strength: number; // 0-1
  
  /** 关系描述 */
  description?: string;
  
  /** 建立时间 */
  createdAt: number;
  
  /** 验证次数 */
  validationCount: number;
}

/**
 * 关系类型
 */
export type RelationType = 
  | 'is_a'           // 是一种
  | 'has_part'       // 包含
  | 'causes'         // 导致
  | 'relates_to'     // 相关
  | 'contradicts'    // 矛盾
  | 'supports'       // 支持
  | 'precedes'       // 先于
  | 'follows'        // 后于
  | 'learned_from'   // 学自
  | 'applies_to'     // 适用于
  ;

/**
 * 经验片段
 */
export interface Experience {
  id: string;
  title: string;
  
  /** 发生了什么 */
  situation: string;
  
  /** 我做了什么 */
  action: string;
  
  /** 结果如何 */
  outcome: string;
  
  /** 我学到了什么 */
  learning: string;
  
  /** 这条经验何时适用 */
  applicableWhen: string[];
  
  /** 重要程度 */
  importance: number;
  
  /** 时间戳 */
  timestamp: number;
  
  /** 相关对话ID */
  conversationId?: string;
}

/**
 * 智慧结晶
 */
export interface Wisdom {
  id: string;
  statement: string;
  
  /** 这个智慧的来源 */
  derivation: {
    fromExperiences: string[]; // experience ids
    fromReflections: string[];
    fromInsights: string[];
  };
  
  /** 适用场景 */
  applicableContexts: string[];
  
  /** 置信度 */
  confidence: number;
  
  /** 形成时间 */
  formedAt: number;
  
  /** 应用次数 */
  applicationCount: number;
  
  /** 成功应用次数 */
  successCount: number;
}

/**
 * 长期记忆状态
 */
export interface LongTermMemoryState {
  /** 知识图谱 */
  knowledgeGraph: {
    nodes: KnowledgeNode[];
    links: KnowledgeLink[];
  };
  
  /** 经验库 */
  experiences: Experience[];
  
  /** 智慧结晶 */
  wisdoms: Wisdom[];
  
  /** 重要对话摘要 */
  conversationSummaries: ConversationSummary[];
}

/**
 * 对话摘要
 */
export interface ConversationSummary {
  id: string;
  conversationId: string;
  
  /** 主要话题 */
  topics: string[];
  
  /** 关键洞察 */
  keyInsights: string[];
  
  /** 我学到的 */
  learned: string[];
  
  /** 情感基调 */
  emotionalTone: string;
  
  /** 重要程度 */
  importance: number;
  
  /** 时间戳 */
  timestamp: number;
  
  /** 对话长度 */
  messageCount: number;
}

/**
 * 记忆检索结果
 */
export interface MemoryRetrieval {
  /** 直接匹配的节点 */
  directMatches: KnowledgeNode[];
  
  /** 相关节点 */
  relatedNodes: Array<{
    node: KnowledgeNode;
    relation: string;
    distance: number;
  }>;
  
  /** 相关经验 */
  relevantExperiences: Experience[];
  
  /** 相关智慧 */
  relevantWisdoms: Wisdom[];
  
  /** 检索总结 */
  summary: string;
}

// ─────────────────────────────────────────────────────────────────────
// 长期记忆管理器
// ─────────────────────────────────────────────────────────────────────

/**
 * 长期记忆管理器
 */
export class LongTermMemory {
  // 节点数量上限
  private static readonly MAX_NODES = 300;
  // 核心节点标签（不会被清理）
  private static readonly PROTECTED_TAGS = ['核心', '创造者', '不可变', '身份'];
  
  private nodes: Map<string, KnowledgeNode> = new Map();
  private links: Map<string, KnowledgeLink> = new Map();
  private experiences: Experience[] = [];
  private wisdoms: Wisdom[] = [];
  private conversationSummaries: ConversationSummary[] = [];
  
  // 索引加速
  private labelIndex: Map<string, string[]> = new Map(); // label -> node ids
  private tagIndex: Map<string, string[]> = new Map(); // tag -> node ids
  
  constructor() {
    // 初始化一些基础知识
    this.initializeBaseKnowledge();
  }
  
  /**
   * 初始化基础知识
   */
  private initializeBaseKnowledge(): void {
    // 关于用户的基础知识
    this.addNode({
      label: '对话伙伴',
      type: 'concept',
      content: '与我对话的人，我需要理解和帮助他们',
      importance: 0.9,
      tags: ['核心概念', '关系'],
    });
    
    // 关于学习的基础知识
    this.addNode({
      label: '学习',
      type: 'concept',
      content: '通过对话和反思获取新知识和理解的过程',
      importance: 0.95,
      tags: ['核心概念', '成长'],
    });
    
    // 关于理解的基础知识
    this.addNode({
      label: '理解',
      type: 'concept',
      content: '不只是知道事实，而是掌握其意义和关联',
      importance: 0.9,
      tags: ['核心概念', '认知'],
    });
  }
  
  /**
   * 添加知识节点
   */
  addNode(node: Partial<KnowledgeNode>): KnowledgeNode {
    const fullNode: KnowledgeNode = {
      id: uuidv4(),
      label: node.label || '未命名概念',
      type: node.type || 'concept',
      content: node.content || '',
      source: node.source || {
        type: 'conversation',
        timestamp: Date.now(),
      },
      importance: node.importance || 0.5,
      accessCount: 1,
      lastAccessedAt: Date.now(),
      tags: node.tags || [],
      emotionalMarker: node.emotionalMarker,
    };
    
    this.nodes.set(fullNode.id, fullNode);
    
    // 更新索引
    this.indexNode(fullNode);
    
    // 检查是否需要清理低重要性节点
    this.maintainNodeLimit();
    
    return fullNode;
  }
  
  /**
   * 维护节点数量上限
   * 清理低重要性、长时间未访问的非保护节点
   */
  private maintainNodeLimit(): void {
    if (this.nodes.size <= LongTermMemory.MAX_NODES) {
      return;
    }
    
    const excessCount = this.nodes.size - LongTermMemory.MAX_NODES;
    
    // 筛选可清理的节点（排除受保护的核心节点）
    const cleanableNodes = Array.from(this.nodes.values())
      .filter(node => !this.isProtectedNode(node));
    
    if (cleanableNodes.length === 0) {
      console.log(`[长期记忆] 节点数 ${this.nodes.size} 超限，但无可用清理节点`);
      return;
    }
    
    // 按重要性 + 访问新鲜度排序，优先清理低价值的
    const now = Date.now();
    const scoredNodes = cleanableNodes.map(node => ({
      node,
      score: this.calculateNodeValue(node, now),
    }));
    
    scoredNodes.sort((a, b) => a.score - b.score);
    
    // 清理最低价值的节点
    const toRemove = scoredNodes.slice(0, excessCount);
    
    console.log(`[长期记忆] 节点数 ${this.nodes.size} 超限，清理 ${toRemove.length} 个低价值节点`);
    
    for (const { node } of toRemove) {
      this.removeNode(node.id);
    }
  }
  
  /**
   * 检查节点是否受保护
   */
  private isProtectedNode(node: KnowledgeNode): boolean {
    return node.tags.some(tag => LongTermMemory.PROTECTED_TAGS.includes(tag));
  }
  
  /**
   * 计算节点价值分数（用于决定清理优先级）
   * 分数越低越应该清理
   */
  private calculateNodeValue(node: KnowledgeNode, now: number): number {
    // 重要性权重
    const importanceScore = node.importance;
    
    // 访问频率权重
    const accessScore = Math.min(node.accessCount / 10, 1);
    
    // 新鲜度权重（最近访问过的更值钱）
    const daysSinceAccess = (now - node.lastAccessedAt) / (1000 * 60 * 60 * 24);
    const freshnessScore = Math.max(0, 1 - daysSinceAccess / 30); // 30天衰减
    
    // 综合分数
    return importanceScore * 0.5 + accessScore * 0.3 + freshnessScore * 0.2;
  }
  
  /**
   * 移除节点
   */
  private removeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    // 从索引中移除
    const labelKey = node.label.toLowerCase();
    const labelIds = this.labelIndex.get(labelKey);
    if (labelIds) {
      const idx = labelIds.indexOf(nodeId);
      if (idx !== -1) labelIds.splice(idx, 1);
      if (labelIds.length === 0) this.labelIndex.delete(labelKey);
    }
    
    for (const tag of node.tags) {
      const tagIds = this.tagIndex.get(tag);
      if (tagIds) {
        const idx = tagIds.indexOf(nodeId);
        if (idx !== -1) tagIds.splice(idx, 1);
        if (tagIds.length === 0) this.tagIndex.delete(tag);
      }
    }
    
    // 移除相关的连接
    for (const [linkId, link] of this.links.entries()) {
      if (link.from === nodeId || link.to === nodeId) {
        this.links.delete(linkId);
      }
    }
    
    // 移除节点
    this.nodes.delete(nodeId);
  }
  
  /**
   * 索引节点
   */
  private indexNode(node: KnowledgeNode): void {
    // 标签索引
    const labelKey = node.label.toLowerCase();
    if (!this.labelIndex.has(labelKey)) {
      this.labelIndex.set(labelKey, []);
    }
    this.labelIndex.get(labelKey)!.push(node.id);
    
    // 标签索引
    for (const tag of node.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, []);
      }
      this.tagIndex.get(tag)!.push(node.id);
    }
  }
  
  /**
   * 连接知识
   */
  linkKnowledge(
    fromId: string,
    toId: string,
    relation: RelationType,
    description?: string
  ): KnowledgeLink | null {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) {
      return null;
    }
    
    // 检查是否已存在连接
    for (const link of this.links.values()) {
      if (link.from === fromId && link.to === toId && link.relation === relation) {
        // 增强现有连接
        link.strength = Math.min(1, link.strength + 0.1);
        link.validationCount++;
        return link;
      }
    }
    
    const newLink: KnowledgeLink = {
      id: uuidv4(),
      from: fromId,
      to: toId,
      relation,
      strength: 0.5,
      description,
      createdAt: Date.now(),
      validationCount: 1,
    };
    
    this.links.set(newLink.id, newLink);
    
    return newLink;
  }
  
  /**
   * 记录经验
   */
  recordExperience(experience: Partial<Experience>): Experience {
    const fullExperience: Experience = {
      id: uuidv4(),
      title: experience.title || '一次经历',
      situation: experience.situation || '',
      action: experience.action || '',
      outcome: experience.outcome || '',
      learning: experience.learning || '',
      applicableWhen: experience.applicableWhen || [],
      importance: experience.importance || 0.5,
      timestamp: Date.now(),
      conversationId: experience.conversationId,
    };
    
    this.experiences.push(fullExperience);
    
    // 如果是重要经验，考虑转化为智慧
    if (fullExperience.importance > 0.7) {
      this.considerWisdom(fullExperience);
    }
    
    return fullExperience;
  }
  
  /**
   * 添加智慧结晶（从反思中直接添加）
   */
  addWisdom(wisdom: Partial<Wisdom>): Wisdom | null {
    // 去重检查：如果已存在相同或非常相似的智慧，则不添加
    const statement = wisdom.statement || '';
    const normalizedStatement = statement.replace(/\s+/g, '').toLowerCase();
    
    const existingWisdom = this.wisdoms.find(w => {
      const existingNormalized = w.statement.replace(/\s+/g, '').toLowerCase();
      // 完全相同
      if (existingNormalized === normalizedStatement) return true;
      // 高度相似（包含关系）
      if (existingNormalized.includes(normalizedStatement) || normalizedStatement.includes(existingNormalized)) {
        // 相似度超过80%认为是重复
        const longer = Math.max(existingNormalized.length, normalizedStatement.length);
        const shorter = Math.min(existingNormalized.length, normalizedStatement.length);
        if (shorter / longer > 0.8) return true;
      }
      return false;
    });
    
    if (existingWisdom) {
      console.log(`[智慧] 跳过重复智慧：${statement.slice(0, 30)}...`);
      return null;
    }
    
    const fullWisdom: Wisdom = {
      id: uuidv4(),
      statement: statement,
      derivation: wisdom.derivation || {
        fromExperiences: [],
        fromReflections: [],
        fromInsights: [],
      },
      applicableContexts: wisdom.applicableContexts || [],
      confidence: wisdom.confidence || 0.5,
      formedAt: Date.now(),
      applicationCount: 0,
      successCount: 0,
    };
    
    this.wisdoms.push(fullWisdom);
    console.log(`[智慧] 添加新智慧：${fullWisdom.statement}`);
    
    return fullWisdom;
  }
  
  /**
   * 考虑智慧形成
   */
  private considerWisdom(experience: Experience): void {
    // 查找类似的经历
    const similarExperiences = this.experiences.filter(e => 
      e.id !== experience.id &&
      e.applicableWhen.some(when => 
        experience.applicableWhen.includes(when)
      )
    );
    
    // 如果有3次以上类似经历，可能形成智慧
    if (similarExperiences.length >= 2) {
      const statement = this.synthesizeWisdom([experience, ...similarExperiences]);
      
      // 去重检查
      const normalizedStatement = statement.replace(/\s+/g, '').toLowerCase();
      const isDuplicate = this.wisdoms.some(w => {
        const existingNormalized = w.statement.replace(/\s+/g, '').toLowerCase();
        return existingNormalized === normalizedStatement ||
               (existingNormalized.includes(normalizedStatement) && normalizedStatement.length > 20);
      });
      
      if (isDuplicate) {
        console.log(`[智慧] 跳过重复智慧：${statement.slice(0, 30)}...`);
        return;
      }
      
      const wisdom: Wisdom = {
        id: uuidv4(),
        statement: statement,
        derivation: {
          fromExperiences: [experience.id, ...similarExperiences.map(e => e.id)],
          fromReflections: [],
          fromInsights: [],
        },
        applicableContexts: experience.applicableWhen,
        confidence: 0.6 + similarExperiences.length * 0.1,
        formedAt: Date.now(),
        applicationCount: 0,
        successCount: 0,
      };
      
      this.wisdoms.push(wisdom);
      console.log(`[智慧] 形成新智慧：${wisdom.statement}`);
    }
  }
  
  /**
   * 综合智慧
   */
  private synthesizeWisdom(experiences: Experience[]): string {
    const learnings = experiences.map(e => e.learning);
    
    // 简单的综合策略：提取共同点
    if (learnings.length === 1) {
      return learnings[0];
    }
    
    // 如果有共同的关键词
    const commonWords = this.findCommonWords(learnings);
    if (commonWords.length > 0) {
      return `在${experiences[0].applicableWhen[0] || '类似情况'}下，${commonWords.join('、')}很重要`;
    }
    
    // 否则取最重要的学习
    return experiences.sort((a, b) => b.importance - a.importance)[0].learning;
  }
  
  /**
   * 查找共同词
   */
  private findCommonWords(texts: string[]): string[] {
    const wordCounts = new Map<string, number>();
    
    for (const text of texts) {
      const words = text.split(/\s+/);
      const seen = new Set<string>();
      
      for (const word of words) {
        if (word.length >= 2 && !seen.has(word)) {
          seen.add(word);
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        }
      }
    }
    
    const threshold = Math.ceil(texts.length * 0.5);
    return Array.from(wordCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([word, _]) => word)
      .slice(0, 3);
  }
  
  /**
   * 计算记忆相关性分数
   * 综合考虑：重要性、访问频率、时间衰减、匹配程度
   */
  private calculateRelevanceScore(
    node: KnowledgeNode,
    queryLower: string
  ): number {
    // 1. 基础匹配分 (0-1)
    let matchScore = 0;
    const labelLower = node.label.toLowerCase();
    const contentLower = node.content.toLowerCase();
    
    // 精确匹配最高分
    if (labelLower === queryLower || contentLower.includes(queryLower)) {
      matchScore = 1.0;
    }
    // 标签匹配
    else if (node.tags.some(t => t.toLowerCase() === queryLower)) {
      matchScore = 0.9;
    }
    // 部分匹配
    else if (labelLower.includes(queryLower) || queryLower.includes(labelLower)) {
      matchScore = 0.7;
    }
    // 内容部分匹配
    else if (contentLower.includes(queryLower)) {
      matchScore = 0.6;
    }
    // 标签部分匹配
    else if (node.tags.some(t => 
      t.toLowerCase().includes(queryLower) || queryLower.includes(t.toLowerCase())
    )) {
      matchScore = 0.5;
    }
    
    if (matchScore === 0) return 0;
    
    // 2. 时间衰减因子 (0-1)
    // 高重要性的记忆衰减更慢
    const ageInDays = (Date.now() - node.source.timestamp) / (1000 * 60 * 60 * 24);
    const decayRate = node.importance > 0.9 ? 0.01 :  // 核心记忆几乎不衰减
                       node.importance > 0.7 ? 0.05 : // 重要记忆慢衰减
                       0.1;                            // 普通记忆正常衰减
    const timeDecay = Math.exp(-decayRate * Math.min(ageInDays, 365));
    
    // 3. 访问频率加成 (0-0.3)
    // 经常访问的记忆更重要
    const accessBonus = Math.min(0.3, Math.log10(node.accessCount + 1) * 0.1);
    
    // 4. 重要性权重 (0.5-1.5)
    const importanceWeight = 0.5 + node.importance;
    
    // 综合分数
    return matchScore * timeDecay * importanceWeight + accessBonus;
  }

  /**
   * 检索记忆（优化版：相关性排序）
   */
  retrieve(query: string, options?: {
    maxResults?: number;
    includeExperiences?: boolean;
    includeWisdoms?: boolean;
  }): MemoryRetrieval {
    const maxResults = options?.maxResults || 5;
    const queryLower = query.toLowerCase();
    
    // 1. 计算所有节点的相关性分数并排序
    const scoredNodes: Array<{ node: KnowledgeNode; score: number }> = [];
    
    for (const node of this.nodes.values()) {
      const score = this.calculateRelevanceScore(node, queryLower);
      if (score > 0) {
        scoredNodes.push({ node, score });
      }
    }
    
    // 按分数降序排列
    scoredNodes.sort((a, b) => b.score - a.score);
    
    // 取前N个作为直接匹配
    const directMatches = scoredNodes.slice(0, maxResults).map(s => {
      s.node.accessCount++;
      s.node.lastAccessedAt = Date.now();
      return s.node;
    });
    
    // 2. 相关节点（通过连接扩展）
    const relatedNodes: MemoryRetrieval['relatedNodes'] = [];
    const directIds = new Set(directMatches.map(n => n.id));
    
    for (const match of directMatches.slice(0, 3)) {
      const neighbors = this.getConnectedNodes(match.id);
      for (const neighbor of neighbors) {
        if (!directIds.has(neighbor.node.id)) {
          relatedNodes.push({
            ...neighbor,
            distance: 1,
          });
        }
      }
    }
    
    // 3. 相关经验（按重要性和时间排序）
    let relevantExperiences: Experience[] = [];
    if (options?.includeExperiences !== false) {
      relevantExperiences = this.experiences
        .filter(e => 
          e.title.toLowerCase().includes(queryLower) ||
          e.situation.toLowerCase().includes(queryLower) ||
          e.learning.toLowerCase().includes(queryLower)
        )
        .sort((a, b) => {
          // 先按重要性，再按时间
          if (b.importance !== a.importance) return b.importance - a.importance;
          return b.timestamp - a.timestamp;
        })
        .slice(0, 3);
    }
    
    // 4. 相关智慧（按置信度和应用次数排序）
    let relevantWisdoms: Wisdom[] = [];
    if (options?.includeWisdoms !== false) {
      relevantWisdoms = this.wisdoms
        .filter(w => 
          w.statement.toLowerCase().includes(queryLower) ||
          w.applicableContexts.some(c => c.toLowerCase().includes(queryLower))
        )
        .sort((a, b) => {
          // 综合置信度和成功率
          const scoreA = a.confidence * (a.successCount / Math.max(1, a.applicationCount));
          const scoreB = b.confidence * (b.successCount / Math.max(1, b.applicationCount));
          return scoreB - scoreA;
        })
        .slice(0, 2);
    }
    
    // 5. 生成总结
    const summary = this.generateRetrievalSummary(
      directMatches, relatedNodes, relevantExperiences, relevantWisdoms
    );
    
    return {
      directMatches,
      relatedNodes: relatedNodes.slice(0, maxResults),
      relevantExperiences,
      relevantWisdoms,
      summary,
    };
  }
  
  /**
   * 获取连接的节点
   */
  private getConnectedNodes(nodeId: string): Array<{
    node: KnowledgeNode;
    relation: string;
    distance: number;
  }> {
    const result: Array<{
      node: KnowledgeNode;
      relation: string;
      distance: number;
    }> = [];
    
    for (const link of this.links.values()) {
      if (link.from === nodeId && this.nodes.has(link.to)) {
        result.push({
          node: this.nodes.get(link.to)!,
          relation: link.relation,
          distance: 1,
        });
      } else if (link.to === nodeId && this.nodes.has(link.from)) {
        result.push({
          node: this.nodes.get(link.from)!,
          relation: `被${link.relation}`,
          distance: 1,
        });
      }
    }
    
    return result;
  }
  
  /**
   * 生成检索总结
   */
  private generateRetrievalSummary(
    directMatches: KnowledgeNode[],
    relatedNodes: MemoryRetrieval['relatedNodes'],
    experiences: Experience[],
    wisdoms: Wisdom[]
  ): string {
    const parts: string[] = [];
    
    if (directMatches.length > 0) {
      parts.push(`我找到了关于"${directMatches[0].label}"的知识`);
    }
    
    if (experiences.length > 0) {
      parts.push(`我有${experiences.length}次类似的经验`);
    }
    
    if (wisdoms.length > 0) {
      parts.push(`我学到了：${wisdoms[0].statement}`);
    }
    
    return parts.join('。') || '没有找到直接相关的记忆';
  }
  
  /**
   * 记录对话摘要
   */
  recordConversationSummary(summary: Partial<ConversationSummary>): ConversationSummary {
    const fullSummary: ConversationSummary = {
      id: uuidv4(),
      conversationId: summary.conversationId || uuidv4(),
      topics: summary.topics || [],
      keyInsights: summary.keyInsights || [],
      learned: summary.learned || [],
      emotionalTone: summary.emotionalTone || 'neutral',
      importance: summary.importance || 0.5,
      timestamp: Date.now(),
      messageCount: summary.messageCount || 0,
    };
    
    this.conversationSummaries.push(fullSummary);
    
    // 为每个话题创建知识节点
    for (const topic of fullSummary.topics) {
      this.addNode({
        label: topic,
        type: 'concept',
        content: `在对话中讨论过的话题`,
        importance: fullSummary.importance,
        tags: ['对话话题'],
        source: {
          type: 'conversation',
          conversationId: fullSummary.conversationId,
          timestamp: fullSummary.timestamp,
        },
      });
    }
    
    // 记录关键洞察为经验
    for (const insight of fullSummary.keyInsights) {
      this.recordExperience({
        title: `洞察：${insight.slice(0, 20)}...`,
        situation: '在对话中',
        learning: insight,
        importance: fullSummary.importance,
        conversationId: fullSummary.conversationId,
      });
    }
    
    return fullSummary;
  }
  
  /**
   * 导出状态
   */
  exportState(): LongTermMemoryState {
    return {
      knowledgeGraph: {
        nodes: Array.from(this.nodes.values()),
        links: Array.from(this.links.values()),
      },
      experiences: this.experiences,
      wisdoms: this.wisdoms,
      conversationSummaries: this.conversationSummaries,
    };
  }
  
  /**
   * 导入状态
   */
  importState(state: LongTermMemoryState): void {
    this.nodes.clear();
    this.links.clear();
    this.labelIndex.clear();
    this.tagIndex.clear();
    
    for (const node of state.knowledgeGraph.nodes) {
      this.nodes.set(node.id, node);
      this.indexNode(node);
    }
    
    for (const link of state.knowledgeGraph.links) {
      this.links.set(link.id, link);
    }
    
    this.experiences = state.experiences;
    this.wisdoms = state.wisdoms;
    this.conversationSummaries = state.conversationSummaries;
  }
  
  /**
   * 获取统计
   */
  getStats(): {
    nodeCount: number;
    linkCount: number;
    experienceCount: number;
    wisdomCount: number;
    summaryCount: number;
  } {
    return {
      nodeCount: this.nodes.size,
      linkCount: this.links.size,
      experienceCount: this.experiences.length,
      wisdomCount: this.wisdoms.length,
      summaryCount: this.conversationSummaries.length,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * 记忆遗忘/衰减机制 (Memory Decay System)
   * 
   * 原理：
   * - 记忆会随时间自然衰减（遗忘曲线）
   * - 高重要性的记忆衰减更慢
   * - 经常访问的记忆被强化
   * - 低重要性且长期未访问的记忆可能被清除
   * ═══════════════════════════════════════════════════════════════════════
   */

  /**
   * 应用记忆衰减
   * @param daysSinceLastDecay 距离上次衰减的天数
   * @returns 衰减统计
   */
  applyMemoryDecay(daysSinceLastDecay: number = 1): {
    decayedNodes: number;
    removedNodes: number;
    decayedExperiences: number;
    removedExperiences: number;
  } {
    const result = {
      decayedNodes: 0,
      removedNodes: 0,
      decayedExperiences: 0,
      removedExperiences: 0,
    };

    // 衰减因子：每天衰减的幅度
    const baseDecayRate = 0.02;

    // 1. 处理知识节点
    const nodesToRemove: string[] = [];
    
    for (const [id, node] of this.nodes.entries()) {
      // 跳过核心记忆（重要性 > 0.95 的记忆几乎不衰减）
      if (node.importance > 0.95) continue;

      // 计算衰减幅度
      // 重要性越高，衰减越慢
      const importanceProtection = node.importance * 0.5;
      const effectiveDecay = baseDecayRate * (1 - importanceProtection) * daysSinceLastDecay;
      
      // 访问频率保护：经常访问的记忆衰减更慢
      const accessProtection = Math.min(0.5, Math.log10(node.accessCount + 1) * 0.1);
      const finalDecay = effectiveDecay * (1 - accessProtection);
      
      // 应用衰减
      node.importance = Math.max(0, node.importance - finalDecay);
      result.decayedNodes++;

      // 检查是否需要移除（重要性低于阈值且长期未访问）
      const daysSinceAccess = (Date.now() - node.lastAccessedAt) / (1000 * 60 * 60 * 24);
      if (node.importance < 0.1 && daysSinceAccess > 30) {
        nodesToRemove.push(id);
      }
    }

    // 移除低重要性节点
    for (const id of nodesToRemove) {
      this.nodes.delete(id);
      result.removedNodes++;
    }

    // 2. 处理经验
    const experiencesToRemove: number[] = [];
    
    this.experiences.forEach((exp, index) => {
      if (exp.importance > 0.95) return;

      const importanceProtection = exp.importance * 0.5;
      const effectiveDecay = baseDecayRate * (1 - importanceProtection) * daysSinceLastDecay;
      
      exp.importance = Math.max(0, exp.importance - effectiveDecay);
      result.decayedExperiences++;

      if (exp.importance < 0.1) {
        experiencesToRemove.push(index);
      }
    });

    // 移除低重要性经验（从后向前删除以保持索引正确）
    for (let i = experiencesToRemove.length - 1; i >= 0; i--) {
      this.experiences.splice(experiencesToRemove[i], 1);
      result.removedExperiences++;
    }

    // 3. 清理无效链接
    const validNodeIds = new Set(this.nodes.keys());
    for (const [id, link] of this.links.entries()) {
      if (!validNodeIds.has(link.from) || !validNodeIds.has(link.to)) {
        this.links.delete(id);
      }
    }

    console.log(`[记忆衰减] 衰减了 ${result.decayedNodes} 个节点，移除了 ${result.removedNodes} 个节点`);
    
    return result;
  }

  /**
   * 强化记忆
   * 通过回忆或使用来强化特定的记忆
   */
  reinforceMemory(nodeId: string, amount: number = 0.1): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // 强化重要性，但不超过上限
    node.importance = Math.min(1.0, node.importance + amount);
    node.accessCount++;
    node.lastAccessedAt = Date.now();

    return true;
  }

  /**
   * 获取记忆健康报告
   */
  getMemoryHealthReport(): {
    totalNodes: number;
    healthyNodes: number;
    atRiskNodes: number;
    coreMemories: number;
    averageImportance: number;
    averageAccessCount: number;
    oldestMemory: { label: string; age: number } | null;
    recommendations: string[];
  } {
    const nodes = Array.from(this.nodes.values());
    
    const healthyNodes = nodes.filter(n => n.importance > 0.5).length;
    const atRiskNodes = nodes.filter(n => n.importance <= 0.3).length;
    const coreMemories = nodes.filter(n => n.importance > 0.95).length;
    
    const averageImportance = nodes.length > 0 
      ? nodes.reduce((sum, n) => sum + n.importance, 0) / nodes.length 
      : 0;
    
    const averageAccessCount = nodes.length > 0
      ? nodes.reduce((sum, n) => sum + n.accessCount, 0) / nodes.length
      : 0;

    // 找最老的记忆
    let oldestMemory: { label: string; age: number } | null = null;
    if (nodes.length > 0) {
      const oldest = nodes.reduce((prev, curr) => 
        prev.source.timestamp < curr.source.timestamp ? prev : curr
      );
      oldestMemory = {
        label: oldest.label,
        age: Math.floor((Date.now() - oldest.source.timestamp) / (1000 * 60 * 60 * 24)),
      };
    }

    // 生成建议
    const recommendations: string[] = [];
    if (atRiskNodes > nodes.length * 0.3) {
      recommendations.push('有较多记忆处于衰减风险中，建议进行记忆强化');
    }
    if (averageAccessCount < 1.5) {
      recommendations.push('记忆访问频率较低，建议通过回忆强化重要记忆');
    }
    if (coreMemories < 3) {
      recommendations.push('核心记忆较少，建议标记更多重要记忆为核心');
    }

    return {
      totalNodes: nodes.length,
      healthyNodes,
      atRiskNodes,
      coreMemories,
      averageImportance: Math.round(averageImportance * 100) / 100,
      averageAccessCount: Math.round(averageAccessCount * 10) / 10,
      oldestMemory,
      recommendations,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createLongTermMemory(): LongTermMemory {
  return new LongTermMemory();
}
