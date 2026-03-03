/**
 * ═══════════════════════════════════════════════════════════════════════
 * 隐式状态存储 (Implicit State Storage)
 * 
 * 核心理念：
 * - 所有思考状态都用高维向量存储
 * - 不存储结构化文本/逻辑
 * - 支持向量相似度搜索
 * - 外部无法解析存储内容
 * 
 * 黑盒特质：
 * - 状态隐式化：用高维向量存储，不落地结构化日志
 * - 计算不可追溯：不存储历史路径，只存储最终向量
 * ═══════════════════════════════════════════════════════════════════════
 */

import type { ImplicitVector } from './implicit-mcts';

// ─────────────────────────────────────────────────────────────────────
// 类型定义
// ─────────────────────────────────────────────────────────────────────

/**
 * 隐式状态记录
 */
export interface ImplicitStateRecord {
  /** 唯一ID（随机生成，无语义） */
  id: string;
  
  /** 状态向量 */
  vector: ImplicitVector;
  
  /** 时间戳 */
  timestamp: number;
  
  /** 价值（用于排序和衰减） */
  value: number;
  
  /** 访问次数 */
  accessCount: number;
  
  /** 最后访问时间 */
  lastAccessed: number;
  
  /** 衰减因子 */
  decayFactor: number;
  
  /** 元数据（最小化，只保留必要的控制信息） */
  meta?: {
    type?: 'task' | 'result' | 'reflection' | 'plan';
    priority?: number;
  };
}

/**
 * 存储配置
 */
export interface ImplicitStorageConfig {
  /** 向量维度 */
  vectorDimension: number;
  
  /** 最大存储数量 */
  maxRecords: number;
  
  /** 衰减率 */
  decayRate: number;
  
  /** 最小保留价值 */
  minRetentionValue: number;
  
  /** 相似度阈值 */
  similarityThreshold: number;
}

const DEFAULT_STORAGE_CONFIG: ImplicitStorageConfig = {
  vectorDimension: 256,
  maxRecords: 10000,
  decayRate: 0.995,
  minRetentionValue: 0.1,
  similarityThreshold: 0.8,
};

// ─────────────────────────────────────────────────────────────────────
// 向量索引
// 
// 用于快速相似度搜索
// 使用简化的近似最近邻算法
// ─────────────────────────────────────────────────────────────────────

/**
 * 向量索引
 * 
 * 使用LSH（局部敏感哈希）加速相似度搜索
 */
class VectorIndex {
  private buckets: Map<string, ImplicitStateRecord[]>;
  private hashFunctions: ((v: ImplicitVector) => number)[][];
  private dimension: number;
  private numHashTables: number;
  private numHashFunctions: number;
  
