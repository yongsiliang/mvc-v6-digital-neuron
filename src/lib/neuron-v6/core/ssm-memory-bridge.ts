/**
 * ═══════════════════════════════════════════════════════════════════════
 * SSM 记忆桥接 (SSM Memory Bridge)
 * 
 * 核心理念：
 * - 将SSM隐式状态与记忆系统双向同步
 * - 记忆以隐式向量形式存储
 * - 支持快速检索和融合
 * 
 * 黑盒特性：
 * - 记忆内容不可直接解析
 * - 通过向量相似度检索
 * - 状态压缩存储
 * 
 * 新增特性 (P1融入)：
 * - 赫布学习：记忆间的关联强化
 * - 联想检索：基于连接权重的记忆联想
 * - STDP：时序依赖的权重更新
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { SSMState } from './ssm-layer';
import {
  HebbianLearning,
  createHebbianLearning,
  type HebbianConfig,
  type MemoryConnection,
  type AssociativeResult,
} from './hebbian-learning';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 记忆桥接配置
 */
export interface SSMMemoryBridgeConfig {
  /** 向量维度 */
  vectorDimension: number;
  
  /** 最大记忆条数 */
  maxMemories: number;
  
  /** 相似度阈值 */
  similarityThreshold: number;
  
  /** 衰减率 */
  decayRate: number;
  
  /** 是否启用持久化 */
  enablePersistence: boolean;
  
  /** 持久化路径 */
  persistencePath?: string;
  
  /** 是否启用赫布学习（新增） */
  enableHebbianLearning?: boolean;
  
  /** 赫布学习配置（新增） */
  hebbianConfig?: Partial<HebbianConfig>;
}

const DEFAULT_BRIDGE_CONFIG: SSMMemoryBridgeConfig = {
  vectorDimension: 256,
  maxMemories: 10000,
  similarityThreshold: 0.8,
  decayRate: 0.995,
  enablePersistence: false,
  // 新增：赫布学习
  enableHebbianLearning: true,
};

/**
 * 隐式记忆条目
 */
export interface ImplicitMemoryEntry {
  /** 唯一ID */
  id: string;
  
  /** 隐式状态向量 */
  stateVector: Float32Array;
  
  /** 上下文向量 */
  contextVector: Float32Array;
  
  /** 价值 */
  value: number;
  
  /** 创建时间 */
  createdAt: number;
  
  /** 最后访问时间 */
  lastAccessed: number;
  
  /** 访问次数 */
  accessCount: number;
  
  /** 衰减因子 */
  decayFactor: number;
  
  /** 类型标签 */
  type: 'experience' | 'insight' | 'task' | 'context' | 'reflection';
  
  /** 元数据（最小化） */
  meta?: {
    importance?: number;
    source?: string;
  };
}

/**
 * 检索结果
 */
export interface RetrievalResult {
  /** 匹配的记忆 */
  memories: ImplicitMemoryEntry[];
  
  /** 相似度分数 */
  scores: number[];
  
  /** 融合后的向量 */
  fusedVector: Float32Array;
  
  /** 检索耗时（ms） */
  retrievalTime: number;
}

/**
 * 同步结果
 */
export interface SyncResult {
  /** 新增的记忆数 */
  added: number;
  
  /** 更新的记忆数 */
  updated: number;
  
  /** 删除的记忆数 */
  deleted: number;
  
  /** 同步耗时（ms） */
  syncTime: number;
}

// ─────────────────────────────────────────────────────────────────────
// 向量索引（LSH）
// ─────────────────────────────────────────────────────────────────────

/**
 * 局部敏感哈希索引
 * 
 * 用于快速相似度搜索
 */
class LSHIndex {
  private buckets: Map<string, ImplicitMemoryEntry[]>;
  private hashFunctions: ((v: Float32Array) => number)[][];
  private dimension: number;
  private numTables: number;
  private numHashFunctions: number;
  
