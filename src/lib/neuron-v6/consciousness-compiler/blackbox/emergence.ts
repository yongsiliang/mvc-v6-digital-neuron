/**
 * 涌现检测
 * 
 * 核心概念：
 * - 检测网络中涌现的模式
 * - 识别稳定状态
 * - 提取理解结果
 */

import type { Understanding } from '../types';
import { Node } from './node';
import type { HeadOutput } from './multi-head';
import { magnitude } from '../utils/vector';

/**
 * 涌现模式
 */
export interface EmergentPattern {
  /** 模式ID */
  id: string;
  /** 核心节点 */
  coreNodes: string[];
  /** 模式强度 */
  strength: number;
  /** 模式类型 */
  type: 'cluster' | 'chain' | 'hub' | 'isolated';
  /** 相关概念 */
  concepts: string[];
}

/**
 * 涌现检测结果
 */
export interface EmergenceResult {
  /** 检测到的模式 */
  patterns: EmergentPattern[];
  /** 主导模式 */
  dominantPattern: EmergentPattern | null;
  /** 理解结果 */
  understanding: Understanding;
  /** 涌现指标 */
  metrics: {
    /** 聚合度 */
    coherence: number;
    /** 多样性 */
    diversity: number;
    /** 稳定性 */
    stability: number;
    /** 涌现强度 */
    emergenceStrength: number;
  };
}

/**
 * 涌现检测器配置
 */
export interface EmergenceConfig {
  /** 最小激活阈值 */
  minActivation: number;
  /** 模式检测阈值 */
  patternThreshold: number;
  /** 聚类距离阈值 */
  clusterDistance: number;
}

const DEFAULT_CONFIG: EmergenceConfig = {
  minActivation: 0.3,
  patternThreshold: 0.5,
  clusterDistance: 0.7,
};

/**
 * 涌现检测器
 */
export class EmergenceDetector {
  private config: EmergenceConfig;
  
  constructor(config?: Partial<EmergenceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * 检测涌现
   */
  detect(
    nodes: Map<string, Node>,
    headOutputs: HeadOutput[]
  ): EmergenceResult {
    // 1. 获取活跃节点
    const activeNodes = Array.from(nodes.values())
      .filter(n => n.activation > this.config.minActivation);
    
    // 2. 检测模式
    const patterns = this.detectPatterns(activeNodes);
    
    // 3. 选择主导模式
    const dominantPattern = this.selectDominantPattern(patterns);
    
    // 4. 计算指标
    const metrics = this.computeMetrics(activeNodes, patterns);
    
    // 5. 生成理解
    const understanding = this.generateUnderstanding(
      activeNodes,
      dominantPattern,
      headOutputs,
      metrics
    );
    
    return {
      patterns,
      dominantPattern,
      understanding,
      metrics,
    };
  }
  
  /**
   * 检测模式
   */
  private detectPatterns(nodes: Node[]): EmergentPattern[] {
    const patterns: EmergentPattern[] = [];
    const visited = new Set<string>();
    
    for (const node of nodes) {
      if (visited.has(node.id)) continue;
      
      // 检测聚类
      const cluster = this.findCluster(node, nodes);
      if (cluster.length >= 2) {
        const pattern: EmergentPattern = {
          id: `cluster-${node.id}`,
          coreNodes: cluster.map(n => n.id),
          strength: this.computeClusterStrength(cluster),
          type: 'cluster',
          concepts: cluster.map(n => n.id),
        };
        
        patterns.push(pattern);
        cluster.forEach(n => visited.add(n.id));
      }
    }
    
    // 检测孤立高激活节点
    for (const node of nodes) {
      if (!visited.has(node.id) && node.activation > 0.7) {
        patterns.push({
          id: `isolated-${node.id}`,
          coreNodes: [node.id],
          strength: node.activation,
          type: 'isolated',
          concepts: [node.id],
        });
      }
    }
    
    return patterns;
  }
  
  /**
   * 查找聚类
   */
  private findCluster(seed: Node, nodes: Node[]): Node[] {
    const cluster: Node[] = [seed];
    const queue: Node[] = [seed];
    const visited = new Set<string>([seed.id]);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      for (const node of nodes) {
        if (visited.has(node.id)) continue;
        
        // 检查相似度
        const similarity = current.similarity(node);
        if (similarity > this.config.clusterDistance) {
          cluster.push(node);
          queue.push(node);
          visited.add(node.id);
        }
      }
    }
    
    return cluster;
  }
  
  /**
   * 计算聚类强度
   */
  private computeClusterStrength(cluster: Node[]): number {
    if (cluster.length === 0) return 0;
    
    const avgActivation = cluster.reduce((s, n) => s + n.activation, 0) / cluster.length;
    const cohesion = this.computeCohesion(cluster);
    
    return avgActivation * cohesion;
  }
  
