/**
 * 内部网络
 * 
 * 黑盒层的核心：
 * - 节点管理
 * - 连接管理
 * - 输入注入
 * - 网络演化
 * - 输出读取
 * 
 * 特性：内部过程不可观察
 */

import type { 
  AttentionNode, 
  Connection, 
  NodeType,
  CompilationDepth,
  Understanding,
  BlackBoxConfig 
} from '../types';
import { Node, createNode } from './node';
import { Propagator, createPropagator } from './propagation';
import { EmergenceDetector, createEmergenceDetector } from './emergence';
import { randomVector } from '../utils/vector';
import { clamp } from '../utils/math';

const DEFAULT_CONFIG: Required<BlackBoxConfig> = {
  vectorDimension: 64,
  decayRate: 0.99,
  maxNodes: 10000,
  activationThreshold: 0.1,
};

/**
 * 内部网络
 */
export class AttentionNetwork {
  private nodes: Map<string, Node>;
  private connections: Connection[];
  private config: Required<BlackBoxConfig>;
  private propagator: Propagator;
  private emergenceDetector: EmergenceDetector;
  
  // 用于输入编码的向量
  private inputEncoder: number[];
  
  constructor(config?: Partial<BlackBoxConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.nodes = new Map();
    this.connections = [];
    
    this.propagator = createPropagator({
      decayRate: this.config.decayRate,
      activationThreshold: this.config.activationThreshold,
    });
    
    this.emergenceDetector = createEmergenceDetector({
      minActivation: this.config.activationThreshold,
    });
    
    this.inputEncoder = randomVector(this.config.vectorDimension);
  }
  
  /**
   * 注入输入
   * 
   * 将输入文本转换为网络中的节点激活
   */
  inject(input: string): void {
    // 1. 分词
    const tokens = this.tokenize(input);
    
    // 2. 为每个token创建或激活节点
    for (const token of tokens) {
      const node = this.getOrCreateNode(token);
      node.activate(1.0);
    }
    
    // 3. 创建节点间的连接
    this.createConnections(tokens);
    
    console.log(`[网络] 注入输入：${tokens.length} 个节点激活`);
  }
  
  /**
   * 网络演化
   * 
   * 核心过程：
   * 1. Attention传播
   * 2. 多头计算
   * 3. 激活衰减
   * 4. 涌现检测
   * 
   * 注意：内部过程不可观察，只有结果可见
   */
  async evolve(depth: CompilationDepth): Promise<void> {
    const result = this.propagator.propagate(
      this.nodes,
      this.connections,
      depth
    );
    
    console.log(`[网络] 演化完成：${result.iterations} 次迭代，` +
                `${result.activeNodeCount} 个活跃节点，` +
                `稳定=${result.stable}`);
  }
  
  /**
   * 读取输出
   * 
   * 从网络状态中提取理解结果
   */
  read(): Understanding {
    const activeNodes = Array.from(this.nodes.values())
      .filter(n => n.activation > this.config.activationThreshold);
    
    // 使用涌现检测器分析
    const result = this.emergenceDetector.detect(
      this.nodes,
      []
    );
    
    console.log(`[网络] 读取理解：置信度 ${result.understanding.confidence.toFixed(2)}`);
    
    return result.understanding;
  }
  
  /**
   * 学习
   * 
   * 根据输入和输出调整网络结构
   */
  learn(input: string, understanding: Understanding): void {
    // 1. 强化理解路径上的连接
    for (const nodeId of understanding.derivation) {
      const node = this.nodes.get(nodeId);
      if (node) {
        // 更新节点的Query向量，使其更接近输入编码
        node.updateVectors(
          this.inputEncoder,
          undefined,
          undefined,
          0.01
        );
      }
    }
    
    // 2. 强化相关连接
    this.reinforceConnections(understanding.derivation);
  }
  
