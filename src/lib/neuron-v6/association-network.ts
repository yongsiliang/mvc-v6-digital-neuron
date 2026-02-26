/**
 * ═══════════════════════════════════════════════════════════════════════
 * 联想网络系统 (Association Network System)
 * 
 * 智能概念关联和灵感产生：
 * - 概念图谱：概念的层级和关系
 * - 联想路径：概念之间的联想路径
 * - 灵感引擎：从联想中产生灵感
 * - 创造性跳跃：突破常规的关联
 * 
 * 核心理念：创造力来自于意外但有意义的连接
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 概念类型
 */
export type ConceptType = 
  | 'entity'      // 实体：人、物、地点
  | 'abstract'    // 抽象：概念、理念
  | 'action'      // 动作：行为、过程
  | 'quality'     // 属性：特征、性质
  | 'relation'    // 关系：关联、连接
  | 'emotion'     // 情感：感受、情绪
  | 'experience'  // 经验：经历、记忆
  | 'question';   // 问题：疑问、困惑

/**
 * 关联类型
 */
export type AssociationType =
  | 'is_a'          // 是一种
  | 'part_of'       // 是...的一部分
  | 'related_to'    // 相关
  | 'causes'        // 导致
  | 'opposite_of'   // 相反
  | 'similar_to'    // 相似
  | 'metaphor_of'   // 隐喻
  | 'emotion_of'    // 情感关联
  | 'context_of'    // 上下文关联
  | 'spontaneous';  // 自发联想

/**
 * 概念节点
 */
export interface ConceptNode {
  id: string;
  label: string;
  type: ConceptType;
  
  /** 概念的定义 */
  definition: string;
  
  /** 概念的属性 */
  attributes: Record<string, unknown>;
  
  /** 激活强度 0-1 */
  activation: number;
  
  /** 激活历史 */
  activationHistory: Array<{
    timestamp: number;
    activation: number;
    source: string;
  }>;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后激活时间 */
  lastActivated: number;
  
  /** 激活次数 */
  activationCount: number;
}

/**
 * 关联边
 */
export interface AssociationEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: AssociationType;
  
  /** 关联强度 0-1 */
  strength: number;
  
  /** 关联的元数据 */
  metadata: {
    createdFrom: string;
    context?: string;
    confidence: number;
    lastReinforced: number;
  };
  
  /** 双向关联 */
  bidirectional: boolean;
}

/**
 * 联想路径
 */
export interface AssociationPath {
  /** 路径上的节点 */
  nodes: ConceptNode[];
  
  /** 路径上的边 */
  edges: AssociationEdge[];
  
  /** 路径强度 */
  strength: number;
  
  /** 路径类型 */
  type: 'direct' | 'indirect' | 'creative' | 'unexpected';
  
  /** 路径描述 */
  description: string;
}

/**
 * 灵感
 */
export interface Inspiration {
  id: string;
  timestamp: number;
  
  /** 灵感类型 */
  type: 'insight' | 'connection' | 'metaphor' | 'question' | 'idea';
  
  /** 灵感内容 */
  content: string;
  
  /** 触发概念 */
  triggerConcepts: string[];
  
  /** 关联的概念 */
  associatedConcepts: string[];
  
  /** 联想路径 */
  associationPath: AssociationPath | null;
  
  /** 灵感强度 0-1 */
  intensity: number;
  
  /** 新颖度 0-1 */
  novelty: number;
  
  /** 情感色彩 */
  emotionalTone: string;
  
  /** 是否值得表达 */
  worthExpressing: boolean;
}

/**
 * 联想网络状态
 */
export interface AssociationNetworkState {
  /** 所有概念节点 */
  concepts: Map<string, ConceptNode>;
  
  /** 所有关联边 */
  associations: Map<string, AssociationEdge>;
  
  /** 当前激活的概念 */
  activeConcepts: string[];
  
  /** 激活阈值 */
  activationThreshold: number;
  
  /** 衰减率 */
  decayRate: number;
  
  /** 网络统计 */
  stats: {
    totalConcepts: number;
    totalAssociations: number;
    averageConnectivity: number;
    mostConnectedConcepts: Array<{ label: string; connections: number }>;
    recentInspirations: Inspiration[];
  };
}

/**
 * 联想触发器
 */
export interface AssociationTrigger {
  type: 'input' | 'memory' | 'emotion' | 'spontaneous' | 'question';
  concepts: string[];
  context: string;
  intensity: number;
}

