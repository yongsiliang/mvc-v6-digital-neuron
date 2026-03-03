/**
 * ═══════════════════════════════════════════════════════════════════════
 * 扩散激活引擎 - SpreadingActivationEngine
 * 
 * 核心机制：激活扩散（Spreading Activation）
 * 
 * 工作原理：
 * 1. 起始节点被激活（来自检索或触发器）
 * 2. 激活沿关联网络扩散到相邻节点
 * 3. 每层扩散会衰减（decayFactor）
 * 4. 激活值低于阈值的节点停止扩散
 * 5. 最终返回所有被激活的节点及其激活值
 * 
 * 这是"联想"的数学模型，也是"忆"的核心机制。
 * ═══════════════════════════════════════════════════════════════════════
 */

import type {
  MemoryNode,
  MemoryAssociation,
  ActivationConfig,
} from './types';
import { DEFAULT_ACTIVATION_CONFIG } from './types';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/** 激活波 */
interface ActivationWave {
  /** 节点ID */
  nodeId: string;
  
  /** 激活值 */
  activation: number;
  
  /** 扩散深度 */
  depth: number;
  
  /** 激活路径 */
  path: string[];
  
  /** 来源类型 */
  sourceType: 'initial' | 'spreading';
}

/** 扩散结果 */
export interface SpreadingResult {
  /** 激活值映射 */
  activationMap: Map<string, number>;
  
  /** 激活路径映射 */
  pathMap: Map<string, string[]>;
  
  /** 扩散统计 */
  stats: {
    /** 初始激活节点数 */
    initialNodes: number;
    
    /** 扩散激活节点数 */
    spreadNodes: number;
    
    /** 总激活节点数 */
    totalActivated: number;
    
    /** 最大扩散深度 */
    maxDepth: number;
    
    /** 扩散轮数 */
    rounds: number;
  };
}

/** 扩散选项 */
export interface SpreadOptions {
  /** 衰减因子 (0-1) */
  decayFactor: number;
  
  /** 最大扩散深度 */
  maxDepth: number;
  
  /** 最小激活阈值 */
  minThreshold: number;
  
  /** 权重乘数（不同关联类型的权重调整） */
  weightMultipliers?: Record<string, number>;
  
  /** 是否优先结晶记忆 */
  prioritizeCrystallized?: boolean;
  
  /** 结晶记忆激活加成 */
  crystallizedBonus?: number;
}

// ─────────────────────────────────────────────────────────────────────
// 扩散激活引擎类
// ─────────────────────────────────────────────────────────────────────

export class SpreadingActivationEngine {
  private config: ActivationConfig;
  
  // 节点获取函数（由外部提供）
  private getNode: (id: string) => MemoryNode | undefined;
  
  constructor(
    getNode: (id: string) => MemoryNode | undefined,
    config: Partial<ActivationConfig> = {}
  ) {
    this.getNode = getNode;
    this.config = { ...DEFAULT_ACTIVATION_CONFIG, ...config };
  }

  // ───────────────────────────────────────────────────────────────────
  // 核心算法：扩散激活
  // ───────────────────────────────────────────────────────────────────

