/**
 * ═══════════════════════════════════════════════════════════════════════
 * 信息编码器 - 将原始信息转换为不同结构
 * 
 * 信息结构 = 经不同算法编码的不同表示
 * 
 * 每种编码算法产生一种特定的信息结构
 * 不同的结构被不同的感受器接收
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────
// 信息结构基类
// ─────────────────────────────────────────────────────────────────────

/**
 * 信息结构基类
 * 
 * 所有编码后的信息都继承此类
 */
export abstract class InformationStructure {
  /** 唯一标识 */
  abstract readonly id: string;
  
  /** 结构类型 */
  abstract readonly type: string;
  
  /** 原始信息 */
  abstract readonly source: string;
  
  /** 时间戳 */
  abstract readonly timestamp: number;
  
  /** 强度/重要性 */
  abstract intensity: number;
  
  /** 转换为可传输格式 */
  abstract serialize(): string;
}

// ─────────────────────────────────────────────────────────────────────
// 具体信息结构
// ─────────────────────────────────────────────────────────────────────

/**
 * 稀疏向量结构（如 TF-IDF）
 * 
 * 大部分位置是 0，少数位置有值
 * 适合：关键词检索、匹配
 */
export class SparseVectorStructure extends InformationStructure {
  readonly type = 'sparse-vector';
  
  constructor(
    readonly id: string,
    readonly source: string,
    readonly indices: number[],      // 非零位置
    readonly values: number[],       // 对应值
    readonly dimension: number,      // 总维度
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    return Math.sqrt(this.values.reduce((sum, v) => sum + v * v, 0));
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      indices: this.indices,
      values: this.values,
      dimension: this.dimension
    });
  }
  
  /** 计算与另一个稀疏向量的余弦相似度 */
  cosineSimilarity(other: SparseVectorStructure): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    const aMap = new Map(this.indices.map((idx, i) => [idx, this.values[i]]));
    const bMap = new Map(other.indices.map((idx, i) => [idx, other.values[i]]));
    
    // 计算点积
    for (const [idx, val] of aMap) {
      if (bMap.has(idx)) {
        dotProduct += val * bMap.get(idx)!;
      }
      normA += val * val;
    }
    
    for (const val of other.values) {
      normB += val * val;
    }
    
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
  }
}

/**
 * 稠密向量结构（如 Embedding）
 * 
 * 每个位置都有值
 * 适合：语义计算、相似度
 */
export class DenseVectorStructure extends InformationStructure {
  readonly type = 'dense-vector';
  
  constructor(
    readonly id: string,
    readonly source: string,
    readonly vector: number[],
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    return Math.sqrt(this.vector.reduce((sum, v) => sum + v * v, 0));
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      vector: this.vector
    });
  }
  
  /** 计算与另一个稠密向量的余弦相似度 */
  cosineSimilarity(other: DenseVectorStructure): number {
    if (this.vector.length !== other.vector.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < this.vector.length; i++) {
      dotProduct += this.vector[i] * other.vector[i];
      normA += this.vector[i] * this.vector[i];
      normB += other.vector[i] * other.vector[i];
    }
    
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
  }
  
  /** 向量加法 */
  add(other: DenseVectorStructure): DenseVectorStructure {
    const result = this.vector.map((v, i) => v + other.vector[i]);
    return new DenseVectorStructure(
      `${this.id}+${other.id}`,
      `${this.source} + ${other.source}`,
      result
    );
  }
  
  /** 标量乘法 */
  scale(scalar: number): DenseVectorStructure {
    const result = this.vector.map(v => v * scalar);
    return new DenseVectorStructure(
      `${this.id}*${scalar}`,
      this.source,
      result
    );
  }
}

/**
 * 注意力权重结构
 * 
 * 表示当前信息对其他信息的关注程度
 * 适合：关联、融合
 */
export class AttentionStructure extends InformationStructure {
  readonly type = 'attention';
  
