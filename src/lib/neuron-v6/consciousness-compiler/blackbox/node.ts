/**
 * Attention节点
 * 
 * 核心概念：
 * - 每个节点有 Query/Key/Value 三个向量
 * - Query: "我在找什么"
 * - Key: "我有什么特征"
 * - Value: "我的实际内容"
 * 
 * Attention计算：
 * activation = softmax(QK^T / √d) @ V
 */

import type { AttentionNode as IAttentionNode, NodeType } from '../types';
import { randomVector, dot, magnitude, add, scale } from '../utils/vector';
import { softmax, clamp } from '../utils/math';

/**
 * 节点配置
 */
export interface NodeConfig {
  /** 向量维度 */
  vectorDimension: number;
  /** 初始激活度 */
  initialActivation?: number;
  /** 节点类型 */
  type?: NodeType;
}

const DEFAULT_CONFIG: NodeConfig = {
  vectorDimension: 64,
  initialActivation: 0,
  type: 'concept',
};

/**
 * Attention节点实现
 */
export class Node implements IAttentionNode {
  id: string;
  activation: number;
  query: number[];
  key: number[];
  value: number[];
  type: NodeType;
  lastAttentionWeights?: number[];
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  
  private config: NodeConfig;
  
  constructor(id: string, config?: Partial<NodeConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.id = id;
    this.activation = config?.initialActivation ?? 0;
    this.type = config?.type ?? 'concept';
    
    // 初始化Q/K/V向量
    this.query = randomVector(this.config.vectorDimension);
    this.key = randomVector(this.config.vectorDimension);
    this.value = randomVector(this.config.vectorDimension);
    
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }
  
  /**
   * Attention计算
   * 
   * 与邻居节点进行Attention交互
   */
  attend(neighbors: Node[]): void {
    if (neighbors.length === 0) return;
    
    // 1. 计算与每个邻居的Attention分数
    //    QK^T / √d
    const scores = neighbors.map(n => {
      const qkDot = dot(this.query, n.key);
      const dk = Math.sqrt(this.query.length);
      return qkDot / dk;
    });
    
    // 2. Softmax归一化
    const weights = softmax(scores);
    this.lastAttentionWeights = weights;
    
    // 3. 加权求和得到聚合的Value
    let aggregatedValue = new Array(this.value.length).fill(0);
    for (let i = 0; i < neighbors.length; i++) {
      const neighborValue = neighbors[i].value;
      const weight = weights[i];
      for (let j = 0; j < aggregatedValue.length; j++) {
        aggregatedValue[j] += weight * neighborValue[j];
      }
    }
    
    // 4. 更新激活（残差连接）
    const aggregatedMagnitude = magnitude(aggregatedValue);
    const oldActivation = this.activation;
    
    // 残差连接：保留部分旧激活
    this.activation = clamp(
      0.5 * oldActivation + 0.5 * aggregatedMagnitude,
      0,
      1
    );
    
    this.updatedAt = Date.now();
  }
  
  /**
   * 衰减激活
   */
  decay(rate: number = 0.99): void {
    this.activation *= rate;
    this.updatedAt = Date.now();
  }
  
  /**
   * 激活
   */
  activate(amount: number = 1): void {
    this.activation = clamp(this.activation + amount, 0, 1);
    this.updatedAt = Date.now();
  }
  
  /**
   * 更新Q/K/V向量（学习）
   */
  updateVectors(
    targetQuery?: number[],
    targetKey?: number[],
    targetValue?: number[],
    learningRate: number = 0.01
  ): void {
    if (targetQuery) {
      this.query = this.blendVectors(this.query, targetQuery, learningRate);
    }
    if (targetKey) {
      this.key = this.blendVectors(this.key, targetKey, learningRate);
    }
    if (targetValue) {
      this.value = this.blendVectors(this.value, targetValue, learningRate);
    }
    
    this.updatedAt = Date.now();
  }
  
  /**
   * 混合向量
   */
  private blendVectors(current: number[], target: number[], rate: number): number[] {
    return current.map((v, i) => v + rate * (target[i] - v));
  }
  
  /**
   * 与另一个节点的相似度
   */
  similarity(other: Node): number {
    // 基于Key向量的余弦相似度
    const dotProduct = dot(this.key, other.key);
    const magA = magnitude(this.key);
    const magB = magnitude(other.key);
    
    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
  }
  
  /**
   * 克隆节点
   */
  clone(): Node {
    const cloned = new Node(this.id, this.config);
    cloned.activation = this.activation;
    cloned.query = [...this.query];
    cloned.key = [...this.key];
    cloned.value = [...this.value];
    cloned.type = this.type;
    cloned.metadata = this.metadata ? { ...this.metadata } : undefined;
    cloned.createdAt = this.createdAt;
    cloned.updatedAt = this.updatedAt;
    return cloned;
  }
  
  /**
   * 序列化
   */
  toJSON(): IAttentionNode {
    return {
      id: this.id,
      activation: this.activation,
      query: this.query,
      key: this.key,
      value: this.value,
      type: this.type,
      lastAttentionWeights: this.lastAttentionWeights,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
  
  /**
   * 从JSON恢复
   */
  static fromJSON(json: IAttentionNode): Node {
    const node = new Node(json.id, {
      vectorDimension: json.query.length,
      initialActivation: json.activation,
      type: json.type,
    });
    node.query = json.query;
    node.key = json.key;
    node.value = json.value;
    node.lastAttentionWeights = json.lastAttentionWeights;
    node.metadata = json.metadata;
    node.createdAt = json.createdAt;
    node.updatedAt = json.updatedAt;
    return node;
  }
}

/**
 * 创建节点工厂函数
 */
export function createNode(id: string, config?: Partial<NodeConfig>): Node {
  return new Node(id, config);
}