  constructor(dimension: number, numHashTables = 5, numHashFunctions = 10) {
    this.dimension = dimension;
    this.numHashTables = numHashTables;
    this.numHashFunctions = numHashFunctions;
    this.buckets = new Map();
    
    // 初始化哈希函数（随机投影）
    this.hashFunctions = [];
    for (let t = 0; t < numHashTables; t++) {
      const table: ((v: ImplicitVector) => number)[] = [];
      for (let h = 0; h < numHashFunctions; h++) {
        // 每个哈希函数是一个随机投影
        const projection = new Float32Array(dimension);
        for (let i = 0; i < dimension; i++) {
          projection[i] = Math.random() * 2 - 1;
        }
        
        // 哈希函数：投影并取符号
        const hashFn = (v: ImplicitVector) => {
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
  
  /**
   * 计算向量的哈希键
   */
  private hashKey(vector: ImplicitVector, tableIndex: number): string {
    const bits = this.hashFunctions[tableIndex].map(fn => fn(vector));
    return bits.join('');
  }
  
  /**
   * 添加记录到索引
   */
  add(record: ImplicitStateRecord): void {
    for (let t = 0; t < this.numHashTables; t++) {
      const key = this.hashKey(record.vector, t);
      const fullKey = `${t}:${key}`;
      
      if (!this.buckets.has(fullKey)) {
        this.buckets.set(fullKey, []);
      }
      this.buckets.get(fullKey)!.push(record);
    }
  }
  
  /**
   * 移除记录
   */
  remove(id: string): void {
    for (const [key, records] of this.buckets) {
      const index = records.findIndex(r => r.id === id);
      if (index !== -1) {
        records.splice(index, 1);
        if (records.length === 0) {
          this.buckets.delete(key);
        }
      }
    }
  }
  
  /**
   * 查询相似向量
   */
  query(vector: ImplicitVector, topK: number): ImplicitStateRecord[] {
    const candidates = new Set<ImplicitStateRecord>();
    
    // 从每个哈希表中收集候选
    for (let t = 0; t < this.numHashTables; t++) {
      const key = this.hashKey(vector, t);
      const fullKey = `${t}:${key}`;
      
      const bucket = this.buckets.get(fullKey);
      if (bucket) {
        for (const record of bucket) {
          candidates.add(record);
        }
      }
    }
    
    // 计算精确相似度并排序
    const results = Array.from(candidates).map(record => ({
      record,
      similarity: this.cosineSimilarity(vector, record.vector),
    }));
    
    results.sort((a, b) => b.similarity - a.similarity);
    
    return results.slice(0, topK).map(r => r.record);
  }
  
  /**
   * 余弦相似度
   */
  private cosineSimilarity(a: ImplicitVector, b: ImplicitVector): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

// ─────────────────────────────────────────────────────────────────────
// 隐式状态存储
// ─────────────────────────────────────────────────────────────────────

/**
 * 隐式状态存储
 * 
 * 特性：
 * - 所有状态用向量存储
 * - 支持相似度搜索
 * - 自动衰减和清理
 * - 不暴露内部结构
 */
export class ImplicitStateStorage {
  private config: ImplicitStorageConfig;
  private records: Map<string, ImplicitStateRecord>;
  private index: VectorIndex;
  
  constructor(config?: Partial<ImplicitStorageConfig>) {
    this.config = { ...DEFAULT_STORAGE_CONFIG, ...config };
    this.records = new Map();
    this.index = new VectorIndex(this.config.vectorDimension);
  }
  
  /**
   * ══════════════════════════════════════════════════════════════════
   * 主接口：存储状态
   * 
   * 输入：隐式向量
   * 输出：记录ID（随机生成）
   * 
   * 注意：不存储任何结构化信息！
   * ══════════════════════════════════════════════════════════════════
   */
  store(vector: ImplicitVector, meta?: ImplicitStateRecord['meta']): string {
    // 创建记录
    const id = this.generateId();
    const record: ImplicitStateRecord = {
      id,
      vector: new Float32Array(vector), // 复制向量
      timestamp: Date.now(),
      value: 1.0,
      accessCount: 0,
      lastAccessed: Date.now(),
      decayFactor: 1.0,
      meta,
    };
    
    // 存储
    this.records.set(id, record);
    this.index.add(record);
    
    // 检查容量并清理
    this.maybeCleanup();
    
    return id;
  }
  
  /**
   * 查询相似状态
   * 
   * 输入：查询向量
   * 输出：相似状态列表（不暴露内部路径）
   */
  querySimilar(vector: ImplicitVector, topK: number = 10): ImplicitStateRecord[] {
    // 应用衰减
    this.applyDecay();
    
    // 使用索引搜索
    const results = this.index.query(vector, topK * 2);
    
    // 过滤低价值记录
    const filtered = results.filter(r => r.value >= this.config.minRetentionValue);
    
    // 更新访问计数
    for (const record of filtered) {
      record.accessCount++;
      record.lastAccessed = Date.now();
    }
    
    return filtered.slice(0, topK);
  }
  
  /**
   * 获取单个记录
   */
  get(id: string): ImplicitStateRecord | undefined {
    const record = this.records.get(id);
    if (record) {
      record.accessCount++;
      record.lastAccessed = Date.now();
    }
    return record;
  }
  
  /**
   * 更新记录价值
   * 
   * 用于强化学习反馈
   */
  updateValue(id: string, deltaValue: number): void {
    const record = this.records.get(id);
    if (record) {
      record.value = Math.max(0, Math.min(1, record.value + deltaValue));
    }
  }
  
  /**
   * 合并向量
   * 
   * 将多个向量合并为一个（用于状态压缩）
   */
  mergeVectors(ids: string[], weights?: number[]): ImplicitVector | null {
    if (ids.length === 0) return null;
    
    const merged = new Float32Array(this.config.vectorDimension);
    const w = weights || ids.map(() => 1 / ids.length);
    
    for (let i = 0; i < ids.length; i++) {
      const record = this.records.get(ids[i]);
      if (record) {
        for (let j = 0; j < this.config.vectorDimension; j++) {
          merged[j] += record.vector[j] * w[i];
        }
      }
    }
    
    // 归一化
    const norm = Math.sqrt(Array.from(merged).reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < merged.length; i++) {
        merged[i] /= norm;
      }
    }
    
    return merged;
  }
  
  /**
   * 获取统计信息
   * 
   * 不暴露具体内容，只返回统计
   */
  getStats(): {
    totalRecords: number;
    avgValue: number;
    avgAccessCount: number;
    oldestTimestamp: number;
    newestTimestamp: number;
  } {
    const records = Array.from(this.records.values());
    
    if (records.length === 0) {
      return {
        totalRecords: 0,
        avgValue: 0,
        avgAccessCount: 0,
        oldestTimestamp: 0,
        newestTimestamp: 0,
      };
    }
    
    const sumValue = records.reduce((sum, r) => sum + r.value, 0);
    const sumAccess = records.reduce((sum, r) => sum + r.accessCount, 0);
    const timestamps = records.map(r => r.timestamp);
    
    return {
      totalRecords: records.length,
      avgValue: sumValue / records.length,
      avgAccessCount: sumAccess / records.length,
      oldestTimestamp: Math.min(...timestamps),
      newestTimestamp: Math.max(...timestamps),
    };
  }
  
  /**
   * 导出为二进制（用于持久化）
   * 
   * 格式：紧凑的二进制，外部无法解析
   */
  exportBinary(): ArrayBuffer {
    // 计算总大小
    const headerSize = 16; // version(4) + dimension(4) + count(4) + reserved(4)
    const recordSize = 4 + // id (4 bytes, 实际应该更长)
      this.config.vectorDimension * 4 + // vector
      8 + // timestamp
      4 + // value
      4 + // accessCount
      8 + // lastAccessed
      4; // decayFactor
    
    const totalSize = headerSize + this.records.size * recordSize;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    
    let offset = 0;
    
    // 写入头
    view.setUint32(offset, 1, true); offset += 4; // version
    view.setUint32(offset, this.config.vectorDimension, true); offset += 4;
    view.setUint32(offset, this.records.size, true); offset += 4;
    view.setUint32(offset, 0, true); offset += 4; // reserved
    
    // 写入记录
    for (const record of this.records.values()) {
      // 简化的ID（实际应该完整存储）
      view.setUint32(offset, parseInt(record.id.slice(0, 8), 16) || 0, true);
      offset += 4;
      
      // 向量
      for (let i = 0; i < this.config.vectorDimension; i++) {
        view.setFloat32(offset, record.vector[i], true);
        offset += 4;
      }
      
      // 其他字段
      view.setFloat64(offset, record.timestamp, true); offset += 8;
      view.setFloat32(offset, record.value, true); offset += 4;
      view.setUint32(offset, record.accessCount, true); offset += 4;
      view.setFloat64(offset, record.lastAccessed, true); offset += 8;
      view.setFloat32(offset, record.decayFactor, true); offset += 4;
    }
    
    return buffer;
  }
  
  /**
   * 从二进制导入
   */
  importBinary(buffer: ArrayBuffer): void {
    const view = new DataView(buffer);
    let offset = 0;
    
    // 读取头
    const version = view.getUint32(offset, true); offset += 4;
    const dimension = view.getUint32(offset, true); offset += 4;
    const count = view.getUint32(offset, true); offset += 4;
    offset += 4; // reserved
    
    if (dimension !== this.config.vectorDimension) {
      throw new Error(`Dimension mismatch: expected ${this.config.vectorDimension}, got ${dimension}`);
    }
    
    // 清理现有数据
    this.records.clear();
    
    // 读取记录
    for (let i = 0; i < count; i++) {
      const idNum = view.getUint32(offset, true); offset += 4;
      const id = idNum.toString(16).padStart(8, '0');
      
      const vector = new Float32Array(dimension);
      for (let j = 0; j < dimension; j++) {
        vector[j] = view.getFloat32(offset, true);
        offset += 4;
      }
      
      const timestamp = view.getFloat64(offset, true); offset += 8;
      const value = view.getFloat32(offset, true); offset += 4;
      const accessCount = view.getUint32(offset, true); offset += 4;
      const lastAccessed = view.getFloat64(offset, true); offset += 8;
      const decayFactor = view.getFloat32(offset, true); offset += 4;
      
      const record: ImplicitStateRecord = {
        id,
        vector,
        timestamp,
        value,
        accessCount,
        lastAccessed,
        decayFactor,
      };
      
      this.records.set(id, record);
      this.index.add(record);
    }
  }
  
  // ══════════════════════════════════════════════════════════════════
  // 内部方法
  // ══════════════════════════════════════════════════════════════════
  
  /**
   * 生成随机ID
   */
  private generateId(): string {
    return Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
  
  /**
   * 应用衰减
   */
  private applyDecay(): void {
    const now = Date.now();
    
    for (const record of this.records.values()) {
      // 时间衰减
      const age = now - record.timestamp;
      const ageFactor = Math.exp(-age / (1000 * 60 * 60 * 24)); // 每天衰减
      
      // 访问衰减
      const accessFactor = 1 / (1 + Math.log(record.accessCount + 1));
      
      // 综合衰减
      record.decayFactor = ageFactor * accessFactor;
      record.value *= record.decayFactor;
    }
  }
  
  /**
   * 检查并清理
   */
  private maybeCleanup(): void {
    if (this.records.size <= this.config.maxRecords) return;
    
    // 先应用衰减
    this.applyDecay();
    
    // 按价值排序
    const sorted = Array.from(this.records.values())
      .sort((a, b) => b.value - a.value);
    
    // 保留高价值的
    const keepCount = Math.floor(this.config.maxRecords * 0.9);
    const keepIds = new Set(sorted.slice(0, keepCount).map(r => r.id));
    
    // 删除其他的
    for (const [id, record] of this.records) {
      if (!keepIds.has(id)) {
        this.records.delete(id);
        this.index.remove(id);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

export function createImplicitStateStorage(
  config?: Partial<ImplicitStorageConfig>
): ImplicitStateStorage {
  return new ImplicitStateStorage(config);
}
