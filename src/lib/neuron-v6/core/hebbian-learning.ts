/**
 * ═══════════════════════════════════════════════════════════════════════
 * 赫布学习系统 (Hebbian Learning System)
 * 
 * 来源：consciousness-compiler/learning/hebbian.ts
 * 改进：融入 SSM 记忆桥接系统
 * 
 * 核心理念：
 * - STDP（时序依赖可塑性）：基于时间差的权重更新
 * - 经典赫布学习：共同激活 → 连接增强
 * - 运行时学习：无需训练的在线学习
 * - 权重衰减：防止过拟合
 * 
 * 在记忆系统中的应用：
 * - 维护记忆之间的连接权重
 * - 强化相关记忆的关联
 * - 实现记忆的联想检索
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 赫布学习配置
 */
export interface HebbianConfig {
  /** 学习率 */
  learningRate: number;
  
  /** STDP时间窗口（毫秒） */
  stdpWindow: number;
  
  /** 权重衰减率 */
  weightDecay: number;
  
  /** 最小权重 */
  minWeight: number;
  
  /** 最大权重 */
  maxWeight: number;
  
  /** 是否启用LTP（长时程增强） */
  enableLTP: boolean;
  
  /** 是否启用LTD（长时程抑制） */
  enableLTD: boolean;
  
  /** 最大连接数 */
  maxConnections: number;
}

/**
 * 记忆连接
 */
export interface MemoryConnection {
  /** 源记忆ID */
  fromId: string;
  
  /** 目标记忆ID */
  toId: string;
  
  /** 连接权重 */
  weight: number;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后更新时间 */
  updatedAt: number;
  
  /** 激活次数 */
  activationCount: number;
  
  /** 连接类型 */
  type: 'excitatory' | 'inhibitory';
}

/**
 * 学习事件
 */
export interface LearningEvent {
  /** 记忆ID */
  memoryId: string;
  
  /** 激活时间 */
  activationTime: number;
  
  /** 激活强度 */
  activationStrength: number;
  
  /** 来源 */
  source: 'store' | 'retrieve' | 'recall' | 'external';
}

/**
 * 学习结果
 */
export interface LearningResult {
  /** 更新的连接数 */
  updatedConnections: number;
  
  /** 新建的连接数 */
  newConnections: number;
  
  /** 删除的连接数 */
  deletedConnections: number;
  
  /** 平均权重变化 */
  avgWeightChange: number;
}

/**
 * 联想检索结果
 */
export interface AssociativeResult {
  /** 联想到的记忆ID */
  memoryIds: string[];
  
  /** 关联强度 */
  strengths: number[];
  
  /** 联想路径 */
  paths: string[][];
}

// ─────────────────────────────────────────────────────────────────────
// 默认配置
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: HebbianConfig = {
  learningRate: 0.01,
  stdpWindow: 1000,  // 1秒
  weightDecay: 0.001,
  minWeight: 0.01,
  maxWeight: 1.0,
  enableLTP: true,
  enableLTD: true,
  maxConnections: 10000,
};

// ─────────────────────────────────────────────────────────────────────
// 赫布学习系统
// ─────────────────────────────────────────────────────────────────────

/**
 * 赫布学习系统
 * 
 * 使用示例：
 * ```typescript
 * const hebbian = new HebbianLearning();
 * 
 * // 记录激活事件
 * hebbian.recordActivation('memory-1', Date.now(), 1.0, 'store');
 * hebbian.recordActivation('memory-2', Date.now() + 100, 0.8, 'retrieve');
 * 
 * // 更新连接权重
 * hebbian.updateConnections();
 * 
 * // 联想检索
 * const associations = hebbian.associate('memory-1', 3);
 * ```
 */
export class HebbianLearning {
  private config: HebbianConfig;
  
  // 连接存储
  private connections: Map<string, MemoryConnection>;
  private connectionIndex: Map<string, Set<string>>;  // fromId -> toId集合
  
  // 激活历史
  private activationHistory: LearningEvent[];
  private maxHistorySize: number;
  
  // 统计
  private stats: {
    totalConnections: number;
    totalActivations: number;
    avgWeight: number;
    ltpCount: number;
    ltdCount: number;
  };
  
