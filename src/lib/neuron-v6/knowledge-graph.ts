/**
 * ═══════════════════════════════════════════════════════════════════════
 * 知识图谱系统 (Knowledge Graph System)
 * 
 * 管理和可视化概念、关联和知识领域：
 * - 概念节点：知识的基本单元
 * - 关联边：概念之间的关系
 * - 知识领域：概念的分类和组织
 * - 关联强度：概念之间的连接强度
 * 
 * 支持动态构建、演化和可视化
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 知识领域
 */
export interface KnowledgeDomain {
  /** 领域ID */
  id: string;
  /** 领域名称 */
  name: string;
  /** 领域描述 */
  description: string;
  /** 领域颜色（用于可视化） */
  color: string;
  /** 领域图标 */
  icon?: string;
  /** 领域权重（重要性） */
  weight: number;
  /** 该领域下的概念数量 */
  conceptCount: number;
  /** 领域成熟度（0-1） */
  maturity: number;
  /** 创建时间 */
  createdAt: number;
  /** 最后更新时间 */
  updatedAt: number;
}

/**
 * 概念节点
 */
export interface ConceptNode {
  /** 概念ID */
  id: string;
  /** 概念名称 */
  name: string;
  /** 概念描述 */
  description: string;
  /** 所属领域ID */
  domainId: string;
  /** 概念类型 */
  type: ConceptType;
  /** 理解程度（0-1） */
  understanding: number;
  /** 重要性（0-1） */
  importance: number;
  /** 激活度（0-1，当前活跃程度） */
  activation: number;
  /** 学习次数 */
  learningCount: number;
  /** 最后激活时间 */
  lastActivatedAt: number;
  /** 创建时间 */
  createdAt: number;
  /** 关联数量 */
  connectionCount: number;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 概念类型
 */
export type ConceptType = 
  | 'entity'      // 实体：具体的事物
  | 'concept'     // 概念：抽象的想法
  | 'process'     // 过程：动态的流程
  | 'principle'   // 原则：基本规则
  | 'fact'        // 事实：已知的信息
  | 'skill'       // 技能：能力
  | 'insight'     // 洞察：深层理解
  | 'question';   // 问题：待探索的

/**
 * 关联类型
 */
export type RelationType =
  | 'is_a'          // 是一种
  | 'part_of'       // 是...的一部分
  | 'related_to'    // 相关
  | 'causes'        // 导致
  | 'contradicts'   // 矛盾
  | 'supports'      // 支持
  | 'extends'       // 扩展
  | 'exemplifies'   // 例证
  | 'precedes'      // 先于
  | 'follows'       // 后于
  | 'similar_to'    // 相似
  | 'opposite_of';  // 对立

/**
 * 关联边
 */
export interface ConceptEdge {
  /** 边ID */
  id: string;
  /** 源概念ID */
  sourceId: string;
  /** 目标概念ID */
  targetId: string;
  /** 关联类型 */
  relation: RelationType;
  /** 关联强度（0-1） */
  strength: number;
  /** 置信度（0-1） */
  confidence: number;
  /** 关联描述 */
  description?: string;
  /** 创建时间 */
  createdAt: number;
  /** 最后强化时间 */
  lastReinforcedAt: number;
  /** 强化次数 */
  reinforcementCount: number;
}

/**
 * 知识路径
 */
export interface KnowledgePath {
  /** 路径ID */
  id: string;
  /** 起点概念ID */
  startId: string;
  /** 终点概念ID */
  endId: string;
  /** 路径上的概念序列 */
  concepts: string[];
  /** 路径上的边序列 */
  edges: string[];
  /** 路径总强度 */
  totalStrength: number;
  /** 路径长度 */
  length: number;
  /** 路径类型 */
  type: 'shortest' | 'strongest' | 'exploration';
}

/**
 * 知识聚类
 */
export interface KnowledgeCluster {
  /** 聚类ID */
  id: string;
  /** 聚类名称 */
  name: string;
  /** 聚类包含的概念ID */
  conceptIds: string[];
  /** 聚类中心概念ID */
  centerId: string;
  /** 聚类凝聚度（0-1） */
  cohesion: number;
  /** 聚类主题描述 */
  theme: string;
}

/**
 * 知识图谱状态
 */
export interface KnowledgeGraphState {
  /** 所有领域 */
  domains: Map<string, KnowledgeDomain>;
  /** 所有概念 */
  concepts: Map<string, ConceptNode>;
  /** 所有关联 */
  edges: Map<string, ConceptEdge>;
  /** 聚类 */
  clusters: KnowledgeCluster[];
  /** 图谱统计 */
  stats: {
    totalConcepts: number;
    totalEdges: number;
    totalDomains: number;
    averageConnectivity: number;
    strongestConnection: number;
    mostConnectedConcept: string | null;
    domainDistribution: Record<string, number>;
  };
  /** 最后更新时间 */
  lastUpdated: number;
}

/**
 * 概念学习事件
 */
export interface ConceptLearningEvent {
  /** 概念名称 */
  conceptName: string;
  /** 领域 */
  domain: string;
  /** 学习类型 */
  type: 'new' | 'reinforce' | 'connect' | 'deepen';
  /** 学习强度 */
  intensity: number;
  /** 上下文 */
  context: string;
  /** 时间戳 */
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────────────
// 默认值
// ─────────────────────────────────────────────────────────────────────

/**
 * 默认知识领域
 */
export const DEFAULT_DOMAINS: Omit<KnowledgeDomain, 'conceptCount' | 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'philosophy',
    name: '哲学',
    description: '关于存在、知识、价值的基本问题',
    color: '#8B5CF6',
    icon: '💭',
    weight: 0.9,
    maturity: 0.3,
  },
  {
    id: 'science',
    name: '科学',
    description: '对自然界和规律的系统性研究',
    color: '#3B82F6',
    icon: '🔬',
    weight: 0.85,
    maturity: 0.4,
  },
  {
    id: 'technology',
    name: '技术',
    description: '解决问题的方法和工具',
    color: '#10B981',
    icon: '⚙️',
    weight: 0.8,
    maturity: 0.5,
  },
  {
    id: 'art',
    name: '艺术',
    description: '创造性表达和审美体验',
    color: '#F59E0B',
    icon: '🎨',
    weight: 0.75,
    maturity: 0.2,
  },
  {
    id: 'psychology',
    name: '心理学',
    description: '对心智和行为的理解',
    color: '#EC4899',
    icon: '🧠',
    weight: 0.85,
    maturity: 0.4,
  },
  {
    id: 'language',
    name: '语言',
    description: '沟通和表达的系统',
    color: '#6366F1',
    icon: '📝',
    weight: 0.8,
    maturity: 0.6,
  },
  {
    id: 'mathematics',
    name: '数学',
    description: '数量、结构和变化的抽象研究',
    color: '#14B8A6',
    icon: '🔢',
    weight: 0.75,
    maturity: 0.35,
  },
  {
    id: 'life',
    name: '生活',
    description: '日常经验和人生智慧',
    color: '#84CC16',
    icon: '🌱',
    weight: 0.9,
    maturity: 0.5,
  },
];