  constructor(
    readonly id: string,
    readonly source: string,
    readonly queryId: string,         // 查询来源
    readonly keyIds: string[],        // 键来源列表
    readonly weights: number[],       // 注意力权重（和为1）
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    return Math.max(...this.weights);
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      queryId: this.queryId,
      keyIds: this.keyIds,
      weights: this.weights
    });
  }
  
  /** 获取最受关注的信息 ID */
  getTopAttended(): { id: string; weight: number } {
    const maxIdx = this.weights.indexOf(Math.max(...this.weights));
    return {
      id: this.keyIds[maxIdx],
      weight: this.weights[maxIdx]
    };
  }
  
  /** 加权融合其他信息 */
  weightedSum<T>(values: Map<string, T>, combiner: (a: T, b: T, weight: number) => T): T | null {
    let result: T | null = null;
    
    for (let i = 0; i < this.keyIds.length; i++) {
      const value = values.get(this.keyIds[i]);
      if (value) {
        if (result === null) {
          result = value;
        } else {
          result = combiner(result, value, this.weights[i]);
        }
      }
    }
    
    return result;
  }
}

/**
 * 键值对结构
 * 
 * 简单的属性-值映射
 * 适合：结构化信息、元数据
 */
export class KeyValueStructure extends InformationStructure {
  readonly type = 'key-value';
  
  constructor(
    readonly id: string,
    readonly source: string,
    readonly data: Map<string, unknown>,
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    return this.data.size / 100; // 简单计算
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      data: Object.fromEntries(this.data)
    });
  }
  
  get(key: string): unknown {
    return this.data.get(key);
  }
  
  set(key: string, value: unknown): KeyValueStructure {
    const newData = new Map(this.data);
    newData.set(key, value);
    return new KeyValueStructure(this.id, this.source, newData, this.timestamp);
  }
}

/**
 * 序列结构
 * 
 * 有序的信息列表
 * 适合：时间序列、文本序列
 */
export class SequenceStructure extends InformationStructure {
  readonly type = 'sequence';
  
  constructor(
    readonly id: string,
    readonly source: string,
    readonly elements: InformationStructure[],
    readonly order: number[],        // 元素的顺序索引
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    if (this.elements.length === 0) return 0;
    return this.elements.reduce((sum, e) => sum + e.intensity, 0) / this.elements.length;
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      elements: this.elements.map(e => e.serialize()),
      order: this.order
    });
  }
  
  /** 获取第 N 个元素 */
  getAt(index: number): InformationStructure | undefined {
    return this.elements[index];
  }
  
  /** 追加元素 */
  append(element: InformationStructure): SequenceStructure {
    return new SequenceStructure(
      this.id,
      this.source,
      [...this.elements, element],
      [...this.order, Math.max(...this.order) + 1]
    );
  }
}

/**
 * 图结构
 * 
 * 节点和边的网络
 * 适合：知识图谱、关联网络
 */
export class GraphStructure extends InformationStructure {
  readonly type = 'graph';
  
  constructor(
    readonly id: string,
    readonly source: string,
    readonly nodes: Map<string, { label: string; data?: unknown }>,
    readonly edges: Array<{ from: string; to: string; weight: number; label?: string }>,
    readonly timestamp: number = Date.now()
  ) {
    super();
  }
  
  get intensity(): number {
    return Math.sqrt(this.nodes.size + this.edges.length);
  }
  
  serialize(): string {
    return JSON.stringify({
      type: this.type,
      nodes: Object.fromEntries(this.nodes),
      edges: this.edges
    });
  }
  
  /** 获取节点的邻居 */
  getNeighbors(nodeId: string): string[] {
    return this.edges
      .filter(e => e.from === nodeId)
      .map(e => e.to);
  }
  
  /** 添加边 */
  addEdge(from: string, to: string, weight: number, label?: string): GraphStructure {
    return new GraphStructure(
      this.id,
      this.source,
      this.nodes,
      [...this.edges, { from, to, weight, label }]
    );
  }
}

// ─────────────────────────────────────────────────────────────────────
// 导出
// ─────────────────────────────────────────────────────────────────────

// 类定义已经自动导出
// InformationStructure 是抽象基类
// SparseVectorStructure, DenseVectorStructure 等是具体实现
