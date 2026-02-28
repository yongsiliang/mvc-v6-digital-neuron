/**
 * ═══════════════════════════════════════════════════════════════════════
 * 规律网络 (Law Network)
 * 
 * 核心思想：
 * - 规律是模式之间的拓扑关系
 * - 连接强度表示模式共现或因果的概率
 * - 网络的社区结构对应不同的规律领域
 * - 通过网络分析发现抽象规律
 * 
 * 灵感来源：
 * - 复杂网络理论：小世界、无标度网络
 * - 因果推断：格兰杰因果、结构方程模型
 * - 图论：社区发现、中心性分析
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type { PatternAttractor, PatternType } from './pattern-attractor';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 规律边类型
 */
export type LawEdgeType = 
  | 'sequence'      // 顺序：A 后通常跟着 B
  | 'alternative'   // 替代：A 或 B，不共存
  | 'correlation'   // 相关：A 和 B 经常一起出现
  | 'causation'     // 因果：A 导致 B
  | 'precondition'; // 前提：A 是 B 的前提条件

/**
 * 规律边
 */
export interface LawEdge {
  id: string;
  source: string;
  target: string;
  type: LawEdgeType;
  weight: number;
  description: string;
  
  // 统计证据
  evidence: {
    cooccurrence: number;      // 共现次数
    conditionalProb: number;   // P(target|source)
    reverseProb: number;       // P(source|target)
    confidence: number;
    lift: number;              // 提升度：P(A,B)/P(A)P(B)
  };
  
  // 时间信息
  avgTimeGap: number;         // 平均时间间隔（毫秒）
  timeGapVariance: number;    // 时间间隔方差
  
  createdAt: number;
  lastUpdated: number;
}

/**
 * 抽象规律
 */
export interface AbstractLaw {
  id: string;
  abstraction: string;          // 抽象表述
  sourcePatterns: string[];     // 来源模式ID
  sourceEdges: string[];        // 来源边ID
  
  // 规律属性
  scope: string[];              // 适用范围
  conditions: string[];         // 适用条件
  exceptions: string[];         // 例外情况
  
  // 统计
  significance: number;         // 显著性
  support: number;              // 支持度
  confidence: number;           // 置信度
  
  // 演化
  createdAt: number;
  validationCount: number;
  applicationCount: number;
}

/**
 * 网络社区
 */
export interface NetworkCommunity {
  id: string;
  memberIds: string[];
  theme: string;                // 社区主题
  cohesion: number;             // 内聚度
  bridgeNodes: string[];        // 桥接节点
}

/**
 * 网络拓扑
 */
export interface NetworkTopology {
  communities: NetworkCommunity[];
  hubs: string[];               // 中心节点
  bridges: string[];            // 桥接节点
  diameter: number;             // 网络直径
  avgPathLength: number;        // 平均路径长度
  clusteringCoeff: number;      // 聚类系数
}

/**
 * 规律发现结果
 */
export interface LawDiscoveryResult {
  newEdges: LawEdge[];
  newAbstractLaws: AbstractLaw[];
  updatedEdges: string[];
  removedEdges: string[];
}

// ─────────────────────────────────────────────────────────────────────
// 规律网络
// ─────────────────────────────────────────────────────────────────────

/**
 * 规律网络
 */
export class LawNetwork {
  /** 节点：模式ID */
  private nodes: Set<string> = new Set();
  
  /** 边：规律 */
  private edges: Map<string, LawEdge> = new Map();
  
  /** 邻接表 */
  private adjacency: Map<string, Set<string>> = new Map();
  
  /** 抽象规律 */
  private abstractLaws: Map<string, AbstractLaw> = new Map();
  
  /** 社区结构 */
  private communities: NetworkCommunity[] = [];
  
  /** 拓扑缓存 */
  private topologyCache: NetworkTopology | null = null;
  
