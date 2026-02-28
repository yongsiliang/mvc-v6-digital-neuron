/**
 * ═══════════════════════════════════════════════════════════════════════
 * 链接生命周期管理 - Link Lifecycle
 * 
 * 管理链接的激活、传播、演化
 * 
 * 核心概念：
 * 1. 激活传播：一个链接激活可以触发相关链接的激活
 * 2. 竞争与协作：链接之间存在竞争和协作关系
 * 3. 簇的形成：相关链接形成簇，簇有自己的生命周期
 * 4. 涌现：从链接的动态交互中涌现出更高级的模式
 * 
 * ═══════════════════════════════════════════════════════════════════════
 */

import {
  Link,
  LinkType,
  LinkPayload,
  Node,
  LinkEvent,
} from './types';
import { LinkField, getLinkField } from './link-field';

// ═══════════════════════════════════════════════════════════════════════
// 激活传播
// ═══════════════════════════════════════════════════════════════════════

/**
 * 激活传播配置
 */
export interface PropagationConfig {
  /** 是否启用传播 */
  enabled: boolean;
  
  /** 传播衰减因子 */
  decayFactor: number;
  
  /** 最小传播强度 */
  minStrength: number;
  
  /** 最大传播深度 */
  maxDepth: number;
  
  /** 传播延迟（毫秒） */
  delay: number;
}

const DEFAULT_PROPAGATION_CONFIG: PropagationConfig = {
  enabled: true,
  decayFactor: 0.7,
  minStrength: 0.1,
  maxDepth: 3,
  delay: 10,
};

/**
 * 激活传播器
 * 
 * 当一个链接被激活时，自动传播到相关链接
 */
export class ActivationPropagator {
  private linkField: LinkField;
  private config: PropagationConfig;
  private propagationQueue: Array<{
    linkId: string;
    depth: number;
    strength: number;
  }> = [];
  
  constructor(config: Partial<PropagationConfig> = {}) {
    this.linkField = getLinkField();
    this.config = { ...DEFAULT_PROPAGATION_CONFIG, ...config };
  }
  
  /**
   * 从一个链接开始传播激活
   */
  propagate(linkId: string, initialStrength: number = 1): void {
    if (!this.config.enabled) return;
    
    this.propagationQueue = [{
      linkId,
      depth: 0,
      strength: initialStrength,
    }];
    
    this.processQueue();
  }
  
  /**
   * 处理传播队列
   */
  private processQueue(): void {
    while (this.propagationQueue.length > 0) {
      const item = this.propagationQueue.shift()!;
      const { linkId, depth, strength } = item;
      
      if (depth > this.config.maxDepth) continue;
      if (strength < this.config.minStrength) continue;
      
      const link = this.linkField.getLink(linkId);
      if (!link) continue;
      
      // 激活当前链接
      this.linkField.activateLink(linkId);
      
      // 找到下游链接并加入队列
      const downstreamLinks = this.linkField.getLinksFrom(link.target.id);
      
      for (const downstream of downstreamLinks) {
        // 计算传播强度
        const propagatedStrength = strength * this.config.decayFactor * downstream.strength;
        
        if (propagatedStrength >= this.config.minStrength) {
          this.propagationQueue.push({
            linkId: downstream.id,
            depth: depth + 1,
            strength: propagatedStrength,
          });
        }
      }
    }
  }
  