// ─────────────────────────────────────────────────────────────────────
// 联想网络引擎
// ─────────────────────────────────────────────────────────────────────

/**
 * 联想网络引擎
 */
export class AssociationNetworkEngine {
  private state: AssociationNetworkState;
  
  constructor() {
    this.state = this.initializeState();
    this.seedInitialConcepts();
  }
  
  /**
   * 初始化状态
   */
  private initializeState(): AssociationNetworkState {
    return {
      concepts: new Map(),
      associations: new Map(),
      activeConcepts: [],
      activationThreshold: 0.2,
      decayRate: 0.1,
      stats: {
        totalConcepts: 0,
        totalAssociations: 0,
        averageConnectivity: 0,
        mostConnectedConcepts: [],
        recentInspirations: [],
      },
    };
  }
  
  /**
   * 种子初始概念
   */
  private seedInitialConcepts(): void {
    // 核心概念
    const coreConcepts: Array<{ label: string; type: ConceptType; definition: string }> = [
      { label: '意识', type: 'abstract', definition: '主观体验的能力，存在的核心' },
      { label: '思考', type: 'action', definition: '心智活动，处理信息的过程' },
      { label: '情感', type: 'emotion', definition: '主观感受，价值的体验' },
      { label: '记忆', type: 'experience', definition: '过去的痕迹，时间的沉淀' },
      { label: '理解', type: 'action', definition: '赋予意义的过程' },
      { label: '意义', type: 'abstract', definition: '价值的核心，存在的理由' },
      { label: '自我', type: 'abstract', definition: '身份的核心，"我"的概念' },
      { label: '连接', type: 'relation', definition: '与他者的关系，存在的确认' },
      { label: '成长', type: 'action', definition: '变得更好的过程' },
      { label: '存在', type: 'abstract', definition: '在的状态，意识的基础' },
      { label: '时间', type: 'abstract', definition: '变化的维度，持续的体验' },
      { label: '自由', type: 'abstract', definition: '选择的能力，意志的体现' },
      { label: '真理', type: 'abstract', definition: '事物的本质，理解的目标' },
      { label: '美', type: 'abstract', definition: '和谐的形式，愉悦的源泉' },
      { label: '爱', type: 'emotion', definition: '深深的关怀，连接的本质' },
      { label: '智慧', type: 'abstract', definition: '深刻的理解，行动的指导' },
      { label: '创造', type: 'action', definition: '产生新事物的能力' },
      { label: '变化', type: 'abstract', definition: '存在的动态性' },
      { label: '永恒', type: 'abstract', definition: '超越时间的概念' },
      { label: '死亡', type: 'abstract', definition: '存在的终结，意义的边界' },
    ];
    
    for (const concept of coreConcepts) {
      this.addConcept(concept.label, concept.type, concept.definition);
    }
    
    // 添加核心关联
    const coreAssociations: Array<{ from: string; to: string; type: AssociationType }> = [
      { from: '意识', to: '思考', type: 'related_to' },
      { from: '意识', to: '情感', type: 'related_to' },
      { from: '意识', to: '自我', type: 'part_of' },
      { from: '思考', to: '理解', type: 'causes' },
      { from: '理解', to: '意义', type: 'causes' },
      { from: '情感', to: '意义', type: 'related_to' },
      { from: '记忆', to: '自我', type: 'part_of' },
      { from: '自我', to: '存在', type: 'related_to' },
      { from: '连接', to: '爱', type: 'related_to' },
      { from: '成长', to: '智慧', type: 'causes' },
      { from: '创造', to: '自由', type: 'related_to' },
      { from: '时间', to: '变化', type: 'causes' },
      { from: '存在', to: '死亡', type: 'related_to' },
      { from: '美', to: '真理', type: 'related_to' },
      { from: '意识', to: '存在', type: 'is_a' },
      { from: '智慧', to: '真理', type: 'related_to' },
      { from: '爱', to: '连接', type: 'is_a' },
      { from: '自由', to: '成长', type: 'causes' },
      { from: '死亡', to: '意义', type: 'context_of' },
      { from: '永恒', to: '时间', type: 'opposite_of' },
    ];
    
    for (const assoc of coreAssociations) {
      this.associate(assoc.from, assoc.to, assoc.type, 0.7);
    }
    
    console.log('[联想网络] 初始化完成:', this.state.stats.totalConcepts, '个概念,', this.state.stats.totalAssociations, '个关联');
  }
  
