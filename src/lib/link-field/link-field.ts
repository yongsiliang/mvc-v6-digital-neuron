/**
 * ═══════════════════════════════════════════════════════════════════════
 * 链接场 - Link Field
 * 
 * 核心理念：链接是存在的基本形式，链接场是链接存在的空间
 * 
 * 链接场管理所有动态链接：
 * - 创建、激活、强化、衰减、消亡
 * - 链接之间的链接（高阶链接）
 * - 链接拓扑结构
 * - 链接事件传播
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
  Link,
  LinkType,
  LinkStatus,
  LinkPayload,
  LinkEvent,
  LinkEventType,
  LinkEventListener,
  LinkFieldStats,
  LinkFieldSnapshot,
  Node,
  NodeType,
  LINK_TYPE_SEMANTICS,
} from './types';

// ═══════════════════════════════════════════════════════════════════════
// 链接场配置
// ═══════════════════════════════════════════════════════════════════════

export interface LinkFieldConfig {
  /** 最大链接数 */
  maxLinks: number;
  
  /** 全局衰减间隔（毫秒） */
  decayInterval: number;
  
  /** 死亡阈值 */
  deathThreshold: number;
  
  /** 强化增量 */
  strengthenDelta: number;
  
  /** 是否启用高阶链接 */
  enableHigherOrderLinks: boolean;
  
  /** 是否启用事件传播 */
  enableEventPropagation: boolean;
}

const DEFAULT_CONFIG: LinkFieldConfig = {
  maxLinks: 10000,
  decayInterval: 60000, // 每分钟
  deathThreshold: 0.1,
  strengthenDelta: 0.05,
  enableHigherOrderLinks: true,
  enableEventPropagation: true,
};

// ═══════════════════════════════════════════════════════════════════════
// 链接场 - 核心类
// ═══════════════════════════════════════════════════════════════════════

/**
 * 链接场
 * 
 * 管理所有动态链接的空间
 */
export class LinkField {
  private config: LinkFieldConfig;
  
  /** 所有链接 */
  private links: Map<string, Link> = new Map();
  
  /** 按类型索引 */
  private linksByType: Map<LinkType, Set<string>> = new Map();
  
  /** 按源节点索引 */
  private linksBySource: Map<string, Set<string>> = new Map();
  
  /** 按目标节点索引 */
  private linksByTarget: Map<string, Set<string>> = new Map();
  
  /** 所有节点 */
  private nodes: Map<string, Node> = new Map();
  
  /** 事件监听器 */
  private eventListeners: Map<LinkEventType, Set<LinkEventListener>> = new Map();
  
  /** 衰减定时器 */
  private decayTimer: NodeJS.Timeout | null = null;
  
  /** 场创建时间 */
  private createdAt: number;
  
  constructor(config: Partial<LinkFieldConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.createdAt = Date.now();
    
    // 初始化类型索引
    const linkTypes: LinkType[] = ['bind', 'flow', 'hold', 'release', 'transform', 'perceive', 'express', 'reflect', 'resonate'];
    linkTypes.forEach(type => {
      this.linksByType.set(type, new Set());
    });
    
    // 启动衰减定时器
    this.startDecayTimer();
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 节点管理
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 注册节点
   */
  registerNode(node: Node): void {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
      this.linksBySource.set(node.id, new Set());
      this.linksByTarget.set(node.id, new Set());
    }
  }
  
  /**
   * 获取节点
   */
  getNode(nodeId: string): Node | undefined {
    return this.nodes.get(nodeId);
  }
  
