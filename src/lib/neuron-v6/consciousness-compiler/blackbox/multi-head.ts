/**
 * 多头Attention
 * 
 * 核心概念：
 * - 不同的头关注不同类型的关系
 * - semantic: 语义关系
 * - temporal: 时间关系
 * - causal: 因果关系
 * - emotional: 情感关系
 * 
 * 多头并行计算，最后拼接输出
 */

import type { AttentionHead } from '../types';
import { ATTENTION_HEADS } from '../types';
import { Node } from './node';
import { attentionWeights, weightedSum } from '../utils/attention';
import { randomVector, dot, magnitude } from '../utils/vector';
import { clamp } from '../utils/math';

/**
 * 多头Attention配置
 */
export interface MultiHeadConfig {
  /** Attention头列表 */
  heads: AttentionHead[];
  /** 是否并行计算 */
  parallel: boolean;
}

const DEFAULT_CONFIG: MultiHeadConfig = {
  heads: ATTENTION_HEADS,
  parallel: true,
};

/**
 * 头输出
 */
export interface HeadOutput {
  headName: string;
  output: number[];
  weights: number[];
  focus: string;
}

/**
 * 多头Attention计算器
 */
export class MultiHeadAttention {
  private config: MultiHeadConfig;
  private headProjections: Map<string, number[][]>;
  
  constructor(config?: Partial<MultiHeadConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 初始化每个头的投影矩阵
    this.headProjections = new Map();
    for (const head of this.config.heads) {
      // 简化：随机初始化投影矩阵
      // 实际实现中可以是可学习的参数
      const projection = this.initProjectionMatrix(head.dimension);
      this.headProjections.set(head.name, projection);
    }
  }
  
  /**
   * 多头传播
   * 
   * 对每个头独立计算Attention，然后合并输出
   */
  propagate(nodes: Node[]): HeadOutput[] {
    const outputs: HeadOutput[] = [];
    
    for (const head of this.config.heads) {
      const output = this.computeHead(head, nodes);
      outputs.push(output);
    }
    
    // 应用多头输出到节点
    this.applyOutputs(nodes, outputs);
    
    return outputs;
  }
  
  /**
   * 计算单个头的Attention
   */
  private computeHead(head: AttentionHead, nodes: Node[]): HeadOutput {
    // 获取该头关注的节点
    const relevantNodes = this.filterNodesForHead(head, nodes);
    
    if (relevantNodes.length === 0) {
      return {
        headName: head.name,
        output: new Array(head.dimension).fill(0),
        weights: [],
        focus: head.focus,
      };
    }
    
    // 对每个激活的节点计算Attention
    const activeNodes = relevantNodes.filter(n => n.activation > 0.1);
    
    if (activeNodes.length === 0) {
      return {
        headName: head.name,
        output: new Array(head.dimension).fill(0),
        weights: [],
        focus: head.focus,
      };
    }
    
    // 计算Attention权重和输出
    // 简化：使用节点的Value向量计算
    const queries = activeNodes.map(n => n.query);
    const keys = activeNodes.map(n => n.key);
    const values = activeNodes.map(n => n.value);
    
    // 使用第一个激活节点作为主Query
    const mainQuery = queries[0];
    const weights = attentionWeights(mainQuery, keys);
    
    // 加权求和
    const output = weightedSum(weights, values);
    
    return {
      headName: head.name,
      output,
      weights,
      focus: head.focus,
    };
  }
  
  /**
   * 过滤该头关注的节点
   */
  private filterNodesForHead(head: AttentionHead, nodes: Node[]): Node[] {
    switch (head.name) {
      case 'semantic':
        // 语义头：关注概念节点
        return nodes.filter(n => n.type === 'concept' || n.type === 'insight');
        
      case 'temporal':
        // 时间头：关注记忆节点
        return nodes.filter(n => n.type === 'memory' || n.type === 'pattern');
        
      case 'causal':
        // 因果头：关注洞察节点
        return nodes.filter(n => n.type === 'insight' || n.type === 'pattern');
        
      case 'emotional':
        // 情感头：关注情感节点
        return nodes.filter(n => n.type === 'emotion' || n.metadata?.emotional);
        
      default:
        return nodes;
    }
  }
  
  /**
   * 应用多头输出到节点
   */
  private applyOutputs(nodes: Node[], outputs: HeadOutput[]): void {
    // 计算每个头的权重（基于输出强度）
    const magnitudes = outputs.map(o => magnitude(o.output));
    const totalMag = magnitudes.reduce((a, b) => a + b, 0);
    const headWeights = magnitudes.map(m => totalMag > 0 ? m / totalMag : 0.25);
    
    // 更新节点激活
    for (const node of nodes) {
      let totalInfluence = 0;
      
      for (let i = 0; i < outputs.length; i++) {
        const output = outputs[i];
        const weight = headWeights[i];
        
        // 检查该节点是否在该头的关注范围内
        if (output.weights.length > 0) {
          const nodeIndex = this.findNodeIndex(node, output.weights);
          if (nodeIndex >= 0) {
            totalInfluence += weight * output.weights[nodeIndex];
          }
        }
      }
      
      // 更新激活
      node.activation = clamp(
        node.activation + totalInfluence * 0.3,
        0,
        1
      );
    }
  }
  
  /**
   * 查找节点在权重数组中的索引
   */
  private findNodeIndex(node: Node, weights: number[]): number {
    // 简化：返回权重最大位置的索引
    // 实际实现需要更精确的映射
    return weights.indexOf(Math.max(...weights));
  }
  
  /**
   * 初始化投影矩阵
   */
  private initProjectionMatrix(dimension: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < dimension; i++) {
      const row: number[] = [];
      for (let j = 0; j < dimension; j++) {
        row.push(Math.random() * 2 - 1);
      }
      matrix.push(row);
    }
    return matrix;
  }
  
  /**
   * 获取头列表
   */
  getHeads(): AttentionHead[] {
    return [...this.config.heads];
  }
  
  /**
   * 获取特定头的投影矩阵
   */
  getProjection(headName: string): number[][] | undefined {
    return this.headProjections.get(headName);
  }
}

/**
 * 创建多头Attention
 */
export function createMultiHeadAttention(config?: Partial<MultiHeadConfig>): MultiHeadAttention {
  return new MultiHeadAttention(config);
}