  /**
   * 计算聚类内聚度
   */
  private computeCohesion(cluster: Node[]): number {
    if (cluster.length < 2) return 1;
    
    let totalSimilarity = 0;
    let pairs = 0;
    
    for (let i = 0; i < cluster.length; i++) {
      for (let j = i + 1; j < cluster.length; j++) {
        totalSimilarity += cluster[i].similarity(cluster[j]);
        pairs++;
      }
    }
    
    return pairs > 0 ? totalSimilarity / pairs : 0;
  }
  
  /**
   * 选择主导模式
   */
  private selectDominantPattern(patterns: EmergentPattern[]): EmergentPattern | null {
    if (patterns.length === 0) return null;
    
    return patterns.reduce((a, b) => 
      a.strength > b.strength ? a : b
    );
  }
  
  /**
   * 计算指标
   */
  private computeMetrics(
    nodes: Node[],
    patterns: EmergentPattern[]
  ): EmergenceResult['metrics'] {
    // 聚合度：节点之间的平均相似度
    const coherence = this.computeCoherence(nodes);
    
    // 多样性：不同模式类型的分布
    const diversity = this.computeDiversity(patterns);
    
    // 稳定性：激活值的方差
    const stability = this.computeStability(nodes);
    
    // 涌现强度：模式数量和强度的综合
    const emergenceStrength = this.computeEmergenceStrength(patterns);
    
    return {
      coherence,
      diversity,
      stability,
      emergenceStrength,
    };
  }
  
  /**
   * 计算聚合度
   */
  private computeCoherence(nodes: Node[]): number {
    if (nodes.length < 2) return 1;
    
    let totalSimilarity = 0;
    let pairs = 0;
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        totalSimilarity += nodes[i].similarity(nodes[j]);
        pairs++;
      }
    }
    
    return pairs > 0 ? totalSimilarity / pairs : 0;
  }
  
  /**
   * 计算多样性
   */
  private computeDiversity(patterns: EmergentPattern[]): number {
    if (patterns.length === 0) return 0;
    
    const types = new Set(patterns.map(p => p.type));
    return types.size / 4; // 4种类型
  }
  
  /**
   * 计算稳定性
   */
  private computeStability(nodes: Node[]): number {
    if (nodes.length === 0) return 1;
    
    const activations = nodes.map(n => n.activation);
    const mean = activations.reduce((a, b) => a + b, 0) / activations.length;
    const variance = activations.reduce((s, a) => s + (a - mean) ** 2, 0) / activations.length;
    
    // 方差越小，稳定性越高
    return 1 / (1 + Math.sqrt(variance));
  }
  
  /**
   * 计算涌现强度
   */
  private computeEmergenceStrength(patterns: EmergentPattern[]): number {
    if (patterns.length === 0) return 0;
    
    const avgStrength = patterns.reduce((s, p) => s + p.strength, 0) / patterns.length;
    const patternCount = patterns.length;
    
    return avgStrength * Math.log(1 + patternCount);
  }
  
  /**
   * 生成理解
   */
  private generateUnderstanding(
    nodes: Node[],
    dominantPattern: EmergentPattern | null,
    headOutputs: HeadOutput[],
    metrics: EmergenceResult['metrics']
  ): Understanding {
    // 提取核心概念
    const coreNodes = dominantPattern?.coreNodes || 
      nodes.filter(n => n.activation > 0.5).map(n => n.id);
    
    // 合成理解文本
    const essence = this.synthesizeEssence(coreNodes, headOutputs);
    
    // 计算置信度
    const confidence = this.computeConfidence(metrics);
    
    return {
      essence,
      confidence,
      derivation: coreNodes,
      timestamp: Date.now(),
    };
  }
  
  /**
   * 合成理解文本
   */
  private synthesizeEssence(
    nodeIds: string[],
    headOutputs: HeadOutput[]
  ): string {
    if (nodeIds.length === 0) {
      return '无法形成明确理解';
    }
    
    // 简化：组合节点ID
    const mainConcept = nodeIds[0];
    const relatedConcepts = nodeIds.slice(1, 4);
    
    let essence = `核心概念：${mainConcept}`;
    if (relatedConcepts.length > 0) {
      essence += `，关联：${relatedConcepts.join('、')}`;
    }
    
    return essence;
  }
  
  /**
   * 计算置信度
   */
  private computeConfidence(metrics: EmergenceResult['metrics']): number {
    // 综合各指标
    return (
      metrics.coherence * 0.3 +
      metrics.stability * 0.3 +
      metrics.emergenceStrength * 0.4
    );
  }
}

/**
 * 创建涌现检测器
 */
export function createEmergenceDetector(config?: Partial<EmergenceConfig>): EmergenceDetector {
  return new EmergenceDetector(config);
}