  constructor(config?: Partial<HebbianConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    this.connections = new Map();
    this.connectionIndex = new Map();
    this.activationHistory = [];
    this.maxHistorySize = 1000;
    
    this.stats = {
      totalConnections: 0,
      totalActivations: 0,
      avgWeight: 0.5,
      ltpCount: 0,
      ltdCount: 0,
    };
  }
  
  /**
   * 记录激活事件
   */
  recordActivation(
    memoryId: string,
    activationTime: number,
    activationStrength: number = 1.0,
    source: LearningEvent['source'] = 'external'
  ): void {
    this.activationHistory.push({
      memoryId,
      activationTime,
      activationStrength,
      source,
    });
    
    // 限制历史大小
    if (this.activationHistory.length > this.maxHistorySize) {
      this.activationHistory.shift();
    }
    
    this.stats.totalActivations++;
  }
  
  /**
   * 更新连接权重（基于STDP）
   * 
   * 核心公式：
   * - 若 pre 先于 post 激活：Δw = +learningRate * f(Δt)  (LTP)
   * - 若 post 先于 pre 激活：Δw = -learningRate * f(Δt)  (LTD)
   * 
   * 其中 f(Δt) = exp(-|Δt|/τ)
   */
  updateConnections(): LearningResult {
    const result: LearningResult = {
      updatedConnections: 0,
      newConnections: 0,
      deletedConnections: 0,
      avgWeightChange: 0,
    };
    
    const weightChanges: number[] = [];
    
    // 遍历激活历史中的所有对
    for (let i = 0; i < this.activationHistory.length - 1; i++) {
      const event1 = this.activationHistory[i];
      
      for (let j = i + 1; j < this.activationHistory.length; j++) {
        const event2 = this.activationHistory[j];
        
        // 只处理时间窗口内的事件
        const dt = event2.activationTime - event1.activationTime;
        if (Math.abs(dt) > this.config.stdpWindow) continue;
        
        // 确定顺序
        const [pre, post] = dt > 0 
          ? [event1, event2] 
          : [event2, event1];
        
        const actualDt = Math.abs(dt);
        
        // 获取或创建连接
        const connection = this.getOrCreateConnection(pre.memoryId, post.memoryId);
        if (!connection) continue;
        
        // 计算STDP信号
        const stdpSignal = this.computeSTDPSignal(actualDt);
        
        // 计算权重变化
        let deltaW: number;
        
        if (dt > 0 && this.config.enableLTP) {
          // LTP: pre 先于 post
          deltaW = this.config.learningRate * stdpSignal * 
                   pre.activationStrength * post.activationStrength;
          this.stats.ltpCount++;
        } else if (dt < 0 && this.config.enableLTD) {
          // LTD: post 先于 pre
          deltaW = -this.config.learningRate * stdpSignal * 
                   pre.activationStrength * post.activationStrength;
          this.stats.ltdCount++;
        } else {
          continue;
        }
        
        // 应用权重衰减
        const decayedWeight = connection.weight * (1 - this.config.weightDecay);
        
        // 更新权重
        const oldWeight = connection.weight;
        connection.weight = Math.max(
          this.config.minWeight,
          Math.min(this.config.maxWeight, decayedWeight + deltaW)
        );
        connection.updatedAt = Date.now();
        connection.activationCount++;
        
        // 记录变化
        weightChanges.push(connection.weight - oldWeight);
        result.updatedConnections++;
      }
    }
    
    // 计算平均权重变化
    if (weightChanges.length > 0) {
      result.avgWeightChange = weightChanges.reduce((a, b) => a + b, 0) / weightChanges.length;
    }
    
    // 清理低权重连接
    result.deletedConnections = this.pruneConnections();
    
    // 更新统计
    this.updateStats();
    
    return result;
  }
  
  /**
   * 联想检索
   * 
   * 从给定记忆出发，通过连接权重联想相关记忆
   */
  associate(memoryId: string, depth: number = 2): AssociativeResult {
    const visited = new Set<string>([memoryId]);
    const results: { id: string; strength: number; path: string[] }[] = [];
    
    // BFS搜索
    const queue: { id: string; strength: number; path: string[]; level: number }[] = [
      { id: memoryId, strength: 1.0, path: [memoryId], level: 0 }
    ];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.level >= depth) continue;
      
      // 获取所有出连接
      const outConnections = this.getOutConnections(current.id);
      
