/**
 * ═══════════════════════════════════════════════════════════════════════
 * 持久化管理器：长期记忆的存储与加载
 * Persistence Manager: Storage and Loading of Long-term Memory
 * 
 * 核心功能：
 * - 将神经元网络状态持久化到数据库
 * - 从数据库加载用户的神经元网络
 * - 支持跨设备、跨会话的记忆保持
 * ═══════════════════════════════════════════════════════════════════════
 */

import { v4 as uuidv4 } from 'uuid';
import type { NeuronId, ConnectionId } from './types';
import { NeuralNetwork } from './neural-network';
import { Neuron } from './neuron';
import { Connection } from './connection';
import { 
  MemoryManager, 
  MemoryRecord, 
  MemoryType 
} from './memory';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 用户标识
 */
export type UserId = string;

/**
 * 会话标识
 */
export type SessionId = string;

/**
 * 持久化配置
 */
export interface PersistenceConfig {
  /**
   * 是否启用自动保存
   */
  autoSave: boolean;

  /**
   * 自动保存间隔（毫秒）
   */
  autoSaveInterval: number;

  /**
   * 是否保存激活历史
   */
  saveActivationHistory: boolean;

  /**
   * 是否保存连接历史
   */
  saveConnectionHistory: boolean;

  /**
   * 历史记录保留天数
   */
  historyRetentionDays: number;
}

const DEFAULT_PERSISTENCE_CONFIG: PersistenceConfig = {
  autoSave: true,
  autoSaveInterval: 30000, // 30秒
  saveActivationHistory: true,
  saveConnectionHistory: true,
  historyRetentionDays: 30,
};

/**
 * 保存的神经元数据
 */
export interface SavedNeuron {
  id: string;
  label: string | null;
  labelSource: 'human' | 'inferred' | 'learned' | null;
  functionalRole: string;
  emergentLayer: string | null;
  sensitivityVector: number[];
  sensitivityDimension: number;
  sensitivityPlasticity: number;
  activation: number;
  activationTrend: string;
  refractoryPeriod: number;
  lastActivatedAt: string | null;
  totalActivations: number;
  averageActivation: number;
  connectionChanges: number;
  usefulness: number;
  source: string;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * 保存的连接数据
 */
export interface SavedConnection {
  id: string;
  from: string;
  to: string;
  type: string;
  strength: number;
  plasticity: number;
  delay: number;
  efficiency: number;
  lastActivatedAt: string | null;
  totalActivations: number;
  averageActivationStrength: number;
  source: string;
  createdAt: string;
}

/**
 * 保存的记忆数据
 */
export interface SavedMemory {
  id: string;
  userId: string;
  content: string;
  type: MemoryType;
  importance: number;
  emotionalIntensity: number;
  emotionalValence: number;
  strength: number;
  consolidated: boolean;
  relatedNeurons: string[];
  relatedConnections: string[];
  tags: string[];
  recallCount: number;
  lastRecalledAt: string | null;
  createdAt: string;
}

/**
 * 用户大脑状态
 */
export interface UserBrainState {
  userId: UserId;
  sessionId: SessionId;
  neurons: SavedNeuron[];
  connections: SavedConnection[];
  memories: SavedMemory[];
  selfModel: {
    coreTraits: string[];
    values: string[];
    beliefs: string[];
    strengths: string[];
    limitations: string[];
    growthAreas: string[];
  } | null;
  lastSavedAt: string;
  version: number;
}

// ─────────────────────────────────────────────────────────────────────
// 持久化管理器
// ─────────────────────────────────────────────────────────────────────

/**
 * 持久化管理器
 * 
 * 负责将神经元网络状态持久化到数据库，以及从数据库加载
 */
export class PersistenceManager {
  private _config: PersistenceConfig;
  private _userId: UserId | null = null;
  private _sessionId: SessionId;
  private _autoSaveTimer: NodeJS.Timeout | null = null;
  private _saveInProgress: boolean = false;