  /**
   * 获取所有节点
   */
  getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 链接创建
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 创建链接
   * 
   * 链接不是"连接两个独立的东西"，链接先于被连接者存在。
   * 创建链接是让某种潜在的关系显现。
   */
  createLink(
    type: LinkType,
    source: Node,
    target: Node,
    payload: LinkPayload = {}
  ): Link {
    // 确保节点已注册
    this.registerNode(source);
    this.registerNode(target);
    
    // 检查是否已存在相同类型的链接
    const existingLink = this.findLink(type, source.id, target.id);
    if (existingLink) {
      // 已存在，激活它
      this.activateLink(existingLink.id, payload);
      return existingLink;
    }
    
    // 检查链接数量限制
    if (this.links.size >= this.config.maxLinks) {
      // 清理最弱的链接
      this.pruneWeakest(1);
    }
    
    const semantics = LINK_TYPE_SEMANTICS[type];
    const now = Date.now();
    
    const link: Link = {
      id: `link_${type}_${source.id}_${target.id}_${now}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      source,
      target,
      strength: semantics.defaultStrength,
      status: 'dormant',
      createdAt: now,
      lastActivatedAt: now,
      activationCount: 0,
      payload,
      childLinkIds: [],
    };
    
    // 添加到索引
    this.links.set(link.id, link);
    this.linksByType.get(type)!.add(link.id);
    this.linksBySource.get(source.id)!.add(link.id);
    this.linksByTarget.get(target.id)!.add(link.id);
    
    // 发出创建事件
    this.emitEvent({
      type: 'created',
      link,
      timestamp: now,
    });
    
    return link;
  }
  
  /**
   * 查找链接
   */
  findLink(type: LinkType, sourceId: string, targetId: string): Link | undefined {
    const sourceLinks = this.linksBySource.get(sourceId);
    if (!sourceLinks) return undefined;
    
    for (const linkId of sourceLinks) {
      const link = this.links.get(linkId);
      if (link && link.type === type && link.target.id === targetId) {
        return link;
      }
    }
    
    return undefined;
  }
  
  /**
   * 获取链接
   */
  getLink(linkId: string): Link | undefined {
    return this.links.get(linkId);
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 链接激活与生命周期
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 激活链接
   * 
   * 激活是让链接"活过来"，开始传输
   */
  activateLink(linkId: string, payload?: LinkPayload): void {
    const link = this.links.get(linkId);
    if (!link) return;
    
    const previousStrength = link.strength;
    
    // 更新链接状态
    link.status = 'active';
    link.lastActivatedAt = Date.now();
    link.activationCount++;
    
    // 合并 payload
    if (payload) {
      link.payload = {
        ...link.payload,
        ...payload,
        metadata: {
          ...link.payload.metadata,
          ...payload.metadata,
        },
      };
    }
    
    // 激活时强化
    this.strengthenLink(linkId, this.config.strengthenDelta);
    
    // 发出激活事件
    this.emitEvent({
      type: 'activated',
      link,
      timestamp: link.lastActivatedAt,
      data: {
        previousStrength,
        newStrength: link.strength,
      },
    });
  }
  
  /**
   * 强化链接
   */
  strengthenLink(linkId: string, delta: number): void {
    const link = this.links.get(linkId);
    if (!link) return;
    
    const previousStrength = link.strength;
    link.strength = Math.min(1, link.strength + delta);
    link.status = 'strengthening';
    
    // 发出强化事件
    this.emitEvent({
      type: 'strengthened',
      link,
      timestamp: Date.now(),
      data: {
        previousStrength,
        newStrength: link.strength,
        delta,
      },
    });
    
    // 延迟恢复状态
    setTimeout(() => {
      if (link.status === 'strengthening') {
        link.status = 'dormant';
      }
    }, 100);
  }
  
  /**
   * 减弱链接
   */
  weakenLink(linkId: string, delta: number, reason?: string): void {
    const link = this.links.get(linkId);
    if (!link) return;
    
    const previousStrength = link.strength;
    link.strength = Math.max(0, link.strength - delta);
    link.status = 'weakening';
    
    // 发出减弱事件
    this.emitEvent({
      type: 'weakened',
      link,
      timestamp: Date.now(),
      data: {
        previousStrength,
        newStrength: link.strength,
        delta,
        reason,
      },
    });
    
    // 检查是否需要消亡
    if (link.strength < this.config.deathThreshold) {
      this.killLink(linkId, 'strength_below_threshold');
    } else {
      // 延迟恢复状态
      setTimeout(() => {
        if (link.status === 'weakening') {
          link.status = 'dormant';
        }
      }, 100);
    }
  }
  
  /**
   * 消亡链接
   */
  killLink(linkId: string, reason: string): void {
    const link = this.links.get(linkId);
    if (!link) return;
    
    link.status = 'dying';
    
    // 发出消亡事件
    this.emitEvent({
      type: 'died',
      link,
      timestamp: Date.now(),
      data: {
        reason,
      },
    });
    
    // 从索引中移除
    this.links.delete(linkId);
    this.linksByType.get(link.type)?.delete(linkId);
    this.linksBySource.get(link.source.id)?.delete(linkId);
    this.linksByTarget.get(link.target.id)?.delete(linkId);
    
    // 移除父链接中的引用
    if (link.parentLinkId) {
      const parent = this.links.get(link.parentLinkId);
      if (parent) {
        parent.childLinkIds = parent.childLinkIds.filter(id => id !== linkId);
      }
    }
  }
  
  /**
   * 转化链接
   * 
   * 改变链接的类型或 payload
   */
  transformLink(linkId: string, newType?: LinkType, newPayload?: LinkPayload): void {
    const link = this.links.get(linkId);
    if (!link) return;
    
    const oldType = link.type;
    
    // 更新类型索引
    if (newType && newType !== oldType) {
      this.linksByType.get(oldType)?.delete(linkId);
      this.linksByType.get(newType)?.add(linkId);
      link.type = newType;
    }
    
    // 更新 payload
    if (newPayload) {
      link.payload = {
        ...link.payload,
        ...newPayload,
      };
    }
    
    link.status = 'active';
    
    // 发出转化事件
    this.emitEvent({
      type: 'transformed',
      link,
      timestamp: Date.now(),
      data: {
        reason: newType ? `type_changed_from_${oldType}_to_${newType}` : 'payload_updated',
      },
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 批量操作
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 全局衰减
   * 
   * 不常用的链接会逐渐减弱
   */
  decayAll(): void {
    const now = Date.now();
    
    for (const [linkId, link] of this.links) {
      const semantics = LINK_TYPE_SEMANTICS[link.type];
      const timeSinceActivation = now - link.lastActivatedAt;
      
      // 时间越长，衰减越多
      const decayFactor = Math.min(1, timeSinceActivation / (this.config.decayInterval * 10));
      const decay = semantics.decayRate * decayFactor;
      
      if (decay > 0.001) {
        this.weakenLink(linkId, decay, 'natural_decay');
      }
    }
  }
  
  /**
   * 清理死链接
   */
  prune(): number {
    let pruned = 0;
    const threshold = this.config.deathThreshold;
    
    for (const [linkId, link] of this.links) {
      if (link.strength < threshold) {
        this.killLink(linkId, 'pruned');
        pruned++;
      }
    }
    
    return pruned;
  }
  
  /**
   * 清理最弱的 N 个链接
   */
  pruneWeakest(n: number): number {
    const sorted = Array.from(this.links.values())
      .sort((a, b) => a.strength - b.strength);
    
    let pruned = 0;
    for (const link of sorted.slice(0, n)) {
      this.killLink(link.id, 'pruned_weakest');
      pruned++;
    }
    
    return pruned;
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 查询方法
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 获取从某节点发出的链接
   */
  getLinksFrom(nodeId: string): Link[] {
    const linkIds = this.linksBySource.get(nodeId);
    if (!linkIds) return [];
    return Array.from(linkIds).map(id => this.links.get(id)!).filter(Boolean);
  }
  
  /**
   * 获取指向某节点的链接
   */
  getLinksTo(nodeId: string): Link[] {
    const linkIds = this.linksByTarget.get(nodeId);
    if (!linkIds) return [];
    return Array.from(linkIds).map(id => this.links.get(id)!).filter(Boolean);
  }
  
  /**
   * 获取某类型的所有链接
   */
  getLinksOfType(type: LinkType): Link[] {
    const linkIds = this.linksByType.get(type);
    if (!linkIds) return [];
    return Array.from(linkIds).map(id => this.links.get(id)!).filter(Boolean);
  }
  
  /**
   * 获取最强的 N 个链接
   */
  getStrongestLinks(n: number): Link[] {
    return Array.from(this.links.values())
      .sort((a, b) => b.strength - a.strength)
      .slice(0, n);
  }
  
  /**
   * 获取最近激活的 N 个链接
   */
  getRecentlyActivated(n: number): Link[] {
    return Array.from(this.links.values())
      .sort((a, b) => b.lastActivatedAt - a.lastActivatedAt)
      .slice(0, n);
  }
  
  /**
   * 获取两个节点之间的所有链接
   */
  getLinksBetween(nodeId1: string, nodeId2: string): Link[] {
    const from1 = this.getLinksFrom(nodeId1).filter(l => l.target.id === nodeId2);
    const from2 = this.getLinksFrom(nodeId2).filter(l => l.target.id === nodeId1);
    return [...from1, ...from2];
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 高阶链接
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 创建高阶链接（链接的链接）
   * 
   * 例如：一个 flow 链接可以绑定到一个 hold 链接上
   * 表示"让这个流动被记住"
   */
  createHigherOrderLink(
    type: LinkType,
    parentLinkId: string,
    payload?: LinkPayload
  ): Link | undefined {
    if (!this.config.enableHigherOrderLinks) return undefined;
    
    const parentLink = this.links.get(parentLinkId);
    if (!parentLink) return undefined;
    
    // 创建一个虚拟节点代表父链接
    const parentAsNode: Node = {
      id: `link-node:${parentLinkId}`,
      type: 'memory',
      name: `Link:${parentLink.type}`,
      state: { link: parentLink },
    };
    
    // 目标是"持久化"节点
    const memoryNode: Node = {
      id: 'memory-system',
      type: 'memory',
      name: 'Memory System',
    };
    
    const link = this.createLink(type, parentAsNode, memoryNode, payload);
    link.parentLinkId = parentLinkId;
    parentLink.childLinkIds.push(link.id);
    
    return link;
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 事件系统
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 监听事件
   */
  on(eventType: LinkEventType, listener: LinkEventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);
  }
  
  /**
   * 移除监听
   */
  off(eventType: LinkEventType, listener: LinkEventListener): void {
    this.eventListeners.get(eventType)?.delete(listener);
  }
  
  /**
   * 发出事件
   */
  private emitEvent(event: LinkEvent): void {
    if (!this.config.enableEventPropagation) return;
    
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`LinkField event listener error:`, error);
        }
      });
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 统计与快照
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 获取统计信息
   */
  getStats(): LinkFieldStats {
    const byType: Record<LinkType, number> = {
      bind: 0, flow: 0, hold: 0, release: 0, transform: 0,
      perceive: 0, express: 0, reflect: 0, resonate: 0, query: 0,
    };
    
    const byStatus: Record<LinkStatus, number> = {
      dormant: 0, active: 0, strengthening: 0, weakening: 0, dying: 0,
    };
    
    let totalStrength = 0;
    
    for (const link of this.links.values()) {
      byType[link.type]++;
      byStatus[link.status]++;
      totalStrength += link.strength;
    }
    
    const strongestLinks = this.getStrongestLinks(5).map(link => ({
      linkId: link.id,
      type: link.type,
      strength: link.strength,
    }));
    
    const recentlyActivated = this.getRecentlyActivated(5).map(link => ({
      linkId: link.id,
      type: link.type,
      activatedAt: link.lastActivatedAt,
    }));
    
    return {
      totalLinks: this.links.size,
      byType,
      byStatus,
      averageStrength: this.links.size > 0 ? totalStrength / this.links.size : 0,
      strongestLinks,
      recentlyActivated,
    };
  }
  
  /**
   * 获取快照
   */
  getSnapshot(): LinkFieldSnapshot {
    const stats = this.getStats();
    
    const topology = {
      nodes: this.getAllNodes(),
      edges: Array.from(this.links.values()).map(link => ({
        source: link.source.id,
        target: link.target.id,
        type: link.type,
        strength: link.strength,
      })),
    };
    
    return {
      timestamp: Date.now(),
      links: Array.from(this.links.values()),
      stats,
      topology,
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 生命周期
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 启动衰减定时器
   */
  private startDecayTimer(): void {
    if (this.decayTimer) return;
    
    this.decayTimer = setInterval(() => {
      this.decayAll();
    }, this.config.decayInterval);
  }
  
  /**
   * 停止衰减定时器
   */
  stopDecayTimer(): void {
    if (this.decayTimer) {
      clearInterval(this.decayTimer);
      this.decayTimer = null;
    }
  }
  
  /**
   * 销毁链接场
   */
  destroy(): void {
    this.stopDecayTimer();
    this.links.clear();
    this.nodes.clear();
    this.eventListeners.clear();
  }
  
  /**
   * 获取链接数量
   */
  get size(): number {
    return this.links.size;
  }
  
  /**
   * 获取场年龄
   */
  get age(): number {
    return Date.now() - this.createdAt;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 全局链接场实例
// ═══════════════════════════════════════════════════════════════════════

let globalLinkField: LinkField | null = null;

/**
 * 获取全局链接场
 */
export function getLinkField(): LinkField {
  if (!globalLinkField) {
    globalLinkField = new LinkField();
  }
  return globalLinkField;
}

/**
 * 重置全局链接场
 */
export function resetLinkField(): void {
  if (globalLinkField) {
    globalLinkField.destroy();
  }
  globalLinkField = null;
}