  constructor(dimension: number, numTables = 5, numHashFunctions = 10) {
    this.dimension = dimension;
    this.numTables = numTables;
    this.numHashFunctions = numHashFunctions;
    this.buckets = new Map();
    
    // 初始化哈希函数
    this.hashFunctions = [];
    for (let t = 0; t < numTables; t++) {
      const table: ((v: Float32Array) => number)[] = [];
      for (let h = 0; h < numHashFunctions; h++) {
        const projection = new Float32Array(dimension);
        for (let i = 0; i < dimension; i++) {
          projection[i] = Math.random() * 2 - 1;
        }
        
        const hashFn = (v: Float32Array) => {
          let dot = 0;
          for (let i = 0; i < dimension; i++) {
            dot += projection[i] * v[i];
          }
          return dot >= 0 ? 1 : 0;
        };
        
        table.push(hashFn);
      }
      this.hashFunctions.push(table);
    }
  }
  
  add(entry: ImplicitMemoryEntry): void {
    for (let t = 0; t < this.numTables; t++) {
      const key = this.hashKey(entry.stateVector, t);
      const fullKey = `${t}:${key}`;
      
      if (!this.buckets.has(fullKey)) {
        this.buckets.set(fullKey, []);
      }
      this.buckets.get(fullKey)!.push(entry);
    }
  }
  
  remove(id: string): void {
    for (const [key, entries] of this.buckets) {
      const index = entries.findIndex(e => e.id === id);
      if (index !== -1) {
        entries.splice(index, 1);
        if (entries.length === 0) {
          this.buckets.delete(key);
        }
      }
    }
  }
  
  query(vector: Float32Array, topK: number): ImplicitMemoryEntry[] {
    const candidates = new Set<ImplicitMemoryEntry>();
    
    for (let t = 0; t < this.numTables; t++) {
      const key = this.hashKey(vector, t);
      const fullKey = `${t}:${key}`;
      
      const bucket = this.buckets.get(fullKey);
      if (bucket) {
        for (const entry of bucket) {
          candidates.add(entry);
        }
      }
    }
    
    // 计算精确相似度
    const results = Array.from(candidates).map(entry => ({
      entry,
      similarity: this.cosineSimilarity(vector, entry.stateVector),
    }));
    
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, topK).map(r => r.entry);
  }
  
  private hashKey(vector: Float32Array, tableIndex: number): string {
    const bits = this.hashFunctions[tableIndex].map(fn => fn(vector));
    return bits.join('');
  }
  
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
  }
}

// ─────────────────────────────────────────────────────────────────────
// SSM 记忆桥接
// ─────────────────────────────────────────────────────────────────────

/**
 * SSM 记忆桥接
 * 
 * 在SSM状态空间和记忆系统之间建立桥梁
 */
export class SSMMemoryBridge {
  private config: SSMMemoryBridgeConfig;
  
  // 记忆存储
  private memories: Map<string, ImplicitMemoryEntry>;
  private index: LSHIndex;
  
  // 赫布学习系统（新增）
  private hebbian: HebbianLearning | null;
  
  // 短期缓冲
  private shortTermBuffer: ImplicitMemoryEntry[];
  private maxShortTermSize: number;
  
  // 统计
  private stats: {
    totalMemories: number;
    totalRetrievals: number;
    avgRetrievalTime: number;
    cacheHits: number;
    hebbianUpdates: number;  // 新增
    associativeRetrievals: number;  // 新增
  };
  
