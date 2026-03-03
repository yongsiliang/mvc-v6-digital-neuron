/**
 * 网络传播机制
 * 
 * 核心流程：
 * 1. 节点激活
 * 2. Attention传播
 * 3. 多头计算
 * 4. 激活衰减
 * 5. 重复迭代直到稳定
 */

import type { Connection, CompilationDepth } from '../types';
import { Node } from './node';
import { MultiHeadAttention, HeadOutput, createMultiHeadAttention } from './multi-head';
import { clamp } from '../utils/math';

/**
 * 传播配置
 */
export interface PropagationConfig {
  /** 最大迭代次数 */
  maxIterations: number;
  /** 衰减率 */
  decayRate: number;
  /** 稳定阈值 */
  stabilityThreshold: number;
  /** 激活阈值 */
  activationThreshold: number;
  /** 连接权重范围 */
  connectionWeightRange: [number, number];
}

const DEFAULT_CONFIG: PropagationConfig = {
  maxIterations: 100,
  decayRate: 0.99,
  stabilityThreshold: 0.01,
  activationThreshold: 0.1,
  connectionWeightRange: [0.1, 0.9],
};

/**
 * 传播结果
 */
export interface PropagationResult {
  /** 迭代次数 */
  iterations: number;
  /** 是否稳定 */
  stable: boolean;
  /** 活跃节点数 */
  activeNodeCount: number;
  /** 头输出 */
  headOutputs: HeadOutput[];
  /** 传播历史 */
  history: Array<{
    iteration: number;
    activeCount: number;
    totalActivation: number;
  }>;
}

/**
 * 网络传播器
 */
export class Propagator {
  private config: PropagationConfig;
  private multiHead: MultiHeadAttention;
  
  constructor(config?: Partial<PropagationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.multiHead = createMultiHeadAttention();
  }
  
  /**
   * 执行网络传播
   * 
   * 迭代传播直到稳定或达到最大迭代次数
   */
  propagate(
    nodes: Map<string, Node>,
    connections: Connection[],
    depth: CompilationDepth
  ): PropagationResult {
    const history: PropagationResult['history'] = [];
    const headOutputs: HeadOutput[] = [];
    
    // 计算迭代次数 = 深度 × 每层迭代
    const targetIterations = depth.total * 10;
    const maxIterations = Math.min(targetIterations, this.config.maxIterations);
    
    let stable = false;
    let iteration = 0;
    
    while (!stable && iteration < maxIterations) {
      // 记录上一轮状态
      const prevActivations = this.getActivations(nodes);
      
      // 1. 单节点Attention传播
      this.singleNodePropagation(nodes, connections);
      
      // 2. 多头Attention传播
      const nodeList = Array.from(nodes.values());
      const outputs = this.multiHead.propagate(nodeList);
      headOutputs.push(...outputs);
      
      // 3. 激活衰减
      this.applyDecay(nodes);
      
      // 4. 检查稳定性
      const currentActivations = this.getActivations(nodes);
      stable = this.checkStability(prevActivations, currentActivations);
      
      // 记录历史
      const activeCount = Array.from(nodes.values())
        .filter(n => n.activation > this.config.activationThreshold).length;
      const totalActivation = currentActivations.reduce((a, b) => a + b, 0);
      
      history.push({
        iteration,
        activeCount,
        totalActivation,
      });
      
      iteration++;
    }
    
    // 统计活跃节点
    const activeNodeCount = Array.from(nodes.values())
      .filter(n => n.activation > this.config.activationThreshold).length;
    
    return {
      iterations: iteration,
      stable,
      activeNodeCount,
      headOutputs: headOutputs.slice(-4), // 只保留最后一轮的头输出
      history,
    };
  }
  
  /**
   * 单节点Attention传播
   */
  private singleNodePropagation(
    nodes: Map<string, Node>,
    connections: Connection[]
  ): void {
    for (const node of nodes.values()) {
      if (node.activation < this.config.activationThreshold) continue;
      
      // 找到与该节点相关的邻居
      const neighbors = this.getNeighbors(node, nodes, connections);
      
      if (neighbors.length > 0) {
        // 执行Attention计算
        node.attend(neighbors);
      }
    }
  }
  
  /**
   * 获取邻居节点
   */
  private getNeighbors(
    node: Node,
    nodes: Map<string, Node>,
    connections: Connection[]
  ): Node[] {
    const neighbors: Node[] = [];
    
    for (const conn of connections) {
      let neighbor: Node | undefined;
      
      if (conn.from === node.id) {
        neighbor = nodes.get(conn.to);
      } else if (conn.to === node.id) {
        neighbor = nodes.get(conn.from);
      }
      
      if (neighbor && neighbor.activation > this.config.activationThreshold) {
        neighbors.push(neighbor);
      }
    }
    
    return neighbors;
  }
  
  /**
   * 应用衰减
   */
  private applyDecay(nodes: Map<string, Node>): void {
    for (const node of nodes.values()) {
      node.decay(this.config.decayRate);
    }
  }
  
  /**
   * 获取所有激活值
   */
  private getActivations(nodes: Map<string, Node>): number[] {
    return Array.from(nodes.values()).map(n => n.activation);
  }
  
  /**
   * 检查稳定性
   */
  private checkStability(prev: number[], current: number[]): boolean {
    if (prev.length !== current.length) return false;
    
    let totalChange = 0;
    for (let i = 0; i < prev.length; i++) {
      totalChange += Math.abs(current[i] - prev[i]);
    }
    
    const avgChange = totalChange / prev.length;
    return avgChange < this.config.stabilityThreshold;
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: Partial<PropagationConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 获取配置
   */
  getConfig(): PropagationConfig {
    return { ...this.config };
  }
}

/**
 * 创建传播器
 */
export function createPropagator(config?: Partial<PropagationConfig>): Propagator {
  return new Propagator(config);
}
