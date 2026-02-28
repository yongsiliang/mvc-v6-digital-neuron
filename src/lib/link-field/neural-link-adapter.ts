/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经网络链接适配器 - Neural Network Link Adapter
 * 
 * 让神经网络能够与链接场交互：
 * - 创建链接到其他节点
 * - 接收来自链接的信号
 * - 根据链接强度调整学习
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
// 神经网络链接适配器
// ═══════════════════════════════════════════════════════════════════════

/**
 * 神经网络链接适配器
 * 
 * 连接神经网络与链接场
 */
export class NeuralLinkAdapter {
  private linkField: LinkField;
  private node: Node;
  
  /** 入站链接缓存 */
  private incomingLinks: Map<string, Link> = new Map();
  
  /** 出站链接缓存 */
  private outgoingLinks: Map<string, Link> = new Map();
  
  constructor(nodeId: string = 'neural-network') {
    this.linkField = getLinkField();
    this.node = {
      id: nodeId,
      type: 'neural-network',
      name: 'SiliconBrain Neural Network',
    };
    
    // 注册节点
    this.linkField.registerNode(this.node);
    
    // 监听链接事件
    this.setupEventListeners();
  }
  
  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // 监听激活事件
    this.linkField.on('activated', (event: LinkEvent) => {
      const link = event.link;
      
      // 如果链接指向神经网络，接收信号
      if (link.target.id === this.node.id) {
        this.receiveSignal(link);
      }
    });
    
