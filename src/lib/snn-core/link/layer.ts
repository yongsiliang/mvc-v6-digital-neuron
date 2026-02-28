/**
 * ═══════════════════════════════════════════════════════════════════════
 * 链接层实现
 * 
 * 链接 = 脉冲的稳定模式
 * 
 * 职责：
 * 1. 提供语义链接 API (bind, flow, hold, inhibit)
 * 2. 将链接映射到 SNN 突触
 * 3. 从 SNN 模式中发现涌现的链接
 * 4. 管理链接的生命周期
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { SpikingNeuralNetwork } from '../snn';
import type { V6Observer } from '../v6';
import type { NeuronId, SynapseId } from '../types';
import type {
  ConceptId,
  Link,
  LinkType,
  LinkGroup,
  LinkLayerConfig,
  EmergedLinkCandidate
} from './types';
import { LINK_SYNAPSE_RULES, DEFAULT_LINK_CONFIG } from './types';

/**
 * 链接层
 */
export class LinkLayer {
  private snn: SpikingNeuralNetwork;
  private v6: V6Observer;
  private config: LinkLayerConfig;
  
  // 概念到神经元的映射（来自编码器）
  private conceptNeurons: Map<ConceptId, NeuronId[]> = new Map();
  
  // 所有链接
  private links: Map<string, Link> = new Map();
  
  // 概念到链接的索引
  private conceptLinks: Map<ConceptId, Set<string>> = new Map();
  
  // 共激活统计（用于涌现检测）
  private coActivationStats: Map<string, {
    count: number;
    correlation: number;
    sequential: number;  // 正=source先，负=target先
  }> = new Map();
  
