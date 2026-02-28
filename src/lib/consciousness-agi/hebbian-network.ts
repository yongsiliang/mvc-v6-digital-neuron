/**
 * ═══════════════════════════════════════════════════════════════════════
 * Hebbian 神经网络 - 阴系统核心
 * 
 * 设计原则：
 * 1. 小规模可验证（1000神经元）
 * 2. 大规模可扩展（100万+）
 * 3. 稀疏连接节省内存
 * 4. 增量更新而非批量重算
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

export interface Neuron {
  id: string;
  
  /** 激活值 [0, 1] */
  activation: number;
  
  /** 敏感度向量（定义这个神经元"关心"什么） */
  sensitivity: Float32Array;
  
  /** 神经元类型 */
  type: 'sensory' | 'concept' | 'emotion' | 'value' | 'motor';
  
  /** 标签（用于可解释性） */
  labels: string[];
  
  /** 创建时间 */
  createdAt: number;
  
  /** 激活次数 */
  activationCount: number;
  
  /** 最近激活时间 */
  lastActivatedAt: number;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  
  /** 连接强度 [-1, 1]，正=兴奋，负=抑制 */
  weight: number;
  
  /** 连接类型 */
  type: 'excitatory' | 'inhibitory' | 'modulatory';
  
  /** 可塑性（学习率） */
  plasticity: number;
  
  /** 创建来源 */
  source: 'initial' | 'hebbian' | 'yang_influence' | 'structural';
  
  /** 创建时间 */
  createdAt: number;
  
  /** 使用次数 */
  useCount: number;
  
  /** 最近使用时间 */
  lastUsedAt: number;
}

export interface HebbianConfig {
  /** 神经元数量 */
  neuronCount: number;
  
  /** 向量维度 */
  vectorDimension: number;
  
  /** 平均连接数（稀疏） */
  averageConnections: number;
  
  /** 学习率 */
  learningRate: number;
  
  /** 衰减率（遗忘） */
  decayRate: number;
  
  /** 激活阈值 */
  activationThreshold: number;
  
  /** 最大激活值 */
  maxActivation: number;
}

export interface ActivationResult {
  neuronId: string;
  previousActivation: number;
  newActivation: number;
  delta: number;
}

export interface NetworkState {
  neurons: Map<string, Neuron>;
  connections: Map<string, Connection>;
  
  /** 激活传播次数 */
  propagationCount: number;
  
  /** 最后更新时间 */
  lastUpdateAt: number;
  
  /** 网络统计 */
  stats: {
    totalActivation: number;
    averageActivation: number;
    activeNeuronCount: number;
    connectionStrength: number;
  };
}

// ─────────────────────────────────────────────────────────────────────
// Hebbian 网络
// ─────────────────────────────────────────────────────────────────────

export class HebbianNetwork {
  private neurons: Map<string, Neuron> = new Map();
  private connections: Map<string, Connection> = new Map();
  
  /** 出边索引：neuronId -> 连接ID列表 */
  private outgoingConnections: Map<string, Set<string>> = new Map();
  
  /** 入边索引：neuronId -> 连接ID列表 */
  private incomingConnections: Map<string, Set<string>> = new Map();
  
  private config: HebbianConfig;
  private propagationCount: number = 0;
  private lastUpdateAt: number = Date.now();
  