  constructor(config?: Partial<SSMMemoryBridgeConfig>) {
    this.config = { ...DEFAULT_BRIDGE_CONFIG, ...config };
    
    // 初始化存储
    this.memories = new Map();
    this.index = new LSHIndex(this.config.vectorDimension);
    
    // 初始化赫布学习（新增）
    if (this.config.enableHebbianLearning) {
      this.hebbian = createHebbianLearning(this.config.hebbianConfig);
    } else {
      this.hebbian = null;
    }
    
    // 初始化短期缓冲
    this.shortTermBuffer = [];
    this.maxShortTermSize = 100;
    
    // 初始化统计
    this.stats = {
      totalMemories: 0,
      totalRetrievals: 0,
      avgRetrievalTime: 0,
      cacheHits: 0,
      hebbianUpdates: 0,
      associativeRetrievals: 0,
    };
  }
  
  /**
   * 存储SSM状态到记忆
   */
  store(state: SSMState, context?: Float32Array, type: ImplicitMemoryEntry['type'] = 'experience'): ImplicitMemoryEntry {
    // 检查是否已存在相似记忆
    const similar = this.findSimilar(state.h, 1, this.config.similarityThreshold);
    
    if (similar.memories.length > 0) {
      // 更新现有记忆
      const existing = similar.memories[0];
      existing.accessCount++;
      existing.lastAccessed = Date.now();
      existing.value = (existing.value + this.computeValue(state)) / 2;
      
      // 记录赫布学习激活（新增）
      if (this.hebbian) {
        this.hebbian.recordActivation(existing.id, Date.now(), 0.8, 'store');
      }
      
      return existing;
    }
    
    // 创建新记忆
    const entry: ImplicitMemoryEntry = {
      id: this.generateId(),
      stateVector: state.h.slice(),
      contextVector: context || new Float32Array(this.config.vectorDimension),
      value: this.computeValue(state),
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
      decayFactor: 1.0,
      type,
    };
    
    // 添加到存储
    this.memories.set(entry.id, entry);
    this.index.add(entry);
    
    // 记录赫布学习激活（新增）
    if (this.hebbian) {
      this.hebbian.recordActivation(entry.id, Date.now(), 1.0, 'store');
    }
    
    // 添加到短期缓冲
    this.shortTermBuffer.push(entry);
    if (this.shortTermBuffer.length > this.maxShortTermSize) {
      this.shortTermBuffer.shift();
    }
    
    // 检查容量限制
    if (this.memories.size > this.config.maxMemories) {
      this.pruneMemories();
    }
    
    this.stats.totalMemories = this.memories.size;
    
    return entry;
  }
  
  /**
   * 检索相关记忆
   */
  retrieve(stateVector: Float32Array, topK: number = 5): RetrievalResult {
    const startTime = Date.now();
    
    // 从索引检索
    const memories = this.index.query(stateVector, topK * 2);
    
    // 计算相似度
    const results = memories.map(m => ({
      memory: m,
      score: this.cosineSimilarity(stateVector, m.stateVector),
    }));
    
    // 过滤低相似度
    const filtered = results.filter(r => r.score >= this.config.similarityThreshold);
    
    // 排序并取topK
    filtered.sort((a, b) => b.score - a.score);
    const topResults = filtered.slice(0, topK);
    
    // 融合向量
    const fusedVector = this.fuseVectors(topResults.map(r => r.memory));
    
    // 记录赫布学习激活（新增）
    if (this.hebbian) {
      for (const r of topResults) {
        this.hebbian.recordActivation(r.memory.id, Date.now(), r.score, 'retrieve');
      }
    }
    
    // 更新统计
    const retrievalTime = Date.now() - startTime;
    this.stats.totalRetrievals++;
    this.stats.avgRetrievalTime = 
      (this.stats.avgRetrievalTime * (this.stats.totalRetrievals - 1) + retrievalTime)
      / this.stats.totalRetrievals;
    
    return {
      memories: topResults.map(r => r.memory),
      scores: topResults.map(r => r.score),
      fusedVector,
      retrievalTime,
    };
  }
  