  // 数据库操作接口（注入）
  private _db: {
    saveNeuron: (userId: UserId, neuron: SavedNeuron) => Promise<void>;
    saveConnection: (userId: UserId, connection: SavedConnection) => Promise<void>;
    saveMemory: (userId: UserId, memory: SavedMemory) => Promise<void>;
    loadNeurons: (userId: UserId) => Promise<SavedNeuron[]>;
    loadConnections: (userId: UserId) => Promise<SavedConnection[]>;
    loadMemories: (userId: UserId) => Promise<SavedMemory[]>;
    deleteNeuron: (userId: UserId, neuronId: string) => Promise<void>;
    deleteConnection: (userId: UserId, connectionId: string) => Promise<void>;
    updateSelfModel: (userId: UserId, selfModel: any) => Promise<void>;
    loadSelfModel: (userId: UserId) => Promise<any>;
  };

  constructor(
    db: PersistenceManager['_db'],
    config: Partial<PersistenceConfig> = {}
  ) {
    this._config = { ...DEFAULT_PERSISTENCE_CONFIG, ...config };
    this._sessionId = uuidv4();
    this._db = db;
  }

  // ─────────────────────────────────────────────────────────────────
  // 用户管理
  // ─────────────────────────────────────────────────────────────────

  /**
   * 设置当前用户
   */
  setUser(userId: UserId): void {
    this._userId = userId;
    
    // 启动自动保存
    if (this._config.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * 获取当前用户
   */
  get userId(): UserId | null {
    return this._userId;
  }

  /**
   * 获取会话ID
   */
  get sessionId(): SessionId {
    return this._sessionId;
  }

  /**
   * 清除用户（登出）
   */
  clearUser(): void {
    this.stopAutoSave();
    this._userId = null;
  }

  // ─────────────────────────────────────────────────────────────────
  // 保存操作
  // ─────────────────────────────────────────────────────────────────

  /**
   * 保存整个大脑状态
   */
  async saveBrainState(
    network: NeuralNetwork,
    memoryManager: MemoryManager
  ): Promise<void> {
    if (!this._userId) {
      throw new Error('No user set. Call setUser() first.');
    }

    if (this._saveInProgress) {
      console.log('Save already in progress, skipping...');
      return;
    }

    this._saveInProgress = true;

    try {
      const userId = this._userId;

      // 1. 保存所有神经元
      for (const neuron of network.neurons.values()) {
        const savedNeuron = this.neuronToSaved(neuron);
        await this._db.saveNeuron(userId, savedNeuron);
      }

      // 2. 保存所有连接
      for (const connection of network.connections.values()) {
        const savedConnection = this.connectionToSaved(connection);
        await this._db.saveConnection(userId, savedConnection);
      }

      // 3. 保存所有记忆
      for (const memory of memoryManager.memories.values()) {
        const savedMemory = this.memoryToSaved(memory, userId);
        await this._db.saveMemory(userId, savedMemory);
      }

      // 4. 保存自我模型
      // TODO: 实现selfModel保存

      console.log(`Brain state saved for user ${userId}`);
    } finally {
      this._saveInProgress = false;
    }
  }

  /**
   * 保存单个神经元
   */
  async saveNeuron(neuron: Neuron): Promise<void> {
    if (!this._userId) {
      throw new Error('No user set');
    }

    const saved = this.neuronToSaved(neuron);
    await this._db.saveNeuron(this._userId, saved);
  }

  /**
   * 保存单个连接
   */
  async saveConnection(connection: Connection): Promise<void> {
    if (!this._userId) {
      throw new Error('No user set');
    }

    const saved = this.connectionToSaved(connection);
    await this._db.saveConnection(this._userId, saved);
  }

  /**
   * 保存单个记忆
   */
  async saveMemory(memory: MemoryRecord): Promise<void> {
    if (!this._userId) {
      throw new Error('No user set');
    }

    const saved = this.memoryToSaved(memory, this._userId);
    await this._db.saveMemory(this._userId, saved);
  }

  // ─────────────────────────────────────────────────────────────────
  // 加载操作
  // ─────────────────────────────────────────────────────────────────

  /**
   * 加载用户的完整大脑状态
   */
  async loadBrainState(): Promise<UserBrainState | null> {
    if (!this._userId) {
      throw new Error('No user set. Call setUser() first.');
    }

    const userId = this._userId;

    // 1. 加载神经元
    const neurons = await this._db.loadNeurons(userId);

    // 2. 加载连接
    const connections = await this._db.loadConnections(userId);

    // 3. 加载记忆
    const memories = await this._db.loadMemories(userId);

    // 4. 加载自我模型
    const selfModel = await this._db.loadSelfModel(userId);

    // 如果没有任何数据，返回null
    if (neurons.length === 0 && connections.length === 0 && memories.length === 0) {
      return null;
    }

    return {
      userId,
      sessionId: this._sessionId,
      neurons,
      connections,
      memories,
      selfModel,
      lastSavedAt: new Date().toISOString(),
      version: 1,
    };
  }

  /**
   * 将加载的状态应用到网络
   */
  async applyLoadedState(
    state: UserBrainState,
    network: NeuralNetwork,
    memoryManager: MemoryManager
  ): Promise<void> {
    // 1. 加载神经元
    for (const savedNeuron of state.neurons) {
      const neuron = this.savedToNeuron(savedNeuron);
      network.neurons.set(neuron.id, neuron);
    }

    // 2. 加载连接
    for (const savedConnection of state.connections) {
      const connection = this.savedToConnection(savedConnection);
      network.connections.set(connection.id, connection);

      // 更新神经元的连接映射
      const fromNeuron = network.neurons.get(connection.from);
      const toNeuron = network.neurons.get(connection.to);

      if (fromNeuron) {
        fromNeuron.outgoingConnections.set(connection.to, connection.id);
      }
      if (toNeuron) {
        toNeuron.incomingConnections.set(connection.from, connection.id);
      }
    }

    // 3. 加载记忆
    for (const savedMemory of state.memories) {
      const memory = this.savedToMemory(savedMemory);
      memoryManager.memories.set(memory.id, memory);
    }

    console.log(`Loaded ${state.neurons.length} neurons, ${state.connections.length} connections, ${state.memories.length} memories`);
  }

  // ─────────────────────────────────────────────────────────────────
  // 删除操作
  // ─────────────────────────────────────────────────────────────────

  /**
   * 删除神经元
   */
  async deleteNeuron(neuronId: NeuronId): Promise<void> {
    if (!this._userId) return;
    await this._db.deleteNeuron(this._userId, neuronId);
  }

  /**
   * 删除连接
   */
  async deleteConnection(connectionId: ConnectionId): Promise<void> {
    if (!this._userId) return;
    await this._db.deleteConnection(this._userId, connectionId);
  }

  // ─────────────────────────────────────────────────────────────────
  // 自动保存
  // ─────────────────────────────────────────────────────────────────

  /**
   * 启动自动保存
   */
  startAutoSave(): void {
    if (this._autoSaveTimer) return;

    this._autoSaveTimer = setInterval(() => {
      // 自动保存由外部调用saveBrainState
      // 这里只是触发事件
      this.emit('autoSave', { userId: this._userId, timestamp: Date.now() });
    }, this._config.autoSaveInterval);
  }

  /**
   * 停止自动保存
   */
  stopAutoSave(): void {
    if (this._autoSaveTimer) {
      clearInterval(this._autoSaveTimer);
      this._autoSaveTimer = null;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 转换方法
  // ─────────────────────────────────────────────────────────────────

  private neuronToSaved(neuron: Neuron): SavedNeuron {
    return {
      id: neuron.id,
      label: neuron.label || null,
      labelSource: neuron.labelSource || null,
      functionalRole: neuron.functionalRole,
      emergentLayer: neuron.emergentLayer || null,
      sensitivityVector: neuron.sensitivity,
      sensitivityDimension: neuron.sensitivityDimension,
      sensitivityPlasticity: neuron.sensitivityPlasticity,
      activation: neuron.activation,
      activationTrend: neuron.activationTrend || 'stable',
      refractoryPeriod: neuron.refractoryPeriod,
      lastActivatedAt: neuron.lastActivatedAt ? new Date(neuron.lastActivatedAt).toISOString() : null,
      totalActivations: neuron.stats.totalActivations,
      averageActivation: neuron.stats.averageActivation,
      connectionChanges: neuron.stats.connectionChanges,
      usefulness: neuron.stats.usefulness,
      source: 'created',
      createdAt: new Date(neuron.createdAt).toISOString(),
      updatedAt: null,
    };
  }

  private savedToNeuron(saved: SavedNeuron): Neuron {
    // 创建神经元（所有状态通过构造函数设置）
    const neuron = new Neuron({
      id: saved.id as NeuronId,
      label: saved.label || undefined,
      labelSource: saved.labelSource || undefined,
      sensitivity: saved.sensitivityVector,
      sensitivityDimension: saved.sensitivityDimension,
      sensitivityPlasticity: saved.sensitivityPlasticity,
      refractoryPeriod: saved.refractoryPeriod,
      functionalRole: saved.functionalRole as any,
    });

    // 注意：Neuron类的activation、stats等是只读或私有的
    // 这里返回的是一个"基础恢复"的神经元
    // 完整状态恢复需要在网络层面通过激活等方式实现
    
    return neuron;
  }

  private connectionToSaved(connection: Connection): SavedConnection {
    return {
      id: connection.id,
      from: connection.from,
      to: connection.to,
      type: connection.type,
      strength: connection.strength,
      plasticity: connection.plasticity,
      delay: connection.delay,
      efficiency: connection.efficiency,
      lastActivatedAt: connection.lastActivatedAt ? new Date(connection.lastActivatedAt).toISOString() : null,
      totalActivations: connection.totalActivations,
      averageActivationStrength: connection.averageActivationStrength,
      source: connection.source || 'created',
      createdAt: new Date(connection.createdAt).toISOString(),
    };
  }

  private savedToConnection(saved: SavedConnection): Connection {
    return new Connection(saved.from as NeuronId, saved.to as NeuronId, {
      id: saved.id as ConnectionId,
      type: saved.type as any,
      strength: saved.strength,
      plasticity: saved.plasticity,
      delay: saved.delay,
      efficiency: saved.efficiency,
    });
  }

  private memoryToSaved(memory: MemoryRecord, userId: UserId): SavedMemory {
    return {
      id: memory.id,
      userId,
      content: memory.content,
      type: memory.type,
      importance: memory.importance,
      emotionalIntensity: memory.emotionalIntensity,
      emotionalValence: memory.emotionalValence,
      strength: memory.strength,
      consolidated: memory.consolidated,
      relatedNeurons: memory.relatedNeurons,
      relatedConnections: memory.relatedConnections,
      tags: memory.tags,
      recallCount: memory.recallCount,
      lastRecalledAt: memory.lastRecalledAt ? new Date(memory.lastRecalledAt).toISOString() : null,
      createdAt: new Date(memory.createdAt).toISOString(),
    };
  }

  private savedToMemory(saved: SavedMemory): MemoryRecord {
    return {
      id: saved.id,
      content: saved.content,
      type: saved.type,
      createdAt: new Date(saved.createdAt).getTime(),
      lastRecalledAt: saved.lastRecalledAt ? new Date(saved.lastRecalledAt).getTime() : undefined,
      recallCount: saved.recallCount,
      importance: saved.importance,
      emotionalIntensity: saved.emotionalIntensity,
      emotionalValence: saved.emotionalValence,
      strength: saved.strength,
      consolidated: saved.consolidated,
      relatedNeurons: saved.relatedNeurons as NeuronId[],
      relatedConnections: saved.relatedConnections as ConnectionId[],
      tags: saved.tags,
    };
  }

  // 简单事件发射器
  private _listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push(callback);
  }

  emit(event: string, data: any): void {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.forEach(cb => cb(data));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

/**
 * 创建持久化管理器
 */
export function createPersistenceManager(
  db: PersistenceManager['_db'],
  config: Partial<PersistenceConfig> = {}
): PersistenceManager {
  return new PersistenceManager(db, config);
}