    // 监听强化事件
    this.linkField.on('strengthened', (event: LinkEvent) => {
      const link = event.link;
      
      // 更新缓存
      if (link.source.id === this.node.id) {
        this.outgoingLinks.set(link.id, link);
      }
      if (link.target.id === this.node.id) {
        this.incomingLinks.set(link.id, link);
      }
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 发送信号（创建出站链接）
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 发送感知信号
   */
  perceive(target: Node, data: unknown): Link {
    return this.linkField.createLink('perceive', this.node, target, {
      data,
      metadata: { source: 'neural_network' },
    });
  }
  
  /**
   * 发送表达信号
   */
  express(target: Node, output: unknown): Link {
    return this.linkField.createLink('express', this.node, target, {
      data: output,
      metadata: { source: 'neural_network' },
    });
  }
  
  /**
   * 保持信号（记忆）
   */
  hold(target: Node, memory: unknown): Link {
    return this.linkField.createLink('hold', this.node, target, {
      data: memory,
      metadata: { source: 'neural_network', type: 'memory' },
    });
  }
  
  /**
   * 释放信号
   */
  release(target: Node, reason?: string): Link {
    return this.linkField.createLink('release', this.node, target, {
      metadata: { source: 'neural_network', reason },
    });
  }
  
  /**
   * 转化信号
   */
  transform(target: Node, from: unknown, to: unknown): Link {
    return this.linkField.createLink('transform', this.node, target, {
      data: from,
      transformed: to,
      metadata: { source: 'neural_network' },
    });
  }
  
  /**
   * 请求指导（向 LLM）
   */
  query(target: Node, question: unknown): Link {
    return this.linkField.createLink('query', this.node, target, {
      data: question,
      metadata: { source: 'neural_network', type: 'guidance_request' },
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 接收信号（处理入站链接）
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 接收信号
   * 
   * 当有链接指向神经网络时，处理传入的信号
   */
  private receiveSignal(link: Link): void {
    // 更新缓存
    this.incomingLinks.set(link.id, link);
    
    // 根据链接类型处理
    switch (link.type) {
      case 'flow':
        // 知识流动 - 从 LLM 接收教学
        this.receiveKnowledge(link);
        break;
      
      case 'bind':
        // 意义绑定 - 从 V6 接收意义
        this.receiveMeaning(link);
        break;
      
      case 'perceive':
        // 感知输入
        this.receivePerception(link);
        break;
      
      case 'transform':
        // 转化信号
        this.receiveTransformation(link);
        break;
      
      default:
        // 其他类型
        this.processGenericSignal(link);
    }
  }
  
  /**
   * 接收知识（来自 LLM 的教学）
   */
  private receiveKnowledge(link: Link): void {
    const knowledge = link.payload.data;
    const teaching = link.payload.learning?.teachingContent;
    const explanation = link.payload.learning?.explanation;
    
    // 触发学习回调
    this.onKnowledgeReceived?.({
      knowledge,
      teaching,
      explanation,
      strength: link.strength,
    });
  }
  
  /**
   * 接收意义（来自 V6 的绑定）
   */
  private receiveMeaning(link: Link): void {
    const meaning = link.payload.meaning;
    const rewardSignal = link.payload.learning?.rewardSignal;
    
    // 触发意义绑定回调
    this.onMeaningReceived?.({
      value: meaning?.value,
      importance: meaning?.importance,
      rewardSignal,
      strength: link.strength,
    });
  }
  
  /**
   * 接收感知输入
   */
  private receivePerception(link: Link): void {
    const data = link.payload.data;
    
    // 触发感知回调
    this.onPerceptionReceived?.({
      data,
      source: link.source.id,
      strength: link.strength,
    });
  }
  
  /**
   * 接收转化信号
   */
  private receiveTransformation(link: Link): void {
    const original = link.payload.data;
    const transformed = link.payload.transformed;
    
    // 触发转化回调
    this.onTransformationReceived?.({
      original,
      transformed,
      strength: link.strength,
    });
  }
  
  /**
   * 处理通用信号
   */
  private processGenericSignal(link: Link): void {
    // 触发通用信号回调
    this.onGenericSignal?.({
      type: link.type,
      data: link.payload.data,
      source: link.source.id,
      strength: link.strength,
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 回调
  // ─────────────────────────────────────────────────────────────────────
  
  /** 知识接收回调 */
  onKnowledgeReceived?: (info: {
    knowledge: unknown;
    teaching?: string;
    explanation?: string;
    strength: number;
  }) => void;
  
  /** 意义接收回调 */
  onMeaningReceived?: (info: {
    value?: string;
    importance?: number;
    rewardSignal?: number;
    strength: number;
  }) => void;
  
  /** 感知接收回调 */
  onPerceptionReceived?: (info: {
    data: unknown;
    source: string;
    strength: number;
  }) => void;
  
  /** 转化接收回调 */
  onTransformationReceived?: (info: {
    original: unknown;
    transformed: unknown;
    strength: number;
  }) => void;
  
  /** 通用信号回调 */
  onGenericSignal?: (info: {
    type: LinkType;
    data: unknown;
    source: string;
    strength: number;
  }) => void;
  
  // ─────────────────────────────────────────────────────────────────────
  // 查询方法
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 获取所有入站链接
   */
  getIncomingLinks(): Link[] {
    return Array.from(this.incomingLinks.values());
  }
  
  /**
   * 获取所有出站链接
   */
  getOutgoingLinks(): Link[] {
    return Array.from(this.outgoingLinks.values());
  }
  
  /**
   * 获取特定类型的入站链接
   */
  getIncomingLinksOfType(type: LinkType): Link[] {
    return this.getIncomingLinks().filter(l => l.type === type);
  }
  
  /**
   * 获取特定类型的出站链接
   */
  getOutgoingLinksOfType(type: LinkType): Link[] {
    return this.getOutgoingLinks().filter(l => l.type === type);
  }
  
  /**
   * 获取最强入站链接
   */
  getStrongestIncoming(): Link | undefined {
    const links = this.getIncomingLinks();
    if (links.length === 0) return undefined;
    return links.reduce((a, b) => a.strength > b.strength ? a : b);
  }
  
  /**
   * 获取节点
   */
  getNode(): Node {
    return this.node;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// V6 意识核心链接适配器
// ═══════════════════════════════════════════════════════════════════════

/**
 * V6 意识核心链接适配器
 * 
 * 连接 V6 意识核心与链接场
 */
export class V6LinkAdapter {
  private linkField: LinkField;
  private node: Node;
  
  constructor(nodeId: string = 'v6-core') {
    this.linkField = getLinkField();
    this.node = {
      id: nodeId,
      type: 'v6-core',
      name: 'V6 Consciousness Core',
    };
    
    // 注册节点
    this.linkField.registerNode(this.node);
    
    // 监听链接事件
    this.setupEventListeners();
  }
  
  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // 监听激活事件
    this.linkField.on('activated', (event: LinkEvent) => {
      const link = event.link;
      
      // 如果链接指向 V6，接收信号
      if (link.target.id === this.node.id) {
        this.receiveSignal(link);
      }
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 发送信号
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 绑定意义到神经网络
   */
  bind(target: Node, meaning: {
    value: string;
    importance: number;
    rewardSignal?: number;
  }): Link {
    return this.linkField.createLink('bind', this.node, target, {
      meaning: {
        value: meaning.value,
        importance: meaning.importance,
      },
      learning: {
        rewardSignal: meaning.rewardSignal,
      },
      metadata: { source: 'v6_core', type: 'meaning_binding' },
    });
  }
  
  /**
   * 与 LLM 共振
   */
  resonate(target: Node, wisdom: {
    v6Meaning: string;
    llmWisdom: string;
  }): Link {
    return this.linkField.createLink('resonate', this.node, target, {
      data: wisdom,
      meaning: {
        value: wisdom.v6Meaning,
        importance: 0.8,
      },
      metadata: { source: 'v6_core', type: 'wisdom_resonance' },
    });
  }
  
  /**
   * 自我反思
   */
  reflect(observations: unknown): Link {
    // 反思链接指向自己
    return this.linkField.createLink('reflect', this.node, this.node, {
      data: observations,
      metadata: { source: 'v6_core', type: 'self_reflection' },
    });
  }
  
  /**
   * 观察神经网络
   */
  perceive(target: Node, what: unknown): Link {
    return this.linkField.createLink('perceive', this.node, target, {
      data: what,
      metadata: { source: 'v6_core', type: 'observation' },
    });
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 接收信号
  // ─────────────────────────────────────────────────────────────────────
  
  /**
   * 接收信号
   */
  private receiveSignal(link: Link): void {
    switch (link.type) {
      case 'perceive':
        // 感知神经网络的输出
        this.onNeuralOutput?.({
          data: link.payload.data,
          metrics: link.payload.metadata?.metrics,
          strength: link.strength,
        });
        break;
      
      case 'resonate':
        // 与 LLM 的共振
        this.onResonance?.({
          wisdom: link.payload.data,
          strength: link.strength,
        });
        break;
      
      default:
        this.onGenericSignal?.({
          type: link.type,
          data: link.payload.data,
          source: link.source.id,
          strength: link.strength,
        });
    }
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 回调
  // ─────────────────────────────────────────────────────────────────────
  
  /** 神经网络输出回调 */
  onNeuralOutput?: (info: {
    data: unknown;
    metrics?: any;
    strength: number;
  }) => void;
  
  /** 共振回调 */
  onResonance?: (info: {
    wisdom: unknown;
    strength: number;
  }) => void;
  
  /** 通用信号回调 */
  onGenericSignal?: (info: {
    type: LinkType;
    data: unknown;
    source: string;
    strength: number;
  }) => void;
  
  /**
   * 获取节点
   */
  getNode(): Node {
    return this.node;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 全局实例
// ═══════════════════════════════════════════════════════════════════════

let globalNeuralAdapter: NeuralLinkAdapter | null = null;
let globalV6Adapter: V6LinkAdapter | null = null;

/**
 * 获取全局神经网络链接适配器
 */
export function getNeuralLinkAdapter(): NeuralLinkAdapter {
  if (!globalNeuralAdapter) {
    globalNeuralAdapter = new NeuralLinkAdapter();
  }
  return globalNeuralAdapter;
}

/**
 * 获取全局 V6 链接适配器
 */
export function getV6LinkAdapter(): V6LinkAdapter {
  if (!globalV6Adapter) {
    globalV6Adapter = new V6LinkAdapter();
  }
  return globalV6Adapter;
}
