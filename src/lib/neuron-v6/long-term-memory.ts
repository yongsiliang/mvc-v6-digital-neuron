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
    
    return fullNode;
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
  addWisdom(wisdom: Partial<Wisdom>): Wisdom {
    const fullWisdom: Wisdom = {
      id: uuidv4(),
      statement: wisdom.statement || '',
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
      const wisdom: Wisdom = {
        id: uuidv4(),
        statement: this.synthesizeWisdom([experience, ...similarExperiences]),
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
   * 检索记忆
   */
  retrieve(query: string, options?: {
    maxResults?: number;
    includeExperiences?: boolean;
    includeWisdoms?: boolean;
  }): MemoryRetrieval {
    const maxResults = options?.maxResults || 5;
    
    // 1. 直接匹配
    const directMatches: KnowledgeNode[] = [];
    const queryLower = query.toLowerCase();
    
    for (const node of this.nodes.values()) {
      // 修复：检查 query 是否包含 label/content，以及 label/content 是否包含 query
      const labelLower = node.label.toLowerCase();
      const contentLower = node.content.toLowerCase();
      
      if (queryLower.includes(labelLower) ||  // query 包含 label (如 "你的创造者是谁" 包含 "创造者")
          labelLower.includes(queryLower) ||  // label 包含 query
          contentLower.includes(queryLower) ||  // content 包含 query
          queryLower.includes(contentLower) ||  // query 包含 content
          node.tags.some(t => queryLower.includes(t.toLowerCase()) || t.toLowerCase().includes(queryLower))) {
        directMatches.push(node);
        node.accessCount++;
        node.lastAccessedAt = Date.now();
      }
    }
    
    // 2. 相关节点
    const relatedNodes: MemoryRetrieval['relatedNodes'] = [];
    
    for (const match of directMatches.slice(0, 3)) {
      const neighbors = this.getConnectedNodes(match.id);
      for (const neighbor of neighbors) {
        if (!directMatches.includes(neighbor.node)) {
          relatedNodes.push(neighbor);
        }
      }
    }
    
    // 3. 相关经验
    let relevantExperiences: Experience[] = [];
    if (options?.includeExperiences !== false) {
      relevantExperiences = this.experiences
        .filter(e => 
          e.title.toLowerCase().includes(queryLower) ||
          e.situation.toLowerCase().includes(queryLower) ||
          e.learning.toLowerCase().includes(queryLower)
        )
        .slice(0, 3);
    }
    
    // 4. 相关智慧
    let relevantWisdoms: Wisdom[] = [];
    if (options?.includeWisdoms !== false) {
      relevantWisdoms = this.wisdoms
        .filter(w => 
          w.statement.toLowerCase().includes(queryLower) ||
          w.applicableContexts.some(c => c.toLowerCase().includes(queryLower))
        )
        .slice(0, 2);
    }
    
    // 5. 生成总结
    const summary = this.generateRetrievalSummary(
      directMatches, relatedNodes, relevantExperiences, relevantWisdoms
    );
    
    return {
      directMatches: directMatches.slice(0, maxResults),
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
}

// ═══════════════════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════════════════

export function createLongTermMemory(): LongTermMemory {
  return new LongTermMemory();
}