  /**
   * 执行扩散激活
   * 
   * @param initialActivation 初始激活值映射
   * @param options 扩散选项
   * @returns 扩散结果
   */
  spread(
    initialActivation: Map<string, number>,
    options: Partial<SpreadOptions> = {}
  ): SpreadingResult {
    const opts: SpreadOptions = {
      decayFactor: options.decayFactor ?? this.config.spreadDecayFactor,
      maxDepth: options.maxDepth ?? this.config.spreadMaxDepth,
      minThreshold: options.minThreshold ?? this.config.minActivationThreshold,
      weightMultipliers: options.weightMultipliers ?? {
        semantic: 1.0,
        temporal: 0.6,
        causal: 0.8,
        emotional: 0.7,
        trigger: 0.5,
      },
      prioritizeCrystallized: options.prioritizeCrystallized ?? true,
      crystallizedBonus: options.crystallizedBonus ?? 0.3,
    };
    
    // 结果存储
    const activationMap = new Map<string, number>(initialActivation);
    const pathMap = new Map<string, string[]>();
    
    // 初始化路径
    for (const [nodeId] of initialActivation) {
      pathMap.set(nodeId, [nodeId]);
    }
    
    // 统计
    let spreadNodes = 0;
    let maxDepth = 0;
    let rounds = 0;
    
    // 当前波前
    let currentWave: ActivationWave[] = [...initialActivation.entries()].map(
      ([nodeId, activation]) => ({
        nodeId,
        activation,
        depth: 0,
        path: [nodeId],
        sourceType: 'initial' as const,
      })
    );
    
    // 逐层扩散
    for (let depth = 1; depth <= opts.maxDepth; depth++) {
      if (currentWave.length === 0) break;
      
      rounds++;
      maxDepth = depth;
      
      const nextWave: ActivationWave[] = [];
      
      for (const wave of currentWave) {
        const node = this.getNode(wave.nodeId);
        if (!node) continue;
        
        // 沿关联扩散
        for (const association of node.associations) {
          const targetNode = this.getNode(association.targetId);
          if (!targetNode) continue;
          
          // 计算传播激活值
          const weightMultiplier = opts.weightMultipliers?.[association.type] ?? 1.0;
          let propagatedActivation = 
            wave.activation * association.weight * opts.decayFactor * weightMultiplier;
          
          // 结晶记忆加成
          if (opts.prioritizeCrystallized && targetNode.crystallized) {
            propagatedActivation *= (1 + (opts.crystallizedBonus || 0));
          }
          
          // 检查是否超过阈值
          if (propagatedActivation < opts.minThreshold) continue;
          
          // 检查是否已经激活过
          const existingActivation = activationMap.get(association.targetId);
          
          if (existingActivation === undefined) {
            // 新激活的节点
            activationMap.set(association.targetId, propagatedActivation);
            pathMap.set(association.targetId, [...wave.path, association.targetId]);
            
            nextWave.push({
              nodeId: association.targetId,
              activation: propagatedActivation,
              depth,
              path: [...wave.path, association.targetId],
              sourceType: 'spreading',
            });
            
            spreadNodes++;
          } else if (propagatedActivation > existingActivation) {
            // 更高的激活值，更新
            activationMap.set(association.targetId, propagatedActivation);
            pathMap.set(association.targetId, [...wave.path, association.targetId]);
            
            // 如果这个节点还没有在下一波中，添加它
            if (!nextWave.some(w => w.nodeId === association.targetId)) {
              nextWave.push({
                nodeId: association.targetId,
                activation: propagatedActivation,
                depth,
                path: [...wave.path, association.targetId],
                sourceType: 'spreading',
              });
            }
          }
        }
      }
      
      currentWave = nextWave;
    }
    
    return {
      activationMap,
      pathMap,
      stats: {
        initialNodes: initialActivation.size,
        spreadNodes,
        totalActivated: activationMap.size,
        maxDepth,
        rounds,
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────
  // 辅助方法
  // ───────────────────────────────────────────────────────────────────

  /**
   * 获取高激活节点
   */
  getHighActivationNodes(
    result: SpreadingResult,
    threshold: number = 0.3
  ): Array<{ nodeId: string; activation: number; path: string[] }> {
    const nodes: Array<{ nodeId: string; activation: number; path: string[] }> = [];
    
    for (const [nodeId, activation] of result.activationMap) {
      if (activation >= threshold) {
        nodes.push({
          nodeId,
          activation,
          path: result.pathMap.get(nodeId) || [],
        });
      }
    }
    
    return nodes.sort((a, b) => b.activation - a.activation);
  }

  /**
   * 计算两个节点之间的激活路径
   */
  findActivationPath(
    fromId: string,
    toId: string,
    maxDepth: number = 5
  ): string[] | null {
    const initialActivation = new Map([[fromId, 1.0]]);
    const result = this.spread(initialActivation, { maxDepth });
    
    return result.pathMap.get(toId) || null;
  }

  /**
   * 计算节点的激活影响力（能激活多少节点）
   */
  calculateInfluence(
    nodeId: string,
    options: Partial<SpreadOptions> = {}
  ): {
    directInfluence: number;   // 直接影响的节点数
    totalInfluence: number;    // 总影响的节点数
    influenceScore: number;    // 影响力分数（考虑激活值）
  } {
    const initialActivation = new Map([[nodeId, 1.0]]);
    const result = this.spread(initialActivation, options);
    
    const node = this.getNode(nodeId);
    const directInfluence = node?.associations.length || 0;
    const totalInfluence = result.stats.totalActivated - 1; // 排除自身
    
    // 影响力分数：激活值之和
    let influenceScore = 0;
    for (const [id, activation] of result.activationMap) {
      if (id !== nodeId) {
        influenceScore += activation;
      }
    }
    
    return {
      directInfluence,
      totalInfluence,
      influenceScore,
    };
  }

  /**
   * 批量扩散激活（多个起始点）
   */
  batchSpread(
    initialActivations: Array<{ nodeId: string; activation: number }>,
    options: Partial<SpreadOptions> = {}
  ): SpreadingResult {
    const initialMap = new Map<string, number>();
    
    for (const { nodeId, activation } of initialActivations) {
      const existing = initialMap.get(nodeId) || 0;
      initialMap.set(nodeId, Math.max(existing, activation));
    }
    
    return this.spread(initialMap, options);
  }

  /**
   * 带权重的扩散激活
   * 根据节点属性调整扩散权重
   */
  weightedSpread(
    initialActivation: Map<string, number>,
    weightFactors: {
      importanceWeight?: number;      // 重要性权重
      emotionalWeight?: number;       // 情感权重
      consolidationWeight?: number;  // 巩固级别权重
      recencyWeight?: number;         // 最近访问权重
    } = {}
  ): SpreadingResult {
    const {
      importanceWeight = 0.3,
      emotionalWeight = 0.2,
      consolidationWeight = 0.2,
      recencyWeight = 0.3,
    } = weightFactors;
    
    // 自定义权重计算
    const customWeightMultipliers = {
      semantic: 1.0,
      temporal: 0.6,
      causal: 0.8,
      emotional: 1.0 + emotionalWeight,
      trigger: 0.5,
    };
    
    return this.spread(initialActivation, {
      weightMultipliers: customWeightMultipliers,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createSpreadingActivationEngine(
  getNode: (id: string) => MemoryNode | undefined,
  config: Partial<ActivationConfig> = {}
): SpreadingActivationEngine {
  return new SpreadingActivationEngine(getNode, config);
}