  constructor(
    snn: SpikingNeuralNetwork,
    v6: V6Observer,
    config: Partial<LinkLayerConfig> = {}
  ) {
    this.snn = snn;
    this.v6 = v6;
    this.config = { ...DEFAULT_LINK_CONFIG, ...config };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 核心 API：语义链接
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 绑定两个概念（持久关联）
   * 
   * bind('猫', '宠物') → 猫 是一种宠物
   * bind('红色', '温暖') → 红色 让人感到温暖
   */
  bind(source: ConceptId, target: ConceptId, strength: number = 1.0): Link {
    return this.createLink('bind', source, target, strength, 'explicit');
  }
  
  /**
   * 创建信息流（定向传递）
   * 
   * flow('问题', '思考', '答案') → 问题 → 思考 → 答案
   * flow('输入', '处理', '输出') → 数据处理流水线
   */
  flow(...concepts: ConceptId[]): Link[] {
    const links: Link[] = [];
    for (let i = 0; i < concepts.length - 1; i++) {
      links.push(this.createLink('flow', concepts[i], concepts[i + 1], 0.8, 'explicit'));
    }
    return links;
  }
  
  /**
   * 保持概念状态（自环 + 持续激活）
   * 
   * hold('当前焦点') → 保持当前焦点活跃
   * hold('工作记忆') → 维持工作记忆内容
   */
  hold(concept: ConceptId, duration: number = 100): Link {
    return this.createLink('hold', concept, concept, Math.min(duration / 100, 1), 'explicit');
  }
  
  /**
   * 抑制关系（互斥）
   * 
   * inhibit('快乐', '悲伤') → 快乐时抑制悲伤
   * inhibit('开', '关') → 开关互斥
   */
  inhibit(source: ConceptId, target: ConceptId, strength: number = 1.0): Link {
    return this.createLink('inhibit', source, target, strength, 'explicit');
  }
  
  /**
   * 自由联想（弱关联）
   * 
   * associate('蓝', '海') → 蓝色让人想到海
   * associate('咖啡', '早晨') → 咖啡关联早晨
   */
  associate(source: ConceptId, target: ConceptId, strength: number = 0.3): Link {
    return this.createLink('associate', source, target, strength, 'explicit');
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 链接管理
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 查询概念的所有链接
   */
  query(concept: ConceptId): LinkGroup {
    const linkIds = this.conceptLinks.get(concept) || new Set();
    
    const group: LinkGroup = {
      concept,
      boundTo: [],
      flowsTo: [],
      holds: [],
      inhibits: [],
      associates: []
    };
    
    for (const id of linkIds) {
      const link = this.links.get(id);
      if (!link) continue;
      
      const other = link.source === concept ? link.target : link.source;
      
      switch (link.type) {
        case 'bind':
          group.boundTo.push({ concept: other, strength: link.strength });
          break;
        case 'flow':
          if (link.source === concept) {
            group.flowsTo.push({ concept: other, path: [link.source, link.target] });
          }
          break;
        case 'hold':
          group.holds.push({ concept: other, duration: link.strength * 100 });
          break;
        case 'inhibit':
          group.inhibits.push({ concept: other, strength: link.strength });
          break;
        case 'associate':
          group.associates.push({ concept: other, strength: link.strength });
          break;
      }
    }
    
    return group;
  }
  
  /**
   * 获取两个概念之间的链接
   */
  getLink(source: ConceptId, target: ConceptId): Link | undefined {
    const id1 = this.makeLinkId(source, target);
    const id2 = this.makeLinkId(target, source);
    return this.links.get(id1) || this.links.get(id2);
  }
  
  /**
   * 强化链接（增加强度）
   */
  reinforce(source: ConceptId, target: ConceptId): void {
    const link = this.getLink(source, target);
    if (link) {
      link.strength = Math.min(1, link.strength + this.config.learningRate.reinforce);
      link.lastActivated = Date.now();
      link.activationCount++;
      
      // 同步更新突触权重
      this.updateSynapseWeights(link);
    }
  }
  
  /**
   * 弱化链接（减少强度）
   */
  weaken(source: ConceptId, target: ConceptId): void {
    const link = this.getLink(source, target);
    if (link) {
      link.strength -= this.config.learningRate.decay;
      
      if (link.strength < this.config.pruneThreshold) {
        // 修剪链接
        this.removeLink(link.id);
      } else {
        this.updateSynapseWeights(link);
      }
    }
  }
  
  /**
   * 移除链接
   */
  remove(source: ConceptId, target: ConceptId): void {
    const link = this.getLink(source, target);
    if (link) {
      this.removeLink(link.id);
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // SNN 映射
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 注册概念到神经元的映射（由编码器调用）
   */
  registerConceptNeurons(concept: ConceptId, neurons: NeuronId[]): void {
    this.conceptNeurons.set(concept, neurons);
  }
  
  /**
   * 从 SNN 模式中发现涌现的链接
   */
  discoverLinks(): EmergedLinkCandidate[] {
    const candidates: EmergedLinkCandidate[] = [];
    const processed = new Set<string>();
    
    // 分析共激活统计
    for (const [key, stats] of this.coActivationStats) {
      if (stats.count < this.config.emergence.minCoActivation) continue;
      if (Math.abs(stats.correlation) < this.config.emergence.correlationThreshold) continue;
      
      const [source, target] = key.split('|');
      const pairKey = this.makeLinkId(source, target);
      
      if (processed.has(pairKey)) continue;
      processed.add(pairKey);
      
      // 检查是否已存在链接
      if (this.getLink(source, target)) continue;
      
      // 推断链接类型
      const inferredType = this.inferLinkType(stats);
      const confidence = this.calculateConfidence(stats);
      
      if (confidence >= this.config.emergence.confidenceThreshold) {
        candidates.push({
          source,
          target,
          evidence: {
            coActivationCount: stats.count,
            avgCorrelation: stats.correlation,
            sequentialPattern: stats.sequential !== 0,
            timeDelay: stats.sequential
          },
          inferredType,
          confidence
        });
      }
    }
    
    return candidates;
  }
  
  /**
   * 将涌现的链接候选转化为实际链接
   */
  promoteToLink(candidate: EmergedLinkCandidate): Link {
    return this.createLink(
      candidate.inferredType,
      candidate.source,
      candidate.target,
      candidate.confidence,
      'emerged'
    );
  }
  
  /**
   * 记录共激活（由 SNN 网络调用）
   */
  recordCoActivation(concept1: ConceptId, concept2: ConceptId, delay: number = 0): void {
    const key = `${concept1}|${concept2}`;
    const stats = this.coActivationStats.get(key) || {
      count: 0,
      correlation: 0,
      sequential: 0
    };
    
    stats.count++;
    stats.correlation = (stats.correlation * (stats.count - 1) + 1) / stats.count;
    stats.sequential = (stats.sequential * (stats.count - 1) + delay) / stats.count;
    
    this.coActivationStats.set(key, stats);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 内部方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 创建链接
   */
  private createLink(
    type: LinkType,
    source: ConceptId,
    target: ConceptId,
    strength: number,
    origin: 'explicit' | 'emerged' | 'taught'
  ): Link {
    const id = this.makeLinkId(source, target);
    
    // 检查是否已存在
    const existing = this.links.get(id);
    if (existing) {
      // 更新现有链接
      existing.strength = Math.max(existing.strength, strength);
      existing.lastActivated = Date.now();
      existing.activationCount++;
      return existing;
    }
    
    const link: Link = {
      id,
      type,
      source,
      target,
      strength,
      synapseIds: [],
      createdAt: Date.now(),
      lastActivated: Date.now(),
      activationCount: 1,
      origin
    };
    
    // 创建对应的突触
    link.synapseIds = this.createSynapses(link);
    
    // 存储链接
    this.links.set(id, link);
    
    // 更新索引
    this.addToIndex(source, id);
    this.addToIndex(target, id);
    
    return link;
  }
  
  /**
   * 为链接创建突触
   */
  private createSynapses(link: Link): SynapseId[] {
    const rule = LINK_SYNAPSE_RULES[link.type];
    const sourceNeurons = this.conceptNeurons.get(link.source) || [];
    const targetNeurons = this.conceptNeurons.get(link.target) || [];
    
    if (sourceNeurons.length === 0 || targetNeurons.length === 0) {
      return [];
    }
    
    const synapseIds: SynapseId[] = [];
    
    // 创建突触连接
    // 采样一些神经元对来创建突触
    const sampleSize = Math.min(5, sourceNeurons.length, targetNeurons.length);
    
    for (let i = 0; i < sampleSize; i++) {
      const pre = sourceNeurons[i % sourceNeurons.length];
      const post = targetNeurons[i % targetNeurons.length];
      
      // 通过 SNN 网络创建突触
      // 这里简化处理，实际需要调用 SNN 的方法
      const synapseId = `${pre}->${post}`;
      synapseIds.push(synapseId);
      
      // 如果是双向链接，创建反向突触
      if (rule.bidirectional && pre !== post) {
        synapseIds.push(`${post}->${pre}`);
      }
    }
    
    return synapseIds;
  }
  
  /**
   * 更新突触权重
   */
  private updateSynapseWeights(link: Link): void {
    const rule = LINK_SYNAPSE_RULES[link.type];
    const weight = rule.sign * (
      rule.weightRange.min + 
      link.strength * (rule.weightRange.max - rule.weightRange.min)
    );
    
    // 实际更新 SNN 中的突触权重
    // 这里需要 SNN 网络提供接口
    // this.snn.updateSynapseWeights(link.synapseIds, weight);
  }
  
  /**
   * 推断链接类型
   */
  private inferLinkType(stats: { count: number; correlation: number; sequential: number }): LinkType {
    // 如果有明显的序列模式 → flow
    if (Math.abs(stats.sequential) > 2) {
      return 'flow';
    }
    
    // 如果高频共激活 → bind
    if (stats.count > 20 && stats.correlation > 0.8) {
      return 'bind';
    }
    
    // 如果负相关 → inhibit
    if (stats.correlation < -0.5) {
      return 'inhibit';
    }
    
    // 默认 → associate
    return 'associate';
  }
  
  /**
   * 计算置信度
   */
  private calculateConfidence(stats: { count: number; correlation: number; sequential: number }): number {
    const countScore = Math.min(stats.count / 10, 1);
    const corrScore = Math.abs(stats.correlation);
    const seqScore = stats.sequential !== 0 ? 0.2 : 0;
    
    return (countScore * 0.3 + corrScore * 0.5 + seqScore * 0.2);
  }
  
  /**
   * 生成链接 ID
   */
  private makeLinkId(source: ConceptId, target: ConceptId): string {
    return `${source}→${target}`;
  }
  
  /**
   * 添加到索引
   */
  private addToIndex(concept: ConceptId, linkId: string): void {
    if (!this.conceptLinks.has(concept)) {
      this.conceptLinks.set(concept, new Set());
    }
    this.conceptLinks.get(concept)!.add(linkId);
  }
  
  /**
   * 移除链接
   */
  private removeLink(linkId: string): void {
    const link = this.links.get(linkId);
    if (!link) return;
    
    // 从索引中移除
    const sourceLinks = this.conceptLinks.get(link.source);
    sourceLinks?.delete(linkId);
    
    const targetLinks = this.conceptLinks.get(link.target);
    targetLinks?.delete(linkId);
    
    // 从存储中移除
    this.links.delete(linkId);
    
    // 实际删除突触（通过 SNN）
    // this.snn.removeSynapses(link.synapseIds);
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 统计与导出
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取所有链接
   */
  getAllLinks(): Link[] {
    return Array.from(this.links.values());
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    totalLinks: number;
    byType: Record<LinkType, number>;
    byOrigin: Record<string, number>;
    avgStrength: number;
  } {
    const all = this.getAllLinks();
    const byType: Record<LinkType, number> = {
      bind: 0, flow: 0, hold: 0, inhibit: 0, associate: 0
    };
    const byOrigin: Record<string, number> = { explicit: 0, emerged: 0, taught: 0 };
    let totalStrength = 0;
    
    for (const link of all) {
      byType[link.type]++;
      byOrigin[link.origin]++;
      totalStrength += link.strength;
    }
    
    return {
      totalLinks: all.length,
      byType,
      byOrigin,
      avgStrength: all.length > 0 ? totalStrength / all.length : 0
    };
  }
  
  /**
   * 导出为图谱格式
   */
  toGraph(): {
    nodes: Array<{ id: ConceptId; links: number }>;
    edges: Array<{ source: ConceptId; target: ConceptId; type: LinkType; strength: number }>;
  } {
    const nodeLinks = new Map<ConceptId, number>();
    const edges: Array<{ source: ConceptId; target: ConceptId; type: LinkType; strength: number }> = [];
    
    for (const link of this.links.values()) {
      nodeLinks.set(link.source, (nodeLinks.get(link.source) || 0) + 1);
      nodeLinks.set(link.target, (nodeLinks.get(link.target) || 0) + 1);
      
      edges.push({
        source: link.source,
        target: link.target,
        type: link.type,
        strength: link.strength
      });
    }
    
    const nodes = Array.from(nodeLinks.entries()).map(([id, links]) => ({ id, links }));
    
    return { nodes, edges };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 工厂函数
// ═══════════════════════════════════════════════════════════════════════

/**
 * 创建链接层
 */
export function createLinkLayer(
  snn: SpikingNeuralNetwork,
  v6: V6Observer,
  config?: Partial<LinkLayerConfig>
): LinkLayer {
  return new LinkLayer(snn, v6, config);
}