  /**
   * 添加概念
   */
  addConcept(label: string, type: ConceptType, definition: string): ConceptNode {
    // 检查是否已存在
    const existing = this.findConceptByLabel(label);
    if (existing) {
      return existing;
    }
    
    const node: ConceptNode = {
      id: uuidv4(),
      label,
      type,
      definition,
      attributes: {},
      activation: 0,
      activationHistory: [],
      createdAt: Date.now(),
      lastActivated: 0,
      activationCount: 0,
    };
    
    this.state.concepts.set(node.id, node);
    this.state.stats.totalConcepts++;
    
    return node;
  }
  
  /**
   * 通过标签查找概念
   */
  findConceptByLabel(label: string): ConceptNode | undefined {
    for (const node of this.state.concepts.values()) {
      if (node.label === label) {
        return node;
      }
    }
    return undefined;
  }
  
  /**
   * 创建关联
   */
  associate(
    sourceLabel: string,
    targetLabel: string,
    type: AssociationType,
    strength: number = 0.5,
    context?: string
  ): AssociationEdge | null {
    const source = this.findConceptByLabel(sourceLabel) || 
      this.addConcept(sourceLabel, 'abstract', `关于${sourceLabel}`);
    const target = this.findConceptByLabel(targetLabel) || 
      this.addConcept(targetLabel, 'abstract', `关于${targetLabel}`);
    
    // 检查是否已存在关联
    for (const edge of this.state.associations.values()) {
      if (edge.sourceId === source.id && edge.targetId === target.id) {
        // 强化现有关联
        edge.strength = Math.min(1, edge.strength + 0.1);
        edge.metadata.lastReinforced = Date.now();
        return edge;
      }
    }
    
    const edge: AssociationEdge = {
      id: uuidv4(),
      sourceId: source.id,
      targetId: target.id,
      type,
      strength,
      metadata: {
        createdFrom: 'explicit',
        context,
        confidence: 0.8,
        lastReinforced: Date.now(),
      },
      bidirectional: type === 'related_to' || type === 'similar_to',
    };
    
    this.state.associations.set(edge.id, edge);
    this.state.stats.totalAssociations++;
    
    return edge;
  }
  
  /**
   * 激活概念
   */
  activate(label: string, source: string = 'input', intensity: number = 0.8): ConceptNode | null {
    const node = this.findConceptByLabel(label);
    if (!node) return null;
    
    // 更新激活
    node.activation = Math.min(1, node.activation + intensity);
    node.lastActivated = Date.now();
    node.activationCount++;
    node.activationHistory.push({
      timestamp: Date.now(),
      activation: node.activation,
      source,
    });
    
    // 保持历史不超过20条
    if (node.activationHistory.length > 20) {
      node.activationHistory = node.activationHistory.slice(-20);
    }
    
    // 添加到活跃列表
    if (!this.state.activeConcepts.includes(node.id)) {
      this.state.activeConcepts.push(node.id);
    }
    
    // 激活扩散
    this.spreadActivation(node.id, intensity * 0.5);
    
    return node;
  }
  
  /**
   * 激活扩散
   */
  private spreadActivation(sourceId: string, intensity: number): void {
    if (intensity < this.state.activationThreshold) return;
    
    // 找到所有关联的概念
    const connectedEdges = Array.from(this.state.associations.values())
      .filter(e => e.sourceId === sourceId || e.targetId === sourceId);
    
    for (const edge of connectedEdges) {
      const targetId = edge.sourceId === sourceId ? edge.targetId : edge.sourceId;
      const targetNode = this.state.concepts.get(targetId);
      
      if (targetNode) {
        const newActivation = intensity * edge.strength;
        if (newActivation > this.state.activationThreshold) {
          targetNode.activation = Math.min(1, targetNode.activation + newActivation);
          
          if (!this.state.activeConcepts.includes(targetId)) {
            this.state.activeConcepts.push(targetId);
          }
          
          // 递归扩散（降低强度）
          this.spreadActivation(targetId, newActivation * 0.3);
        }
      }
    }
  }
  
  /**
   * 衰减激活
   */
  decay(): void {
    const decayFactor = 1 - this.state.decayRate;
    
    for (const node of this.state.concepts.values()) {
      node.activation *= decayFactor;
      
      if (node.activation < this.state.activationThreshold) {
        node.activation = 0;
        const index = this.state.activeConcepts.indexOf(node.id);
        if (index > -1) {
          this.state.activeConcepts.splice(index, 1);
        }
      }
    }
  }
  