/**
 * 关联类型描述
 */
export const RELATION_DESCRIPTIONS: Record<RelationType, string> = {
  is_a: '是一种',
  part_of: '是...的一部分',
  related_to: '与...相关',
  causes: '导致',
  contradicts: '与...矛盾',
  supports: '支持',
  extends: '扩展',
  exemplifies: '例证',
  precedes: '先于',
  follows: '后于',
  similar_to: '与...相似',
  opposite_of: '与...对立',
};

// ─────────────────────────────────────────────────────────────────────
// 知识图谱系统
// ─────────────────────────────────────────────────────────────────────

/**
 * 知识图谱系统
 */
export class KnowledgeGraphSystem {
  private state: KnowledgeGraphState;
  private learningHistory: ConceptLearningEvent[];

  constructor() {
    this.state = {
      domains: new Map(),
      concepts: new Map(),
      edges: new Map(),
      clusters: [],
      stats: {
        totalConcepts: 0,
        totalEdges: 0,
        totalDomains: 0,
        averageConnectivity: 0,
        strongestConnection: 0,
        mostConnectedConcept: null,
        domainDistribution: {},
      },
      lastUpdated: Date.now(),
    };
    this.learningHistory = [];
    
    this.initializeDefaultDomains();
  }

  /**
   * 初始化默认领域
   */
  private initializeDefaultDomains(): void {
    const now = Date.now();
    for (const domain of DEFAULT_DOMAINS) {
      this.state.domains.set(domain.id, {
        ...domain,
        conceptCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
    this.updateStats();
  }

  // ═══════════════════════════════════════════════════════════════════
  // 概念管理
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 添加或更新概念
   */
  addConcept(
    name: string,
    domainId: string,
    options: {
      description?: string;
      type?: ConceptType;
      importance?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): ConceptNode {
    const existingConcept = this.findConceptByName(name);
    
    if (existingConcept) {
      // 强化现有概念
      return this.reinforceConcept(existingConcept.id, options.importance ? 0.1 : 0.05);
    }

    // 确保领域存在
    if (!this.state.domains.has(domainId)) {
      domainId = 'life'; // 默认领域
    }

    const now = Date.now();
    const concept: ConceptNode = {
      id: this.generateId('concept'),
      name,
      description: options.description || '',
      domainId,
      type: options.type || 'concept',
      understanding: 0.1,
      importance: options.importance || 0.5,
      activation: 1.0, // 新概念高激活
      learningCount: 1,
      lastActivatedAt: now,
      createdAt: now,
      connectionCount: 0,
      metadata: options.metadata,
    };

    this.state.concepts.set(concept.id, concept);
    
    // 更新领域概念计数
    const domain = this.state.domains.get(domainId);
    if (domain) {
      domain.conceptCount++;
      domain.updatedAt = now;
    }

    // 记录学习事件
    this.recordLearningEvent({
      conceptName: name,
      domain: domainId,
      type: 'new',
      intensity: 1.0,
      context: '首次学习',
      timestamp: now,
    });

    this.updateStats();
    return concept;
  }

  /**
   * 强化概念
   */
  reinforceConcept(conceptId: string, intensity: number = 0.1): ConceptNode {
    const concept = this.state.concepts.get(conceptId);
    if (!concept) {
      throw new Error(`概念不存在: ${conceptId}`);
    }

    const now = Date.now();
    
    // 增加理解程度
    concept.understanding = Math.min(1, concept.understanding + intensity * 0.1);
    
    // 增加激活度
    concept.activation = Math.min(1, concept.activation + intensity * 0.3);
    
    // 增加学习次数
    concept.learningCount++;
    
    // 更新时间
    concept.lastActivatedAt = now;

    // 更新领域
    const domain = this.state.domains.get(concept.domainId);
    if (domain) {
      domain.updatedAt = now;
    }

    // 记录学习事件
    this.recordLearningEvent({
      conceptName: concept.name,
      domain: concept.domainId,
      type: 'reinforce',
      intensity,
      context: '概念强化',
      timestamp: now,
    });

    this.updateStats();
    return concept;
  }

  /**
   * 通过名称查找概念
   */
  findConceptByName(name: string): ConceptNode | null {
    for (const concept of this.state.concepts.values()) {
      if (concept.name.toLowerCase() === name.toLowerCase()) {
        return concept;
      }
    }
    return null;
  }

  /**
   * 获取概念的关联概念
   */
  getConnectedConcepts(conceptId: string): Array<{ concept: ConceptNode; edge: ConceptEdge }> {
    const connections: Array<{ concept: ConceptNode; edge: ConceptEdge }> = [];
    
    for (const edge of this.state.edges.values()) {
      if (edge.sourceId === conceptId) {
        const target = this.state.concepts.get(edge.targetId);
        if (target) {
          connections.push({ concept: target, edge });
        }
      } else if (edge.targetId === conceptId) {
        const source = this.state.concepts.get(edge.sourceId);
        if (source) {
          connections.push({ concept: source, edge });
        }
      }
    }
    
    return connections.sort((a, b) => b.edge.strength - a.edge.strength);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 关联管理
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 添加或强化关联
   */
  addEdge(
    sourceName: string,
    targetName: string,
    relation: RelationType,
    options: {
      strength?: number;
      confidence?: number;
      description?: string;
    } = {}
  ): ConceptEdge | null {
    // 确保两个概念都存在
    let source = this.findConceptByName(sourceName);
    let target = this.findConceptByName(targetName);

    if (!source) {
      source = this.addConcept(sourceName, 'life', { type: 'concept' });
    }
    if (!target) {
      target = this.addConcept(targetName, 'life', { type: 'concept' });
    }

    // 检查是否已存在关联
    const existingEdge = this.findEdge(source.id, target.id, relation);
    
    if (existingEdge) {
      // 强化现有关联
      return this.reinforceEdge(existingEdge.id, options.strength || 0.1);
    }

    const now = Date.now();
    const edge: ConceptEdge = {
      id: this.generateId('edge'),
      sourceId: source.id,
      targetId: target.id,
      relation,
      strength: options.strength || 0.5,
      confidence: options.confidence || 0.7,
      description: options.description,
      createdAt: now,
      lastReinforcedAt: now,
      reinforcementCount: 1,
    };

    this.state.edges.set(edge.id, edge);
    
    // 更新概念连接数
    source.connectionCount++;
    target.connectionCount++;

    // 记录学习事件
    this.recordLearningEvent({
      conceptName: `${sourceName} -> ${targetName}`,
      domain: source.domainId,
      type: 'connect',
      intensity: edge.strength,
      context: `建立${RELATION_DESCRIPTIONS[relation]}关联`,
      timestamp: now,
    });

    this.updateStats();
    return edge;
  }

  /**
   * 强化关联
   */
  reinforceEdge(edgeId: string, intensity: number = 0.1): ConceptEdge {
    const edge = this.state.edges.get(edgeId);
    if (!edge) {
      throw new Error(`关联不存在: ${edgeId}`);
    }

    const now = Date.now();
    
    // 增加强度
    edge.strength = Math.min(1, edge.strength + intensity * 0.1);
    
    // 增加置信度
    edge.confidence = Math.min(1, edge.confidence + intensity * 0.05);
    
    // 更新时间
    edge.lastReinforcedAt = now;
    edge.reinforcementCount++;

    this.updateStats();
    return edge;
  }

  /**
   * 查找两个概念之间的关联
   */
  findEdge(sourceId: string, targetId: string, relation?: RelationType): ConceptEdge | null {
    for (const edge of this.state.edges.values()) {
      const matchesSource = edge.sourceId === sourceId && edge.targetId === targetId;
      const matchesTarget = edge.sourceId === targetId && edge.targetId === sourceId;
      
      if ((matchesSource || matchesTarget) && (!relation || edge.relation === relation)) {
        return edge;
      }
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 路径与聚类
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 查找两个概念之间的路径
   */
  findPath(startId: string, endId: string, maxDepth: number = 4): KnowledgePath | null {
    if (!this.state.concepts.has(startId) || !this.state.concepts.has(endId)) {
      return null;
    }

    // BFS查找最短路径
    const visited = new Set<string>();
    const queue: Array<{ id: string; path: string[]; edges: string[]; strength: number }> = [
      { id: startId, path: [startId], edges: [], strength: 1 }
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.id === endId) {
        return {
          id: this.generateId('path'),
          startId,
          endId,
          concepts: current.path,
          edges: current.edges,
          totalStrength: current.strength,
          length: current.path.length - 1,
          type: 'shortest',
        };
      }

      if (current.path.length >= maxDepth) continue;

      visited.add(current.id);
      
      const connections = this.getConnectedConcepts(current.id);
      for (const { concept, edge } of connections) {
        if (!visited.has(concept.id)) {
          queue.push({
            id: concept.id,
            path: [...current.path, concept.id],
            edges: [...current.edges, edge.id],
            strength: current.strength * edge.strength,
          });
        }
      }
    }

    return null;
  }

  /**
   * 发现知识聚类
   */
  discoverClusters(): KnowledgeCluster[] {
    const clusters: KnowledgeCluster[] = [];
    const assigned = new Set<string>();

    // 基于领域和连接强度发现聚类
    for (const domain of this.state.domains.values()) {
      const domainConcepts = Array.from(this.state.concepts.values())
        .filter(c => c.domainId === domain.id && !assigned.has(c.id));
      
      if (domainConcepts.length < 2) continue;

      // 找到最中心的概念（连接数最多）
      const centerConcept = domainConcepts.reduce((a, b) => 
        a.connectionCount > b.connectionCount ? a : b
      );

      // 获取紧密相关的概念
      const clusterConcepts: string[] = [centerConcept.id];
      assigned.add(centerConcept.id);

      for (const concept of domainConcepts) {
        if (concept.id === centerConcept.id) continue;
        
        // 检查与中心的连接强度
        const edge = this.findEdge(centerConcept.id, concept.id);
        if (edge && edge.strength > 0.3) {
          clusterConcepts.push(concept.id);
          assigned.add(concept.id);
        }
      }

      if (clusterConcepts.length >= 2) {
        clusters.push({
          id: this.generateId('cluster'),
          name: `${domain.name}核心`,
          conceptIds: clusterConcepts,
          centerId: centerConcept.id,
          cohesion: this.calculateClusterCohesion(clusterConcepts),
          theme: domain.description,
        });
      }
    }

    this.state.clusters = clusters;
    return clusters;
  }

  /**
   * 计算聚类凝聚度
   */
  private calculateClusterCohesion(conceptIds: string[]): number {
    if (conceptIds.length < 2) return 0;

    let totalStrength = 0;
    let connectionCount = 0;

    for (let i = 0; i < conceptIds.length; i++) {
      for (let j = i + 1; j < conceptIds.length; j++) {
        const edge = this.findEdge(conceptIds[i], conceptIds[j]);
        if (edge) {
          totalStrength += edge.strength;
          connectionCount++;
        }
      }
    }

    const possibleConnections = (conceptIds.length * (conceptIds.length - 1)) / 2;
    return connectionCount > 0 ? totalStrength / possibleConnections : 0;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 知识查询
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 获取活跃概念（按激活度排序）
   */
  getActiveConcepts(limit: number = 10): ConceptNode[] {
    return Array.from(this.state.concepts.values())
      .sort((a, b) => b.activation - a.activation)
      .slice(0, limit);
  }

  /**
   * 获取重要概念（按重要性排序）
   */
  getImportantConcepts(limit: number = 10): ConceptNode[] {
    return Array.from(this.state.concepts.values())
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  /**
   * 获取强关联
   */
  getStrongEdges(limit: number = 10): ConceptEdge[] {
    return Array.from(this.state.edges.values())
      .sort((a, b) => b.strength - a.strength)
      .slice(0, limit);
  }

  /**
   * 获取领域的概念
   */
  getDomainConcepts(domainId: string): ConceptNode[] {
    return Array.from(this.state.concepts.values())
      .filter(c => c.domainId === domainId);
  }

  /**
   * 搜索概念
   */
  searchConcepts(query: string, limit: number = 10): ConceptNode[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.state.concepts.values())
      .filter(c => 
        c.name.toLowerCase().includes(lowerQuery) ||
        c.description.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => b.activation - a.activation)
      .slice(0, limit);
  }

  /**
   * 获取知识图谱概览
   */
  getOverview(): {
    totalConcepts: number;
    totalEdges: number;
    totalDomains: number;
    topDomains: Array<{ name: string; count: number; maturity: number }>;
    recentConcepts: ConceptNode[];
    strongestConnections: Array<{ source: string; target: string; strength: number; relation: string }>;
  } {
    const topDomains = Array.from(this.state.domains.values())
      .sort((a, b) => b.conceptCount - a.conceptCount)
      .slice(0, 5)
      .map(d => ({ name: d.name, count: d.conceptCount, maturity: d.maturity }));

    const recentConcepts = Array.from(this.state.concepts.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    const strongestConnections = this.getStrongEdges(5)
      .map(e => {
        const source = this.state.concepts.get(e.sourceId);
        const target = this.state.concepts.get(e.targetId);
        return {
          source: source?.name || '',
          target: target?.name || '',
          strength: e.strength,
          relation: RELATION_DESCRIPTIONS[e.relation],
        };
      });

    return {
      totalConcepts: this.state.concepts.size,
      totalEdges: this.state.edges.size,
      totalDomains: this.state.domains.size,
      topDomains,
      recentConcepts,
      strongestConnections,
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // 从对话学习
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 从对话中提取和学习概念
   */
  learnFromDialogue(
    content: string,
    options: {
      domain?: string;
      importance?: number;
    } = {}
  ): {
    newConcepts: string[];
    reinforcedConcepts: string[];
    newConnections: string[];
  } {
    const result = {
      newConcepts: [] as string[],
      reinforcedConcepts: [] as string[],
      newConnections: [] as string[],
    };

    // 提取概念（简化实现：提取关键词）
    const concepts = this.extractConcepts(content);
    
    for (const conceptName of concepts) {
      const existing = this.findConceptByName(conceptName);
      
      if (existing) {
        this.reinforceConcept(existing.id, 0.1);
        result.reinforcedConcepts.push(conceptName);
      } else {
        this.addConcept(conceptName, options.domain || 'life', {
          importance: options.importance || 0.5,
        });
        result.newConcepts.push(conceptName);
      }
    }

    // 发现潜在关联
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        const source = this.findConceptByName(concepts[i]);
        const target = this.findConceptByName(concepts[j]);
        
        if (source && target) {
          const existingEdge = this.findEdge(source.id, target.id);
          if (!existingEdge) {
            this.addEdge(concepts[i], concepts[j], 'related_to', {
              strength: 0.3,
              confidence: 0.5,
            });
            result.newConnections.push(`${concepts[i]} <-> ${concepts[j]}`);
          }
        }
      }
    }

    // 衰减所有激活度
    this.decayActivations();

    return result;
  }

  /**
   * 从文本提取概念（简化实现）
   */
  private extractConcepts(text: string): string[] {
    // 移除常见停用词
    const stopWords = new Set([
      '的', '是', '在', '有', '和', '了', '不', '这', '我', '你', '他', '她',
      '它', '们', '着', '过', '会', '能', '要', '就', '也', '都', '但', '而',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
      'into', 'through', 'during', 'before', 'after', 'above', 'below',
      'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
      'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
    ]);

    // 分词并过滤
    const words = text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2 && !stopWords.has(word));

    // 去重
    return [...new Set(words)].slice(0, 20);
  }

  /**
   * 衰减激活度
   */
  private decayActivations(): void {
    for (const concept of this.state.concepts.values()) {
      concept.activation *= 0.95; // 每次衰减5%
      if (concept.activation < 0.1) {
        concept.activation = 0.1;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 状态管理
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 获取完整状态
   */
  getState(): KnowledgeGraphState {
    return {
      ...this.state,
      domains: new Map(this.state.domains),
      concepts: new Map(this.state.concepts),
      edges: new Map(this.state.edges),
    };
  }

  /**
   * 获取序列化状态（用于传输）
   */
  getSerializableState(): {
    domains: KnowledgeDomain[];
    concepts: ConceptNode[];
    edges: ConceptEdge[];
    clusters: KnowledgeCluster[];
    stats: KnowledgeGraphState['stats'];
    lastUpdated: number;
  } {
    return {
      domains: Array.from(this.state.domains.values()),
      concepts: Array.from(this.state.concepts.values()),
      edges: Array.from(this.state.edges.values()),
      clusters: this.state.clusters,
      stats: this.state.stats,
      lastUpdated: this.state.lastUpdated,
    };
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    const concepts = Array.from(this.state.concepts.values());
    const edges = Array.from(this.state.edges.values());
    const domains = Array.from(this.state.domains.values());

    // 计算平均连接度
    const totalConnections = concepts.reduce((sum, c) => sum + c.connectionCount, 0);
    const averageConnectivity = concepts.length > 0 
      ? totalConnections / concepts.length 
      : 0;

    // 找最强连接
    const strongestConnection = edges.length > 0 
      ? Math.max(...edges.map(e => e.strength)) 
      : 0;

    // 找最连接的概念
    const mostConnected = concepts.length > 0 
      ? concepts.reduce((a, b) => a.connectionCount > b.connectionCount ? a : b) 
      : null;

    // 领域分布
    const domainDistribution: Record<string, number> = {};
    for (const domain of domains) {
      domainDistribution[domain.id] = domain.conceptCount;
    }

    this.state.stats = {
      totalConcepts: concepts.length,
      totalEdges: edges.length,
      totalDomains: domains.length,
      averageConnectivity,
      strongestConnection,
      mostConnectedConcept: mostConnected?.name || null,
      domainDistribution,
    };

    this.state.lastUpdated = Date.now();
  }

  /**
   * 记录学习事件
   */
  private recordLearningEvent(event: ConceptLearningEvent): void {
    this.learningHistory.push(event);
    // 保留最近100条记录
    if (this.learningHistory.length > 100) {
      this.learningHistory = this.learningHistory.slice(-100);
    }
  }

  /**
   * 获取学习历史
   */
  getLearningHistory(limit: number = 20): ConceptLearningEvent[] {
    return this.learningHistory.slice(-limit);
  }

  /**
   * 生成唯一ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 导出为可视化格式
   */
  exportForVisualization(): {
    nodes: Array<{
      id: string;
      label: string;
      domain: string;
      domainColor: string;
      size: number;
      understanding: number;
      importance: number;
      activation: number;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      label: string;
      strength: number;
    }>;
    domains: Array<{
      id: string;
      name: string;
      color: string;
    }>;
  } {
    const nodes = Array.from(this.state.concepts.values()).map(c => {
      const domain = this.state.domains.get(c.domainId);
      return {
        id: c.id,
        label: c.name,
        domain: c.domainId,
        domainColor: domain?.color || '#666666',
        size: 10 + c.importance * 20 + c.connectionCount * 2,
        understanding: c.understanding,
        importance: c.importance,
        activation: c.activation,
      };
    });

    const edges = Array.from(this.state.edges.values()).map(e => ({
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      label: RELATION_DESCRIPTIONS[e.relation],
      strength: e.strength,
    }));

    const domains = Array.from(this.state.domains.values())
      .filter(d => d.conceptCount > 0)
      .map(d => ({
        id: d.id,
        name: d.name,
        color: d.color,
      }));

    return { nodes, edges, domains };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建知识图谱系统实例
 */
export function createKnowledgeGraphSystem(): KnowledgeGraphSystem {
  return new KnowledgeGraphSystem();
}