  /**
   * 分词
   */
  private tokenize(input: string): string[] {
    // 简化的中文分词
    const tokens: string[] = [];
    
    // 按标点分割
    const sentences = input.split(/[，。！？、；：""''（）【】\s]+/);
    
    for (const sentence of sentences) {
      if (sentence.length === 0) continue;
      
      // 简单的双字组
      for (let i = 0; i < sentence.length - 1; i++) {
        const bigram = sentence.slice(i, i + 2);
        if (bigram.trim()) {
          tokens.push(bigram);
        }
      }
      
      // 单字
      for (const char of sentence) {
        if (char.trim()) {
          tokens.push(char);
        }
      }
    }
    
    // 去重
    return [...new Set(tokens)];
  }
  
  /**
   * 获取或创建节点
   */
  private getOrCreateNode(id: string, type?: NodeType): Node {
    let node = this.nodes.get(id);
    
    if (!node) {
      // 检查节点数量限制
      if (this.nodes.size >= this.config.maxNodes) {
        // 移除最不活跃的节点
        this.pruneNodes();
      }
      
      node = createNode(id, {
        vectorDimension: this.config.vectorDimension,
        type: type || this.inferNodeType(id),
      });
      
      this.nodes.set(id, node);
    }
    
    return node;
  }
  
  /**
   * 推断节点类型
   */
  private inferNodeType(id: string): NodeType {
    // 根据内容推断类型
    if (/好|坏|喜|怒|哀|乐|爱|恨/.test(id)) {
      return 'emotion';
    }
    if (/记得|回忆|过去|曾经/.test(id)) {
      return 'memory';
    }
    if (/本质|原理|洞见|发现/.test(id)) {
      return 'insight';
    }
    if (/模式|规律|规则/.test(id)) {
      return 'pattern';
    }
    return 'concept';
  }
  
  /**
   * 创建连接
   */
  private createConnections(tokens: string[]): void {
    for (let i = 0; i < tokens.length - 1; i++) {
      const from = tokens[i];
      const to = tokens[i + 1];
      
      // 检查连接是否已存在
      const existing = this.connections.find(
        c => c.from === from && c.to === to
      );
      
      if (existing) {
        // 增强权重
        existing.weight = clamp(existing.weight + 0.1, 0, 1);
        existing.lastActivated = Date.now();
      } else {
        // 创建新连接
        this.connections.push({
          from,
          to,
          weight: 0.5,
          type: 'excitatory',
          createdAt: Date.now(),
          lastActivated: Date.now(),
        });
      }
    }
  }
  
  /**
   * 强化连接
   */
  private reinforceConnections(nodeIds: string[]): void {
    for (let i = 0; i < nodeIds.length - 1; i++) {
      const from = nodeIds[i];
      const to = nodeIds[i + 1];
      
      const conn = this.connections.find(
        c => (c.from === from && c.to === to) ||
             (c.from === to && c.to === from)
      );
      
      if (conn) {
        conn.weight = clamp(conn.weight + 0.05, 0, 1);
      }
    }
  }
  
  /**
   * 清理节点
   */
  private pruneNodes(): void {
    // 找到最不活跃的节点
    const sorted = Array.from(this.nodes.entries())
      .sort((a, b) => a[1].activation - b[1].activation);
    
    // 移除10%最不活跃的节点
    const toRemove = Math.floor(this.nodes.size * 0.1);
    for (let i = 0; i < toRemove; i++) {
      const [id] = sorted[i];
      this.nodes.delete(id);
      
      // 同时移除相关连接
      this.connections = this.connections.filter(
        c => c.from !== id && c.to !== id
      );
    }
    
    console.log(`[网络] 清理 ${toRemove} 个节点`);
  }
  
  /**
   * 获取节点数量
   */
  getNodeCount(): number {
    return this.nodes.size;
  }
  
  /**
   * 获取连接数量
   */
  getConnectionCount(): number {
    return this.connections.length;
  }
  
  /**
   * 获取活跃节点数量
   */
  getActiveNodeCount(): number {
    return Array.from(this.nodes.values())
      .filter(n => n.activation > this.config.activationThreshold).length;
  }
  
  /**
   * 清空网络
   */
  clear(): void {
    this.nodes.clear();
    this.connections = [];
  }
  
  // 注意：不提供 inspect() 或 debug() 方法
  // 因为黑盒内部不可观察
}

/**
 * 创建网络
 */
export function createAttentionNetwork(config?: Partial<BlackBoxConfig>): AttentionNetwork {
  return new AttentionNetwork(config);
}