  /**
   * 查找相似记忆
   */
  findSimilar(
    vector: Float32Array, 
    topK: number, 
    threshold: number = 0
  ): RetrievalResult {
    const result = this.retrieve(vector, topK);
    
    if (threshold > 0) {
      const filtered = result.memories.filter((_, i) => result.scores[i] >= threshold);
      const scores = result.scores.filter(s => s >= threshold);
      
      return {
        ...result,
        memories: filtered,
        scores,
      };
    }
    
    return result;
  }
  
  /**
   * 从记忆恢复到SSM状态
   */
  recall(memoryId: string): SSMState | null {
    const memory = this.memories.get(memoryId);
    if (!memory) return null;
    
    // 更新访问信息
    memory.accessCount++;
    memory.lastAccessed = Date.now();
    
    return {
      h: memory.stateVector,
      timestep: 0,
      createdAt: memory.createdAt,
      id: memory.id,
    };
  }
  
  /**
   * 融合记忆到SSM状态
   */
  fuse(memories: ImplicitMemoryEntry[]): Float32Array {
    return this.fuseVectors(memories);
  }
  
  /**
   * 应用衰减
   */
  applyDecay(): void {
    const now = Date.now();
    const decayRate = this.config.decayRate;
    
    for (const [id, memory] of this.memories) {
      // 时间衰减
      const age = (now - memory.createdAt) / (1000 * 60 * 60);  // 小时
      memory.decayFactor *= Math.pow(decayRate, age);
      
      // 访问衰减（越少访问衰减越多）
      const accessDecay = 1 - 1 / (memory.accessCount + 1);
      memory.decayFactor *= accessDecay;
      
      // 移除低价值记忆
      if (memory.decayFactor < 0.1) {
        this.memories.delete(id);
        this.index.remove(id);
      }
    }
    
    this.stats.totalMemories = this.memories.size;
  }
  
  /**
   * 清除所有记忆
   */
  clear(): void {
    this.memories.clear();
    this.shortTermBuffer = [];
    // 重建索引
    this.index = new LSHIndex(this.config.vectorDimension);
    this.stats.totalMemories = 0;
  }
  
  /**
   * 获取统计信息
   */
  getStats(): typeof this.stats & {
    shortTermBufferSize: number;
    memoryTypes: Record<string, number>;
  } {
    // 统计各类型记忆数量
    const memoryTypes: Record<string, number> = {};
    for (const memory of this.memories.values()) {
      memoryTypes[memory.type] = (memoryTypes[memory.type] || 0) + 1;
    }
    
    return {
      ...this.stats,
      shortTermBufferSize: this.shortTermBuffer.length,
      memoryTypes,
    };
  }
  
  /**
   * 导出记忆（用于持久化）
   */
  export(): ImplicitMemoryEntry[] {
    return Array.from(this.memories.values());
  }
  
  /**
   * 导入记忆（用于恢复）
   */
  import(memories: ImplicitMemoryEntry[]): void {
    for (const memory of memories) {
      this.memories.set(memory.id, memory);
      this.index.add(memory);
    }
    this.stats.totalMemories = this.memories.size;
  }
  
  // ───────────────────────────────────────────────────────────────────
  // 私有方法
  // ───────────────────────────────────────────────────────────────────
  
  /**
   * 计算记忆价值
   */
  private computeValue(state: SSMState): number {
    let sum = 0;
    for (let i = 0; i < state.h.length; i++) {
      sum += Math.abs(state.h[i]);
    }
    return sum / state.h.length;
  }
  
  /**
   * 融合向量
   */
  private fuseVectors(memories: ImplicitMemoryEntry[]): Float32Array {
    const dim = this.config.vectorDimension;
    const result = new Float32Array(dim);
    
    if (memories.length === 0) return result;
    
    // 加权平均
    let totalWeight = 0;
    for (const memory of memories) {
      const weight = memory.value * memory.decayFactor;
      totalWeight += weight;
      
      for (let i = 0; i < dim && i < memory.stateVector.length; i++) {
        result[i] += memory.stateVector[i] * weight;
      }
    }
    
    // 归一化
    if (totalWeight > 0) {
      for (let i = 0; i < dim; i++) {
        result[i] /= totalWeight;
      }
    }
    
    return result;
  }
  