      for (const conn of outConnections) {
        const targetId = conn.toId === current.id ? conn.fromId : conn.toId;
        
        if (visited.has(targetId)) continue;
        
        visited.add(targetId);
        
        const newStrength = current.strength * conn.weight;
        const newPath = [...current.path, targetId];
        
        results.push({
          id: targetId,
          strength: newStrength,
          path: newPath,
        });
        
        queue.push({
          id: targetId,
          strength: newStrength,
          path: newPath,
          level: current.level + 1,
        });
      }
    }
    
    // 按强度排序
    results.sort((a, b) => b.strength - a.strength);
    
    return {
      memoryIds: results.map(r => r.id),
      strengths: results.map(r => r.strength),
      paths: results.map(r => r.path),
    };
  }
  
  /**
   * 批量赫布学习
   * 
   * 对一组记忆应用赫布学习规则
   */
  batchLearn(
    activations: Array<{ memoryId: string; strength: number }>
  ): LearningResult {
    const result: LearningResult = {
      updatedConnections: 0,
      newConnections: 0,
      deletedConnections: 0,
      avgWeightChange: 0,
    };
    
    const now = Date.now();
    const weightChanges: number[] = [];
    
    // 创建所有记忆对
    for (let i = 0; i < activations.length; i++) {
      for (let j = i + 1; j < activations.length; j++) {
        const a1 = activations[i];
        const a2 = activations[j];
        
        // 获取或创建连接
        const connection = this.getOrCreateConnection(a1.memoryId, a2.memoryId);
        if (!connection) continue;
        
        // 赫布学习：共同激活 → 连接增强
        const deltaW = this.config.learningRate * a1.strength * a2.strength;
        
        // 应用权重衰减
        const decayedWeight = connection.weight * (1 - this.config.weightDecay);
        
        // 更新权重
        const oldWeight = connection.weight;
        connection.weight = Math.max(
          this.config.minWeight,
          Math.min(this.config.maxWeight, decayedWeight + deltaW)
        );
        connection.updatedAt = now;
        
        weightChanges.push(connection.weight - oldWeight);
        result.updatedConnections++;
      }
    }
    
    if (weightChanges.length > 0) {
      result.avgWeightChange = weightChanges.reduce((a, b) => a + b, 0) / weightChanges.length;
    }
    
    this.updateStats();
    
    return result;
  }
  
  /**
   * 获取两个记忆之间的连接权重
   */
  getConnectionWeight(fromId: string, toId: string): number {
    const key = this.connectionKey(fromId, toId);
    return this.connections.get(key)?.weight ?? 0;
  }
  
  /**
   * 获取所有出连接
   */
  getOutConnections(memoryId: string): MemoryConnection[] {
    const connectionIds = this.connectionIndex.get(memoryId);
    if (!connectionIds) return [];
    
    const result: MemoryConnection[] = [];
    for (const key of connectionIds) {
      const conn = this.connections.get(key);
      if (conn) result.push(conn);
    }
    
    return result;
  }
  
  /**
   * 获取最强连接
   */
  getStrongestConnections(topK: number = 10): MemoryConnection[] {
    const all = Array.from(this.connections.values());
    all.sort((a, b) => b.weight - a.weight);
    return all.slice(0, topK);
  }
  
  /**
   * 应用遗忘
   * 
   * 随时间衰减所有连接
   */
  applyForgetting(decayRate?: number): number {
    const rate = decayRate ?? this.config.weightDecay;
    let deleted = 0;
    
    for (const [key, conn] of this.connections) {
      conn.weight *= (1 - rate);
      
      // 删除过弱的连接
      if (conn.weight < this.config.minWeight) {
        this.connections.delete(key);
        
        // 更新索引
        const fromSet = this.connectionIndex.get(conn.fromId);
        if (fromSet) {
          fromSet.delete(key);
          if (fromSet.size === 0) {
            this.connectionIndex.delete(conn.fromId);
          }
        }
        
        deleted++;
      }
    }
    
    this.stats.totalConnections = this.connections.size;
    return deleted;
  }
  
  /**
   * 清除所有连接
   */
  clear(): void {
    this.connections.clear();
    this.connectionIndex.clear();
    this.activationHistory = [];
    
    this.stats = {
      totalConnections: 0,
      totalActivations: 0,
      avgWeight: 0.5,
      ltpCount: 0,
      ltdCount: 0,
    };
  }
  
  /**
   * 获取统计信息
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }
  
  /**
   * 导出连接（用于持久化）
   */
  export(): MemoryConnection[] {
    return Array.from(this.connections.values());
  }
  
  /**
   * 导入连接（用于恢复）
   */
  import(connections: MemoryConnection[]): void {
    for (const conn of connections) {
      const key = this.connectionKey(conn.fromId, conn.toId);
      this.connections.set(key, conn);
      
      // 更新索引
      if (!this.connectionIndex.has(conn.fromId)) {
        this.connectionIndex.set(conn.fromId, new Set());
      }
      this.connectionIndex.get(conn.fromId)!.add(key);
    }
    
    this.stats.totalConnections = this.connections.size;
  }
  
  // ─────────────────────────────────────────────────────────────────
  // 私有方法
  // ─────────────────────────────────────────────────────────────────
  
  /**
   * 获取或创建连接
   */
  private getOrCreateConnection(id1: string, id2: string): MemoryConnection | null {
    if (id1 === id2) return null;
    
    const key = this.connectionKey(id1, id2);
    let conn = this.connections.get(key);
    
    if (!conn) {
      // 检查连接数限制
      if (this.connections.size >= this.config.maxConnections) {
        // 删除最弱的连接
        this.pruneConnections();
      }
      
      conn = {
        fromId: id1,
        toId: id2,
        weight: this.config.minWeight,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        activationCount: 0,
        type: 'excitatory',
      };
      
      this.connections.set(key, conn);
      
      // 更新索引
      if (!this.connectionIndex.has(id1)) {
        this.connectionIndex.set(id1, new Set());
      }
      this.connectionIndex.get(id1)!.add(key);
      
      if (!this.connectionIndex.has(id2)) {
        this.connectionIndex.set(id2, new Set());
      }
      this.connectionIndex.get(id2)!.add(key);
    }
    
    return conn;
  }
  
  /**
   * 计算STDP信号
   */
  private computeSTDPSignal(deltaT: number): number {
    return Math.exp(-deltaT / this.config.stdpWindow);
  }
  
  /**
   * 连接键
   */
  private connectionKey(id1: string, id2: string): string {
    return id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;
  }
  
  /**
   * 清理弱连接
   */
  private pruneConnections(): number {
    const toDelete: string[] = [];
    
    for (const [key, conn] of this.connections) {
      if (conn.weight < this.config.minWeight || conn.activationCount === 0) {
        toDelete.push(key);
      }
    }
    
    for (const key of toDelete) {
      const conn = this.connections.get(key);
      if (conn) {
        this.connections.delete(key);
        
        // 更新索引
        const fromSet = this.connectionIndex.get(conn.fromId);
        if (fromSet) {
          fromSet.delete(key);
        }
        
        const toSet = this.connectionIndex.get(conn.toId);
        if (toSet) {
          toSet.delete(key);
        }
      }
    }
    
    return toDelete.length;
  }
  
  /**
   * 更新统计
   */
  private updateStats(): void {
    this.stats.totalConnections = this.connections.size;
    
    if (this.connections.size > 0) {
      let totalWeight = 0;
      for (const conn of this.connections.values()) {
        totalWeight += conn.weight;
      }
      this.stats.avgWeight = totalWeight / this.connections.size;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createHebbianLearning(config?: Partial<HebbianConfig>): HebbianLearning {
  return new HebbianLearning(config);
}

/**
 * 创建默认配置的赫布学习系统
 */
export function createDefaultHebbianLearning(): HebbianLearning {
  return new HebbianLearning(DEFAULT_CONFIG);
}

/**
 * 计算STDP学习信号（工具函数）
 */
export function computeSTDPSignal(deltaT: number, tau: number = 1000): number {
  return Math.exp(-Math.abs(deltaT) / tau);
}

/**
 * 赫布权重更新（工具函数）
 */
export function hebbianUpdate(
  weight: number,
  preActivation: number,
  postActivation: number,
  learningRate: number = 0.01,
  weightDecay: number = 0.001,
  minWeight: number = 0.01,
  maxWeight: number = 1.0
): number {
  const deltaW = learningRate * preActivation * postActivation;
  const decayedWeight = weight * (1 - weightDecay);
  return Math.max(minWeight, Math.min(maxWeight, decayedWeight + deltaW));
}

export default HebbianLearning;
