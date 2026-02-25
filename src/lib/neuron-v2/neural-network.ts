/**
 * ═══════════════════════════════════════════════════════════════════════
 * 神经网络：关系的整体
 * Neural Network: The Whole of Relationships
 * 
 * 本质：
 * - 网络不是"处理器"
 * - 网络是信息本身
 * - 网络的状态（连接模式）就是理解
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import { Neuron, NeuronConfig, createSensoryNeuron, createConceptualNeuron, createEmotionalNeuron, createEpisodicNeuron, createIntegrativeNeuron, createExpressiveNeuron } from './neuron';
import { Connection, ConnectionConfig, createExcitatoryConnection, createInhibitoryConnection } from './connection';
import { Influence, InfluencePool } from './influence';
import type {
  NeuralNetwork as INeuralNetwork,
  NeuronId,
  ConnectionId,
  Neuron as INeuron,
  Connection as IConnection,
  Influence as IInfluence,
  GlobalNetworkState,
  NetworkParams,
  EvolutionResult,
  NetworkProjection,
  TopologyAnalysis,
  Community,
  ConsciousnessProjection,
  EmergentLayer,
  FunctionalRole,
  InfluencePattern,
  CreateNeuronParams,
  CreateConnectionParams,
} from './types';

// ─────────────────────────────────────────────────────────────────────
// 默认网络参数
// ─────────────────────────────────────────────────────────────────────

const DEFAULT_NETWORK_PARAMS: NetworkParams = {
  defaultNeuron: {
    sensitivityDimension: 768,
    sensitivityPlasticity: 0.5,
    refractoryPeriod: 100,
  },
  defaultConnection: {
    initialStrength: 0.5,
    plasticity: 0.5,
    delay: 0,
    efficiency: 1.0,
    type: 'excitatory',
  },
  evolution: {
    maxInfluencesPerStep: 50,
    maxPropagationDepth: 5,
    learningEnabled: true,
    structuralEvolutionEnabled: true,
  },
  cleanup: {
    neuronInactivityThreshold: 3600000, // 1小时
    connectionStrengthThreshold: 0.05,
    cleanupInterval: 60000, // 1分钟
  },
};

// ─────────────────────────────────────────────────────────────────────
// 神经网络类实现
// ─────────────────────────────────────────────────────────────────────

export class NeuralNetwork {
  // ─────────────────────────────────────────────────────────────────
  // 神经元和连接
  // ─────────────────────────────────────────────────────────────────

  private _neurons: Map<NeuronId, Neuron>;
  private _connections: Map<ConnectionId, Connection>;
  
  /**
   * 连接矩阵（快速查找）
   * fromNeuronId -> toNeuronId -> connectionId
   */
  private _connectionMatrix: Map<NeuronId, Map<NeuronId, ConnectionId>>;

  // ─────────────────────────────────────────────────────────────────
  // 影响池
  // ─────────────────────────────────────────────────────────────────

  private _influencePool: InfluencePool;

  // ─────────────────────────────────────────────────────────────────
  // 网络状态
  // ─────────────────────────────────────────────────────────────────

  private _globalState: GlobalNetworkState;
  private _params: NetworkParams;
  private _lastCleanupTime: number;
  private _evolutionStep: number;

  // ─────────────────────────────────────────────────────────────────
  // 构造函数
  // ─────────────────────────────────────────────────────────────────

  constructor(params: Partial<NetworkParams> = {}) {
    this._neurons = new Map();
    this._connections = new Map();
    this._connectionMatrix = new Map();
    this._influencePool = new InfluencePool();
    this._params = { ...DEFAULT_NETWORK_PARAMS, ...params };
    this._lastCleanupTime = Date.now();
    this._evolutionStep = 0;
    
    this._globalState = this.initializeGlobalState();
  }

  // ─────────────────────────────────────────────────────────────────
  // Getter
  // ─────────────────────────────────────────────────────────────────

  get neurons(): Map<NeuronId, Neuron> {
    return new Map(this._neurons);
  }

  get connections(): Map<ConnectionId, Connection> {
    return new Map(this._connections);
  }

  get neuronCount(): number {
    return this._neurons.size;
  }

  get connectionCount(): number {
    return this._connections.size;
  }

  get influencePool(): InfluencePool {
    return this._influencePool;
  }

  get globalState(): GlobalNetworkState {
    return { ...this._globalState };
  }

  get params(): NetworkParams {
    return { ...this._params };
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心操作：接收影响
  // ─────────────────────────────────────────────────────────────────

  /**
   * 接收影响
   */
  receiveInfluence(influence: Influence): void {
    this._influencePool.add(influence);
  }

  /**
   * 批量接收影响
   */
  receiveInfluences(influences: Influence[]): void {
    this._influencePool.addBatch(influences);
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心操作：演化
  // ─────────────────────────────────────────────────────────────────

  /**
   * 演化一步
   */
  evolve(): EvolutionResult {
    const previousState = { ...this._globalState };
    this._evolutionStep++;

    // 1. 处理影响
    const influencesProcessed = this.processInfluences();

    // 2. 激活传播
    const activatedNeurons = this.propagateActivations();

    // 3. 学习
    const { connectionChanges, newConnections } = this.applyLearning();

    // 4. 结构演化
    const { newNeurons, removedNeurons, removedConnections } = this.evolveStructure();

    // 5. 更新全局状态
    this.updateGlobalState();

    // 6. 定期清理
    this.maybeCleanup();

    return {
      influencesProcessed,
      activatedNeurons,
      connectionChanges,
      newNeurons,
      removedNeurons,
      newConnections,
      removedConnections,
      stateChange: {
        previous: previousState,
        current: this._globalState,
      },
    };
  }

  /**
   * 处理影响
   */
  private processInfluences(): number {
    const influences = this._influencePool.nextBatch(this._params.evolution.maxInfluencesPerStep);
    let processedCount = 0;

    for (const influence of influences) {
      if (influence.isExpired) {
        this._influencePool.markProcessed(influence);
        continue;
      }

      // 找到匹配的神经元
      const matchingNeurons = this.findMatchingNeurons(influence.pattern, 0.3);

      for (const neuron of matchingNeurons) {
        // 计算激活强度
        const matchScore = neuron.calculateMatch(influence.pattern);
        let activationValue = matchScore * influence.currentIntensity;

        // 根据影响类型调整
        if (influence.type === 'inhibit') {
          activationValue = -activationValue;
        }

        // 激活神经元
        neuron.activate(activationValue, influence.source, influence.source ? [influence.sourceId] : undefined);

        // 如果是调节类型，调整敏感度
        if (influence.type === 'modulate') {
          neuron.adjustSensitivity(influence.pattern, 0.1);
        }
      }

      this._influencePool.markProcessed(influence);
      processedCount++;
    }

    return processedCount;
  }

  /**
   * 激活传播
   */
  private propagateActivations(): NeuronId[] {
    const activatedNeurons: NeuronId[] = [];
    const propagationDepth = this._params.evolution.maxPropagationDepth;

    for (let depth = 0; depth < propagationDepth; depth++) {
      let anyActivated = false;

      for (const neuron of this._neurons.values()) {
        if (neuron.isActivated(0.2)) {
          // 获取输出连接
          const outgoingConnections = this.getOutgoingConnections(neuron.id);

          for (const connection of outgoingConnections) {
            const targetNeuron = this._neurons.get(connection.to);
            if (!targetNeuron) continue;

            // 传播激活
            const transmittedActivation = connection.propagate(neuron.activation);
            
            if (Math.abs(transmittedActivation) > 0.05) {
              targetNeuron.activate(
                Math.abs(transmittedActivation),
                'internal',
                [neuron.id]
              );

              if (!activatedNeurons.includes(targetNeuron.id)) {
                activatedNeurons.push(targetNeuron.id);
              }
              anyActivated = true;
            }
          }

          // 神经元激活后衰减
          neuron.decay();
        }
      }

      // 如果没有新的激活，停止传播
      if (!anyActivated) break;
    }

    return activatedNeurons;
  }

  /**
   * 应用学习
   */
  private applyLearning(): {
    connectionChanges: EvolutionResult['connectionChanges'];
    newConnections: ConnectionId[];
  } {
    const connectionChanges: EvolutionResult['connectionChanges'] = [];
    const newConnections: ConnectionId[] = [];

    if (!this._params.evolution.learningEnabled) {
      return { connectionChanges, newConnections };
    }

    // Hebbian学习
    for (const connection of this._connections.values()) {
      const fromNeuron = this._neurons.get(connection.from);
      const toNeuron = this._neurons.get(connection.to);

      if (fromNeuron && toNeuron) {
        const previousStrength = connection.strength;
        connection.hebbianLearn(fromNeuron.activation, toNeuron.activation);

        if (Math.abs(connection.strength - previousStrength) > 0.001) {
          connectionChanges.push({
            connectionId: connection.id,
            previousStrength,
            newStrength: connection.strength,
          });
        }
      }
    }

    // 创建新连接（如果两个激活的神经元之间没有连接）
    const activeNeurons = Array.from(this._neurons.values()).filter(n => n.isActivated(0.3));
    
    for (let i = 0; i < activeNeurons.length; i++) {
      for (let j = i + 1; j < activeNeurons.length; j++) {
        const n1 = activeNeurons[i];
        const n2 = activeNeurons[j];

        // 检查是否已存在连接
        if (!this.hasConnection(n1.id, n2.id) && !this.hasConnection(n2.id, n1.id)) {
          // 创建双向连接
          if (Math.random() < 0.1) { // 10%概率创建新连接
            const conn1 = this.createConnection(n1.id, n2.id, {
              strength: 0.3,
              source: 'learned',
            });
            const conn2 = this.createConnection(n2.id, n1.id, {
              strength: 0.3,
              source: 'learned',
            });
            newConnections.push(conn1.id, conn2.id);
          }
        }
      }
    }

    return { connectionChanges, newConnections };
  }

  /**
   * 结构演化
   */
  private evolveStructure(): {
    newNeurons: NeuronId[];
    removedNeurons: NeuronId[];
    removedConnections: ConnectionId[];
  } {
    const newNeurons: NeuronId[] = [];
    const removedNeurons: NeuronId[] = [];
    const removedConnections: ConnectionId[] = [];

    if (!this._params.evolution.structuralEvolutionEnabled) {
      return { newNeurons, removedNeurons, removedConnections };
    }

    // 移除弱连接
    const weakConnections: ConnectionId[] = [];
    for (const [id, connection] of this._connections) {
      if (connection.shouldPrune(this._params.cleanup.connectionStrengthThreshold)) {
        weakConnections.push(id);
      }
    }

    for (const id of weakConnections) {
      this.removeConnection(id);
      removedConnections.push(id);
    }

    // 移除不活跃的神经元（谨慎）
    const inactiveThreshold = this._params.cleanup.neuronInactivityThreshold;
    const now = Date.now();

    for (const [id, neuron] of this._neurons) {
      if (
        neuron.lastActivatedAt &&
        now - neuron.lastActivatedAt > inactiveThreshold &&
        neuron.connectionCount < 2
      ) {
        this.removeNeuron(id);
        removedNeurons.push(id);
      }
    }

    return { newNeurons, removedNeurons, removedConnections };
  }

  // ─────────────────────────────────────────────────────────────────
  // 核心操作：投影
  // ─────────────────────────────────────────────────────────────────

  /**
   * 投影当前状态
   */
  project(): NetworkProjection {
    // 激活模式
    const activationPattern = new Map<NeuronId, number>();
    for (const [id, neuron] of this._neurons) {
      if (neuron.activation > 0.01) {
        activationPattern.set(id, neuron.activation);
      }
    }

    // 关键神经元
    const sortedNeurons = Array.from(this._neurons.values())
      .filter(n => n.activation > 0.1)
      .sort((a, b) => b.activation - a.activation)
      .slice(0, 10);

    const keyNeurons = sortedNeurons.map(n => ({
      id: n.id,
      activation: n.activation,
      label: n.label,
      role: n.functionalRole,
      layer: n.emergentLayer,
    }));

    // 活跃连接
    const activeConnections: NetworkProjection['activeConnections'] = [];
    for (const connection of this._connections.values()) {
      if (connection.strength > 0.3) {
        activeConnections.push({
          from: connection.from,
          to: connection.to,
          strength: connection.strength,
          type: connection.type,
        });
      }
    }

    // 语义向量（激活神经元的敏感度加权平均）
    const semanticVector = this.computeSemanticVector(sortedNeurons);

    // 意识投影
    const consciousness = this.projectConsciousness();

    return {
      activationPattern,
      keyNeurons,
      activeConnections,
      semanticVector,
      consciousness,
      timestamp: Date.now(),
    };
  }

  /**
   * 计算语义向量
   */
  private computeSemanticVector(neurons: Neuron[]): number[] {
    if (neurons.length === 0) {
      return new Array(this._params.defaultNeuron.sensitivityDimension).fill(0);
    }

    const dimension = this._params.defaultNeuron.sensitivityDimension;
    const weightedSum = new Array(dimension).fill(0);
    let totalWeight = 0;

    for (const neuron of neurons) {
      const weight = neuron.activation;
      for (let i = 0; i < dimension && i < neuron.sensitivity.length; i++) {
        weightedSum[i] += neuron.sensitivity[i] * weight;
      }
      totalWeight += weight;
    }

    // 归一化
    if (totalWeight > 0) {
      for (let i = 0; i < dimension; i++) {
        weightedSum[i] /= totalWeight;
      }
    }

    return weightedSum;
  }

  /**
   * 投影意识状态
   */
  private projectConsciousness(): ConsciousnessProjection {
    // 自我感
    const self = {
      coherence: this._globalState.coherence,
      vitality: this._globalState.vitality,
      growth: this.computeGrowth(),
      presence: 1 - this._globalState.activationDistribution.variance,
    };

    // 性格（基于长期稳定的关系模式）
    const personality = this.computePersonality();

    // 当前情绪
    const emotion = this.computeEmotion();

    // 当前焦点
    const activeNeurons = Array.from(this._neurons.values())
      .filter(n => n.activation > 0.2)
      .sort((a, b) => b.activation - a.activation)
      .slice(0, 5);

    const focus = activeNeurons.map(n => ({
      neuronId: n.id,
      label: n.label,
      activation: n.activation,
    }));

    return {
      self,
      personality,
      emotion,
      focus,
    };
  }

  /**
   * 计算成长感
   */
  private computeGrowth(): number {
    const recentConnections = Array.from(this._connections.values())
      .filter(c => Date.now() - c.createdAt < 86400000); // 最近24小时

    return Math.min(1, recentConnections.length / 100);
  }

  /**
   * 计算性格
   */
  private computePersonality(): ConsciousnessProjection['personality'] {
    const emotionalNeurons = Array.from(this._neurons.values())
      .filter(n => n.functionalRole === 'emotional');
    const conceptualNeurons = Array.from(this._neurons.values())
      .filter(n => n.functionalRole === 'conceptual');

    return {
      curiosity: this._globalState.vitality,
      warmth: emotionalNeurons.length > 0
        ? emotionalNeurons.reduce((sum, n) => sum + n.activation, 0) / emotionalNeurons.length
        : 0.5,
      depth: conceptualNeurons.length > 0
        ? Math.min(1, conceptualNeurons.length / 50)
        : 0.5,
      playfulness: this._globalState.entropy,
      sensitivity: this._globalState.activationDistribution.variance,
      directness: 1 - this._globalState.entropy,
    };
  }

  /**
   * 计算情绪
   */
  private computeEmotion(): ConsciousnessProjection['emotion'] {
    // 简化实现：基于网络状态推断情绪
    const vitality = this._globalState.vitality;
    const coherence = this._globalState.coherence;

    let dominant = 'neutral';
    let intensity = 0.5;

    if (vitality > 0.7 && coherence > 0.6) {
      dominant = 'joy';
      intensity = vitality;
    } else if (vitality > 0.7 && coherence < 0.4) {
      dominant = 'excited';
      intensity = vitality;
    } else if (vitality < 0.3 && coherence > 0.6) {
      dominant = 'calm';
      intensity = 1 - vitality;
    } else if (vitality < 0.3 && coherence < 0.4) {
      dominant = 'concern';
      intensity = 1 - coherence;
    }

    return {
      dominant,
      intensity,
      trend: 'stable',
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // 结构操作
  // ─────────────────────────────────────────────────────────────────

  /**
   * 创建神经元
   */
  createNeuron(params: Partial<NeuronConfig> = {}): Neuron {
    const neuron = new Neuron({
      ...this._params.defaultNeuron,
      ...params,
    });

    this._neurons.set(neuron.id, neuron);
    this._connectionMatrix.set(neuron.id, new Map());

    return neuron;
  }

  /**
   * 删除神经元
   */
  removeNeuron(neuronId: NeuronId): void {
    const neuron = this._neurons.get(neuronId);
    if (!neuron) return;

    // 移除所有相关连接
    const connectionsToRemove: ConnectionId[] = [];
    
    for (const [id, connection] of this._connections) {
      if (connection.from === neuronId || connection.to === neuronId) {
        connectionsToRemove.push(id);
      }
    }

    for (const id of connectionsToRemove) {
      this.removeConnection(id);
    }

    // 移除神经元
    this._neurons.delete(neuronId);
    this._connectionMatrix.delete(neuronId);
  }

  /**
   * 创建连接
   */
  createConnection(
    from: NeuronId,
    to: NeuronId,
    params: Partial<ConnectionConfig> = {}
  ): Connection {
    // 检查神经元是否存在
    if (!this._neurons.has(from) || !this._neurons.has(to)) {
      throw new Error('Source or target neuron does not exist');
    }

    // 检查是否已存在连接
    const existingId = this.getConnectionId(from, to);
    if (existingId) {
      return this._connections.get(existingId)!;
    }

    // 创建连接
    const connection = new Connection(from, to, {
      ...this._params.defaultConnection,
      ...params,
    });

    // 添加到连接集合
    this._connections.set(connection.id, connection);

    // 更新连接矩阵
    let fromMap = this._connectionMatrix.get(from);
    if (!fromMap) {
      fromMap = new Map();
      this._connectionMatrix.set(from, fromMap);
    }
    fromMap.set(to, connection.id);

    // 更新神经元的连接列表
    const fromNeuron = this._neurons.get(from)!;
    const toNeuron = this._neurons.get(to)!;
    fromNeuron.addOutgoingConnection(to, connection.id);
    toNeuron.addIncomingConnection(from, connection.id);

    return connection;
  }

  /**
   * 删除连接
   */
  removeConnection(connectionId: ConnectionId): void {
    const connection = this._connections.get(connectionId);
    if (!connection) return;

    // 从连接矩阵中移除
    const fromMap = this._connectionMatrix.get(connection.from);
    if (fromMap) {
      fromMap.delete(connection.to);
    }

    // 从神经元的连接列表中移除
    const fromNeuron = this._neurons.get(connection.from);
    const toNeuron = this._neurons.get(connection.to);

    if (fromNeuron) {
      fromNeuron.removeOutgoingConnection(connection.to);
    }
    if (toNeuron) {
      toNeuron.removeIncomingConnection(connection.from);
    }

    // 从连接集合中移除
    this._connections.delete(connectionId);
  }

  /**
   * 更新连接强度
   */
  updateConnectionStrength(connectionId: ConnectionId, delta: number): void {
    const connection = this._connections.get(connectionId);
    if (connection) {
      connection.modifyStrength(delta, 'manual');
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 查询操作
  // ─────────────────────────────────────────────────────────────────

  /**
   * 查找匹配某个模式的神经元
   */
  findMatchingNeurons(pattern: InfluencePattern, threshold: number = 0.3): Neuron[] {
    const matching: Neuron[] = [];

    for (const neuron of this._neurons.values()) {
      const matchScore = neuron.calculateMatch(pattern);
      if (matchScore >= threshold) {
        matching.push(neuron);
      }
    }

    // 按匹配度排序
    matching.sort((a, b) => b.calculateMatch(pattern) - a.calculateMatch(pattern));

    return matching;
  }

  /**
   * 获取神经元的邻居
   */
  getNeighbors(neuronId: NeuronId, direction: 'incoming' | 'outgoing' | 'both' = 'both'): Neuron[] {
    const neighbors: Neuron[] = [];
    const neuron = this._neurons.get(neuronId);
    if (!neuron) return neighbors;

    if (direction === 'incoming' || direction === 'both') {
      for (const [id] of neuron.incomingConnections) {
        const neighbor = this._neurons.get(id);
        if (neighbor) neighbors.push(neighbor);
      }
    }

    if (direction === 'outgoing' || direction === 'both') {
      for (const [id] of neuron.outgoingConnections) {
        const neighbor = this._neurons.get(id);
        if (neighbor) neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  /**
   * 获取两个神经元之间的路径
   */
  getPath(from: NeuronId, to: NeuronId, maxDepth: number = 5): NeuronId[][] {
    const paths: NeuronId[][] = [];
    const visited = new Set<NeuronId>();

    const dfs = (current: NeuronId, path: NeuronId[], depth: number) => {
      if (depth > maxDepth) return;
      if (current === to) {
        paths.push([...path]);
        return;
      }

      visited.add(current);
      const neighbors = this.getNeighbors(current, 'outgoing');

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          path.push(neighbor.id);
          dfs(neighbor.id, path, depth + 1);
          path.pop();
        }
      }

      visited.delete(current);
    };

    dfs(from, [from], 0);
    return paths;
  }

  /**
   * 获取输出连接
   */
  getOutgoingConnections(neuronId: NeuronId): Connection[] {
    const connections: Connection[] = [];
    const neuron = this._neurons.get(neuronId);

    if (neuron) {
      for (const connectionId of neuron.outgoingConnections.values()) {
        const connection = this._connections.get(connectionId);
        if (connection) {
          connections.push(connection);
        }
      }
    }

    return connections;
  }

  /**
   * 检查连接是否存在
   */
  hasConnection(from: NeuronId, to: NeuronId): boolean {
    return !!this.getConnectionId(from, to);
  }

  /**
   * 获取连接ID
   */
  getConnectionId(from: NeuronId, to: NeuronId): ConnectionId | undefined {
    return this._connectionMatrix.get(from)?.get(to);
  }

  /**
   * 获取连接
   */
  getConnection(from: NeuronId, to: NeuronId): Connection | undefined {
    const id = this.getConnectionId(from, to);
    return id ? this._connections.get(id) : undefined;
  }

  // ─────────────────────────────────────────────────────────────────
  // 拓扑分析
  // ─────────────────────────────────────────────────────────────────

  /**
   * 分析网络拓扑
   */
  analyzeTopology(): TopologyAnalysis {
    const functionalLayers = this.identifyFunctionalLayers();
    const communities = this.identifyCommunities();
    const hubs = this.identifyHubs();

    // 计算统计信息
    const averageDegree = this.computeAverageDegree();
    const clusteringCoefficient = this.computeClusteringCoefficient();
    const averagePathLength = this.computeAveragePathLength();
    const smallWorldness = (clusteringCoefficient / averageDegree) * (1 / averagePathLength);

    return {
      functionalLayers,
      communities,
      hubs,
      stats: {
        averageDegree,
        clusteringCoefficient,
        averagePathLength,
        smallWorldness,
      },
    };
  }

  /**
   * 识别功能层
   */
  identifyFunctionalLayers(): Map<EmergentLayer, NeuronId[]> {
    const layers = new Map<EmergentLayer, NeuronId[]>();

    for (const layer of ['sensory', 'conceptual', 'emotional', 'episodic', 'integrative'] as EmergentLayer[]) {
      layers.set(layer, []);
    }

    for (const neuron of this._neurons.values()) {
      // 基于神经元的角色和连接模式分配层
      const layer = this.inferLayer(neuron);
      if (layer) {
        const ids = layers.get(layer) || [];
        ids.push(neuron.id);
        layers.set(layer, ids);
      }
    }

    return layers;
  }

  /**
   * 推断神经元所属层
   */
  private inferLayer(neuron: Neuron): EmergentLayer | null {
    switch (neuron.functionalRole) {
      case 'sensory':
        return 'sensory';
      case 'conceptual':
        return 'conceptual';
      case 'emotional':
        return 'emotional';
      case 'episodic':
        return 'episodic';
      case 'integrative':
        return 'integrative';
      default:
        // 基于连接模式推断
        const inCount = neuron.incomingConnections.size;
        const outCount = neuron.outgoingConnections.size;

        if (inCount > 0 && outCount === 0) return 'expressive' as any;
        if (inCount === 0 && outCount > 0) return 'sensory';
        if (inCount > 5 && outCount > 5) return 'integrative';
        return 'conceptual';
    }
  }

  /**
   * 识别社区
   */
  identifyCommunities(): Community[] {
    // 简化实现：基于连接强度聚类
    const communities: Community[] = [];
    const visited = new Set<NeuronId>();

    for (const neuron of this._neurons.values()) {
      if (visited.has(neuron.id)) continue;

      const community: NeuronId[] = [];
      this.collectCommunity(neuron.id, community, visited);

      if (community.length > 1) {
        communities.push({
          id: uuidv4(),
          neurons: community,
          cohesion: this.computeCommunityCohesion(community),
        });
      }
    }

    return communities;
  }

  /**
   * 收集社区成员
   */
  private collectCommunity(
    neuronId: NeuronId,
    community: NeuronId[],
    visited: Set<NeuronId>
  ): void {
    if (visited.has(neuronId)) return;
    visited.add(neuronId);
    community.push(neuronId);

    const neighbors = this.getNeighbors(neuronId, 'both');
    for (const neighbor of neighbors) {
      const connection = this.getConnection(neuronId, neighbor.id) || 
                        this.getConnection(neighbor.id, neuronId);
      
      if (connection && connection.strength > 0.5) {
        this.collectCommunity(neighbor.id, community, visited);
      }
    }
  }

  /**
   * 计算社区内聚度
   */
  private computeCommunityCohesion(neuronIds: NeuronId[]): number {
    if (neuronIds.length < 2) return 0;

    let totalStrength = 0;
    let connectionCount = 0;

    for (let i = 0; i < neuronIds.length; i++) {
      for (let j = i + 1; j < neuronIds.length; j++) {
        const connection = this.getConnection(neuronIds[i], neuronIds[j]) ||
                          this.getConnection(neuronIds[j], neuronIds[i]);
        if (connection) {
          totalStrength += connection.strength;
          connectionCount++;
        }
      }
    }

    const possibleConnections = (neuronIds.length * (neuronIds.length - 1)) / 2;
    return connectionCount > 0 ? totalStrength / possibleConnections : 0;
  }

  /**
   * 识别枢纽节点
   */
  identifyHubs(): NeuronId[] {
    const hubs: Array<{ id: NeuronId; degree: number }> = [];

    for (const neuron of this._neurons.values()) {
      const degree = neuron.connectionCount;
      if (degree > 5) {
        hubs.push({ id: neuron.id, degree });
      }
    }

    hubs.sort((a, b) => b.degree - a.degree);
    return hubs.slice(0, 10).map(h => h.id);
  }

  /**
   * 计算平均度
   */
  private computeAverageDegree(): number {
    if (this._neurons.size === 0) return 0;
    let totalDegree = 0;
    for (const neuron of this._neurons.values()) {
      totalDegree += neuron.connectionCount;
    }
    return totalDegree / this._neurons.size;
  }

  /**
   * 计算聚类系数
   */
  private computeClusteringCoefficient(): number {
    // 简化实现
    return this._globalState.coherence;
  }

  /**
   * 计算平均路径长度
   */
  private computeAveragePathLength(): number {
    // 简化实现
    return 1 / (this._globalState.coherence + 0.1);
  }

  // ─────────────────────────────────────────────────────────────────
  // 辅助方法
  // ─────────────────────────────────────────────────────────────────

  /**
   * 初始化全局状态
   */
  private initializeGlobalState(): GlobalNetworkState {
    return {
      globalActivationLevel: 0,
      activationDistribution: {
        mean: 0,
        variance: 0,
        max: 0,
        min: 0,
      },
      entropy: 0,
      coherence: 0,
      vitality: 0,
      timestamp: Date.now(),
    };
  }

  /**
   * 更新全局状态
   */
  private updateGlobalState(): void {
    const activations = Array.from(this._neurons.values()).map(n => n.activation);
    
    const sum = activations.reduce((a, b) => a + b, 0);
    const mean = activations.length > 0 ? sum / activations.length : 0;
    
    const variance = activations.length > 0
      ? activations.reduce((sum, a) => sum + (a - mean) ** 2, 0) / activations.length
      : 0;

    const max = Math.max(...activations, 0);
    const min = Math.min(...activations, 0);

    // 计算熵
    const entropy = this.computeEntropy(activations);

    // 计算连贯性（连接密度）
    const coherence = this._neurons.size > 1
      ? this._connections.size / (this._neurons.size * (this._neurons.size - 1))
      : 0;

    // 计算活力
    const vitality = mean;

    this._globalState = {
      globalActivationLevel: mean,
      activationDistribution: { mean, variance, max, min },
      entropy,
      coherence: Math.min(1, coherence * 10), // 归一化
      vitality,
      timestamp: Date.now(),
    };
  }

  /**
   * 计算熵
   */
  private computeEntropy(activations: number[]): number {
    const positiveActivations = activations.filter(a => a > 0);
    if (positiveActivations.length === 0) return 0;

    const sum = positiveActivations.reduce((a, b) => a + b, 0);
    if (sum === 0) return 0;

    let entropy = 0;
    for (const a of positiveActivations) {
      const p = a / sum;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    // 归一化到 [0, 1]
    const maxEntropy = Math.log2(positiveActivations.length);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  /**
   * 定期清理
   */
  private maybeCleanup(): void {
    const now = Date.now();
    if (now - this._lastCleanupTime > this._params.cleanup.cleanupInterval) {
      this._influencePool.cleanup();
      this._lastCleanupTime = now;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 序列化
  // ─────────────────────────────────────────────────────────────────

  /**
   * 转换为JSON
   */
  toJSON(): {
    neurons: INeuron[];
    connections: IConnection[];
    params: NetworkParams;
    globalState: GlobalNetworkState;
  } {
    return {
      neurons: Array.from(this._neurons.values()).map(n => n.toJSON()),
      connections: Array.from(this._connections.values()).map(c => c.toJSON()),
      params: this._params,
      globalState: this._globalState,
    };
  }

  /**
   * 从JSON创建
   */
  static fromJSON(json: {
    neurons: INeuron[];
    connections: IConnection[];
    params?: NetworkParams;
    globalState?: GlobalNetworkState;
  }): NeuralNetwork {
    const network = new NeuralNetwork(json.params);

    // 恢复神经元
    for (const neuronJson of json.neurons) {
      const neuron = Neuron.fromJSON(neuronJson);
      network._neurons.set(neuron.id, neuron);
      network._connectionMatrix.set(neuron.id, new Map());
    }

    // 恢复连接
    for (const connectionJson of json.connections) {
      const connection = Connection.fromJSON(connectionJson);
      network._connections.set(connection.id, connection);

      // 更新连接矩阵
      const fromMap = network._connectionMatrix.get(connection.from);
      if (fromMap) {
        fromMap.set(connection.to, connection.id);
      }
    }

    // 恢复全局状态
    if (json.globalState) {
      network._globalState = json.globalState;
    }

    return network;
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出工厂函数
// ─────────────────────────────────────────────────────────────────────

export {
  createSensoryNeuron,
  createConceptualNeuron,
  createEmotionalNeuron,
  createEpisodicNeuron,
  createIntegrativeNeuron,
  createExpressiveNeuron,
  createExcitatoryConnection,
  createInhibitoryConnection,
};