  /**
   * 根据链接类型确定传播策略
   */
  private getPropagationStrategy(type: LinkType): {
    shouldPropagate: boolean;
    modifier: number;
  } {
    switch (type) {
      case 'flow':
        return { shouldPropagate: true, modifier: 1.0 };
      case 'resonate':
        return { shouldPropagate: true, modifier: 1.2 }; // 共振加强传播
      case 'bind':
        return { shouldPropagate: true, modifier: 0.8 }; // 绑定稍慢
      case 'express':
        return { shouldPropagate: false, modifier: 0 }; // 表达不传播
      case 'reflect':
        return { shouldPropagate: false, modifier: 0 }; // 反思不传播
      default:
        return { shouldPropagate: true, modifier: 0.9 };
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 链接簇
// ═══════════════════════════════════════════════════════════════════════

/**
 * 链接簇
 * 
 * 相关链接形成的群体，有自己的生命周期
 */
export interface LinkCluster {
  /** 簇ID */
  id: string;
  
  /** 簇名称 */
  name: string;
  
  /** 包含的链接ID */
  linkIds: Set<string>;
  
  /** 簇的强度 */
  strength: number;
  
  /** 簇的类型（由组成链接的类型决定） */
  dominantType: LinkType;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后激活时间 */
  lastActivatedAt: number;
  
  /** 激活次数 */
  activationCount: number;
}

/**
 * 簇管理器
 * 
 * 识别和管理链接簇
 */
export class ClusterManager {
  private linkField: LinkField;
  private clusters: Map<string, LinkCluster> = new Map();
  
  constructor() {
    this.linkField = getLinkField();
  }
  
  /**
   * 识别簇
   * 
   * 使用简单的连通分量算法识别链接簇
   */
  identifyClusters(): LinkCluster[] {
    const visited = new Set<string>();
    const newClusters: LinkCluster[] = [];
    
    for (const [linkId, link] of this.getAllLinks()) {
      if (visited.has(linkId)) continue;
      
      // BFS 找连通分量
      const clusterLinks = this.findConnectedLinks(linkId, visited);
      
      if (clusterLinks.size >= 2) {
        const cluster = this.createCluster(clusterLinks);
        newClusters.push(cluster);
      }
    }
    
    return newClusters;
  }
  
  /**
   * 找到连通的链接
   */
  private findConnectedLinks(
    startLinkId: string,
    visited: Set<string>
  ): Set<string> {
    const connected = new Set<string>();
    const queue = [startLinkId];
    
    while (queue.length > 0) {
      const linkId = queue.shift()!;
      if (visited.has(linkId)) continue;
      
      const link = this.linkField.getLink(linkId);
      if (!link) continue;
      
      visited.add(linkId);
      connected.add(linkId);
      
      // 找相邻链接
      const outgoing = this.linkField.getLinksFrom(link.target.id);
      const incoming = this.linkField.getLinksTo(link.source.id);
      
      [...outgoing, ...incoming].forEach(l => {
        if (!visited.has(l.id)) {
          queue.push(l.id);
        }
      });
    }
    
    return connected;
  }
  
  /**
   * 创建簇
   */
  private createCluster(linkIds: Set<string>): LinkCluster {
    const links = Array.from(linkIds)
      .map(id => this.linkField.getLink(id)!)
      .filter(Boolean);
    
    // 计算主导类型
    const typeCounts = new Map<LinkType, number>();
    links.forEach(l => {
      typeCounts.set(l.type, (typeCounts.get(l.type) || 0) + 1);
    });
    
    let dominantType: LinkType = 'flow';
    let maxCount = 0;
    typeCounts.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    });
    
    // 计算簇强度
    const avgStrength = links.reduce((sum, l) => sum + l.strength, 0) / links.length;
    
    const cluster: LinkCluster = {
      id: `cluster_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${dominantType}_cluster`,
      linkIds,
      strength: avgStrength,
      dominantType,
      createdAt: Date.now(),
      lastActivatedAt: Date.now(),
      activationCount: 0,
    };
    
    this.clusters.set(cluster.id, cluster);
    
    return cluster;
  }
  
  /**
   * 获取所有链接
   */
  private getAllLinks(): Iterable<[string, Link]> {
    return [] as unknown as Iterable<[string, Link]>;
  }
  
  /**
   * 激活簇
   */
  activateCluster(clusterId: string): void {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return;
    
    cluster.lastActivatedAt = Date.now();
    cluster.activationCount++;
    
    // 激活簇内所有链接
    for (const linkId of cluster.linkIds) {
      this.linkField.activateLink(linkId);
    }
  }
  
  /**
   * 获取簇
   */
  getCluster(clusterId: string): LinkCluster | undefined {
    return this.clusters.get(clusterId);
  }
  
  /**
   * 获取所有簇
   */
  getAllClusters(): LinkCluster[] {
    return Array.from(this.clusters.values());
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 链接演化引擎
// ═══════════════════════════════════════════════════════════════════════

/**
 * 演化策略
 */
export interface EvolutionStrategy {
  /** 策略名称 */
  name: string;
  
  /** 条件检查 */
  condition: (link: Link, field: LinkField) => boolean;
  
  /** 执行动作 */
  action: (link: Link, field: LinkField) => void;
}

/**
 * 链接演化引擎
 * 
 * 根据规则自动演化链接
 */
export class LinkEvolutionEngine {
  private linkField: LinkField;
  private strategies: EvolutionStrategy[] = [];
  
  constructor() {
    this.linkField = getLinkField();
    this.initDefaultStrategies();
  }
  
  /**
   * 初始化默认演化策略
   */
  private initDefaultStrategies(): void {
    // 策略1：弱链接消亡
    this.addStrategy({
      name: 'weak-link-death',
      condition: (link) => link.strength < 0.1 && link.activationCount < 3,
      action: (link, field) => {
        field.killLink(link.id, 'evolution_weak_link');
      },
    });
    
    // 策略2：活跃链接强化
    this.addStrategy({
      name: 'active-link-strengthen',
      condition: (link) => link.activationCount > 10 && link.strength < 0.9,
      action: (link, field) => {
        field.strengthenLink(link.id, 0.1);
      },
    });
    
    // 策略3：长期休眠链接释放
    this.addStrategy({
      name: 'dormant-link-release',
      condition: (link) => {
        const dormantTime = Date.now() - link.lastActivatedAt;
        return dormantTime > 24 * 60 * 60 * 1000; // 24小时
      },
      action: (link, field) => {
        // 创建一个 release 链接标记释放
        field.createLink('release', link.source, link.target, {
          metadata: { reason: 'long_dormant' },
        });
        field.weakenLink(link.id, 0.2, 'long_dormant');
      },
    });
    
    // 策略4：共振链接簇化
    this.addStrategy({
      name: 'resonate-cluster',
      condition: (link) => {
        return link.type === 'resonate' && link.strength > 0.8;
      },
      action: (link, field) => {
        // 创建高阶链接记录这个强共振
        field.createHigherOrderLink('hold', link.id, {
          metadata: { reason: 'strong_resonance' },
        });
      },
    });
  }
  
  /**
   * 添加策略
   */
  addStrategy(strategy: EvolutionStrategy): void {
    this.strategies.push(strategy);
  }
  
  /**
   * 执行一轮演化
   */
  evolve(): {
    evaluated: number;
    actions: number;
    details: Array<{ strategy: string; linkId: string }>;
  } {
    const stats = {
      evaluated: 0,
      actions: 0,
      details: [] as Array<{ strategy: string; linkId: string }>,
    };
    
    // 获取链接场快照
    const snapshot = this.linkField.getSnapshot();
    
    for (const link of snapshot.links) {
      stats.evaluated++;
      
      for (const strategy of this.strategies) {
        try {
          if (strategy.condition(link, this.linkField)) {
            strategy.action(link, this.linkField);
            stats.actions++;
            stats.details.push({
              strategy: strategy.name,
              linkId: link.id,
            });
          }
        } catch (error) {
          console.error(`Evolution strategy error:`, error);
        }
      }
    }
    
    return stats;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 链接生命周期管理器
// ═══════════════════════════════════════════════════════════════════════

/**
 * 链接生命周期管理器
 * 
 * 统一管理激活传播、簇管理和演化
 */
export class LinkLifecycleManager {
  private propagator: ActivationPropagator;
  private clusterManager: ClusterManager;
  private evolutionEngine: LinkEvolutionEngine;
  private linkField: LinkField;
  
  constructor() {
    this.linkField = getLinkField();
    this.propagator = new ActivationPropagator();
    this.clusterManager = new ClusterManager();
    this.evolutionEngine = new LinkEvolutionEngine();
  }
  
  /**
   * 激活链接并传播
   */
  activate(linkId: string, propagate: boolean = true): void {
    this.linkField.activateLink(linkId);
    
    if (propagate) {
      this.propagator.propagate(linkId);
    }
  }
  
  /**
   * 创建并激活链接
   */
  createAndActivate(
    type: LinkType,
    source: Node,
    target: Node,
    payload?: LinkPayload
  ): Link {
    const link = this.linkField.createLink(type, source, target, payload);
    this.activate(link.id, true);
    return link;
  }
  
  /**
   * 识别簇
   */
  identifyClusters(): LinkCluster[] {
    return this.clusterManager.identifyClusters();
  }
  
  /**
   * 执行演化
   */
  evolve(): ReturnType<LinkEvolutionEngine['evolve']> {
    return this.evolutionEngine.evolve();
  }
  
  /**
   * 获取链接场统计
   */
  getStats() {
    return this.linkField.getStats();
  }
  
  /**
   * 获取传播器
   */
  getPropagator(): ActivationPropagator {
    return this.propagator;
  }
  
  /**
   * 获取簇管理器
   */
  getClusterManager(): ClusterManager {
    return this.clusterManager;
  }
  
  /**
   * 获取演化引擎
   */
  getEvolutionEngine(): LinkEvolutionEngine {
    return this.evolutionEngine;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 全局实例
// ═══════════════════════════════════════════════════════════════════════

let globalLifecycleManager: LinkLifecycleManager | null = null;

/**
 * 获取全局生命周期管理器
 */
export function getLinkLifecycleManager(): LinkLifecycleManager {
  if (!globalLifecycleManager) {
    globalLifecycleManager = new LinkLifecycleManager();
  }
  return globalLifecycleManager;
}