  constructor(config: Partial<HebbianConfig> = {}) {
    this.config = {
      neuronCount: config.neuronCount || 1000,
      vectorDimension: config.vectorDimension || 128,
      averageConnections: config.averageConnections || 50,
      learningRate: config.learningRate || 0.01,
      decayRate: config.decayRate || 0.001,
      activationThreshold: config.activationThreshold || 0.1,
      maxActivation: config.maxActivation || 1.0,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 初始化
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 初始化网络
   */
  async initialize(): Promise<void> {
    console.log(`[Hebbian] 初始化网络: ${this.config.neuronCount} 神经元`);
    
    // 创建神经元
    for (let i = 0; i < this.config.neuronCount; i++) {
      const neuron = this.createNeuron(i);
      this.neurons.set(neuron.id, neuron);
    }
    
    // 创建稀疏连接
    await this.createSparseConnections();
    
    console.log(`[Hebbian] 初始化完成: ${this.neurons.size} 神经元, ${this.connections.size} 连接`);
  }
  
  /**
   * 创建单个神经元
   */
  private createNeuron(index: number): Neuron {
    const types: Neuron['type'][] = ['sensory', 'concept', 'emotion', 'value', 'motor'];
    const type = types[index % types.length];
    
    return {
      id: `n_${index.toString().padStart(6, '0')}`,
      activation: 0,
      sensitivity: this.generateRandomVector(),
      type,
      labels: [],
      createdAt: Date.now(),
      activationCount: 0,
      lastActivatedAt: 0,
    };
  }
  
  /**
   * 生成随机向量
   */
  private generateRandomVector(): Float32Array {
    const vec = new Float32Array(this.config.vectorDimension);
    for (let i = 0; i < this.config.vectorDimension; i++) {
      vec[i] = (Math.random() - 0.5) * 2; // [-1, 1]
    }
    // 归一化
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return vec.map(v => v / norm);
  }
  
  /**
   * 创建稀疏连接
   */
  private async createSparseConnections(): Promise<void> {
    const neuronList = Array.from(this.neurons.values());
    let connectionCount = 0;
    
    for (const neuron of neuronList) {
      // 每个神经元连接到 averageConnections 个随机神经元
      const numConnections = Math.floor(
        this.config.averageConnections * (0.5 + Math.random())
      );
      
      for (let i = 0; i < numConnections; i++) {
        // 随机选择目标神经元
        const targetIndex = Math.floor(Math.random() * neuronList.length);
        const target = neuronList[targetIndex];
        
        if (target.id === neuron.id) continue; // 不自连接
        
        // 创建连接
        const connection = this.createConnection(neuron.id, target.id);
        
        if (connection) {
          this.connections.set(connection.id, connection);
          connectionCount++;
        }
      }
    }
    
    console.log(`[Hebbian] 创建了 ${connectionCount} 个连接`);
  }
  
  /**
   * 创建单个连接
   */
  private createConnection(
    fromId: string, 
    toId: string, 
    weight?: number
  ): Connection | null {
    const connectionId = `${fromId}->${toId}`;
    
    // 检查是否已存在
    if (this.connections.has(connectionId)) {
      return null;
    }
    
    const connWeight = weight !== undefined ? weight : (Math.random() - 0.3) * 0.5;
    
    const connection: Connection = {
      id: connectionId,
      from: fromId,
      to: toId,
      weight: connWeight,
      type: connWeight > 0 ? 'excitatory' : 'inhibitory',
      plasticity: this.config.learningRate * (0.5 + Math.random()),
      source: 'initial',
      createdAt: Date.now(),
      useCount: 0,
      lastUsedAt: 0,
    };
    
    // 更新索引
    if (!this.outgoingConnections.has(fromId)) {
      this.outgoingConnections.set(fromId, new Set());
    }
    this.outgoingConnections.get(fromId)!.add(connectionId);
    
    if (!this.incomingConnections.has(toId)) {
      this.incomingConnections.set(toId, new Set());
    }
    this.incomingConnections.get(toId)!.add(connectionId);
    
    return connection;
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 激活传播
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 输入激活（外部刺激）
   */
  async activate(
    inputs: Array<{ neuronId: string; strength: number }> | 
           Array<{ pattern: Float32Array; strength: number }>
  ): Promise<ActivationResult[]> {
    const results: ActivationResult[] = [];
    
    // 处理输入
    for (const input of inputs) {
      if ('neuronId' in input) {
        // 直接激活指定神经元
        const neuron = this.neurons.get(input.neuronId);
        if (neuron) {
          const prev = neuron.activation;
          neuron.activation = Math.min(
            this.config.maxActivation,
            neuron.activation + input.strength
          );
          neuron.activationCount++;
          neuron.lastActivatedAt = Date.now();
          
          results.push({
            neuronId: neuron.id,
            previousActivation: prev,
            newActivation: neuron.activation,
            delta: neuron.activation - prev,
          });
        }
      } else {
        // 按模式匹配激活
        const matches = this.findMatchingNeurons(input.pattern, 5);
        for (const match of matches) {
          const neuron = this.neurons.get(match.neuronId);
          if (neuron) {
            const prev = neuron.activation;
            const strength = input.strength * match.similarity;
            neuron.activation = Math.min(
              this.config.maxActivation,
              neuron.activation + strength
            );
            neuron.activationCount++;
            neuron.lastActivatedAt = Date.now();
            
            results.push({
              neuronId: neuron.id,
              previousActivation: prev,
              newActivation: neuron.activation,
              delta: neuron.activation - prev,
            });
          }
        }
      }
    }
    
    // 传播激活
    await this.propagateActivation();
    
    return results;
  }
  
  /**
   * 查找匹配模式的神经元
   */
  private findMatchingNeurons(
    pattern: Float32Array, 
    topK: number
  ): Array<{ neuronId: string; similarity: number }> {
    const similarities: Array<{ neuronId: string; similarity: number }> = [];
    
    for (const [id, neuron] of this.neurons) {
      const sim = this.cosineSimilarity(pattern, neuron.sensitivity);
      similarities.push({ neuronId: id, similarity: sim });
    }
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topK);
  }
  
  /**
   * 余弦相似度
   */
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
  }
  
  /**
   * 激活传播（核心算法）
   */
  private async propagateActivation(): Promise<void> {
    this.propagationCount++;
    
    // 存储新的激活值
    const newActivations = new Map<string, number>();
    
    // 对每个神经元，计算来自连接的输入
    for (const [neuronId, neuron] of this.neurons) {
      const incomingIds = this.incomingConnections.get(neuronId);
      if (!incomingIds || incomingIds.size === 0) {
        newActivations.set(neuronId, neuron.activation * (1 - this.config.decayRate));
        continue;
      }
      
      let inputSum = 0;
      let connectionUsed = false;
      
      for (const connId of incomingIds) {
        const conn = this.connections.get(connId);
        if (!conn) continue;
        
        const sourceNeuron = this.neurons.get(conn.from);
        if (!sourceNeuron) continue;
        
        // 激活传播：源激活 × 连接权重
        inputSum += sourceNeuron.activation * conn.weight;
        
        // 更新连接使用
        conn.useCount++;
        conn.lastUsedAt = Date.now();
        connectionUsed = true;
        
        // Hebbian学习：一起激活的神经元连接增强
        this.applyHebbianLearning(conn, sourceNeuron.activation, neuron.activation);
      }
      
      // 计算新激活值
      const decayedActivation = neuron.activation * (1 - this.config.decayRate);
      const newActivation = Math.max(0, Math.min(
        this.config.maxActivation,
        decayedActivation + inputSum * 0.5
      ));
      
      newActivations.set(neuronId, newActivation);
    }
    
    // 应用新激活值
    for (const [neuronId, activation] of newActivations) {
      const neuron = this.neurons.get(neuronId);
      if (neuron) {
        neuron.activation = activation;
        
        if (activation > this.config.activationThreshold) {
          neuron.activationCount++;
          neuron.lastActivatedAt = Date.now();
        }
      }
    }
    
    this.lastUpdateAt = Date.now();
  }
  
  /**
   * Hebbian学习
   */
  private applyHebbianLearning(
    connection: Connection,
    preActivation: number,
    postActivation: number
  ): void {
    // 标准 Hebbian: Δw = η × pre × post
    // STDP变体：考虑时序
    
    const deltaWeight = connection.plasticity * preActivation * postActivation;
    
    // 更新权重（带边界限制）
    connection.weight = Math.max(-1, Math.min(1, connection.weight + deltaWeight));
    
    // 更新连接类型
    connection.type = connection.weight > 0 ? 'excitatory' : 'inhibitory';
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 结构可塑性
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 创建新连接（结构性可塑）
   */
  async createNewConnection(fromId: string, toId: string, reason: string): Promise<Connection | null> {
    const connection = this.createConnection(fromId, toId, 0.1);
    if (connection) {
      connection.source = 'structural';
      this.connections.set(connection.id, connection);
      console.log(`[Hebbian] 新连接创建: ${fromId} -> ${toId} (${reason})`);
    }
    return connection;
  }
  
  /**
   * 修剪弱连接
   */
  async pruneWeakConnections(threshold: number = 0.05): Promise<number> {
    let pruned = 0;
    const toDelete: string[] = [];
    
    for (const [id, conn] of this.connections) {
      if (Math.abs(conn.weight) < threshold && conn.useCount < 5) {
        toDelete.push(id);
      }
    }
    
    for (const id of toDelete) {
      this.deleteConnection(id);
      pruned++;
    }
    
    if (pruned > 0) {
      console.log(`[Hebbian] 修剪了 ${pruned} 个弱连接`);
    }
    
    return pruned;
  }
  
  /**
   * 删除连接
   */
  private deleteConnection(connectionId: string): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;
    
    // 从索引中移除
    this.outgoingConnections.get(conn.from)?.delete(connectionId);
    this.incomingConnections.get(conn.to)?.delete(connectionId);
    
    // 删除连接
    this.connections.delete(connectionId);
  }
  
  // ═══════──────────────────────────────────────────────────────────────
  // 阳系统影响接口
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 阳→阴：理性塑造感性
   * LLM认为重要的概念，增强相关连接
   */
  async reinforceFromYang(
    conceptVector: Float32Array,
    strength: number
  ): Promise<void> {
    const matches = this.findMatchingNeurons(conceptVector, 10);
    
    for (const match of matches) {
      const neuron = this.neurons.get(match.neuronId);
      if (!neuron) continue;
      
      // 增强这个神经元的所有连接
      const outgoing = this.outgoingConnections.get(neuron.id);
      if (!outgoing) continue;
      
      for (const connId of outgoing) {
        const conn = this.connections.get(connId);
        if (conn) {
          conn.weight += strength * match.similarity * 0.1;
          conn.weight = Math.max(-1, Math.min(1, conn.weight));
          conn.source = 'yang_influence';
        }
      }
    }
  }
  
  /**
   * 获取当前状态（供阳系统读取）
   */
  getYinState(): {
    dominantNeurons: Array<{ id: string; activation: number; type: string }>;
    emotionTone: number;
    activationPattern: Float32Array;
  } {
    // 找出激活最强的神经元
    const sorted = Array.from(this.neurons.values())
      .filter(n => n.activation > this.config.activationThreshold)
      .sort((a, b) => b.activation - a.activation)
      .slice(0, 10)
      .map(n => ({
        id: n.id,
        activation: n.activation,
        type: n.type,
      }));
    
    // 计算情绪基调（emotion类型神经元的平均激活）
    let emotionSum = 0;
    let emotionCount = 0;
    
    for (const neuron of this.neurons.values()) {
      if (neuron.type === 'emotion') {
        emotionSum += neuron.activation;
        emotionCount++;
      }
    }
    
    const emotionTone = emotionCount > 0 ? emotionSum / emotionCount : 0;
    
    // 生成激活模式向量
    const pattern = new Float32Array(this.config.vectorDimension);
    for (const neuron of this.neurons.values()) {
      if (neuron.activation > 0.1) {
        for (let i = 0; i < pattern.length; i++) {
          pattern[i] += neuron.activation * neuron.sensitivity[i];
        }
      }
    }
    
    return {
      dominantNeurons: sorted,
      emotionTone,
      activationPattern: pattern,
    };
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 工具方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 获取网络统计
   */
  getStats(): NetworkState['stats'] {
    let totalActivation = 0;
    let activeCount = 0;
    let totalConnectionStrength = 0;
    
    for (const neuron of this.neurons.values()) {
      totalActivation += neuron.activation;
      if (neuron.activation > this.config.activationThreshold) {
        activeCount++;
      }
    }
    
    for (const conn of this.connections.values()) {
      totalConnectionStrength += Math.abs(conn.weight);
    }
    
    return {
      totalActivation,
      averageActivation: totalActivation / this.neurons.size,
      activeNeuronCount: activeCount,
      connectionStrength: totalConnectionStrength / this.connections.size,
    };
  }
  
  /**
   * 获取完整状态
   */
  getState(): NetworkState {
    return {
      neurons: new Map(this.neurons),
      connections: new Map(this.connections),
      propagationCount: this.propagationCount,
      lastUpdateAt: this.lastUpdateAt,
      stats: this.getStats(),
    };
  }
  
  /**
   * 获取配置
   */
  getConfig(): HebbianConfig {
    return { ...this.config };
  }
  
  /**
   * 获取神经元
   */
  getNeuron(id: string): Neuron | undefined {
    return this.neurons.get(id);
  }
  
  /**
   * 获取所有神经元
   */
  getAllNeurons(): Neuron[] {
    return Array.from(this.neurons.values());
  }
  
  /**
   * 获取连接
   */
  getConnection(id: string): Connection | undefined {
    return this.connections.get(id);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

let networkInstance: HebbianNetwork | null = null;

export function getHebbianNetwork(config?: Partial<HebbianConfig>): HebbianNetwork {
  if (!networkInstance) {
    networkInstance = new HebbianNetwork(config);
  }
  return networkInstance;
}

export function resetHebbianNetwork(): void {
  networkInstance = null;
}