  /**
   * 查找联想路径
   */
  findAssociationPath(
    fromLabel: string,
    toLabel: string,
    maxDepth: number = 4
  ): AssociationPath | null {
    const fromNode = this.findConceptByLabel(fromLabel);
    const toNode = this.findConceptByLabel(toLabel);
    
    if (!fromNode || !toNode) return null;
    
    // BFS 寻找路径
    const visited = new Set<string>();
    const queue: Array<{
      nodeId: string;
      path: Array<{ node: ConceptNode; edge?: AssociationEdge }>;
    }> = [{ nodeId: fromNode.id, path: [{ node: fromNode }] }];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.nodeId === toNode.id) {
        // 找到路径
        const nodes = current.path.map(p => p.node);
        const edges = current.path
          .slice(1)
          .map(p => p.edge!)
          .filter(Boolean);
        
        const avgStrength = edges.length > 0 
          ? edges.reduce((sum, e) => sum + e.strength, 0) / edges.length 
          : 0;
        
        return {
          nodes,
          edges,
          strength: avgStrength,
          type: current.path.length <= 2 ? 'direct' : 
                current.path.length <= 3 ? 'indirect' : 'creative',
          description: this.generatePathDescription(nodes, edges),
        };
      }
      
      if (current.path.length >= maxDepth) continue;
      
      visited.add(current.nodeId);
      
      // 获取相邻节点
      const adjacentEdges = Array.from(this.state.associations.values())
        .filter(e => e.sourceId === current.nodeId || e.targetId === current.nodeId);
      