  // ══════════════════════════════════════════════════════════════════
  // 节点管理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 添加节点
   */
  addNode(patternId: string): void {
    this.nodes.add(patternId);
    if (!this.adjacency.has(patternId)) {
      this.adjacency.set(patternId, new Set());
    }
    this.topologyCache = null;
  }
  
  /**
   * 移除节点
   */
  removeNode(patternId: string): void {
    this.nodes.delete(patternId);
    
    // 移除相关边
    const edgesToRemove: string[] = [];
    for (const [id, edge] of this.edges) {
      if (edge.source === patternId || edge.target === patternId) {
        edgesToRemove.push(id);
      }
    }
    edgesToRemove.forEach(id => this.removeEdge(id));
    
    // 移除邻接
    this.adjacency.delete(patternId);
    for (const neighbors of this.adjacency.values()) {
      neighbors.delete(patternId);
    }
    
    this.topologyCache = null;
  }
  
  /**
   * 获取节点数量
   */
  getNodeCount(): number {
    return this.nodes.size;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 边管理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 添加或更新边
   */
  addEdge(
    source: string,
    target: string,
    type: LawEdgeType,
    evidence: Partial<LawEdge['evidence']> = {}
  ): LawEdge {
    const edgeId = `${source}:${target}`;
    
    let edge = this.edges.get(edgeId);
    
    if (edge) {
      // 更新现有边
      edge.weight = this.calculateWeight(edge.evidence);
      edge.lastUpdated = Date.now();
      
      // 更新证据
      Object.assign(edge.evidence, evidence);
    } else {
      // 创建新边
      edge = {
        id: edgeId,
        source,
        target,
        type,
        weight: 0.5,
        description: this.generateEdgeDescription(source, target, type),
        evidence: {
          cooccurrence: evidence.cooccurrence || 1,
          conditionalProb: evidence.conditionalProb || 0.5,
          reverseProb: evidence.reverseProb || 0,
          confidence: evidence.confidence || 0.5,
          lift: evidence.lift || 1,
        },
        avgTimeGap: 0,
        timeGapVariance: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };
      
      this.edges.set(edgeId, edge);
      
      // 更新邻接
      if (!this.adjacency.has(source)) {
        this.adjacency.set(source, new Set());
      }
      this.adjacency.get(source)!.add(target);
    }
    
    this.topologyCache = null;
    return edge;
  }
  
  /**
   * 移除边
   */
  removeEdge(edgeId: string): void {
    const edge = this.edges.get(edgeId);
    if (!edge) return;
    
    this.edges.delete(edgeId);
    
    const neighbors = this.adjacency.get(edge.source);
    if (neighbors) {
      neighbors.delete(edge.target);
    }
    
    this.topologyCache = null;
  }
  
  /**
   * 获取边
   */
  getEdge(source: string, target: string): LawEdge | undefined {
    return this.edges.get(`${source}:${target}`);
  }
  
  /**
   * 获取所有边
   */
  getAllEdges(): LawEdge[] {
    return Array.from(this.edges.values());
  }
  
  /**
   * 获取节点的出边
   */
  getOutEdges(nodeId: string): LawEdge[] {
    const result: LawEdge[] = [];
    for (const edge of this.edges.values()) {
      if (edge.source === nodeId) {
        result.push(edge);
      }
    }
    return result;
  }
  
  /**
   * 获取节点的入边
   */
  getInEdges(nodeId: string): LawEdge[] {
    const result: LawEdge[] = [];
    for (const edge of this.edges.values()) {
      if (edge.target === nodeId) {
        result.push(edge);
      }
    }
    return result;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 规律发现
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 从模式序列发现规律
   */
  discoverFromPatterns(
    patterns: PatternAttractor[],
    sequences: Array<{ patternIds: string[]; timestamps: number[] }>
  ): LawDiscoveryResult {
    const result: LawDiscoveryResult = {
      newEdges: [],
      newAbstractLaws: [],
      updatedEdges: [],
      removedEdges: [],
    };
    
    // 1. 确保所有模式都是节点
    for (const pattern of patterns) {
      this.addNode(pattern.id);
    }
    
    // 2. 分析序列，发现共现和顺序关系
    const cooccurrence = this.calculateCooccurrence(sequences);
    const transitions = this.calculateTransitions(sequences);
    
    // 3. 创建/更新边
    for (const [key, count] of cooccurrence) {
      const [source, target] = key.split(':');
      
      const conditionalProb = transitions.get(key) || 0;
      const reverseProb = transitions.get(`${target}:${source}`) || 0;
      
      // 判断关系类型
      let type: LawEdgeType;
      if (conditionalProb > 0.6 && reverseProb < 0.3) {
        type = 'sequence';
      } else if (conditionalProb > 0.5 && reverseProb > 0.5) {
        type = 'correlation';
      } else if (conditionalProb < 0.2 && reverseProb < 0.2) {
        type = 'alternative';
      } else {
        type = 'correlation';
      }
      
      const edge = this.addEdge(source, target, type, {
        cooccurrence: count,
        conditionalProb,
        reverseProb,
        confidence: this.calculateConfidence(count, conditionalProb),
        lift: this.calculateLift(source, target, cooccurrence, sequences.length),
      });
      
      if (edge.createdAt === edge.lastUpdated) {
        result.newEdges.push(edge);
      } else {
        result.updatedEdges.push(edge.id);
      }
    }
    
    // 4. 发现因果规律
    const causalEdges = this.discoverCausalLaws();
    for (const edge of causalEdges) {
      edge.type = 'causation';
      this.edges.set(edge.id, edge);
    }
    
    // 5. 抽象规律
    const newAbstractLaws = this.discoverAbstractLaws(patterns);
    for (const law of newAbstractLaws) {
      this.abstractLaws.set(law.id, law);
      result.newAbstractLaws.push(law);
    }
    
    // 6. 清理弱边
    for (const [id, edge] of this.edges) {
      if (edge.evidence.confidence < 0.1 && edge.evidence.cooccurrence < 3) {
        this.removeEdge(id);
        result.removedEdges.push(id);
      }
    }
    
    // 7. 更新拓扑
    this.updateTopology();
    
    return result;
  }
  
  /**
   * 计算共现矩阵
   */
  private calculateCooccurrence(
    sequences: Array<{ patternIds: string[]; timestamps: number[] }>
  ): Map<string, number> {
    const cooccurrence = new Map<string, number>();
    
    for (const seq of sequences) {
      const uniquePatterns = [...new Set(seq.patternIds)];
      
      for (let i = 0; i < uniquePatterns.length; i++) {
        for (let j = i + 1; j < uniquePatterns.length; j++) {
          const key = `${uniquePatterns[i]}:${uniquePatterns[j]}`;
          cooccurrence.set(key, (cooccurrence.get(key) || 0) + 1);
        }
      }
    }
    
    return cooccurrence;
  }
  
  /**
   * 计算转移概率
   */
  private calculateTransitions(
    sequences: Array<{ patternIds: string[]; timestamps: number[] }>
  ): Map<string, number> {
    const transitions = new Map<string, number>();
    const fromCounts = new Map<string, number>();
    
    for (const seq of sequences) {
      for (let i = 0; i < seq.patternIds.length - 1; i++) {
        const from = seq.patternIds[i];
        const to = seq.patternIds[i + 1];
        const key = `${from}:${to}`;
        
        transitions.set(key, (transitions.get(key) || 0) + 1);
        fromCounts.set(from, (fromCounts.get(from) || 0) + 1);
      }
    }
    
    // 转换为概率
    for (const [key, count] of transitions) {
      const from = key.split(':')[0];
      const fromTotal = fromCounts.get(from) || 1;
      transitions.set(key, count / fromTotal);
    }
    
    return transitions;
  }
  
  /**
   * 发现因果规律
   * 
   * 使用简化的格兰杰因果思想：
   * 如果 A 的出现能预测 B 的出现，且反向不成立，则 A → B
   */
  private discoverCausalLaws(): LawEdge[] {
    const causalEdges: LawEdge[] = [];
    
    for (const edge of this.edges.values()) {
      // 已经是因果关系
      if (edge.type === 'causation') continue;
      
      const { conditionalProb, reverseProb, confidence, cooccurrence } = edge.evidence;
      
      // 因果判断条件
      // 1. P(B|A) 显著高于 P(A|B)
      // 2. 共现次数足够多
      // 3. 置信度足够高
      if (
        conditionalProb > 0.6 &&
        reverseProb < 0.3 &&
        cooccurrence >= 5 &&
        confidence > 0.5
      ) {
        // 额外检查：时间顺序
        if (edge.avgTimeGap > 0 && edge.avgTimeGap < 60000) {
          causalEdges.push(edge);
        }
      }
    }
    
    return causalEdges;
  }
  
  /**
   * 发现抽象规律
   */
  private discoverAbstractLaws(patterns: PatternAttractor[]): AbstractLaw[] {
    const laws: AbstractLaw[] = [];
    
    // 使用社区结构发现抽象规律
    const communities = this.detectCommunities(patterns);
    
    for (const community of communities) {
      if (community.memberIds.length < 3) continue;
      
      // 提取社区的共同特征
      const communityPatterns = community.memberIds
        .map(id => patterns.find(p => p.id === id))
        .filter(Boolean) as PatternAttractor[];
      
      if (communityPatterns.length < 3) continue;
      
      // 找到共同特征
      const commonDomains = this.findCommonDomains(communityPatterns);
      const commonTypes = this.findCommonTypes(communityPatterns);
      
      // 生成抽象表述
      const abstraction = this.generateAbstraction(communityPatterns, commonDomains, commonTypes);
      
      if (abstraction) {
        laws.push({
          id: uuidv4(),
          abstraction,
          sourcePatterns: community.memberIds,
          sourceEdges: this.getCommunityEdges(community.memberIds).map(e => e.id),
          scope: commonDomains,
          conditions: [],
          exceptions: [],
          significance: community.cohesion,
          support: community.memberIds.length,
          confidence: community.cohesion,
          createdAt: Date.now(),
          validationCount: 0,
          applicationCount: 0,
        });
      }
    }
    
    return laws;
  }
  
  /**
   * 检测社区
   * 
   * 使用简化的标签传播算法
   */
  private detectCommunities(patterns: PatternAttractor[]): NetworkCommunity[] {
    const communities: NetworkCommunity[] = [];
    const visited = new Set<string>();
    
    for (const pattern of patterns) {
      if (visited.has(pattern.id)) continue;
      
      // BFS 找到连通分量
      const component: string[] = [];
      const queue = [pattern.id];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current)) continue;
        
        visited.add(current);
        component.push(current);
        
        // 添加邻居
        const neighbors = this.adjacency.get(current);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
              queue.push(neighbor);
            }
          }
        }
      }
      
      if (component.length >= 2) {
        const communityPatterns = component
          .map(id => patterns.find(p => p.id === id))
          .filter(Boolean) as PatternAttractor[];
        
        communities.push({
          id: uuidv4(),
          memberIds: component,
          theme: this.inferCommunityTheme(communityPatterns),
          cohesion: this.calculateCohesion(component),
          bridgeNodes: this.findBridgeNodes(component),
        });
      }
    }
    
    this.communities = communities;
    return communities;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 查询接口
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取相关规律
   */
  getRelevantLaws(patternId: string): LawEdge[] {
    const laws: LawEdge[] = [];
    
    for (const edge of this.edges.values()) {
      if (edge.source === patternId || edge.target === patternId) {
        laws.push(edge);
      }
    }
    
    return laws.sort((a, b) => b.evidence.confidence - a.evidence.confidence);
  }
  
  /**
   * 获取后续模式
   */
  getNextPatterns(patternId: string, minProb: number = 0.3): Array<{ patternId: string; probability: number }> {
    const results: Array<{ patternId: string; probability: number }> = [];
    
    for (const edge of this.edges.values()) {
      if (edge.source === patternId && edge.evidence.conditionalProb >= minProb) {
        results.push({
          patternId: edge.target,
          probability: edge.evidence.conditionalProb,
        });
      }
    }
    
    return results.sort((a, b) => b.probability - a.probability);
  }
  
  /**
   * 获取抽象规律
   */
  getAbstractLaws(): AbstractLaw[] {
    return Array.from(this.abstractLaws.values());
  }
  
  /**
   * 获取拓扑结构
   */
  getTopology(): NetworkTopology {
    if (this.topologyCache) {
      return this.topologyCache;
    }
    return this.updateTopology();
  }
  
  /**
   * 更新拓扑
   */
  private updateTopology(): NetworkTopology {
    this.topologyCache = {
      communities: this.communities,
      hubs: this.findHubs(),
      bridges: this.findBridges(),
      diameter: this.calculateDiameter(),
      avgPathLength: this.calculateAvgPathLength(),
      clusteringCoeff: this.calculateClusteringCoeff(),
    };
    return this.topologyCache;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 辅助方法
  // ══════════════════════════════════════════════════════════════════
  
  private calculateWeight(evidence: LawEdge['evidence']): number {
    return (
      evidence.confidence * 0.5 +
      Math.min(evidence.cooccurrence / 20, 1) * 0.3 +
      evidence.lift * 0.2
    );
  }
  
  private calculateConfidence(count: number, prob: number): number {
    // 使用 Wilson 区间下界的简化版
    const z = 1.96; // 95% 置信度
    const n = count;
    const p = prob;
    
    if (n === 0) return 0;
    
    const denominator = 1 + z * z / n;
    const center = (p + z * z / (2 * n)) / denominator;
    const margin = z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n) / denominator;
    
    return Math.max(0, center - margin);
  }
  
  private calculateLift(
    source: string, 
    target: string,
    cooccurrence: Map<string, number>,
    totalSequences: number
  ): number {
    const joint = (cooccurrence.get(`${source}:${target}`) || 0) / totalSequences;
    const pA = this.getNodeProbability(source, cooccurrence, totalSequences);
    const pB = this.getNodeProbability(target, cooccurrence, totalSequences);
    
    if (pA * pB === 0) return 1;
    return joint / (pA * pB);
  }
  
  private getNodeProbability(
    nodeId: string,
    cooccurrence: Map<string, number>,
    totalSequences: number
  ): number {
    let count = 0;
    for (const [key, c] of cooccurrence) {
      if (key.includes(nodeId)) {
        count += c;
      }
    }
    return count / Math.max(totalSequences, 1);
  }
  
  private generateEdgeDescription(source: string, target: string, type: LawEdgeType): string {
    const templates: Record<LawEdgeType, string> = {
      sequence: `${source.slice(0, 8)} 后通常执行 ${target.slice(0, 8)}`,
      alternative: `${source.slice(0, 8)} 和 ${target.slice(0, 8)} 很少同时出现`,
      correlation: `${source.slice(0, 8)} 和 ${target.slice(0, 8)} 经常一起出现`,
      causation: `${source.slice(0, 8)} 导致 ${target.slice(0, 8)}`,
      precondition: `${source.slice(0, 8)} 是 ${target.slice(0, 8)} 的前提`,
    };
    return templates[type];
  }
  
  private findCommonDomains(patterns: PatternAttractor[]): string[] {
    const domainCounts = new Map<string, number>();
    
    for (const pattern of patterns) {
      for (const domain of pattern.domains) {
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      }
    }
    
    const result: string[] = [];
    const threshold = patterns.length * 0.5;
    
    for (const [domain, count] of domainCounts) {
      if (count >= threshold) {
        result.push(domain);
      }
    }
    
    return result;
  }
  
  private findCommonTypes(patterns: PatternAttractor[]): PatternType[] {
    const typeCounts = new Map<PatternType, number>();
    
    for (const pattern of patterns) {
      typeCounts.set(pattern.type, (typeCounts.get(pattern.type) || 0) + 1);
    }
    
    const result: PatternType[] = [];
    const threshold = patterns.length * 0.5;
    
    for (const [type, count] of typeCounts) {
      if (count >= threshold) {
        result.push(type);
      }
    }
    
    return result;
  }
  
  private generateAbstraction(
    patterns: PatternAttractor[],
    domains: string[],
    types: PatternType[]
  ): string {
    if (domains.length > 0 && types.length > 0) {
      return `在${domains[0]}场景中，${types[0]}模式更可靠`;
    }
    if (domains.length > 0) {
      return `${domains[0]}相关的操作模式`;
    }
    return `包含 ${patterns.length} 个相关模式的规律`;
  }
  
  private getCommunityEdges(memberIds: string[]): LawEdge[] {
    const memberSet = new Set(memberIds);
    const edges: LawEdge[] = [];
    
    for (const edge of this.edges.values()) {
      if (memberSet.has(edge.source) && memberSet.has(edge.target)) {
        edges.push(edge);
      }
    }
    
    return edges;
  }
  
  private inferCommunityTheme(patterns: PatternAttractor[]): string {
    if (patterns.length === 0) return '未知主题';
    
    const domains = this.findCommonDomains(patterns);
    if (domains.length > 0) {
      return domains[0];
    }
    
    const types = this.findCommonTypes(patterns);
    if (types.length > 0) {
      return `${types[0]}模式群`;
    }
    
    return '混合模式群';
  }
  
  private calculateCohesion(memberIds: string[]): number {
    const memberSet = new Set(memberIds);
    let internalEdges = 0;
    let totalEdges = 0;
    
    for (const edge of this.edges.values()) {
      const sourceIn = memberSet.has(edge.source);
      const targetIn = memberSet.has(edge.target);
      
      if (sourceIn || targetIn) {
        totalEdges++;
        if (sourceIn && targetIn) {
          internalEdges++;
        }
      }
    }
    
    return totalEdges > 0 ? internalEdges / totalEdges : 0;
  }
  
  private findBridgeNodes(memberIds: string[]): string[] {
    const bridges: string[] = [];
    const memberSet = new Set(memberIds);
    
    for (const id of memberIds) {
      const neighbors = this.adjacency.get(id);
      if (!neighbors) continue;
      
      // 检查是否有连接到社区外的边
      for (const neighbor of neighbors) {
        if (!memberSet.has(neighbor)) {
          bridges.push(id);
          break;
        }
      }
    }
    
    return bridges;
  }
  
  private findHubs(): string[] {
    const hubs: string[] = [];
    const threshold = 3;
    
    for (const [nodeId, neighbors] of this.adjacency) {
      if (neighbors.size >= threshold) {
        hubs.push(nodeId);
      }
    }
    
    return hubs;
  }
  
  private findBridges(): string[] {
    const bridges: string[] = [];
    
    // 简化：连接不同社区的节点
    for (const community of this.communities) {
      bridges.push(...community.bridgeNodes);
    }
    
    return [...new Set(bridges)];
  }
  
  private calculateDiameter(): number {
    // BFS 计算最短路径，返回最大值
    let maxDistance = 0;
    
    for (const start of this.nodes) {
      const distances = new Map<string, number>();
      const queue = [[start, 0]];
      distances.set(start, 0);
      
      while (queue.length > 0) {
        const item = queue.shift()!;
        const current = item[0] as string;
        const dist = item[1] as number;
        maxDistance = Math.max(maxDistance, dist);
        
        const neighbors = this.adjacency.get(current);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!distances.has(neighbor)) {
              distances.set(neighbor, dist + 1);
              queue.push([neighbor, dist + 1] as [string, number]);
            }
          }
        }
      }
    }
    
    return maxDistance;
  }
  
  private calculateAvgPathLength(): number {
    let totalDistance = 0;
    let pathCount = 0;
    
    for (const start of this.nodes) {
      const distances = new Map<string, number>();
      const queue = [[start, 0]];
      distances.set(start, 0);
      
      while (queue.length > 0) {
        const item = queue.shift()!;
        const current = item[0] as string;
        const dist = item[1] as number;
        
        if (current !== start) {
          totalDistance += dist;
          pathCount++;
        }
        
        const neighbors = this.adjacency.get(current);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!distances.has(neighbor)) {
              distances.set(neighbor, dist + 1);
              queue.push([neighbor, dist + 1] as [string, number]);
            }
          }
        }
      }
    }
    
    return pathCount > 0 ? totalDistance / pathCount : 0;
  }
  
  private calculateClusteringCoeff(): number {
    let totalCoeff = 0;
    let nodeCount = 0;
    
    for (const nodeId of this.nodes) {
      const neighbors = Array.from(this.adjacency.get(nodeId) || []);
      if (neighbors.length < 2) continue;
      
      let triangles = 0;
      const possibleTriangles = neighbors.length * (neighbors.length - 1) / 2;
      
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          const neighborSet = this.adjacency.get(neighbors[i]);
          if (neighborSet?.has(neighbors[j])) {
            triangles++;
          }
        }
      }
      
      totalCoeff += triangles / possibleTriangles;
      nodeCount++;
    }
    
    return nodeCount > 0 ? totalCoeff / nodeCount : 0;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 状态管理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取统计信息
   */
  getStats(): {
    nodeCount: number;
    edgeCount: number;
    abstractLawCount: number;
    communityCount: number;
    avgEdgeWeight: number;
    topology: NetworkTopology | null;
  } {
    const edges = Array.from(this.edges.values());
    
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      abstractLawCount: this.abstractLaws.size,
      communityCount: this.communities.length,
      avgEdgeWeight: edges.length > 0
        ? edges.reduce((sum, e) => sum + e.weight, 0) / edges.length
        : 0,
      topology: this.topologyCache,
    };
  }
  
  /**
   * 导出状态
   */
  exportState(): string {
    return JSON.stringify({
      nodes: Array.from(this.nodes),
      edges: Array.from(this.edges.entries()),
      abstractLaws: Array.from(this.abstractLaws.entries()),
      communities: this.communities,
    });
  }
  
  /**
   * 导入状态
   */
  importState(data: string): void {
    try {
      const parsed = JSON.parse(data);
      
      this.nodes = new Set(parsed.nodes || []);
      this.edges = new Map(parsed.edges || []);
      this.abstractLaws = new Map(parsed.abstractLaws || []);
      this.communities = parsed.communities || [];
      
      // 重建邻接表
      this.adjacency.clear();
      for (const edge of this.edges.values()) {
        if (!this.adjacency.has(edge.source)) {
          this.adjacency.set(edge.source, new Set());
        }
        this.adjacency.get(edge.source)!.add(edge.target);
      }
      
      console.log(`[规律网络] 已恢复 ${this.nodes.size} 节点, ${this.edges.size} 边`);
    } catch (e) {
      console.error('[规律网络] 导入状态失败:', e);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

let networkInstance: LawNetwork | null = null;

export function createLawNetwork(): LawNetwork {
  if (!networkInstance) {
    networkInstance = new LawNetwork();
  }
  return networkInstance;
}

export function getLawNetwork(): LawNetwork | null {
  return networkInstance;
}