  /**
   * 修剪记忆
   */
  private pruneMemories(): void {
    // 按价值排序
    const entries = Array.from(this.memories.values());
    entries.sort((a, b) => {
      const scoreA = a.value * a.decayFactor * a.accessCount;
      const scoreB = b.value * b.decayFactor * b.accessCount;
      return scoreB - scoreA;
    });
    
    // 保留高分记忆
    const keepCount = Math.floor(this.config.maxMemories * 0.9);
    const toRemove = entries.slice(keepCount);
    
    for (const memory of toRemove) {
      this.memories.delete(memory.id);
      this.index.remove(memory.id);
    }
  }
  
  /**
   * 计算余弦相似度
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
   * 生成ID
   */
  private generateId(): string {
    return Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
  
  // ─────────────────────────────────────────────────────────────────
  // 赫布学习方法（新增）
  // ─────────────────────────────────────────────────────────────────
  
  /**
   * 更新赫布连接（新增）
   * 
   * 基于STDP更新记忆间的连接权重
   */
  updateHebbianConnections(): {
    updated: number;
    newConnections: number;
    deleted: number;
  } {
    if (!this.hebbian) {
      return { updated: 0, newConnections: 0, deleted: 0 };
    }
    
    const result = this.hebbian.updateConnections();
    this.stats.hebbianUpdates++;
    
    return {
      updated: result.updatedConnections,
      newConnections: result.newConnections,
      deleted: result.deletedConnections,
    };
  }
  
  /**
   * 联想检索（新增）
   * 
   * 从给定记忆出发，通过赫布连接联想相关记忆
   */
  associate(memoryId: string, depth: number = 2): AssociativeResult | null {
    if (!this.hebbian) return null;
    
    const result = this.hebbian.associate(memoryId, depth);
    this.stats.associativeRetrievals++;
    
    return result;
  }
  
  /**
   * 获取赫布连接权重（新增）
   */
  getConnectionWeight(fromId: string, toId: string): number {
    if (!this.hebbian) return 0;
    return this.hebbian.getConnectionWeight(fromId, toId);
  }
  
  /**
   * 获取最强连接（新增）
   */
  getStrongestConnections(topK: number = 10): MemoryConnection[] {
    if (!this.hebbian) return [];
    return this.hebbian.getStrongestConnections(topK);
  }
  
  /**
   * 批量赫布学习（新增）
   */
  batchHebbianLearn(
    memoryIds: string[],
    strengths?: number[]
  ): void {
    if (!this.hebbian) return;
    
    const activations = memoryIds.map((id, i) => ({
      memoryId: id,
      strength: strengths?.[i] ?? 1.0,
    }));
    
    this.hebbian.batchLearn(activations);
    this.stats.hebbianUpdates++;
  }
  
  /**
   * 获取赫布学习统计（新增）
   */
  getHebbianStats(): ReturnType<HebbianLearning['getStats']> | null {
    if (!this.hebbian) return null;
    return this.hebbian.getStats();
  }
  
  /**
   * 导出赫布连接（新增）
   */
  exportHebbianConnections(): MemoryConnection[] {
    if (!this.hebbian) return [];
    return this.hebbian.export();
  }
  
  /**
   * 导入赫布连接（新增）
   */
  importHebbianConnections(connections: MemoryConnection[]): void {
    if (!this.hebbian) return;
    this.hebbian.import(connections);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 工厂函数
// ─────────────────────────────────────────────────────────────────────

export function createSSMMemoryBridge(config?: Partial<SSMMemoryBridgeConfig>): SSMMemoryBridge {
  return new SSMMemoryBridge(config);
}

export default SSMMemoryBridge;