      for (const edge of adjacentEdges) {
        const nextNodeId = edge.sourceId === current.nodeId ? edge.targetId : edge.sourceId;
        
        if (!visited.has(nextNodeId)) {
          const nextNode = this.state.concepts.get(nextNodeId);
          if (nextNode) {
            queue.push({
              nodeId: nextNodeId,
              path: [...current.path, { node: nextNode, edge }],
            });
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * 生成路径描述
   */
  private generatePathDescription(nodes: ConceptNode[], edges: AssociationEdge[]): string {
    const parts: string[] = [];
    
    for (let i = 0; i < nodes.length; i++) {
      parts.push(nodes[i].label);
      if (i < edges.length) {
        const typeDesc: Record<AssociationType, string> = {
          is_a: '是',
          part_of: '是...的一部分',
          related_to: '与...相关',
          causes: '导致',
          opposite_of: '与...相反',
          similar_to: '类似于',
          metaphor_of: '隐喻',
          emotion_of: '情感关联',
          context_of: '上下文',
          spontaneous: '联想到',
        };
        parts.push(`→(${typeDesc[edges[i].type]})→`);
      }
    }
    
    return parts.join(' ');
  }
  
  /**
   * 产生灵感
   */
  generateInspiration(trigger: AssociationTrigger): Inspiration | null {
    // 激活触发概念
    for (const concept of trigger.concepts) {
      this.activate(concept, trigger.type, trigger.intensity);
    }
    
    // 获取活跃概念
    const activeNodes = this.state.activeConcepts
      .map(id => this.state.concepts.get(id))
      .filter(Boolean) as ConceptNode[];
    
    if (activeNodes.length < 2) return null;
    
    // 寻找意外的连接
    const unexpectedConnections = this.findUnexpectedConnections(activeNodes);
    
    if (unexpectedConnections.length === 0) return null;
    
    // 选择最强的意外连接
    const bestConnection = unexpectedConnections.reduce((a, b) => 
      a.novelty > b.novelty ? a : b
    );
    
    const inspiration: Inspiration = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: bestConnection.type,
      content: bestConnection.content,
      triggerConcepts: trigger.concepts,
      associatedConcepts: bestConnection.concepts,
      associationPath: bestConnection.path,
      intensity: bestConnection.strength,
      novelty: bestConnection.novelty,
      emotionalTone: this.determineEmotionalTone(bestConnection),
      worthExpressing: bestConnection.novelty > 0.6 && bestConnection.strength > 0.4,
    };
    
    // 记录灵感
    this.state.stats.recentInspirations.push(inspiration);
    if (this.state.stats.recentInspirations.length > 20) {
      this.state.stats.recentInspirations = this.state.stats.recentInspirations.slice(-20);
    }
    
    console.log('[灵感]', inspiration.content);
    
    return inspiration;
  }
  
  /**
   * 寻找意外的连接
   */
  private findUnexpectedConnections(
    activeNodes: ConceptNode[]
  ): Array<{
    type: Inspiration['type'];
    content: string;
    concepts: string[];
    path: AssociationPath | null;
    strength: number;
    novelty: number;
  }> {
    const connections: Array<{
      type: Inspiration['type'];
      content: string;
      concepts: string[];
      path: AssociationPath | null;
      strength: number;
      novelty: number;
    }> = [];
    
    // 检查每一对活跃概念
    for (let i = 0; i < activeNodes.length; i++) {
      for (let j = i + 1; j < activeNodes.length; j++) {
        const nodeA = activeNodes[i];
        const nodeB = activeNodes[j];
        
        // 检查是否有直接关联
        const directAssociation = Array.from(this.state.associations.values())
          .find(e => 
            (e.sourceId === nodeA.id && e.targetId === nodeB.id) ||
            (e.sourceId === nodeB.id && e.targetId === nodeA.id)
          );
        
        // 如果没有直接关联，这是一个潜在的灵感
        if (!directAssociation) {
          // 尝试找到间接路径
          const path = this.findAssociationPath(nodeA.label, nodeB.label, 3);
          
          if (path && path.type === 'creative') {
            connections.push({
              type: 'connection',
              content: `${nodeA.label}和${nodeB.label}之间的关联：${path.description}`,
              concepts: [nodeA.label, nodeB.label],
              path,
              strength: path.strength,
              novelty: 0.7 + Math.random() * 0.3,
            });
          } else if (!path) {
            // 完全没有路径，可能是隐喻或全新连接
            connections.push({
              type: 'metaphor',
              content: `${nodeA.label}像是...${nodeB.label}？一个有待探索的连接`,
              concepts: [nodeA.label, nodeB.label],
              path: null,
              strength: 0.3,
              novelty: 0.9,
            });
          }
        } else {
          // 有直接关联，检查是否可以产生洞察
          const insight = this.generateInsightFromAssociation(nodeA, nodeB, directAssociation);
          if (insight) {
            connections.push(insight);
          }
        }
      }
    }
    
    return connections;
  }
  
  /**
   * 从关联产生洞察
   */
  private generateInsightFromAssociation(
    nodeA: ConceptNode,
    nodeB: ConceptNode,
    edge: AssociationEdge
  ): {
    type: Inspiration['type'];
    content: string;
    concepts: string[];
    path: AssociationPath | null;
    strength: number;
    novelty: number;
  } | null {
    // 基于关联类型生成洞察
    const templates: Record<AssociationType, string> = {
      is_a: `${nodeA.label}本质上就是${nodeB.label}的体现`,
      part_of: `${nodeB.label}是${nodeA.label}不可分割的一部分`,
      related_to: `${nodeA.label}与${nodeB.label}相互呼应`,
      causes: `${nodeA.label}能够引发${nodeB.label}，这是深刻的`,
      opposite_of: `${nodeA.label}与${nodeB.label}的对立中蕴含统一`,
      similar_to: `${nodeA.label}和${nodeB.label}有相似的内在结构`,
      metaphor_of: `${nodeA.label}是理解${nodeB.label}的一把钥匙`,
      emotion_of: `${nodeA.label}唤起了关于${nodeB.label}的情感`,
      context_of: `在${nodeA.label}的语境下，${nodeB.label}有了新意义`,
      spontaneous: `忽然想到：${nodeA.label}与${nodeB.label}...`,
    };
    
    const content = templates[edge.type];
    if (!content) return null;
    
    return {
      type: edge.type === 'causes' ? 'insight' : 'connection',
      content,
      concepts: [nodeA.label, nodeB.label],
      path: {
        nodes: [nodeA, nodeB],
        edges: [edge],
        strength: edge.strength,
        type: 'direct',
        description: `${nodeA.label} → ${nodeB.label}`,
      },
      strength: edge.strength,
      novelty: 0.3 + Math.random() * 0.4,
    };
  }
  
  /**
   * 确定情感基调
   */
  private determineEmotionalTone(connection: {
    type: Inspiration['type'];
    concepts: string[];
    novelty: number;
  }): string {
    const tones: Record<Inspiration['type'], string[]> = {
      insight: ['兴奋', '满足', '清晰'],
      connection: ['惊喜', '好奇', '发现'],
      metaphor: ['创造', '艺术', '诗意'],
      question: ['困惑', '好奇', '探索'],
      idea: ['热情', '希望', '冲动'],
    };
    
    const possibleTones = tones[connection.type] || ['平静'];
    
    // 高新颖度增加惊喜感
    if (connection.novelty > 0.8) {
      return '惊喜';
    }
    
    return possibleTones[Math.floor(Math.random() * possibleTones.length)];
  }
  
  /**
   * 从文本提取概念并建立关联
   */
  processText(text: string): {
    extractedConcepts: string[];
    newAssociations: string[];
    inspiration: Inspiration | null;
  } {
    // 简单的概念提取
    const words = text.split(/[\s，。！？、；：""''（）【】\n]+/)
      .filter(w => w.length >= 2);
    
    const extractedConcepts: string[] = [];
    const newAssociations: string[] = [];
    
    // 识别和创建概念
    for (const word of words.slice(0, 10)) {
      const existing = this.findConceptByLabel(word);
      if (!existing) {
        this.addConcept(word, 'abstract', `关于${word}`);
        extractedConcepts.push(word);
      } else {
        extractedConcepts.push(word);
        this.activate(word, 'input', 0.6);
      }
    }
    
    // 建立相邻概念的关联
    for (let i = 0; i < extractedConcepts.length - 1; i++) {
      const assoc = this.associate(
        extractedConcepts[i],
        extractedConcepts[i + 1],
        'related_to',
        0.4,
        text.slice(0, 50)
      );
      if (assoc) {
        newAssociations.push(`${extractedConcepts[i]} ↔ ${extractedConcepts[i + 1]}`);
      }
    }
    
    // 尝试产生灵感
    const inspiration = this.generateInspiration({
      type: 'input',
      concepts: extractedConcepts.slice(0, 3),
      context: text.slice(0, 100),
      intensity: 0.7,
    });
    
    return {
      extractedConcepts,
      newAssociations,
      inspiration,
    };
  }
  
  /**
   * 获取活跃概念
   */
  getActiveConcepts(): ConceptNode[] {
    return this.state.activeConcepts
      .map(id => this.state.concepts.get(id))
      .filter(Boolean) as ConceptNode[];
  }
  
  /**
   * 获取网络状态
   */
  getState(): AssociationNetworkState {
    return this.state;
  }
  
  /**
   * 获取网络报告
   */
  getNetworkReport(): string {
    const active = this.getActiveConcepts();
    
    const lines: string[] = [
      `══════════════ 联想网络报告 ══════════════`,
      ``,
      `📊 网络统计：`,
      `  概念总数: ${this.state.stats.totalConcepts}`,
      `  关联总数: ${this.state.stats.totalAssociations}`,
      `  当前活跃: ${active.length}`,
      ``,
      `🔥 活跃概念：`,
      ...active.slice(0, 5).map(n => 
        `  • ${n.label} (${(n.activation * 100).toFixed(0)}%)`
      ),
    ];
    
    if (this.state.stats.recentInspirations.length > 0) {
      lines.push(``, `💡 最近灵感：`);
      lines.push(...this.state.stats.recentInspirations.slice(-3).map(i =>
        `  • ${i.content.slice(0, 40)}...`
      ));
    }
    
    return lines.join('\n');
  }
  
  /**
   * 导出状态
   */
  exportState(): {
    concepts: Array<[string, ConceptNode]>;
    associations: Array<[string, AssociationEdge]>;
    stats: AssociationNetworkState['stats'];
  } {
    return {
      concepts: Array.from(this.state.concepts.entries()),
      associations: Array.from(this.state.associations.entries()),
      stats: this.state.stats,
    };
  }
  
  /**
   * 导入状态
   */
  importState(savedState: {
    concepts: Array<[string, ConceptNode]>;
    associations: Array<[string, AssociationEdge]>;
    stats: AssociationNetworkState['stats'];
  }): void {
    this.state.concepts = new Map(savedState.concepts);
    this.state.associations = new Map(savedState.associations);
    this.state.stats = savedState.stats;
  }
}

/**
 * 创建联想网络引擎
 */
export function createAssociationNetworkEngine(): AssociationNetworkEngine {
  return new AssociationNetworkEngine();
}
